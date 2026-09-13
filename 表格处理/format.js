const path = require("path");
const XLSX = require("xlsx");

// 1. 定义你要求的标准字段顺序
const TARGET_COLUMNS = [
	"updateTime",
	"recruitmentBatch",
	"enterpriseName",
	"enterpriseNature",
	"industry",
	"workLocation",
	"position",
	"graduationYear",
	"announcementLink",
	"deliveryAddress",
	"deadline",
];

function processAndCleanSheets() {
	// 替换为你的 Excel 文件名
	const inputFileName = "source_data.xlsx";
	const inputFilePath = path.join(__dirname, inputFileName);
	const outputFileName = "processed_cleaned_output.xlsx";
	const outputFilePath = path.join(__dirname, outputFileName);

	try {
		const workbook = XLSX.readFile(inputFilePath);
		const sheetNames = workbook.SheetNames;
		const newWorkbook = XLSX.utils.book_new();

		console.log(`找到以下工作表:`, sheetNames);

		sheetNames.forEach((sheetName) => {
			console.log(`\n正在处理工作表: ${sheetName}`);
			const worksheet = workbook.Sheets[sheetName];

			// blankrows: false 过滤空白行，defval: '' 保证无数据时返回空字符串
			const jsonData = XLSX.utils.sheet_to_json(worksheet, { blankrows: false, defval: "" });

			let processedRows = [];

			// 2. 遍历数据：过滤多余字段，格式化时间，并剔除全空行
			jsonData.forEach((row) => {
				let newRow = {};
				let rowHasData = false;

				TARGET_COLUMNS.forEach((col) => {
					let cellValue = row[col] !== undefined ? row[col] : "";

					// 【新增：时间格式化逻辑】
					// 1. 处理被解析为字符串的 ISO 时间 (如: 2026-09-04T00:00:00.000+08:00)
					if (typeof cellValue === "string" && cellValue.includes("T")) {
						const dateMatch = cellValue.match(/^(\d{4}-\d{2}-\d{2})T/);
						if (dateMatch) {
							cellValue = dateMatch[1]; // 只保留 2026-09-04
						}
					}
					// 2. 兜底处理：防止 xlsx 库底层将其解析为了原生 Date 对象
					else if (cellValue instanceof Date) {
						// 如果传入的是 0 时区日期，使用 toISOString 切割
						const offsetDate = new Date(cellValue.getTime() + 8 * 60 * 60 * 1000); // 补齐东八区
						cellValue = offsetDate.toISOString().split("T")[0];
					}

					newRow[col] = cellValue;

					// 判断单元格是否有实际内容
					if (cellValue !== null && String(cellValue).trim() !== "") {
						rowHasData = true;
					}
				});

				// 不是全空行才保留
				if (rowHasData) {
					processedRows.push(newRow);
				}
			});

			// 3. 剔除全空列
			const validColumns = TARGET_COLUMNS.filter((col) => {
				return processedRows.some((row) => row[col] !== null && String(row[col]).trim() !== "");
			});

			console.log(`  - 实际保留的有效数据行数: ${processedRows.length}`);
			console.log(`  - 实际保留的有效数据列数: ${validColumns.length} / ${TARGET_COLUMNS.length}`);

			// 删除多余列
			processedRows.forEach((row) => {
				TARGET_COLUMNS.forEach((col) => {
					if (!validColumns.includes(col)) {
						delete row[col];
					}
				});
			});

			// 4. 转回工作表
			const newWorksheet = XLSX.utils.json_to_sheet(processedRows, { header: validColumns });

			// 隐藏默认网格线
			newWorksheet["!views"] = [{ showGridLines: false }];

			// 5. 追加新工作表
			XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
		});

		// 6. 导出文件
		XLSX.writeFile(newWorkbook, outputFilePath);

		console.log(`\n✅ 处理完成！已去除多余空白行列，并保持原工作表结构保存至: ${outputFileName}`);
	} catch (error) {
		console.error("处理文件时出错:", error.message);
	}
}

processAndCleanSheets();
