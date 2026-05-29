import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MemoryManager {
	constructor(memoryFileName = "./memory.json") {
		this.memoryFilePath = path.resolve(__dirname, memoryFileName);
	}

	async loadMemories() {
		try {
			const data = await fs.readFile(this.memoryFilePath, "utf-8");
			const json = JSON.parse(data);

			// 如果需要，迁移旧的模式（schema）
			if (!json.memories) {
				const upgraded = { memories: [], conversationHistory: [] };

				if (Array.isArray(json.facts)) {
					for (const f of json.facts) {
						upgraded.memories.push({
							type: "fact",
							key: this.extractKey(f.content),
							value: this.extractValue(f.content),
							source: "migration",
							timestamp: f.timestamp || new Date().toISOString(),
						});
					}
				}

				if (json.preferences && typeof json.preferences === "object") {
					for (const [key, val] of Object.entries(json.preferences)) {
						upgraded.memories.push({
							type: "preference",
							key,
							value: this.extractValue(val),
							source: "migration",
							timestamp: new Date().toISOString(),
						});
					}
				}

				await this.saveMemories(upgraded);
				return upgraded;
			}

			if (!Array.isArray(json.memories)) json.memories = [];
			if (!Array.isArray(json.conversationHistory))
				json.conversationHistory = [];

			return json;
		} catch {
			return { memories: [], conversationHistory: [] };
		}
	}

	async saveMemories(memories) {
		await fs.writeFile(this.memoryFilePath, JSON.stringify(memories, null, 2));
	}

	// 添加或更新记忆，避免重复
	async addMemory({ type, key, value, source = "user" }) {
		const data = await this.loadMemories();

		// 规范化以便比较
		const normType = type.trim().toLowerCase();
		const normKey = key.trim().toLowerCase();
		const normValue = value.trim();

		// 检查是否已存在相同的键+类型
		const existingIndex = data.memories.findIndex(
			(m) => m.type === normType && m.key.toLowerCase() === normKey,
		);

		if (existingIndex >= 0) {
			const existing = data.memories[existingIndex];
			// 如果值已更改则更新
			if (existing.value !== normValue) {
				existing.value = normValue;
				existing.timestamp = new Date().toISOString();
				existing.source = source;
				console.log(`已更新记忆: ${normKey} → ${normValue}`);
			} else {
				console.log(`跳过重复记忆: ${normKey}`);
			}
		} else {
			// 添加新记忆
			data.memories.push({
				type: normType,
				key: normKey,
				value: normValue,
				source,
				timestamp: new Date().toISOString(),
			});
			console.log(`已添加记忆: ${normKey} = ${normValue}`);
		}

		await this.saveMemories(data);
	}

	async getMemorySummary() {
		const data = await this.loadMemories();
		const facts = Array.isArray(data.memories)
			? data.memories.filter((m) => m.type === "fact")
			: [];
		const prefs = Array.isArray(data.memories)
			? data.memories.filter((m) => m.type === "preference")
			: [];

		let summary = "\n=== 长期记忆 ===\n";

		if (facts.length > 0) {
			summary += "\n已知事实:\n";
			for (const f of facts) summary += `- ${f.key}: ${f.value}\n`;
		}

		if (prefs.length > 0) {
			summary += "\n用户偏好:\n";
			for (const p of prefs) summary += `- ${p.key}: ${p.value}\n`;
		}

		return summary;
	}

	extractKey(content) {
		if (typeof content !== "string") return "unknown";
		const [key] = content.split(":").map((s) => s.trim());
		return key || "unknown";
	}

	extractValue(content) {
		if (typeof content !== "string") return "";
		const parts = content.split(":").map((s) => s.trim());
		return parts.length > 1 ? parts.slice(1).join(":") : content;
	}
}
