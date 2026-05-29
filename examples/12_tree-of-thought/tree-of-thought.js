/**
 * 示例 12：思维树（Tree of Thought, ToT）— 动机分析
 *
 * 运行：
 *   node examples/12_tree-of-thought/tree-of-thought.js
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { JsonParser } from "../../helper/json-parser.js";
import { writeToTMotivationVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const HYPOTHESIS_TYPES = [
	"回避动机（逃避负面事物）",
	"职业倦怠与情绪耗竭",
	"成长动机（追求更好的状态）",
	"外部社会压力（家庭、伴侣、社会）",
];

const BEHAVIOR_INPUT =
	"一位34岁的女性辞去了稳定的办公室工作，疏远了朋友，并开始每天独自长时间散步，且不解释原因。";

const systemPrompt = `你是一位细心的心理学分析助手。
你始终只返回符合所提供模式的有效JSON。
不要使用markdown、代码围栏或JSON之外的文本。`;

const hypothesisSchema = {
	type: "object",
	properties: {
		name: { type: "string" },
		argument: { type: "string" },
		signals: { type: "array", items: { type: "string" } },
		counter_evidence: { type: "array", items: { type: "string" } },
	},
	required: ["name", "argument", "signals", "counter_evidence"],
};

const scoreSchema = {
	type: "object",
	properties: {
		explanatory_power: { type: "number" },
		plausibility: { type: "number" },
		falsifiability: { type: "number" },
		total: { type: "number" },
		reasoning: { type: "string" },
		blind_spot: { type: "string" },
	},
	required: [
		"explanatory_power",
		"plausibility",
		"falsifiability",
		"total",
		"reasoning",
		"blind_spot",
	],
};

const rankingSchema = {
	type: "object",
	properties: {
		ranking: {
			type: "array",
			items: { type: "integer" },
			minItems: 4,
			maxItems: 4,
		},
		rationale: { type: "string" },
	},
	required: ["ranking", "rationale"],
};

const analysisSchema = {
	type: "object",
	properties: {
		summary: { type: "string" },
		psychological_background: { type: "string" },
		recommendation: { type: "string" },
		open_questions: { type: "array", items: { type: "string" } },
	},
	required: [
		"summary",
		"psychological_background",
		"recommendation",
		"open_questions",
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

async function developHypothesis(behavior, hypothesisType) {
	return promptJson(
		hypothesisSchema,
		`你是一位经验丰富的心理学家。严格从以下单一视角分析此行为：
"${hypothesisType}"。

行为：
"${behavior}"

提出一个连贯的解释。
仅从这个方向思考，忽略其他可能的解释。

返回JSON：
{
  "name": "${hypothesisType}",
  "argument": "2-3句心理学解释",
  "signals": ["支持该假设的信号1", "信号2", "信号3"],
  "counter_evidence": ["削弱此假设的因素1", "削弱此假设的因素2"]
}`,
	);
}

async function scoreHypothesis(behavior, hypothesis) {
	const scored = await promptJson(
		scoreSchema,
		`你是一位批判性心理学家。为以下假设评分。

行为：
"${behavior}"

假设论点：
"${hypothesis.argument}"

支持信号：${hypothesis.signals.join(", ")}
反驳证据：${hypothesis.counter_evidence.join(", ")}

评分标准：
- explanatory_power（解释力，1-10）：该假设能解释多少行为
- plausibility（合理性，1-10）：心理学依据有多充分
- falsifiability（可证伪性，1-10）：可检验/可质疑的程度
所有标准和总分均使用小数分数（保留一位小数）。
使用以下公式计算总分：
total = 0.45 * explanatory_power + 0.35 * plausibility + 0.20 * falsifiability
在有充分理由时使用不同的分数。避免给出相同的总分，除非两个假设确实无法区分。

返回JSON：
{
  "explanatory_power": 7.4,
  "plausibility": 8.1,
  "falsifiability": 6.5,
  "total": 7.0,
  "reasoning": "评分理由",
  "blind_spot": "此假设根本无法解释的方面"
}`,
	);

	return {
		hypothesis,
		score: Number(scored.total),
		reasoning: scored.reasoning,
		blindSpot: scored.blind_spot,
		details: {
			explanatory_power: Number(scored.explanatory_power),
			plausibility: Number(scored.plausibility),
			falsifiability: Number(scored.falsifiability),
		},
	};
}

function pruneHypotheses(scoredHypotheses) {
	const sorted = [...scoredHypotheses].sort((a, b) => b.score - a.score);
	return { winner: sorted[0], discarded: sorted.slice(1), sorted };
}

async function rerankHypotheses(behavior, scoredHypotheses) {
	const indexed = scoredHypotheses.map((s, i) => ({
		idx: i,
		name: s.hypothesis.name,
		argument: s.hypothesis.argument,
		score: s.score,
	}));
	const payload = indexed
		.map(
			(x) =>
				`#${x.idx + 1}: ${x.name}\nscore=${x.score}\nargument=${x.argument}`,
		)
		.join("\n\n");

	const ranked = await promptJson(
		rankingSchema,
		`将以下假设从强到弱排序。
必须返回严格的排名，不得有并列。

行为：
"${behavior}"

假设：
${payload}

返回JSON：
{
  "ranking": [2, 1, 4, 3],
  "rationale": "简要理由"
}`,
	);

	const order = Array.isArray(ranked.ranking) ? ranked.ranking : [];
	const valid =
		order.length === scoredHypotheses.length &&
		new Set(order).size === scoredHypotheses.length;
	if (!valid) return scoredHypotheses;

	const base = 8.8;
	const step = 0.7;
	const adjusted = [...scoredHypotheses];
	order.forEach((rankedId, pos) => {
		const idx = Number(rankedId) - 1;
		if (idx >= 0 && idx < adjusted.length)
			adjusted[idx].score = Number((base - pos * step).toFixed(1));
	});
	return adjusted;
}

async function createConclusion(behavior, winner) {
	return promptJson(
		analysisSchema,
		`你是一位经验丰富的心理学家，正在撰写案例分析。
此分析仅基于最强假设。

行为：
"${behavior}"

主导假设：
"${winner.hypothesis.name}"

核心论点：
"${winner.hypothesis.argument}"

优势：
${winner.hypothesis.signals.join(", ")}

返回JSON：
{
  "summary": "2-3句话：最可能的动机",
  "psychological_background": "3-4句话：深层机制",
  "recommendation": "2-3句话：目前可以帮助此人的建议",
  "open_questions": ["待解决的问题1", "待解决的问题2", "待解决的问题3"]
}`,
	);
}

async function runTreeOfThoughtMotivationAnalysis(behavior) {
	console.log("\n思维树：个人动机分析");
	console.log(`行为："${behavior}"\n`);

	console.log("阶段一：分支 — 提出4个竞争性假设");
	const hypotheses = [];
	for (const type of HYPOTHESIS_TYPES) {
		process.stdout.write(`  正在分析"${type.split("（")[0].trim()}" ... `);
		const h = await developHypothesis(behavior, type);
		hypotheses.push(h);
		console.log("完成");
		console.log(`    论点："${h.argument.slice(0, 85)}..."`);
		console.log(`    信号：${h.signals[0] ?? "无"}`);
	}

	console.log("\n阶段二：评分 — 独立评估每个假设");
	const scored = [];
	for (const h of hypotheses) {
		process.stdout.write(`  正在评分"${h.name.split("（")[0].trim()}" ... `);
		const s = await scoreHypothesis(behavior, h);
		scored.push(s);
		console.log("已记录");
	}
	const reranked = await rerankHypotheses(behavior, scored);
	scored.splice(0, scored.length, ...reranked);
	console.log("  校准后的分数（用于剪枝）：");
	[...scored]
		.sort((a, b) => b.score - a.score)
		.forEach((s) => {
			console.log(
				`    - ${s.hypothesis.name.split("（")[0].trim()}：${s.score}/10`,
			);
			console.log(
				`      标准：解释力=${s.details.explanatory_power.toFixed(1)} | 合理性=${s.details.plausibility.toFixed(1)} | 可证伪性=${s.details.falsifiability.toFixed(1)}`,
			);
			console.log(`      盲点："${s.blindSpot.slice(0, 95)}..."`);
		});

	console.log("\n阶段三：剪枝 — 保留胜者，淘汰其余");
	const { winner, discarded } = pruneHypotheses(scored);
	console.log(`  胜者："${winner.hypothesis.name}"（分数：${winner.score}）`);
	discarded.forEach((d) => {
		console.log(`  已淘汰："${d.hypothesis.name}"（分数：${d.score}）`);
		console.log(`    丧失的视角："${d.blindSpot.slice(0, 100)}..."`);
	});

	console.log("\n阶段四：结论 — 仅基于胜者进行分析");
	const analysis = await createConclusion(behavior, winner);

	console.log(`\n${"=".repeat(64)}`);
	console.log("动机分析（思维树）");
	console.log("=".repeat(64));
	console.log(`\n主导假设："${winner.hypothesis.name}"`);
	console.log(`\n总结：\n${analysis.summary}`);
	console.log(`\n心理学背景：\n${analysis.psychological_background}`);
	console.log(`\n建议：\n${analysis.recommendation}`);
	console.log("\n待解决的问题（本次ToT运行未解决）：");
	(analysis.open_questions || []).forEach((q) => console.log(`  - ${q}`));

	console.log(`\n${"-".repeat(64)}`);
	console.log("本次思维树运行中丢失的信息");
	console.log("-".repeat(64));
	discarded.forEach((d) => {
		console.log(
			`\n已淘汰"${d.hypothesis.name.split("（")[0].trim()}"（分数：${d.score}）`,
		);
		console.log(`  论点（未使用）："${d.hypothesis.argument.slice(0, 90)}..."`);
		console.log(`  本可通过以下方式纠正胜者："${d.blindSpot.slice(0, 90)}..."`);
	});

	writeToTMotivationVisualization(__dirname, {
		scored,
		winnerName: winner.hypothesis.name,
		analysis,
	});

	return { behavior, winner, discarded, analysis };
}

await runTreeOfThoughtMotivationAnalysis(BEHAVIOR_INPUT);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
