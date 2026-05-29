# 代码解析：simple-agent-with-memory.js

本示例在简单智能体（Agent）的基础上扩展了**持久化记忆（Persistent Memory）**功能，使其能够在跨会话中记住信息，同时智能地避免重复保存。

## 核心组件

### 1. MemoryManager 导入
```javascript
import {MemoryManager} from "./memory-manager.js";
```
用于将智能体记忆持久化到 JSON 文件的自定义类，支持统一的记忆存储。

### 2. 初始化记忆管理器
```javascript
const memoryManager = new MemoryManager('./agent-memory.json');
const memorySummary = await memoryManager.getMemorySummary();
```
- 从文件加载已有记忆
- 生成格式化的摘要用于系统提示词（System Prompt）
- 处理旧版记忆结构的迁移

### 3. 带推理的记忆感知系统提示词
```javascript
const systemPrompt = `
You are a helpful assistant with long-term memory.

Before calling any function, always follow this reasoning process:

1. **Compare** new user statements against existing memories below.
2. **If the same key and value already exist**, do NOT call saveMemory again.
   - Instead, simply acknowledge the known information.
   - Example: if the user says "My name is Malua" and memory already says "user_name: Malua", reply "Yes, I remember your name is Malua."
3. **If the user provides an updated value** (e.g., "I actually prefer sushi now"), 
   then call saveMemory once to update the value.
4. **Only call saveMemory for genuinely new information.**

When saving new data, call saveMemory with structured fields:
- type: "fact" or "preference"
- key: short descriptive identifier (e.g., "user_name", "favorite_food")
- value: the specific information (e.g., "Malua", "chinua")

Examples:
saveMemory({ type: "fact", key: "user_name", value: "Malua" })
saveMemory({ type: "preference", key: "favorite_food", value: "chinua" })

${memorySummary}
`;
```

**功能说明：**
- 在提示词中包含已有记忆
- 提供明确的推理指导以防止重复保存
- 教导智能体在保存前进行比较
- 指导何时更新已有数据、何时仅作确认

### 4. saveMemory 函数
```javascript
const saveMemory = defineChatSessionFunction({
    description: "Save important information to long-term memory (user preferences, facts, personal details)",
    params: {
        type: "object",
        properties: {
            type: {
                type: "string",
                enum: ["fact", "preference"]
            },
            key: { type: "string" },
            value: { type: "string" }
        },
        required: ["type", "key", "value"]
    },
    async handler({ type, key, value }) {
        await memoryManager.addMemory({ type, key, value });
        return `Memory saved: ${key} = ${value}`;
    }
});
```

**功能说明：**
- 使用结构化的键值对格式存储所有记忆
- 使用同一方法保存事实和偏好
- 自动处理重复项（值变化时自动更新）
- 持久化到 JSON 文件
- 返回确认消息

**参数结构：**
- `type`：类型，可以是 "fact"（事实）或 "preference"（偏好）
- `key`：简短标识符，例如 "user_name"、"favorite_food"
- `value`：实际信息，例如 "Alex"、"pizza"

### 5. 示例对话
```javascript
const prompt1 = "Hi! My name is Alex and I love pizza.";
const response1 = await session.prompt(prompt1, {functions});
// 智能体会调用 saveMemory 两次：
// - saveMemory({ type: "fact", key: "user_name", value: "Alex" })
// - saveMemory({ type: "preference", key: "favorite_food", value: "pizza" })

const prompt2 = "What's my favorite food?";
const response2 = await session.prompt(prompt2, {functions});
// 智能体从记忆中回忆："Pizza"
```

## 记忆工作原理

### 流程图
```
会话 1：
用户："My name is Alex and I love pizza"
  ↓
智能体调用：saveMemory({ type: "fact", key: "user_name", value: "Alex" })
智能体调用：saveMemory({ type: "preference", key: "favorite_food", value: "pizza" })
  ↓
保存至：agent-memory.json

会话 2（重启后）：
1. 从 agent-memory.json 加载记忆
2. 添加到系统提示词中
3. 智能体可以看到："user_name: Alex" 和 "favorite_food: pizza"
4. 可以在回复中使用这些信息

会话 3：
用户："My name is Alex"
  ↓
智能体比较：user_name 已经等于 "Alex"
  ↓
不调用函数！仅作确认："Yes, I remember your name is Alex."
```

## MemoryManager 类

位于 `memory-manager.js`：
```javascript
class MemoryManager {
  async loadMemories()           // 从 JSON 加载（处理结构迁移）
  async saveMemories()           // 写入 JSON
  async addMemory()              // 统一的记忆存储方法
  async getMemorySummary()       // 格式化记忆用于系统提示词
  extractKey()                   // 迁移辅助方法
  extractValue()                 // 迁移辅助方法
}
```

**优势：**
- 单一统一方法处理所有记忆类型
- 自动检测和防止重复
- 信息变化时自动更新值

## 核心概念

### 1. 结构化记忆格式
所有记忆现在使用统一的结构：
```javascript
{
  type: "fact" | "preference",
  key: "user_name",           // 标识符
  value: "Alex",              // 实际数据
  source: "user",             // 来源
  timestamp: "2025-10-29..."  // 保存/更新时间
}
```

### 2. 智能去重
智能体经过训练，能够：
- 在保存前进行**比较**
- 数据相同时**跳过**保存
- 值变化时进行**更新**
- 对已有记忆进行**确认**而非重复保存

### 3. 持久化状态
- 记忆在脚本重启后仍然保留
- 以 JSON 文件形式存储，包含元数据
- 启动时加载并注入到提示词中

### 4. 记忆在系统提示词中的集成
记忆会自动格式化并注入：
```
=== LONG-TERM MEMORY ===

Known Facts:
- user_name: Alex
- location: Paris

User Preferences:
- favorite_food: pizza
- preferred_language: French
```

## 为什么这很重要

**没有记忆：** 智能体每次从零开始，反复询问相同的问题

**有基础记忆：** 智能体能记住信息，但可能会低效地保存重复数据

**有智能记忆：** 智能体能记住信息，并且通过先推理再保存来避免冗余

这使得以下功能成为可能：
- 基于用户历史的**个性化回复**
- **高效的记忆使用**（无重复条目）
- **自然的连续对话**体验
- 保持上下文的**有状态智能体**
- 信息变化时的**自动更新**

## 预期输出

**首次运行：**
```
用户："Hi! My name is Alex and I love pizza."
AI："Nice to meet you, Alex! I've noted that you love pizza."
[调用 saveMemory 两次 - 保存了新信息]
```

**第二次运行（重启后）：**
```
用户："What's my favorite food?"
AI："Your favorite food is pizza! You mentioned that you love it."
[无函数调用 - 从加载的记忆中回忆]
```

**第三次运行（重复陈述）：**
```
用户："My name is Alex."
AI："Yes, I remember your name is Alex!"
[无函数调用 - 识别为重复，仅作确认]
```

**第四次运行（更新信息）：**
```
用户："I actually prefer sushi now."
AI："Got it! I've updated your favorite food to sushi."
[调用 saveMemory 一次 - 更新已有值]
```

## 推理过程

系统提示词明确引导智能体通过以下决策树：
```
新的用户陈述
    ↓
与已有记忆比较
    ↓
    ├─→ 完全匹配？ → 仅确认（不保存）
    ├─→ 值已更新？ → 保存以更新
    └─→ 全新信息？ → 保存为新条目
```

这种"推理优先"的方法使智能体在记忆操作上更加智能和高效！
