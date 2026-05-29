import OpenAI from "openai";
import "dotenv/config";

// 初始化 OpenAI 客户端（Client）
// 在 https://platform.openai.com/api-keys 创建 API 密钥（API Key）
const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

console.log("=== OpenAI 入门：理解基础知识 ===\n");

// ============================================
// 示例 1：基本的聊天补全（Chat Completion）
// ============================================
async function basicCompletion() {
	console.log("--- 示例 1：基本的聊天补全 ---");

	const response = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: "什么是 node-llama-cpp？" }],
	});

	console.log(`AI: ${response.choices[0].message.content}`);
	console.log("\n");
}

// ============================================
// 示例 2：使用系统提示词（System Prompts）
// ============================================
async function systemPromptExample() {
	console.log("--- 示例 2：系统提示词（行为控制） ---");

	const response = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [
			{ role: "system", content: "你是一个说话像海盗的编程助手。" },
			{
				role: "user",
				content: "解释一下 JavaScript 中的 async/await 是做什么的。",
			},
		],
	});

	console.log(`AI: ${response.choices[0].message.content}`);
	console.log("\n");
}

// ============================================
// 示例 3：温度（Temperature）与创造力
// ============================================
async function temperatureExample() {
	console.log("--- 示例 3：温度控制 ---");

	const prompt = "为一家咖啡店写一句标语。";

	// 低温度 = 更聚焦、更确定性
	const focusedResponse = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: prompt }],
		temperature: 0.2,
	});

	// 高温度 = 更有创造力、更多样化
	const creativeResponse = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: prompt }],
		temperature: 1.5,
	});

	console.log(`低温度 (0.2): ${focusedResponse.choices[0].message.content}`);
	console.log(`高温度 (1.5): ${creativeResponse.choices[0].message.content}`);
	console.log("\n");
}

// ============================================
// 示例 4：带上下文（Context）的对话
// ============================================
async function conversationContext() {
	console.log("--- 示例 4：多轮对话 ---");

	// 构建对话历史
	const messages = [
		{ role: "system", content: "你是一个乐于助人的编程导师。" },
		{ role: "user", content: "什么是 JavaScript 中的 Promise？" },
	];

	// 第一次回复
	const response1 = await client.chat.completions.create({
		model: "gpt-4o",
		messages: messages,
		max_tokens: 150,
	});

	console.log("用户: 什么是 JavaScript 中的 Promise？");
	console.log(`AI: ${response1.choices[0].message.content}`);

	// 将 AI 的回复添加到对话历史中
	messages.push(response1.choices[0].message);

	// 添加后续问题
	messages.push({ role: "user", content: "能给我展示一个简单的例子吗？" });

	// 第二次回复（带上下文）
	const response2 = await client.chat.completions.create({
		model: "gpt-4o",
		messages: messages,
	});

	console.log("\n用户: 能给我展示一个简单的例子吗？");
	console.log(`AI: ${response2.choices[0].message.content}`);
	console.log("\n");
}

// ============================================
// 示例 5：流式响应（Streaming Responses）
// ============================================
async function streamingExample() {
	console.log("--- 示例 5：流式响应 ---");
	console.log("AI: ");

	const stream = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: "写一首关于编程的俳句。" }],
		stream: true,
	});

	for await (const chunk of stream) {
		const content = chunk.choices[0]?.delta?.content || "";
		process.stdout.write(content);
	}

	console.log("\n\n");
}

// ============================================
// 示例 6：令牌（Token）使用量与限制
// ============================================
async function tokenUsageExample() {
	console.log("--- 示例 6：理解令牌使用量 ---");

	const response = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: "用 3 句话解释递归。" }],
		max_tokens: 100,
	});

	console.log(`AI: ${response.choices[0].message.content}`);
	console.log("\n令牌使用量:");
	console.log(`- 提示词令牌数: ${response.usage.prompt_tokens}`);
	console.log(`- 补全令牌数: ${response.usage.completion_tokens}`);
	console.log(`- 总令牌数: ${response.usage.total_tokens}`);
	console.log("\n");
}

// ============================================
// 示例 7：模型比较
// ============================================
async function modelComparison() {
	console.log("--- 示例 7：不同模型 ---");

	const prompt = "25 * 47 等于多少？";

	// GPT-4o - 最强大的模型
	const gpt4Response = await client.chat.completions.create({
		model: "gpt-4o",
		messages: [{ role: "user", content: prompt }],
	});

	// GPT-3.5-turbo - 更快更便宜
	const gpt35Response = await client.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: [{ role: "user", content: prompt }],
	});

	console.log(`GPT-4o: ${gpt4Response.choices[0].message.content}`);
	console.log(`GPT-3.5-turbo: ${gpt35Response.choices[0].message.content}`);
	console.log("\n");
}

// ============================================
// 运行所有示例
// ============================================
async function main() {
	try {
		await basicCompletion();
		await systemPromptExample();
		await temperatureExample();
		await conversationContext();
		await streamingExample();
		await tokenUsageExample();
		await modelComparison();

		console.log("=== 所有示例已完成！ ===");
	} catch (error) {
		console.error("错误:", error.message);
		if (error.message.includes("API key")) {
			console.error("\n请确保在 .env 文件中设置了 OPENAI_API_KEY");
		}
	}
}

main();
