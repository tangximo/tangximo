/* 学习总览（Dashboard） */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };
  var ICO = {
    vocab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v18H6.5A2.5 2.5 0 0 0 4 23"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v18h4.5A2.5 2.5 0 0 1 20 23"/></svg>',
    listening: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 15a8 8 0 0 1 16 0"/><path d="M4 15v3a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2z"/><path d="M20 15v3a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2z"/></svg>',
    speaking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>'
  };

  var WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function greeting() {
    var h = new Date().getHours();
    if (h < 6) return "夜深了";
    if (h < 12) return "早上好";
    if (h < 18) return "下午好";
    return "晚上好";
  }

  function render(root) {
    var st = CET.store;
    var s = st.state;
    var ui = UI();
    var today = st.todayPoints();
    var lvl = st.levelInfo();
    var mastered = st.masteredCount();
    var totalWords = CET.data.words.length;
    var checked = s.checkin.last === st.dateKey();
    var dp = st.dailyProgress();
    var goalPct = Math.min(100, Math.round((today / s.settings.dailyGoal) * 100));
    var group = st.currentGroup();
    var groupMembers = group ? group.members.slice().sort(function (a, b) {
      return (b.isMe ? s.points.total : b.points) - (a.isMe ? s.points.total : a.points);
    }) : [];
    var myRank = 0;
    groupMembers.forEach(function (m, i) { if (m.isMe) myRank = i + 1; });

    var now = new Date();
    var dateText = now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日 · " + WEEK[now.getDay()];

    var logHtml = s.points.log.slice(0, 5).map(function (item) {
      return '' +
        '<div class="ledger-row">' +
          '<span class="ledger-ico">' + ui.typeAbbr(item.type) + "</span>" +
          '<span class="ledger-main"><strong>' + ui.esc(item.note) + "</strong><span>" +
            (st.dateKey(new Date(item.at)) === st.dateKey() ? "今天 " : "") + st.clock(item.at) +
          "</span></span>" +
          '<span class="ledger-pts">+' + item.amount + "</span>" +
        "</div>";
    }).join("");

    root.innerHTML = '<div class="view-enter">' +
      '<section class="hero">' +
        '<div class="hero-main">' +
          '<p class="hero-kicker">' + (checked ? "今日已打卡 · 保持节奏" : "今日单词 " + dp.done + " / " + dp.total + " · 完成后打卡") + "</p>" +
          '<h2>' + greeting() + "，" + ui.esc(s.user.name) + "。</h2>" +
          '<p>距离下一次等级「' + ui.esc(lvl.nextName || "已满级") + "」" +
            (lvl.nextName ? "还差 " + lvl.rest + " 分" : "你已站上顶峰") +
            "。今天已获得 <b>" + today + "</b> 积分，先完成 <b>20 个单词</b> 的每日打卡吧。</p>" +
          '<div class="bar" style="margin:16px 0 6px;max-width:420px"><i style="width:' + dp.percent + '%"></i></div>' +
          '<p class="tiny dim" style="margin-bottom:14px">今日单词 ' + dp.done + " / " + dp.total + " · " +
            (dp.complete ? "已完成，可打卡" : "还差 " + dp.remaining + " 个") + " · 词库共 " + totalWords + " 词</p>" +
          '<div class="hero-actions">' +
            '<button class="btn primary" id="heroVocab" type="button">' + (dp.complete ? "查看今日打卡" : "背今日 20 词") + "</button>" +
            (checked
              ? '<button class="btn success" type="button" disabled>今日已打卡 ✓</button>'
              : (dp.complete
                ? '<button class="btn soft" id="heroCheckin" type="button">领取打卡 +10</button>'
                : '<button class="btn ghost" id="heroCheckin" type="button">打卡需先完成 20 词</button>')) +
            '<button class="btn ghost" id="heroListening" type="button">去精听</button>' +
          "</div>" +
        "</div>" +
        '<div class="hero-ring">' +
          '<div class="ring" style="--p:' + Math.min(100, goalPct) + '%"><div><strong>' + today + "</strong><span>今日积分</span></div></div>" +
          '<span class="cap">日目标 ' + s.settings.dailyGoal + " 分 · " + goalPct + "%</span>" +
        "</div>" +
      "</section>" +

      '<section class="section">' +
        '<div class="grid grid-3">' +
          '<div class="stat"><div class="stat-label">总积分<span class="tag accent">Lv.' + lvl.level + "</span></div>" +
            '<div class="stat-value">' + s.points.total + '</div><div class="stat-note">' + ui.esc(lvl.name) + "</div></div>" +
          '<div class="stat"><div class="stat-label">已掌握单词</div><div class="stat-value">' + mastered +
            '</div><div class="stat-note">总词库 ' + totalWords + " 词</div></div>" +
          '<div class="stat"><div class="stat-label">连续打卡</div><div class="stat-value">' + s.checkin.streak +
            ' <small class="dim" style="font-size:13px;font-weight:400">天</small></div>' +
            '<div class="stat-note">累计 ' + s.checkin.days.length + " 天</div></div>" +
        "</div>" +
      "</section>" +

      '<section class="section">' +
        '<div class="section-head"><h2>今日任务</h2><p class="sub">三个小目标，完成后积分自然上涨</p></div>' +
        '<div class="tasks">' +
          task("vocab", "背单词", "今日 " + dp.done + " / " + dp.total + " · 已掌握 " + mastered + " / " + totalWords + "，错词本 " + st.unknownCount() + " 个", "去背诵", ICO.vocab) +
          task("listening", "听力练习", "已完成 " + s.listening.setsDone.length + " / " + CET.data.listening.length + " 套", "去练习", ICO.listening) +
          task("speaking", "口语开口", "已练 " + Object.keys(s.speaking.recorded).length + " / " + CET.data.speaking.length + " 个话题", "去练习", ICO.speaking) +
        "</div>" +
      "</section>" +

      '<section class="section"><div class="grid grid-2">' +
        '<div class="card">' +
          '<div class="row between" style="margin-bottom:10px"><h3 style="font-size:15px">学习小组</h3>' +
            '<button class="btn sm ghost" data-goto="groups" type="button">进入小组</button></div>' +
          (group
            ? '<p class="muted small">' + ui.esc(group.name) + " · " + group.members.length + " / " + st.MAX_MEMBERS + " 人 · 邀请码 <b class=\"mono\">" + ui.esc(group.code) + "</b></p>" +
              '<div class="row" style="margin-top:14px;gap:8px"><span class="tag teal">我的排名 ' + myRank + " / " + group.members.length + "</span>" +
              '<span class="tag ' + (checked ? "success" : "warn") + '">' + (checked ? "今日已打卡" : "今日未打卡") + "</span></div>"
            : '<p class="muted small">还没有加入小组，去创建一个吧。</p>') +
        "</div>" +
        '<div class="card">' +
          '<div class="row between" style="margin-bottom:6px"><h3 style="font-size:15px">最近积分</h3>' +
            '<button class="btn sm ghost" data-goto="points" type="button">全部明细</button></div>' +
          (logHtml || '<div class="empty">还没有积分记录</div>') +
        "</div>" +
      "</div></section>" +
    "</div>";

    function task(view, title, desc, go, icon) {
      return '<div class="task" data-goto="' + view + '" role="button" tabindex="0">' +
        '<div class="task-top"><span class="task-ico">' + icon + "</span></div>" +
        "<div><h3>" + title + "</h3><p>" + desc + "</p></div>" +
        '<span class="task-go">' + go + " →</span>" +
      "</div>";
    }

    root.querySelectorAll("[data-goto]").forEach(function (el) {
      var go = function () { CET.app.setView(el.getAttribute("data-goto")); };
      el.addEventListener("click", go);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });

    var btn = root.querySelector("#heroCheckin");
    if (btn) {
      btn.addEventListener("click", function () {
        if (!CET.store.canCheckin()) {
          ui.toast("今日单词还差 " + CET.store.dailyProgress().remaining + " 个，完成 20 词后才能打卡", "warn");
          CET.views.vocab.showTab("daily");
          CET.app.setView("vocab");
          return;
        }
        var r = st.checkin();
        if (r.ok) {
          ui.toast("打卡成功，连续 " + r.streak + " 天", "success", r.points);
          CET.app.refreshChrome();
          CET.app.rerender();
        } else {
          ui.toast("今天已经打过卡啦", "warn");
        }
      });
    }
    root.querySelector("#heroVocab").addEventListener("click", function () {
      CET.views.vocab.showTab("daily");
      CET.app.setView("vocab");
    });
    root.querySelector("#heroListening").addEventListener("click", function () { CET.app.setView("listening"); });
  }

  CET.views = CET.views || {};
  CET.views.dashboard = { title: "学习总览", render: render };
})();
