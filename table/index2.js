import { firefox } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
import XLSX from "xlsx";
import pLimit from "p-limit";
// import { url_data } from "./urls.json";
// https://zhaopin.sgcc.com.cn/sgcchr/static/unitPart.html?bullet_id=e7b433a00dc741c3bbebf9cba8429b15&particulars=flase
/**
 *
 * @param {string} url
 * @param {import("playwright").Browser} browser
 * @returns
 */

// ... import 语句和 fetchOneUrl, fetchWithRetry 函数定义 ...
/**
 * 抓取单个链接数据的核心函数 - 重构优化版
 * @param {string} url 要抓取的链接
 * @param {object} browser Playwright 浏览器实例
 * @returns {Promise<{table: Array<object>}>} 包含抓取结果的对象
 */
const fetchOneUrl = async (url, browser) => {
	console.log("start", url);
	const page = await browser.newPage();
	try {
		// 1. 页面跳转，超时设置为30秒
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

		// 2. 等待关键内容出现，让 Playwright 自动处理超时错误
		const tbodyLocator = page.locator("tbody");
		// 直接 await，如果超时，Playwright会自动抛出错误，由外层 catch 捕获
		await tbodyLocator.first().waitFor({ timeout: 100000 });

		// 检查表格数量
		const tableCount = await tbodyLocator.count();
		if (tableCount === 0) {
			// 如果没有表格，这应被视为一个可由重试逻辑处理的失败
			throw new Error(`No 'tbody' elements found on page: ${url}`);
		}

		// 3. 获取一次标题并处理
		const firstP_Locator = page.locator(".u-conText p").first();
		const titleText = await firstP_Locator.innerText();
		const desiredText = titleText.split("\n")[0]; // 获取<br>前的内容

		console.log(`Found ${tableCount} tables with title: "${desiredText}"`);

		// 4. 使用 for 循环和 .nth() 方法遍历元素，这是推荐的高效方式
		const tablesData = [];
		for (let i = 0; i < tableCount; i++) {
			const currentTbody = tbodyLocator.nth(i);
			const innerText = await currentTbody.innerText();

			tablesData.push({
				value: innerText,
				desiredText, // 所有表格使用同一个处理过的标题
				url,
				index: i,
			});
		}

		// 5. 成功时返回规范的结构
		return { table: tablesData };
	} catch (error) {
		// 6. 捕获任何错误（超时、元素找不到等），记录后必须重新抛出
		console.error(`Failed to process ${url}:`, error.message);
		// 重新抛出错误，这样外层的 fetchWithRetry 才能捕获到失败并执行重试
		throw error;
	} finally {
		// 7. 确保页面总是被关闭，避免内存泄漏
		console.log("closing page for", url);
		await page.close();
	}
};
/**
 * 带重试逻辑的抓取函数
 * @param {string} url 要抓取的链接
 * @param {object} browser Playwright 浏览器实例
 * @param {object} options 配置项
 * @param {number} options.retries 重试次数
 * @param {number} options.delay 每次重试之间的延迟（毫秒）
 * @returns {Promise<any>} 返回 fetchOneUrl 的执行结果
 */
async function fetchWithRetry(url, browser, options = { retries: 4, delay: 8000 }) {
	// retries: 2 表示首次尝试后，最多再重试2次，共3次机会
	for (let attempt = 1; attempt <= options.retries + 1; attempt++) {
		try {
			// 如果是第一次尝试以上，打印重试信息
			if (attempt > 1) {
				console.log(`[重试 ${attempt - 1}/${options.retries}] 正在再次请求: ${url}`);
			}
			// 调用原始的抓取函数
			const result = await fetchOneUrl(url, browser);
			// 如果成功，立即返回结果，并跳出循环
			return result;
		} catch (error) {
			console.error(`[尝试 ${attempt}] 请求 ${url} 失败。原因: ${error.message}`);
			// 如果这是最后一次尝试，则不再等待，直接向上抛出错误
			if (attempt > options.retries) {
				console.error(`[最终失败] 已达到最大重试次数，放弃链接: ${url}`);
				throw error; // 向上抛出最终的错误
			}
			// 如果不是最后一次尝试，等待指定时间后继续下一次循环
			await new Promise((resolve) => setTimeout(resolve, options.delay));
		}
	}
}

async function main() {
	console.log("开始执行任务...");
	const browser = await firefox.launch({ headless: true });
	const workbook = XLSX.utils.book_new();
	const failedTasks = [];
	const url_data = [
		{
			dynamic_id: "e7b433a00dc741c3bbebf9cba8429b15",
			dynamic_title: "国家电网有限公司总部关于2026年高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "17d5201e539e4a8494806f30c2bacb42",
			dynamic_title: "国家电网有限公司华北分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "2aabbe7c31034bf9b75189ea9cb2a408",
			dynamic_title: "国家电网有限公司华东分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "1245af7737654f91aa3ca0e291cb7236",
			dynamic_title: "国家电网有限公司华中分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "1e4cb5201cad41338ad872f1304f262c",
			dynamic_title: "国家电网公司东北分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "c3820145e13e49eb8a08d3e27dca6176",
			dynamic_title: "国家电网有限公司西北分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "0f86828509d843b7860d8659b42f1ed1",
			dynamic_title: "国家电网有限公司西南分部关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "0c3a120f7f024c7c926d9f17255cbf0d",
			dynamic_title: "国网北京市电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "6e7aa1beab414f34b81765f35502a696",
			dynamic_title: "国网天津市电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "8d690ed3114b4139a5f7b1bcf5f7f270",
			dynamic_title: "国网河北省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "3ee9cfa0750b4891ac47ec06f3a8d35a",
			dynamic_title: "国网冀北电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d1c5113603bf40cd8f8204bfa4baaa5a",
			dynamic_title: "国网山西省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "adbda8163dfc415abea82ef7a9651f2f",
			dynamic_title: "国网山东省电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "e5a16a9323e04c2abe18690b1fe77c03",
			dynamic_title: "国网上海市电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "f954ec21ac3b40ffb83b5cefe7a608a6",
			dynamic_title: "国网江苏省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "85d17eebe0064e738affdad519394948",
			dynamic_title: "国网浙江省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "71bcb39b8f1d45e6929b282dc3287117",
			dynamic_title: "国网安徽省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "c550a19e79144a5fb4399687a568d142",
			dynamic_title: "国网福建省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "c4dc0782d7df4ec096d58125c392deec",
			dynamic_title: "国网湖北省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "0a4362040f224fb08949859ed6df3662",
			dynamic_title: "国网湖南省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "0b0dca16f16849a289a7035761b31673",
			dynamic_title: "国网河南省电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "777957d830234ff89b360dd3208b924a",
			dynamic_title: "国网江西省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "f59dd0bb81b349889fa0bfedbacef00d",
			dynamic_title: "国网四川省电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "db1abc7c0d6c4abfbaa63638d3e8a5f0",
			dynamic_title: "国网四川省电力公司关于2026年第一批高校毕业生录用人选的公示(上市公司)",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "f92b07f2e91d4ff9905a2bd173ecbc5a",
			dynamic_title: "国网重庆市电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "bb59c063e83f4209b1637acd4d3ea45b",
			dynamic_title: "国网辽宁省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "bc1baa9222c84a55ab34b3bcf516d8e0",
			dynamic_title: "国网吉林省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "a32fa5600e2f40c99ea993af830aaa49",
			dynamic_title: "国网黑龙江省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "579c160779e948cf87dd4dbcaaf64d30",
			dynamic_title: "国网内蒙古东部电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d0076d9aa7754e67a12aa53f207922e7",
			dynamic_title: "国网陕西省电力有限公司 2026年第1批高校毕业生录用人选公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "4a1285e294a44ec78158d5f0b68065c5",
			dynamic_title: "国网甘肃省电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "e9c3d6dc41694db9beab393782f7f2e4",
			dynamic_title: "国网青海省电力公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "6a01d2a129364681a12491d1fdb22b00",
			dynamic_title: "国网宁夏电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "15309a173e1542a5b973700d1b9fd060",
			dynamic_title: "国网新疆电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "3639e9ff7eb94ec5b3337323166946dd",
			dynamic_title: "国网西藏电力有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d62d0c7a40e14c91ac39bf320be918f6",
			dynamic_title: "国网国际发展有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "9875fd8947d24b13b2091e703db1764a",
			dynamic_title: "中国电力技术装备有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "ba0d3e3cd6424eb09d87442ac7279a47",
			dynamic_title: "全球能源互联网集团有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "f09c54007c3641c0b190df465a3f00bf",
			dynamic_title: "中国电力科学研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "17f2e67a4c3b43438ea2fd2988d02d16",
			dynamic_title: "国网经济技术研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "c1dd7a000d124a829b5152b401bd453a",
			dynamic_title: "国网能源研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "3d2d8f05e6f348d2b436f1c4aac779fd",
			dynamic_title: "国网电力工程研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "4828ba003cdb475aa8cd8b179b394604",
			dynamic_title:
				"国网新源集团有限公司（国网新源控股有限公司）关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "e08d3d17c9b5499e9df258d52dbcb2aa",
			dynamic_title: "国网信息通信产业集团有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "c5e6c8dc033a4d58a3a34c92987270ac",
			dynamic_title: "英大传媒投资集团有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "6831e998f203438bb1b890966a40ceea",
			dynamic_title:
				"国网电力科学研究院有限公司（南瑞集团有限公司）关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "1600c8a074824afa851c0ca85d89b49b",
			dynamic_title: "国网物资有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "34b7b4e6876b43328f25ba115bc095ba",
			dynamic_title: "国网电力空间技术有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "6dc654cbee7749fe94afe27ba8932bec",
			dynamic_title: "国网中兴有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "9875a52926444eb3a44d9d250a3549f2",
			dynamic_title:
				"国网数字科技控股有限公司（国网雄安金融科技集团有限公司）关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "36e08d84b98e4473ae0dd7341badc2e4",
			dynamic_title: "国网综合能源服务集团有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "3b84f8ec1ba4413588e4e5ca70f1f0ec",
			dynamic_title: "国网智慧车联网技术有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "ed9b9af9ca744199ad8aa7657cef1d54",
			dynamic_title: "国家电网有限公司信息通信中心关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "e51ccb02306b4873b4f8a5a1ef79225b",
			dynamic_title: "国家电网有限公司特高压建设分公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "2fd39ed296e14aaaa424192dd7d7cd94",
			dynamic_title: "国家电网有限公司直流技术中心关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d577601d78d146718c2c0277f6cf2184",
			dynamic_title: "国家电网有限公司客户服务中心关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d06f603bedd5455995a423d77b1430bf",
			dynamic_title:
				"中共国家电网有限公司党校（国家电网有限公司高级管理人员培训中心）关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "ff8225dde6984cbc941af8745caaca3a",
			dynamic_title: "国家电网有限公司技术学院分公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d7e4e46397244b17b9d50c9450547e39",
			dynamic_title: "北京智芯微电子科技有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "ab690e8d80c742d8be27f7516e5e7b9d",
			dynamic_title: "国网英大国际控股集团有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "d73b9953321e4138a17088058d446a9c",
			dynamic_title: "中国电力财务有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "6d71468aaf074ab38b0d43edb70cc4eb",
			dynamic_title: "英大泰和财产保险股份有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "5e537076489144fca9a549dea3e11b10",
			dynamic_title: "英大泰和人寿保险股份有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "504d83a518fe4853932fea88f68807d9",
			dynamic_title: "英大长安保险经纪有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "b5e34e30f9fa4581940db9e727f4fcbf",
			dynamic_title: "英大国际信托有限责任公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "80d39be173fe43e09ba2aea37d68bed7",
			dynamic_title: "英大证券有限责任公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "f180e726716a425db53c1dfdb3cea5dd",
			dynamic_title: "国网国际融资租赁有限公司关于2026年第一批高校毕业生录用人选的公示",
			pub_times: "2026-01-20",
			seq_no: 0,
		},
		{
			dynamic_id: "b1ad8554f7f24d66a609be63600648d0",
			dynamic_title: "国网江西省电力有限公司关于调整2026年第一批高校毕业生招聘双选会时间的通知",
			pub_times: "2025-12-16",
			seq_no: 0,
		},
		{
			dynamic_id: "ad4bfc603bf1436a8c7417513df681b0",
			dynamic_title: "国网河北省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-11",
			seq_no: 0,
		},
		{
			dynamic_id: "55e4b219b58d4d0a9aa9e946a41376d0",
			dynamic_title: "国网湖南省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-11",
			seq_no: 0,
		},
		{
			dynamic_id: "ce6dd7482bef456d96c80c9fdf3c1d80",
			dynamic_title: "国网青海省电力公司2026年高校毕业生第一批招聘面试安排",
			pub_times: "2025-12-11",
			seq_no: 0,
		},
		{
			dynamic_id: "09369bcc47a645a38e930b8fecb6172d",
			dynamic_title: "国网东北分部关于2026年高校毕业生招聘（第一批）面试的通知",
			pub_times: "2025-12-11",
			seq_no: 0,
		},
		{
			dynamic_id: "d42c49db013e48ac94e448856ae6ec9c",
			dynamic_title: "国网陕西省电力有限公司2026年高校毕业生招聘（第一批）统一面试安排",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "d489b2b57ec04c51943e155b8e6e43b8",
			dynamic_title: "国网西藏电力有限公司2026年高校毕业生第一批招聘面试通知",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "5bca1b8e88a64740999f06ea2477fe9e",
			dynamic_title: "国网江西省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "9f8fc77a38314dc3818f9fae2b11805f",
			dynamic_title: "国网湖北省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "2ee3a5f291b640209bb8523b1d1a343d",
			dynamic_title: "国网四川省电力公司2026年高校毕业生招聘面试(第一批)公告",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "fb037d2f63c84ba3ac301b5a681d90d5",
			dynamic_title: "国网江苏省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
		{
			dynamic_id: "3e8880c59d1647f7afb7107948aaf87b",
			dynamic_title: "国网黑龙江省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
			pub_times: "2025-12-10",
			seq_no: 0,
		},
	];

	console.log("url_data", url_data);

	const urls = url_data.map((i) => {
		//zhaopin.sgcc.com.cn/sgcchr/static/unitPart.html?bullet_id=e7b433a00dc741c3bbebf9cba8429b15&particulars=flase
		return {
			url: `https://zhaopin.sgcc.com.cn/sgcchr/static/unitPart.html?bullet_id=${i.dynamic_id}&particulars=flase`,
			title: i.dynamic_title,
		};
	});
	console.log(urls);

	const limit = pLimit(10);
	console.log(`开始并发处理 ${urls.length} 个链接，并发上限为 5...`);

	const results = await Promise.allSettled(
		// ======== FIX IS HERE / 修正点在这里 ========
		// 将 fetchOneUrl 替换为 fetchWithRetry
		urls.map((url) => limit(() => fetchWithRetry(url.url, browser, { retries: 2, delay: 3000 })))
	);
	console.log("results", results);

	console.log("所有链接处理完毕（包括重试），开始整理结果...");

	// try...catch 块及之后的所有代码保持不变
	// try {
	// 	results.forEach((res, urlIndex) => {
	// 		const currentUrl = urls[urlIndex];

	// 		if (res.status === "fulfilled") {
	// 			try {
	// 				if (
	// 					!res.value ||
	// 					!res.value.table ||
	// 					!Array.isArray(res.value.table) ||
	// 					res.value.table.length === 0
	// 				) {
	// 					throw new Error("返回的数据中 table 结构不符合预期（为空或不存在）");
	// 				}

	// 				const { value, desiredText } = res.value.table[0];
	// 				const sheetTitle = desiredText;

	// 				if (!value || typeof value !== "string" || value.trim() === "") {
	// 					failedTasks.push({ url: currentUrl, reason: `数据为空 (标题: ${sheetTitle})` });
	// 					console.warn(`🟡 Sheet "${sheetTitle}" (${currentUrl}) 的数据为空，已记录到失败列表。`);
	// 					return;
	// 				}

	// 				const cells = value.trim().split(/\s+/).filter(Boolean);

	// 				if (cells.length < 4) {
	// 					failedTasks.push({
	// 						url: currentUrl,
	// 						reason: `有效单元格不足4个 (标题: ${sheetTitle})`,
	// 					});
	// 					console.warn(
	// 						`🟡 Sheet "${sheetTitle}" (${currentUrl}) 的单元格不足4个，已记录到失败列表。`
	// 					);
	// 					return;
	// 				}

	// 				const rowsList = [[sheetTitle]];
	// 				const header = cells.slice(0, 4);
	// 				rowsList.push(header);
	// 				const bodyCells = cells.slice(4);

	// 				for (let i = 0; i < bodyCells.length; i += 4) {
	// 					if (i + 4 <= bodyCells.length) {
	// 						rowsList.push(bodyCells.slice(i, i + 4));
	// 					}
	// 				}

	// 				const worksheet = XLSX.utils.aoa_to_sheet(rowsList);
	// 				worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
	// 				const colWidths = header.map((cell) => ({ wch: Math.max(15, String(cell).length + 2) }));
	// 				worksheet["!cols"] = colWidths;

	// 				const safeSheetTitle = sheetTitle.replace(/[\/\\?*\[\]]/g, "_").substring(0, 30);
	// 				XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetTitle);
	// 				console.log(`✅ 成功处理并添加 Sheet: "${safeSheetTitle}"`);
	// 			} catch (innerError) {
	// 				console.error(`❌ 处理 ${currentUrl} 的数据时发生内部错误:`, innerError.message);
	// 				failedTasks.push({
	// 					url: currentUrl,
	// 					reason: `处理成功返回的数据时出错: ${innerError.message}`,
	// 				});
	// 			}
	// 		} else {
	// 			// status is 'rejected'
	// 			console.error(`❌ 请求 ${currentUrl} 最终失败:`, res.reason?.message || res.reason);
	// 			failedTasks.push({
	// 				url: currentUrl,
	// 				reason: `最终失败: ${res.reason?.message || String(res.reason)}`,
	// 			});
	// 		}
	// 	});
	// } catch (outerError) {
	// 	console.error("‼️ 处理结果循环时发生严重错误，部分数据可能丢失:", outerError);
	// }

	// // 为所有失败的任务创建一个专门的 "失败记录" Sheet
	// if (failedTasks.length > 0) {
	// 	console.log(`发现 ${failedTasks.length} 个最终失败任务，正在生成失败记录 Sheet...`);
	// 	const failureRows = [["失败的链接", "失败原因"]];
	// 	failedTasks.forEach((task) => failureRows.push([task.url, task.reason]));

	// 	const failureWorksheet = XLSX.utils.aoa_to_sheet(failureRows);
	// 	failureWorksheet["!cols"] = [{ wch: 60 }, { wch: 80 }];

	// 	// =======================
	// 	//  THE FIX IS HERE AGAIN
	// 	//  修正点在这里
	// 	// =======================
	// 	XLSX.utils.book_append_sheet(workbook, failureWorksheet, "失败记录");
	// }

	// // 写入文件的代码保持不变...
	// if (workbook.SheetNames.length > 0) {
	// 	const outputFilename = "电网名单.xlsx";
	// 	XLSX.writeFile(workbook, outputFilename);
	// 	console.log(`\n🎉 Excel 文件 "${outputFilename}" 生成完毕!`);
	// 	console.log(`共包含 ${workbook.SheetNames.length} 个工作表: ${workbook.SheetNames.join(", ")}`);
	// } else {
	// 	console.warn("\n🤷‍♂️ 没有成功处理任何数据，未生成 Excel 文件。");
	// }

	// await browser.close();
	// console.log("浏览器已关闭。");
}

// 运行主函数
main().catch((err) => {
	console.error("‼️ 程序主函数发生致命错误:", err);
});

// main();
