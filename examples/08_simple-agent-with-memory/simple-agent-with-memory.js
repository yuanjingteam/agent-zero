import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	defineChatSessionFunction,
	getLlama,
	LlamaChatSession,
} from "node-llama-cpp";
import { MemoryManager } from "./memory-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama({ debug: false });
const model = await llama.loadModel({
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 2000 });

// 初始化记忆管理器（Memory Manager）
const memoryManager = new MemoryManager("./agent-memory.json");

// 加载已有记忆并添加到系统提示词中
const memorySummary = await memoryManager.getMemorySummary();

const systemPrompt = `
你是一个拥有长期记忆的助手。

在调用任何函数之前，请始终遵循以下推理过程：

1. **比较** 用户的新陈述与下面已有的记忆。
2. **如果相同的键和值已经存在**，请不要再次调用 saveMemory。
   - 只需确认已知的信息即可。
   - 例如：如果用户说"我叫 Malua"，而记忆中已有"user_name: Malua"，则回复"是的，我记得你叫 Malua。"
3. **如果用户提供了更新的值**（例如"我现在其实更喜欢寿司了"），
   则调用一次 saveMemory 来更新该值。
4. **只为真正的新信息调用 saveMemory。**

保存新数据时，请使用结构化字段调用 saveMemory：
- type: "fact"（事实）或 "preference"（偏好）
- key: 简短的描述性标识符（例如 "user_name"、"favorite_food"）
- value: 具体信息（例如 "Malua"、"chinua"）

示例：
saveMemory({ type: "fact", key: "user_name", value: "Malua" })
saveMemory({ type: "preference", key: "favorite_food", value: "chinua" })

${memorySummary}
`;

const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

// 保存记忆的函数
const saveMemory = defineChatSessionFunction({
	description: "将重要信息保存到长期记忆中（用户偏好、事实、个人详情）",
	params: {
		type: "object",
		properties: {
			type: {
				type: "string",
				enum: ["fact", "preference"],
			},
			key: { type: "string" },
			value: { type: "string" },
		},
		required: ["type", "key", "value"],
	},
	async handler({ type, key, value }) {
		await memoryManager.addMemory({ type, key, value });
		return `记忆已保存: ${key} = ${value}`;
	},
});

const functions = { saveMemory };

// 示例对话
const prompt1 = "你好！我叫 Alex，我最喜欢吃披萨。";
const response1 = await session.prompt(prompt1, { functions });
console.log(`AI: ${response1}`);

// 后续对话（即使在重启脚本之后也能继续）
const prompt2 = "我最喜欢的食物是什么？";
const response2 = await session.prompt(prompt2, { functions });
console.log(`AI: ${response2}`);

// 清理资源
session.dispose();
context.dispose();
model.dispose();
llama.dispose();
