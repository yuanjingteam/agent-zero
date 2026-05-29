/**
 * 健壮的 JSON 解析器，用于处理 LLM（大语言模型）输出
 * 处理常见问题，例如：
 * - 缺少开头/结尾的大括号
 * - Markdown 代码块
 * - JSON 前后的多余文本
 * - 转义引号
 * - 尾部逗号
 */

/**
 * 从可能格式混乱的 LLM 输出中提取并解析 JSON
 * @param {string} text - 来自 LLM 的原始文本
 * @param {object} options - 解析选项
 * @returns {object} 解析后的 JSON 对象
 */
export function parse(text, options = {}) {
	const {
		debug = false,
		expectArray = false,
		expectObject = true,
		repairAttempts = true,
	} = options;

	if (debug) {
		console.log("\n原始 LLM 输出：");
		console.log("-".repeat(70));
		console.log(text);
		console.log(`${"-".repeat(70)}\n`);
	}

	// 步骤 1：清理文本
	const cleaned = cleanText(text, debug);

	// 步骤 2：提取 JSON
	const extracted = extractJson(cleaned, expectArray, expectObject, debug);

	// 步骤 3：尝试解析
	try {
		const parsed = JSON.parse(extracted);
		if (debug) console.log("JSON 解析成功\n");
		return parsed;
	} catch (firstError) {
		if (debug) {
			console.log("首次解析尝试失败：", firstError.message);
		}

		if (!repairAttempts) {
			throw new Error(
				`JSON 解析失败：${firstError.message}\n\n提取的文本：\n${extracted}`,
			);
		}

		// 步骤 4：尝试修复
		return attemptRepairs(extracted, debug);
	}
}

/**
 * 清理文本中的常见 LLM 产物
 */
export function cleanText(text, debug = false) {
	let cleaned = text;

	// 移除 Markdown 代码块
	cleaned = cleaned.replace(/```json\s*/gi, "");
	cleaned = cleaned.replace(/```\s*/g, "");

	// 移除常见前缀
	cleaned = cleaned.replace(
		/^(Here's the plan:|JSON output:|Plan:|Output:)\s*/i,
		"",
	);

	// 去除首尾空白
	cleaned = cleaned.trim();

	if (debug && cleaned !== text) {
		console.log("已清理文本（移除了 Markdown/前缀）\n");
	}

	return cleaned;
}

/**
 * 从文本中提取 JSON（处理 JSON 前后的文本）
 */
export function extractJson(
	text,
	expectArray = false,
	expectObject = true,
	debug = false,
) {
	// 尝试找到 JSON 的边界
	const startChar = expectArray ? "[" : "{";
	const endChar = expectArray ? "]" : "}";

	const startIdx = text.indexOf(startChar);
	const lastIdx = text.lastIndexOf(endChar);

	if (startIdx === -1 || lastIdx === -1 || startIdx >= lastIdx) {
		if (debug) {
			console.log(`未能找到有效的 ${startChar}...${endChar} 边界`);
			console.log(`起始索引：${startIdx}，结束索引：${lastIdx}`);
		}

		// 可能缺少大括号 - 尝试添加
		if (expectObject && !text.trim().startsWith("{")) {
			const withBraces = `{${text.trim()}}`;
			if (debug) console.log("已添加缺失的左大括号");
			return withBraces;
		}

		return text;
	}

	const extracted = text.substring(startIdx, lastIdx + 1);

	if (debug && extracted !== text) {
		console.log("从周围文本中提取的 JSON：");
		console.log(
			extracted.substring(0, 100) + (extracted.length > 100 ? "..." : ""),
		);
		console.log();
	}

	return extracted;
}

/**
 * 尝试各种修复策略
 */
export function attemptRepairs(jsonString, debug = false) {
	const repairs = [
		// 修复 1：移除尾部逗号
		(str) => {
			const fixed = str.replace(/,(\s*[}\]])/g, "$1");
			if (debug && fixed !== str) console.log("修复 1：已移除尾部逗号");
			return fixed;
		},

		// 修复 2：为属性名添加缺失的引号
		(str) => {
			const fixed = str.replace(
				/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
				'$1"$2":',
			);
			if (debug && fixed !== str) console.log("修复 2：已为属性名添加引号");
			return fixed;
		},

		// 修复 3：将单引号转换为双引号
		(str) => {
			const fixed = str.replace(/'/g, '"');
			if (debug && fixed !== str) console.log("修复 3：已将单引号转换为双引号");
			return fixed;
		},

		// 修复 4：添加缺失的右大括号
		(str) => {
			const openBraces = (str.match(/{/g) || []).length;
			const closeBraces = (str.match(/}/g) || []).length;
			if (openBraces > closeBraces) {
				const fixed = str + "}".repeat(openBraces - closeBraces);
				if (debug)
					console.log(
						`修复 4：已添加 ${openBraces - closeBraces} 个缺失的右大括号`,
					);
				return fixed;
			}
			return str;
		},

		// 修复 5：添加缺失的右方括号
		(str) => {
			const openBrackets = (str.match(/\[/g) || []).length;
			const closeBrackets = (str.match(/]/g) || []).length;
			if (openBrackets > closeBrackets) {
				const fixed = str + "]".repeat(openBrackets - closeBrackets);
				if (debug)
					console.log(
						`修复 5：已添加 ${openBrackets - closeBrackets} 个缺失的右方括号`,
					);
				return fixed;
			}
			return str;
		},

		// 修复 6：修复不应被转义的引号
		(str) => {
			const fixed = str.replace(/\\"/g, '"');
			if (debug && fixed !== str) console.log("修复 6：已修复转义引号");
			return fixed;
		},

		// 修复 7：移除控制字符
		(str) => {
			// biome-ignore lint/suspicious/noControlCharactersInRegex: need to strip control chars from LLM output
			const fixed = str.replace(/[\x00-\x1F\x7F]/g, "");
			if (debug && fixed !== str) console.log("修复 7：已移除控制字符");
			return fixed;
		},
	];

	let current = jsonString;

	// 依次尝试每个修复
	for (const repair of repairs) {
		current = repair(current);
	}

	// 修复后尝试解析
	try {
		const parsed = JSON.parse(current);
		if (debug) console.log("修复后解析成功\n");
		return parsed;
	} catch (error) {
		// 最后手段：尝试仅提取 atoms 数组（如果存在）
		const atomsMatch = current.match(/"atoms"\s*:\s*(\[[\s\S]*\])/);
		if (atomsMatch) {
			try {
				const atomsOnly = { atoms: JSON.parse(atomsMatch[1]) };
				if (debug) console.log("已提取并解析 atoms 数组\n");
				return atomsOnly;
			} catch (_innerError) {
				// 继续执行到最终错误处理
			}
		}

		// 如果所有修复都失败，抛出详细错误
		throw new Error(
			`所有修复尝试后 JSON 解析仍然失败。\n\n` +
				`原始错误：${error.message}\n\n` +
				`尝试修复后的内容：\n${current.substring(0, 500)}${current.length > 500 ? "..." : ""}\n\n` +
				`提示：请检查 LLM 是否正确遵循了 JSON 模式（schema）。`,
		);
	}
}

/**
 * 验证解析后的计划结构
 */
export function validatePlan(plan, debug = false) {
	if (!plan || typeof plan !== "object") {
		throw new Error("计划（plan）必须是一个对象");
	}

	if (!Array.isArray(plan.atoms)) {
		throw new Error('计划必须包含一个 "atoms" 数组');
	}

	if (plan.atoms.length === 0) {
		throw new Error("计划必须至少包含一个 atom");
	}

	for (const atom of plan.atoms) {
		if (typeof atom.id !== "number") {
			throw new Error(`Atom 缺失或无效的 id：${JSON.stringify(atom)}`);
		}

		if (!atom.kind || !["tool", "decision", "final"].includes(atom.kind)) {
			throw new Error(`Atom ${atom.id} 的 kind 无效：${atom.kind}`);
		}

		if (!atom.name || typeof atom.name !== "string") {
			throw new Error(`Atom ${atom.id} 缺失或无效的 name`);
		}

		if (atom.dependsOn && !Array.isArray(atom.dependsOn)) {
			throw new Error(`Atom ${atom.id} 的 dependsOn 必须是一个数组`);
		}
	}

	if (debug) {
		console.log(`计划结构验证通过：${plan.atoms.length} 个 atoms\n`);
	}

	return true;
}

/**
 * 美观打印计划，用于调试
 */
export function prettyPrint(plan) {
	console.log("\n计划结构：");
	console.log("=".repeat(70));

	for (const atom of plan.atoms) {
		const deps =
			atom.dependsOn && atom.dependsOn.length > 0
				? `（依赖于：${atom.dependsOn.join(", ")}）`
				: "";

		console.log(`  ${atom.id}. [${atom.kind}] ${atom.name}${deps}`);

		if (atom.input && Object.keys(atom.input).length > 0) {
			console.log(`     输入：${JSON.stringify(atom.input)}`);
		}
	}

	console.log(`${"=".repeat(70)}\n`);
}

/** @deprecated Use named exports instead */
export const JsonParser = {
	parse,
	cleanText,
	extractJson,
	attemptRepairs,
	validatePlan,
	prettyPrint,
};
