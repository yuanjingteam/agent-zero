import fs from "node:fs/promises";
import path from "node:path";
import { LlamaText } from "node-llama-cpp";

/**
 * 调试用输出类型
 */
const OutputTypes = {
	EXACT_PROMPT: "exactPrompt",
	CONTEXT_STATE: "contextState",
	STRUCTURED: "structured",
};

/**
 * 用于调试和记录 LLM（大语言模型）提示词的辅助类
 */
export class PromptDebugger {
	constructor(options = {}) {
		this.outputDir = options.outputDir || "./";
		this.filename = options.filename;
		this.includeTimestamp = options.includeTimestamp ?? false;
		this.appendMode = options.appendMode ?? false;
		// 配置要包含哪些输出类型
		this.outputTypes = options.outputTypes || [OutputTypes.EXACT_PROMPT];
		// 确保 outputTypes 始终是数组
		if (!Array.isArray(this.outputTypes)) {
			this.outputTypes = [this.outputTypes];
		}
	}

	/**
	 * 仅捕获精确的提示词（用户输入 + 系统提示 + 函数）
	 * @param {Object} params
	 * @param {Object} params.session - 聊天会话
	 * @param {string} params.prompt - 用户提示词
	 * @param {string} params.systemPrompt - 系统提示词（可选）
	 * @param {Object} params.functions - 可用函数（可选）
	 * @returns {Object} 精确提示词数据
	 */
	captureExactPrompt(params) {
		const { session, prompt, systemPrompt, functions } = params;

		const chatWrapper = session.chatWrapper;

		// 构建用于精确提示词的最小历史记录
		const history = [{ type: "user", text: prompt }];

		if (systemPrompt) {
			history.unshift({ type: "system", text: systemPrompt });
		}

		// 使用当前提示词生成上下文状态
		const state = chatWrapper.generateContextState({
			chatHistory: history,
			availableFunctions: functions,
			systemPrompt: systemPrompt,
		});

		const formattedPrompt = state.contextText.toString();

		return {
			exactPrompt: formattedPrompt,
			timestamp: new Date().toISOString(),
			prompt,
			systemPrompt,
			functions: functions ? Object.keys(functions) : [],
		};
	}

	/**
	 * 捕获完整的上下文状态（包含助手回复）
	 * @param {Object} params
	 * @param {Object} params.session - 聊天会话
	 * @param {Object} params.model - 已加载的模型
	 * @returns {Object} 上下文状态数据
	 */
	captureContextState(params) {
		const { session, model } = params;

		// 从会话中获取回复后的实际上下文
		const contextState = model.detokenize(session.sequence.contextTokens, true);

		return {
			contextState,
			timestamp: new Date().toISOString(),
			tokenCount: session.sequence.contextTokens.length,
		};
	}

	/**
	 * 捕获结构化的 token 表示
	 * @param {Object} params
	 * @param {Object} params.session - 聊天会话
	 * @param {Object} params.model - 已加载的模型
	 * @returns {Object} 结构化 token 数据
	 */
	captureStructured(params) {
		const { session, model } = params;

		const structured = LlamaText.fromTokens(
			model.tokenizer,
			session.sequence.contextTokens,
		);

		return {
			structured,
			timestamp: new Date().toISOString(),
			tokenCount: session.sequence.contextTokens.length,
		};
	}

	/**
	 * 捕获所有已配置的输出类型
	 * @param {Object} params - 包含所有可能参数的对象
	 * @returns {Object} 基于配置的合并捕获数据
	 */
	captureAll(params) {
		const result = {
			timestamp: new Date().toISOString(),
		};

		if (this.outputTypes.includes(OutputTypes.EXACT_PROMPT)) {
			const exactData = this.captureExactPrompt(params);
			result.exactPrompt = exactData.exactPrompt;
			result.prompt = exactData.prompt;
			result.systemPrompt = exactData.systemPrompt;
			result.functions = exactData.functions;
		}

		if (this.outputTypes.includes(OutputTypes.CONTEXT_STATE)) {
			const contextData = this.captureContextState(params);
			result.contextState = contextData.contextState;
			result.contextTokenCount = contextData.tokenCount;
		}

		if (this.outputTypes.includes(OutputTypes.STRUCTURED)) {
			const structuredData = this.captureStructured(params);
			result.structured = structuredData.structured;
			result.structuredTokenCount = structuredData.tokenCount;
		}

		return result;
	}

	/**
	 * 根据配置格式化捕获的数据
	 * @param {Object} capturedData - 来自捕获方法的数据
	 * @returns {string} 格式化后的输出
	 */
	formatOutput(capturedData) {
		let output = `\n========== 提示词调试输出 ==========\n`;
		output += `时间戳：${capturedData.timestamp}\n`;

		if (capturedData.prompt) {
			output += `原始提示词：${capturedData.prompt}\n`;
		}

		if (capturedData.systemPrompt) {
			output += `系统提示词：${capturedData.systemPrompt.substring(0, 50)}...\n`;
		}

		if (capturedData.functions && capturedData.functions.length > 0) {
			output += `函数：${capturedData.functions.join(", ")}\n`;
		}

		if (capturedData.exactPrompt) {
			output += `\n=== 精确提示词 ===\n`;
			output += capturedData.exactPrompt;
			output += `\n`;
		}

		if (capturedData.contextState) {
			output += `Token 数量：${capturedData.contextTokenCount || "不可用"}\n`;

			output += `\n=== 上下文状态 ===\n`;
			output += capturedData.contextState;
			output += `\n`;
		}

		if (capturedData.structured) {
			output += `\n=== 结构化表示 ===\n`;
			output += `Token 数量：${capturedData.structuredTokenCount || "不可用"}\n`;
			output += JSON.stringify(capturedData.structured, null, 2);
			output += `\n`;
		}

		output += `==========================================\n`;
		return output;
	}

	/**
	 * 将数据保存到文件
	 * @param {Object} capturedData - 要保存的数据
	 * @param {null} customFilename - 可选的自定义文件名
	 */
	async saveToFile(capturedData, customFilename = null) {
		const content = this.formatOutput(capturedData);

		let filename = customFilename || this.filename;

		if (this.includeTimestamp) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const ext = path.extname(filename);
			const base = path.basename(filename, ext);
			filename = `${base}_${timestamp}${ext}`;
		}

		const filepath = path.join(this.outputDir, filename);

		if (this.appendMode) {
			await fs.appendFile(filepath, content, "utf8");
		} else {
			await fs.writeFile(filepath, content, "utf8");
		}

		console.log(`提示词调试输出已写入 ${filepath}`);
		return filepath;
	}

	/**
	 * 仅调试精确提示词 - 需要最少的参数
	 * @param {Object} params - session、prompt、systemPrompt（可选）、functions（可选）
	 * @param customFilename
	 */
	async debugExactPrompt(params, customFilename = null) {
		const oldOutputTypes = this.outputTypes;
		this.outputTypes = [OutputTypes.EXACT_PROMPT];
		const capturedData = this.captureAll(params);
		const filepath = await this.saveToFile(capturedData, customFilename);
		this.outputTypes = oldOutputTypes;
		return { capturedData, filepath };
	}

	/**
	 * 仅调试上下文状态 - 需要 session 和 model
	 * @param {Object} params - session、model
	 * @param customFilename
	 */
	async debugContextState(params, customFilename = null) {
		const oldOutputTypes = this.outputTypes;
		this.outputTypes = [OutputTypes.CONTEXT_STATE];
		const capturedData = this.captureAll(params);
		const filepath = await this.saveToFile(capturedData, customFilename);
		this.outputTypes = oldOutputTypes;
		return { capturedData, filepath };
	}

	/**
	 * 仅调试结构化表示 - 需要 session 和 model
	 * @param {Object} params - session、model
	 * @param customFilename
	 */
	async debugStructured(params, customFilename = null) {
		const oldOutputTypes = this.outputTypes;
		this.outputTypes = [OutputTypes.STRUCTURED];
		const capturedData = this.captureAll(params);
		const filepath = await this.saveToFile(capturedData, customFilename);
		this.outputTypes = oldOutputTypes;
		return { capturedData, filepath };
	}

	/**
	 * 使用已配置的输出类型进行调试
	 * @param {Object} params - 所有参数（session、model、prompt 等）
	 * @param customFilename
	 */
	async debug(params, _customFilename = null) {
		const capturedData = this.captureAll(params);
		//const filepath = await this.saveToFile(capturedData, customFilename);
		return { capturedData };
	}

	/**
	 * 仅输出到控制台
	 * @param {Object} params - 基于已配置输出类型的参数
	 */
	logToConsole(params) {
		const capturedData = this.captureAll(params);
		console.log(this.formatOutput(capturedData));
		return capturedData;
	}

	/**
	 * 将精确提示词输出到控制台
	 */
	logExactPrompt(params) {
		const capturedData = this.captureExactPrompt(params);
		console.log(this.formatOutput(capturedData));
		return capturedData;
	}

	/**
	 * 将上下文状态输出到控制台
	 */
	logContextState(params) {
		const capturedData = this.captureContextState(params);
		console.log(this.formatOutput(capturedData));
		return capturedData;
	}

	/**
	 * 将结构化表示输出到控制台
	 */
	logStructured(params) {
		const capturedData = this.captureStructured(params);
		console.log(this.formatOutput(capturedData));
		return capturedData;
	}
}

/**
 * 快速调试精确提示词的便捷函数
 */
async function _debugExactPrompt(params, options = {}) {
	const promptDebugger = new PromptDebugger({
		...options,
		outputTypes: [OutputTypes.EXACT_PROMPT],
	});
	return await promptDebugger.debug(params);
}

/**
 * 快速调试上下文状态的便捷函数
 */
async function _debugContextState(params, options = {}) {
	const promptDebugger = new PromptDebugger({
		...options,
		outputTypes: [OutputTypes.CONTEXT_STATE],
	});
	return await promptDebugger.debug(params);
}

/**
 * 快速调试结构化表示的便捷函数
 */
async function _debugStructured(params, options = {}) {
	const promptDebugger = new PromptDebugger({
		...options,
		outputTypes: [OutputTypes.STRUCTURED],
	});
	return await promptDebugger.debug(params);
}

/**
 * 快速调试所有输出的便捷函数
 */
async function _debugAll(params, options = {}) {
	const promptDebugger = new PromptDebugger({
		...options,
		outputTypes: [
			OutputTypes.EXACT_PROMPT,
			OutputTypes.CONTEXT_STATE,
			OutputTypes.STRUCTURED,
		],
	});
	return await promptDebugger.debug(params);
}
