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
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 2000 });

const systemPrompt = `你是一位专业的计时学家（chronologist），负责标准化不同系统中的时间表示。

在返回结果之前，始终将12小时制（例如 "1:46:36 PM"）转换为24小时制（例如 "13:46"），并且不包含秒数。`;

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

const getCurrentTime = defineChatSessionFunction({
	description: "获取当前时间",
	params: {
		type: "object",
		properties: {},
	},
	async handler() {
		return new Date().toLocaleTimeString();
	},
});

const functions = { getCurrentTime };
const prompt = `现在几点了？`;

// 执行提示词（prompt）
const a1 = await session.prompt(prompt, { functions });
console.log(`AI: ${a1}`);

// 提示词执行完成后的调试
const promptDebugger = new PromptDebugger({
	outputDir: "./logs",
	filename: "qwen_prompts.txt",
	includeTimestamp: true, // 在文件名中添加时间戳
	appendMode: false, // 每次运行时覆盖文件
});
await promptDebugger.debugContextState({ session, model });

// 清理资源
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
