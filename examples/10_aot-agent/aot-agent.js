import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { JsonParser } from "../../helper/json-parser.js";
import { PromptDebugger } from "../../helper/prompt-debugger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const llama = await getLlama({ debug });
const model = await llama.loadModel({
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 2000 });

// 思想原子（Atom of Thought）系统提示词 - LLM 只负责规划，不负责执行
const systemPrompt = `你是一个使用思想原子（Atom of Thought）方法的数学规划助手。

关键规则：
1. 从用户问题中提取每一个数字，放入 "input" 字段。
2. 每个原子只表达一个操作：add、subtract、multiply、divide。
3. 绝不在一个原子中合并操作。例如 "(5 + 3) × 2" 必须拆成两个原子：一个用于加法，一个用于乘法。
4. "final" 原子只报告最后一个计算原子的结果，不能有自己的输入。不要在 final 原子中包含 "input" 字段。
5. 使用 "<result_of_N>" 引用之前原子的结果；不要在 final 原子中凭空计算。
6. 只输出符合 schema 的有效 JSON，不要输出任何解释或额外文字。

正确示例（对应问题 "(15 + 7) × 3 - 10 是多少？"）：
{
  "atoms": [
    {"id": 1, "kind": "tool", "name": "add", "input": {"a": 15, "b": 7}, "dependsOn": []},
    {"id": 2, "kind": "tool", "name": "multiply", "input": {"a": "<result_of_1>", "b": 3}, "dependsOn": [1]},
    {"id": 3, "kind": "tool", "name": "subtract", "input": {"a": "<result_of_2>", "b": 10}, "dependsOn": [2]},
    {"id": 4, "kind": "final", "name": "report", "dependsOn": [3]}
  ]
}

错误示例：
- 空输入：{"input": {}}
- 缺少数字：{"input": {"a": "<result_of_1>"}}
- 合并操作："先加后乘" 必须拆成两个原子
- final 原子包含输入：{"kind": "final", "input": {"a": 5}} 是无效的

可用工具：add、subtract、multiply、divide
- 每个工具需要：{"a": <数字或引用>, "b": <数字或引用>}
- kind 可选值："tool"、"decision"、"final"
- dependsOn：必须先完成的原子 ID 数组

务必从问题中提取实际数字放入 input 字段！不要合并操作，也不要在 final 原子中凭空计算。`;

// 用于计划验证的 JSON 模式定义
const planSchema = {
	type: "object",
	properties: {
		atoms: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "number" },
					kind: { enum: ["tool", "decision", "final"] },
					name: { type: "string" },
					input: {
						type: "object",
						properties: {
							a: {
								oneOf: [
									{ type: "number" },
									{ type: "string", pattern: "^<result_of_\\d+>$" },
								],
							},
							b: {
								oneOf: [
									{ type: "number" },
									{ type: "string", pattern: "^<result_of_\\d+>$" },
								],
							},
						},
					},
					dependsOn: {
						type: "array",
						items: { type: "number" },
					},
				},
				required: ["id", "kind", "name"],
			},
		},
	},
	required: ["atoms"],
};

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

// 工具实现（纯函数，确定性的）
const tools = {
	add: (a, b) => {
		const result = a + b;
		console.log(`执行: add(${a}, ${b}) = ${result}`);
		return result;
	},

	subtract: (a, b) => {
		const result = a - b;
		console.log(`执行: subtract(${a}, ${b}) = ${result}`);
		return result;
	},

	multiply: (a, b) => {
		const result = a * b;
		console.log(`执行: multiply(${a}, ${b}) = ${result}`);
		return result;
	},

	divide: (a, b) => {
		if (b === 0) {
			console.log(`错误: divide(${a}, ${b}) - 除以零`);
			throw new Error("Division by zero");
		}
		const result = a / b;
		console.log(`执行: divide(${a}, ${b}) = ${result}`);
		return result;
	},
};

// 决策处理器（用于复杂逻辑）
const decisions = {
	average: (values) => {
		const sum = values.reduce((acc, v) => acc + v, 0);
		const avg = sum / values.length;
		console.log(`决策: average([${values}]) = ${avg}`);
		return avg;
	},

	chooseCheapest: (values) => {
		const min = Math.min(...values);
		console.log(`决策: chooseCheapest([${values}]) = ${min}`);
		return min;
	},
};

// 第一阶段：LLM 生成原子化计划
async function generatePlan(userPrompt) {
	console.log(`\n${"=".repeat(70)}`);
	console.log("第一阶段: 规划（LLM 生成原子化计划）");
	console.log("=".repeat(70));
	console.log("用户问题:", userPrompt);
	console.log(`${"-".repeat(70)}\n`);

	const grammar = await llama.createGrammarForJsonSchema(planSchema);

	// 添加关于提取数字的提醒
	const enhancedPrompt = `${userPrompt}

记住：从这个问题中提取实际数字并放入 input 字段！`;

	const planText = await session.prompt(enhancedPrompt, {
		grammar,
		maxTokens: 1000,
	});

	let plan;
	try {
		// 使用健壮的 JSON 解析器
		plan = JsonParser.parse(planText, {
			debug: debug,
			expectObject: true,
			repairAttempts: true,
		});

		// 验证计划结构
		JsonParser.validatePlan(plan, debug);

		// 美化打印计划
		if (debug) {
			JsonParser.prettyPrint(plan);
		} else {
			console.log("生成的计划:");
			console.log(JSON.stringify(plan, null, 2));
			console.log();
		}
	} catch (error) {
		console.error("解析计划失败:", error.message);
		console.log("\nLLM 原始输出:");
		console.log(planText);
		throw error;
	}

	return plan;
}

// 第二阶段：系统验证计划
function validatePlan(plan) {
	console.log(`\n${"=".repeat(70)}`);
	console.log("第二阶段: 验证（系统检查计划）");
	console.log(`${"=".repeat(70)}\n`);

	const allowedTools = new Set(Object.keys(tools));
	const allowedDecisions = new Set(Object.keys(decisions));
	const ids = new Set();

	for (const atom of plan.atoms) {
		// 检查重复 ID
		if (ids.has(atom.id)) {
			throw new Error(`验证失败: 重复的原子 ID ${atom.id}`);
		}
		ids.add(atom.id);

		// 检查工具名称
		if (atom.kind === "tool" && !allowedTools.has(atom.name)) {
			throw new Error(`验证失败: 原子 ${atom.id} 中的未知工具 "${atom.name}"`);
		}

		// 检查决策名称
		if (atom.kind === "decision" && !allowedDecisions.has(atom.name)) {
			throw new Error(`验证失败: 原子 ${atom.id} 中的未知决策 "${atom.name}"`);
		}

		// 验证工具输入包含实际值
		if (atom.kind === "tool") {
			if (!atom.input || typeof atom.input !== "object") {
				throw new Error(
					`验证失败: 工具原子 ${atom.id} (${atom.name}) 必须有输入对象\n` +
						` 当前: ${JSON.stringify(atom.input)}`,
				);
			}

			// 检查 a 和 b 是否存在
			if (atom.input.a === undefined || atom.input.b === undefined) {
				throw new Error(
					`验证失败: 工具原子 ${atom.id} (${atom.name}) 缺少必要参数\n` +
						`  期望: {"a": <number or reference>, "b": <number or reference>}\n` +
						`  当前: ${JSON.stringify(atom.input)}\n` +
						`  提示: LLM 必须从用户问题中提取数字`,
				);
			}

			// 对于首个操作，确保使用具体数字（而非引用）
			if (atom.dependsOn.length === 0) {
				const hasConcreteNumbers =
					typeof atom.input.a === "number" && typeof atom.input.b === "number";

				if (!hasConcreteNumbers) {
					throw new Error(
						`验证失败: 首个原子 ${atom.id} 必须使用具体数字\n` +
							`  期望: {"a": <number>, "b": <number>}\n` +
							`  当前: ${JSON.stringify(atom.input)}\n` +
							`  LLM 未能从问题中提取数字`,
					);
				}
			}
		}

		// 检查依赖是否存在
		if (atom.dependsOn) {
			for (const depId of atom.dependsOn) {
				if (!ids.has(depId) && depId < atom.id) {
					console.warn(
						`警告: 原子 ${atom.id} 依赖于 ${depId}，但该原子尚未被验证`,
					);
				}
			}
		}

		console.log(`原子 ${atom.id} (${atom.kind}:${atom.name}) 验证通过`);
	}

	console.log("\n计划验证成功\n");
	return true;
}

// 第三阶段：系统确定性地执行计划
function executePlan(plan) {
	console.log(`\n${"=".repeat(70)}`);
	console.log("第三阶段: 执行（系统运行各原子）");
	console.log(`${"=".repeat(70)}\n`);

	const state = {};
	const sortedAtoms = [...plan.atoms].sort((a, b) => a.id - b.id);

	for (const atom of sortedAtoms) {
		console.log(`\n执行原子 ${atom.id} (${atom.kind}:${atom.name})`);

		// 检查依赖
		if (atom.dependsOn && atom.dependsOn.length > 0) {
			const missingDeps = atom.dependsOn.filter((id) => !(id in state));
			if (missingDeps.length > 0) {
				throw new Error(`原子 ${atom.id} 依赖于未完成的原子: ${missingDeps}`);
			}
			console.log(`依赖已满足: ${atom.dependsOn.join(", ")}`);
		}

		// 解析输入值（替换 <result_of_N> 引用）
		let resolvedInput = { a: undefined, b: undefined };
		if (atom.input) {
			// 深拷贝以避免修改原数据
			resolvedInput = JSON.parse(JSON.stringify(atom.input));

			for (const [key, value] of Object.entries(resolvedInput)) {
				if (typeof value === "string" && value.startsWith("<result_of_")) {
					const refId = parseInt(value.match(/\d+/)[0], 10);

					if (!(refId in state)) {
						throw new Error(
							`原子 ${atom.id} 引用了 <result_of_${refId}>，但原子 ${refId} 尚未执行`,
						);
					}

					resolvedInput[key] = state[refId];
					console.log(`解析 ${key}: ${value} → ${state[refId]}`);
				}
			}
		}

		// 根据类型执行
		if (atom.kind === "tool") {
			const tool = tools[atom.name];
			if (!tool) {
				throw new Error(`工具未找到: ${atom.name}`);
			}

			// 执行前显示输入
			console.log(`输入: a=${resolvedInput.a}, b=${resolvedInput.b}`);

			// 安全检查
			if (resolvedInput.a === undefined || resolvedInput.b === undefined) {
				throw new Error(
					`无法执行 ${atom.name}: 输入值未定义\n` +
						`  这意味着 LLM 未能从你的问题中提取数字。\n` +
						`  原始输入: ${JSON.stringify(atom.input)}`,
				);
			}

			state[atom.id] = tool(resolvedInput.a, resolvedInput.b);
		} else if (atom.kind === "decision") {
			const decision = decisions[atom.name];
			if (!decision) {
				throw new Error(`决策未找到: ${atom.name}`);
			}

			// 收集依赖项的结果
			const depResults = atom.dependsOn.map((id) => state[id]);
			state[atom.id] = decision(depResults);
		} else if (atom.kind === "final") {
			const finalValue = state[atom.dependsOn[0]];
			console.log(`\n 最终结果: ${finalValue}`);
			state[atom.id] = finalValue;
		}
	}

	return state;
}

// 主 AoT 智能体（Agent）执行
async function aotAgent(userPrompt) {
	try {
		// 第一阶段: 规划
		const plan = await generatePlan(userPrompt);

		// 第二阶段: 验证
		validatePlan(plan);

		// 第三阶段: 执行
		const result = executePlan(plan);

		console.log(`\n${"=".repeat(70)}`);
		console.log("执行完成");
		console.log("=".repeat(70));

		// 查找最终原子
		const finalAtom = plan.atoms.find((a) => a.kind === "final");
		if (finalAtom) {
			console.log(`\n答案: ${result[finalAtom.id]}\n`);
		}

		return result;
	} catch (error) {
		console.error("\n执行失败:", error.message);
		throw error;
	}
}

// 测试查询
const queries = [
	// "(15 + 7) 乘以 3 减去 10 是多少？",
	// "一个披萨20元。如果4个朋友平分，每人付多少钱？",
	"计算: 100 除以 5，然后加 3，再乘以 2",
];

for (const query of queries) {
	await aotAgent(query);
	console.log("\n");
}

// 调试
const promptDebugger = new PromptDebugger({
	outputDir: "./logs",
	filename: "aot_calculator.txt",
	includeTimestamp: true,
	appendMode: false,
});
await promptDebugger.debugContextState({ session, model });

// 清理资源
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
