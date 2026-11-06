/* 学习小组：创建 / 加入 / 成员（上限 10 人）/ 打卡 / 组内排行榜 */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };
  var ui = { board: "total" };

  function memberPoints(m) { return m.isMe ? CET.store.state.points.total : m.points; }
  function memberToday(m) { return m.isMe ? CET.store.todayPoints() : (m.todayPoints || 0); }
  function memberChecked(m) {
    return m.isMe ? CET.store.state.checkin.last === CET.store.dateKey() : !!m.checkedToday;
  }

  function sortedMembers(group) {
    var list = group.members.slice();
    if (ui.board === "today") {
      list.sort(function (a, b) { return memberToday(b) - memberToday(a); });
    } else {
      list.sort(function (a, b) { return memberPoints(b) - memberPoints(a); });
    }
    return list;
  }

  function goDaily() {
    CET.views.vocab.showTab("daily");
    CET.app.setView("vocab");
  }

  function joinByCode(code) {
    var r = CET.store.joinGroup(code);
    if (!r.ok) {
      if (r.reason === "notfound") UI().toast("邀请码不存在，检查一下再试", "error");
      else if (r.reason === "full") UI().toast("该小组已满 " + CET.store.MAX_MEMBERS + " 人（" + r.count + "/" + CET.store.MAX_MEMBERS + "），无法加入", "error");
      else if (r.reason === "empty") UI().toast("请输入邀请码", "warn");
      return r;
    }
    CET.app.refreshChrome();
    CET.app.rerender();
    UI().toast(r.already ? "已切换到「" + r.group.name + "」" : "已加入「" + r.group.name + "」（" + r.group.members.length + "/" + CET.store.MAX_MEMBERS + " 人）", "success");
    return r;
  }

  function createByName(name) {
    var r = CET.store.createGroup(name);
    if (!r.ok) {
      UI().toast("请先填写小组名称", "warn");
      return r;
    }
    ui.board = "total";
    CET.app.refreshChrome();
    CET.app.rerender();
    UI().toast("小组创建成功，邀请码 " + r.group.code, "success");
    return r;
  }

  function renderForms(root) {
    root.innerHTML = '<div class="view-enter">' +
      '<div class="card" style="margin-bottom:16px">' +
        '<h3 style="font-size:16px;margin-bottom:4px">你还没有加入小组</h3>' +
        '<p class="tiny dim">创建一个小组，或输入邀请码加入。<b>每个小组最多 ' + CET.store.MAX_MEMBERS + " 人（含组长）。</b></p>" +
      "</div>" +
      '<div class="grid grid-2">' +
        '<div class="card">' +
          '<h3 style="font-size:16px;margin-bottom:4px">创建学习小组</h3>' +
          '<p class="tiny dim" style="margin-bottom:14px">起一个组名，系统会生成邀请码，方便同学加入。</p>' +
          '<div class="form-grid">' +
            '<label>小组名称</label>' +
            '<input class="input" id="groupName" maxlength="18" placeholder="例如：六级冲刺小分队" />' +
            '<button class="btn primary block" id="createGroupBtn" type="button">创建小组</button>' +
          "</div>" +
        "</div>" +
        '<div class="card">' +
          '<h3 style="font-size:16px;margin-bottom:4px">加入已有小组</h3>' +
          '<p class="tiny dim" style="margin-bottom:14px">演示小组邀请码：<b class="mono" style="color:var(--accent)">CET666</b>（6/' + CET.store.MAX_MEMBERS + " 人）</p>" +
          '<div class="form-grid">' +
            '<label>邀请码</label>' +
            '<input class="input code" id="joinCode" maxlength="8" placeholder="6 位邀请码" />' +
            '<button class="btn soft block" id="joinGroupBtn" type="button">加入小组</button>' +
          "</div>" +
          '<p class="tiny dim" style="margin-top:10px">想测试满员限制？用邀请码 <b class="mono">CET10</b>（10/' + CET.store.MAX_MEMBERS + " 人，已满）</p>" +
        "</div>" +
      "</div>" +
    "</div>";

    root.querySelector("#createGroupBtn").addEventListener("click", function () {
      var input = root.querySelector("#groupName");
      if (!input.value.trim()) { UI().toast("请先填写小组名称", "warn"); input.focus(); return; }
      createByName(input.value);
    });

    root.querySelector("#joinGroupBtn").addEventListener("click", function () {
      var input = root.querySelector("#joinCode");
      if (!input.value.trim()) { UI().toast("请输入邀请码", "warn"); input.focus(); return; }
      joinByCode(input.value);
    });
  }

  function renderGroup(root, group) {
    var s = CET.store.state;
    var checked = s.checkin.last === CET.store.dateKey();
    var dp = CET.store.dailyProgress();
    var members = sortedMembers(group);
    var myIdx = -1;
    members.forEach(function (m, i) { if (m.isMe) myIdx = i; });
    var myRank = myIdx + 1;
    var full = group.members.length >= CET.store.MAX_MEMBERS;

    var memberRows = members.map(function (m, i) {
      var pts = memberPoints(m);
      var tPts = memberToday(m);
      var isChecked = memberChecked(m);
      return '<div class="member' + (m.isMe ? " me" : "") + '">' +
        '<span class="rank-no' + (i < 3 ? " top" : "") + '">' + (i + 1) + "</span>" +
        '<span class="member-avatar">' + UI().esc(UI().initials(m.name)) + "</span>" +
        '<span class="member-name"><strong>' + UI().esc(m.name) +
          (m.isMe ? '<span class="tag accent" style="font-size:10px;padding:1px 6px">我</span>' : "") +
          (m.demo ? '<span class="tag" style="font-size:10px;padding:1px 6px">演示</span>' : "") +
          "</strong><span>" + (isChecked ? "今日已打卡" : "今日未打卡") +
          " · 连续 " + (m.isMe ? s.checkin.streak : (m.streak || 0)) + " 天" +
          " · 今日 +" + tPts + "</span></span>" +
        '<span class="check-dot' + (isChecked ? " on" : "") + '" title="' + (isChecked ? "已打卡" : "未打卡") + '"></span>' +
        '<span class="board-pts" style="font-family:var(--mono);font-size:13px;font-weight:700;color:var(--accent)">' + pts + "</span>" +
      "</div>";
    }).join("");

    var switcher = s.groups.list.length > 1
      ? '<div class="row wrap" style="gap:6px;margin-top:12px">' + s.groups.list.map(function (g) {
          return '<button class="chip' + (g.id === group.id ? " active" : "") + '" data-group="' + g.id + '" type="button">' +
            UI().esc(g.name) + '<span class="tiny dim"> ' + g.members.length + "/" + CET.store.MAX_MEMBERS + "</span></button>";
        }).join("") + "</div>"
      : "";

    root.innerHTML = '<div class="view-enter">' +
      '<div class="card">' +
        '<div class="row between wrap">' +
          "<div>" +
            '<div class="row" style="gap:8px;flex-wrap:wrap"><h2 style="font-size:22px">' + UI().esc(group.name) + "</h2>" +
              (group.demo ? '<span class="tag warn">演示小组</span>' : '<span class="tag accent">我创建的</span>') +
              '<span class="tag' + (full ? " danger" : "") + '">' + group.members.length + " / " + CET.store.MAX_MEMBERS + " 人" + (full ? " · 已满" : "") + "</span>" +
            "</div>" +
            '<p class="tiny dim" style="margin-top:4px">组长：' + UI().esc(group.owner) + " · 上限 " + CET.store.MAX_MEMBERS + " 人 · 数据保存在本机</p>" +
          "</div>" +
          '<div class="row" style="gap:8px;flex-wrap:wrap">' +
            '<button class="group-code" id="copyCode" type="button" title="点击复制邀请码">' + UI().esc(group.code) +
              '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>' +
            "</button>" +
            (checked
              ? '<button class="btn success" id="groupCheckin" type="button" disabled>今日已打卡 ✓</button>'
              : (dp.complete
                ? '<button class="btn primary" id="groupCheckin" type="button">组内打卡 +10</button>'
                : '<button class="btn soft" id="groupCheckin" type="button">完成 20 词后打卡 · ' + dp.done + "/" + dp.total + "</button>")) +
          "</div>" +
        "</div>" +
        switcher +
        '<div class="grid grid-3" style="margin-top:16px">' +
          '<div class="stat"><div class="stat-label">我的组内排名</div><div class="stat-value">第 ' + myRank + ' 名</div>' +
            '<div class="stat-note">共 ' + members.length + " / " + CET.store.MAX_MEMBERS + " 名成员</div></div>" +
          '<div class="stat"><div class="stat-label">连续打卡</div><div class="stat-value">' + s.checkin.streak + ' <small class="dim" style="font-size:12px">天</small></div>' +
            '<div class="stat-note">累计 ' + s.checkin.days.length + " 天</div></div>" +
          '<div class="stat"><div class="stat-label">我的今日积分</div><div class="stat-value">' + CET.store.todayPoints() + "</div>" +
            '<div class="stat-note">总积分 ' + s.points.total + "</div></div>" +
        "</div>" +
      "</div>" +

      '<div class="card" style="margin-top:16px">' +
        '<div class="row between wrap" style="margin-bottom:10px">' +
          '<div><h3 style="font-size:15px">组内排行榜</h3><p class="tiny dim">与组员一起保持节奏，演示成员数据为本地模拟。</p></div>' +
          '<div class="row" style="gap:6px">' +
            '<button class="chip' + (ui.board === "total" ? " active" : "") + '" data-board="total" type="button">总积分榜</button>' +
            '<button class="chip' + (ui.board === "today" ? " active" : "") + '" data-board="today" type="button">今日榜</button>' +
          "</div>" +
        "</div>" +
        memberRows +
      "</div>" +

      '<div class="card" style="margin-top:16px">' +
        '<h3 style="font-size:15px;margin-bottom:10px">加入或创建更多小组</h3>' +
        '<div class="grid grid-2">' +
          '<div class="form-grid">' +
            '<label>创建新小组（最多 ' + CET.store.MAX_MEMBERS + ' 人）</label>' +
            '<input class="input" id="groupName2" maxlength="18" placeholder="小组名称" />' +
            '<button class="btn block" id="createGroupBtn2" type="button">创建</button>' +
          "</div>" +
          '<div class="form-grid">' +
            '<label>邀请码加入</label>' +
            '<input class="input code" id="joinCode2" maxlength="8" placeholder="输入邀请码" />' +
            '<button class="btn block" id="joinGroupBtn2" type="button">加入</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";

    root.querySelector("#copyCode").addEventListener("click", function () {
      var text = group.code;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          UI().toast("邀请码已复制：" + text, "success");
        }).catch(function () { UI().toast("邀请码：" + text, "success"); });
      } else {
        UI().toast("邀请码：" + text, "success");
      }
    });

    root.querySelector("#groupCheckin").addEventListener("click", function () {
      if (checked) return;
      if (!dp.complete) {
        UI().toast("今日单词还差 " + dp.remaining + " 个，完成 20 词后才能打卡", "warn");
        goDaily();
        return;
      }
      var r = CET.store.checkin();
      if (r.ok) {
        UI().toast("组内打卡成功，连续 " + r.streak + " 天", "success", r.points);
        CET.app.refreshChrome();
        CET.app.rerender();
      } else if (r.reason === "already") {
        UI().toast("今天已经打过卡啦", "warn");
      } else {
        UI().toast("还未完成今日 20 词", "warn");
      }
    });

    root.querySelectorAll("[data-group]").forEach(function (b) {
      b.addEventListener("click", function () {
        var gid = b.getAttribute("data-group");
        var target = s.groups.list.filter(function (g) { return g.id === gid; })[0];
        if (!target) return;
        var hasMe = target.members.some(function (m) { return m.isMe; });
        if (!hasMe) {
          joinByCode(target.code);
          return;
        }
        s.groups.currentId = target.id;
        CET.store.save();
        CET.app.refreshChrome();
        CET.app.rerender();
      });
    });

    root.querySelectorAll("[data-board]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.board = b.getAttribute("data-board");
        CET.app.rerender();
      });
    });

    root.querySelector("#createGroupBtn2").addEventListener("click", function () {
      var input = root.querySelector("#groupName2");
      if (!input.value.trim()) { UI().toast("请填写小组名称", "warn"); input.focus(); return; }
      createByName(input.value);
    });

    root.querySelector("#joinGroupBtn2").addEventListener("click", function () {
      var input = root.querySelector("#joinCode2");
      if (!input.value.trim()) { UI().toast("请输入邀请码", "warn"); input.focus(); return; }
      joinByCode(input.value);
    });
  }

  function render(root) {
    var group = CET.store.currentGroup();
    if (!group) renderForms(root);
    else renderGroup(root, group);
  }

  CET.views = CET.views || {};
  CET.views.groups = { title: "学习小组", render: render };
})();
