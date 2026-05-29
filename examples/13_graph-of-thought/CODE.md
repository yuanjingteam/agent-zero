# 代码解析：`graph-of-thought.js`

这是示例 13 中图思维（Graph of Thought）实现的代码优先讲解。

## 运行

```bash
node examples/13_graph-of-thought/graph-of-thought.js
```

---

## 1) 核心图对象：`ThoughtGraph`

`ThoughtGraph` 是核心数据结构。

### 存储状态

- `nodes: Map<string, node>`
- `edges: Map<string, parentId[]>`
- `nextId` 用于生成顺序节点 ID（`n1`、`n2`……）

### 关键方法

- `addNode(type, content, meta, parentIds)`
- `get(id)`
- `parents(id)`
- `byType(type)`
- `printGraph()`（调试输出所有节点和边）

这正是使本示例成为真正的图结构而非树结构的关键。

---

## 2) 共享 JSON 调用工具：`promptJson()`

`promptJson(schema, userText)` 被每个操作复用：

- 重置聊天历史，
- 强制使用数据模式语法（schema grammar），
- 安全地解析 JSON。

所有操作函数因此可以保持简洁，专注于图逻辑。

---

## 3) 阶段函数（及其创建的节点类型）

### `branch(...)` -> `hypothesis` 节点

- 输入：根行为 + 假设视角
- 输出：每个视角一个节点
- 父节点：始终为根节点

### `scoreAll(...)` -> 更新假设节点上的 `score`

- 对每个假设进行原始标准评分
- 严格重排序（无并列）并带有校准分数分布
- 将分数写回图节点

### `contrast(...)` -> `contrast` 节点

- 输入：两个假设节点
- 输出：矛盾节点
- 父节点：两个被比较的节点

### `refine(...)` -> `refined` 节点

- 输入：弱势节点 + 强势节点/上下文
- 输出：改进后的弱势论点
- 父节点：两个源节点

### `aggregate(...)` -> `synthesis` 节点

- 输入：多个源节点
- 输出：整合后的综合分析
- 父节点：所有源节点

### `conclude(...)` -> `conclusion` 节点

- 输入：选定的高价值线索
- 输出：最终整合分析
- 父节点：多个综合/对比/精炼节点

---

## 4) 控制器流程：`runGoTMotivationAnalysis()`

此函数编排所有操作：

1. 创建 `root`
2. 分支为 4 个假设
3. 评分 + 重排序假设
4. 构建对比节点
5. 精炼弱势/中等节点
6. 创建两个综合节点
7. 从多条线索得出结论
8. 打印图 + 最终叙述 + 生成可视化

排名步骤影响哪些节点被视为 `strongA`、`strongB`、`medium`、`weak`，进而影响对比/精炼的选择。

---

## 5) 为什么这是代码中的图思维（不仅仅是概念）

查看 `addNode(...)` 调用中的父节点数组：

- `contrast`：两个父节点
- `refine`：两个父节点
- `aggregate`：多个父节点
- `conclusion`：多个父节点

多父节点在严格的树搜索中是不可能的，它们是图思维在代码中的具体标志。

---

## 6) 可视化集成

可视化逻辑有意提取到辅助代码中：

- `writeGoTMotivationVisualization(...)`

这样本示例文件可以专注于图操作和编排。

---

## 建议的代码阅读顺序

1. `ThoughtGraph` 类
2. `promptJson`
3. `branch`
4. `scoreAll`
5. `contrast`
6. `refine`
7. `aggregate`
8. `conclude`
9. `runGoTMotivationAnalysis`

该顺序与运行时执行顺序一致，提供最清晰的学习路径。
