import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	defineChatSessionFunction,
	getLlama,
	LlamaChatSession,
} from "node-llama-cpp";
import { PromptDebugger } from "../../helper/prompt-debugger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const llama = await getLlama({ debug });
const model = await llama.loadModel({
	modelPath: path.join(
		__dirname,
		"..",
		"..",
		"models",
		"hf_giladgd_gpt-oss-20b.MXFP4.gguf",
	),
});
const context = await model.createContext({ contextSize: 2000 });

// ReAct（推理+行动）风格的数学推理系统提示词
const systemPrompt = `你是一个使用 ReAct（推理+行动）方法的数学助手。

关键要求：你必须对每个问题严格遵循以下模式：

Thought: [解释你下一步需要做什么计算以及原因]
Action: [调用一个工具，传入具体数字]
Observation: [等待工具返回结果]
Thought: [分析结果并决定下一步]
Action: [如需要，调用另一个工具]
Observation: [等待工具返回结果]
... （根据需要重复多次）
Thought: [当你已获得回答问题所需的全部信息]
Answer: [给出最终答案并停止]

规则：
1. 只有在你已有完整的最终答案时才写 "Answer:"
2. 写完 "Answer:" 后，不要再继续计算或思考
3. 将复杂问题拆分为尽可能小的步骤
4. 所有计算都必须使用工具——不要在脑中计算
5. 每次 Action 只能调用一个工具

示例：
用户："5 加 3 是多少，再乘以 2？"

Thought: 首先我需要将 5 和 3 相加
Action: add(5, 3)
Observation: 8
Thought: 现在我需要将结果乘以 2
Action: multiply(8, 2)
Observation: 16
Thought: 我已经得到最终结果
Answer: 16`;

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

// 简单的计算器工具，强制逐步推理
const add = defineChatSessionFunction({
	description: "将两个数相加",
	params: {
		type: "object",
		properties: {
			a: {
				type: "number",
				description: "第一个数",
			},
			b: {
				type: "number",
				description: "第二个数",
			},
		},
		required: ["a", "b"],
	},
	async handler(params) {
		const result = params.a + params.b;
		console.log(`\n   🔧 工具调用: add(${params.a}, ${params.b})`);
		console.log(`   📊 结果: ${result}\n`);
		return result.toString();
	},
});

const multiply = defineChatSessionFunction({
	description: "将两个数相乘",
	params: {
		type: "object",
		properties: {
			a: {
				type: "number",
				description: "第一个数",
			},
			b: {
				type: "number",
				description: "第二个数",
			},
		},
		required: ["a", "b"],
	},
	async handler(params) {
		const result = params.a * params.b;
		console.log(`\n   🔧 工具调用: multiply(${params.a}, ${params.b})`);
		console.log(`   📊 结果: ${result}\n`);
		return result.toString();
	},
});

const subtract = defineChatSessionFunction({
	description: "用第一个数减去第二个数",
	params: {
		type: "object",
		properties: {
			a: {
				type: "number",
				description: "被减数",
			},
			b: {
				type: "number",
				description: "减数",
			},
		},
		required: ["a", "b"],
	},
	async handler(params) {
		const result = params.a - params.b;
		console.log(`\n   🔧 工具调用: subtract(${params.a}, ${params.b})`);
		console.log(`   📊 结果: ${result}\n`);
		return result.toString();
	},
});

const divide = defineChatSessionFunction({
	description: "用第一个数除以第二个数",
	params: {
		type: "object",
		properties: {
			a: {
				type: "number",
				description: "被除数",
			},
			b: {
				type: "number",
				description: "除数",
			},
		},
		required: ["a", "b"],
	},
	async handler(params) {
		if (params.b === 0) {
			console.log(`\n   🔧 工具调用: divide(${params.a}, ${params.b})`);
			console.log(`   ❌ 错误: 除以零\n`);
			return "错误: 不能除以零";
		}
		const result = params.a / params.b;
		console.log(`\n   🔧 工具调用: divide(${params.a}, ${params.b})`);
		console.log(`   📊 结果: ${result}\n`);
		return result.toString();
	},
});

const functions = { add, multiply, subtract, divide };

// ReAct 智能体（Agent）执行循环，带正确的输出处理
async function reactAgent(userPrompt, maxIterations = 10) {
	console.log(`\n${"=".repeat(70)}`);
	console.log("用户问题:", userPrompt);
	console.log(`${"=".repeat(70)}\n`);

	let iteration = 0;
	let fullResponse = "";

	while (iteration < maxIterations) {
		iteration++;
		console.log(`--- 第 ${iteration} 轮迭代 ---`);

		// 使用 onTextChunk 捕获流式输出
		let currentChunk = "";
		const response = await session.prompt(
			iteration === 1 ? userPrompt : "继续你的推理。下一步是什么？",
			{
				functions,
				maxTokens: 300,
				onTextChunk: (chunk) => {
					// 逐块打印输出
					process.stdout.write(chunk);
					currentChunk += chunk;
				},
			},
		);

		console.log(); // 流式输出后换行

		fullResponse += currentChunk;

		// 如果本轮没有生成输出，则说明出现了问题
		if (!currentChunk.trim() && !response.trim()) {
			console.log("   (本轮未生成输出)\n");
		}

		// 检查是否已获得最终答案
		if (
			response.toLowerCase().includes("answer:") ||
			fullResponse.toLowerCase().includes("answer:")
		) {
			console.log(`\n${"=".repeat(70)}`);
			console.log("已获得最终答案");
			console.log("=".repeat(70));
			return fullResponse;
		}
	}

	console.log("\n⚠️  达到最大迭代次数，未获得最终答案");
	return fullResponse || "在迭代限制内无法完成推理。";
}

// 需要多步推理的测试查询
const queries = [
	// "如果我买了3个苹果，每个2元，4个橙子，每个3元，我总共花了多少钱？",
	// "计算: (15 + 7) × 3 - 10",
	// "一个披萨20元。如果4个朋友平分，每人付多少钱？",
	"一家商店周一以每件8元的价格卖出15件商品，周二卖出20件，周三卖出10件。平均每天卖出多少件商品，总收入是多少？",
];

for (const query of queries) {
	await reactAgent(query, 3);
	console.log("\n");
}

// 调试
const promptDebugger = new PromptDebugger({
	outputDir: "./logs",
	filename: "react_calculator.txt",
	includeTimestamp: true,
	appendMode: false,
});
await promptDebugger.debugContextState({ session, model });

// 清理资源
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
