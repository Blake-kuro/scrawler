import { Client } from "@gradio/client";
import XLSX from "xlsx";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, parse } from "path";

// --- 配置区 ---
const IMG_DIR = "./test";
const OUTPUT_FILE = "国家电投公示汇总_校对版.xlsx";
const API_URL = "https://jockerk-tablerec.ms.show/";

/**
 * 纠偏与清洗逻辑：处理 OCR 常见的粘连和乱码
 */
function refineRow(row) {
	// 1. 清洗数据：去掉 HTML 标签、多余空格和特殊符号（如 | _ ）
	let cleanRow = row
		.map((cell) =>
			cell
				.replace(/<[^>]+>/g, "")
				.replace(/[|_]/g, "")
				.replace(/\s+/g, "")
				.trim()
		)
		.filter((cell) => cell.length > 0); // 过滤掉空单元格

	// 2. 逻辑纠偏：根据你要求的 4 列结构（姓名、性别、学校、手机号）
	// 如果 OCR 把多列粘在一起了（比如 "张三男XX大学"），尝试拆分
	if (cleanRow.length === 1 && cleanRow[0].length > 15) {
		// 这种情况通常是整行粘连，尝试按常见长度切分，或者标记为需要人工核对
		return [cleanRow[0], "数据粘连", "", ""];
	}

	// 只要前 4 列，多余的通常是页码或备注，直接弃掉
	return cleanRow.slice(0, 4);
}

/**
 * HTML 表格深度解析
 */
function parseHtmlTable(html) {
	const rows = [];
	const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
	const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
	let trMatch;

	while ((trMatch = trRegex.exec(html)) !== null) {
		const tempRow = [];
		let tdMatch;
		while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
			tempRow.push(tdMatch[1]);
		}

		const finalized = refineRow(tempRow);
		// 只有当这一行看起来像有效数据（至少有姓名和学校）时才加入
		if (finalized.length >= 2 && !finalized[0].includes("姓名") && !finalized[0].includes("序号")) {
			rows.push(finalized);
		}
	}
	return rows;
}

async function main() {
	if (!existsSync(IMG_DIR)) return console.error("文件夹不存在");

	const workbook = XLSX.utils.book_new();
	const files = readdirSync(IMG_DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
	let client = await Client.connect(API_URL);

	for (const file of files) {
		console.log(`正在处理: ${file}`);
		try {
			const imageBlob = new Blob([readFileSync(join(IMG_DIR, file))]);

			// --- 严格按照你给出的参数结构进行请求 ---
			const result = await client.predict("/process_image", {
				img_input: imageBlob,
				small_box_cut_enhance: true,
				table_engine_type: "auto",
				char_ocr: true,
				rotated_fix: true,
				col_threshold: 7, // 💡 修改建议：如果你觉得错乱，将 5 改为 2，增加对列的敏感度
				row_threshold: 5,
			});

			const htmlData = result.data?.[0];
			console.log("htmlData", htmlData);

			// if (typeof htmlData === "string" && htmlData.includes("<table")) {
			// 	const aoaData = parseHtmlTable(htmlData);

			// 	if (aoaData.length > 0) {
			// 		const sheetData = [["序号","姓名", "性别", "毕业学校", "手机号",""], ...aoaData];
			// 		const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

			// 		// 美化表格宽度
			// 		worksheet["!cols"] = [{ wch: 10 }, { wch: 5 }, { wch: 30 }, { wch: 15 }];

			// 		const safeName = parse(file)
			// 			.name.substring(0, 30)
			// 			.replace(/[\\/?*[\]]/g, "_");
			// 		XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
			// 		console.log(`   ✅ 已生成`);
			// 	}
			// }
		} catch (err) {
			console.error(`   ❌ 报错: ${err.message}`);
		}
		// 稍微停顿，避免 API 压力过大
		await new Promise((r) => setTimeout(r, 100));
	}

	XLSX.writeFile(workbook, OUTPUT_FILE);
	console.log(`\n🎉 全部完成！文件见: ${OUTPUT_FILE}`);
}

main().catch(console.error);
