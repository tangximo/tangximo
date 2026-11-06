/* 历年四六级真题「原音」外部资源索引
   说明：真题试题与录音版权归考试主办方及出版机构所有，
   本站不内置、不转存官方 mp3，只提供官方/授权平台的直达链接。
   用户也可在套题详情页导入自己合法持有的音频文件。
   status：ok = 2026-11-05 实发 HTTP 请求核验可访问；expired = 已失效。
   httpCode：HEAD 的状态码；getCode：HEAD 失败后 GET 的状态码。 */
window.CET = window.CET || {};
CET.data = CET.data || {};

CET.data.listeningResources = {
  updated: "2026-11-05",
  verifiedAt: "2026-11-05",
  verifyNote: "已逐条发送 HTTP 请求（HEAD，失败后 GET，10 秒超时）：21 条套题页与 5 个渠道页均可访问。",
  note: "以下为 2021–2025 年四六级听力真题页面（新东方在线），页内含原音播放、试题与答案。版权归原平台所有，本站仅提供跳转。",
  channels: [
    { name: "新东方在线 · 四级听力真题汇总", url: "https://cet4.koolearn.com/20250514/920129.html", desc: "2021–2024 各套真题页索引，含原音", status: "ok", httpCode: 200 },
    { name: "新东方在线 · 六级听力真题专题", url: "https://cet6.koolearn.com/zt/cet6tlzt/", desc: "六级听力真题与 mp3 下载入口", status: "ok", httpCode: 200 },
    { name: "新东方在线 · 四六级真题专区", url: "https://cet4.koolearn.com/zhenti/", desc: "最新场次真题与答案", status: "ok", httpCode: 200 },
    { name: "星火英语 · 图书配套资源", url: "http://down.sparke.cn/", desc: "黑旋风试卷配套音频，需图书代码或 App 扫码", status: "ok", httpCode: 200 },
    { name: "中国教育考试网 · CET 官方", url: "https://cet.neea.edu.cn/", desc: "考试大纲、报名与成绩查询（官方不提供真题音频）", status: "ok", httpCode: 403, getCode: 200, note: "拒绝 HEAD 请求，GET 返回 200，正常可访问" }
  ],
  papers: [
    { level: "CET4", year: 2025, session: "6月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250903/926935.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2024, session: "12月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920130.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2024, session: "12月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920131.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2024, session: "6月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250512/920125.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2024, session: "6月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250512/920126.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2023, session: "12月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250513/920127.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2023, session: "12月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250513/920128.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2023, session: "6月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920132.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2023, session: "6月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920133.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2023, session: "3月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920134.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2022, session: "12月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920135.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2022, session: "12月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250514/920136.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2022, session: "9月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920137.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2022, session: "6月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920138.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2021, session: "12月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920139.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2021, session: "12月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920140.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2021, session: "6月", set: "第1套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920141.html", status: "ok", httpCode: 200 },
    { level: "CET4", year: 2021, session: "6月", set: "第2套", type: "听力原音+真题", url: "https://cet4.koolearn.com/20250516/920142.html", status: "ok", httpCode: 200 },
    { level: "CET6", year: 2024, session: "12月", set: "第1套", type: "听力原音+真题", url: "https://cet6.koolearn.com/20250516/899448.html", status: "ok", httpCode: 200 },
    { level: "CET6", year: 2021, session: "12月", set: "专题页", type: "听力专题（非单套页）", url: "https://cet6.koolearn.com/zt/yyljkszt/", status: "ok", httpCode: 200, note: "该地址为专题汇总页，不是 2021-12 单套真题页（未找到经核验的单套地址）" },
    { level: "CET6", year: 2024, session: "历年", set: "专题汇总", type: "听力真题+mp3", url: "https://cet6.koolearn.com/zt/cet6tlzt/", status: "ok", httpCode: 200 }
  ]
};
