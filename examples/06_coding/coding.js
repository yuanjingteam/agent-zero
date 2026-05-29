import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

/**
 * 异步执行可以提升 GAIA 基准测试（GAIA benchmarks）、
 * 多智能体应用（multi-agent applications）以及其他高吞吐量场景的性能。
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(
	__dirname,
	"..",
	"..",
	"models",
	"DeepSeek-R1-0528-Qwen3-8B-Q6_K.gguf",
);

const llama = await getLlama({
	logLevel: "error",
});
const model = await llama.loadModel({ modelPath });
const context = await model.createContext({
	sequences: 2,
	batchSize: 1024, // GPU 一次能处理的 token 数量
});

const sequence1 = context.getSequence();
const sequence2 = context.getSequence();

const session1 = new LlamaChatSession({
	contextSequence: sequence1,
});
const session2 = new LlamaChatSession({
	contextSequence: sequence2,
});

const q1 = "你好，最近怎么样？";
const q2 = "6加6等于多少？";

console.log("批处理开始...");
const [a1, a2] = await Promise.all([session1.prompt(q1), session2.prompt(q2)]);

console.log(`用户: ${q1}`);
console.log(`AI: ${a1}`);

console.log(`用户: ${q2}`);
console.log(`AI: ${a2}`);

session1.dispose();
session2.dispose();
context.dispose();
model.dispose();
llama.dispose();
