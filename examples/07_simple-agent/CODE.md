# 代码解析：simple-agent.js

本文件演示了**函数调用（Function Calling）** - 这是将大语言模型（LLM）从文本生成器转变为能够使用工具执行操作的智能体（Agent）的核心功能。

## 逐步代码解析

### 1. 导入与设置（第 1-7 行）
```javascript
import {defineChatSessionFunction, getLlama, LlamaChatSession} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
import {PromptDebugger} from "../helper/prompt-debugger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;
```
- **defineChatSessionFunction**：用于创建可调用函数的关键导入
- **PromptDebugger**：用于调试提示词的辅助工具（末尾会详细介绍）
- **debug**：控制详细日志输出

### 2. 初始化并加载模型（第 9-17 行）
```javascript
const llama = await getLlama({debug});
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q8_0.gguf"
    )
});
const context = await model.createContext({contextSize: 2000});
```
- 使用 Qwen3-1.7B 模型（适合函数调用）
- 显式设置上下文大小为 2000 个 token

### 3. 时间转换的系统提示词（第 20-23 行）
```javascript
const systemPrompt = `You are a professional chronologist who standardizes time representations across different systems.
    
Always convert times from 12-hour format (e.g., "1:46:36 PM") to 24-hour format (e.g., "13:46") without seconds 
before returning them.`;
```

**作用：**
- 定义智能体的角色和行为
- 指定输出格式（24 小时制，不含秒数）
- 确保时间表示的一致性

### 4. 创建会话（第 25-28 行）
```javascript
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
});
```
带有系统提示词的标准会话。

### 5. 定义工具函数（第 30-39 行）
```javascript
const getCurrentTime = defineChatSessionFunction({
    description: "Get the current time",
    params: {
        type: "object",
        properties: {}
    },
    async handler() {
        return new Date().toLocaleTimeString();
    }
});
```

**详细解析：**

**description：**
- 告诉大语言模型这个函数的功能
- 大语言模型根据此描述决定何时调用

**params：**
- 定义函数参数（JSON Schema 格式）
- 空的 `properties: {}` 表示不需要参数
- 即使没有属性，type 也必须是 "object"

**handler：**
- 实际执行的 JavaScript 函数
- 以字符串形式返回当前时间（例如 "1:46:36 PM"）
- 可以是异步函数（内部可使用 await）

### 函数调用的工作原理

```
1. 用户提问："现在几点了？"
2. 大语言模型读取：
   - 系统提示词
   - 可用函数（getCurrentTime）
   - 函数描述
3. 大语言模型决定："我应该调用 getCurrentTime()"
4. 库执行：handler()
5. handler 返回："1:46:36 PM"
6. 大语言模型以"工具输出"的形式接收结果
7. 大语言模型处理：根据系统提示词转换为 24 小时制
8. 大语言模型回复："13:46"
```

### 6. 注册函数（第 41 行）
```javascript
const functions = {getCurrentTime};
```
- 创建包含所有可用函数的对象
- 多个函数的写法：`{getCurrentTime, getWeather, calculate, ...}`
- 大语言模型可以选择调用哪个函数

### 7. 定义用户提示词（第 42 行）
```javascript
const prompt = `What time is it right now?`;
```
一个需要使用工具来回答的问题。

### 8. 带函数执行（第 45 行）
```javascript
const a1 = await session.prompt(prompt, {functions});
console.log("AI: " + a1);
```
- **{functions}** 使工具对大语言模型可用
- 大语言模型会在需要时自动调用 getCurrentTime
- 回复包含大语言模型处理后的工具结果

### 9. 调试提示词上下文（第 49-55 行）
```javascript
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'qwen_prompts.txt',
    includeTimestamp: true,
    appendMode: false
});
await promptDebugger.debugContextState({session, model});
```

**功能说明：**
- 保存发送给模型的完整提示词
- 准确显示大语言模型看到的内容（包括函数定义）
- 有助于调试模型为何调用或不调用函数
- 写入 `./logs/qwen_prompts_[timestamp].txt`

### 10. 清理资源（第 58-61 行）
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
标准的资源清理操作。

## 演示的关键概念

### 1. 函数调用（工具使用）

这正是使其成为"智能体"的关键：
```
没有工具：                有工具：
LLM → 仅输出文本         LLM → 可以执行操作
                              ↓
                       调用函数
                       访问数据
                       执行代码
```

### 2. 函数定义模式

```javascript
defineChatSessionFunction({
    description: "函数的功能描述",       // 大语言模型会读取此内容
    params: {                           // 期望的参数
        type: "object",
        properties: {
            paramName: {
                type: "string",
                description: "此参数的用途"
            }
        },
        required: ["paramName"]
    },
    handler: async (params) => {        // 你的代码
        // 使用参数执行操作
        return result;
    }
});
```

### 3. 参数的 JSON Schema

使用标准的 JSON Schema：
```javascript
// 无参数
properties: {}

// 单个字符串参数
properties: {
    city: {
        type: "string",
        description: "City name"
    }
}

// 多个参数
properties: {
    a: { type: "number" },
    b: { type: "number" }
},
required: ["a", "b"]
```

### 4. 智能体的决策过程

```
用户："现在几点了？"
         ↓
    大语言模型思考：
    "我需要获取当前时间"
    "我看到函数：getCurrentTime"
    "描述与我的需求匹配"
         ↓
    大语言模型输出特殊格式：
    {function_call: "getCurrentTime"}
         ↓
    库拦截并执行 handler()
         ↓
    handler 返回："1:46:36 PM"
         ↓
    大语言模型接收：工具结果
         ↓
    大语言模型应用系统提示词：
    转换为 24 小时制
         ↓
    最终回答："13:46"
```

## 使用场景

### 1. 信息检索
```javascript
const getWeather = defineChatSessionFunction({
    description: "Get weather for a city",
    params: {
        type: "object",
        properties: {
            city: { type: "string" }
        }
    },
    handler: async ({city}) => {
        return await fetchWeather(city);
    }
});
```

### 2. 计算
```javascript
const calculate = defineChatSessionFunction({
    description: "Perform arithmetic calculation",
    params: {
        type: "object",
        properties: {
            expression: { type: "string" }
        }
    },
    handler: async ({expression}) => {
        return eval(expression); // （注意 eval 的安全性！）
    }
});
```

### 3. 数据访问
```javascript
const queryDatabase = defineChatSessionFunction({
    description: "Query user database",
    params: {
        type: "object",
        properties: {
            userId: { type: "string" }
        }
    },
    handler: async ({userId}) => {
        return await db.users.findById(userId);
    }
});
```

### 4. 外部 API
```javascript
const searchWeb = defineChatSessionFunction({
    description: "Search the web",
    params: {
        type: "object",
        properties: {
            query: { type: "string" }
        }
    },
    handler: async ({query}) => {
        return await googleSearch(query);
    }
});
```

## 预期输出

运行时：
```
AI: 13:46
```

大语言模型：
1. 内部调用了 getCurrentTime()
2. 获取到 "1:46:36 PM"
3. 转换为 24 小时制
4. 去掉秒数
5. 返回 "13:46"

## 使用 PromptDebugger 进行调试

调试输出显示了包含函数 schema 的完整提示词：
```
System: You are a professional chronologist...

Functions available:
- getCurrentTime: Get the current time
  Parameters: (none)

User: What time is it right now?
```

这有助于调试：
- 模型是否看到了该函数？
- 描述是否清晰？
- 参数是否符合预期？

## 这对 AI 智能体的意义

### 智能体 = 大语言模型 + 工具

```
仅大语言模型：                大语言模型 + 工具：
├─ 生成文本                   ├─ 生成文本
└─ 仅此而已                   ├─ 访问真实数据
                              ├─ 执行计算
                              ├─ 调用 API
                              ├─ 执行操作
                              └─ 与世界交互
```

### 复杂智能体的基础

这个简单示例是以下智能体的基础：
- **研究型智能体**：搜索网页、阅读文档
- **编程智能体**：运行代码、检查错误
- **个人助手**：日历、邮件、提醒
- **分析型智能体**：查询数据库、计算统计数据

一切都从基本的函数调用开始！

## 最佳实践

1. **清晰的描述**：大语言模型根据描述决定何时调用
2. **类型安全**：正确使用 JSON Schema
3. **错误处理**：handler 应捕获错误
4. **返回字符串**：大语言模型处理文本效果最佳
5. **保持函数职责单一**：每个函数一个明确的目的

这就是最小可行的智能体：一个大语言模型 + 一个工具 + 正确的配置。
