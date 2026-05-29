# 代码解析：react-agent.js

本示例实现了 **ReAct 模式**（Reasoning + Acting），这是一种用于借助工具进行多步骤问题求解的强大方法。

## 什么是 ReAct？

ReAct = **Rea**soning（推理）+ **Act**ing（行动）

智能体（Agent）在以下步骤之间交替执行：
1. **思考**（推理接下来该做什么）
2. **行动**（使用工具）
3. **观察**（查看工具返回结果）
4. 重复以上步骤直到问题解决

## 核心组件

### 1. ReAct 系统提示词（第 20-52 行）
```javascript
const systemPrompt = `You are a mathematical assistant that uses the ReAct approach.

CRITICAL: You must follow this EXACT pattern:

Thought: [Explain what calculation you need]
Action: [Call ONE tool]
Observation: [Wait for result]
Thought: [Analyze result]
Action: [Call another tool if needed]
...
Thought: [Once you have all information]
Answer: [Final answer and STOP]
```

**关键指令：**
- 明确的逐步推理模式
- 每次只调用一个工具
- 持续执行直到得出最终答案
- 在 "Answer:" 之后停止

### 2. 计算器工具（第 60-159 行）

四个基本数学运算：
```javascript
const add = defineChatSessionFunction({...});
const multiply = defineChatSessionFunction({...});
const subtract = defineChatSessionFunction({...});
const divide = defineChatSessionFunction({...});
```

每个工具：
- 接收两个数字（a, b）
- 执行运算
- 记录调用日志
- 以字符串形式返回结果

### 3. ReAct 智能体循环（第 164-212 行）

```javascript
async function reactAgent(userPrompt, maxIterations = 10) {
    let iteration = 0;
    let fullResponse = "";
    
    while (iteration < maxIterations) {
        iteration++;
        
        // Prompt the LLM
        const response = await session.prompt(
            iteration === 1 ? userPrompt : "Continue your reasoning.",
            {
                functions,
                maxTokens: 300,
                onTextChunk: (chunk) => {
                    process.stdout.write(chunk);  // Stream output
                    currentChunk += chunk;
                }
            }
        );
        
        fullResponse += currentChunk;
        
        // Check if final answer reached
        if (response.toLowerCase().includes("answer:")) {
            return fullResponse;
        }
    }
}
```

**工作原理：**
1. 循环最多执行 maxIterations 次
2. 第一次迭代：发送用户的问题
3. 后续迭代：请求继续推理
4. 实时流式输出
5. 当出现 "Answer:" 时停止
6. 返回完整的推理过程

### 4. 示例查询（第 215-220 行）

```javascript
const queries = [
    "A store sells 15 items Monday at $8 each, 20 items Tuesday at $8 each, 
     10 items Wednesday at $8 each. What's the average items per day and total revenue?"
];
```

需要多次计算的复杂问题：
- 15 × 8
- 20 × 8
- 10 × 8
- 求和
- 计算平均值
- 格式化答案

## ReAct 流程

### 执行示例

```
用户："一家商店以每件 $8 的价格卖出 15 件商品，以每件 $8 的价格卖出 20 件商品。总收入是多少？"

迭代 1：
Thought: 首先我需要计算 15 × 8
Action: multiply(15, 8)
Observation: 120

迭代 2：
Thought: 现在我需要计算 20 × 8
Action: multiply(20, 8)
Observation: 160

迭代 3：
Thought: 现在我需要将两个结果相加
Action: add(120, 160)
Observation: 280

迭代 4：
Thought: 我已经得到了总收入
Answer: 总收入为 $280
```

**循环停止**，因为检测到了 "Answer:"。

## 为什么 ReAct 有效

### 传统方式（失败）
```
用户："复杂的数学问题"
LLM：[试图在脑中计算]
→ 经常因算术错误而得出错误结果
```

### ReAct 方式（成功）
```
用户："复杂的数学问题"
LLM："我需要计算 X"
  → 调用计算器工具
  → 获得准确结果
  → 使用结果进行下一步
  → 持续执行直到解决
```

## 核心概念

### 1. 显式推理
智能体必须"展示推理过程"：
```
Thought: 我需要做什么？
Action: 执行操作
Observation: 发生了什么？
```

### 2. 每步都使用工具
```
不要心算：15 × 8 = 120（可能出错）
使用工具：multiply(15, 8) → 120（始终正确）
```

### 3. 迭代式问题求解
```
复杂问题 → 分解为步骤 → 逐步求解 → 合并结果
```

### 4. 自我纠错
智能体可以观察到错误结果并重试：
```
Thought: 这个结果看起来不对
Action: 让我重新计算
```

## 调试输出

代码中包含 PromptDebugger（第 228-234 行）：
```javascript
const promptDebugger = new PromptDebugger({
    outputDir: './logs',
    filename: 'react_calculator.txt',
    includeTimestamp: true
});
await promptDebugger.debugContextState({session, model});
```

将完整的提示词历史保存到日志中，便于调试。

## 预期输出

```
========================================================
USER QUESTION: [问题描述]
========================================================

--- 迭代 1 ---
Thought: 首先我需要将 15 乘以 8
Action: multiply(15, 8)

   🔧 TOOL CALLED: multiply(15, 8)
   📊 RESULT: 120

Observation: 120

--- 迭代 2 ---
Thought: 现在我需要将 20 乘以 8
Action: multiply(20, 8)

   🔧 TOOL CALLED: multiply(20, 8)
   📊 RESULT: 160

... 继续 ...

--- 迭代 N ---
Thought: 我已经获得了所有信息
Answer: [最终答案]

========================================================
FINAL ANSWER REACHED
========================================================
```

## 为什么这很重要

### 实现复杂任务
- 多步推理
- 精确计算
- 自我纠错
- 透明的过程

### 现代智能体的基础
该模式驱动了：
- LangChain 智能体
- AutoGPT
- BabyAGI
- 大多数生产级智能体框架

### 可观测的推理
与"黑盒"大语言模型（LLM）不同，你可以看到：
- 智能体在思考什么
- 它使用了哪些工具
- 它为什么做出决策
- 哪里可能出错

## 最佳实践

1. **清晰的系统提示词**：定义确切的模式
2. **每个动作只调用一个工具**：不要合并操作
3. **限制迭代次数**：防止无限循环
4. **流式输出**：展示进度
5. **充分调试**：使用 PromptDebugger

## 对比

```
简单智能体 vs ReAct 智能体
────────────────────────────
单次提示/响应              多步迭代
一次工具调用（可能）       多次工具调用
无可见推理                 显式推理
适用于简单任务             处理复杂问题
```

这是构建强大 AI 智能体的前沿模式！
