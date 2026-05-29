# 代码解析：aot-agent.js

本示例展示了**原子思维（Atom of Thought）**提示模式，以数学计算器作为应用领域。

## 三阶段架构

### 阶段一：规划（LLM）
```javascript
async function generatePlan(userPrompt) {
    const grammar = await llama.createGrammarForJsonSchema(planSchema);
    const planText = await session.prompt(userPrompt, { grammar });
    return grammar.parse(planText);
}
```

**要点：**
- LLM 输出**结构化 JSON**（由语法约束强制执行）
- LLM **不执行**计算操作
- 每个原子（atom）代表一个操作
- 依赖关系是显式的（`dependsOn` 数组）

**输出示例：**
```json
{
  "atoms": [
    {"id": 1, "kind": "tool", "name": "add", "input": {"a": 15, "b": 7}},
    {"id": 2, "kind": "tool", "name": "multiply", "input": {"a": "<result_of_1>", "b": 3}},
    {"id": 3, "kind": "tool", "name": "subtract", "input": {"a": "<result_of_2>", "b": 10}},
    {"id": 4, "kind": "final", "name": "report", "dependsOn": [3]}
  ]
}
```

### 阶段二：验证（系统）
```javascript
function validatePlan(plan) {
    const allowedTools = new Set(Object.keys(tools));
    
    for (const atom of plan.atoms) {
        if (ids.has(atom.id)) throw new Error(`Duplicate ID`);
        if (atom.kind === "tool" && !allowedTools.has(atom.name)) {
            throw new Error(`Unknown tool: ${atom.name}`);
        }
    }
}
```

**验证内容：**
- 原子 ID 不能重复
- 只能引用已允许的工具
- 依赖关系合理
- JSON 结构正确

### 阶段三：执行（系统）
```javascript
function executePlan(plan) {
    const state = {};
    
    for (const atom of sortedAtoms) {
        // 解析依赖
        let resolvedInput = {};
        for (const [key, value] of Object.entries(atom.input)) {
            if (value.startsWith('<result_of_')) {
                const refId = parseInt(value.match(/\d+/)[0]);
                resolvedInput[key] = state[refId];
            }
        }
        
        // 执行
        state[atom.id] = tools[atom.name](resolvedInput.a, resolvedInput.b);
    }
}
```

**关键行为：**
- 按顺序执行原子（按 ID 排序）
- 从状态中解析 `<result_of_N>` 引用
- 每个原子将其结果存储在 `state[atom.id]` 中
- 执行是**确定性的**（相同计划 + 相同状态 = 相同结果）

## 为什么这很重要

### 与 ReAct 的对比

| 方面 | ReAct | 原子思维 |
|--------|-------|-----------------|
| **规划** | 隐式（在 LLM 推理中） | 显式（JSON 结构） |
| **执行** | LLM 决定下一步 | 系统按计划执行 |
| **验证** | 无 | 执行前验证 |
| **调试** | 困难（需遍历文本） | 简单（检查原子） |
| **测试** | 困难（需模拟 LLM） | 简单（测试执行器） |
| **失败处理** | 可能产生幻觉 | 在特定原子处失败 |

### 优势

1. **无隐藏推理**：每个操作都是显式的原子
2. **可测试**：无需 LLM 参与即可执行计划
3. **可调试**：精确知道哪个原子失败
4. **可审计**：计划是数据结构，而非文本
5. **确定性**：相同输入 = 相同输出（给定相同计划）

## 工具实现

工具是**纯函数**，没有副作用：
```javascript
const tools = {
    add: (a, b) => {
        const result = a + b;
        console.log(`EXECUTING: add(${a}, ${b}) = ${result}`);
        return result;
    },
    // ... 更多工具
};
```

**为什么使用纯函数？**
- 易于测试
- 易于重放
- 无隐藏状态
- 可组合

## 状态流
```
用户问题
      ↓
[LLM 生成计划]
      ↓
{atoms: [...]} ← JSON 计划
      ↓
[系统验证]
      ↓
计划有效
      ↓
[系统执行原子 1] → state[1] = 结果
      ↓
[系统执行原子 2] → state[2] = 结果（使用 state[1]）
      ↓
[系统执行原子 3] → state[3] = 结果（使用 state[2]）
      ↓
最终答案
```

## 错误处理
```javascript
// 原子验证失败 → 重新提示 LLM
validatePlan(plan); // 无效时抛出异常

// 工具执行失败 → 在该原子处停止
if (b === 0) throw new Error("Division by zero");

// 依赖缺失 → 清晰的错误消息
if (!(depId in state)) {
    throw new Error(`Atom ${atom.id} depends on incomplete atom ${depId}`);
}
```

## 何时使用 AoT

**适合使用 AoT 的场景：**
- 执行必须可审计
- 失败必须可恢复
- 多步骤且存在依赖关系
- 测试很重要
- 合规性要求高

**不适合使用 AoT 的场景：**
- 单步任务
- 创意/探索性任务
- 头脑风暴
- 自然对话

## 扩展思路

1. **添加补偿原子**用于回滚
2. **添加重试逻辑**，按原子级别重试
3. **并行化独立原子**（无共享依赖的原子）
4. **持久化计划**用于调试
5. **可视化原子图**（依赖树）
