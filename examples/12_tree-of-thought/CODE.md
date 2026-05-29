# 代码解析：`tree-of-thought.js`

本讲解按照实际代码结构展开，方便你将思维树（Tree of Thought）的每个概念映射到具体函数。

## 运行

```bash
node examples/12_tree-of-thought/tree-of-thought.js
```

---

## 1) 初始化：模型、数据模式、常量

文件顶部定义了：

- `HYPOTHESIS_TYPES` 定义了四个相互竞争的分支。
- `BEHAVIOR_INPUT` 是案例描述。
- `hypothesisSchema`、`scoreSchema`、`rankingSchema`、`analysisSchema` 定义了每个阶段的 JSON 数据契约。
- `promptJson(schema, userText)` 是共享工具函数，功能包括：
  - 重置聊天历史，
  - 强制使用数据模式语法（schema grammar），
  - 解析/修复 JSON。

这使得每个阶段函数只需关注逻辑，无需处理解析器样板代码。

---

## 2) 阶段 1（分支）：`developHypothesis()`

`developHypothesis(behavior, hypothesisType)` 只做一件事：

- 让模型通过一个特定视角进行推理，
- 返回结构化对象：
  - `name`
  - `argument`
  - `signals`
  - `counter_evidence`

在 `runTreeOfThoughtMotivationAnalysis()` 中，该函数通过循环遍历 `HYPOTHESIS_TYPES` 来创建四个竞争分支。

---

## 3) 阶段 2（评分）：`scoreHypothesis()` + `rerankHypotheses()`

### 原始逐分支评分

`scoreHypothesis(behavior, hypothesis)` 返回：

- `score`（根据公式计算的原始数值分数），
- `details`（`explanatory_power`、`plausibility`、`falsifiability`），
- `blindSpot`，
- `reasoning`。

### 反平局校准

`rerankHypotheses(behavior, scoredHypotheses)` 强制生成无并列的严格排名，然后将排名映射为校准分数：

- rank1 -> `8.8`
- rank2 -> `8.1`
- rank3 -> `7.4`
- rank4 -> `6.7`

这就是控制台会显示：

- 捕获的原始评估结果
- 然后是用于剪枝的校准分数

这样学习者就能看到系统*实际*用于分支选择的依据。

---

## 4) 阶段 3（剪枝）：`pruneHypotheses()`

`pruneHypotheses(scoredHypotheses)`：

- 按分数降序排列，
- 保留获胜者，
- 返回被丢弃的（`discarded`）分支。

这是本示例中思维树的核心结构：一个获胜者继续推进，其余替代方案被丢弃。

---

## 5) 阶段 4（结论）：`createConclusion()`

`createConclusion(behavior, winner)` 仅使用以下内容构建最终分析：

- 获胜者名称
- 获胜者论点
- 获胜者信号

被丢弃的分支不会参与最终答案的生成。
这个有意设计的限制在控制台输出块中展示：`WHAT TOT LOST IN THIS RUN`。

---

## 6) 编排流程：`runTreeOfThoughtMotivationAnalysis()`

此函数是端到端的控制器：

1. 分支（收集假设）
2. 评分（原始 + 校准）
3. 剪枝（获胜者 + 被丢弃者）
4. 结论（仅基于获胜者）
5. 打印输出 + 调用可视化辅助函数

可视化有意委托给：

- `writeToTMotivationVisualization(...)`

这样示例文件可以专注于思维树的控制流程。

---

## 建议的代码阅读顺序

按以下顺序阅读函数：

1. `promptJson`
2. `developHypothesis`
3. `scoreHypothesis`
4. `rerankHypotheses`
5. `pruneHypotheses`
6. `createConclusion`
7. `runTreeOfThoughtMotivationAnalysis`

该顺序与运行时执行流程一致，使文件更易于理解。
