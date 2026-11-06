/* 积分中心：总积分 / 等级 / 徽章 / 周榜 / 总榜 / 明细 */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };
  var ui = { board: "weekly", filter: "all" };

  var CLASSMATES = [
    { name: "林晓", weekly: 240, total: 1420 },
    { name: "陈一鸣", weekly: 180, total: 980 },
    { name: "苏晴", weekly: 210, total: 1180 },
    { name: "周雨桐", weekly: 120, total: 760 },
    { name: "王浩然", weekly: 80, total: 520 }
  ];

  var STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';

  var FILTERS = [
    { key: "all", label: "全部" },
    { key: "vocab", label: "背单词" },
    { key: "listening", label: "听力" },
    { key: "speaking", label: "口语" },
    { key: "checkin", label: "打卡" }
  ];

  function timeLabel(ts) {
    var st = CET.store;
    var d = new Date(ts);
    var hm = st.clock(ts);
    if (st.dateKey(d) === st.dateKey()) return "今天 " + hm;
    return (d.getMonth() + 1) + " 月 " + d.getDate() + " 日 " + hm;
  }

  function render(root) {
    var st = CET.store;
    var s = st.state;
    var lvl = st.levelInfo();
    var week = st.weekPoints();
    var badges = st.badges();
    var earned = badges.filter(function (b) { return b.earned; }).length;
    var boardData = {};

    if (ui.board === "weekly") {
      boardData = CLASSMATES.map(function (c) { return { name: c.name, pts: c.weekly, demo: true }; }).concat([{ name: s.user.name, pts: week, me: true }]);
    } else {
      boardData = CLASSMATES.map(function (c) { return { name: c.name, pts: c.total, demo: true }; }).concat([{ name: s.user.name, pts: s.points.total, me: true }]);
    }
    boardData.sort(function (a, b) { return b.pts - a.pts; });

    var myRank = 1;
    boardData.forEach(function (b, i) { if (b.me) myRank = i + 1; });

    var boardHtml = boardData.map(function (b, i) {
      return '<div class="board-row' + (b.me ? " me" : "") + '">' +
        '<span class="rank ' + (i < 3 ? "r" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
        '<span class="member-avatar" style="width:32px;height:32px;font-size:11px">' + UI().esc(UI().initials(b.name)) + "</span>" +
        '<b>' + UI().esc(b.name) + (b.me ? ' <span class="tag accent" style="font-size:10px;padding:1px 6px">我</span>' : "") +
          (b.demo ? ' <span class="tag" style="font-size:10px;padding:1px 6px">演示</span>' : "") + "</b>" +
        '<div class="spacer"></div>' +
        '<span class="pts">' + b.pts + ' <small>分</small></span>' +
      "</div>";
    }).join("");

    var badgeHtml = badges.map(function (b) {
      return '<div class="badge' + (b.earned ? " earned" : "") + '">' +
        '<span class="badge-ico">' + (b.earned ? STAR : LOCK) + "</span>" +
        "<div><b>" + UI().esc(b.name) + "</b><span>" + UI().esc(b.desc) + "</span></div>" +
      "</div>";
    }).join("");

    var logs = s.points.log.filter(function (x) { return ui.filter === "all" || x.type === ui.filter; }).slice(0, 40);
    var logHtml = logs.map(function (item) {
      return '<div class="ledger-row">' +
        '<span class="ledger-ico">' + UI().typeAbbr(item.type) + "</span>" +
        '<span class="ledger-main"><strong>' + UI().esc(item.note) + "</strong><span>" +
          UI().esc(st.typeLabel(item.type)) + " · " + timeLabel(item.at) + "</span></span>" +
        '<span class="ledger-pts">+' + item.amount + "</span>" +
      "</div>";
    }).join("");

    var filterHtml = FILTERS.map(function (f) {
      return '<button class="chip' + (ui.filter === f.key ? " active" : "") + '" data-filter="' + f.key + '" type="button">' + f.label + "</button>";
    }).join("");

    root.innerHTML = '<div class="view-enter">' +
      '<div class="points-hero">' +
        '<div class="ring" style="--p:' + lvl.pct + '%"><div><strong>' + lvl.level + '</strong><span>等级</span></div></div>' +
        '<div style="flex:1;min-width:200px">' +
          '<p class="tiny dim">TOTAL POINTS · 总积分</p>' +
          '<div class="big-num">' + s.points.total + "<small>分</small></div>" +
          '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">' +
            '<span class="tag accent">' + UI().esc(lvl.name) + "</span>" +
            '<span class="tag">本周 +' + week + "</span>" +
            '<span class="tag success">徽章 ' + earned + " / " + badges.length + "</span>" +
            '<span class="tag">周榜第 ' + myRank + " 名</span>" +
          "</div>" +
          '<div class="bar" style="margin-top:14px"><i style="width:' + lvl.pct + '%"></i></div>' +
          '<p class="tiny dim" style="margin-top:6px">' + (lvl.nextName ? "距离「" + lvl.nextName + "」还差 " + lvl.rest + " 分" : "已达到最高等级") + "</p>" +
        "</div>" +
      "</div>" +

      '<div class="grid grid-2 section">' +
        '<div class="card">' +
          '<div class="row between" style="margin-bottom:10px"><h3 style="font-size:15px">积分排行榜</h3>' +
            '<div class="row" style="gap:6px">' +
              '<button class="chip' + (ui.board === "weekly" ? " active" : "") + '" data-board="weekly" type="button">本周榜</button>' +
              '<button class="chip' + (ui.board === "total" ? " active" : "") + '" data-board="total" type="button">总榜</button>' +
            "</div></div>" +
          '<div class="stack" style="gap:6px">' + boardHtml + "</div>" +
          '<p class="tiny dim" style="margin-top:10px">榜单中的「演示」同学为本地模拟数据，用于展示排名效果。</p>' +
        "</div>" +
        '<div class="card">' +
          '<div class="row between" style="margin-bottom:10px"><h3 style="font-size:15px">我的徽章</h3>' +
            '<span class="tag accent">' + earned + " / " + badges.length + "</span></div>" +
          '<div class="badges">' + badgeHtml + "</div>" +
        "</div>" +
      "</div>" +

      '<div class="card section">' +
        '<div class="row between wrap" style="margin-bottom:12px">' +
          '<h3 style="font-size:15px">积分明细</h3>' +
          '<div class="row wrap" style="gap:6px">' + filterHtml + "</div>" +
        "</div>" +
        (logHtml || '<div class="empty">当前分类还没有积分记录</div>') +
      "</div>" +

      '<div class="card" style="margin-top:16px">' +
        '<h3 style="font-size:14px;margin-bottom:8px">积分规则</h3>' +
        '<div class="grid grid-3" style="gap:8px">' +
          '<p class="tiny muted">单词标记：已掌握 +5 · 模糊 +3 · 不认识 +1</p>' +
          '<p class="tiny muted">听力每题 +6 · 听写每空 +4 · 完成套题 +10</p>' +
          '<p class="tiny muted">口语首次录音 +10 · 自评达标 +5</p>' +
          '<p class="tiny muted">每日完成 20 词 +20，之后打卡 +10（连续每天额外 +2，上限 +10）</p>' +
          '<p class="tiny muted">所有数据保存在本机 localStorage</p>' +
        "</div>" +
        '<p class="tiny dim" style="margin-top:8px">语法练习模块已下线：历史积分保留在总分与明细中（标注为历史数据），不再产生新积分。</p>' +
      "</div>" +

      '<div class="row" style="margin-top:18px;justify-content:flex-end">' +
        '<button class="btn danger sm" id="resetBtn" type="button">清空本地学习数据</button>' +
      "</div>" +
    "</div>";

    root.querySelectorAll("[data-board]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.board = b.getAttribute("data-board");
        CET.app.rerender();
      });
    });

    root.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.filter = b.getAttribute("data-filter");
        CET.app.rerender();
      });
    });

    root.querySelector("#resetBtn").addEventListener("click", function () {
      if (window.confirm("确定要清空全部学习记录吗？此操作不可撤销。")) {
        st.resetAll();
        ui.board = "weekly";
        ui.filter = "all";
        CET.app.refreshChrome();
        CET.app.rerender();
        UI().toast("已重置为演示数据", "warn");
      }
    });
  }

  CET.views = CET.views || {};
  CET.views.points = { title: "积分中心", render: render };
})();
