/* 应用入口：导航、主题、路由、全局状态刷新 */
window.CET = window.CET || {};

(function () {
  var ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    vocab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v18H6.5A2.5 2.5 0 0 0 4 23"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v18h4.5A2.5 2.5 0 0 1 20 23"/></svg>',
    speaking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>',
    listening: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 15a8 8 0 0 1 16 0"/><path d="M4 15v3a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2z"/><path d="M20 15v3a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2z"/></svg>',
    groups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-8 0v2"/><circle cx="8.5" cy="7.5" r="3.5"/><path d="M21 21v-1.8a4 4 0 0 0-3-3.7"/><path d="M16.5 4.2a3.5 3.5 0 0 1 0 6.6"/></svg>',
    points: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5.5H4v1.5a3 3 0 0 0 3 3"/><path d="M17 5.5H20v1.5a3 3 0 0 1-3 3"/></svg>'
  };

  var NAV = [
    { id: "dashboard", label: "学习总览" },
    { id: "vocab", label: "高频词汇" },
    { id: "speaking", label: "口语练习" },
    { id: "listening", label: "听力练习" },
    { id: "groups", label: "学习小组" },
    { id: "points", label: "积分中心" }
  ];

  var WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  var current = "dashboard";
  var currentMeta = null;

  function buildNav() {
    var nav = document.getElementById("mainNav");
    nav.innerHTML = NAV.map(function (item) {
      return '<button class="nav-item" data-view="' + item.id + '" type="button">' + ICONS[item.id] +
        "<span>" + item.label + "</span></button>";
    }).join("");
    nav.querySelectorAll("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
    });
  }

  function applyTheme() {
    var theme = CET.store.state.theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }

  function refreshChrome() {
    var st = CET.store;
    var s = st.state;
    var lvl = st.levelInfo();
    var pointsEl = document.getElementById("pointsValue");
    if (pointsEl) pointsEl.textContent = s.points.total;
    var avatar = document.getElementById("userBtn");
    if (avatar) avatar.textContent = CET.ui.initials(s.user.name);
    var todayEl = document.getElementById("sideToday");
    if (todayEl) todayEl.textContent = st.todayPoints();
    var streakEl = document.getElementById("sideStreak");
    if (streakEl) streakEl.textContent = s.checkin.streak + " 天";
    var lvName = document.getElementById("sideLevelName");
    if (lvName) lvName.textContent = lvl.name;
    var lvPct = document.getElementById("sideLevelPct");
    if (lvPct) lvPct.textContent = lvl.pct + "%";
    var lvBar = document.getElementById("sideLevelBar");
    if (lvBar) lvBar.style.width = lvl.pct + "%";
    var nav = document.getElementById("mainNav");
    if (nav) {
      nav.querySelectorAll("[data-view]").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-view") === current);
      });
    }
    var title = document.getElementById("viewTitle");
    if (title && CET.views[current]) title.textContent = CET.views[current].title;
  }

  function renderView() {
    var root = document.getElementById("viewRoot");
    var meta = CET.views[current];
    if (!meta) {
      root.innerHTML = '<div class="empty">页面不存在</div>';
      return;
    }
    try {
      root.innerHTML = "";
      meta.render(root);
    } catch (err) {
      console.error("页面渲染失败", err);
      root.innerHTML = '<div class="card"><h3 style="font-size:16px">页面加载出错</h3>' +
        '<p class="muted small" style="margin-top:8px">' + CET.ui.esc(err && err.message ? err.message : String(err)) +
        '</p><p class="tiny dim" style="margin-top:6px">请打开浏览器控制台查看详细堆栈，或刷新页面重试。</p></div>';
    }
    refreshChrome();
  }

  function setView(id) {
    if (!CET.views[id]) return;
    if (currentMeta && currentMeta.destroy) {
      try { currentMeta.destroy(); } catch (e) {}
    }
    CET.ui.stopSpeak();
    current = id;
    currentMeta = CET.views[id];
    renderView();
  }

  function rerender() {
    renderView();
  }

  function boot() {
    buildNav();
    applyTheme();
    var now = new Date();
    var label = document.getElementById("todayLabel");
    if (label) {
      label.textContent = now.getFullYear() + " 年 " + (now.getMonth() + 1) + " 月 " + now.getDate() + " 日 · " + WEEK[now.getDay()];
    }
    currentMeta = CET.views[current];
    renderView();

    document.getElementById("themeBtn").addEventListener("click", function () {
      CET.store.state.theme = CET.store.state.theme === "light" ? "dark" : "light";
      CET.store.save();
      applyTheme();
      CET.ui.toast("已切换到" + (CET.store.state.theme === "light" ? "浅色" : "深色") + "主题", "success");
    });

    document.getElementById("pointsPill").addEventListener("click", function () { setView("points"); });

    document.getElementById("userBtn").addEventListener("click", function () {
      var name = window.prompt("修改昵称（最多 12 个字符）", CET.store.state.user.name);
      if (name === null) return;
      name = name.trim().slice(0, 12);
      if (!name) { CET.ui.toast("昵称不能为空", "warn"); return; }
      CET.store.state.user.name = name;
      CET.store.save();
      refreshChrome();
      CET.app.rerender();
      CET.ui.toast("昵称已更新为「" + name + "」", "success");
    });

    var brand = document.getElementById("brandLink");
    brand.addEventListener("click", function (e) {
      e.preventDefault();
      setView("dashboard");
    });
  }

  CET.app = {
    setView: setView,
    rerender: rerender,
    refreshChrome: refreshChrome,
    get current() { return current; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("beforeunload", function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  });
})();
