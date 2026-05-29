# 代码解析：translation.js

本文件演示如何使用**系统提示词（System Prompts）**将 AI 智能体（Agent）专门化以执行特定任务——在本例中是专业的德语翻译。

## 逐步代码解析

### 1. 导入所需模块
```javascript
import {
  getLlama, LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
```
- 导入内容与入门示例相同

### 2. 初始化并加载模型
```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "hf_giladgd_Apertus-8B-Instruct-2509.Q6_K.gguf"
    )
});
```

#### 为什么选择 Apertus-8B？
Apertus-8B 是一个多语言（Multilingual）语言模型，专门针对超过 1,000 种语言进行了训练，其中 40% 的训练数据为非英语语言。这使其成为翻译任务的理想选择，原因如下：

1. **大规模多语言覆盖**：该模型基于 15 万亿个 token、涵盖 1,811 种原生支持语言进行训练，包括瑞士德语和罗曼什语等低资源语言
2. **更大的模型规模**：拥有 80 亿参数，比 intro.js 示例中的模型更大，提供更好的理解和输出质量
3. **面向翻译的训练**：该模型明确针对包括翻译系统在内的应用场景设计
4. **Q6_K 量化（Quantization）**：6 位量化在质量和文件大小之间取得了良好平衡

**实验建议**：尝试替换其他模型来比较翻译质量！例如：
- 使用较小的 3B 模型，观察模型大小对翻译准确度的影响
- 使用单语模型来展示多语言训练的重要性
- 使用没有翻译专项训练的通用模型

了解更多关于 Apertus 的信息，请参阅 [arXiv](https://arxiv.org/abs/2509.14233)

### 3. 创建上下文和带有系统提示词的聊天会话
```javascript
const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: `Du bist ein erfahrener wissenschaftlicher Übersetzer...`
});
```

**与 intro.js 的关键区别**：**系统提示词（System Prompt）**！

#### 什么是系统提示词？
系统提示词定义了智能体的角色、行为和规则。就像给 AI 一份岗位描述：

```
┌─────────────────────────────────────┐
│       系统提示词                     │
│  "你是一名专业翻译"                  │
│  + 详细指令                         │
│  + 遵循的规则                       │
└─────────────────────────────────────┘
         ↓
    影响每次回复
```

### 4. 系统提示词解析

该系统提示词（用德语编写）告诉模型：

**角色：**
```
"Du bist ein erfahrener wissenschaftlicher Übersetzer für technische Texte 
aus dem Englischen ins Deutsche."
```
翻译："你是一名经验丰富的技术文本科学翻译，负责将英语翻译为德语。"

**任务：**
```
"Deine Aufgabe: Erstelle eine inhaltlich exakte Übersetzung..."
```
翻译："你的任务：创建一个内容精确的翻译，保持完整含义和技术精度。"

**规则（第 33-41 行）：**
1. 精确保留每一条技术表述
2. 使用地道、流畅的德语
3. 避免逐字直译的句子结构
4. 使用正确的术语（如 "Multi-Agenten-System"）
5. 使用德语排版规范处理数字（如 "54 %"）
6. 将复合术语适配德语语法
7. 在保持含义的前提下缩短过于复杂的句子
8. 使用中立、科学的风格

**关键指令（第 48 行）：**
```
"DO NOT add any addition text or explanation. ONLY respond with the translated text"
```
- 强制模型仅返回翻译结果
- 不添加"以下是翻译："之类的前缀
- 不添加解释或评论

### 5. 翻译查询
```javascript
const q1 = `Translate this text into german: 

We address the long-horizon gap in large language model (LLM) agents by en-
abling them to sustain coherent strategies in adversarial, stochastic environments.
...
`;
```
- 包含一篇关于 LLM 智能体的科学摘要（HexMachina 论文）
- 复杂的技术内容，包含专业术语
- 测试模型的以下能力：
  - 理解 AI/ML 技术概念
  - 准确翻译
  - 遵循详细的系统提示词规则

### 6. 执行翻译
```javascript
const a1 = await session.prompt(q1);
console.log("AI: " + a1);
```
- 将翻译请求发送给模型
- 模型将会：
  1. 读取系统提示词（其"角色"）
  2. 读取用户的请求
  3. 应用系统提示词中的所有规则
  4. 生成德语翻译

### 7. 清理资源
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
- 与 intro.js 相同的清理过程
- 完成后务必释放资源

## 演示的核心概念

### 1. 用系统提示词实现专门化
系统提示词将通用的 LLM 转变为专门化的智能体：

```
通用 LLM + 系统提示词 = 专门化智能体
                         （翻译器、编码器、分析器等）
```

### 2. 详细指令很重要
比较以下两种方式：

**❌ 简略方式：**
```javascript
systemPrompt: "Translate to German"
```

**✅ 本示例（详细方式）：**
```javascript
systemPrompt: `
  You are a professional translator
  Follow these rules:
  - Rule 1
  - Rule 2
  - Rule 3
  ...
`
```

详细的方式能产生更好、更一致的结果。

### 3. 约束输出格式
"DO NOT add any addition text" 这一行演示了输出控制：

**无约束时：**
```
AI: 以下是您提供文本的翻译：

[德语文本]

希望对您有帮助！如有其他需要请告诉我。
```

**有约束时：**
```
AI: [仅德语文本]
```

## 为什么这是一个"智能体"？

这是一个**专门化智能体**，因为：

1. **特定角色**：有明确的目的（翻译）
2. **受约束的行为**：遵循特定的规则和准则
3. **一致的输出**：产生可预测、格式化的结果
4. **领域专长**：针对科学/技术内容进行优化

## 预期输出

运行后，您将看到英文摘要的德语翻译，遵循所有规则：
- 规范的德语科学风格
- 正确的技术术语
- 德语数字格式（如 "54 %"）
- 无额外评论

翻译质量取决于模型的训练数据和规模。

## 实验建议

1. **尝试不同的模型**：
  - 将 Apertus-8B 替换为较小的模型（3B），观察模型规模的影响
  - 尝试单语英语模型，展示多语言训练的重要性
  - 使用不同量化级别（Q4、Q6、Q8）的模型来比较质量与体积的关系

2. **修改系统提示词**：
  - 逐一移除特定规则，观察其影响
  - 更改翻译目标语言
  - 调整风格（正式 vs. 随意）

3. **用不同内容测试**：
  - 技术文档
  - 创意写作
  - 商务沟通
  - 简单句 vs. 复杂句

每个实验都将帮助您理解系统提示词、模型选择和提示词工程（Prompt Engineering）如何协同工作，以创建高效的 AI 智能体。
