/* 应用入口：导航、主题、路由、全局状态刷新
   ---------------------------------------------------------
   2026-11 优化版：视图脚本改为按需加载
   - 首屏只加载 dashboard 一个视图
   - 其它视图在用户第一次点击时才下载对应 js
   - 大数据文件（listening-extra/restore/bounds）由 views/listening.js 通过
     CET.loader.ensureView 自行按需拉取，本文件不关心

   依赖：assets/js/core/loader.js 必须先于本文件加载。
   ========================================================= */
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

  // 视图 -> 需要的脚本（按顺序加载）。dashboard 已在 index.html 同步加载，无需记录。
  //
  // 重要：listening 一组的顺序不能随意调。
  // views/listening.js 内部的 setOf()/buildExamIndex() 会读取：
  //   CET.data.listeningExtra / listeningBounds / listeningAudioOnline
  //   CET.data.listening2025（由 listening-2025-12.js 建立数组，下面 3 个文件往数组里填 lines）
  // 这些必须在视图脚本执行之前就位，否则首次进入听力页会看到「精听版没有原文」。
  var VIEW_SCRIPTS = {
    vocab: [
      "assets/js/data/words-4a.js",
      "assets/js/data/words-4b.js",
      "assets/js/data/words-4c.js",
      "assets/js/data/words-4d.js",
      "assets/js/data/words-4e.js",
      "assets/js/data/words-4f.js",
      "assets/js/data/words-6a.js",
      "assets/js/data/words-6b.js",
      "assets/js/data/words-6c.js",
      "assets/js/data/words-6d.js",
      "assets/js/data/words-6e.js",
      "assets/js/data/words-6f.js",
      "assets/js/views/vocab.js"
    ],
    speaking: ["assets/js/views/speaking.js"],
    listening: [
      // 进入听力页只下载「索引 + 句界 + 在线原音清单」约 120 KB；
      // 每套题的全文按年份放在 assets/js/data/by-year/，点开某套时才加载。
      "assets/js/data/listening-index.js",
      "assets/js/data/listening-audio-online.js",
      "assets/js/data/listening-bounds.js",
      "assets/js/views/listening.js"
    ],
    groups: ["assets/js/views/groups.js"],
    points: ["assets/js/views/points.js"]
  };

  var WEEK = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  var current = "dashboard";
  var currentMeta = null;
  // 防止用户快速连点时出现两次并行加载导致的重复渲染
  var pendingView = null;

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

  /**
   * 切换视图。若目标视图的脚本还没加载，先显示加载态再加载。
   *
   * 路由说明（2026-11 新增）：
   * 原来 setView() 只改内存变量，完全不读写 location.hash，导致：
   *   ① #vocab 这类链接分享出去打不开对应页面
   *   ② 浏览器前进/后退失效
   *   ③ 刷新页面总是回到首页
   * 现在把 hash 作为唯一事实来源：所有切换都会写 hash，
   * 并监听 hashchange（含浏览器前进/后退、手动改地址栏）。
   * 为避免循环，写 hash 时用内部标记区分「自己写的」和「用户触发的」。
   */
  var suppressHashChange = false;

  function hashOf(id) {
    return "#" + id;
  }

  function readHash() {
    var raw = String(location.hash || "").replace(/^#\/?/, "");
    // 只接受已知视图 id，非法值一律回落首页，避免坏链接导致白屏
    var ok = NAV.some(function (n) { return n.id === raw; });
    return ok ? raw : "dashboard";
  }

  function writeHash(id) {
    if (readHash() === id && location.hash === hashOf(id)) return;
    suppressHashChange = true;
    try {
      // 用 replaceState 不产生多余历史记录；首次进入时避免 push 一条空记录
      if (location.hash) {
        history.pushState(null, "", hashOf(id));
      } else {
        history.replaceState(null, "", hashOf(id));
      }
    } catch (e) {
      // file:// 等受限环境降级为直接赋值
      location.hash = hashOf(id);
    }
    // 交回事件循环后解除抑制，保证紧随其后的 hashchange 被正确忽略
    setTimeout(function () { suppressHashChange = false; }, 0);
  }

  function setView(id) {
    var urls = VIEW_SCRIPTS[id] || [];

    // 视图未注册且需要加载 -> 走异步路径
    if (!CET.views[id] && urls.length) {
      if (pendingView === id) return; // 同一视图已在加载中，忽略重复点击
      // 切到别的视图时，放弃之前那个未完成的加载请求标记
      if (pendingView && pendingView !== id) pendingView = null;
      pendingView = id;

      // 记录到地址栏，保证可分享 / 可刷新 / 前进后退可用
      writeHash(id);

      // 先切走旧视图，避免旧页面的定时器/音频继续跑
      if (currentMeta && currentMeta.destroy) {
        try { currentMeta.destroy(); } catch (e) {}
      }
      CET.ui.stopSpeak();
      current = id;
      currentMeta = null;

      // 高亮导航 + 标题立即可见，用户感知不到"点不动"
      refreshChrome();
      var title = document.getElementById("viewTitle");
      if (title) title.textContent = (NAV.filter(function (n) { return n.id === id; })[0] || {}).label || "";

      var root = document.getElementById("viewRoot");
      if (root) {
        root.innerHTML = '<div class="view-enter" style="padding:48px 0;text-align:center">' +
          '<p class="muted">正在加载页面…</p></div>';
      }

      CET.loader.loadScripts(urls).then(function () {
        pendingView = null;
        if (current !== id) return; // 加载期间用户已切到别处
        if (!CET.views[id]) {
          root.innerHTML = '<div class="empty">页面脚本未正确注册</div>';
          return;
        }
        currentMeta = CET.views[id];
        // 视图内部若还需要额外数据（如听力题库），由视图自己处理
        if (currentMeta.ensureData) {
          return currentMeta.ensureData().then(function () {
            if (current === id) renderView();
          });
        }
        renderView();
      }).catch(function (err) {
        pendingView = null;
        console.error("[CET.app] 视图脚本加载失败：" + id, err);
        if (current !== id) return;
        root.innerHTML = '<div class="card"><h3 style="font-size:16px">页面加载失败</h3>' +
          '<p class="muted small" style="margin-top:8px">网络不畅导致页面脚本没能下载，请检查网络后重试。</p>' +
          '<button class="btn primary" id="cetRetryView" type="button" style="margin-top:14px">重试</button></div>';
        var btn = document.getElementById("cetRetryView");
        if (btn) btn.addEventListener("click", function () { setView(id); });
      });
      return;
    }

    // 已注册（同步路径，与旧行为一致）
    if (!CET.views[id]) return;
    if (currentMeta && currentMeta.destroy) {
      try { currentMeta.destroy(); } catch (e) {}
    }
    CET.ui.stopSpeak();
    current = id;
    currentMeta = CET.views[id];
    writeHash(id);
    if (currentMeta.ensureData) {
      currentMeta.ensureData().then(function () {
        if (current === id) renderView();
      });
      return;
    }
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

    // 支持用带 hash 的链接直达某个页面（如 #listening）。
    // readHash() 会把非法 hash 回落成 dashboard，所以坏链接不会白屏。
    var initial = readHash();
    current = initial;
    currentMeta = CET.views[current];

    if (initial !== "dashboard" && VIEW_SCRIPTS[initial]) {
      // 目标视图脚本还没加载，交给 setView 走异步加载路径
      setView(initial);
    } else {
      renderView();
    }

    // 浏览器前进/后退、手动改地址栏
    window.addEventListener("hashchange", function () {
      if (suppressHashChange) return;
      var id = readHash();
      if (id !== current) setView(id);
    });

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
