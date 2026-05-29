# 代码解析：intro.js

本文件演示了使用 node-llama-cpp 与本地 LLM（大语言模型）进行最基本的交互。

## 逐步代码详解

### 1. 导入所需模块
```javascript
import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";
```
- **getLlama**：用于初始化 llama.cpp 运行时（Runtime）的主函数
- **LlamaChatSession**：用于管理与模型的聊天对话的类
- **fileURLToPath** 和 **path**：标准 Node.js 模块，用于处理文件路径

### 2. 设置目录路径
```javascript
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```
- 由于 ES 模块（ES Modules）默认没有 `__dirname`，我们需要手动创建它
- 这会获取当前文件的目录路径
- 需要它来相对于此脚本定位模型文件

### 3. 初始化 Llama 运行时
```javascript
const llama = await getLlama();
```
- 创建主 llama.cpp 实例
- 这会初始化底层的 C++ 运行时，用于模型推理（Inference）
- 必须在加载任何模型之前完成此操作

### 4. 加载模型
```javascript
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "Qwen3-1.7B-Q8_0.gguf"
    )
});
```
- 加载一个量化（Quantized）模型文件（GGUF 格式）
- **Qwen3-1.7B-Q8_0.gguf**：一个 17 亿参数的模型，量化为 8 位
- 模型存储在仓库根目录的 `models` 文件夹中
- 将模型加载到内存中需要几秒钟

### 5. 创建上下文
```javascript
const context = await model.createContext();
```
- **上下文（Context）** 代表模型的工作记忆
- 它保存对话历史和当前状态
- 有固定的大小限制（默认为模型的最大上下文大小）
- 所有的提示和响应都存储在此上下文中

### 6. 创建聊天会话
```javascript
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
});
```
- **LlamaChatSession**：用于聊天式交互的高级 API
- 使用上下文中的一个序列（Sequence）来维护对话状态
- 自动处理提示格式化和响应解析

### 7. 定义提示
```javascript
const prompt = `do you know node-llama-cpp`;
```
- 一个简单的问题，用于测试模型是否了解我们正在使用的库
- 这将被发送给模型进行处理

### 8. 发送提示并获取响应
```javascript
const a1 = await session.prompt(prompt);
console.log("AI: " + a1);
```
- **session.prompt()**：将提示发送给模型并等待完成
- 模型根据其训练生成响应
- 我们将响应以 "AI:" 前缀打印到控制台

### 9. 清理资源
```javascript
session.dispose()
context.dispose()
model.dispose()
llama.dispose()
```
- **重要**：完成后务必释放资源（Dispose）
- 释放内存和 GPU 资源
- 防止长时间运行的应用程序出现内存泄漏（Memory Leak）
- 必须按此顺序执行（session → context → model → llama）

## 演示的关键概念

1. **基本 LLM 初始化**：加载模型并创建推理上下文
2. **简单提示**：发送问题并接收响应
3. **资源管理**：正确清理已分配的资源

## 预期输出

运行此脚本时，你应该会看到类似以下的输出：
```
AI: Yes, I'm familiar with node-llama-cpp. It's a Node.js binding for llama.cpp...
```

具体响应会因模型的训练数据和生成参数而有所不同。
