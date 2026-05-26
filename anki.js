// Node.js 示例：从一个数组生成 CSV 文件
const fs = require("fs");

const cardData = [
	{ front: "こんにちは", back: "Hello", example: "こんにちは、元気ですか。" },
	{ front: "ありがとう", back: "Thank you", example: "どうもありがとう。" },
];

let csvLines = [];
// 可选：添加 CSV 头
// csvLines.push("Front,Back,Example");

cardData.forEach((card) => {
	// 确保字段顺序与Anki笔记类型匹配
	csvLines.push(`${card.front},${card.back},${card.example}`);
});

const csvContent = csvLines.join("\n");

fs.writeFile("anki_cards_node.csv", csvContent, "utf8", (err) => {
	if (err) {
		console.error("ファイル書き込みエラー:", err);
		return;
	}
	console.log("anki_cards_node.csv が正常に作成されました。");
});
