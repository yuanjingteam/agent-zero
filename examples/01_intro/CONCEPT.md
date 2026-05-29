# 概念：基本 LLM 交互

## 概述

本示例介绍了在本地机器上运行大语言模型（LLM，Large Language Model）的基本概念。它演示了最简单的交互方式：加载模型并向它提问。

## 什么是本地 LLM？

**本地 LLM（Local LLM）** 是一种完全在你自己的计算机上运行的 AI 语言模型，无需互联网连接或外部 API 调用。主要优势：

- **隐私**：你的数据永远不会离开你的机器
- **成本**：无需按 token 支付 API 费用
- **控制**：完全控制模型选择和参数
- **离线**：无需互联网连接即可工作

## 核心组件

### 1. 模型文件（GGUF 格式）

```
┌─────────────────────────────┐
│   Qwen3-1.7B-Q8_0.gguf     │
│   (Model Weights File)      │
│                             │
│  • Stores learned patterns  │
│  • Quantized for efficiency │
│  • Loaded into RAM/VRAM     │
└─────────────────────────────┘
```

- **GGUF**：为 llama.cpp 优化的文件格式
- **量化（Quantization）**：减小模型大小（例如，8 位代替 16 位）
- **权衡**：更小的体积和更快的速度 vs. 略微的质量损失

### 2. 推理管道

```
User Input → Model → Generation → Response
    ↓          ↓          ↓           ↓
 "Hello"   Context   Sampling    "Hi there!"
```

**流程图：**
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Prompt  │ --> │ Context  │ --> │  Model   │ --> │ Response │
│          │     │ (Memory) │     │(Weights) │     │  (Text)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 3. 上下文窗口

**上下文（Context）** 是模型的工作记忆：

```
┌─────────────────────────────────────────┐
│           Context Window                │
│  ┌─────────────────────────────────┐   │
│  │ System Prompt (if any)          │   │
│  ├─────────────────────────────────┤   │
│  │ User: "do you know node-llama?" │   │
│  ├─────────────────────────────────┤   │
│  │ AI: "Yes, I'm familiar..."      │   │
│  ├─────────────────────────────────┤   │
│  │ (Space for more conversation)   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- 大小有限（例如 2048、4096 或 8192 个 token）
- 当上下文已满时，必须移除旧消息
- 所有先前的消息都会影响下一个响应

## LLM 如何生成响应

### 逐 Token 生成

LLM 不会一次性生成整个句子。它们一次预测一个 **token（词元）**：

```
Prompt: "What is AI?"

Generation Process:
"What is AI?" → [Model] → "AI"
"What is AI? AI" → [Model] → "is"
"What is AI? AI is" → [Model] → "a"
"What is AI? AI is a" → [Model] → "field"
... continues until stop condition
```

**可视化：**
```
Input Prompt
     ↓
┌────────────┐
│   Model    │ → Token 1: "AI"
│ Processes  │ → Token 2: "is"
│   & Predicts│ → Token 3: "a"
└────────────┘ → Token 4: "field"
                → ...
```

## AI Agent 的关键概念

### 1. 无状态处理
- 每个提示都是独立的，除非你主动维护上下文
- 模型在不同脚本运行之间没有记忆
- 要构建一个"Agent（智能体）"，你需要：
  - 在提示之间保持上下文活跃
  - 维护对话历史
  - 添加工具/函数（在后续示例中介绍）

### 2. 提示工程基础
你提问的方式会影响响应：

```
❌ 不佳: "node-llama-cpp"
✅ 较好: "do you know node-llama-cpp"
✅ 最佳: "Explain what node-llama-cpp is and how it works"
```

### 3. 资源管理
LLM 会消耗大量资源：

```
Model Loading
     ↓
┌─────────────────┐
│  RAM/VRAM Usage │  ← Models need gigabytes
│  CPU/GPU Time   │  ← Inference takes time
│  Memory Leaks?  │  ← Must cleanup properly
└─────────────────┘
     ↓
Proper Disposal
```

## 为什么这对 Agent 很重要

这个基本示例为 AI Agent 奠定了基础：

1. **Agent 需要 LLM 来"思考"**：模型处理信息并生成响应
2. **Agent 需要上下文**：在交互过程中维护状态
3. **Agent 需要结构**：后续示例将添加工具、记忆和推理循环

## 下一步

理解基本提示之后，可以探索：
- **系统提示（System Prompts）**：为模型赋予特定角色或行为
- **函数调用（Function Calling）**：允许模型使用工具
- **记忆（Memory）**：跨会话持久化信息
- **推理模式（Reasoning Patterns）**：如 ReAct（推理 + 行动）

## 图解：完整架构

```
┌──────────────────────────────────────────────────┐
│            Your Application                      │
│  ┌────────────────────────────────────────────┐ │
│  │         node-llama-cpp Library             │ │
│  │  ┌──────────────────────────────────────┐  │ │
│  │  │      llama.cpp (C++ Runtime)         │  │ │
│  │  │  ┌────────────────────────────────┐  │  │ │
│  │  │  │   Model File (GGUF)            │  │  │ │
│  │  │  │   • Qwen3-1.7B-Q8_0.gguf       │  │  │ │
│  │  │  └────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
           ↕
    ┌──────────────┐
    │  CPU / GPU   │
    └──────────────┘
```

这种分层架构允许你在基本 LLM 交互之上构建复杂的 AI Agent。
