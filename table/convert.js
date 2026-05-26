import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

// 获取当前脚本的绝对路径
const __dirname = dirname(fileURLToPath(import.meta.url));

// --- 修改后的配置区 ---
// 这样写的话，只要 TXT 和 JS 在同一个文件夹，无论你在哪运行都不会报错
const inputFile = join(__dirname, "[OCR]_Downloads_20260225_2318.txt");
const outputFile = "国家电投拟录用名单汇总.xlsx";
// --- 配置区 ---

// 标准列顺序
const HEADERS = ["序号", "应聘单位", "姓名", "性别", "身份证号", "毕业院校"];

function processTxtToExcel() {
	const content = readFileSync(inputFile, "utf8");

	// 1. 根据 ≦ 和 ≧ 分割不同的公示块
	const sections = content.split(/≦|≧/);
	const workbook = XLSX.utils.book_new();

	// sections 的偶数索引通常是标题，奇数索引是内容（从索引1开始）
	for (let i = 1; i < sections.length; i += 2) {
		let sheetName = sections[i]
			.trim()
			.substring(0, 31)
			.replace(/[\\/?*[\]]/g, "_");
		let rawText = sections[i + 1].trim();

		if (!rawText) continue;

		// 2. 识别每个标题在文本中的位置
		const headerPositions = [];
		HEADERS.forEach((h) => {
			const index = rawText.indexOf(h);
			if (index !== -1) {
				headerPositions.push({ name: h, pos: index });
			}
		});

		// 按在文本中出现的先后顺序排序
		headerPositions.sort((a, b) => a.pos - b.pos);

		// 3. 提取每列的数据块
		const columnsData = {};
		for (let j = 0; j < headerPositions.length; j++) {
			const current = headerPositions[j];
			const next = headerPositions[j + 1];

			const start = current.pos + current.name.length;
			const end = next ? next.pos : rawText.length;

			// 提取数据并按行分割，过滤空行
			const block = rawText
				.substring(start, end)
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line !== "");

			columnsData[current.name] = block;
		}

		// 4. 将列数据转为行数据 (AOA 格式)
		const maxRows = Math.max(...Object.values(columnsData).map((col) => col.length));
		const sheetRows = [HEADERS]; // 第一行是表头

		for (let r = 0; r < maxRows; r++) {
			const row = HEADERS.map((h) => (columnsData[h] ? columnsData[h][r] || "" : ""));
			sheetRows.push(row);
		}

		// 5. 生成工作表
		const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);

		// 设置简单列宽
		worksheet["!cols"] = [{ wch: 8 }, { wch: 12 }, { wch: 6 }, { wch: 35 }, { wch: 25 }];

		XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
		console.log(`✅ 已处理工作表: ${sheetName}`);
	}

	// 6. 写入文件
	XLSX.writeFile(workbook, outputFile);
	console.log(`\n🎉 转换完成！Excel 已保存至: ${outputFile}`);
}

processTxtToExcel();
