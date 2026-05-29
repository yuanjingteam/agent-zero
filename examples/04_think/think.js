import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, HarmonyChatWrapper, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
	modelPath: path.join(
		__dirname,
		"..",
		"..",
		"models",
		"hf_giladgd_gpt-oss-20b.MXFP4.gguf",
	),
});
const context = await model.createContext();
const session = new LlamaChatSession({
	chatWrapper: new HarmonyChatWrapper(),
	contextSequence: context.getSequence(),
});

const q1 = `JavaScript 中的变量提升（hoisting）是什么？请举例说明。`;

console.log("context.contextSize", context.contextSize);

const a1 = await session.prompt(q1, {
	// 提示：让库自动选择或合理设置上限；使用整个上下文大小可能会浪费资源
	maxTokens: 2000,

	// 当第一批字符到达时立即触发
	onTextChunk: (text) => {
		process.stdout.write(text); // 可选：实时打印
	},
});

console.log("\n\n最终回答：\n", a1);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
