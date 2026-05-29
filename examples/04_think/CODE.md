# 代码解析：think.js

本文件演示了如何使用系统提示词（System Prompt）实现**逻辑推理**和**定量问题求解**，展示如何将大语言模型（LLM）配置为专用的推理智能体。

## 逐步代码解析

### 1. 导入与初始化（第 1-8 行）
```javascript
import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
- 用于 LLM 交互的标准导入
- 设置路径以定位模型文件

### 2. 初始化并加载模型（第 10-18 行）
```javascript
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q6_K.gguf"
    )
});
```
- 使用 **Qwen3-1.7B-Q6_K**：一个具有 6 位量化的 17 亿参数模型
- 比翻译示例中的模型更小（17 亿参数 vs 80 亿参数）
- Q6_K 量化在模型大小和质量之间取得了平衡

### 3. 定义系统提示词（第 19-24 行）
```javascript
const systemPrompt = `You are an expert logical and quantitative reasoner.
    Your goal is to analyze real-world word problems involving families, quantities, averages, and relationships 
    between entities, and compute the exact numeric answer.
    
    Goal: Return the correct final number as a single value — no explanation, no reasoning steps, just the answer.
    `
```

**关键要素：**

1. **角色**："expert logical and quantitative reasoner"（专业的逻辑与定量推理者）
   - 设定数学/分析思维的期望

2. **任务范围**："real-world word problems involving families, quantities, averages, and relationships"（涉及家庭、数量、平均值和实体关系的真实世界应用题）
   - 告知模型预期的问题类型
   - 为复杂的计数和计算任务做准备

3. **输出约束**："Return the correct final number as a single value — no explanation"（以单个值返回正确的最终数字——无需解释）
   - 强制输出简洁
   - 只需答案，无需推理过程

### 为什么这样设计系统提示词？

该提示词针对特定问题类型而设计：
- 具有复杂家庭关系的应用题
- 多重嵌套条件
- 需要仔细追踪人数和数量
- 需要算术计算

### 4. 创建上下文和会话（第 25-29 行）
```javascript
const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt
});
```
- 为对话创建上下文
- 使用推理系统提示词初始化会话
- 无需聊天包装器（使用模型的默认格式）

### 5. 复杂应用题（第 31-40 行）
```javascript
const prompt = `My family reunion is this week, and I was assigned the mashed potatoes to bring. 
The attendees include my married mother and father, my twin brother and his family, my aunt and her family, my grandma 
and her brother, her brother's daughter, and his daughter's family. All the adults but me have been married, and no one 
is divorced or remarried, but my grandpa and my grandma's sister-in-law passed away last year. All living spouses are attending. 
My brother has two children that are still kids, my aunt has one six-year-old, and my grandma's brother's daughter has 
three kids under 12. I figure each adult will eat about 1.5 potatoes and each kid will eat about 1/2 a potato, except my 
second cousins don't eat carbs. The average potato is about half a pound, and potatoes are sold in 5-pound bags. 

How many whole bags of potatoes do I need? 
`;
```

**这道题故意设计得很复杂以测试推理能力：**

**需要统计的人：**
- 说话者本人（1 人）
- 母亲和父亲（2 人）
- 双胞胎兄弟 + 配偶（2 人）
- 兄弟的 2 个孩子（2 人）
- 阿姨 + 配偶（2 人）
- 阿姨的 1 个孩子（1 人）
- 祖母（1 人）
- 祖母的兄弟 + 配偶（2 人）
- 兄弟的女儿 + 配偶（2 人）
- 他们的 3 个孩子（3 人，但不吃碳水化合物）

**需要的计算步骤：**
1. 统计成人总数
2. 统计儿童总数
3. 减去不进食的儿童
4. 计算土豆需求量：（成人 × 1.5）+（进食的儿童 × 0.5）
5. 换算为磅：土豆总数 × 0.5 磅
6. 换算为袋数：磅数 ÷ 5，向上取整

**复杂之处：**
- 家庭关系（谁和谁结婚了）
- 已故人员（从计数中减去）
- 特殊饮食需求（表亲不吃碳水化合物）
- 单位换算（土豆 → 磅 → 袋）

### 6. 执行并显示结果（第 42-43 行）
```javascript
const answer = await session.prompt(prompt);
console.log(`AI: ${answer}`);
```
- 将复杂问题发送给模型
- 模型运用其推理能力来解决问题
- 仅输出最终数字（基于系统提示词的设定）

### 7. 资源清理（第 45-48 行）
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
- 标准的资源清理操作

## 演示的关键概念

### 1. 推理智能体配置
本示例展示了如何为分析思维配置大语言模型：

```
系统提示词 → LLM 变成"推理引擎"
```

我们得到的不是对话式 AI，而是：
- 专注的分析处理能力
- 数学计算能力
- 逻辑推理能力

### 2. 输出格式控制
比较以下两种方式：

**无约束时：**
```
AI: 让我一步步来解决这个问题。
首先，我会数一下成年人...
[冗长的解释]
所以答案是 3 袋。
```

**有约束时（本示例）：**
```
AI: 3
```

### 3. 问题复杂度测试
本示例测试模型的以下能力：
- 解析复杂自然语言
- 追踪多个实体和关系
- 执行算术运算
- 处理边界情况（已故人员、饮食限制）
- 进行单位换算

### 4. 专用任务智能体
本示例演示了如何创建特定任务的智能体：

```
通用 LLM + "推理智能体"系统提示词 = 数学问题求解器
```

同样的模式适用于：
- 逻辑谜题
- 数据分析
- 科学计算
- 统计推理

## 挑战与局限性

### 1. 模型大小很重要
17 亿参数的模型可能在以下方面表现欠佳：
- 非常复杂的计数问题
- 需要工作记忆的多步推理
- 问题中的边界情况

更大的模型（70 亿、130 亿以上参数）在推理任务上通常表现更好。

### 2. 隐藏的推理过程
系统提示词要求"只给答案"，因此我们无法看到：
- 模型的推理过程
- 它可能在哪里犯了错误
- 它的置信度

### 3. 没有工具使用
模型必须"在脑中"完成所有计算，无法借助：
- 计算器
- 笔记
- 逐步验证

后续示例（如 react-agent）通过为模型提供工具来解决这个问题。

## 这对 AI 智能体为何重要

### 推理是基础
所有有用的智能体都需要推理能力：
- **规划智能体**：推理行动序列
- **研究智能体**：分析和综合信息
- **决策智能体**：评估选项和后果

### 系统提示词塑造行为
本示例表明，同一个模型可以基于不同的指令表现出不同的行为：
- 翻译智能体（前一个示例）
- 推理智能体（本示例）
- 代码智能体（后续示例）

### 复杂智能体的基础
在添加以下功能之前，理解如何通过提示词实现推理至关重要：
- 工具（给模型一个计算器）
- 记忆（记住之前的计算结果）
- 多步流程（ReAct 模式）

## 预期输出

运行此脚本应输出类似以下内容：
```
AI: 3
```

具体答案取决于模型的以下能力：
- 正确统计所有家庭成员
- 应用进食比例
- 进行单位换算
- 对整袋数进行向上取整

## 改进方法

要获得更好的推理效果：
1. **使用更大的模型**：70 亿以上参数
2. **添加逐步提示**："展示你的推理过程"
3. **提供工具**：给模型一个计算器
4. **使用思维链**：鼓励显式推理
5. **验证答案**：多次运行或使用多个模型

react-agent 示例展示了其中一些改进方法。
