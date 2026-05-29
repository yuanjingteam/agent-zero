# 代码讲解：error-handling.js

本文件演示了**面向智能体（Agent）程序的全面错误处理**：类型化的错误分类体系、带退避策略的超时与重试、模拟工具故障、LLM 路径失败时的**降级模式（Degraded Mode）**，以及编排中断时的 **`AgentWorkflowError`**。它使用 **`node-llama-cpp`** 和 GGUF 模型在本地运行（与其他智能体示例使用相同的技术栈）。

**运行：** `node examples/11_error-handling/error-handling.js`

---

## 逐步代码拆解

### 1. 导入

```javascript
import crypto from "node:crypto";
import { defineChatSessionFunction, getLlama, LlamaChatSession } from "node-llama-cpp";
import { fileURLToPath } from "url";
import path from "path";
```

**作用说明：**
- **`crypto`** — 为关联 ID（Correlation ID）生成 UUID（`randomUUID`），并为重试延迟生成抖动值（`randomInt`）。
- **`node-llama-cpp`** — 加载模型、聊天会话，以及用于工具定义的 **`defineChatSessionFunction`**。
- **`url` / `path`** — 在 ES 模块中解析 **`__dirname`**，并拼接指向 **`.gguf`** 文件的路径。

---

### 2. 错误分类体系

```javascript
class AppError extends Error { /* code, userMessage, retryable, details, cause */ }
class ValidationError extends AppError { /* VALIDATION_ERROR */ }
class LLMCallError extends AppError { /* LLM_CALL_FAILED; optional model */ }
class ToolExecutionError extends AppError { /* TOOL_EXECUTION_FAILED; toolName */ }
class AgentWorkflowError extends AppError { /* AGENT_WORKFLOW_FAILED; step */ }
```

**用途：**
- **`AppError`** — 为日志、重试和面向用户的文本提供统一的错误结构：稳定的 **`code`**、安全的 **`userMessage`**、结构化的 **`details`**、可选的 **`cause`**。
- 子类设置了合理的默认值（例如验证错误不可重试；工具错误通常也不可重试，除非显式传入 **`retryable: true`**）。
- **`AgentWorkflowError`** 新增了 **`step`** 字段（如 `policy_guard`、`resolve_user_profile`），用于编排级别的失败。源码注释解释了这个类如何在小型演示中替代策略/工作流/系统级别的错误。

---

### 3. `sleep`

基于 `Promise` 的简单延迟。被 **`withRetries`** 在重试间隔中使用，也用于模拟"网络"工具内部的延迟。

---

### 4. `withTimeout`

使用 **`Promise.race`** 在实际工作和计时器之间竞争。超时时，抛出一个 **`AppError`**，错误码为 **`TIMEOUT`**，**`retryable: true`**，**`details: { label, ms }`**。计时器在 **`finally`** 中清除。

**为什么重要：** 每个可能挂起的 LLM 或工具调用都应该有时间限制，这样智能体可以恢复而不是永远停滞。

---

### 5. `normalizeUnknownError`

如果抛出的值已经是 **`AppError`**，直接返回。否则包装为 **`UNKNOWN_ERROR`**（不可重试），将原始的 name/message 存入 **`details`**，并将 **`cause`** 设置为原始错误。

**为什么重要：** catch 块可能收到 **`Error`**、字符串或库特定的类型；标准化处理使 **`retryOn`** 和 **`formatUserFacingError`** 的行为可预测。

---

### 6. `classifyError`

调用 **`normalizeUnknownError`**，然后返回 **`{ error, retryable, type }`**，其中 **`type`** 是 **`error.code`**。

**为什么重要：** 在一个地方统一决定"是否重试"，而不是在 **`promptLLM`**、**`runAgent`** 和 **`withRetries`** 的谓词中重复使用 **`instanceof`** 检查。

---

### 7. `isRetryable`

返回 **`classifyError(err).retryable`**。用作 **`withRetries`** 的**默认** **`retryOn`** 判断函数。

---

### 8. `jitteredBackoffDelay`

指数退避延迟，上限为 **`maxDelayMs`**，并通过 **`crypto.randomInt`** 添加**随机抖动（Jitter）**，使多个客户端不会同时重试。

---

### 9. `withRetries`

最多执行 **`fn`** **`retries + 1`** 次。失败后，如果还有剩余尝试次数且 **`retryOn(err)`** 为 true，则等待（**`sleep`** + **`jitteredBackoffDelay`**），打印 **`[retry]`** 日志，然后重试。否则抛出 **`lastErr`**。

---

### 10. `formatUserFacingError`

构建在演示中展示给"用户"的字符串：**`userMessage`** 加上 **`(Reference: <correlationId>)`**，如果错误不是 **`AppError`** 则显示通用回退信息。

---

### 11. `printAgentWorkflowErrorBanner`

当捕获到 **`AgentWorkflowError`** 时，向 **stderr** 打印一个带边框的区块：步骤、错误码、关联 ID、消息、**`details`**，以及 **`cause`** 的简短摘要。与单行 **`[agent_error]`** JSON 日志互为补充。

---

### 12. `SIMULATION` 和模拟工具

```javascript
const SIMULATION = {
  forceNotFound: new Set(["u_999"]),
  forcePrimaryAndFallbackFail: new Set(["u_777"]),
};
```

**`fetchUserFromPrimary`** — 模拟延迟；**`u_999`** 返回不可重试的"未找到"错误；**`u_777`** 始终返回可重试的主工具失败（演示用途）；其他情况约 20% 随机瞬态失败；成功时返回带 **`source: "primary"`** 的用户档案。

**`fetchUserFromFallback`** — 保真度较低的用户档案；对 **`u_777`** 会抛出错误，使 **主工具 > 备用工具** 链可以确定性地触发 **`AgentWorkflowError`**。

---

### 13. 初始化模型和会话

与 **`simple-agent.js`** 相同的模式：**`getLlama`**、**`loadModel`**（加载 **`models/Qwen3-1.7B-Q8_0.gguf`** 路径）、**`createContext`**、创建 **`LlamaChatSession`** 并设置**系统提示词（System Prompt）**，告知模型可以通过工具获取用户信息。

---

### 14. 注册工具

两个 **`defineChatSessionFunction`** 包装器分别调用 **`fetchUserFromPrimary`** 和 **`fetchUserFromFallback`**，使用 JSON Schema 定义 **`userId`** 参数。**`functions`** 传入 **`session.prompt`**，使 LLM 可以按名称调用工具。

---

### 15. `promptLLM`

使用 **`withTimeout`**、**`withRetries`** 和关联感知的错误包装 **`session.prompt`**：

- 空的修剪后响应 > 抛出 **`LLMCallError`**（可重试）。
- **`catch`**：调用 **`classifyError`**；原样重新抛出 **`ToolExecutionError`** / **`LLMCallError`**；其他错误变为 **`LLMCallError`**，仅当标准化后的失败是 **`TIMEOUT`** 时才设为**可重试**（保留 **`cause`**）。
- **`retryOn`**：**`(err) => classifyError(err).retryable`**。

---

### 16. `runDegradedProfileResolution`

在 LLM 路径因 **`LLMCallError`** 失败后，**不使用** LLM 运行：

1. 从 **`SKIP_LLM_DEGRADED`** 匹配或自由文本中提取 **`u_<digits>`**；否则抛出 **`ValidationError`**。
2. 对主工具使用 **`withRetries`** + **`withTimeout`**；**`retryOn`** 仅针对**可重试**的 **`ToolExecutionError`**。
3. 如果主工具仍因可重试的工具错误失败 > 尝试 **`fetchUserFromFallback`**。如果备用工具也抛出异常 > 抛出 **`AgentWorkflowError`**（**`resolve_user_profile`**，**`cause`** = 备用工具错误）。
4. 返回以 **"Model unavailable; answered via deterministic fallback."** 为前缀的简短要点回答。

---

### 17. `runAgent`

**流程：**

1. **`correlationId = crypto.randomUUID()`**。
2. 空输入 > 抛出 **`ValidationError`**。
3. 文本包含 **`u_demo_workflow`** > 抛出 **`AgentWorkflowError`**（**`policy_guard`**）— 验证后的演示拦截器。
4. **`SKIP_LLM_DEGRADED u_<digits>`** > 不调用模型，强制触发 **`LLMCallError`**（确定性降级演示）。
5. 否则调用 **`promptLLM`**。成功 > 返回 **`{ ok: true, output }`**。
6. **`catch`** 仅捕获 **`LLMCallError`** > 打印 **`[degraded_mode]`** 日志，调用 **`runDegradedProfileResolution`**，返回 **`ok: true`** 和降级输出。
7. 其他错误传播到外层 **`catch`**：调用 **`classifyError`**，对 **`AgentWorkflowError`** 可选打印 **`printAgentWorkflowErrorBanner`**，**`console.error("[agent_error]", …)`**，返回 **`{ ok: false, output: formatUserFacingError(...) }`**。

---

### 18. 演示循环和清理

**`inputs`** 运行一组固定的字符串（正常路径、**`u_999`**、**`u_demo_workflow`**、**`SKIP_LLM_DEGRADED u_777`**、空输入）。每次迭代打印 **`USER:`**、运行 **`runAgent`**，然后显示助手文本或错误文本。

**资源释放：** **`session`**、**`context`**、**`model`**、**`llama`** — 对本地/原生绑定非常重要。

---

## 展示的核心概念

### 1. 类型化错误 + 稳定错误码

仪表盘和告警可以按 **`code`** 分组。用户永远不会看到 **`details`** 或堆栈信息 — 只看到 **`userMessage`** 和一个**引用 ID（Reference ID）**。

### 2. 先分类，再重试

**`normalizeUnknownError` > `classifyError` > `retryable`** 使 **`withRetries`** 和 **`promptLLM`** 在判断什么是瞬态故障时保持一致。

### 3. 超时 > 重试 > 备用方案 > 降级模式

**`withTimeout`** 限制等待时间。**`withRetries`** 处理不稳定的 LLM 或工具。**`runDegradedProfileResolution`** 是 LLM 路径不可用但仍可通过工具完成工作时的**确定性**路径。

### 4. `AgentWorkflowError` 与工具错误的区别

**工具**抛出 **`ToolExecutionError`**。当**策略**拦截或**主工具 + 备用工具**在编排的降级流程中都失败时，上报的错误是 **`AgentWorkflowError`**，其 **`cause`** 指向内部失败。

---

## 预期输出（代表性示例）

运行脚本时，你会看到分隔线、**`USER:`** 行，以及 **`ASSISTANT:`** 或 **`ASSISTANT (error):`**。对于 **`u_demo_workflow`** 和 **`SKIP_LLM_DEGRADED u_777`**（当备用工具也失败时），**stderr** 会显示 **AGENT WORKFLOW FAILED** 横幅和 **`[agent_error]`** JSON。当重试或降级路径激活时，会出现 **`[retry]`** 和 **`[degraded_mode]`** 日志行。

具体措辞可能略有不同（例如第一次提示的 LLM 输出取决于模型）。

---

## 最佳实践

1. **限制时间** — 对 LLM 和工具调用使用 **`withTimeout`**。
2. **只重试瞬态故障** — 使用 **`classifyError`**（或等效机制），避免盲目重试验证错误。
3. **抖动退避** — 避免同步重试。
4. **关联 ID** — 对每个用户可见的错误和结构化日志都附上关联 ID。
5. **分离** — 将运维日志（**`[agent_error]`**、横幅）与展示给终端用户的内容（**`formatUserFacingError`**）分开。
6. **释放资源** — 脚本退出时释放原生/模型资源。

---

## 为什么这对 AI 智能体很重要

智能体堆叠了 **LLM + 工具 + 编排**。故障可能来自任何一层；没有分类体系和分类机制，你要么**什么都重试**（浪费资源），要么**什么都不重试**（脆弱）。本示例展示了一条从**单次调用错误**到**工作流级别** **`AgentWorkflowError`** 的最小但完整的路径，并为后续升级到断路器（Circuit Breaker）、真实遥测（Telemetry）和生产级策略类型提供了清晰的扩展方向。
