import { firefox } from "playwright";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { resolve, extname } from "path";
import axios from "axios";
import pLimit from "p-limit";
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
const urls = [
	...test1,
	...test2,
	...test3,
	...test4,
	...test5,
	// {
	// 	title: "北京公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "http://sdmt.shenhuagroup.com.cn/shsdmt/1382706291847/202602/707db375b584438f879aafacc664708c.shtml",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "财务公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327117.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "创新投资2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327116.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "电投国际（上海电力）2026届毕业生招聘拟录人员公示...",
	// 	link: "./202601/t20260121_327115.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "电投综能2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327114.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "东北公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327113.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "共享公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327112.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核锆业2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327111.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "海南公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327110.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "湖北公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327109.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "黄河公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327108.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "江苏公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327107.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "铝电公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327106.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "内蒙古公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327105.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "四川公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327104.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "天津公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327103.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "五凌电力2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327102.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "西藏公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327101.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "新疆能源化工2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327100.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "浙江公司2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327099.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "中国重燃2026届毕业生招聘拟录人员公示（第一批次）",
	// 	link: "./202601/t20260121_327098.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "安徽公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327097.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "电投核能2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327096.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "电投数科2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327095.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "工程公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327094.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "广东公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327093.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核电力院2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327092.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核莱阳2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327091.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核设备2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327090.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核示范2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327089.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核铀业2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327088.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核运行2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327087.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国核自仪2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327086.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国氢科技2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327085.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "黑龙江公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327084.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "江西公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327083.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "江西核电2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327082.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "能研院2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327081.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "山东公司2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327080.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "上海核工院2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327079.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "远达环保2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327078.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "云南国际2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327077.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "湛江核电2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327076.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "中国电力2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327075.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "中央研究院2026届毕业生招聘拟录人员公示（第二批次）",
	// 	link: "./202601/t20260121_327074.html",
	// 	date: "2026-01-21",
	// },
	// {
	// 	title: "国家电投集团河北公司（雄安公司）招聘公告",
	// 	link: "./202601/t20260120_327071.html",
	// 	date: "2026-01-20",
	// },
	// {
	// 	title: "国家电投集团创新投资招聘公告",
	// 	link: "./202601/t20260114_327050.html",
	// 	date: "2026-01-14",
	// },
	// {
	// 	title: "国家电投集团山西公司招聘公告",
	// 	link: "./202601/t20260114_327049.html",
	// 	date: "2026-01-14",
	// },
	// {
	// 	title: "国家核电2026届毕业生招聘拟录人员公示（第一批次）...",
	// 	link: "./202601/t20260112_327037.html",
	// 	date: "2026-01-12",
	// },
	// {
	// 	title: "中国电力2026届毕业生招聘拟录人员公示（第一批次）...",
	// 	link: "./202601/t20260112_327036.html",
	// 	date: "2026-01-12",
	// },
];
// --- 配置区 ---
const baseUrl = ""; // 请根据实际情况修改此基础路径

const SAVE_DIR = resolve(process.cwd(), "公示名单图片");
const PAGE_LIMIT = pLimit(5); // 同时打开的页面数
const DL_LIMIT = pLimit(5); // 同时下载的图片数

/**
 * 格式化文件名：去除系统不允许的特殊字符
 */
function formatFileName(name) {
	return name.replace(/[\\/:\*\?"<>\|]/g, "_").trim();
}

/**
 * 下载函数
 */
async function download(imgUrl, saveName) {
	try {
		const response = await axios({
			url: imgUrl,
			method: "GET",
			responseType: "stream",
			timeout: 15000,
		});
		const writer = createWriteStream(saveName);
		response.data.pipe(writer);
		return new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", reject);
		});
	} catch (err) {
		console.error(`   ❌ 下载失败: ${imgUrl}`);
	}
}

/**
 * 处理单个页面
 */
async function processPage(item, browser) {
	const page = await browser.newPage();
	// 拼接完整地址：注意处理 ./ 路径
	const fullUrl = new URL(
		`https://zhaopin.sgcc.com.cn/sgcchr/static/unitPart.html?bullet_id=${item.dynamic_id}&particulars=flase`,
	).href;
	const safeTitle = formatFileName(item.dynamic_title);

	try {
		console.log(`🚀 正在进入: ${safeTitle}`);
		await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 60000 });

		const imgSources = await page.evaluate(() => {
			return Array.from(document.querySelectorAll("img"))
				.map((img) => img.src)
				.filter((src) => {
					const parts = src.split("/");
					const fileName = parts[parts.length - 1];
					// --- 关键修改点：只匹配大写 W 开头 ---
					return /^W/.test(fileName);
				});
		});
		if (imgSources.length === 0) {
			console.log(`   ⚠️ 未发现 W 开头的图片: ${safeTitle}`);
			return;
		}

		// 下载筛选到的图片
		for (let i = 0; i < imgSources.length; i++) {
			const src = imgSources[i];
			const extension = extname(new URL(src).pathname) || ".jpg";
			// 如果有多个图片，加序号；只有一个则不加
			const fileName =
				imgSources.length > 1 ? `${safeTitle}_${i + 1}${extension}` : `${safeTitle}${extension}`;

			const savePath = resolve(SAVE_DIR, fileName);
			await DL_LIMIT(() => download(src, savePath));
			console.log(`   ✅ 已保存: ${fileName}`);
		}
	} catch (err) {
		console.error(`   ❌ 页面处理出错 [${safeTitle}]:`, err.message);
	} finally {
		await page.close();
	}
}

async function main() {
	if (!existsSync(SAVE_DIR)) mkdirSync(".//pics");

	const browser = await firefox.launch({ headless: true });
	console.log(`开始批量任务，共 ${urls.length} 个页面...`);

	try {
		await Promise.all(urls.map((item) => PAGE_LIMIT(() => processPage(item, browser))));
		console.log("\n✨ 所有任务已完成！");
	} finally {
		await browser.close();
	}
}

main().catch(console.error);
