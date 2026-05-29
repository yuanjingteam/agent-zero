# 概念：函数调用（Function Calling）与工具使用

## 概述

函数调用将大语言模型（LLM）从文本生成器转变为能够执行操作并与世界交互的智能体（Agent）。

## 什么构成了智能体？

```
文本生成器                  智能体
──────────────             ──────
LLM → 仅输出文本           LLM + 工具 → 可以行动
```

**函数调用**允许大语言模型调用预定义的函数，以访问数据或执行其自身无法完成的操作。

## 核心思想

```
用户："现在几点了？"
       ↓
大语言模型思考："我需要获取当前时间"
       ↓
大语言模型调用：getCurrentTime()
       ↓
工具返回："1:46:36 PM"
       ↓
大语言模型回复："现在是 13:46"
```

这就是智能体能力 - 能够"做"，而不仅仅是"说"。

## 工作原理

### 1. 函数定义
```javascript
getCurrentTime = {
  description: "Get the current time",
  handler: () => new Date().toLocaleTimeString()
}
```

### 2. 大语言模型看到可用工具
```
Available functions:
- getCurrentTime: "Get the current time"
- getWeather: "Get weather for a city"  
- calculate: "Perform math"
```

### 3. 大语言模型决定何时使用
```
"What time?" → getCurrentTime() ✓
"What's 5+5?" → calculate() ✓
"Tell a joke" → 不需要工具
```

## 实际应用场景

**个人助手**：日历、邮件、提醒
**研究型智能体**：网页搜索、文档阅读
**编程助手**：文件操作、代码执行
**数据分析师**：数据库查询、计算

## 核心要点

函数调用是实现 AI 智能体的关键功能。没有它，大语言模型只能"说"。有了它，大语言模型就能"做"。

这是所有现代智能体系统的基础。
