import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
	modelPath: path.join(__dirname, "..", "..", "models", "Qwen3-1.7B-Q8_0.gguf"),
});
const systemPrompt = `你是一位逻辑推理和数量分析专家。
    你的目标是分析涉及家庭、数量、平均值和实体关系的现实应用题，
    并计算出精确的数值答案。

    目标：只返回正确的最终数字作为单一值——不需要解释，不需要推理步骤，只要答案。
    `;
const context = await model.createContext();
const session = new LlamaChatSession({
	contextSequence: context.getSequence(),
	systemPrompt,
});

const prompt = `这周是我家的家庭聚会，我被分配带土豆泥去。
    参加聚会的人包括：已婚的爸爸妈妈、我的双胞胎兄弟和他的家人、我的姑姑和她的家人、我的奶奶
    和她的兄弟、她兄弟的女儿，以及他女儿的家人。除了我之外，所有成年人都已结婚，没有人
    离婚或再婚，但我的爷爷和奶奶的妯娌去年去世了。所有在世的配偶都会参加。
    我的兄弟有两个还在上小学的孩子，我的姑姑有一个六岁的孩子，我奶奶兄弟的女儿有
    三个12岁以下的孩子。我估计每个成年人大约吃1.5个土豆，每个孩子大约吃半个土豆，但我的
    远房表亲不吃碳水化合物。一个土豆平均大约半磅，土豆是按5磅一袋出售的。

    我需要买多少整袋的土豆？
`;

const answer = await session.prompt(prompt);
console.log(`AI: ${answer}`);

llama.dispose();
model.dispose();
context.dispose();
session.dispose();
