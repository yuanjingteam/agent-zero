/**
 * 示例 13：思维图（Graph of Thought, GoT）— 动机分析
 *
 * 运行：
 *   node examples/13_graph-of-thought/graph-of-thought.js
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { JsonParser } from "../../helper/json-parser.js";
import { writeGoTMotivationVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

class ThoughtGraph {
	constructor() {
		this.nodes = new Map();
		this.edges = new Map();
		this.nextId = 1;
	}

	addNode(type, content, meta = {}, parentIds = []) {
		const id = `n${this.nextId++}`;
		this.nodes.set(id, { id, type, content, meta, score: 0 });
		this.edges.set(id, parentIds);
		return id;
	}

	get(id) {
		return this.nodes.get(id);
	}

	parents(id) {
		return (this.edges.get(id) || []).map((p) => this.nodes.get(p));
	}

	byType(type) {
		return [...this.nodes.values()].filter((n) => n.type === type);
	}

	printGraph() {
		console.log("\n图结构（所有节点和边）：");
		for (const [id, node] of this.nodes) {
			const pIds = this.edges.get(id) || [];
			const arrow = pIds.length ? ` <- [${pIds.join(", ")}]` : "（根节点）";
			console.log(
				`  [${id}] ${node.type.padEnd(12)} 分数:${String(node.score).padEnd(4)} ${arrow}`,
			);
			console.log(`         "${String(node.content).slice(0, 80)}..."`);
		}
	}
}

const systemPrompt = `你是一位细心的心理学分析助手。
你始终只返回符合所需模式的有效JSON。
不要使用markdown、代码围栏或JSON之外的文本。`;

const hypothesisSchema = {
	type: "object",
	properties: {
		argument: { type: "string" },
		signals: { type: "array", items: { type: "string" } },
		blind_spot: { type: "string" },
	},
	required: ["argument", "signals", "blind_spot"],
};

const scoreSchema = {
	type: "object",
	properties: {
		explanatory_power: { type: "number" },
		plausibility: { type: "number" },
		depth: { type: "number" },
		score: { type: "number" },
		reasoning: { type: "string" },
	},
	required: [
		"explanatory_power",
		"plausibility",
		"depth",
		"score",
		"reasoning",
	],
};

const rankingSchema = {
	type: "object",
	properties: {
		ranking: {
			type: "array",
			items: { type: "string" },
			minItems: 4,
			maxItems: 4,
		},
		rationale: { type: "string" },
	},
	required: ["ranking", "rationale"],
};

const contrastSchema = {
	type: "object",
	properties: {
		contradiction: { type: "string" },
		meaning: { type: "string" },
	},
	required: ["contradiction", "meaning"],
};

const synthSchema = {
	type: "object",
	properties: {
		synthesis: { type: "string" },
	},
	required: ["synthesis"],
};

const refineSchema = {
	type: "object",
	properties: {
		refined_argument: { type: "string" },
		preserved_core: { type: "string" },
	},
	required: ["refined_argument", "preserved_core"],
};

const conclusionSchema = {
	type: "object",
	properties: {
		core_motivation: { type: "string" },
		psychological_picture: { type: "string" },
		contradictions_as_signal: { type: "string" },
		recommendation: { type: "string" },
		what_tot_missed: { type: "array", items: { type: "string" } },
	},
	required: [
		"core_motivation",
		"psychological_picture",
		"contradictions_as_signal",
		"recommendation",
		"what_tot_missed",
	],
};

const llama = await getLlama({ debug });
const model = await llama.loadModel({
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const context = await model.createContext({ contextSize: 8192 });
const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

async function promptJson(schema, userText) {
	session.resetChatHistory();
	const grammar = await llama.createGrammarForJsonSchema(schema);
	const raw = await session.prompt(userText, {
		grammar,
		maxTokens: 1200,
		temperature: 0.2,
	});
	return JsonParser.parse(raw, {
		debug,
		expectObject: true,
		repairAttempts: true,
	});
}

async function branch(_sessionObj, graph, rootId, hypothesisTypes) {
	const behavior = graph.get(rootId).content;
	const ids = [];

	for (const type of hypothesisTypes) {
		const result = await promptJson(
			hypothesisSchema,
			`你是一位经验丰富的心理学家。
严格从以下单一视角分析此行为：
"${type}"。

行为：
"${behavior}"

返回JSON：
{
  "argument": "2-3句解释",
  "signals": ["信号1", "信号2", "信号3"],
  "blind_spot": "此假设单独无法解释的方面"
}`,
		);

		const id = graph.addNode(
			"hypothesis",
			result.argument,
			{
				type,
				signals: result.signals,
				blind_spot: result.blind_spot,
			},
			[rootId],
		);

		console.log(`  [${id}] "${type.split("（")[0].trim()}"`);
		console.log(`       论点："${String(result.argument).slice(0, 70)}..."`);
		console.log(`       盲点："${String(result.blind_spot).slice(0, 70)}..."`);
		ids.push(id);
	}
	return ids;
}

async function scoreAll(graph, hypothesisIds) {
	const behavior = graph.get("n1").content;
	for (const id of hypothesisIds) {
		const node = graph.get(id);
		const result = await promptJson(
			scoreSchema,
			`为以下心理学假设打1到10分。
标准：解释力、合理性、深度。
每个标准使用小数值（保留一位小数）。
使用以下公式计算分数：
score = 0.45 * explanatory_power + 0.35 * plausibility + 0.20 * depth
在有充分理由时使用不同的分数。避免给出相同的分数，除非两个假设确实无法区分。

行为：
"${behavior}"

假设：
"${node.content}"

返回JSON：
{
  "explanatory_power": 7.6,
  "plausibility": 7.9,
  "depth": 6.8,
  "score": 7.5,
  "reasoning": "简要理由"
}`,
		);
		node.score = Number(result.score);
		node.meta.rawReasoning = result.reasoning;
		node.meta.rawDetails = {
			explanatory_power: Number(result.explanatory_power),
			plausibility: Number(result.plausibility),
			depth: Number(result.depth),
		};
		console.log(`  [${id}] 评估已记录`);
	}

	const rankingPayload = hypothesisIds
		.map((id) => {
			const n = graph.get(id);
			return `${id}: ${n.content}`;
		})
		.join("\n\n");
	const ranked = await promptJson(
		rankingSchema,
		`将以下假设节点ID从最强到最弱排序。
必须返回严格的顺序，不得有并列。

${rankingPayload}

返回JSON：
{
  "ranking": ["n2", "n4", "n3", "n5"],
  "rationale": "简要理由"
}`,
	);
	const order = Array.isArray(ranked.ranking) ? ranked.ranking : [];
	const valid =
		order.length === hypothesisIds.length &&
		new Set(order).size === hypothesisIds.length;
	if (valid) {
		const base = 8.8;
		const step = 0.7;
		order.forEach((id, idx) => {
			const n = graph.get(id);
			if (n) n.score = Number((base - idx * step).toFixed(1));
		});
		console.log("  校准后的分数（用于排名）：");
		order.forEach((id) => {
			const n = graph.get(id);
			if (n) {
				const d = n.meta.rawDetails || {
					explanatory_power: 0,
					plausibility: 0,
					depth: 0,
				};
				console.log(`    - [${id}] ${n.score}/10`);
				console.log(
					`      标准：解释力=${d.explanatory_power.toFixed(1)} | 合理性=${d.plausibility.toFixed(1)} | 深度=${d.depth.toFixed(1)}`,
				);
				if (n.meta.rawReasoning)
					console.log(`      备注：${n.meta.rawReasoning}`);
			}
		});
	}
}

async function contrast(graph, idA, idB) {
	const a = graph.get(idA);
	const b = graph.get(idB);

	const result = await promptJson(
		contrastSchema,
		`分析关于同一行为的两个竞争性假设。

假设A：
"${a.content}"

假设B：
"${b.content}"

返回JSON：
{
  "contradiction": "2-3句话描述建设性张力",
  "meaning": "此矛盾揭示了什么"
}`,
	);

	const id = graph.addNode(
		"contrast",
		result.contradiction,
		{ meaning: result.meaning },
		[idA, idB],
	);
	console.log(`  对比 [${id}] <- [${idA}] vs [${idB}]`);
	console.log(`     "${String(result.contradiction).slice(0, 75)}..."`);
	return id;
}

async function aggregate(graph, sourceIds, task) {
	const sourceText = sourceIds
		.map((id) => {
			const n = graph.get(id);
			return `[${id}]（${n.type}）：${n.content}`;
		})
		.join("\n\n");

	const result = await promptJson(
		synthSchema,
		`综合以下心理学视角。

视角：
${sourceText}

任务：${task}

返回JSON：
{ "synthesis": "3-4句综合陈述" }`,
	);

	const id = graph.addNode("synthesis", result.synthesis, {}, sourceIds);
	console.log(`  综合 [${id}] <- [${sourceIds.join(", ")}]`);
	console.log(`     "${String(result.synthesis).slice(0, 80)}..."`);
	return id;
}

async function refine(graph, weakId, strongId) {
	const weak = graph.get(weakId);
	const strong = graph.get(strongId);

	const result = await promptJson(
		refineSchema,
		`使用较强的假设来改进较弱的假设。
保留较弱假设的核心，但弥补其盲点。

较弱的假设：
"${weak.content}"

较强的上下文：
"${strong.content}"

返回JSON：
{
  "refined_argument": "2-3句改进后的论点",
  "preserved_core": "从较弱假设中保留的核心内容"
}`,
	);

	const id = graph.addNode(
		"refined",
		result.refined_argument,
		{ preserved_core: result.preserved_core },
		[weakId, strongId],
	);
	console.log(`  精炼 [${id}] <- 弱[${weakId}] + 强[${strongId}]`);
	console.log(`     "${String(result.refined_argument).slice(0, 80)}..."`);
	return id;
}

async function conclude(graph, sourceIds, behavior) {
	const sourceText = sourceIds
		.map((id) => {
			const n = graph.get(id);
			return `[${n.type.toUpperCase()} ${id}] ${n.content}`;
		})
		.join("\n\n");

	const result = await promptJson(
		conclusionSchema,
		`创建最终的综合动机分析。
使用所有视角、综合结果和矛盾点。

行为：
"${behavior}"

可用证据：
${sourceText}

返回JSON：
{
  "core_motivation": "1-2句核心动机",
  "psychological_picture": "3-4句完整画像",
  "contradictions_as_signal": "2句话说明矛盾为何在诊断中有用",
  "recommendation": "2-3句建议",
  "what_tot_missed": ["洞察1", "洞察2", "洞察3"]
}`,
	);

	const id = graph.addNode(
		"conclusion",
		result.core_motivation,
		result,
		sourceIds,
	);
	return { id, ...result };
}

async function runGoTMotivationAnalysis(behavior) {
	console.log("\n思维图：个人动机分析");
	console.log(`行为："${behavior}"\n`);

	const graph = new ThoughtGraph();
	const rootId = graph.addNode("root", behavior);

	const hypothesisTypes = [
		"回避动机（逃避负面事物）",
		"职业倦怠与情绪耗竭",
		"成长动机（追求更好的状态）",
		"外部社会压力（家庭、伴侣、社会）",
	];

	console.log("阶段一：分支 — 4个假设");
	const hIds = await branch(session, graph, rootId, hypothesisTypes);

	console.log("\n阶段二：评分");
	await scoreAll(graph, hIds);

	const ranked = [...hIds].sort(
		(a, b) => graph.get(b).score - graph.get(a).score,
	);
	const [strongA, strongB, medium, weak] = ranked;
	console.log(
		`\n  排名：[${strongA}] > [${strongB}] > [${medium}] > [${weak}]`,
	);
	console.log("  所有假设保留在图中（不硬性淘汰）。\n");

	console.log("阶段三：对比 — 建设性矛盾");
	const contrast1 = await contrast(graph, strongA, strongB);
	const contrast2 = await contrast(graph, strongA, weak);

	console.log("\n阶段四：精炼 — 挽救较弱假设");
	const refinedWeak = await refine(graph, weak, strongA);
	const refinedMedium = await refine(graph, medium, contrast1);

	console.log("\n阶段五：聚合 — 部分综合");
	const synth1 = await aggregate(
		graph,
		[strongA, strongB, contrast1],
		"综合两个最强假设，包括它们之间的张力。",
	);
	const synth2 = await aggregate(
		graph,
		[refinedWeak, refinedMedium, contrast2],
		"将精炼后的较弱假设综合为互补视角。",
	);

	console.log("\n阶段六：最终结论 — 合并所有线索");
	const conclusion = await conclude(
		graph,
		[synth1, synth2, contrast1, contrast2, refinedWeak],
		behavior,
	);

	graph.printGraph();

	console.log(`\n${"=".repeat(64)}`);
	console.log("动机分析（思维图）");
	console.log("=".repeat(64));
	console.log(`\n核心动机：\n${conclusion.core_motivation}`);
	console.log(`\n心理学画像：\n${conclusion.psychological_picture}`);
	console.log(`\n矛盾作为信号：\n${conclusion.contradictions_as_signal}`);
	console.log(`\n建议：\n${conclusion.recommendation}`);
	console.log("\n思维树会遗漏的内容：");
	(conclusion.what_tot_missed || []).forEach((x) => console.log(`  - ${x}`));

	writeGoTMotivationVisualization(__dirname, graph, conclusion);
	return { behavior, graph, conclusion };
}

await runGoTMotivationAnalysis(
	"一位34岁的女性辞去了稳定的办公室工作，疏远了朋友，并开始每天独自长时间散步，且不解释原因。",
);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
