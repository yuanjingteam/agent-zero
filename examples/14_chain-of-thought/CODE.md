# 代码解析：`chain-of-thought.js`

本讲解将思维链（Chain of Thought）的每个阶段映射到文件中的实际函数。

## 运行

```bash
node examples/14_chain-of-thought/chain-of-thought.js
```

---

## 1) 初始化：模型、输入案例和数据模式

文件顶部定义了：

- `RETURN_CASE` 定义了客户请求。
- `RETURN_POLICY` 定义了硬性业务约束。
- `factsSchema`、`redFlagsSchema`、`legitimacySchema`、`policySchema`、`decisionSchema` 定义了每个阶段的 JSON 数据契约。
- `promptJson(schema, userText)` 是共享工具函数，功能包括：
  - 重置聊天历史，
  - 强制使用数据模式语法（schema grammar），
  - 安全地解析和修复 JSON。

这为每个阶段函数提供了严格的输出结构。

```js
const RETURN_CASE = {
    request_id: "RET-2026-0414",
    claimed_reason: "Right ear cup has intermittent sound dropouts",
    claim_timing_days_after_delivery: 23,
    order_value_eur: 189.0
    // ...
};

const RETURN_POLICY = {
    return_window_days: 30,
    max_high_value_returns_12m_before_manual_review: 2,
    mandatory_manual_review_amount_eur: 250
};

async function promptJson(schema, userText) {
    session.resetChatHistory();
    const grammar = await llama.createGrammarForJsonSchema(schema);
    const raw = await session.prompt(userText, { grammar, maxTokens: 1400, temperature: 0.2 });
    return JsonParser.parse(raw, { debug, expectObject: true, repairAttempts: true });
}
```

---

## 2) 阶段 1（事实）：`extractFacts()`

`extractFacts(returnCase)` 要求：

- 仅提取明确的事实，
- 不进行评分，
- 不进行判断。

返回：

- `extracted_facts`
- `missing_information`

这可以防止在风险推理开始之前产生早期偏见。

```js
async function extractFacts(returnCase) {
    return promptJson(
        factsSchema,
        `Phase 1 of 5: FACTS ONLY.
Extract facts from the return request without evaluation, suspicion, or judgment.
Do not infer intent. Do not score. Just capture what is explicitly known.

Return request JSON:
${JSON.stringify(returnCase, null, 2)}`
    );
}
```

---

## 3) 阶段 2（危险信号）：`screenRedFlags()`

`screenRedFlags(returnCase, facts)` 使用固定的检查点执行显式的欺诈筛查。

输出：

- `checkpoints[]`，包含 `present/not_present/unclear` 状态
- `fraud_score`
- `fraud_rationale`

重要的是检查清单的覆盖，而不仅仅是一个最终分数。

```js
async function screenRedFlags(returnCase, facts) {
    return promptJson(
        redFlagsSchema,
        `Phase 2 of 5: RED FLAG SCREENING.
Evaluate potential fraud indicators one by one.

Use these checkpoints:
1) Frequent recent return behavior
2) High-value return pattern
3) Inconsistent payment/shipping identity
4) Weak or missing defect evidence
5) Timing pattern that looks strategic
6) Account behavior anomaly`
    );
}
```

---

## 4) 阶段 3（合理性）：`assessLegitimacy()`

`assessLegitimacy(returnCase, facts)` 构建客户方的论点：

- 合理的缺陷指标，
- 公平性/上下文因素，
- 支持证据的质量。

输出：

- `customer_supporting_points[]`
- `legitimacy_score`
- `legitimacy_rationale`

如果没有这个阶段，风险逻辑倾向于在每个边界案例中占主导地位。

```js
async function assessLegitimacy(returnCase, facts) {
    return promptJson(
        legitimacySchema,
        `Phase 3 of 5: LEGITIMACY VIEW.
Now build the customer-side case.
List reasons why this may be a legitimate return.
Do not reference fraud score. Focus on fairness and plausible product failure.`
    );
}
```

---

## 5) 阶段 4（策略）：`checkPolicy()`

`checkPolicy(returnCase, policy, redFlags, legitimacy)` 应用硬性规则：

- 退货时间窗口
- 金额阈值
- 退货历史触发条件

输出：

- `policy_checks[]` 中的逐条规则状态
- `policy_outcome`（`approve`、`reject`、`manual_review`）

这是分析与行动之间的治理关口。

```js
async function checkPolicy(returnCase, policy, redFlags, legitimacy) {
    return promptJson(
        policySchema,
        `Phase 4 of 5: POLICY CHECK.
Apply policy strictly. Do not invent rules.

Policy JSON:
${JSON.stringify(policy, null, 2)}

Fraud score: ${redFlags.fraud_score}
Legitimacy score: ${legitimacy.legitimacy_score}`
    );
}
```

---

## 6) 阶段 5（决策）：`makeDecision()`

`makeDecision(...)` 只能在所有先前阶段完成后进行决策。

输出：

- `final_decision`
- `confidence`
- `decision_reasoning`
- `customer_message`
- `internal_note`

提示词明确引用了冲突处理（例如欺诈 6/10 对比合理性 7/10），因此结果必须解释策略如何解决这种张力。

```js
async function makeDecision(returnCase, phase1Facts, redFlags, legitimacy, policyResult) {
    return promptJson(
        decisionSchema,
        `Phase 5 of 5: FINAL DECISION.
You can decide only now. Use all prior phases.
Explain trade-offs clearly. If conflict exists (e.g., fraud 6/10 vs legitimacy 7/10),
show how policy resolves it.`
    );
}
```

---

## 7) 编排流程：`runChainOfThoughtReturnDecision()`

主控制器按严格顺序执行各阶段：

1. 事实
2. 危险信号
3. 合理性
4. 策略检查
5. 最终决策

然后打印一份简洁报告，并通过以下方式写入浏览器可视化：

- `writeCoTReturnVisualization(...)`

这使核心文件专注于思维链逻辑。

```js
async function runChainOfThoughtReturnDecision(returnCase, policy) {
    const facts = await extractFacts(returnCase);
    const redFlags = await screenRedFlags(returnCase, facts);
    const legitimacy = await assessLegitimacy(returnCase, facts);
    const policyResult = await checkPolicy(returnCase, policy, redFlags, legitimacy);
    const decision = await makeDecision(returnCase, facts, redFlags, legitimacy, policyResult);

    writeCoTReturnVisualization(__dirname, {
        returnCase, policy, facts, redFlags, legitimacy, policyResult, decision
    });
}
```

---

## 8) 根据模型类型调整实现

当前代码使用 `Qwen3-1.7B-Q8_0.gguf`，它既可以作为推理模型也可以作为非推理模型运行。5 阶段框架被设计为适用于任一类型——但调优方式有所不同。

关于这一区分的概念性内容，请参阅 [CONCEPT.md](CONCEPT.md) 中的"推理模型与非推理模型的思维链"章节。

### 当前代码的假设

- 一个可能在内部进行推理也可能不进行推理的混合模型。
- 通过 `promptJson(...)` 定义的每阶段 JSON 数据模式。
- 低 `temperature`（0.2）和充足的每阶段 `maxTokens` 预算。
- 通过 `session.resetChatHistory()` 实现的每阶段独立聊天历史。

这是一个有意设计的中间配置，使示例无需强制读者下载特定模型即可运行。

### 针对非推理模型的调优

如果你换入一个没有内部推理能力的基础/聊天模型（Llama-3 chat、Phi、Mistral-instruct、Qwen3 配置 `thoughts: "discourage"`）：

```js
const raw = await session.prompt(userText, {
    grammar,
    maxTokens: 1800,
    temperature: 0.1
});
```

- 进一步降低 `temperature`（0.05 - 0.15）。边界案例在创造性采样下会严重退化。
- 增加每阶段的 `maxTokens`。模型在确定分数之前通常需要在 JSON 内部"自言自语"。
- 保持数据模式严格。避免宽泛的自由格式字段；用枚举、固定长度数组或短有界字符串替代。
- 在阶段提示中添加明确示例（"Example checkpoint: { check, status, evidence }"）。非推理模型对格式示例的接受速度远快于抽象规范。

### 针对推理模型的调优

如果你换入一个推理调优模型（o3、DeepSeek-R1、Qwen3 配置 `thoughts: "auto"`、通过 API 使用 Claude Extended Thinking）：

```js
const raw = await session.prompt(userText, {
    grammar,
    maxTokens: 900,
    temperature: 0.3
});
```

- 缩短阶段提示。模型已在内部进行推理；冗长的指令会增加噪声。
- 对纯结构性阶段（事实、策略检查）降低 `maxTokens`。它们不需要大量的思考预算。
- 将数据模式作为**契约**而非推理拐杖。它们在此的主要作用是下游互操作性。
- 如果运行时支持，仅将内部推理追踪用于调试——绝不要作为审计追踪的一部分。

### Qwen3 特定说明

对于 `node-llama-cpp`，切换 Qwen 思考行为的简洁方式是使用包装器选项：

```js
import { QwenChatWrapper } from "node-llama-cpp";

const reasoningWrapper = new QwenChatWrapper({
    thoughts: "auto",
    keepOnlyLastThought: true
});

const nonReasoningWrapper = new QwenChatWrapper({
    thoughts: "discourage"
});
```

然后使用你为该阶段/运行选择的包装器创建聊天会话：

```js
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt,
    chatWrapper: reasoningWrapper // or nonReasoningWrapper
});
```

一个实用的模式是按阶段混合包装器模式：

- 阶段 1（事实）和阶段 4（策略检查）使用 `thoughts: "discourage"`——机械性工作。
- 阶段 2（危险信号）、阶段 3（合理性）和阶段 5（决策）使用 `thoughts: "auto"`——判断性工作。

这在保持低总延迟的同时，在关键之处保留推理能力。

### 各阶段注意事项

- **阶段 1（事实）** - 非推理模型常常会编造看起来合理但实际上不在输入中的事实条目。收紧数据模式（`minItems`、类枚举字段）并明确指示："不要推断。"
- **阶段 2（危险信号）** - 推理模型在给定欺诈框架时倾向于过度怀疑。使用固定的检查点列表而非开放式危险信号生成来进行锚定。
- **阶段 3（合理性）** - 这个阶段的存在正是为了对抗阶段 2 的偏见。无论模型类型如何，都不要为了节省 token 而将其合并到阶段 2 中。它是一个结构性制衡。
- **阶段 4（策略检查）** - 两种模型类型都受益于将策略以内联 JSON 注入而非用散文描述。减少漂移和静默规则发明。
- **阶段 5（决策）** - 两种类型之间的置信度校准差异很大。推理模型的 `confidence: 0.79` 与基础模型的 `0.79` 不可直接比较。将置信度视为模型内部指标；改用 `final_decision` 和 `policy_outcome` 进行路由。

---

## 建议的代码阅读顺序

1. `promptJson`
2. `extractFacts`
3. `screenRedFlags`
4. `assessLegitimacy`
5. `checkPolicy`
6. `makeDecision`
7. `runChainOfThoughtReturnDecision`

该顺序与运行时一致，使示例易于理解。
