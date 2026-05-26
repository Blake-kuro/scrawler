import { firefox } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import XLSX from "xlsx";
import pLimit from "p-limit";

/**
 *
 * @param {string} url
 * @param {import("playwright").Browser} browser
 * @returns
 */
const fetchOneUrl = async (url, browser) => {
	console.log("start", url);
	const page = await browser.newPage();
	await page.goto(url);

	// 等待表格加载完成（示例等待id为myTable的表格第二行出现）
	// 你根据实际的页面结构替换下面的选择器
	console.log("waiting for", url);
	// await page.waitForSelector(".announcementTable tr:nth-child(2)", { timeout: 20000 });
	await page.waitForTimeout(15000);

	// 抓取表格HTML
	const tbodyLocator = page.locator("tbody");

	const tableHtmlList = await page.$("tbody");
	const tableTitle = await page.$("p");
	console.log("tableHtmlList", tableHtmlList);
	console.log("tableTitle", tableTitle);
	console.log("tbodyLocator", tbodyLocator);

	const tables = await Promise.all(
		tableHtmlList.map(async (element, index) => {
			// console.log(sheetTitle);

			const titleText = await tableTitle[index].innerText();
			const innerText = await element.innerText();
			const innerText_1 = await tbodyLocator.innerText();

			console.log("titleText", titleText);
			console.log("innerText", innerText);
			console.log("innerText_1", innerText_1);

			return { value: innerText, titleText, url, index };
		})
	);

	// const $sheetTitle = await page.$("h3");
	// const sheetTitle = await $sheetTitle.innerText();

	// console.log("done", url);

	// return { tables, sheetTitle };
};

async function main() {
	const browser = await firefox.launch({ headless: false });

	const urls = [];
	const workbook = XLSX.utils.book_new();
	const limit = pLimit(10); // 最多并发 3 个请求
	const results = await Promise.allSettled(
		urls.map((url) => limit(() => fetchOneUrl(url, browser)))
	);

	results.forEach((res, urlIndex) => {
		if (res.status === "fulfilled") {
			// const { tables, sheetTitle } = res.value;
			// console.log("tables", tables);
			// const rowsList = [];
			// rowsList.push([sheetTitle]);
			// for (let i = 0; i < tables.length; i++) {
			// 	const { url, titleText } = tables[i];
			// 	console.log("url", url);
			// 	console.log("titleText", titleText);
			// 	const titleArr = titleText.split("\n");
			// 	const id = new URL(url).searchParams.get("id");
			// 	// writeFileSync(resolve(__dirname, id), tables[i].value, "utf-8");
			// 	// 拆分为二维数组
			// 	const rows = tables[i].value
			// 		.trim()
			// 		.split("\n")
			// 		.map((row) => row.split("\t"));
			// 	rowsList.push(titleArr);
			// 	rowsList.push(...rows);
			// 	rowsList.push([]);
			// }
			// // 转为 worksheet
			// console.log("create a sheet", urlIndex);
			// const worksheet = XLSX.utils.aoa_to_sheet(rowsList);
			// worksheet["!merges"] = [
			// 	{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // 合并 A1:F1
			// ];
			// // 创建 workbook
			// console.log("merge to workbook", urlIndex);
			// XLSX.utils.book_append_sheet(workbook, worksheet, `${urlIndex}`);
		} else {
			console.log("error:", urlIndex, urls[urlIndex]);
		}
	});

	// // 写入 Excel 文件
	// XLSX.writeFile(workbook, "人员名单.xlsx");
	await browser.close();
}

main();
