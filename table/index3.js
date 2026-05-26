import { firefox } from "playwright";
import XLSX from "xlsx";
import pLimit from "p-limit";

/**
 * 核心：处理 Excel 工作表重名及长度限制的工具函数
 */
function getUniqueSheetName(workbook, baseName) {
	// 1. 移除 Excel 不允许的特殊字符 : \ / ? * [ ]
	// 2. 截断到 25 个字符以内（Excel 限制 31 位，预留空间给后缀如 _1, _10）
	let cleanName = baseName
		.replace(/[\\/?*[\]：]/g, "_")
		.substring(0, 25)
		.trim();

	let finalName = cleanName;
	let counter = 1;

	// 3. 检查 workbook.SheetNames 数组中是否已存在该名称
	while (workbook.SheetNames.includes(finalName)) {
		finalName = `${cleanName}_${counter}`;
		counter++;
	}
	return finalName;
}

/**
 * 抓取单个链接数据
 */
const fetchOneUrl = async (url, browser) => {
	console.log("正在访问:", url);
	const page = await browser.newPage();
	try {
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

		const tbodyLocator = page.locator("tbody");
		await tbodyLocator.first().waitFor({ timeout: 40000 });

		const tableCount = await tbodyLocator.count();
		if (tableCount === 0) throw new Error(`未发现有效表格`);

		// 获取标题逻辑
		const titleLocator = page.locator(".u-conText p, .title").first();
		let rawTitle = "电网公示";
		try {
			const titleText = await titleLocator.innerText();
			rawTitle = titleText.split("\n")[0].trim();
		} catch (e) {
			/* 使用默认 */
		}

		const tablesData = [];
		for (let i = 0; i < tableCount; i++) {
			const currentTbody = tbodyLocator.nth(i);
			const rows = await currentTbody.locator("tr").all();
			const rowData = [];

			for (const row of rows) {
				const cells = await row.locator("td").allInnerTexts();
				const cleanCells = cells.map((c) => c.trim().replace(/\n/g, ""));

				// 过滤掉表头行（避免每个 Sheet 里都重复出现“姓名、性别...”）
				if (cleanCells.length >= 4 && cleanCells[0] !== "姓名" && cleanCells[0] !== "序号") {
					rowData.push(cleanCells.slice(0, 4));
				}
			}

			if (rowData.length > 0) {
				tablesData.push({
					data: rowData,
					title: rawTitle,
					tableIndex: i,
				});
			}
		}

		return { tables: tablesData };
	} catch (error) {
		console.error(`❌ 抓取异常 ${url}:`, error.message);
		throw error;
	} finally {
		await page.close();
	}
};

/**
 * 重试包装
 */
async function fetchWithRetry(url, browser) {
	const options = { retries: 2, delay: 5000 };
	for (let attempt = 1; attempt <= options.retries + 1; attempt++) {
		try {
			return await fetchOneUrl(url, browser);
		} catch (error) {
			if (attempt > options.retries) throw error;
			console.log(`[尝试 ${attempt}] 失败，5秒后重试...`);
			await new Promise((r) => setTimeout(r, options.delay));
		}
	}
}

async function main() {
	// 此处放入你所有的 url_data
	const test1 = [
		{
			dynamic_id: "4a420af26ffb4451a017d64c3277be2d",
			dynamic_stick_flag: "1",
			dynamic_title: "关于高等学校自设专业、交叉专业类别认定的公告",
			pub_times: "2015-11-15",
			seq_no: 0,
		},
		{
			dynamic_id: "fe9b1c3b5c974f2e8547eb79d09d45ee",
			dynamic_title: "国网北京市电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "28765994d5384cd8b9d7c5813844633f",
			dynamic_title: "国网天津市电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "c8284ea5507a4d77815c3cd92cc07708",
			dynamic_title: "国网河北省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "8f5423f448ef47f788b08b97c4aca962",
			dynamic_title: "国网冀北电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "014ea6d824014e0dab295c5a052870ea",
			dynamic_title: "国网山西省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "3ac27af90aea42d4ac5332b048571c90",
			dynamic_title: "国网山东省电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "84bd5a7fac334feba0dce48767f1074e",
			dynamic_title: "国网上海市电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "1f1a399c5bed4d1387330782273678ca",
			dynamic_title: "国网江苏省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "5f470fc310cb4c32831ece6927d8b668",
			dynamic_title: "国网浙江省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "b898bb6a2fc0449bae21a05538fc941f",
			dynamic_title: "国网安徽省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "d7202ffda0a04b03a2872ef3354dcd77",
			dynamic_title: "国网福建省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "1734925673d8424dbcdd6bcd7752cda7",
			dynamic_title: "国网湖北省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "d9b0a4917c8247e582358536ba247a13",
			dynamic_title: "国网湖南省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "6f78b0a0f9694f74b5478171e7abea5d",
			dynamic_title: "国网河南省电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "82a93d8a61fd43869a1ba5fbf1544518",
			dynamic_title: "国网江西省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "33db434df4fe4e7686e06e1e261d05ca",
			dynamic_title: "国网四川省电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "3c7dc66c06f44395a43379de5bf0a126",
			dynamic_title: "国网重庆市电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "12367c38ea2b44ac94d8866e127eef7a",
			dynamic_title: "国网辽宁省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "7b7503cdf53345e2bce3f0bdab99d351",
			dynamic_title: "国网吉林省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
	];
	const test2 = [
		{
			dynamic_id: "d2b6873288d043a09c581b9bd8b437a1",
			dynamic_title: "国网黑龙江省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "83740805914748709c2c28695e6ba5e9",
			dynamic_title: "国网内蒙古东部电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "9b69c47dda5c48cabd2b9ae80b2bd1c3",
			dynamic_title: "国网陕西省电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "87faf5f43ba24ea1a88238781f29dfb7",
			dynamic_title: "国网甘肃省电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "c4674b0d1e5b4312909a94c6960d33ca",
			dynamic_title: "国网青海省电力公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "bc58fa4180b9451a805b0c96ae58e421",
			dynamic_title: "国网宁夏电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "21adeab55ac84c838786af9d3530968c",
			dynamic_title: "国网新疆电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "a176e1e0758e4a82955fa7c538913060",
			dynamic_title: "国网西藏电力有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "d3cb4eb180164536b36944db25b2437e",
			dynamic_title: "国网国际发展有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "2e2121fc37af4612bc51a7827cb88d93",
			dynamic_title: "中国电力技术装备有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "88625c6ce1664d9388591eddb7c3ac25",
			dynamic_title: "中国电力科学研究院有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "4e9ade060793417fac886b0fcc41bed2",
			dynamic_title: "国网经济技术研究院有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "896138b816ec44ed949658854fcea43e",
			dynamic_title: "国网电力工程研究院有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "ab421ea9b0cc4bc8be4c29e9420c7b4c",
			dynamic_title:
				"国网新源集团有限公司（国网新源控股有限公司）关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "b02969563f1a4f3ca113c73444ce57e0",
			dynamic_title: "国网信息通信产业集团有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "fc27aa8ea1654b1cab2690cb3e53bb19",
			dynamic_title:
				"国网电力科学研究院有限公司（南瑞集团有限公司）关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "4098a4d1733f46d2870ed1bf72d2a6c1",
			dynamic_title: "国网物资有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "22137499c258419cad426551870243d0",
			dynamic_title: "国网电力空间技术有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "5dbfeaae55c94bd2bf5d021ea6e70483",
			dynamic_title:
				"国网数字科技控股有限公司（国网雄安金融科技集团有限公司）关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "ebb852ceef0e45f29c1c555d0915924f",
			dynamic_title: "国网综合能源服务集团有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
	];
	const test3 = [
		{
			dynamic_id: "f4419de3964b4399a964135741feb0ef",
			dynamic_title: "国网智慧车联网技术有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "8a7f52c2d6c04890b8411f7530ed550a",
			dynamic_title: "国家电网有限公司信息通信中心关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "c213be9d76834af09bf2d550a6be8caf",
			dynamic_title: "国家电网有限公司直流技术中心关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "964a14864efd4b87a7070e40ae3dd4d3",
			dynamic_title:
				"中共国家电网有限公司党校（国家电网有限公司高级管理人员培训中心）关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "6d05e2c782d24cb6a0c0dab85e97f2b0",
			dynamic_title: "北京智芯微电子科技有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "3d82fb9d866f457e9a0574efc8c6ffff",
			dynamic_title: "国网英大国际控股集团有限公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "d814fe59cc0647f2aa9355f64ebbcc61",
			dynamic_title: "英大国际信托有限责任公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "a09cbf3b6fa9485a8be787bdc276f034",
			dynamic_title: "英大证券有限责任公司关于2026年第二批高校毕业生录用人选的公示",
			pub_times: "2026-04-23",
			seq_no: 0,
		},
		{
			dynamic_id: "e2269efd57b14c24ad42e08673a71b51",
			dynamic_title: "国网甘肃省电力公司2026年第二批招聘高校毕业生面试工作安排",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "2699e4d2937e44489d047952a0557829",
			dynamic_title: "国网湖北省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "fc591ba4ce104feba47506914e0884c3",
			dynamic_title: "国网河北省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "8b084704900d4854b349ab2b35832a23",
			dynamic_title: "国网湖南省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "63d69faa64eb45b9942e0902bc975820",
			dynamic_title: "国网内蒙古东部电力有限公司2026年第二批高校毕业生招聘面试公告",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "34f5f58f7f4741d0a18f86da0344161d",
			dynamic_title: "关于福建送变电公司电气安装及电缆施工岗位招聘体能测试的通知",
			pub_times: "2026-03-19",
			seq_no: 0,
		},
		{
			dynamic_id: "57082a0719c84a52bc4cb13df28850ce",
			dynamic_title: "国网西藏电力有限公司2026年高校毕业生第二批招聘面试通知",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "d384407e8c1845d594961e65ed5b4453",
			dynamic_title: "国网江西省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "7dd92903f4de4e588e6c26fa90e1af8a",
			dynamic_title: "国网山西省电力有限公司2026年第二批高校毕业生招聘面试公告",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "3ac04b25dbb340e8a787dc942b07c191",
			dynamic_title: "国网辽宁省电力有限公司2026年高校毕业生招聘（第二批）面试公告",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "208ab6dce5e049dba0e9fb5f5acdeaea",
			dynamic_title: "国网黑龙江省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "1999e87d42074498aff7d468a740efb0",
			dynamic_title: "国网宁夏电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
	];
	const test4 = [
		{
			dynamic_id: "802d472d51954aa088469cd0abfc9ef9",
			dynamic_title: "国网四川省电力公司2026年高校毕业生招聘面试(第二批)公告",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "ec6745928463486e82b2fb37bfa4540b",
			dynamic_title: "国网福建省电力有限公司2026年高校毕业生（第二批）招聘面试通知",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "f9c490492542481aa6d0bf6b791c1428",
			dynamic_title: "国网吉林省电力有限公司2026年高校毕业生招聘考试（第二批）面试公告",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "b9fb2510708e408a8122ab5d0fe26363",
			dynamic_title: "国网重庆市电力公司2026年高校毕业生招聘面试安排通知（第二批）",
			pub_times: "2026-03-18",
			seq_no: 0,
		},
		{
			dynamic_id: "7da83af309fe418abc6f31431b5e338f",
			dynamic_title: "国网陕西省电力有限公司2026年高校毕业生招聘（第二批）统一面试安排",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "f052162ee9654e5ba47ea3f4a3e5f7b1",
			dynamic_title: "国网安徽省电力有限公司2026年高校毕业生招聘（第二批）面试公告",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "2c9f0eed43ca47a8a20d2f2cd330a000",
			dynamic_title: "国网浙江省电力有限公司2026年高校毕业生招聘面试（第二批）公告",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "f2ff5dfca4654e77948092bcd55cf588",
			dynamic_title: "国网江苏省电力有限公司2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "d1d731f348ad4cb48216b7b6d2198d85",
			dynamic_title: "国网冀北电力有限公司2026年高校毕业生第二批招聘考试面试公告",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "ac4076e6ac8e41e6a1b6a8a96b00ab57",
			dynamic_title:
				"国网新源集团有限公司（国网新源控股有限公司）2026年高校毕业生招聘面试公告（第二批）",
			pub_times: "2026-03-17",
			seq_no: 0,
		},
		{
			dynamic_id: "e4cba789071d4345a854dc1ac8cef25d",
			dynamic_title: "国网湖南省电力有限公司2026年第二批招聘高校毕业生考试公告",
			pub_times: "2026-03-10",
			seq_no: 0,
		},
		{
			dynamic_id: "3bfdecb9cebe4d79a8c7f03404f6a182",
			dynamic_title: "国家电网有限公司2026年在京直属单位高校毕业生统一招聘考试公告（第二批）",
			pub_times: "2026-03-10",
			seq_no: 0,
		},
		{
			dynamic_id: "bbd4d299d64645dfb99cb0586abc7cd0",
			dynamic_title: "国网新疆电力有限公司2026年招聘高校毕业生考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "df518c4dd79249408f42145d8410bf36",
			dynamic_title: "国网冀北电力有限公司2026年高校毕业生招聘考试（第二批）公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "3778ae0b90e54f41bff0dc4068345c56",
			dynamic_title: "国网湖北省电力有限公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "098dce73e4454b8faced6194ab6da61b",
			dynamic_title: "国网江西省电力有限公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "f6b2b95c10ec409da0538f790a4a12bc",
			dynamic_title: "国网宁夏电力有限公司2026年招聘高校毕业生统一考试（第二批）公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "8333fce7da804359a5abdf44e527d419",
			dynamic_title: "国网内蒙古东部电力有限公司2026年第二批高校毕业生招聘考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "5ff7ae2785594437a7c38271f22d26d3",
			dynamic_title: "国网青海省电力公司2026年高校毕业生招聘统一笔试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "2d59aa385dc7416db93f7be42ccfc7b5",
			dynamic_title: "国网陕西省电力有限公司2026年高校毕业生招聘（第二批）统一考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
	];
	const test5 = [
		{
			dynamic_id: "b0c2c85d5d00454090743f432260c9e6",
			dynamic_title: "国网福建省电力有限公司2026年高校毕业生第二批招聘考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "ddabbec0e99047928cbc1fa65aeb8d97",
			dynamic_title:
				"国网电力科学研究院有限公司（南瑞集团有限公司）关于2026年毕业生招聘考试 （第二批）安排的公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "e932ee13c1cc4204818bf8743f3a2d39",
			dynamic_title: "国网北京市电力公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "438eb556edcf42c7a1f00c5bc834dd4e",
			dynamic_title:
				"国网新源集团有限公司（国网新源控股有限公司）2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "509f57c064ef41e49dd053abc6ad8943",
			dynamic_title: "国网天津市电力公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "6f62b061c05d44e9bb8ae0adb86d8c10",
			dynamic_title: "国网山西省电力有限公司2026年第二批高校毕业生招聘考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "f487d0b3dd4d487384b097f5bd53d6b3",
			dynamic_title: "国网西藏电力有限公司2026年高校毕业生第二批招聘考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "368b9b81db0746cd95e57a3af797ae14",
			dynamic_title: "国网信息通信产业集团有限公司2026年高校毕业生统一招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "797a90b484a04c3c8e7c58b2aef470e8",
			dynamic_title: "国网江苏省电力有限公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "1f1a46e5e42e482fb14f9f0bb17e0d9d",
			dynamic_title: "国网河北省电力有限公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "37d191ec657642dda8287ebcc0d8672b",
			dynamic_title: "国网河南省电力公司2026年高校毕业生第二批招聘考试公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "674fc83e2427487c99b3d28d672bebed",
			dynamic_title: "国网上海市电力公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "d3ab343f15cd4326b8eef12ab4973066",
			dynamic_title: "国网甘肃省电力公司2026年高校毕业生招聘第二批统一考试工作安排",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "35a69599cfbe4f87b02a00efa4fca9e5",
			dynamic_title: "国网黑龙江省电力有限公司 2026年高校毕业生招聘笔试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "1c8ed0add80345d68105d7f695f57dee",
			dynamic_title: "国网重庆市电力公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "81500c500cfe401cad4f07c81c9a476e",
			dynamic_title: "国网安徽省电力有限公司2026年高校毕业生招聘考试公告（第二批）",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "f306db1d40054db0aef64077b48e5f11",
			dynamic_title: "国网辽宁省电力有限公司2026年高校毕业生招聘统一考试（第二批）公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "da8186719d2c41d89299bfab21ccd6d6",
			dynamic_title: "国网吉林省电力有限公司关于2026年高校毕业生招聘考试（第二批）工作安排的公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "08e08b4f63c74004860917ece3ce7181",
			dynamic_title: "国网四川省电力公司2026年高校毕业生招聘考试（第二批）公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
		{
			dynamic_id: "3a5227d0080a4590b453fd21249f2576",
			dynamic_title: "国网浙江省电力有限公司2026年高校毕业生招聘统一考试（第二批）公告",
			pub_times: "2026-03-09",
			seq_no: 0,
		},
	];
	const url_data = [...test1, ...test2, ...test3, ...test4, ...test5];
	// const url_data = [
	// 	{
	// 		dynamic_id: "e7b433a00dc741c3bbebf9cba8429b15",
	// 		dynamic_title: "国家电网有限公司总部关于2026年高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "17d5201e539e4a8494806f30c2bacb42",
	// 		dynamic_title: "国家电网有限公司华北分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "2aabbe7c31034bf9b75189ea9cb2a408",
	// 		dynamic_title: "国家电网有限公司华东分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "1245af7737654f91aa3ca0e291cb7236",
	// 		dynamic_title: "国家电网有限公司华中分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "1e4cb5201cad41338ad872f1304f262c",
	// 		dynamic_title: "国家电网公司东北分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "c3820145e13e49eb8a08d3e27dca6176",
	// 		dynamic_title: "国家电网有限公司西北分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "0f86828509d843b7860d8659b42f1ed1",
	// 		dynamic_title: "国家电网有限公司西南分部关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "0c3a120f7f024c7c926d9f17255cbf0d",
	// 		dynamic_title: "国网北京市电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "6e7aa1beab414f34b81765f35502a696",
	// 		dynamic_title: "国网天津市电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "8d690ed3114b4139a5f7b1bcf5f7f270",
	// 		dynamic_title: "国网河北省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "3ee9cfa0750b4891ac47ec06f3a8d35a",
	// 		dynamic_title: "国网冀北电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d1c5113603bf40cd8f8204bfa4baaa5a",
	// 		dynamic_title: "国网山西省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "adbda8163dfc415abea82ef7a9651f2f",
	// 		dynamic_title: "国网山东省电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "e5a16a9323e04c2abe18690b1fe77c03",
	// 		dynamic_title: "国网上海市电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "f954ec21ac3b40ffb83b5cefe7a608a6",
	// 		dynamic_title: "国网江苏省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "85d17eebe0064e738affdad519394948",
	// 		dynamic_title: "国网浙江省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "71bcb39b8f1d45e6929b282dc3287117",
	// 		dynamic_title: "国网安徽省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "c550a19e79144a5fb4399687a568d142",
	// 		dynamic_title: "国网福建省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "c4dc0782d7df4ec096d58125c392deec",
	// 		dynamic_title: "国网湖北省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "0a4362040f224fb08949859ed6df3662",
	// 		dynamic_title: "国网湖南省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "0b0dca16f16849a289a7035761b31673",
	// 		dynamic_title: "国网河南省电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "777957d830234ff89b360dd3208b924a",
	// 		dynamic_title: "国网江西省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "f59dd0bb81b349889fa0bfedbacef00d",
	// 		dynamic_title: "国网四川省电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "db1abc7c0d6c4abfbaa63638d3e8a5f0",
	// 		dynamic_title: "国网四川省电力公司关于2026年第一批高校毕业生录用人选的公示(上市公司)",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "f92b07f2e91d4ff9905a2bd173ecbc5a",
	// 		dynamic_title: "国网重庆市电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "bb59c063e83f4209b1637acd4d3ea45b",
	// 		dynamic_title: "国网辽宁省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "bc1baa9222c84a55ab34b3bcf516d8e0",
	// 		dynamic_title: "国网吉林省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "a32fa5600e2f40c99ea993af830aaa49",
	// 		dynamic_title: "国网黑龙江省电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "579c160779e948cf87dd4dbcaaf64d30",
	// 		dynamic_title: "国网内蒙古东部电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d0076d9aa7754e67a12aa53f207922e7",
	// 		dynamic_title: "国网陕西省电力有限公司 2026年第1批高校毕业生录用人选公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "4a1285e294a44ec78158d5f0b68065c5",
	// 		dynamic_title: "国网甘肃省电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "e9c3d6dc41694db9beab393782f7f2e4",
	// 		dynamic_title: "国网青海省电力公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "6a01d2a129364681a12491d1fdb22b00",
	// 		dynamic_title: "国网宁夏电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "15309a173e1542a5b973700d1b9fd060",
	// 		dynamic_title: "国网新疆电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "3639e9ff7eb94ec5b3337323166946dd",
	// 		dynamic_title: "国网西藏电力有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d62d0c7a40e14c91ac39bf320be918f6",
	// 		dynamic_title: "国网国际发展有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "9875fd8947d24b13b2091e703db1764a",
	// 		dynamic_title: "中国电力技术装备有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ba0d3e3cd6424eb09d87442ac7279a47",
	// 		dynamic_title: "全球能源互联网集团有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "f09c54007c3641c0b190df465a3f00bf",
	// 		dynamic_title: "中国电力科学研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "17f2e67a4c3b43438ea2fd2988d02d16",
	// 		dynamic_title: "国网经济技术研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "c1dd7a000d124a829b5152b401bd453a",
	// 		dynamic_title: "国网能源研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "3d2d8f05e6f348d2b436f1c4aac779fd",
	// 		dynamic_title: "国网电力工程研究院有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "4828ba003cdb475aa8cd8b179b394604",
	// 		dynamic_title:
	// 			"国网新源集团有限公司（国网新源控股有限公司）关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "e08d3d17c9b5499e9df258d52dbcb2aa",
	// 		dynamic_title: "国网信息通信产业集团有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "c5e6c8dc033a4d58a3a34c92987270ac",
	// 		dynamic_title: "英大传媒投资集团有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "6831e998f203438bb1b890966a40ceea",
	// 		dynamic_title:
	// 			"国网电力科学研究院有限公司（南瑞集团有限公司）关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "1600c8a074824afa851c0ca85d89b49b",
	// 		dynamic_title: "国网物资有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "34b7b4e6876b43328f25ba115bc095ba",
	// 		dynamic_title: "国网电力空间技术有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "6dc654cbee7749fe94afe27ba8932bec",
	// 		dynamic_title: "国网中兴有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "9875a52926444eb3a44d9d250a3549f2",
	// 		dynamic_title:
	// 			"国网数字科技控股有限公司（国网雄安金融科技集团有限公司）关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "36e08d84b98e4473ae0dd7341badc2e4",
	// 		dynamic_title: "国网综合能源服务集团有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "3b84f8ec1ba4413588e4e5ca70f1f0ec",
	// 		dynamic_title: "国网智慧车联网技术有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ed9b9af9ca744199ad8aa7657cef1d54",
	// 		dynamic_title: "国家电网有限公司信息通信中心关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "e51ccb02306b4873b4f8a5a1ef79225b",
	// 		dynamic_title: "国家电网有限公司特高压建设分公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "2fd39ed296e14aaaa424192dd7d7cd94",
	// 		dynamic_title: "国家电网有限公司直流技术中心关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d577601d78d146718c2c0277f6cf2184",
	// 		dynamic_title: "国家电网有限公司客户服务中心关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d06f603bedd5455995a423d77b1430bf",
	// 		dynamic_title:
	// 			"中共国家电网有限公司党校（国家电网有限公司高级管理人员培训中心）关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ff8225dde6984cbc941af8745caaca3a",
	// 		dynamic_title: "国家电网有限公司技术学院分公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d7e4e46397244b17b9d50c9450547e39",
	// 		dynamic_title: "北京智芯微电子科技有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ab690e8d80c742d8be27f7516e5e7b9d",
	// 		dynamic_title: "国网英大国际控股集团有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d73b9953321e4138a17088058d446a9c",
	// 		dynamic_title: "中国电力财务有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "6d71468aaf074ab38b0d43edb70cc4eb",
	// 		dynamic_title: "英大泰和财产保险股份有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "5e537076489144fca9a549dea3e11b10",
	// 		dynamic_title: "英大泰和人寿保险股份有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "504d83a518fe4853932fea88f68807d9",
	// 		dynamic_title: "英大长安保险经纪有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "b5e34e30f9fa4581940db9e727f4fcbf",
	// 		dynamic_title: "英大国际信托有限责任公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "80d39be173fe43e09ba2aea37d68bed7",
	// 		dynamic_title: "英大证券有限责任公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "f180e726716a425db53c1dfdb3cea5dd",
	// 		dynamic_title: "国网国际融资租赁有限公司关于2026年第一批高校毕业生录用人选的公示",
	// 		pub_times: "2026-01-20",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "b1ad8554f7f24d66a609be63600648d0",
	// 		dynamic_title: "国网江西省电力有限公司关于调整2026年第一批高校毕业生招聘双选会时间的通知",
	// 		pub_times: "2025-12-16",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ad4bfc603bf1436a8c7417513df681b0",
	// 		dynamic_title: "国网河北省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-11",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "55e4b219b58d4d0a9aa9e946a41376d0",
	// 		dynamic_title: "国网湖南省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-11",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "ce6dd7482bef456d96c80c9fdf3c1d80",
	// 		dynamic_title: "国网青海省电力公司2026年高校毕业生第一批招聘面试安排",
	// 		pub_times: "2025-12-11",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "09369bcc47a645a38e930b8fecb6172d",
	// 		dynamic_title: "国网东北分部关于2026年高校毕业生招聘（第一批）面试的通知",
	// 		pub_times: "2025-12-11",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d42c49db013e48ac94e448856ae6ec9c",
	// 		dynamic_title: "国网陕西省电力有限公司2026年高校毕业生招聘（第一批）统一面试安排",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "d489b2b57ec04c51943e155b8e6e43b8",
	// 		dynamic_title: "国网西藏电力有限公司2026年高校毕业生第一批招聘面试通知",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "5bca1b8e88a64740999f06ea2477fe9e",
	// 		dynamic_title: "国网江西省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "9f8fc77a38314dc3818f9fae2b11805f",
	// 		dynamic_title: "国网湖北省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "2ee3a5f291b640209bb8523b1d1a343d",
	// 		dynamic_title: "国网四川省电力公司2026年高校毕业生招聘面试(第一批)公告",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "fb037d2f63c84ba3ac301b5a681d90d5",
	// 		dynamic_title: "国网江苏省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// 	{
	// 		dynamic_id: "3e8880c59d1647f7afb7107948aaf87b",
	// 		dynamic_title: "国网黑龙江省电力有限公司2026年高校毕业生招聘面试公告（第一批）",
	// 		pub_times: "2025-12-10",
	// 		seq_no: 0,
	// 	},
	// ];

	const urls = url_data.map((i) => ({
		url: `https://zhaopin.sgcc.com.cn/sgcchr/static/unitPart.html?bullet_id=${i.dynamic_id}&particulars=flase`,
		title: i.dynamic_title,
	}));

	const browser = await firefox.launch({ headless: true });
	const workbook = XLSX.utils.book_new();
	const limit = pLimit(5);
	const failedTasks = [];

	console.log(`🚀 开始处理 ${urls.length} 个任务...`);

	const results = await Promise.allSettled(
		urls.map((item) => limit(() => fetchWithRetry(item.url, browser))),
	);

	results.forEach((res, index) => {
		if (res.status === "fulfilled") {
			const { tables } = res.value;

			tables.forEach((table) => {
				// 将数据转换为工作表
				const worksheet = XLSX.utils.aoa_to_sheet(table.data);

				// 列宽美化
				worksheet["!cols"] = [{ wch: 15 }, { wch: 8 }, { wch: 30 }, { wch: 20 }];

				// --- 核心修复：确保 Sheet 名称唯一 ---
				const finalSheetName = getUniqueSheetName(workbook, table.title);

				XLSX.utils.book_append_sheet(workbook, worksheet, finalSheetName);
				console.log(`✅ 已添加工作表: ${finalSheetName}`);
			});
		} else {
			failedTasks.push({ url: urls[index].url, reason: res.reason.message });
		}
	});

	if (failedTasks.length > 0) {
		XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(failedTasks), "失败记录");
	}

	if (workbook.SheetNames.length > 0) {
		const outName = `电网名单汇总_${new Date().getTime()}.xlsx`;
		XLSX.writeFile(workbook, outName);
		console.log(`\n✨ 全部完成！文件已保存为: ${outName}`);
	}

	await browser.close();
}

main().catch(console.error);
