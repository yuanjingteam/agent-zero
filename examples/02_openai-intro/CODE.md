# 代码解析：OpenAI 入门

本指南将逐步讲解 `openai-intro.js` 中的每个示例，从零开始介绍如何使用 OpenAI 的 API。

## 前置要求

在运行此示例之前，你需要一个 OpenAI 账户、一个 API 密钥（API key）以及有效的支付方式。

### 获取 API 密钥

https://platform.openai.com/api-keys

### 添加支付方式

https://platform.openai.com/settings/organization/billing/overview

### 配置环境变量（Environment Variables）

```bash
   cp .env.example .env
```
然后编辑 `.env` 文件，添加你的实际 API 密钥。

## 安装与初始化

```javascript
import OpenAI from 'openai';
import 'dotenv/config';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
```

**代码说明：**
- `import OpenAI from 'openai'` - 导入 OpenAI 官方的 Node.js SDK
- `import 'dotenv/config'` - 从 `.env` 文件加载环境变量
- `new OpenAI({...})` - 创建一个客户端实例，用于处理 API 认证和请求
- `process.env.OPENAI_API_KEY` - 你在 platform.openai.com 获取的 API 密钥（切勿硬编码！）

**重要性：** client 对象是你与 OpenAI 模型交互的接口。所有 API 调用都通过此客户端进行。

---

## 示例 1：基本聊天补全（Chat Completion）

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'What is node-llama-cpp?' }
    ],
});

console.log(response.choices[0].message.content);
```

**代码说明：**
- `chat.completions.create()` - 向 ChatGPT 模型发送消息的主要方法
- `model: 'gpt-4o'` - 指定要使用的模型（gpt-4o 是最新、最强大的模型）
- `messages` 数组 - 包含对话历史记录
- `role: 'user'` - 表示此消息来自用户（你）
- `response.choices[0]` - API 返回一个可能的响应数组；我们取第一个
- `message.content` - AI 返回的实际文本响应

**响应结构：**
```javascript
{
  id: 'chatcmpl-...',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4o',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'node-llama-cpp is a...'
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 50,
    total_tokens: 60
  }
}
```

---

## 示例 2：系统提示词（System Prompt）

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'system', content: 'You are a coding assistant that talks like a pirate.' },
        { role: 'user', content: 'Explain what async/await does in JavaScript.' }
    ],
});
```

**代码说明：**
- `role: 'system'` - 特殊的消息类型，用于设置 AI 的行为和人格
- 系统消息会优先处理，并影响后续所有响应
- 模型将在整个对话过程中保持此行为设定

**重要性：** 系统提示词是定制 AI 行为的方式。它们是创建具有特定角色（翻译器、编码器、分析师等）的专注型智能体（Agent）的基础。

**关键洞察：** 相同的模型 + 不同的系统提示词 = 完全不同的智能体！

---

## 示例 3：温度参数控制（Temperature）

```javascript
// 专注型响应
const focusedResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
});

// 创意型响应
const creativeResponse = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.5,
});
```

**代码说明：**
- `temperature` - 控制输出的随机性（范围：0.0 到 2.0）
- **低温（0.0 - 0.3）：**
    - 更专注、更具确定性
    - 相同输入 → 相似输出
    - 适用于：事实性回答、代码生成、数据提取
- **中温（0.7 - 1.0）：**
    - 创造力和连贯性的平衡
    - 大多数场景的默认值
- **高温（1.2 - 2.0）：**
    - 更具创造性和多样性
    - 相同输入 → 非常不同的输出
    - 适用于：创意写作、头脑风暴、故事生成

**实际应用场景：**
- 代码补全：temperature 0.2
- 客户支持：temperature 0.5
- 创意内容：temperature 1.2

---

## 示例 4：对话上下文（Conversation Context）

```javascript
const messages = [
    { role: 'system', content: 'You are a helpful coding tutor.' },
    { role: 'user', content: 'What is a Promise in JavaScript?' },
];

const response1 = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
});

// 将 AI 响应添加到历史记录
messages.push(response1.choices[0].message);

// 添加后续问题
messages.push({ role: 'user', content: 'Can you show me a simple example?' });

// 使用完整上下文进行第二次请求
const response2 = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
});
```

**代码说明：**
- OpenAI 模型是**无状态的（Stateless）** - 它们不会记住之前的对话
- 我们通过在每次请求中发送完整的对话历史来维护上下文
- 每次请求都是独立的；你必须包含所有相关消息

**消息数组中的顺序：**
1. 系统提示词（可选，但建议放在第一位）
2. 之前的用户消息
3. 之前的助手响应
4. 当前用户消息

**重要性：** 这就是聊天机器人记住上下文的方式。每次都会发送完整的对话内容。

**性能考量：**
- 更多消息 = 更多 token（令牌） = 更高成本
- 较长的对话最终会达到 token 限制
- 实际应用需要对话裁剪或摘要策略

---

## 示例 5：流式响应（Streaming）

```javascript
const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'Write a haiku about programming.' }
    ],
    stream: true,  // 启用流式传输
});

for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
}
```

**代码说明：**
- `stream: true` - 不等待完整响应，而是逐个 token 接收
- `for await...of` - 在数据块到达时迭代流
- `delta.content` - 每个数据块包含一小段文本（通常只是一个词或部分词）
- `process.stdout.write()` - 不换行写入，以逐步显示文本

**流式传输 vs 非流式传输：**

**非流式传输（默认）：**
```
[发送请求]
[等待 5 秒...]
[收到完整响应]
```

**流式传输：**
```
[发送请求]
Once [收到数据块: "Once"]
upon [收到数据块: " upon"]
a [收到数据块: " a"]
time [收到数据块: " time"]
...
```

**重要性：**
- 更好的用户体验（即时反馈）
- 即使总时间相似，也显得更快
- 对实时聊天界面至关重要
- 允许提前处理/显示部分结果

**何时使用流式传输：**
- 交互式聊天应用
- 长文本内容生成
- 当用户体验比简洁性更重要时

**何时不使用流式传输：**
- 简单脚本或自动化
- 当你需要在处理之前获取完整响应时
- 批量处理

---

## 示例 6：Token 使用量

```javascript
const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'Explain recursion in 3 sentences.' }
    ],
    max_tokens: 100,
});

console.log("Token usage:");
console.log("- Prompt tokens: " + response.usage.prompt_tokens);
console.log("- Completion tokens: " + response.usage.completion_tokens);
console.log("- Total tokens: " + response.usage.total_tokens);
```

**代码说明：**
- `max_tokens` - 限制 AI 响应的长度
- `response.usage` - 包含 token 消耗的详细信息
- **提示 token（Prompt tokens）：** 你的输入（你发送的消息）
- **补全 token（Completion tokens）：** AI 的输出（响应内容）
- **总 token（Total tokens）：** 两者的总和（这是计费的依据）

**理解 token：**
- Token 不等于单词
- 1 个 token ≈ 0.75 个英文单词
- "hello" = 1 个 token
- "chatbot" = 2 个 token（"chat" + "bot"）
- 标点符号和空格也算作 token

**重要性：**
1. **成本控制：** 按 token 计费
2. **上下文限制：** 模型有最大 token 限制（例如 gpt-4o：128,000 个 token）
3. **响应控制：** 使用 `max_tokens` 防止过长的响应

**实际限制：**
```javascript
// 防止失控的响应
max_tokens: 150,  // 约 100 个单词

// 简短响应
max_tokens: 50,   // 约 35 个单词

// 较长内容
max_tokens: 1000, // 约 750 个单词
```

**成本估算（近似值）：**
- GPT-4o：每 100 万个输入 token 5 美元，每 100 万个输出 token 15 美元
- GPT-3.5-turbo：每 100 万个输入 token 0.50 美元，每 100 万个输出 token 1.50 美元

---

## 示例 7：模型对比

```javascript
// GPT-4o - 最强大
const gpt4Response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
});

// GPT-3.5-turbo - 更快更便宜
const gpt35Response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
});
```

**可用模型：**

| 模型 | 最佳用途 | 速度 | 成本 | 上下文窗口 |
|-------|----------|-------|------|----------------|
| `gpt-4o` | 复杂任务、推理、准确性 | 中等 | $$$ | 128K token |
| `gpt-4o-mini` | 性能/成本平衡 | 快速 | $$ | 128K token |
| `gpt-3.5-turbo` | 简单任务、高吞吐量 | 非常快 | $ | 16K token |

**选择合适的模型：**
- **使用 GPT-4o 的场景：**
    - 需要复杂推理
    - 高准确性至关重要
    - 处理代码或技术内容
    - 质量 > 速度/成本

- **使用 GPT-4o-mini 的场景：**
    - 需要较低成本下的良好性能
    - 大多数通用任务

- **使用 GPT-3.5-turbo 的场景：**
    - 简单分类或提取
    - 高吞吐量、低复杂度任务
    - 速度至关重要
    - 预算有限

**专业建议：** 开发阶段先用 gpt-4o，然后评估更便宜的模型是否适用于你的场景。

---

## 错误处理

```javascript
try {
    await basicCompletion();
} catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes('API key')) {
        console.error("\nMake sure to set your OPENAI_API_KEY in a .env file");
    }
}
```

**常见错误：**
- `401 Unauthorized` - API 密钥无效或缺失
- `429 Too Many Requests` - 超出速率限制
- `500 Internal Server Error` - OpenAI 服务问题
- `Context length exceeded` - 对话中 token 过多

**最佳实践：**
- 始终在异步调用中使用 try-catch
- 检查错误类型并提供有用的提示信息
- 为临时性故障实现重试逻辑
- 监控 token 使用量以避免限制错误

---

## 核心要点

1. **无状态特性：** 模型不会记忆。你每次都需要发送完整上下文。
2. **消息角色：** `system`（行为设定）、`user`（用户输入）、`assistant`（AI 响应）
3. **温度参数：** 控制创造力（0 = 专注，2 = 创意）
4. **流式传输：** 为实时应用提供更好的用户体验
5. **Token 管理：** 监控使用量以控制成本和限制
6. **模型选择：** 根据任务复杂度和预算进行选择
