/**
 * 示例 11：代理（Agent）交互的全面错误处理模式
 *
 * 本示例通过 `node-llama-cpp` 使用本地大语言模型（LLM），演示：
 * - 用于 LLM 调用、工具执行和代理工作流的标准化错误类型
 * - 恢复策略（重试/退避/抖动（Backoff/Jitter）、超时、降级（Fallback）、优雅降级（Graceful Degradation））
 * - 带有关联 ID（Correlation ID）的用户友好错误消息
 *
 * 运行：
 *   node examples/11_error-handling/error-handling.js
 */

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	defineChatSessionFunction,
	getLlama,
	LlamaChatSession,
} from "node-llama-cpp";

// -----------------------------------------------------------------------------
// 错误分类体系（标准化错误类型）
// -----------------------------------------------------------------------------

class AppError extends Error {
	/**
	 * @param {string} code 稳定的机器可读错误代码
	 * @param {string} message 面向开发者的错误消息
	 * @param {{ userMessage?: string, retryable?: boolean, details?: any, cause?: any }=} opts
	 */
	constructor(code, message, opts = {}) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.userMessage = opts.userMessage ?? "出了点问题，请重试。";
		this.retryable = Boolean(opts.retryable);
		this.details = opts.details;
		this.cause = opts.cause;
	}
}

class ValidationError extends AppError {
	constructor(message, opts = {}) {
		super("VALIDATION_ERROR", message, {
			userMessage:
				opts.userMessage ?? "无法理解您的请求，请换一种方式表达后再试。",
			retryable: false,
			details: opts.details,
			cause: opts.cause,
		});
	}
}

class LLMCallError extends AppError {
	constructor(message, opts = {}) {
		super("LLM_CALL_FAILED", message, {
			userMessage: opts.userMessage ?? "当前生成回复时遇到问题，请稍后再试。",
			retryable: opts.retryable ?? true,
			details: opts.details,
			cause: opts.cause,
		});
		this.model = opts.model;
	}
}

class ToolExecutionError extends AppError {
	constructor(toolName, message, opts = {}) {
		super("TOOL_EXECUTION_FAILED", message, {
			userMessage:
				opts.userMessage ??
				`无法成功运行工具 "${toolName}"。您可以重试，或选择其他方式。`,
			retryable: opts.retryable ?? false,
			details: { toolName, ...opts.details },
			cause: opts.cause,
		});
		this.toolName = toolName;
	}
}

/**
 * 编排级别（Orchestration-level）的失败（多步骤代理运行）。出于教学目的，考虑以下不同原因，
 * 尽管在生产级演示中此单一类型包含所有情况：
 * - 策略/守卫（Policy/Guard）：验证后被阻止或无效的工作流路径（类似专用的 PolicyError）。
 * - 工作流（Workflow）：多步骤工具链耗尽重试和降级（类似 WorkflowError）。
 * - 系统（System）：LLM 及所有恢复工具均失败（类似 SystemFailureError）。
 */
class AgentWorkflowError extends AppError {
	constructor(step, message, opts = {}) {
		super("AGENT_WORKFLOW_FAILED", message, {
			userMessage:
				opts.userMessage ??
				"完成您的请求时遇到了问题，请重试，或提供更多细节。",
			retryable: opts.retryable ?? false,
			details: { step, ...opts.details },
			cause: opts.cause,
		});
		this.step = step;
	}
}

// -----------------------------------------------------------------------------
// 恢复工具函数（超时、重试、分类）
// -----------------------------------------------------------------------------

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label = "operation") {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), ms);

	return Promise.race([
		promise,
		new Promise((_, reject) => {
			controller.signal.addEventListener("abort", () => {
				reject(
					new AppError("TIMEOUT", `${label} 超时，已超过 ${ms}ms`, {
						userMessage: "操作耗时过长，请重试。",
						retryable: true,
						details: { label, ms },
					}),
				);
			});
		}),
	]).finally(() => clearTimeout(timeout));
}

function normalizeUnknownError(err) {
	if (err instanceof AppError) return err;

	return new AppError("UNKNOWN_ERROR", "未知错误", {
		userMessage: "出了点问题，请重试。",
		retryable: false,
		details: { originalName: err?.name, originalMessage: err?.message },
		cause: err,
	});
}

function classifyError(err) {
	const error = normalizeUnknownError(err);
	return {
		error,
		retryable: error instanceof AppError && error.retryable,
		type: error.code,
	};
}

function isRetryable(err) {
	return classifyError(err).retryable;
}

function jitteredBackoffDelay(
	attempt,
	{ baseDelayMs = 200, maxDelayMs = 3000 } = {},
) {
	const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
	const jitter = crypto.randomInt(0, Math.max(1, Math.floor(exp * 0.25)));
	return exp + jitter;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{
 *   retries?: number,
 *   baseDelayMs?: number,
 *   maxDelayMs?: number,
 *   label?: string,
 *   retryOn?: (err: any) => boolean
 * }} opts
 */
async function withRetries(fn, opts = {}) {
	const {
		retries = 2,
		baseDelayMs = 200,
		maxDelayMs = 3000,
		label = "operation",
		retryOn = isRetryable,
	} = opts;

	const maxAttempts = retries + 1;
	let lastErr;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			if (attempt === maxAttempts || !retryOn(err)) break;

			const delay = jitteredBackoffDelay(attempt, { baseDelayMs, maxDelayMs });
			console.warn(
				`[重试] ${label} 失败（第 ${attempt}/${maxAttempts} 次尝试）。${delay}ms 后重试。`,
			);
			await sleep(delay);
		}
	}

	throw lastErr;
}

function formatUserFacingError(err, correlationId) {
	if (err instanceof AppError) {
		return `${err.userMessage}\n\n（参考编号：${correlationId}）`;
	}

	return `出了点问题，请重试。\n\n（参考编号：${correlationId}）`;
}

/**
 * 用于工作流编排失败的结构化控制台输出（调试演示时便于扫描）。
 * @param {AgentWorkflowError} err
 * @param {string} correlationId
 */
function printAgentWorkflowErrorBanner(err, correlationId) {
	const divider = "═".repeat(72);
	const rule = "─".repeat(72);
	const cause =
		err.cause instanceof Error
			? `${err.cause.name}: ${err.cause.message}`
			: err.cause != null
				? String(err.cause)
				: "（无）";

	console.error(`\n${divider}`);
	console.error(" 代理工作流失败");
	console.error(divider);
	console.error(` 步骤：          ${err.step}`);
	console.error(` 错误代码：      ${err.code}`);
	console.error(` 关联 ID：       ${correlationId}`);
	console.error(` 用户消息：      ${err.userMessage}`);
	console.error(rule);
	console.error(` 开发者消息：    ${err.message}`);
	if (err.details && Object.keys(err.details).length > 0) {
		console.error(" 详细信息：", err.details);
	}
	console.error(` 原因：          ${cause}`);
	console.error(`${divider}\n`);
}

// -----------------------------------------------------------------------------
// 工具函数（模拟真实的工具故障 + 降级）
// -----------------------------------------------------------------------------

/** 集中式确定性演示规则（便于学习者和测试理解的触发条件）。 */
const SIMULATION = {
	forceNotFound: new Set(["u_999"]),
	/** 主服务可重试地失败；配合降级服务失败以触发 AgentWorkflowError。 */
	forcePrimaryAndFallbackFail: new Set(["u_777"]),
};

async function fetchUserFromPrimary({ userId }) {
	const r = Math.random();
	const id = String(userId);
	await sleep(80);

	if (SIMULATION.forceNotFound.has(id)) {
		throw new ToolExecutionError("fetchUserFromPrimary", "用户未找到", {
			retryable: false,
			userMessage: `找不到 ID 为 "${userId}" 的用户。请检查 ID 后重试。`,
			details: { userId },
		});
	}

	// 确定性演示：主服务总是暂时性失败，以便降级模式可以执行降级流程 + AgentWorkflowError
	if (SIMULATION.forcePrimaryAndFallbackFail.has(id)) {
		throw new ToolExecutionError("fetchUserFromPrimary", "主服务暂时过载", {
			retryable: true,
			userMessage: "当前无法访问用户服务，正在重试。",
			details: { userId, demo: true },
		});
	}

	if (r < 0.2) {
		throw new ToolExecutionError(
			"fetchUserFromPrimary",
			"获取用户资料时网络错误",
			{
				retryable: true,
				userMessage: "当前无法访问用户服务，正在重试。",
				details: { userId },
			},
		);
	}

	return {
		userId,
		name: "Alex Developer",
		role: "Software Engineer",
		lastLoginIso: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
		source: "primary",
	};
}

async function fetchUserFromFallback({ userId }) {
	// 降级工具：更可靠但信息精度较低
	const id = String(userId);
	await sleep(60);
	// 配合 forcePrimaryAndFallbackFail：当两条路径都失败时证明 AgentWorkflowError
	if (SIMULATION.forcePrimaryAndFallbackFail.has(id)) {
		throw new ToolExecutionError("fetchUserFromFallback", "降级服务不可用", {
			retryable: false,
			userMessage: "备用资料服务已关闭，请稍后重试。",
			details: { userId, demo: true },
		});
	}
	return {
		userId,
		name: "Alex Developer",
		role: "Engineer",
		lastLoginIso: null,
		source: "fallback",
	};
}

// -----------------------------------------------------------------------------
// LLM + 代理工作流（LLM -> 工具 -> 响应），含优雅处理
// -----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const debug = false;
const llama = await getLlama({ debug });
const model = await llama.loadModel({
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 2000 });

const systemPrompt = `你是一个有用的软件工程助手。

你可以调用工具来获取用户资料数据。
如果主工具失败，请尝试降级工具。
回答用户时：
- 保持简洁
- 包含你使用的用户 ID
- 如果数据来自降级服务，请明确说明
`;

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

const fetchUserPrimaryFn = defineChatSessionFunction({
	description: "从主用户服务获取用户资料",
	params: {
		type: "object",
		properties: {
			userId: { type: "string", description: "用户 ID，例如 u_123" },
		},
		required: ["userId"],
	},
	async handler(params) {
		return await fetchUserFromPrimary(params);
	},
});

const fetchUserFallbackFn = defineChatSessionFunction({
	description: "从降级用户服务获取用户资料（信息较少但更可靠）",
	params: {
		type: "object",
		properties: {
			userId: { type: "string", description: "用户 ID，例如 u_123" },
		},
		required: ["userId"],
	},
	async handler(params) {
		return await fetchUserFromFallback(params);
	},
});

const functions = {
	fetchUserFromPrimary: fetchUserPrimaryFn,
	fetchUserFromFallback: fetchUserFallbackFn,
};

async function promptLLM(prompt, { timeoutMs, retries, correlationId }) {
	return await withRetries(
		async () => {
			try {
				const text = await withTimeout(
					session.prompt(prompt, { functions, maxTokens: 400 }),
					timeoutMs,
					"LLM 提示",
				);
				const trimmed = String(text ?? "").trim();
				if (trimmed.length === 0) {
					throw new LLMCallError("LLM 返回空输出", {
						model: "Qwen3-1.7B-Q8_0.gguf",
						retryable: true,
						userMessage: "模型未返回有效回复，正在重试。",
						details: { correlationId },
					});
				}
				return trimmed;
			} catch (err) {
				const { error: normalized } = classifyError(err);

				// 如果工具抛出异常，node-llama-cpp 通常会在此处将其作为异常抛出。
				// 我们重新分类以便重试/降级策略可以对其进行处理。
				if (normalized instanceof ToolExecutionError) throw normalized;
				if (normalized instanceof LLMCallError) throw normalized;

				throw new LLMCallError("LLM 提示失败", {
					model: "Qwen3-1.7B-Q8_0.gguf",
					retryable: normalized.code === "TIMEOUT",
					userMessage: "当前生成回复时遇到问题，请重试。",
					details: { correlationId, originalCode: normalized.code },
					cause: err,
				});
			}
		},
		{
			retries,
			label: "LLM 提示",
			retryOn: (err) => classifyError(err).retryable,
		},
	);
}

/**
 * 降级路径：无 LLM —— 解析用户 ID 并使用与正常代理相同的重试 -> 降级模型获取资料，
 * 但以确定性方式编排（错误处理器委托到此处，而不是内联代理工作）。
 */
async function runDegradedProfileResolution(
	userInput,
	{ correlationId, forcedDegradedMatch },
) {
	const match = forcedDegradedMatch ?? userInput.match(/\b(u_\d+)\b/i);
	if (!match) {
		throw new ValidationError("请求中未找到用户 ID", {
			userMessage: '请提供用户 ID（如 "u_123"），以便我获取资料。',
			details: { correlationId },
		});
	}

	const userId = match[1];

	let profile;
	try {
		profile = await withRetries(
			() =>
				withTimeout(
					fetchUserFromPrimary({ userId }),
					1200,
					"工具:fetchUserFromPrimary",
				),
			{
				retries: 1,
				label: "工具:fetchUserFromPrimary",
				retryOn: (e) => {
					const { error, retryable } = classifyError(e);
					return error instanceof ToolExecutionError && retryable;
				},
			},
		);
	} catch (toolErr) {
		const { error: toolNormalized } = classifyError(toolErr);
		if (
			toolNormalized instanceof ToolExecutionError &&
			toolNormalized.retryable
		) {
			try {
				profile = await withTimeout(
					fetchUserFromFallback({ userId }),
					1200,
					"工具:fetchUserFromFallback",
				);
			} catch (fallbackErr) {
				// 概念上的 "WorkflowError"：主服务 + 降级链耗尽（对比阻塞输入上的 policy_guard）。
				throw new AgentWorkflowError(
					"resolve_user_profile",
					"主用户服务出现问题，降级资料获取也失败。",
					{
						userMessage:
							"无法加载用户资料：主服务失败，备用路径也无法工作。请稍后重试。",
						retryable: true,
						details: { correlationId, userId, phase: "degraded_fallback" },
						cause: fallbackErr,
					},
				);
			}
		} else {
			throw toolNormalized;
		}
	}

	const bullets = [
		`- 姓名：${profile.name}（${profile.role}）`,
		`- 最后登录：${profile.lastLoginIso ?? "未知"}（来源：${profile.source}）`,
	];

	return `模型不可用；通过确定性降级方式回答。\n${bullets.join("\n")}`;
}

async function runAgent(userInput) {
	const correlationId = crypto.randomUUID();

	try {
		// 步骤 1：尽早验证输入（快速失败并提供有用消息）
		if (typeof userInput !== "string" || userInput.trim().length === 0) {
			throw new ValidationError("空的用户输入", {
				userMessage: '请提供请求（例如："获取用户 u_123 的资料并总结。"）。',
			});
		}

		// 脚本化演示：编排层检测到不可能的路径（概念上的 PolicyError / 守卫）。
		if (/\bu_demo_workflow\b/i.test(userInput)) {
			throw new AgentWorkflowError(
				"policy_guard",
				"演示：工作流无法继续（模拟验证后被阻止的分支）。",
				{
					userMessage:
						"由于内部工作流约束，当前无法完成该请求。请尝试普通用户 ID，如 u_123。",
					retryable: false,
					details: { reason: "demo_blocked_branch", correlationId },
				},
			);
		}

		// 可选：跳过 LLM 以获得可复现的降级模式演示（无模型不稳定因素）。
		const forcedDegradedMatch = userInput.match(
			/SKIP_LLM_DEGRADED\s+\b(u_\d+)\b/i,
		);

		// 步骤 2：LLM 驱动的工具使用，含重试 + 超时
		// 这是一个真实的"开发助手"风格请求：获取资料并生成回答。
		try {
			if (forcedDegradedMatch) {
				throw new LLMCallError("为确定性降级演示跳过 LLM", {
					model: "Qwen3-1.7B-Q8_0.gguf",
					retryable: false,
					userMessage: "（演示）假装模型不可用以测试工具降级。",
					details: { correlationId, demo: "SKIP_LLM_DEGRADED" },
				});
			}

			const finalAnswer = await promptLLM(userInput, {
				timeoutMs: 15_000,
				retries: 1,
				correlationId,
			});
			return { ok: true, correlationId, output: finalAnswer };
		} catch (err) {
			const { error: normalized } = classifyError(err);
			if (!(normalized instanceof LLMCallError)) throw normalized;

			console.warn("[降级模式] LLM 不可用；切换到确定性降级方式。", {
				correlationId,
				code: normalized.code,
				message: normalized.message,
			});

			const output = await runDegradedProfileResolution(userInput, {
				correlationId,
				forcedDegradedMatch,
			});
			return { ok: true, correlationId, output };
		}
	} catch (err) {
		const { error: normalized } = classifyError(err);

		if (normalized instanceof AgentWorkflowError) {
			printAgentWorkflowErrorBanner(normalized, correlationId);
		}

		// 在实际应用中：将 normalized + 堆栈 + 原因链记录到可观测性系统
		console.error("[代理错误]", {
			correlationId,
			code: normalized.code,
			name: normalized.name,
			message: normalized.message,
			details: normalized.details,
		});

		return {
			ok: false,
			correlationId,
			output: formatUserFacingError(normalized, correlationId),
		};
	}
}

// -----------------------------------------------------------------------------
// 演示
// -----------------------------------------------------------------------------

const inputs = [
	"获取用户 u_123 的资料并用 2 个要点总结。",
	"获取用户 u_999 的资料并告诉我他们最后一次登录时间。",
	// 演示：AgentWorkflowError —— 故意在验证后触发编排/策略失败
	"请获取用户 u_demo_workflow 的资料。",
	// 演示：AgentWorkflowError —— 降级路径：主服务(u_777)可重试地失败，降级服务(u_777)失败 -> 工作流错误
	"SKIP_LLM_DEGRADED u_777",
	"",
];

for (const input of inputs) {
	console.log(`\n${"-".repeat(80)}`);
	console.log("用户：", JSON.stringify(input));
	const result = await runAgent(input);
	console.log(
		result.ok
			? `\n助手：\n${result.output}`
			: `\n助手（错误）：\n${result.output}`,
	);
}

// 清理资源（使用本地模型时很重要）
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
