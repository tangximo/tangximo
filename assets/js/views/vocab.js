/* =========================================================
   高频词汇：今日 20 词打卡 / 词库浏览 / 错词本
   设计要点（针对上一版点击不准、层级混乱的问题）：
   - 一屏一卡，卡上只有「显示释义」和三个大按钮，按钮独立布局不重叠
   - 标记后先给出明确选中反馈，再切到下一张；全程加锁防重复触发
   - 词库 1000+ 词分页渲染，避免一次性渲染造成卡顿
   ========================================================= */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };

  var st = {
    tab: "daily",
    level: "CET4",
    chapter: 0,
    letter: "",
    status: "all",
    search: "",
    page: 1,
    extra: false,
    extraIndex: 0,
    extraLevel: "CET4"
  };

  var revealed = false;
  var lock = false;
  var keyHandler = null;
  var PAGE_SIZE = 40;

  function wordsAll() { return CET.data.words; }
  function statusOf(id) { return CET.store.state.vocab.status[id] || "new"; }

  function levelTag(level) {
    return '<span class="tag ' + (level === "CET4" ? "accent" : "teal") + '">' +
      (level === "CET4" ? "四级 CET-4" : "六级 CET-6") + "</span>";
  }

  function statusTag(id) {
    var s = statusOf(id);
    if (s === "mastered") return '<span class="tag success">已掌握</span>';
    if (s === "unknown") return '<span class="tag danger">不认识</span>';
    if (s === "fuzzy") return '<span class="tag warn">模糊</span>';
    return '<span class="tag">未学</span>';
  }

  var SPEAK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
    '<path d="M4 9.5v5h3.5L12 19V5l-4.5 4.5H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';

  /* ---------------- 顶部标签栏 ---------------- */

  function tabsHtml(dp) {
    return '<div class="vocab-tabs">' +
      '<button class="vtab' + (st.tab === "daily" ? " active" : "") + '" data-tab="daily" type="button">' +
        "<span>今日打卡</span><small>" + dp.done + "/" + dp.total + "</small></button>" +
      '<button class="vtab' + (st.tab === "list" ? " active" : "") + '" data-tab="list" type="button">' +
        "<span>词库浏览</span><small>" + CET.data.words.length + " 词</small></button>" +
      '<button class="vtab' + (st.tab === "wrong" ? " active" : "") + '" data-tab="wrong" type="button">' +
        "<span>错词本</span><small>" + wrongCount() + " 词</small></button>" +
      "</div>";
  }

  function wrongCount() {
    return wordsAll().filter(function (w) {
      var s = statusOf(w.id);
      return s === "unknown" || s === "fuzzy";
    }).length;
  }

  /* ---------------- 每日卡片 ---------------- */

  function cardHtml(word, opts) {
    var isExtra = !!opts.extra;
    var counter = opts.counter || "";
    var aria = isExtra ? "额外学习单词卡" : "今日单词卡";
    return '<div class="daily-card' + (revealed ? " revealed" : "") + '" id="dailyCard" role="region" aria-label="' + aria + '">' +
      '<div class="daily-card-top">' + levelTag(word.level) +
        '<span class="daily-counter">' + counter + "</span></div>" +
      '<div class="daily-word" id="dailyWord">' + UI().esc(word.word) + "</div>" +
      '<div class="daily-phonetic">' +
        '<span>' + UI().esc(word.phonetic) + "</span>" +
        '<button class="speak-btn" data-speak="' + UI().esc(word.word) + '" data-word-speak="1" type="button" title="朗读单词" aria-label="朗读单词">' + SPEAK_ICO + "</button>" +
        '<span class="voice-note" id="voiceNote">' + UI().voiceLabel() + "</span>" +
      "</div>" +
      '<button class="btn soft block reveal-btn" id="revealBtn" type="button">' +
        (revealed ? "收起释义" : "显示释义（空格）") + "</button>" +
      '<div class="daily-reveal" id="dailyReveal"' + (revealed ? "" : " aria-hidden=\"true\"") + ">" +
        '<p class="daily-pos">' + UI().esc(word.pos) + "</p>" +
        '<p class="daily-cn">' + UI().esc(word.cn) + "</p>" +
        '<div class="daily-example"><p class="en">' + UI().esc(word.example) + "</p>" +
          '<p class="cn">' + UI().esc(word.exampleCn) + "</p>" +
          '<button class="speak-btn sm" data-speak="' + UI().esc(word.example) + '" type="button" title="朗读例句">' + SPEAK_ICO + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="daily-actions">' +
        '<button class="mark-btn unknown" data-mark="unknown" type="button">' +
          '<span class="mark-title">不认识</span><span class="mark-key">按 1</span></button>' +
        '<button class="mark-btn fuzzy" data-mark="fuzzy" type="button">' +
          '<span class="mark-title">模糊</span><span class="mark-key">按 2</span></button>' +
        '<button class="mark-btn mastered" data-mark="mastered" type="button">' +
          '<span class="mark-title">已掌握</span><span class="mark-key">按 3</span></button>' +
      "</div>" +
    "</div>";
  }

  function dailyHeader(dp) {
    var s = CET.store.state;
    var checked = s.checkin.last === CET.store.dateKey();
    return '<div class="daily-top card flat">' +
      '<div class="row between wrap" style="gap:10px">' +
        "<div>" +
          '<h2 class="daily-title">今日单词打卡</h2>' +
          '<p class="tiny dim">每天 20 个新词，完成后自动打卡 · 词库 ' + CET.data.words.length + " 词</p>" +
        "</div>" +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' +
          '<span class="tag accent">今日 ' + dp.done + " / " + dp.total + "</span>" +
          '<span class="tag ' + (checked ? "success" : "warn") + '">' + (checked ? "已打卡 ✓" : "待打卡") + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="bar daily-bar"><i style="width:' + dp.percent + '%"></i></div>' +
      '<div class="row between daily-meta">' +
        '<span class="tiny dim">' + (dp.complete ? "今日 20 词已完成" : "剩余 " + dp.remaining + " 词") + "</span>" +
        '<span class="tiny dim">连续打卡 ' + s.checkin.streak + " 天 · 每次 +10 分起</span>" +
      "</div>" +
    "</div>";
  }

  function bindCard(root, word, isExtra) {
    revealed = !!revealed;
    var card = root.querySelector("#dailyCard");
    if (!card) return;

    card.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      toggleReveal(root, card);
    });

    var revealBtn = root.querySelector("#revealBtn");
    if (revealBtn) {
      revealBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleReveal(root, card);
      });
    }

    root.querySelectorAll("[data-speak]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        UI().speak(b.getAttribute("data-speak"), {
          rate: 0.86,
          word: b.hasAttribute("data-word-speak"),
          btn: b
        });
      });
    });

    root.querySelectorAll("[data-mark]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (lock) return;
        lock = true;
        var status = b.getAttribute("data-mark");
        b.classList.add("selected");
        root.querySelectorAll("[data-mark]").forEach(function (x) {
          x.disabled = true;
          if (x !== b) x.classList.add("dimmed");
        });
        var r = isExtra ? CET.store.markWord(word.id, status) : CET.store.markDailyWord(word.id, status);
        if (!isExtra && r && r.ok) {
          UI().toast(status === "mastered" ? "已掌握 " + word.word : status === "fuzzy" ? "已记为模糊" : "已加入错词本",
            status === "mastered" ? "success" : "warn", r.points || 0);
        } else if (isExtra && r && r.ok) {
          UI().toast("已记录 " + word.word, "success", r.points || 0);
        }
        setTimeout(function () {
          lock = false;
          revealed = false;
          CET.app.rerender();
        }, 480);
      });
    });
  }

  function toggleReveal(root, card) {
    revealed = !revealed;
    card.classList.toggle("revealed", revealed);
    var btn = root.querySelector("#revealBtn");
    if (btn) btn.textContent = revealed ? "收起释义" : "显示释义（空格）";
    var panel = root.querySelector("#dailyReveal");
    if (panel) panel.setAttribute("aria-hidden", revealed ? "false" : "true");
  }

  function renderDaily(root) {
    var dp = CET.store.dailyProgress();
    var s = CET.store.state;
    var checked = s.checkin.last === CET.store.dateKey();

    var html = '<div class="view-enter">' + tabsHtml(dp) + dailyHeader(dp);

    if (st.extra) {
      var extra = renderExtra(root);
      html += extra.html;
      root.innerHTML = html;
      bindTabs(root);
      var back = root.querySelector("#backFinish");
      if (back) {
        back.addEventListener("click", function () {
          st.extra = false;
          revealed = false;
          CET.app.rerender();
        });
      }
      var p2 = root.querySelector("#pauseBtn2");
      if (p2) p2.addEventListener("click", function () { UI().stopSpeak(); });
      if (extra.word) bindCard(root, extra.word, true);
      return;
    }

    if (dp.complete) {
      html += '<div class="daily-finish card">' +
        '<div class="finish-ring">✓</div>' +
        '<h3>今日 20 个单词已完成</h3>' +
        '<p class="muted small">' + (checked ? "今天已经打过卡了，连续 " + s.checkin.streak + " 天。" : "完成 20 词学习，马上领取今天的打卡奖励。") + "</p>" +
        '<div class="finish-stats">' +
          '<div><strong>' + dp.total + "</strong><span>今日单词</span></div>" +
          '<div><strong>' + s.checkin.streak + "</strong><span>连续天数</span></div>" +
          '<div><strong>' + CET.store.todayPoints() + "</strong><span>今日积分</span></div>" +
        "</div>" +
        '<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' +
          (checked ? '<span class="tag success">今日已打卡 ✓</span>'
                   : '<button class="btn primary" id="finishCheckin" type="button">立即打卡</button>') +
          '<button class="btn soft" id="extraBtn" type="button">额外学习</button>' +
          '<button class="btn ghost" id="wrongBtn" type="button">查看错词本</button>' +
        "</div>" +
      "</div>";
      root.innerHTML = html;
      bindTabs(root);
      var ci = root.querySelector("#finishCheckin");
      if (ci) {
        ci.addEventListener("click", function () {
          var r = CET.store.checkin();
          if (r.ok) {
            UI().toast("打卡成功，连续 " + r.streak + " 天", "success", r.points);
            CET.app.refreshChrome();
            CET.app.rerender();
          } else {
            UI().toast("还未完成今日 20 词", "warn");
          }
        });
      }
      root.querySelector("#extraBtn").addEventListener("click", function () {
        st.extra = true;
        st.extraIndex = 0;
        revealed = false;
        CET.app.rerender();
      });
      root.querySelector("#wrongBtn").addEventListener("click", function () {
        st.tab = "wrong";
        st.page = 1;
        CET.app.rerender();
      });
      return;
    }

    var word = dp.nextId ? CET.store.wordById(dp.nextId) : null;
    if (!word) {
      html += '<div class="empty">今日计划已生成完毕，请明天再来，或去「额外学习」。</div>';
      root.innerHTML = html;
      bindTabs(root);
      return;
    }

    html += '<div class="daily-stage">' +
      cardHtml(word, { counter: "第 " + (dp.done + 1) + " / " + dp.total + " 个" }) +
      '<div class="daily-foot">' +
        '<button class="btn ghost" id="pauseBtn" type="button">暂停发音</button>' +
        '<span class="tiny dim">剩余 ' + dp.remaining + " 词</span>" +
        '<button class="btn ghost" id="homeBtn" type="button">返回总览</button>' +
      "</div>" +
      '<p class="tiny dim center daily-tip">点击卡片也能展开释义 · 快捷键：空格显示释义，1/2/3 标记</p>' +
    "</div>";

    root.innerHTML = html;
    bindTabs(root);
    bindCard(root, word, false);

    root.querySelector("#pauseBtn").addEventListener("click", function () { UI().stopSpeak(); });
    root.querySelector("#homeBtn").addEventListener("click", function () { CET.app.setView("dashboard"); });
  }

  function renderExtra(root) {
    var dp = CET.store.dailyProgress();
    var pool = wordsAll().filter(function (w) {
      return statusOf(w.id) === "new" && dp.ids.indexOf(w.id) === -1;
    });
    st.extraIndex = Math.max(0, Math.min(st.extraIndex, pool.length - 1));
    if (!pool.length) {
      return {
        word: null,
        html: '<div class="daily-finish card">' +
          '<div class="finish-ring">✓</div><h3>没有更多额外新词了</h3>' +
          '<p class="muted small">可以去错词本复习，或明天继续。</p>' +
          '<div class="row" style="justify-content:center"><button class="btn" id="backFinish" type="button">返回打卡页</button></div>' +
        "</div>"
      };
    }
    var word = pool[st.extraIndex];
    var html = '<div class="daily-stage">' +
      '<div class="row between wrap" style="margin-bottom:10px">' +
        '<span class="tag warn">额外学习 · 不计入今日打卡进度</span>' +
        '<span class="tiny dim">额外单词 ' + (st.extraIndex + 1) + " / " + pool.length + "</span>" +
      "</div>" +
      cardHtml(word, { extra: true, counter: "额外 · " + (st.extraIndex + 1) + " / 20+" }) +
      '<div class="daily-foot">' +
        '<button class="btn ghost" id="backFinish" type="button">返回打卡页</button>' +
        '<span class="tiny dim">今日进度仍为 ' + dp.done + " / " + dp.total + "</span>" +
        '<button class="btn ghost" id="pauseBtn2" type="button">暂停发音</button>' +
      "</div>" +
      '<p class="tiny dim center daily-tip">额外学习只记录单词状态与积分，不改变今日打卡进度。</p>' +
    "</div>";
    return { html: html, word: word };
  }

  /* ---------------- 词库浏览 / 错词本 ---------------- */

  function filtered(mode) {
    var out = wordsAll();
    if (st.level !== "ALL") {
      out = out.filter(function (w) { return w.level === st.level; });
    }
    if (st.level !== "ALL" && st.chapter) {
      out = out.filter(function (w) { return w.chapter === st.chapter; });
    }
    if (st.letter) {
      out = out.filter(function (w) { return w.word.charAt(0).toUpperCase() === st.letter; });
    }
    if (mode === "wrong") {
      out = out.filter(function (w) {
        var s = statusOf(w.id);
        return s === "unknown" || s === "fuzzy";
      });
    } else if (st.status !== "all") {
      out = out.filter(function (w) { return statusOf(w.id) === st.status; });
    }
    var q = st.search.trim().toLowerCase();
    if (q) {
      out = out.filter(function (w) {
        return w.word.toLowerCase().indexOf(q) > -1 || w.cn.indexOf(q) > -1;
      });
    }
    return out;
  }

  function renderList(root, mode) {
    var dp = CET.store.dailyProgress();
    var list = filtered(mode);
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    st.page = Math.max(1, Math.min(st.page, pages));
    var start = (st.page - 1) * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);

    var rows = slice.map(function (w) {
      var s = statusOf(w.id);
      return '<div class="word-row">' +
        '<div class="w"><span class="word-main">' + UI().esc(w.word) + "</span>" +
          '<small class="mono">' + UI().esc(w.phonetic) + "</small>" +
          '<span class="tag" style="font-size:10px;padding:1px 6px">' + (w.level === "CET4" ? "四级" : "六级") + "</span>" +
          statusTag(w.id) + "</div>" +
        '<div class="m"><span class="pos mono">' + UI().esc(w.pos) + "</span> " + UI().esc(w.cn) + "</div>" +
        '<div class="acts">' +
          '<button class="icon-act" data-speak="' + UI().esc(w.word) + '" type="button" title="朗读">' + SPEAK_ICO + "</button>" +
          '<button class="btn sm ' + (s === "mastered" ? "ghost" : "success") + '" data-mark="mastered" data-id="' + w.id + '" type="button">' +
            (s === "mastered" ? "已掌握" : "掌握") + "</button>" +
          '<button class="btn sm danger" data-mark="unknown" data-id="' + w.id + '" type="button">不认识</button>' +
        "</div>" +
      "</div>";
    }).join("");

    var chapters = levelChapters();
    var chapterOpts = '<option value="0">全部章节</option>';
    for (var i = 1; i <= chapters; i++) {
      chapterOpts += '<option value="' + i + '"' + (st.chapter === i ? " selected" : "") + ">第 " + i + " 章（" +
        ((i - 1) * 20 + 1) + "-" + (i * 20) + "）</option>";
    }

    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

    var filters = '<div class="filter-bar">' +
      '<div class="segmented">' +
        '<button class="' + (st.level === "ALL" ? "active" : "") + '" data-level="ALL" type="button">全部</button>' +
        '<button class="' + (st.level === "CET4" ? "active" : "") + '" data-level="CET4" type="button">四级</button>' +
        '<button class="' + (st.level === "CET6" ? "active" : "") + '" data-level="CET6" type="button">六级</button>' +
      "</div>" +
      '<select class="chapter-select" id="chapterSel"' + (st.level === "ALL" ? " disabled" : "") + ">" + chapterOpts + "</select>" +
      '<select class="chapter-select" id="letterSel">' +
        '<option value="">全部首字母</option>' +
        letters.map(function (l) { return '<option value="' + l + '"' + (st.letter === l ? " selected" : "") + ">" + l + "</option>"; }).join("") +
      "</select>" +
      '<input class="search-input" id="wordSearch" placeholder="搜索单词 / 释义" value="' + UI().esc(st.search) + '" />' +
    "</div>";

    var statusChips = '<div class="filter-chips">' +
      ["all", "new", "mastered", "fuzzy", "unknown"].map(function (k) {
        var label = { all: "全部", new: "未学", mastered: "已掌握", fuzzy: "模糊", unknown: "不认识" }[k];
        return '<button class="chip' + (st.status === k ? " active" : "") + '" data-status="' + k + '" type="button">' + label + "</button>";
      }).join("") +
      '<span class="spacer"></span>' +
      '<span class="tiny dim">共 ' + list.length + " 词 · 第 " + st.page + " / " + pages + " 页</span>" +
    "</div>";

    root.innerHTML = '<div class="view-enter">' + tabsHtml(dp) +
      '<div class="card flat list-head">' +
        '<div class="row between wrap">' +
          "<div><h2 class=\"daily-title\">" + (mode === "wrong" ? "错词本" : "词库浏览") + "</h2>" +
          '<p class="tiny dim">' + (mode === "wrong" ? "标记为「不认识 / 模糊」的词会自动收集到这里。" : "四级 " + CET.data.count4 + " 词 · 六级 " + CET.data.count6 + " 词 · 共 " + CET.data.words.length + " 词") + "</p></div>" +
          '<button class="btn sm primary" data-tab="daily" type="button">去今日打卡</button>' +
        "</div>" +
        (mode === "wrong" ? "" : filters) +
        (mode === "wrong" ? '<div class="filter-chips">' +
          '<button class="chip' + (st.level === "ALL" ? " active" : "") + '" data-level="ALL" type="button">全部</button>' +
          '<button class="chip' + (st.level === "CET4" ? " active" : "") + '" data-level="CET4" type="button">四级</button>' +
          '<button class="chip' + (st.level === "CET6" ? " active" : "") + '" data-level="CET6" type="button">六级</button>' +
          '<span class="spacer"></span><span class="tiny dim">共 ' + list.length + " 词</span></div>" : "") +
        (mode === "wrong" ? "" : statusChips) +
      "</div>" +
      '<div class="word-list">' + (rows || '<div class="empty">没有符合条件的单词</div>') + "</div>" +
      (list.length > PAGE_SIZE ? '<div class="pager">' +
        '<button class="btn sm ghost" id="prevPage" type="button"' + (st.page <= 1 ? " disabled" : "") + ">上一页</button>" +
        '<span class="tiny dim">第 ' + st.page + " / " + pages + " 页</span>" +
        '<button class="btn sm ghost" id="nextPage" type="button"' + (st.page >= pages ? " disabled" : "") + ">下一页</button>" +
      "</div>" : "") +
    "</div>";

    bindTabs(root);

    root.querySelectorAll("[data-level]").forEach(function (b) {
      b.addEventListener("click", function () {
        st.level = b.getAttribute("data-level");
        st.chapter = 0;
        st.page = 1;
        CET.app.rerender();
      });
    });

    root.querySelector("#chapterSel") && root.querySelector("#chapterSel").addEventListener("change", function (e) {
      st.chapter = parseInt(e.target.value, 10) || 0;
      st.page = 1;
      CET.app.rerender();
    });

    root.querySelector("#letterSel").addEventListener("change", function (e) {
      st.letter = e.target.value;
      st.page = 1;
      CET.app.rerender();
    });

    root.querySelectorAll("[data-status]").forEach(function (b) {
      b.addEventListener("click", function () {
        st.status = b.getAttribute("data-status");
        st.page = 1;
        CET.app.rerender();
      });
    });

    var input = root.querySelector("#wordSearch");
    input.addEventListener("input", function () {
      st.search = input.value;
      st.page = 1;
      CET.app.rerender();
      var again = document.getElementById("wordSearch");
      if (again) {
        again.focus();
        again.setSelectionRange(again.value.length, again.value.length);
      }
    });

    root.querySelectorAll("[data-speak]").forEach(function (b) {
      b.addEventListener("click", function () {
        UI().speak(b.getAttribute("data-speak"), { rate: 0.86, word: true, btn: b });
      });
    });

    root.querySelectorAll("[data-mark][data-id]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-id");
        var r = CET.store.markWord(id, b.getAttribute("data-mark"));
        if (r.ok) {
          UI().toast((r.word ? r.word.word : "单词") + " 已更新", "success", r.points || 0);
        }
        CET.app.rerender();
      });
    });

    var prev = root.querySelector("#prevPage");
    if (prev) prev.addEventListener("click", function () { st.page -= 1; CET.app.rerender(); });
    var next = root.querySelector("#nextPage");
    if (next) next.addEventListener("click", function () { st.page += 1; CET.app.rerender(); });
  }

  function levelChapters() {
    if (st.level === "ALL") return CET.data.chapters;
    var count = st.level === "CET4" ? CET.data.count4 : CET.data.count6;
    return Math.ceil(count / 20);
  }

  /* ---------------- 交互绑定 ---------------- */

  function bindTabs(root) {
    root.querySelectorAll("[data-tab]").forEach(function (b) {
      b.addEventListener("click", function () {
        st.tab = b.getAttribute("data-tab");
        st.page = 1;
        st.extra = false;
        revealed = false;
        CET.app.rerender();
      });
    });
  }

  function bindKeys() {
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    keyHandler = function (e) {
      if (CET.app.current !== "vocab" || st.tab !== "daily" || st.extra || lock) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        var card = document.getElementById("dailyCard");
        var revealBtn = document.getElementById("revealBtn");
        if (card && revealBtn) revealBtn.click();
      } else if (e.key === "1" || e.key === "2" || e.key === "3") {
        var map = { "1": "unknown", "2": "fuzzy", "3": "mastered" };
        var btn = document.querySelector('[data-mark="' + map[e.key] + '"]');
        if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
      }
    };
    document.addEventListener("keydown", keyHandler);
  }

  function render(root) {
    if (st.tab === "daily") renderDaily(root);
    else renderList(root, st.tab);
    bindKeys();
  }

  CET.views = CET.views || {};
  CET.views.vocab = {
    title: "高频词汇",
    render: render,
    showTab: function (tab) { st.tab = tab; st.extra = false; revealed = false; },
    destroy: function () {
      revealed = false;
      lock = false;
      if (keyHandler) document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
  };
})();
