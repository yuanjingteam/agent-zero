/**
 * 示例 14：思维链（Chain of Thought, CoT）— 退货决策
 *
 * 运行：
 *   node examples/14_chain-of-thought/chain-of-thought.js
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { JsonParser } from "../../helper/json-parser.js";
import { writeCoTReturnVisualization } from "../../helper/visualization-writers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debug = false;

const RETURN_CASE = {
	request_id: "RET-2026-0414",
	customer_id: "CUST-90871",
	product: "无线降噪耳机 X2",
	order_date: "2026-03-29",
	delivery_date: "2026-04-01",
	request_date: "2026-04-24",
	claimed_reason: "右耳罩间歇性声音中断",
	claim_timing_days_after_delivery: 23,
	order_value_eur: 189.0,
	return_count_last_12_months: 3,
	previous_high_value_returns: 2,
	account_age_months: 46,
	payment_method: "credit_card_verified",
	shipping_address_matches_payment: true,
	diagnostic_log_uploaded: true,
	photo_evidence_uploaded: false,
	replacement_requested: true,
};

const RETURN_POLICY = {
	return_window_days: 30,
	max_high_value_returns_12m_before_manual_review: 2,
	mandatory_manual_review_amount_eur: 250,
	allowed_outcomes: ["approve", "reject", "manual_review"],
};

const systemPrompt = `你是一位细心的电商风险分析师。
你必须严格按照要求的阶段执行，且只返回有效JSON。
不要使用markdown、代码围栏或JSON之外的文本。`;

const factsSchema = {
	type: "object",
	properties: {
		extracted_facts: {
			type: "array",
			items: { type: "string" },
			minItems: 6,
		},
		missing_information: {
			type: "array",
			items: { type: "string" },
		},
	},
	required: ["extracted_facts", "missing_information"],
};

const redFlagsSchema = {
	type: "object",
	properties: {
		checkpoints: {
			type: "array",
			items: {
				type: "object",
				properties: {
					check: { type: "string" },
					status: {
						type: "string",
						enum: ["present", "not_present", "unclear"],
					},
					evidence: { type: "string" },
				},
				required: ["check", "status", "evidence"],
			},
			minItems: 5,
		},
		fraud_score: { type: "number" },
		fraud_rationale: { type: "string" },
	},
	required: ["checkpoints", "fraud_score", "fraud_rationale"],
};

const legitimacySchema = {
	type: "object",
	properties: {
		customer_supporting_points: {
			type: "array",
			items: {
				type: "object",
				properties: {
					point: { type: "string" },
					strength: { type: "string", enum: ["high", "medium", "low"] },
					evidence: { type: "string" },
				},
				required: ["point", "strength", "evidence"],
			},
			minItems: 4,
		},
		legitimacy_score: { type: "number" },
		legitimacy_rationale: { type: "string" },
	},
	required: [
		"customer_supporting_points",
		"legitimacy_score",
		"legitimacy_rationale",
	],
};

const policySchema = {
	type: "object",
	properties: {
		policy_checks: {
			type: "array",
			items: {
				type: "object",
				properties: {
					rule: { type: "string" },
					status: {
						type: "string",
						enum: ["pass", "fail", "manual_review_trigger"],
					},
					reason: { type: "string" },
				},
				required: ["rule", "status", "reason"],
			},
			minItems: 4,
		},
		policy_outcome: {
			type: "string",
			enum: ["approve", "reject", "manual_review"],
		},
	},
	required: ["policy_checks", "policy_outcome"],
};

const decisionSchema = {
	type: "object",
	properties: {
		final_decision: {
			type: "string",
			enum: ["approve", "reject", "manual_review"],
		},
		confidence: { type: "number" },
		decision_reasoning: { type: "string" },
		customer_message: { type: "string" },
		internal_note: { type: "string" },
	},
	required: [
		"final_decision",
		"confidence",
		"decision_reasoning",
		"customer_message",
		"internal_note",
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
		maxTokens: 1400,
		temperature: 0.2,
	});
	return JsonParser.parse(raw, {
		debug,
		expectObject: true,
		repairAttempts: true,
	});
}

async function extractFacts(returnCase) {
	return promptJson(
		factsSchema,
		`第1阶段（共5阶段）：仅提取事实。
从退货请求中提取事实，不进行评估、怀疑或判断。
不要推断意图，不要评分。只捕获明确已知的信息。

退货请求JSON：
${JSON.stringify(returnCase, null, 2)}

返回JSON：
{
  "extracted_facts": ["事实1", "事实2", "事实3"],
  "missing_information": ["缺失信息1", "缺失信息2"]
}`,
	);
}

async function screenRedFlags(returnCase, facts) {
	return promptJson(
		redFlagsSchema,
		`第2阶段（共5阶段）：红旗筛查。
逐项评估潜在欺诈指标。
对每个检查点明确说明其是否存在、不存在或不确定。

使用以下检查点：
1) 近期频繁退货行为
2) 高价值退货模式
3) 支付/配送身份不一致
4) 缺陷证据薄弱或缺失
5) 具有策略性的时间模式
6) 账户行为异常

已知案例数据：
${JSON.stringify(returnCase, null, 2)}

第1阶段提取的事实：
${JSON.stringify(facts.extracted_facts, null, 2)}

返回JSON：
{
  "checkpoints": [
    { "check": "近期频繁退货行为", "status": "present", "evidence": "..." }
  ],
  "fraud_score": 6.0,
  "fraud_rationale": "..."
}`,
	);
}

async function assessLegitimacy(returnCase, facts) {
	return promptJson(
		legitimacySchema,
		`第3阶段（共5阶段）：正当性视角。
现在构建客户一方的论据。
列出此次退货可能是正当的理由。
不要参考欺诈分数。关注公平性和合理的产品故障。

已知案例数据：
${JSON.stringify(returnCase, null, 2)}

第1阶段提取的事实：
${JSON.stringify(facts.extracted_facts, null, 2)}

返回JSON：
{
  "customer_supporting_points": [
    { "point": "论据文本", "strength": "high", "evidence": "..." }
  ],
  "legitimacy_score": 7.0,
  "legitimacy_rationale": "..."
}`,
	);
}

async function checkPolicy(returnCase, policy, redFlags, legitimacy) {
	return promptJson(
		policySchema,
		`第4阶段（共5阶段）：政策检查。
严格执行政策。不要编造规则。
综合使用风险和正当性上下文，但最终状态必须符合政策。

政策JSON：
${JSON.stringify(policy, null, 2)}

案例JSON：
${JSON.stringify(returnCase, null, 2)}

欺诈分数：${redFlags.fraud_score}
正当性分数：${legitimacy.legitimacy_score}

返回JSON：
{
  "policy_checks": [
    { "rule": "退货窗口期 <= 30天", "status": "pass", "reason": "..." }
  ],
  "policy_outcome": "manual_review"
}`,
	);
}

async function makeDecision(
	returnCase,
	phase1Facts,
	redFlags,
	legitimacy,
	policyResult,
) {
	return promptJson(
		decisionSchema,
		`第5阶段（共5阶段）：最终决策。
你现在才可以做出决定。使用所有前置阶段的信息。
清楚解释权衡取舍。如果存在冲突（例如欺诈6/10 vs 正当性7/10），展示政策如何解决。

案例：
${JSON.stringify(returnCase, null, 2)}

第1阶段事实：
${JSON.stringify(phase1Facts, null, 2)}

第2阶段红旗：
${JSON.stringify(redFlags, null, 2)}

第3阶段正当性：
${JSON.stringify(legitimacy, null, 2)}

第4阶段政策：
${JSON.stringify(policyResult, null, 2)}

返回JSON：
{
  "final_decision": "manual_review",
  "confidence": 0.79,
  "decision_reasoning": "...",
  "customer_message": "...",
  "internal_note": "..."
}`,
	);
}

async function runChainOfThoughtReturnDecision(returnCase, policy) {
	console.log("\n思维链：退货决策（欺诈 vs 正当）");
	console.log(`案例编号：${returnCase.request_id}`);
	console.log(`原因："${returnCase.claimed_reason}"\n`);

	console.log("第1阶段：事实 — 仅提取，不判断");
	const facts = await extractFacts(returnCase);
	(facts.extracted_facts || []).slice(0, 6).forEach((fact) => {
		console.log(`  - ${fact}`);
	});

	console.log("\n第2阶段：红旗 — 明确的欺诈筛查");
	const redFlags = await screenRedFlags(returnCase, facts);
	console.log(`  欺诈分数：${Number(redFlags.fraud_score).toFixed(1)}/10`);
	(redFlags.checkpoints || []).slice(0, 6).forEach((cp) => {
		console.log(`  - ${cp.check}：${cp.status}`);
	});

	console.log("\n第3阶段：正当性 — 客户方平衡");
	const legitimacy = await assessLegitimacy(returnCase, facts);
	console.log(
		`  正当性分数：${Number(legitimacy.legitimacy_score).toFixed(1)}/10`,
	);
	(legitimacy.customer_supporting_points || []).slice(0, 4).forEach((p) => {
		console.log(`  - ${p.point}（${p.strength}）`);
	});

	console.log("\n第4阶段：政策检查 — 规则约束的结果");
	const policyResult = await checkPolicy(
		returnCase,
		policy,
		redFlags,
		legitimacy,
	);
	console.log(`  政策结果：${policyResult.policy_outcome}`);
	(policyResult.policy_checks || []).slice(0, 4).forEach((r) => {
		console.log(`  - ${r.rule}：${r.status}`);
	});

	console.log("\n第5阶段：决策 — 基于完整链条的最终判断");
	const decision = await makeDecision(
		returnCase,
		facts,
		redFlags,
		legitimacy,
		policyResult,
	);

	console.log(`\n${"=".repeat(72)}`);
	console.log("退货决策（思维链）");
	console.log("=".repeat(72));
	console.log(
		`\n欺诈分数：      ${Number(redFlags.fraud_score).toFixed(1)}/10`,
	);
	console.log(
		`正当性分数：    ${Number(legitimacy.legitimacy_score).toFixed(1)}/10`,
	);
	console.log(`政策结果：      ${policyResult.policy_outcome}`);
	console.log(`最终决策：      ${decision.final_decision}`);
	console.log(`置信度：        ${Number(decision.confidence).toFixed(2)}`);

	console.log(`\n决策推理：\n${decision.decision_reasoning}`);
	console.log(`\n客户消息：\n${decision.customer_message}`);
	console.log(`\n内部备注：\n${decision.internal_note}`);

	writeCoTReturnVisualization(__dirname, {
		returnCase,
		policy,
		facts,
		redFlags,
		legitimacy,
		policyResult,
		decision,
	});

	return {
		returnCase,
		policy,
		facts,
		redFlags,
		legitimacy,
		policyResult,
		decision,
	};
}

await runChainOfThoughtReturnDecision(RETURN_CASE, RETURN_POLICY);

session.dispose();
context.dispose();
model.dispose();
llama.dispose();
