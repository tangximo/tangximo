/* 听力：年份 → 级别 → 套次 → 题型；每套提供「完整版」与「精听版」
   播放来源优先级：用户直链 > 在线真题原音 > 本地导入(IndexedDB) > 内置音频 > 语音合成
   数据现实：在线原音是整卷一段，没有逐题时间戳；逐句精听只能基于有原文的 10 套。 */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };
  var ui = { setId: null, level: "ALL", year: 2025, exam: null, mode: null, type: "ALL" };
  var player = { idx: -1, playing: false, auto: true, loop: false, hideText: false, rate: 0.92, timer: null };
  var token = 0;
  var draft = {};       // 未提交的选择：qi -> 选项下标
  var revealed = false; // 当前套题是否已「查看答案」
  var audioURLs = {};   // setId -> objectURL（从 IndexedDB 恢复或在导入后创建）
  var audioMeta = {};   // setId -> {name,size,duration}
  var linkFailed = {};  // setId -> true（该直链已判定不可播）
  var blobFailed = {};  // setId -> true（本地音频已判定不可播）
  var sourceMode = "tts"; // 当前详情页实际使用的来源：link | blob | tts
  var storeLoaded = false;
  var pendingAudio = [];  // 批量导入后未匹配到套题的音频（也保存在 IndexedDB 里）
  var batch = { busy: false, last: null }; // 批量导入进度与最近一次结果
  var selfDraft = {};     // exam -> 无原文套题的自我听写草稿（仅本页会话）
  var selfState = {};     // exam -> good | again（自我听写自评）
  var stopAt = null;      // 原音模式下「播到本句结束就停」的时间点（秒）
  // 每句独立的倍速 / 循环 / 遍数：按套 + 句 id 存在 localStorage（刷新、切篇后仍保留）
  var LINE_CTL_KEY = "cet.listening.lineCtl.v2";
  var lineRates = {};     // 句 id -> 倍速（0.5–2.0，步进 0.05）
  var lineLoops = {};     // 句 id -> 是否开启单句循环
  var lineReps = {};      // 句 id -> 循环遍数（1/3/5/10）
  var loopLine = -1;      // 当前正在循环播放的句 id，-1 表示没有
  var loopDone = 0;       // 当前循环已经播完的遍数
  var loopTotal = 1;      // 本句循环的目标遍数
  var passLoop = -1;      // 本篇循环：篇下标，-1 表示关闭

  // 页面加载即恢复 IndexedDB 里用户导入过的音频（刷新/重启后仍在）
  function loadAudioStore() {
    if (storeLoaded || !CET.audioStore) return;
    storeLoaded = true;
    CET.audioStore.all().then(function (map) {
      pendingAudio = [];
      Object.keys(map).forEach(function (id) {
        var rec = map[id];
        if (rec.pending) {
          pendingAudio.push({
            pid: rec.id, name: rec.name, size: rec.size, blob: rec.blob,
            reason: rec.reason || "", at: rec.at || 0
          });
          return;
        }
        audioMeta[id] = { name: rec.name, size: rec.size, duration: rec.duration };
        if (!audioURLs[id]) {
          try { audioURLs[id] = URL.createObjectURL(rec.blob); } catch (e) { /* 忽略 */ }
        }
      });
      pendingAudio.sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
      // 只在年份列表页刷新；已进入某套题时不要重绘，否则会销毁正在播放的音频元素
      if (CET.app.current === "listening" && !ui.exam) CET.app.rerender();
    }).catch(function () { /* 不支持 IndexedDB 时静默降级到语音合成 */ });
  }

  function getLinkByKey(key) {
    var links = (CET.store.state.listening && CET.store.state.listening.links) || {};
    var v = links[key];
    return v && typeof v === "string" ? v.trim() : "";
  }

  function setLinkByKey(key, url) {
    CET.store.state.listening.links = CET.store.state.listening.links || {};
    if (url) CET.store.state.listening.links[key] = url;
    else delete CET.store.state.listening.links[key];
    CET.store.save();
  }

  function getLink(set) { return getLinkByKey(set.id); }
  function setLink(set, url) { setLinkByKey(set.id, url); }

  function fmtSize(n) {
    if (!n) return "";
    return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB";
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // 复制链接：clipboard -> execCommand -> 弹出可选中的手动复制框
  function copyText(text, btn) {
    function done(ok) {
      if (ok) {
        UI().toast("已复制链接", "success");
        return;
      }
      UI().toast("自动复制失败，请在弹出的窗口里手动复制", "warn");
      try { window.prompt("请手动复制下面的链接（Ctrl+C）", text); } catch (e) { /* 忽略 */ }
    }
    function viaExec() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, viaExec);
    } else {
      viaExec();
    }
  }

  var PLAY_ICO = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
  var PAUSE_ICO = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var SPEAK_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9.5v5h3.5L12 19V5l-4.5 4.5H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/></svg>';

  function setOf(id) {
    var all = (CET.data.listening || []).concat(CET.data.listening2025 || []);
    return all.filter(function (s) { return s.id === id; })[0];
  }

  function levelTag(level) {
    return '<span class="tag ' + (level === "CET4" ? "accent" : "teal") + '">' +
      (level === "CET4" ? "四级" : "六级") + "</span>";
  }

  function stopAll() {
    token += 1;
    player.playing = false;
    if (player.timer) { clearTimeout(player.timer); player.timer = null; }
    var a = document.getElementById("origAudio");
    if (a) { try { a.pause(); } catch (e) { /* 忽略 */ } }
    UI().stopSpeak();
    updatePlayBtn();
  }

  function updatePlayBtn() {
    var btn = document.getElementById("playBig");
    if (btn) {
      btn.innerHTML = player.playing ? PAUSE_ICO : PLAY_ICO;
      btn.classList.toggle("playing", player.playing);
      btn.setAttribute("aria-label", player.playing ? "暂停" : "播放");
    }
    var state = document.getElementById("playerState");
    if (state) {
      if (player.playing) state.textContent = sourceMode === "tts" ? "播放中" : "原音播放中";
      else if (player.idx >= 0) state.textContent = "已暂停";
      else state.textContent = sourceMode === "tts" ? "播放全文" : "播放原音";
    }
  }

  function setStatus(text) {
    var el = document.getElementById("playerStatus");
    if (el) el.textContent = text;
  }

  function setHint(text, tone) {
    var el = document.getElementById("playHint");
    if (!el) return;
    el.textContent = text;
    el.className = "play-hint" + (tone ? " " + tone : "");
  }

  function highlight(idx) {
    document.querySelectorAll("[data-line]").forEach(function (el) {
      var on = parseInt(el.getAttribute("data-line"), 10) === idx;
      el.classList.toggle("active", on);
      if (on) {
        var box = el.parentNode ? el.parentNode.parentNode : null;
        if (box && box.tagName === "DETAILS" && box.open && el.scrollIntoView) {
          try { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* 忽略 */ }
        }
      }
    });
    var set = ui.setId ? setOf(ui.setId) : null;
    if (set && idx >= 0) {
      setStatus("第 " + (idx + 1) + " / " + set.lines.length + " 句");
      var bar = document.getElementById("lineBar");
      if (bar) bar.style.width = Math.round(((idx + 1) / set.lines.length) * 100) + "%";
    } else {
      setStatus("未开始");
      var bar2 = document.getElementById("lineBar");
      if (bar2) bar2.style.width = "0%";
    }
  }

  function playLine(i) {
    var set = setOf(ui.setId);
    if (!set || !set.lines || !set.lines.length) return;
    if (sourceMode !== "tts") {
      setHint("当前是整段原音，不支持逐句播放；请拖动音频进度条定位", "warn");
      return;
    }
    if (i < 0) i = 0;
    if (i >= set.lines.length) i = set.lines.length - 1;
    stopAll();
    var my = token;
    player.idx = i;
    player.playing = true;
    updatePlayBtn();
    highlight(i);
    setHint("正在朗读第 " + (i + 1) + " 句…", "");

    var line = set.lines[i];
    // speak() 必须在点击事件的同步调用栈里触发，否则会被自动播放策略拦截
    UI().speak(line.en, {
      rate: player.rate,
      onstart: function () {
        if (my !== token) return;
        setHint("播放中 · 第 " + (i + 1) + " / " + set.lines.length + " 句", "ok");
      },
      onerror: function () {
        if (my !== token) return;
        setHint("没有声音：浏览器拦截了播放，请再点一次圆形播放按钮", "bad");
      },
      onend: function (err) {
        if (my !== token) return;
        if (err) {
          player.playing = false;
          updatePlayBtn();
          return;
        }
        if (player.auto && i + 1 < set.lines.length) {
          player.timer = setTimeout(function () {
            player.timer = null;
            if (my !== token) return;
            playLine(i + 1);
          }, 420);
        } else if (player.auto && player.loop && set.lines.length) {
          player.timer = setTimeout(function () {
            player.timer = null;
            if (my !== token) return;
            playLine(0);
          }, 600);
        } else {
          player.playing = false;
          updatePlayBtn();
          setHint("已读完第 " + (i + 1) + " 句（共 " + set.lines.length + " 句）", "ok");
        }
      }
    });
  }

  function pausePlay() {
    stopAll();
    highlight(player.idx);
    setHint("已暂停，再点播放继续", "");
  }

  /* ---------------- 套题列表 ---------------- */

  function levelName(lv) { return lv === "CET4" ? "四级" : lv === "CET6" ? "六级" : ""; }

  // 文件名解析：年份 / 月份 / 级别（覆盖中文与数字两种常见写法）
  function parseAudioName(name) {
    var base = String(name || "").replace(/^.*[\\/]/, "")
      .replace(/\.(mp3|m4a|wav|ogg|aac|flac|mp4|webm)$/i, "");
    var ym = base.match(/(20\d{2})/);
    var year = ym ? parseInt(ym[1], 10) : null;
    var month = null;
    var mm = base.match(/(\d{1,2})\s*月/);
    if (mm) month = parseInt(mm[1], 10);
    if ((!month || month < 1 || month > 12) && ym) {
      // 「2023-06-CET4」「2021.6 cet6」「2019_06_1」等：取年份后面第一个 1–12 的数字
      var rest = base.slice(base.indexOf(ym[1]) + 4);
      var m2 = rest.match(/(?:^|[^0-9])(0?[1-9]|1[0-2])(?=[^0-9]|$)/);
      if (m2) month = parseInt(m2[1], 10);
    }
    if (month && (month < 1 || month > 12)) month = null;
    var level = null;
    if (/cet[\s_-]*4|四级|4\s*级|level\s*4/i.test(base)) level = "CET4";
    else if (/cet[\s_-]*6|六级|6\s*级|level\s*6/i.test(base)) level = "CET6";
    return { year: year, month: month, level: level };
  }

  function findTargets(p) {
    if (!p.year) return [];
    return (CET.data.listening || []).filter(function (s) {
      if (p.level && s.level !== p.level) return false;
      if (s.year !== p.year) return false;
      if (p.month && parseInt(s.session, 10) !== p.month) return false;
      return true;
    });
  }

  function onlineFor(set) {
    var lib = CET.data.listeningAudioOnline;
    return (lib && lib.matched && lib.matched[set.id]) || null;
  }

  function isLocalAudio(p) {
    return typeof p === "string" && p.indexOf("assets/audio/") === 0;
  }

  function builtinFor(set) {
    if (set.audio) return set.audio;
    var map = (CET.store.state.listening && CET.store.state.listening.builtin) || {};
    return map[set.id] || "";
  }

  function setBuiltin(setId, path) {
    CET.store.state.listening = CET.store.state.listening || {};
    CET.store.state.listening.builtin = CET.store.state.listening.builtin || {};
    if (path) CET.store.state.listening.builtin[setId] = path;
    else delete CET.store.state.listening.builtin[setId];
    CET.store.save();
  }

  function quotaMessage(err) {
    var name = err && err.name;
    var msg = String((err && err.message) || "");
    if (name === "QuotaExceededError" || (err && err.code === 22) || /quota|storage/i.test(msg)) {
      return "本地存储空间不足（QuotaExceededError），请在套题详情页移除不用的音频后重试";
    }
    return "写入本地数据库失败：" + (msg || "未知错误");
  }

  function setBatchProgress(text, tone) {
    var el = document.getElementById("batchProgress");
    if (!el) return;
    el.textContent = text;
    el.className = "tiny batch-progress" + (tone ? " " + tone : "");
  }

  function batchResultsHtml() {
    if (!batch.last) return "";
    var s = batch.last.stat;
    var rows = batch.last.results.map(function (r) {
      var txt = "";
      var cls = "";
      if (r.kind === "ok") {
        cls = "br-ok";
        txt = "已自动匹配 → " + levelName(r.target.level) + " " + r.target.year + " " +
          UI().esc(r.target.session) + " · " + UI().esc(r.target.title) +
          (r.overwrote ? "（覆盖原有音频）" : "");
      } else if (r.kind === "unmatched") {
        cls = "br-warn";
        txt = "未匹配：" + r.reason + "（见下方待匹配列表）";
      } else {
        cls = "br-bad";
        txt = "失败：" + r.reason;
      }
      return '<div class="batch-row"><span class="br-name">' + UI().esc(r.name) + "</span>" +
        '<span class="br-res ' + cls + '">' + txt + "</span></div>";
    }).join("");
    return '<div class="batch-sum">' +
      '<span class="tag success">成功 ' + s.ok + "</span>" +
      '<span class="tag accent">自动匹配 ' + s.auto + "</span>" +
      '<span class="tag">未匹配 ' + s.unmatched + "</span>" +
      '<span class="tag danger">失败 ' + s.fail + "</span>" +
      '<span class="tiny dim">共 ' + s.total + " 个文件</span></div>" +
      '<div class="batch-results">' + rows + "</div>";
  }

  function pendingOptionsHtml() {
    return '<option value="">选择套题…</option>' + (CET.data.listening || []).map(function (s) {
      return '<option value="' + s.id + '">' + levelName(s.level) + " · " + s.year + " " +
        UI().esc(s.session) + " · " + UI().esc(s.title) + "</option>";
    }).join("");
  }

  function pendingHtml() {
    if (!pendingAudio.length) return "";
    return '<div class="pending-wrap"><div class="row between wrap" style="margin-bottom:6px">' +
      '<b class="small">未匹配音频（' + pendingAudio.length + " 个）</b>" +
      '<span class="tiny dim">选择套题后点「绑定」；文件已保存在本机</span></div>' +
      pendingAudio.map(function (p) {
        return '<div class="pending-item" data-pid="' + UI().esc(p.pid) + '">' +
          '<div class="pending-main"><span class="br-name">' + UI().esc(p.name) + "</span>" +
            '<span class="tiny dim">' + fmtSize(p.size) + (p.reason ? " · " + UI().esc(p.reason) : "") + "</span></div>" +
          '<select class="pending-select" data-pending-select="' + UI().esc(p.pid) + '">' + pendingOptionsHtml() + "</select>" +
          '<button class="btn sm" type="button" data-bind="' + UI().esc(p.pid) + '">绑定</button>' +
          '<button class="res-copy" type="button" data-drop="' + UI().esc(p.pid) + '">忽略</button>' +
        "</div>";
      }).join("") + "</div>";
  }

  function builtinLibHtml() {
    var lib = CET.data.listeningAudioOnline || { matched: {}, unmatched: [], source: {}, total: 0 };
    var un = (lib.unmatched || []).filter(function (u) {
      return ui.level === "ALL" || u.level === ui.level;
    });
    var boundCount = Object.keys(lib.matched || {}).length;
    var src = lib.source || {};
    var body = un.length
      ? '<details class="fold" style="margin-top:8px"><summary>未匹配到现有套题的在线原音（' + un.length + ' 条，可单独试听）</summary>' +
        '<div class="fold-body"><div class="online-list">' + un.map(function (u) {
          return '<div class="online-item">' +
            '<div class="pending-main"><span class="br-name">' + levelName(u.level) + " " + u.year + "-" +
              (u.month < 10 ? "0" + u.month : u.month) + " 第" + u.set + "套</span>" +
              '<span class="res-url">' + UI().esc(u.url) + "</span></div>" +
            '<button class="btn sm" type="button" data-online-play="' + UI().esc(u.url) + '">试听</button>' +
            '<button class="res-copy" type="button" data-copy="' + UI().esc(u.url) + '">复制地址</button>' +
          "</div>";
        }).join("") + "</div></div></details>"
      : "";
    return '<div class="card audio-lib-card">' +
      '<div class="row between wrap" style="gap:10px">' +
        '<div><h3 style="font-size:15px">历年真题原音（在线）</h3>' +
          '<p class="tiny dim" style="margin-top:4px">音频来源：' +
            '<a href="' + UI().esc(src.site || "https://couldyyy9.github.io/cet-website/") + '" target="_blank" rel="noopener noreferrer">' + UI().esc(src.name || "Couldyyy9/cet-website 真题库") + "</a>" +
            "（" + UI().esc(src.license || "MIT（仅覆盖源代码）") + "）。" +
            "整卷录音、需联网播放；真题与音频版权归各自权利人，仅供个人学习，请勿商用或大规模传播。</p></div>" +
        '<span class="tag teal">在线原音 ' + (lib.total || 0) + " 条</span>" +
      "</div>" +
      '<div class="online-preview"><audio id="onlinePreview" controls preload="none" style="width:100%;max-width:520px"></audio>' +
        '<span class="tiny dim" id="onlinePreviewHint">点下方「试听」或套题页的播放按钮，在线播放整卷录音（需联网）。</span></div>' +
      body + "</div>";
  }

  function importOneFile(file) {
    return new Promise(function (resolve) {
      var max = (CET.audioStore && CET.audioStore.MAX_BYTES) || 30 * 1024 * 1024;
      if (file.size > max) {
        resolve({ kind: "fail", name: file.name, reason: "超过 30 MB（" + fmtSize(file.size) + "）" });
        return;
      }
      if (!CET.audioStore) {
        resolve({ kind: "fail", name: file.name, reason: "此浏览器不支持本地数据库（IndexedDB）" });
        return;
      }
      var p = parseAudioName(file.name);
      var cands = findTargets(p);
      var target = cands.length === 1 ? cands[0] : null;
      var reason = "";
      if (!target) {
        if (!p.year) reason = "文件名里没找到 4 位年份（如 2023）";
        else if (cands.length > 1) reason = "同一年月匹配到 " + cands.length + " 套，请手动选择";
        else reason = "没有匹配到 " + levelName(p.level) + " " + p.year +
          (p.month ? " 年 " + p.month + " 月" : " 年") + " 的套题";
      }
      var pid = "pending:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
      var rec = {
        id: target ? target.id : pid, name: file.name, size: file.size, duration: 0,
        blob: file, at: Date.now(), pending: !target, reason: reason
      };
      CET.audioStore.put(rec).then(function () {
        if (target) {
          var overwrote = !!(audioURLs[target.id] || audioMeta[target.id]);
          if (audioURLs[target.id]) {
            try { URL.revokeObjectURL(audioURLs[target.id]); } catch (e) { /* 忽略 */ }
          }
          audioURLs[target.id] = URL.createObjectURL(file);
          audioMeta[target.id] = { name: file.name, size: file.size, duration: 0 };
          delete blobFailed[target.id];
          resolve({ kind: "ok", name: file.name, target: target, overwrote: overwrote });
        } else {
          pendingAudio.push({
            pid: pid, name: file.name, size: file.size, blob: file,
            reason: reason, at: rec.at
          });
          resolve({ kind: "unmatched", name: file.name, reason: reason });
        }
      }, function (err) {
        resolve({ kind: "fail", name: file.name, reason: quotaMessage(err) });
      });
    });
  }

  function startBatchImport(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    if (batch.busy) { UI().toast("上一批还在导入，请稍候", "warn"); return; }
    if (!CET.audioStore) { UI().toast("此浏览器不支持本地数据库，无法批量导入", "error"); return; }
    batch.busy = true;
    var stat = { total: list.length, ok: 0, auto: 0, unmatched: 0, fail: 0 };
    var results = [];
    var i = 0;
    setBatchProgress("正在导入 0/" + list.length, "");
    function finish() {
      batch.busy = false;
      batch.last = { stat: stat, results: results };
      setBatchProgress("导入完成：成功 " + stat.ok + " / 共 " + stat.total, "ok");
      UI().toast("批量导入完成：成功 " + stat.ok + "，自动匹配 " + stat.auto +
        "，未匹配 " + stat.unmatched + "，失败 " + stat.fail, "success");
      CET.app.rerender();
    }
    function step() {
      if (i >= list.length) { finish(); return; }
      var f = list[i];
      setBatchProgress("正在导入 " + (i + 1) + "/" + list.length + "：" + f.name, "");
      importOneFile(f).then(function (r) {
        results.push(r);
        if (r.kind === "ok") { stat.ok += 1; stat.auto += 1; }
        else if (r.kind === "unmatched") { stat.ok += 1; stat.unmatched += 1; }
        else stat.fail += 1;
        i += 1;
        step();
      });
    }
    step();
  }

  function bindPendingAudio(pid, setId) {
    var item = null;
    pendingAudio.forEach(function (p) { if (p.pid === pid) item = p; });
    var set = setOf(setId);
    if (!item || !set) { UI().toast("请先选择要绑定的套题", "warn"); return; }
    if (!CET.audioStore) { UI().toast("此浏览器不支持本地数据库", "error"); return; }
    var overwrote = !!(audioURLs[setId] || audioMeta[setId]);
    CET.audioStore.put({
      id: setId, name: item.name, size: item.size, duration: 0,
      blob: item.blob, at: Date.now(), pending: false
    }).then(function () {
      return CET.audioStore.remove(pid);
    }).then(function () {
      if (audioURLs[setId]) {
        try { URL.revokeObjectURL(audioURLs[setId]); } catch (e) { /* 忽略 */ }
      }
      audioURLs[setId] = URL.createObjectURL(item.blob);
      audioMeta[setId] = { name: item.name, size: item.size, duration: 0 };
      delete blobFailed[setId];
      pendingAudio = pendingAudio.filter(function (p) { return p.pid !== pid; });
      UI().toast("已绑定到「" + set.title + "」" + (overwrote ? "，并覆盖了原有音频" : ""), "success");
      CET.app.rerender();
    }).catch(function (err) {
      UI().toast("绑定失败：" + quotaMessage(err), "error");
    });
  }

  function dropPendingAudio(pid) {
    if (!CET.audioStore) return;
    CET.audioStore.remove(pid).then(function () {
      pendingAudio = pendingAudio.filter(function (p) { return p.pid !== pid; });
      UI().toast("已忽略该音频", "warn");
      CET.app.rerender();
    }).catch(function () {
      UI().toast("移除失败，请刷新后重试", "error");
    });
  }

  function bindResourceLinks(root) {
    // 资源链接一律走浏览器原生 <a href target="_blank" rel="noopener noreferrer">，
    // 这里只清理历史遗留的 data-res 属性，绝不 preventDefault / window.open。
    root.querySelectorAll("[data-res]").forEach(function (a) {
      a.removeAttribute("data-res");
    });
  }

  function bindBatch(root) {
    var pick = root.querySelector("#batchPick");
    var input = root.querySelector("#batchFiles");
    if (pick && input) {
      pick.addEventListener("click", function () { input.click(); });
      input.addEventListener("change", function () {
        var files = input.files;
        startBatchImport(files);
        input.value = "";
      });
    }
    root.querySelectorAll("[data-bind]").forEach(function (b) {
      b.addEventListener("click", function () {
        var pid = b.getAttribute("data-bind");
        var sel = root.querySelector('[data-pending-select="' + pid + '"]');
        bindPendingAudio(pid, sel ? sel.value : "");
      });
    });
    root.querySelectorAll("[data-drop]").forEach(function (b) {
      b.addEventListener("click", function () { dropPendingAudio(b.getAttribute("data-drop")); });
    });
    root.querySelectorAll("[data-online-play]").forEach(function (b) {
      b.addEventListener("click", function () {
        var el = root.querySelector("#onlinePreview");
        var hintEl = root.querySelector("#onlinePreviewHint");
        if (!el) return;
        var url = b.getAttribute("data-online-play");
        el.src = url;
        var pr = el.play();
        if (pr && pr.catch) {
          pr.catch(function () {
            if (hintEl) {
              hintEl.textContent = "在线原音加载失败，可能网络或源站点已变更。";
              hintEl.className = "tiny br-bad";
            }
            UI().toast("在线原音加载失败，可能网络或源站点已变更", "error");
          });
        }
      });
    });
  }

  /* ---------------- 年份 → 级别 → 套次 → 题型 ---------------- */

  var YEARS = [];
  for (var y0 = 2020; y0 <= 2026; y0++) YEARS.push(y0);
  var TYPE_LIST = ["短对话", "长对话", "短文", "新闻", "讲座", "听写"];
  var examIndex = null;

  // 把「在线原音 50 条」与「有原文的 10 套」合并成统一的套次索引
  // 同级同年月套次会重复（如四级与六级都有 2020_09_1），所以唯一键带上级别
  function buildExamIndex() {
    var lib = CET.data.listeningAudioOnline || {};
    var idx = {};
    Object.keys(lib.matched || {}).forEach(function (sid) {
      var it = lib.matched[sid];
      if (!it) return;
      var uid = it.level + ":" + it.exam;
      idx[uid] = { exam: uid, item: it, setId: sid, set: setOf(sid), key: sid };
    });
    (lib.unmatched || []).forEach(function (it) {
      if (!it) return;
      var uid = it.level + ":" + it.exam;
      if (idx[uid]) return;
      idx[uid] = { exam: uid, item: it, setId: null, set: null, key: "exam:" + uid };
    });
    // 2025.12 本地原音样板优先覆盖同名在线条目
    (CET.data.listening2025 || []).forEach(function (set) {
      var uid = set.level + ":" + set.exam;
      idx[uid] = {
        exam: uid,
        item: {
          level: set.level, exam: set.exam, year: set.year, month: set.month, set: set.set,
          title: set.title, url: set.audio
        },
        setId: set.id, set: set, key: "local:" + uid, local: true
      };
    });
    return idx;
  }

  function examEntry(exam) {
    if (!examIndex) examIndex = buildExamIndex();
    return examIndex[exam] || null;
  }

  function examList() {
    if (!examIndex) examIndex = buildExamIndex();
    return Object.keys(examIndex).map(function (k) { return examIndex[k]; })
      .sort(function (a, b) {
        if (a.item.year !== b.item.year) return a.item.year - b.item.year;
        if (a.item.level !== b.item.level) return a.item.level === "CET4" ? -1 : 1;
        if (a.item.month !== b.item.month) return a.item.month - b.item.month;
        return a.item.set - b.item.set;
      });
  }

  function examLabel(item) {
    return item.year + "年" + item.month + "月 · 第" + item.set + "套";
  }

  function matchesType(entry, type) {
    if (type === "ALL") return true;
    if (!entry.set) return false;
    if (type === "听写") return !!(entry.set.cloze && entry.set.cloze.length);
    return entry.set.type === type;
  }

  function examCardHtml(entry) {
    var set = entry.set;
    var item = entry.item;
    var tags = levelTag(item.level) +
      '<span class="tag teal">' + (entry.local ? "真题原音（本地）" : "有原音") + '</span>' +
      (set && (set.lines || []).length ? '<span class="tag accent">有原文</span>' : '<span class="tag">暂无原文</span>') +
      (set ? '<span class="tag">' + UI().esc(set.type) + "</span>" : '<span class="tag">题型暂无</span>');
    var meta = set
      ? "<span>整卷原音 1 段</span><span>原文 " + (set.lines || []).length + " 句</span><span>" +
        (set.questions || []).length + " 题</span>" +
        (entry.local ? "<span>本地 mp3</span>" : "<span>听写 " + (set.cloze || []).length + " 空</span>")
      : "<span>整卷原音 1 段</span><span>题目暂无</span><span>原文暂无</span>";
    return '<div class="card flat exam-card" data-exam="' + entry.exam + '">' +
      '<div class="exam-top">' + tags + "</div>" +
      "<h3>" + UI().esc(examLabel(item)) + "</h3>" +
      '<p class="set-source">' + (set
        ? UI().esc(set.title) + " · " + UI().esc(set.source || "")
        : "暂无题目文本，仅提供整卷原音") + "</p>" +
      '<div class="set-meta">' + meta + "</div>" +
      '<div class="exam-actions">' +
        '<button class="btn sm primary" type="button" data-full="' + entry.exam + '">完整版</button>' +
        '<button class="btn sm ghost" type="button" data-intensive="' + entry.exam + '">精听版</button>' +
      "</div></div>";
  }

  function renderGrid(root) {
    var entries = examList();
    var yearEntries = entries.filter(function (e) { return e.item.year === ui.year; });
    var list = yearEntries.filter(function (e) {
      return ui.level === "ALL" || e.item.level === ui.level;
    }).filter(function (e) { return matchesType(e, ui.type); });
    var yearText = yearEntries.filter(function (e) { return !!e.set; }).length;

    var cards = list.map(examCardHtml).join("");

    var yearChips = YEARS.map(function (y) {
      var has = entries.some(function (e) { return e.item.year === y; });
      return '<button class="chip year-chip' + (ui.year === y ? " active" : "") + '" data-year="' + y +
        '" type="button" title="' + (has ? "有在线原音" : "暂无原音，可导入") + '">' + y +
        (has ? "" : '<span class="year-none">无</span>') + "</button>";
    }).join("");

    var levelChips = '<div class="filter-chips" style="margin-top:8px">' +
      ["ALL", "CET4", "CET6"].map(function (k) {
        var label = { ALL: "全部级别", CET4: "四级 CET-4", CET6: "六级 CET-6" }[k];
        return '<button class="chip' + (ui.level === k ? " active" : "") + '" data-lv="' + k + '" type="button">' +
          label + "</button>";
      }).join("") +
      '<span class="spacer"></span><span class="tiny dim">共 ' + list.length + " / " + entries.length + " 套</span></div>";

    var typeChips = '<div class="filter-chips" style="margin-top:8px">' +
      ["ALL"].concat(TYPE_LIST).map(function (t) {
        return '<button class="chip' + (ui.type === t ? " active" : "") + '" data-type="' + t + '" type="button">' +
          (t === "ALL" ? "全部题型" : t) + "</button>";
      }).join("") +
      '<span class="spacer"></span><span class="tiny dim">题型筛选只对有原文的套题生效</span></div>';

    var sumText = "年份可选 2020–2026；";
    if (yearEntries.length) {
      sumText += ui.year + " 年：在线原音 " + yearEntries.length + " 套 · 有原文 " + yearText + " 套 · 当前显示 " + list.length + " 套";
    } else {
      sumText += ui.year + " 年：暂无真题，可导入";
    }

    var emptyHtml = "";
    if (!yearEntries.length) {
      emptyHtml = '<div class="card placeholder-card">' +
        '<div class="exam-top"><span class="tag">' + ui.year + ' 年</span><span class="tag">暂无真题，可导入</span></div>' +
        "<h3>" + ui.year + " 年暂无真题</h3>" +
        '<p class="muted">在线真题原音已收录 2020–2025 年，2026 年暂未收录。可以粘贴自己的音频直链，或批量导入本地 mp3 / m4a / wav；导入后在对应套题页选择来源。</p>' +
        '<div class="exam-actions"><button class="btn sm primary" type="button" id="goImport">去导入 / 粘贴直链</button></div>' +
      "</div>";
    } else if (!list.length) {
      emptyHtml = '<div class="card placeholder-card">' +
        '<div class="exam-top"><span class="tag">' + ui.year + ' 年</span><span class="tag">当前筛选无结果</span></div>' +
        "<h3>该筛选下没有套题</h3>" +
        '<p class="muted">切换级别或题型试试。无原文的套题只提供整卷原音，不参与题型筛选；选「全部题型」可以看到它们。</p>' +
      "</div>";
    }

    var res = CET.data.listeningResources || { papers: [], channels: [] };
    var papers = (res.papers || []).filter(function (p) {
      return ui.level === "ALL" || p.level === ui.level;
    });
    var hub = (res.channels || [])[ui.level === "CET6" ? 1 : 0] || (res.channels || [])[0] || null;
    var okCount = papers.filter(function (p) { return p.status !== "expired"; }).length;
    var resHtml = '<div class="card res-section" id="resFold">' +
      '<div class="row between wrap res-head">' +
        '<div><h3>历年真题原音资源</h3>' +
          '<p class="tiny dim res-tip">点整张卡片、或「打开链接」都会通过浏览器原生链接在新标签直达原平台（不经过任何 JS 拦截）。若浏览器拦截了新标签，可点「复制地址」后把完整地址粘贴到浏览器地址栏。「当前页打开」会覆盖本页，用浏览器「后退」即可返回。</p>' +
        "</div>" +
        '<div class="res-head-actions">' +
          (hub ? '<a class="res-big-open" data-res href="' + UI().esc(hub.url) + '" target="_blank" rel="noopener noreferrer">打开链接 ↗</a>' +
            '<button class="res-copy" type="button" data-copy="' + UI().esc(hub.url) + '">复制入口地址</button>' : "") +
          '<span class="tag">' + okCount + " / " + papers.length + " 可用</span>" +
        "</div>" +
      "</div>" +
      '<p class="res-open-hint tiny" id="resOpenHint">已逐条核验（' + (res.verifiedAt || "2026-11-05") + '）：以上链接均可访问，点击即由浏览器在新标签打开；若被拦截，用「复制地址」粘贴到地址栏。</p>' +
      '<div class="res-list">' + papers.map(function (p) {
        var expired = p.status === "expired";
        return '<div class="res-card">' +
          '<a class="res-item" data-res href="' + UI().esc(p.url) + '" target="_blank" rel="noopener noreferrer" aria-label="打开 ' + UI().esc(p.year + " " + p.session + " " + p.set) + '">' +
            '<div class="res-hit">' +
              '<span class="res-year">' + p.year + " " + UI().esc(p.session) + "</span>" +
              '<span class="res-name">' + UI().esc(p.set) + " · " + UI().esc(p.type) + "</span>" +
              '<span class="tag ' + (p.level === "CET4" ? "accent" : "teal") + '">' +
                (p.level === "CET4" ? "四级" : "六级") + "</span>" +
              '<span class="res-status ' + (expired ? "bad" : "ok") + '">' + (expired ? "已失效" : "可用") + "</span>" +
              '<span class="res-open">打开 →</span>' +
            "</div>" +
            '<div class="res-foot"><span class="res-url">' + UI().esc(p.url) + "</span></div>" +
          "</a>" +
          (p.note ? '<p class="tiny dim res-note">' + UI().esc(p.note) + "</p>" : "") +
          '<div class="res-actions">' +
            '<a class="res-open-btn" data-res href="' + UI().esc(p.url) + '" target="_blank" rel="noopener noreferrer">打开链接</a>' +
            '<a class="res-open-btn res-self" href="' + UI().esc(p.url) + '" target="_self" rel="noopener" title="将在当前页打开，用浏览器「后退」返回本站">当前页打开</a>' +
            '<button class="res-copy" type="button" data-copy="' + UI().esc(p.url) + '">复制地址</button>' +
          "</div>" +
        "</div>";
      }).join("") + "</div>" +
      '<div class="res-channels">' + (res.channels || []).map(function (c) {
        return '<div class="res-channel">' +
          '<a class="res-channel-hit" data-res href="' + UI().esc(c.url) + '" target="_blank" rel="noopener noreferrer">' +
            "<b>" + UI().esc(c.name) + "</b><span>" + UI().esc(c.desc) + "</span>" +
            '<span class="res-url">' + UI().esc(c.url) + "</span>" +
          "</a>" +
          '<div class="res-actions">' +
            '<a class="res-open-btn" data-res href="' + UI().esc(c.url) + '" target="_blank" rel="noopener noreferrer">打开链接</a>' +
            '<a class="res-open-btn res-self" href="' + UI().esc(c.url) + '" target="_self" rel="noopener">当前页打开</a>' +
            '<button class="res-copy" type="button" data-copy="' + UI().esc(c.url) + '">复制地址</button>' +
          "</div>" +
        "</div>";
      }).join("") + "</div>" +
      '<p class="tiny dim" style="margin-top:10px">真题与录音版权归原平台所有，本站只提供直达链接，不转存官方音频。</p>' +
    "</div>";

    var batchHtml = '<div class="card batch-card" id="batchCard">' +
      '<div class="row between wrap" style="gap:10px">' +
        '<div><h3 style="font-size:15px">批量导入音频</h3>' +
          '<p class="tiny dim">一次选择多个 mp3 / m4a / wav（任意音频），按文件名自动匹配年份 + 月份 + 级别。' +
          "例：2023年6月四级.mp3、2023-06-CET4.mp3、2021.6 cet6。文件只保存在本机，不会上传。</p></div>" +
        '<span class="tag teal">本机处理</span>' +
      "</div>" +
      '<div class="batch-actions">' +
        '<button class="btn sm primary" id="batchPick" type="button">选择多个音频</button>' +
        '<input type="file" id="batchFiles" accept="audio/*,.mp3,.m4a,.wav,.ogg" multiple hidden />' +
        '<span class="tiny batch-progress" id="batchProgress">' + (batch.busy ? "正在导入…" : "支持 mp3 / m4a / wav，单个不超过 30 MB") + "</span>" +
      "</div>" +
      batchResultsHtml() + pendingHtml() +
    "</div>";

    var sourceNote = '<div class="source-line">音频来源：' +
      '<a href="https://couldyyy9.github.io/cet-website/" target="_blank" rel="noopener noreferrer">Couldyyy9/cet-website 真题库</a>' +
      "（MIT 许可仅覆盖源代码；真题与音频版权归各自权利人，仅供个人学习，请勿商用或大规模传播）· 在线原音需联网，2025.12 四套为本地原音</div>";

    root.innerHTML = '<div class="view-enter">' + sourceNote +
      '<div class="card" style="margin-bottom:16px">' +
        '<div class="row between wrap" style="gap:10px;margin-bottom:10px">' +
          '<div><h3 style="font-size:15px">听力真题 · 按年份</h3>' +
          '<p class="tiny dim">先选年份，再选级别与套次；每套提供「完整版」与「精听版」两个入口。</p></div>' +
          '<span class="tag teal">在线原音 ' + ((CET.data.listeningAudioOnline || {}).total || 0) + " 套 · 本地原音 " + (CET.data.listening2025 || []).length + " 套</span>" +
        "</div>" +
        '<div class="filter-chips" id="yearChips">' + yearChips + "</div>" +
        levelChips + typeChips +
        '<p class="tiny dim grid-sum">' + UI().esc(sumText) + "</p>" +
        '<p class="tiny dim" style="margin-top:6px;line-height:1.6">2025年12月 四级/六级第1、2套已接入<b>本地真题原音</b>（离线可播），题库未提供听力原文，精听为「跟听 + 自评」。其余套题：50 套在线原音中有 10 套带整理文本，可逐句精听 + 听写判分。</p>' +
      "</div>" +
      '<div class="grid grid-auto" style="margin-top:16px">' + (emptyHtml || cards) + "</div>" +
      '<details class="fold" id="toolsFold"' + (batch.last || pendingAudio.length ? " open" : "") + ">" +
        "<summary>批量导入与本地音频库（可选，不影响上面的练习）</summary>" +
        '<div class="fold-body tools-body">' +
          '<p class="tiny dim" style="margin:0">批量导入会按文件名自动匹配到有原文的 10 套；其他套题请在套题页粘贴直链或导入。下面「历年真题原音资源」为外部平台链接，点击由浏览器在新标签打开。</p>' +
          batchHtml + builtinLibHtml() +
        "</div></details>" +
        resHtml +
    "</div>";

    root.querySelectorAll("[data-year]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.year = parseInt(b.getAttribute("data-year"), 10);
        CET.app.rerender();
      });
    });

    root.querySelectorAll("[data-lv]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.level = b.getAttribute("data-lv");
        CET.app.rerender();
      });
    });

    root.querySelectorAll("[data-type]").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.type = b.getAttribute("data-type");
        CET.app.rerender();
      });
    });

    function openExam(exam, mode) {
      var entry = examEntry(exam);
      if (!entry) return;
      stopAll();
      ui.exam = exam;
      ui.mode = mode;
      ui.setId = entry.setId || null;
      player.idx = -1;
      player.playing = false;
      player.auto = true;
      player.loop = mode === "intensive";
      loopLine = -1;
      passLoop = -1;
      draft = {};
      revealed = false;
      CET.app.rerender();
    }

    root.querySelectorAll("[data-full]").forEach(function (b) {
      b.addEventListener("click", function () { openExam(b.getAttribute("data-full"), "full"); });
    });

    root.querySelectorAll("[data-intensive]").forEach(function (b) {
      b.addEventListener("click", function () { openExam(b.getAttribute("data-intensive"), "intensive"); });
    });

    var goImport = root.querySelector("#goImport");
    if (goImport) {
      goImport.addEventListener("click", function () {
        var fold = root.querySelector("#toolsFold");
        if (!fold) return;
        fold.open = true;
        if (fold.scrollIntoView) {
          try { fold.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) { /* 忽略 */ }
        }
      });
    }

    bindCopyButtons(root);
    bindResourceLinks(root);
    bindBatch(root);
  }

  // 只给「复制链接」按钮绑事件，绝不拦截资源链接的默认跳转
  function bindCopyButtons(root) {
    root.querySelectorAll("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        copyText(b.getAttribute("data-copy") || "", b);
      });
    });
  }

  /* ---------------- 详情页 ---------------- */

  function answerCounts(set) {
    var s = CET.store.state;
    var answered = 0, right = 0;
    (set.questions || []).forEach(function (_, qi) {
      var r = s.listening.answers[set.id + "-q" + qi];
      if (r) { answered += 1; if (r.ok) right += 1; }
    });
    return { answered: answered, right: right };
  }

  function submitAnswers(set) {
    var s = CET.store.state;
    var picked = 0, correctNow = 0;
    (set.questions || []).forEach(function (q, qi) {
      var key = set.id + "-q" + qi;
      if (s.listening.answers[key]) return;
      var sel = draft[qi];
      if (typeof sel !== "number") return;
      picked += 1;
      var ok = sel === q.answer;
      s.listening.answers[key] = { sel: sel, ok: ok };
      if (ok) {
        correctNow += 1;
        CET.store.addPoints(6, "listening", "听力答题 · " + set.title);
      }
    });
    if (!picked) {
      UI().toast("先点选答案，再提交", "warn");
      return;
    }
    var c = answerCounts(set);
    if (c.answered >= (set.questions || []).length && s.listening.setsDone.indexOf(set.id) === -1) {
      s.listening.setsDone.push(set.id);
      CET.store.addPoints(10, "listening", "完成听力套题 · " + set.title);
      UI().toast("本套已完成，额外 +10 分", "success", correctNow * 6 + 10);
    } else {
      UI().toast("已提交，本次 " + correctNow + " 题正确", correctNow ? "success" : "error", correctNow * 6);
    }
    CET.store.save();
    draft = {};
    stopAll();
    CET.app.rerender();
    CET.app.refreshChrome();
  }

  function renderDetail(root, set) {
    var s = CET.store.state;
    var counts = answerCounts(set);
    var letters = ["A", "B", "C", "D"];
    var total = (set.questions || []).length;

    /* 播放来源优先级：音频直链 > 在线真题原音 > 本地导入 > 内置音频 > 语音合成 */
    var link = getLink(set);
    var blobUrl = audioURLs[set.id] || "";
    var online = onlineFor(set);
    var builtin = builtinFor(set);
    var linkBlocked = !!linkFailed[set.id];
    var blobBlocked = !!blobFailed[set.id];
    var onlineBlocked = !!linkFailed["online:" + set.id];
    var builtinBlocked = !!linkFailed["builtin:" + set.id];
    var mode = "tts";
    var audioSrc = "";
    var srcLabel = "语音合成";
    if (link && !linkBlocked) { mode = "link"; srcLabel = "原音链接"; audioSrc = link; }
    else if (online && !onlineBlocked) { mode = "online"; srcLabel = "在线真题原音"; audioSrc = online.url; }
    else if (blobUrl && !blobBlocked) { mode = "blob"; srcLabel = "本地导入"; audioSrc = blobUrl; }
    else if (builtin && !builtinBlocked) {
      mode = "builtin";
      srcLabel = isLocalAudio(builtin) ? "真题原音（本地）" : "内置原音";
      audioSrc = builtin;
    }
    sourceMode = mode;
    var isOrig = mode !== "tts";

    var meta = audioMeta[set.id] || null;
    var badge = '<span class="src-badge ' + mode + '" id="srcBadge">当前来源：' + srcLabel + "</span>";
    var srcDetail = mode === "link"
      ? "站外直链：" + link
      : mode === "online"
        ? "在线原音：" + online.url + "（需联网，来自 Couldyyy9/cet-website）"
        : mode === "blob"
          ? "本地文件：" + (meta && meta.name ? meta.name : "已导入") +
            (meta && meta.size ? " · " + fmtSize(meta.size) : "") +
            (meta && meta.duration ? " · " + fmtTime(meta.duration) : "")
          : mode === "builtin"
            ? "内置原音：" + builtin
            : "浏览器语音合成（英音 en-GB 优先，非官方原音）";

    var hint0, hintTone = "";
    if (linkBlocked && !online && !blobUrl && !builtin) {
      hintTone = "bad";
      hint0 = "该地址不允许站外播放（跨域或 403），请下载音频后点「导入本地音频」；当前已回退到语音合成。";
    } else if (linkBlocked) {
      hintTone = "bad";
      hint0 = "该地址不允许站外播放（跨域或 403），请下载音频后点「导入本地音频」；已回退到" +
        (online && !onlineBlocked ? "在线真题原音。" : blobUrl && !blobBlocked ? "本地导入的音频。"
          : builtin ? "内置原音。" : "语音合成。");
    } else if (onlineBlocked) {
      hintTone = "bad";
      hint0 = "在线原音加载失败，可能网络或源站点已变更；已回退到" +
        (blobUrl && !blobBlocked ? "本地导入。" : builtin ? "内置原音。" : "语音合成。") + "（在线原音需联网）";
    } else if (blobBlocked && builtin) {
      hintTone = "bad";
      hint0 = "本地导入的音频无法播放（格式不受支持），已回退到内置原音。";
    } else if (blobBlocked) {
      hintTone = "bad";
      hint0 = "本地导入的音频无法播放（格式不受支持），已回退到语音合成。";
    } else if (builtinBlocked) {
      hintTone = "bad";
      hint0 = "内置音频文件无法播放（可能缺失或格式不受支持），已回退到语音合成。";
    } else if (isOrig) {
      hint0 = mode === "online"
        ? "在线播放整卷真题录音（需联网，暂停/进度可用）；整卷无法逐句切分，逐句按钮已置灰，题目照常作答。"
        : "点圆形按钮播放整段原音；整段音频无法逐句切分，逐句按钮已置灰，题目照常可作答。";
    } else {
      hint0 = "点圆形按钮开始；若没有声音，这里会明确提示原因。";
    }

    var importStatus = meta && blobUrl
      ? "已导入：" + (meta.name || "本地音频") +
        (meta.size ? " · " + fmtSize(meta.size) : "") + "（保存在本机，刷新后自动恢复）"
      : "尚未导入本地音频。";

    var questionsHtml = (set.questions || []).map(function (q, qi) {
      var prev = s.listening.answers[set.id + "-q" + qi];
      var showAns = !!prev || revealed;
      var sel = prev ? prev.sel : draft[qi];
      var opts = (q.options || []).map(function (o, oi) {
        var cls = "option";
        var mark = "";
        if (prev) {
          if (oi === q.answer) { cls += " correct"; mark = '<span class="mark ok">正确答案</span>'; }
          else if (oi === prev.sel) { cls += " wrong"; mark = '<span class="mark no">你的选择</span>'; }
        } else if (revealed) {
          if (oi === q.answer) { cls += " correct"; mark = '<span class="mark ok">正确答案</span>'; }
        } else if (oi === sel) {
          cls += " selected";
        }
        return '<button class="' + cls + '" type="button" data-q="' + qi + '" data-opt="' + oi + '"' +
          (showAns ? " disabled" : "") +
          ' aria-pressed="' + (oi === sel ? "true" : "false") + '">' +
          '<span class="letter">' + letters[oi] + "</span>" +
          '<span class="opt-text">' + UI().esc(o) + "</span>" + mark +
        "</button>";
      }).join("");

      var exp = "";
      if (prev) {
        exp = '<div class="explain ' + (prev.ok ? "ok" : "bad") + '">' +
          '<div class="verdict ' + (prev.ok ? "ok" : "bad") + '">' +
            (prev.ok ? "✓ 回答正确" : "✗ 回答错误") +
            "　正确答案：" + letters[q.answer] + "</div>" +
          UI().esc(q.explain || "—") + "</div>";
      } else if (revealed) {
        exp = '<div class="explain">' +
          '<div class="verdict">正确答案：' + letters[q.answer] + "</div>" +
          UI().esc(q.explain || "—") + "</div>";
      }

      var groupHead = "";
      if (qi === 0 || (q.group || "") !== (set.questions[qi - 1].group || "")) {
        groupHead = '<div class="q-group"><span class="tag">' + UI().esc(q.section || "听力") + "</span>" +
          '<span class="tiny dim">' + UI().esc(q.group || "") + "</span></div>";
      }

      return groupHead + '<div class="q-card" data-qcard="' + qi + '">' +
        '<div class="q-head"><span class="tag accent">Q' + (qi + 1) + "</span>" +
          '<p class="q-stem">' + UI().esc(q.q || "（题干缺失）") + "</p></div>" +
        '<div class="options">' + opts + "</div>" + exp +
      "</div>";
    }).join("");

    var linesHtml = (set.lines || []).map(function (line, i) {
      var title = isOrig ? "原音是整段音频，无法逐句切分" : "播放本句";
      return '<div class="line' + (isOrig ? " disabled" : "") + '" data-line="' + i + '" role="button" tabindex="' +
        (isOrig ? "-1" : "0") + '" title="' + title + '">' +
        '<span class="sp">' + UI().esc(line.sp) + "</span>" +
        '<span class="txt">' + UI().esc(line.en) + '<span class="cn">' + UI().esc(line.cn) + "</span></span>" +
        '<button class="play-mini" data-line-play="' + i + '" type="button" title="' + title + '"' +
          (isOrig ? " disabled" : "") + ">" + SPEAK_SM + "</button>" +
      "</div>";
    }).join("");

    var audioEl = isOrig
      ? '<audio id="origAudio" controls preload="metadata" playsinline src="' + UI().esc(audioSrc) +
        '" style="width:100%;margin-top:12px"></audio>'
      : "";

    var scriptHtml = (set.lines || []).length
      ? '<details class="fold" id="scriptFold">' +
          '<summary>原文（' + set.lines.length + ' 句，点击展开）</summary>' +
          '<div class="fold-body"><div class="transcript" id="transcript">' + linesHtml + "</div>" +
          '<p class="tiny dim" style="padding:0 6px 4px">' +
            (isOrig ? "当前使用整段原音，逐句按钮不可用；可拖动音频进度条定位。" : "点任意句子可单句重听。") +
          "</p>" +
          (set.transcriptNote
            ? '<p class="tiny dim" style="padding:0 6px 8px">' + UI().esc(set.transcriptNote) + "</p>"
            : "") +
          "</div>" +
        "</details>"
      : '<div class="card" style="margin-top:16px">' +
          '<h3 style="font-size:15px">听力原文</h3>' +
          '<p class="tiny dim" style="margin-top:4px">题库（Couldyyy9/cet-website）未提供本套听力原文与中文译文；本地解析 PDF 为扫描件，本版未内置逐字稿。可在「精听版」跟听并自评。</p>' +
        "</div>";

    root.innerHTML = '<div class="view-enter">' +
      '<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">' +
        '<button class="btn sm ghost" id="backSets" type="button">← 返回年份列表</button>' +
        '<div class="spacer"></div>' + levelTag(set.level) +
        '<span class="tag accent">完整版</span>' +
        '<span class="tag">' + UI().esc(set.type) + "</span>" +
        (online || (set && set.audio) ? '<button class="btn sm" id="toIntensive" type="button">精听版 →</button>' : "") +
      "</div>" +

      '<div class="card">' +
        '<div class="row between wrap" style="gap:10px;margin-bottom:6px">' +
          '<h2 class="listen-title">' + UI().esc(set.title) + "</h2>" +
          '<span class="tag ' + (counts.answered >= total && total ? "success" : "") + '">' +
            "答对 " + counts.right + " / " + total + "</span>" +
        "</div>" +
        '<p class="set-source">' + (online ? UI().esc(examLabel(online)) + " · " : "") +
          UI().esc(set.source || "历年真题整理") + "</p>" +
        '<p class="muted small listen-intro">' + UI().esc(set.intro) + "</p>" +

        '<div class="player">' +
          '<div class="row between wrap" style="gap:8px;margin-bottom:10px">' +
            badge + '<span class="tiny dim listen-src-detail">' + UI().esc(srcDetail) + "</span>" +
          "</div>" +
          '<div class="player-top">' +
            '<button class="player-big" id="playBig" type="button" aria-label="播放">' +
              (player.playing ? PAUSE_ICO : PLAY_ICO) + "</button>" +
            '<div class="player-info"><strong id="playerState">' +
              (player.playing ? (isOrig ? "原音播放中" : "播放中") : player.idx >= 0 ? "已暂停" : isOrig ? "播放原音" : "播放全文") + "</strong>" +
              '<span id="playerStatus">' +
                (player.idx >= 0 ? "第 " + (player.idx + 1) + " / " + (set.lines || []).length + " 句" : "未开始") +
              "</span></div>" +
            '<div class="spacer"></div>' +
            '<div class="rate-slider"><span>语速 <b id="rateVal">' + player.rate.toFixed(2) + "x</b></span>" +
              '<input type="range" id="rateRange" min="60" max="130" step="5" value="' +
                Math.round(player.rate * 100) + '" aria-label="语速" /></div>' +
          "</div>" +
          '<div class="row wrap" style="gap:8px">' +
            '<button class="btn sm ghost" id="prevLine" type="button"' + (isOrig ? " disabled" : "") + ">上一句</button>" +
            '<button class="btn sm ghost" id="nextLine" type="button"' + (isOrig ? " disabled" : "") + ">下一句</button>" +
            '<button class="chip' + (player.auto ? " active" : "") + '" id="autoBtn" type="button"' + (isOrig ? " disabled" : "") + ">连续播放</button>" +
          "</div>" +
          '<div class="bar thin" style="margin-top:12px"><i id="lineBar" style="width:0%"></i></div>' +
          '<p class="play-hint' + (hintTone ? " " + hintTone : "") + '" id="playHint">' + UI().esc(hint0) + "</p>" +
          audioEl +
        "</div>" +
      "</div>" +

      '<div class="card" style="margin-top:16px">' +
        '<div class="row between wrap" style="gap:8px;margin-bottom:4px">' +
          '<h3 style="font-size:15px">题目与选项</h3>' +
          '<span class="tiny dim">每题 6 分 · 提交后显示对错与解析</span>' +
        "</div>" +
        questionsHtml +
        '<div class="quiz-actions">' +
          '<button class="btn primary" id="submitAnswers" type="button"' +
            (counts.answered >= total || revealed ? " disabled" : "") + ">提交答案</button>" +
          '<button class="btn ghost" id="revealAnswers" type="button"' +
            (revealed ? " disabled" : "") + ">查看答案</button>" +
          '<span class="tiny dim" id="quizHint">' +
            (revealed ? "已显示答案，本套不再计分" : "选好每题后点提交") + "</span>" +
        "</div>" +
      "</div>" +

      scriptHtml +

      '<details class="fold" id="audioFold">' +
        "<summary>音频来源：直链 / 本地导入（可选）</summary>" +
        '<div class="fold-body">' +
          '<div class="audio-note"><span>i</span><div>' +
            (isLocalAudio(set.audio)
              ? "本套使用<b>本地真题原音</b>（assets/audio，离线可播），无需联网。也可粘贴自己的音频直链或导入本地 mp3 覆盖。"
              : "未内置官方音频。可粘贴自己的音频 http(s) 直链（保存后刷新保留），也可导入本地 mp3/m4a/wav（保存在本机 IndexedDB，刷新自动恢复）。都没有时使用浏览器语音合成。") +
          "</div></div>" +

          '<div class="audio-block">' +
            '<div class="audio-block-head"><b>音频直链</b><span class="tiny dim">优先级最高</span></div>' +
            '<div class="link-form">' +
              '<input type="url" id="linkInput" placeholder="https://example.com/lesson.mp3" value="' +
                UI().esc(link) + '" aria-label="音频直链" />' +
              '<button class="btn sm primary" id="saveLink" type="button">保存直链</button>' +
              '<button class="btn sm ghost" id="clearLink" type="button"' + (link ? "" : " disabled") + ">移除直链</button>" +
            "</div>" +
            (link
              ? '<div class="res-foot"><span class="res-url">' + UI().esc(link) + "</span>" +
                '<button class="res-copy" type="button" data-copy="' + UI().esc(link) + '">复制链接</button></div>' +
                (linkBlocked ? '<p class="tiny" style="color:var(--danger);margin:6px 0 0">该直链已被判定不可播放，当前已回退。</p>' : "")
              : '<p class="tiny dim" style="margin:6px 0 0">只支持 http(s) 的音频文件地址（mp3 / m4a / wav 等）。</p>') +
          "</div>" +

          '<div class="audio-block">' +
            '<div class="audio-block-head"><b>本地导入</b><span class="tiny dim">' + importStatus + "</span></div>" +
            '<div class="import-row">' +
              '<button class="btn sm" id="importAudio" type="button">导入本地音频</button>' +
              '<button class="btn sm ghost" id="clearAudio" type="button"' +
                (blobUrl ? "" : " disabled") + ">移除导入</button>" +
              '<span class="tiny dim">支持 mp3 / m4a / wav，单个不超过 30 MB</span>' +
              '<input type="file" id="audioFile" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden />' +
            "</div>" +
            (blobBlocked ? '<p class="tiny" style="color:var(--danger);margin:6px 0 0">这个本地文件无法播放，建议换一个 mp3 再导入。</p>' : "") +
          "</div>" +
        "</div></details>" +
    "</div>";

    bindCopyButtons(root);

    /* 返回年份列表 */
    root.querySelector("#backSets").addEventListener("click", function () {
      stopAll();
      ui.setId = null;
      ui.exam = null;
      ui.mode = null;
      draft = {};
      revealed = false;
      CET.app.rerender();
    });

    var toInt = root.querySelector("#toIntensive");
    if (toInt) {
      toInt.addEventListener("click", function () {
        stopAll();
        ui.mode = "intensive";
        player.idx = -1;
        player.playing = false;
        player.auto = true;
        player.loop = true;
        draft = {};
        revealed = false;
        CET.app.rerender();
      });
    }

    /* 原音播放失败：明确提示并回退 */
    function origFail(reason) {
      var msg;
      if (mode === "link") {
        linkFailed[set.id] = true;
        msg = "该地址不允许站外播放（跨域被拒或不是音频文件），请下载后用「导入本地音频」；已回退到" +
          (online && !onlineBlocked ? "在线真题原音。" : blobUrl && !blobBlocked ? "本地导入。"
            : builtin ? "内置原音。" : "语音合成。");
      } else if (mode === "online") {
        linkFailed["online:" + set.id] = true;
        msg = "在线原音加载失败，可能网络或源站点已变更；已回退到" +
          (blobUrl && !blobBlocked ? "本地导入。" : builtin ? "内置原音。" : "语音合成。");
      } else if (mode === "blob") {
        blobFailed[set.id] = true;
        msg = "本地音频无法播放（" + (reason || "格式不受支持") + "），已回退到" +
          (builtin ? "内置原音。" : "语音合成。");
      } else {
        linkFailed["builtin:" + set.id] = true;
        msg = "内置原音无法播放（" + (reason || "文件缺失或格式不受支持") + "），已回退到语音合成。";
      }
      stopAll();
      setHint(msg, "bad");
      UI().toast(msg, "error");
      CET.app.rerender();
    }

    var origEl = root.querySelector("#origAudio");
    if (origEl) {
      origEl.addEventListener("play", function () {
        player.playing = true;
        updatePlayBtn();
        setHint(mode === "link" ? "正在播放站外直链原音…"
          : mode === "online" ? "正在播放在线真题原音（需联网）…"
          : mode === "blob" ? "正在播放本地导入音频…" : "正在播放内置原音…", "ok");
      });
      origEl.addEventListener("pause", function () {
        if (origEl.ended) return;
        player.playing = false;
        updatePlayBtn();
      });
      origEl.addEventListener("ended", function () {
        player.playing = false;
        updatePlayBtn();
        setHint("原音播放完毕", "ok");
      });
      origEl.addEventListener("error", function () {
        origFail("链接失效或格式不支持");
      });
    }

    function playOriginal() {
      if (!origEl) return;
      UI().stopSpeak();
      origEl.playbackRate = Math.max(0.6, Math.min(1.3, player.rate));
      var p = origEl.play();
      if (p && p.then) {
        p.then(function () {
          player.playing = true;
          updatePlayBtn();
        }).catch(function (err) {
          var name = err && err.name;
          if (name === "NotAllowedError") {
            player.playing = false;
            updatePlayBtn();
            setHint("浏览器拦截了播放，请再点一次圆形播放按钮", "bad");
            UI().toast("浏览器拦截了播放，请再点一次播放按钮", "warn");
            return;
          }
          if (name === "AbortError") return;
          origFail(name === "NotSupportedError" ? "格式不受支持" : "播放失败");
        });
      }
    }

    /* 播放控制 */
    root.querySelector("#playBig").addEventListener("click", function () {
      if (player.playing) {
        if (isOrig && origEl) {
          origEl.pause();
          player.playing = false;
          updatePlayBtn();
          setHint("已暂停，再点播放继续", "");
        } else {
          pausePlay();
        }
        return;
      }
      if (isOrig) playOriginal();
      else playLine(player.idx >= 0 ? player.idx : 0);
    });

    root.querySelector("#prevLine").addEventListener("click", function () {
      if (isOrig) { setHint("当前是整段原音，不能逐句切换；请拖动音频进度条", "warn"); return; }
      var i = player.idx < 0 ? 0 : player.idx - 1;
      playLine(i < 0 ? 0 : i);
    });

    root.querySelector("#nextLine").addEventListener("click", function () {
      if (isOrig) { setHint("当前是整段原音，不能逐句切换；请拖动音频进度条", "warn"); return; }
      var i = player.idx < 0 ? 0 : player.idx + 1;
      var last = (set.lines || []).length - 1;
      playLine(i > last ? last : i);
    });

    root.querySelector("#autoBtn").addEventListener("click", function () {
      if (isOrig) { setHint("整段原音不支持连续逐句播放", "warn"); return; }
      player.auto = !player.auto;
      root.querySelector("#autoBtn").classList.toggle("active", player.auto);
      setHint(player.auto ? "连续播放已开启" : "连续播放已关闭，只读当前句", "");
    });

    root.querySelector("#rateRange").addEventListener("input", function (e) {
      player.rate = parseInt(e.target.value, 10) / 100;
      var val = root.querySelector("#rateVal");
      if (val) val.textContent = player.rate.toFixed(2) + "x";
      if (origEl) origEl.playbackRate = Math.max(0.6, Math.min(1.3, player.rate));
      setHint("语速已调为 " + player.rate.toFixed(2) + "x" + (isOrig ? "，已应用到原音" : "，下一句生效"), "");
    });

    /* 原文单句播放 */
    function playFromNode(el) {
      if (isOrig) {
        setHint("当前是整段原音，逐句按钮已置灰；可用上方音频进度条定位", "warn");
        return;
      }
      var i = parseInt(el.getAttribute("data-line") || el.getAttribute("data-line-play"), 10);
      if (isNaN(i)) return;
      playLine(i);
    }
    root.querySelectorAll("[data-line]").forEach(function (el) {
      el.addEventListener("click", function () { playFromNode(el); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playFromNode(el); }
      });
    });
    root.querySelectorAll("[data-line-play]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (b.disabled) return;
        playFromNode(b);
      });
    });

    /* 选项选择 */
    root.querySelectorAll("[data-opt]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled || revealed) return;
        var qi = parseInt(b.getAttribute("data-q"), 10);
        var oi = parseInt(b.getAttribute("data-opt"), 10);
        if (s.listening.answers[set.id + "-q" + qi]) return;
        draft[qi] = oi;
        var card = root.querySelector('[data-qcard="' + qi + '"]');
        if (card) {
          card.querySelectorAll(".option").forEach(function (o) {
            var on = parseInt(o.getAttribute("data-opt"), 10) === oi;
            o.classList.toggle("selected", on);
            o.setAttribute("aria-pressed", on ? "true" : "false");
          });
        }
      });
    });

    root.querySelector("#submitAnswers").addEventListener("click", function () {
      submitAnswers(set);
    });

    root.querySelector("#revealAnswers").addEventListener("click", function () {
      revealed = true;
      stopAll();
      CET.app.rerender();
      UI().toast("已显示答案与解析，本套不计分", "warn");
    });

    /* 音频直链保存 / 移除 */
    var linkInput = root.querySelector("#linkInput");
    root.querySelector("#saveLink").addEventListener("click", function () {
      var raw = (linkInput && linkInput.value ? linkInput.value : "").trim();
      if (!raw) { UI().toast("请先粘贴音频 http(s) 直链", "warn"); return; }
      if (!/^https?:\/\//i.test(raw)) { UI().toast("只支持 http(s) 开头、指向音频文件的直链", "warn"); return; }
      if (!/\.(mp3|m4a|wav|ogg|aac|flac|mp4|webm)(\?|#|$)/i.test(raw)) {
        UI().toast("这个地址看起来不是音频文件，仍可保存，但可能无法播放", "warn");
      }
      setLink(set, raw);
      delete linkFailed[set.id];
      stopAll();
      CET.app.rerender();
      UI().toast("已保存音频直链，刷新后仍保留", "success");
    });

    root.querySelector("#clearLink").addEventListener("click", function () {
      setLink(set, "");
      delete linkFailed[set.id];
      stopAll();
      CET.app.rerender();
      UI().toast("已移除音频直链", "warn");
    });

    /* 本地音频导入：存 IndexedDB，刷新可恢复 */
    var fileInput = root.querySelector("#audioFile");
    root.querySelector("#importAudio").addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var max = (CET.audioStore && CET.audioStore.MAX_BYTES) || 30 * 1024 * 1024;
      if (file.size > max) {
        UI().toast("文件过大（" + fmtSize(file.size) + "），请选择 30 MB 以内的音频", "error");
        fileInput.value = "";
        return;
      }
      var objUrl = URL.createObjectURL(file);

      function useIt() {
        if (audioURLs[set.id]) {
          try { URL.revokeObjectURL(audioURLs[set.id]); } catch (e) { /* 忽略 */ }
        }
        audioURLs[set.id] = objUrl;
        audioMeta[set.id] = { name: file.name, size: file.size, duration: 0 };
        delete blobFailed[set.id];
        stopAll();
        CET.app.rerender();
        UI().toast("已导入本地音频并保存在本机，刷新后自动恢复", "success");
      }

      if (!CET.audioStore) {
        useIt();
        UI().toast("此环境不支持本地数据库，音频只在本次会话有效", "warn");
        return;
      }
      CET.audioStore.put({
        id: set.id, name: file.name, size: file.size, duration: 0, blob: file, at: Date.now()
      }).then(useIt).catch(function () {
        useIt();
        UI().toast("音频已导入，但写入本地数据库失败：仅本次会话有效", "warn");
      });
    });

    root.querySelector("#clearAudio").addEventListener("click", function () {
      var old = audioURLs[set.id];
      delete audioURLs[set.id];
      delete audioMeta[set.id];
      delete blobFailed[set.id];
      if (old) { try { URL.revokeObjectURL(old); } catch (e) { /* 忽略 */ } }
      if (CET.audioStore) CET.audioStore.remove(set.id).catch(function () { /* 忽略 */ });
      stopAll();
      CET.app.rerender();
      UI().toast("已移除本地导入的音频", "warn");
    });

    if (!isOrig && player.idx >= 0) highlight(player.idx);
  }

  /* ---------------- 完整版 / 精听版 ---------------- */

  // 统一解析当前套次的可用音源（优先级：直链 > 在线原音 > 本地导入 > 内置 > 语音合成）
  function resolveSources(entry) {
    var set = entry.set;
    var key = entry.key;
    var link = getLinkByKey(key);
    var blobUrl = audioURLs[key] || "";
    var meta = audioMeta[key] || null;
    var online = set ? onlineFor(set) : entry.item;
    var builtin = set ? builtinFor(set) : "";
    var linkBlocked = !!linkFailed[key];
    var blobBlocked = !!blobFailed[key];
    var onlineBlocked = !!linkFailed["online:" + key];
    var builtinBlocked = !!linkFailed["builtin:" + key];
    var mode = "none", audioSrc = "", srcLabel = "暂无音频";
    if (link && !linkBlocked) { mode = "link"; srcLabel = "原音直链"; audioSrc = link; }
    else if (online && !onlineBlocked) { mode = "online"; srcLabel = "在线真题原音"; audioSrc = online.url; }
    else if (blobUrl && !blobBlocked) { mode = "blob"; srcLabel = "本地导入"; audioSrc = blobUrl; }
    else if (builtin && !builtinBlocked) {
      mode = "builtin";
      srcLabel = isLocalAudio(builtin) ? "真题原音（本地）" : "内置原音";
      audioSrc = builtin;
    }
    else if (set && set.lines && set.lines.length) { mode = "tts"; srcLabel = "语音合成"; }
    return {
      key: key, set: set, item: entry.item, link: link, blobUrl: blobUrl, meta: meta,
      online: online, builtin: builtin, linkBlocked: linkBlocked, blobBlocked: blobBlocked,
      onlineBlocked: onlineBlocked, builtinBlocked: builtinBlocked,
      mode: mode, audioSrc: audioSrc, srcLabel: srcLabel,
      isOrig: mode === "link" || mode === "online" || mode === "blob" || mode === "builtin"
    };
  }

  function srcDetailText(res) {
    if (res.mode === "link") return "站外直链：" + res.link;
    if (res.mode === "online") return "在线原音：" + res.online.url + "（需联网，来自 Couldyyy9/cet-website）";
    if (res.mode === "blob") {
      return "本地文件：" + (res.meta && res.meta.name ? res.meta.name : "已导入") +
        (res.meta && res.meta.size ? " · " + fmtSize(res.meta.size) : "");
    }
    if (res.mode === "builtin") return (isLocalAudio(res.builtin) ? "本地真题原音：" : "内置原音：") + res.builtin;
    if (res.mode === "tts") return "浏览器语音合成（英音 en-GB 优先，非官方原音）";
    return "当前没有可用音频";
  }

  function audioBadgeHtml(res) {
    return '<span class="src-badge ' + res.mode + '" id="srcBadge">当前来源：' + res.srcLabel + "</span>";
  }

  function backToGrid() {
    stopAll();
    ui.setId = null;
    ui.exam = null;
    ui.mode = null;
    draft = {};
    revealed = false;
    CET.app.rerender();
  }

  function normAns(s) {
    return String(s || "").toLowerCase().trim()
      .replace(/[.,!?;:'"()]/g, "").replace(/\s+/g, " ");
  }

  // 可选音频工具：直链 / 本地导入 / 在线地址（三处页面共用）
  function audioToolsHtml(res) {
    return '<details class="fold" id="audioTools">' +
      "<summary>音频来源：直链 / 本地导入（可选）</summary>" +
      '<div class="fold-body">' +
        '<div class="audio-note"><span>i</span><div>' +
          "外部直链优先于在线原音；本地导入保存在本机 IndexedDB，刷新自动恢复。在线原音为整卷一段，需联网。" +
        "</div></div>" +
        (res.online
          ? '<div class="audio-block"><div class="audio-block-head"><b>在线真题原音</b><span class="tiny dim">整卷一段</span></div>' +
            '<div class="res-foot"><span class="res-url">' + UI().esc(res.online.url) + "</span>" +
            '<button class="res-copy" type="button" data-copy="' + UI().esc(res.online.url) + '">复制地址</button></div></div>'
          : "") +
        '<div class="audio-block">' +
          '<div class="audio-block-head"><b>音频直链</b><span class="tiny dim">优先级最高</span></div>' +
          '<div class="link-form">' +
            '<input type="url" id="linkInput" placeholder="https://example.com/lesson.mp3" value="' +
              UI().esc(res.link) + '" aria-label="音频直链" />' +
            '<button class="btn sm primary" id="saveLink" type="button">保存直链</button>' +
            '<button class="btn sm ghost" id="clearLink" type="button"' + (res.link ? "" : " disabled") + ">移除直链</button>" +
          "</div>" +
          (res.link
            ? '<div class="res-foot"><span class="res-url">' + UI().esc(res.link) + "</span>" +
              '<button class="res-copy" type="button" data-copy="' + UI().esc(res.link) + '">复制链接</button></div>'
            : '<p class="tiny dim" style="margin:6px 0 0">只支持 http(s) 的音频文件地址（mp3 / m4a / wav 等）。</p>') +
        "</div>" +
        '<div class="audio-block">' +
          '<div class="audio-block-head"><b>本地导入</b><span class="tiny dim">' +
            (res.meta && res.blobUrl
              ? "已导入：" + UI().esc(res.meta.name || "本地音频") +
                (res.meta.size ? " · " + fmtSize(res.meta.size) : "")
              : "尚未导入本地音频") +
          "</span></div>" +
          '<div class="import-row">' +
            '<button class="btn sm" id="importAudio" type="button">导入本地音频</button>' +
            '<button class="btn sm ghost" id="clearAudio" type="button"' + (res.blobUrl ? "" : " disabled") + ">移除导入</button>" +
            '<span class="tiny dim">支持 mp3 / m4a / wav，单个不超过 30 MB</span>' +
            '<input type="file" id="audioFile" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden />' +
          "</div>" +
        "</div>" +
      "</div></details>";
  }

  function bindAudioTools(root, res) {
    var key = res.key;
    var linkInput = root.querySelector("#linkInput");
    root.querySelector("#saveLink").addEventListener("click", function () {
      var raw = (linkInput && linkInput.value ? linkInput.value : "").trim();
      if (!raw) { UI().toast("请先粘贴音频 http(s) 直链", "warn"); return; }
      if (!/^https?:\/\//i.test(raw)) { UI().toast("只支持 http(s) 开头、指向音频文件的直链", "warn"); return; }
      setLinkByKey(key, raw);
      delete linkFailed[key];
      stopAll();
      CET.app.rerender();
      UI().toast("已保存音频直链，刷新后仍保留", "success");
    });
    root.querySelector("#clearLink").addEventListener("click", function () {
      setLinkByKey(key, "");
      delete linkFailed[key];
      stopAll();
      CET.app.rerender();
      UI().toast("已移除音频直链", "warn");
    });

    var fileInput = root.querySelector("#audioFile");
    root.querySelector("#importAudio").addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var max = (CET.audioStore && CET.audioStore.MAX_BYTES) || 30 * 1024 * 1024;
      if (file.size > max) {
        UI().toast("文件过大（" + fmtSize(file.size) + "），请选择 30 MB 以内的音频", "error");
        fileInput.value = "";
        return;
      }
      var objUrl = URL.createObjectURL(file);
      function useIt() {
        if (audioURLs[key]) {
          try { URL.revokeObjectURL(audioURLs[key]); } catch (e) { /* 忽略 */ }
        }
        audioURLs[key] = objUrl;
        audioMeta[key] = { name: file.name, size: file.size, duration: 0 };
        delete blobFailed[key];
        stopAll();
        CET.app.rerender();
        UI().toast("已导入本地音频并保存在本机，刷新后自动恢复", "success");
      }
      if (!CET.audioStore) {
        useIt();
        UI().toast("此环境不支持本地数据库，音频只在本次会话有效", "warn");
        return;
      }
      CET.audioStore.put({
        id: key, name: file.name, size: file.size, duration: 0, blob: file, at: Date.now()
      }).then(useIt).catch(function () {
        useIt();
        UI().toast("音频已导入，但写入本地数据库失败：仅本次会话有效", "warn");
      });
    });

    root.querySelector("#clearAudio").addEventListener("click", function () {
      var old = audioURLs[key];
      delete audioURLs[key];
      delete audioMeta[key];
      delete blobFailed[key];
      if (old) { try { URL.revokeObjectURL(old); } catch (e) { /* 忽略 */ } }
      if (CET.audioStore) CET.audioStore.remove(key).catch(function () { /* 忽略 */ });
      stopAll();
      CET.app.rerender();
      UI().toast("已移除本地导入的音频", "warn");
    });
  }

  function bindOrigAudio(root, res) {
    var el = root.querySelector("#origAudio");
    if (!el) return;
    el.addEventListener("play", function () {
      player.playing = true;
      updatePlayBtn();
    });
    el.addEventListener("pause", function () {
      if (el.ended) return;
      player.playing = false;
      updatePlayBtn();
    });
    el.addEventListener("ended", function () {
      player.playing = false;
      updatePlayBtn();
    });
    el.addEventListener("error", function () {
      if (res.mode === "link") {
        linkFailed[res.key] = true;
        UI().toast("该地址不允许站外播放（跨域或 403），请下载音频后点「导入本地音频」", "error");
      } else {
        if (res.mode === "online") linkFailed["online:" + res.key] = true;
        else if (res.mode === "blob") blobFailed[res.key] = true;
        else if (res.mode === "builtin") linkFailed["builtin:" + res.key] = true;
        UI().toast("音频加载失败，已尝试切换其他来源", "error");
      }
      stopAll();
      CET.app.rerender();
    });
  }

  // 完整版（无原文套题）：只有整卷原音，不编造题目
  function renderOnlineFull(root, entry) {
    var res = resolveSources(entry);
    var audioEl = res.audioSrc
      ? '<audio id="origAudio" controls preload="metadata" playsinline src="' + UI().esc(res.audioSrc) +
        '" style="width:100%;margin-top:10px"></audio>'
      : "";
    var hint = res.audioSrc
      ? "整卷原音为一段录音，从开头播放；本套暂无题目文本，不能作答判分。"
      : "当前没有可用音频：请粘贴直链或导入本地音频。";

    root.innerHTML = '<div class="view-enter">' +
      '<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">' +
        '<button class="btn sm ghost" id="backSets" type="button">← 返回年份列表</button>' +
        '<div class="spacer"></div>' + levelTag(entry.item.level) +
        '<span class="tag">' + UI().esc(examLabel(entry.item)) + "</span>" +
        '<span class="tag accent">完整版</span>' +
        '<span class="tag">暂无原文</span>' +
      "</div>" +
      '<div class="card">' +
        '<div class="row between wrap" style="gap:10px;margin-bottom:6px">' +
          '<h2 class="listen-title">' + UI().esc(examLabel(entry.item)) + " · 完整版</h2>" +
          '<button class="btn sm" id="toIntensive" type="button">精听版 →</button>' +
        "</div>" +
        '<p class="set-source">该套暂无题目与原文整理，仅提供整卷真题原音（1 段）。</p>' +
        '<div class="player">' +
          '<div class="row between wrap" style="gap:8px;margin-bottom:10px">' + audioBadgeHtml(res) +
            '<span class="tiny dim listen-src-detail">' + UI().esc(srcDetailText(res)) + "</span></div>" +
          audioEl +
          '<p class="play-hint" id="playHint">' + UI().esc(hint) + "</p>" +
          '<div class="audio-note" style="margin-top:10px"><span>i</span><div>' +
            "本套<b>没有整理题目与逐字稿</b>，因此不能作答判分；本站不会为没有文本的套题生成题目或原文。" +
          "</div></div>" +
        "</div>" +
      "</div>" +
      audioToolsHtml(res) +
    "</div>";

    bindCopyButtons(root);
    root.querySelector("#backSets").addEventListener("click", backToGrid);
    root.querySelector("#toIntensive").addEventListener("click", function () {
      stopAll();
      ui.mode = "intensive";
      player.idx = -1;
      player.playing = false;
      player.auto = true;
      player.loop = true;
      CET.app.rerender();
    });
    bindOrigAudio(root, res);
    bindAudioTools(root, res);
  }

  // 精听版（无原文）：跟听 + 自我听写，不自动判分
  function renderIntensiveNoText(root, entry) {
    var res = resolveSources(entry);
    var audioEl = res.audioSrc
      ? '<audio id="origAudio" controls preload="metadata" playsinline src="' + UI().esc(res.audioSrc) +
        '" style="width:100%;margin-top:10px"></audio>'
      : "";
    var hint = res.audioSrc
      ? "整卷原音是一段录音，无法逐句切分；请从头到尾跟听，并在下方自评。"
      : "当前没有可用音频：可在下方粘贴直链或导入本地音频后再跟听。";
    var state = selfState[entry.exam] || "";
    var draftSelf = selfDraft[entry.exam] || "";

    var title = entry.set ? entry.set.title : examLabel(entry.item);
    var sourceLine = entry.set
      ? entry.set.source
      : "该套暂无题目与原文整理，只有整卷原音。";
    root.innerHTML = '<div class="view-enter">' +
      '<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">' +
        '<button class="btn sm ghost" id="backSets" type="button">← 返回年份列表</button>' +
        '<div class="spacer"></div>' + levelTag(entry.item.level) +
        '<span class="tag">' + UI().esc(examLabel(entry.item)) + "</span>" +
        '<span class="tag accent">精听版</span>' +
        '<span class="tag">暂无原文</span>' +
      "</div>" +
      '<div class="card">' +
        '<div class="row between wrap" style="gap:10px;margin-bottom:6px">' +
          '<h2 class="listen-title">' + UI().esc(title) + " · 精听版</h2>" +
          '<button class="btn sm" id="toFull" type="button">完整版 →</button>' +
        "</div>" +
        '<p class="set-source">' + UI().esc(sourceLine) + "</p>" +
        '<div class="audio-note"><span>i</span><div>' +
          "<b>题库未提供听力原文/译文，无法自动判分</b>。本页只提供「跟听 + 自我听写 + 自评」，不产生判分与积分；题目作答请回完整版。" +
        "</div></div>" +
        '<div class="player" style="margin-top:12px">' +
          '<div class="row between wrap" style="gap:8px;margin-bottom:10px">' + audioBadgeHtml(res) +
            '<span class="tiny dim listen-src-detail">' + UI().esc(srcDetailText(res)) + "</span></div>" +
          audioEl +
          '<p class="play-hint" id="playHint">' + UI().esc(hint) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="card" style="margin-top:16px">' +
        '<h3 style="font-size:15px">跟听 + 自我听写</h3>' +
        '<p class="tiny dim" style="margin-top:4px">整卷原音无法定位到某一句，请从头跟听，在下面写下你听到的关键词或句子。</p>' +
        '<textarea class="self-dictation" id="selfDictation" placeholder="在这里写下你听到的内容…（不自动判分）">' +
          UI().esc(draftSelf) + "</textarea>" +
        '<div class="row wrap" style="gap:8px;margin-top:10px">' +
          '<button class="chip' + (state === "good" ? " active" : "") + '" type="button" data-self="good">自评：基本跟听清楚</button>' +
          '<button class="chip' + (state === "again" ? " active" : "") + '" type="button" data-self="again">自评：还需要再听</button>' +
          '<span class="tiny dim" id="selfHint">自评只记录在本页，不判分、不计分</span>' +
        "</div>" +
      "</div>" +
      audioToolsHtml(res) +
    "</div>";

    bindCopyButtons(root);
    root.querySelector("#backSets").addEventListener("click", backToGrid);
    root.querySelector("#toFull").addEventListener("click", function () {
      stopAll();
      ui.mode = "full";
      player.idx = -1;
      player.playing = false;
      CET.app.rerender();
    });
    bindOrigAudio(root, res);
    bindAudioTools(root, res);

    var ta = root.querySelector("#selfDictation");
    ta.addEventListener("input", function () { selfDraft[entry.exam] = ta.value; });
    root.querySelectorAll("[data-self]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-self");
        selfState[entry.exam] = v;
        root.querySelectorAll("[data-self]").forEach(function (x) {
          x.classList.toggle("active", x.getAttribute("data-self") === v);
        });
        var hintEl = root.querySelector("#selfHint");
        if (hintEl) hintEl.textContent = v === "good" ? "已记录自评：基本跟听清楚（不判分）" : "已记录自评：还需要再听（不判分）";
        UI().toast("已记录自评（不判分、不计分）", "success");
      });
    });
  }

  // 精听版（有原文）：逐句 + 循环 / 上一句下一句 / 语速 / 原文开关 / 听写判分
  function renderIntensive(root, entry) {
    var set = entry.set;
    var res = resolveSources(entry);
    sourceMode = res.isOrig ? res.mode : "tts";
    var useOrigAudio = !!res.isOrig;
    var audioEl = res.isOrig
      ? '<audio id="origAudio" controls preload="metadata" playsinline src="' + UI().esc(res.audioSrc) +
        '" style="width:100%;margin-top:10px"></audio>'
      : "";
    var origBlock = res.isOrig
      ? '<div class="orig-block">' +
          '<div class="row between wrap" style="gap:8px;margin-bottom:6px">' + audioBadgeHtml(res) +
            '<span class="tiny dim listen-src-detail">' + UI().esc(srcDetailText(res)) + "</span></div>" +
          audioEl +
          '<p class="tiny dim" style="margin-top:6px">整卷原音从开头播放，无法定位到第 N 句；逐句请用下方播放器。</p>' +
        "</div>"
      : '<p class="tiny dim">当前没有可用的整卷原音；逐句精听仍可用浏览器语音合成继续。</p>';

    var passages = (set.passages && set.passages.length)
      ? set.passages
      : [{ label: "全文", kind: "听力", from: 0, to: (set.lines || []).length - 1, qs: [] }];
    function fmtDur(sec) {
      var m = Math.floor(sec / 60);
      var s = Math.round(sec % 60);
      return m + ":" + (s < 10 ? "0" : "") + s;
    }
    // 每句独立控件：偏好按套 + 句 id 存 localStorage，刷新/切篇后保留
    function loadLineCtl() {
      var raw = null;
      try { raw = localStorage.getItem(LINE_CTL_KEY); } catch (e) { raw = null; }
      if (!raw) { return; }
      try {
        var o = JSON.parse(raw) || {};
        var sc = o[set.id] || {};
        lineRates = sc.rates || {};
        lineLoops = sc.loops || {};
        lineReps = sc.reps || {};
      } catch (e) { /* 数据损坏时忽略，用默认值 */ }
    }
    function saveLineCtl() {
      try {
        var raw = localStorage.getItem(LINE_CTL_KEY);
        var o = raw ? (JSON.parse(raw) || {}) : {};
        o[set.id] = { rates: lineRates, loops: lineLoops, reps: lineReps };
        localStorage.setItem(LINE_CTL_KEY, JSON.stringify(o));
      } catch (e) { /* 无痕模式等情况下静默 */ }
    }
    function lineRate(i) {
      var v = parseFloat(lineRates[i]);
      if (!isFinite(v) || v < 0.5 || v > 2) { v = 1; }
      return Math.round(v * 20) / 20; // 对齐 0.05 步进
    }
    function lineRepsOf(i) {
      var v = parseInt(lineReps[i], 10);
      return (v === 1 || v === 3 || v === 5 || v === 10) ? v : 1;
    }
    // 句界：优先用 ffmpeg 停顿检测写进数据的 set.lineBounds（相对本篇 clip）；
    // 没有实测数据的套题才退回按句长估算。
    function clipTiming(p, i) {
      var lb = set.lineBounds && set.lineBounds[i];
      if (lb && isFinite(lb[0]) && isFinite(lb[1]) && lb[1] > lb[0]) {
        return { start: lb[0], end: lb[1] };
      }
      var lines = set.lines || [];
      var total = 0, before = 0, cur = 0;
      for (var k = p.from; k <= p.to; k++) {
        var len = Math.max(1, ((lines[k] && lines[k].en) || "").length);
        if (k < i) before += len;
        if (k === i) cur = len;
        total += len;
      }
      var d = p.dur || 0;
      return { start: total ? (before / total) * d : 0, end: total ? ((before + cur) / total) * d : 0 };
    }
    function clipAudio(pi) { return root.querySelector('[data-tp-audio="' + pi + '"]'); }
    function pauseClips() {
      root.querySelectorAll(".tp-audio").forEach(function (a) { a.pause(); });
    }
    function rateLabel(v) {
      return (Math.round(v * 100) / 100).toFixed(2) + "×";
    }
    loadLineCtl();
    var hasAudio = !!res.isOrig || passages.some(function (p) { return !!p.clip; });
    var ctlHtml = hasAudio
      ? '<div class="int-bulk" id="intCtl"><span class="tiny dim">全部设为</span>' +
        '<input type="range" id="bulkRate" min="0.5" max="2" step="0.05" value="0.8" aria-label="批量倍速 0.5 到 2 倍" />' +
        '<b class="rate-now" id="bulkRateVal">' + rateLabel(0.8) + "</b>" +
        '<button class="chip" id="bulkApply" type="button">应用到全部</button>' +
        '<button class="chip" id="bulkQuick08" type="button">全部 0.8×</button>' +
        '<button class="chip" id="bulkQuick1" type="button">全部 1×</button>' +
        '<span class="tiny dim int-note">批量只改当前值，之后各句的单独调整会各自保留</span></div>'
      : "";
    var tpHtml = passages.map(function (p, pi) {
      var seg = (set.lines || []).slice(p.from, p.to + 1).map(function (line, k) {
        var i = p.from + k;
        var rt = lineRate(i);
        var onLoop = !!lineLoops[i];
        var reps = lineRepsOf(i);
        var repOpts = [1, 3, 5, 10].map(function (n) {
          return '<option value="' + n + '"' + (n === reps ? " selected" : "") + ">" + n + " 遍</option>";
        }).join("");
        return '<div class="line" data-line="' + i + '" tabindex="0">' +
          '<div class="line-main">' +
            '<span class="sp">' + UI().esc(line.sp) + "</span>" +
            '<span class="line-no">第 ' + (i + 1) + " 句</span>" +
            '<span class="txt">' + UI().esc(line.en) +
              '<span class="cn">' + UI().esc(line.cn) + "</span></span>" +
          "</div>" +
          '<div class="line-ctl" data-ctl="' + i + '">' +
            '<button class="play-mini" data-line-play="' + i + '" type="button" title="播放这句">' +
              SPEAK_SM + "<span>播放这句</span></button>" +
            '<input type="range" class="line-slider" data-line-slider="' + i + '" min="0.5" max="2" step="0.05" value="' +
              rt.toFixed(2) + '" aria-label="第 ' + (i + 1) + ' 句倍速" />' +
            '<b class="line-rate-val" data-line-val="' + i + '">' + rateLabel(rt) + "</b>" +
            '<button class="line-loop' + (onLoop ? " on" : "") + '" data-line-loop="' + i + '" type="button" ' +
              'aria-label="第 ' + (i + 1) + ' 句循环" aria-pressed="' + (onLoop ? "true" : "false") + '">循环</button>' +
            '<label class="line-reps">遍数<select data-line-reps="' + i + '" aria-label="第 ' + (i + 1) + ' 句循环遍数">' +
              repOpts + "</select></label>" +
          "</div>" +
        "</div>";
      }).join("");
      var qs = p.qs || [];
      var qChips = qs.length
        ? '<span class="tiny dim">题目：</span>' + qs.map(function (n) {
            var q = (set.questions || []).filter(function (x) { return x.no === n; })[0];
            var ans = q && typeof q.answer === "number" ? "ABCD"[q.answer] : "?";
            return '<span class="q-chip" title="正确答案 ' + ans + '">Q' + n + "</span>";
          }).join("")
        : '<span class="tiny dim">本套题库未给出该篇对应题号</span>';
      var playerRow = p.clip
        ? '<div class="tp-player">' +
            '<button class="btn sm" type="button" data-tp-play="' + pi + '">播放本篇</button>' +
            '<audio class="tp-audio" data-tp-audio="' + pi + '" controls preload="none" playsinline src="' + UI().esc(p.clip) + '"></audio>' +
            '<span class="tiny dim tp-dur">本篇 ' + fmtDur(p.dur || 0) + "</span>" +
            '<button class="chip' + (passLoop === pi ? " active" : "") + '" type="button" data-tp-loop="' + pi + '">本篇循环</button>' +
          "</div>"
        : "";
      return '<section class="tp" data-tp="' + pi + '">' +
        '<div class="tp-head">' +
          '<span class="tag">' + UI().esc(p.kind) + "</span>" +
          "<b>" + UI().esc(p.label) + "</b>" +
          '<span class="tiny dim">' + (p.to - p.from + 1) + " 句</span>" +
          '<span class="spacer"></span>' +
          '<button class="chip" type="button" data-tp-text="' + pi + '">显示原文</button>' +
          '<button class="chip active" type="button" data-tp-cn="' + pi + '">隐藏译文</button>' +
          '<button class="chip" type="button" data-tp-fold="' + pi + '">收起</button>' +
        "</div>" +
        '<div class="tp-body" data-tp-body="' + pi + '">' +
          '<div class="tp-q">' + qChips +
            '<span class="spacer"></span>' +
            '<button class="btn sm ghost" type="button" data-tp-go="1">去完整版作答 →</button></div>' +
          playerRow +
          '<div class="transcript' + (player.hideText ? " text-off" : "") + '" data-tp-box="' + pi + '">' + seg + "</div>" +
        "</div>" +
      "</section>";
    }).join("");

    var cloze = set.cloze || [];
    var clozeBody = cloze.map(function (c, ci) {
      var parts = String(c.text || "").split("______");
      return '<div class="cloze-item" data-cloze-row="' + ci + '">' +
        '<div class="cloze-text">' + UI().esc(parts[0] || "") +
          '<input type="text" data-cloze-input="' + ci + '" autocomplete="off" spellcheck="false" aria-label="听写第 ' + (ci + 1) + ' 空" />' +
          UI().esc(parts.length > 1 ? parts.slice(1).join("______") : "") +
          '<span class="tiny dim" style="display:block;margin-top:4px">提示：' + UI().esc(c.hint || "无") + "</span>" +
        "</div>" +
        '<span class="cloze-feedback" data-cloze-fb="' + ci + '"></span>' +
      "</div>";
    }).join("");

    root.innerHTML = '<div class="view-enter">' +
      '<div class="row" style="margin-bottom:12px;gap:10px;flex-wrap:wrap">' +
        '<button class="btn sm ghost" id="backSets" type="button">← 返回年份列表</button>' +
        '<div class="spacer"></div>' + levelTag(set.level) +
        '<span class="tag accent">精听版</span>' +
        '<span class="tag">' + UI().esc(set.type) + "</span>" +
        '<button class="btn sm" id="toFull" type="button">完整版 →</button>' +
      "</div>" +
      '<div class="card">' +
        '<h2 class="listen-title">' + UI().esc(examLabel(entry.item)) + " · 精听版</h2>" +
        '<p class="set-source">' + UI().esc(set.title) + " · " + UI().esc(set.source || "") + "</p>" +
        '<div class="audio-note"><span>i</span><div>' +
          (useOrigAudio
            ? "本套使用<b>整卷真题原音</b>与<b>每篇独立切片</b>（本地 mp3）。圆形按钮播放/暂停整卷原音；" +
              "下方每篇有独立播放器，<b>句界按音频停顿检测</b>，点「播放这句」按实测起止播放。"
            : "真题原音是<b>整卷一段</b>，没有逐题时间戳。逐句朗读使用浏览器语音合成（非官方原音）。") +
        "</div></div>" +
        origBlock +
        '<div class="player" style="margin-top:12px">' +
          '<div class="player-top">' +
            '<button class="player-big" id="playBig" type="button" aria-label="播放">' + PLAY_ICO + "</button>" +
            '<div class="player-info"><strong id="playerState">' + (useOrigAudio ? "播放原音" : "播放全文") + '</strong><span id="playerStatus">未开始</span></div>' +
            '<div class="spacer"></div>' +
            (useOrigAudio
              ? '<span class="tiny dim">整卷原音 · 逐句请用下方本篇播放器</span>'
              : '<div class="rate-slider"><span>语速 <b id="rateVal">' + player.rate.toFixed(2) + "x</b></span>" +
                '<input type="range" id="rateRange" min="60" max="130" step="5" value="' +
                  Math.round(player.rate * 100) + '" aria-label="语速" /></div>') +
          "</div>" +
          '<div class="row wrap" style="gap:8px">' +
            '<button class="btn sm ghost" id="prevLine" type="button">上一句</button>' +
            '<button class="btn sm ghost" id="nextLine" type="button">下一句</button>' +
            (useOrigAudio
              ? ""
              : '<button class="chip' + (player.auto ? " active" : "") + '" id="autoBtn" type="button">连续播放</button>' +
                '<button class="chip' + (player.loop ? " active" : "") + '" id="loopBtn" type="button">循环</button>') +
          "</div>" +
          '<div class="bar thin" style="margin-top:12px"><i id="lineBar" style="width:0%"></i></div>' +
          '<p class="play-hint" id="playHint">' + (useOrigAudio
            ? "点圆形按钮播放/暂停整卷原音；逐句精听请点下方每篇的「播放这句」（句界按音频停顿检测）。"
            : "点圆形按钮从第 1 句开始逐句朗读；也可以直接点下方任意一句。") + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="card" style="margin-top:16px">' +
        '<div class="row between wrap" style="gap:8px;margin-bottom:4px">' +
          '<h3 style="font-size:15px">逐句原文（按题型分篇）</h3>' +
          '<span class="tiny dim">' + passages.length + " 篇 · " + (set.lines || []).length + " 句" +
            (set.translationNote ? " · " + UI().esc(set.translationNote) : "") + "</span></div>" +
        '<div class="tp-list" id="tpList">' + ctlHtml + tpHtml + "</div>" +
        (set.clipNote
          ? '<p class="tiny dim clip-note" style="margin-top:8px">' + UI().esc(set.clipNote) + "</p>"
          : "") +
        (set.transcriptNote
          ? '<p class="tiny dim" style="margin-top:8px">' + UI().esc(set.transcriptNote) + "</p>"
          : "") +
      "</div>" +
      (cloze.length
        ? '<div class="card" style="margin-top:16px">' +
            '<div class="row between wrap" style="gap:8px;margin-bottom:4px">' +
              '<h3 style="font-size:15px">听写填空判分</h3>' +
              '<span class="tiny dim">每题 1 分 · 不区分大小写</span></div>' +
            '<div class="cloze-list">' + clozeBody + "</div>" +
            '<div class="quiz-actions">' +
              '<button class="btn primary" id="submitCloze" type="button">提交听写</button>' +
              '<span class="tiny dim" id="clozeScore">填好后点提交，会标出对错并给出正确写法</span>' +
            "</div>" +
          "</div>"
        : "") +
      audioToolsHtml(res) +
    "</div>";

    bindCopyButtons(root);
    root.querySelector("#backSets").addEventListener("click", backToGrid);
    root.querySelector("#toFull").addEventListener("click", function () {
      stopAll();
      ui.mode = "full";
      player.loop = false;
      player.idx = -1;
      player.playing = false;
      player.auto = true;
      CET.app.rerender();
    });
    bindOrigAudio(root, res);
    bindAudioTools(root, res);

    // 原音模式：按句子长度估算每句在整卷里的位置（统一标注「可能不准」，不假装精确）
    function lineTiming(i) {
      var a = root.querySelector("#origAudio");
      var dur = a && isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
      var ws = [], total = 0;
      (set.lines || []).forEach(function (l) {
        var w = Math.max(1, String(l.en || "").length);
        ws.push(w);
        total += w;
      });
      var acc = 0;
      for (var k = 0; k < i; k++) { acc += ws[k]; }
      if (!dur || !total || !ws[i]) { return { start: NaN, end: NaN }; }
      return { start: (acc / total) * dur, end: ((acc + ws[i]) / total) * dur };
    }
    function activeClip() {
      var found = null;
      root.querySelectorAll(".tp-audio").forEach(function (a) {
        if (!found && !a.paused) { found = a; }
      });
      return found;
    }
    function highlightLine(i) {
      root.querySelectorAll(".line").forEach(function (el) {
        el.classList.toggle("on", parseInt(el.getAttribute("data-line"), 10) === i);
      });
      var bar = root.querySelector("#lineBar");
      var st = root.querySelector("#playerStatus");
      var a = activeClip() || root.querySelector("#origAudio");
      if (!a || !isFinite(a.duration) || a.duration <= 0) { return; }
      if (bar) { bar.style.width = ((a.currentTime / a.duration) * 100).toFixed(2) + "%"; }
      if (st) {
        var isClip = a.classList.contains("tp-audio");
        st.textContent = (i >= 0 ? "第 " + (i + 1) + " 句附近 · " : "") + (isClip ? "本篇 " : "") +
          fmtTime(a.currentTime) + " / " + fmtTime(a.duration);
      }
    }
    var internalSeekAt = 0; // 程序内定位的时间戳（seeking 事件是异步派发的，用时间窗判定）
    function markInternalSeek() { internalSeekAt = Date.now(); }
    function isInternalSeek() { return Date.now() - internalSeekAt < 500; }
    function playOrigAt(i) {
      var a = root.querySelector("#origAudio");
      if (!a) { setHint("播放器还没准备好，请刷新页面后重试", "warn"); return; }
      pauseClips();
      var t = lineTiming(i);
      if (!isFinite(t.start)) {
        setHint("音频时长还没加载出来：先用上方音频条播放一下，再点句子定位", "warn");
        return;
      }
      markInternalSeek();
      try { a.currentTime = t.start; } catch (e) {
        setHint("定位失败：" + (e && e.message ? e.message : "未知原因"), "warn");
        return;
      }
      player.idx = i;
      highlightLine(i);
      stopAt = t.end;
      setHint("正在播放第 " + (i + 1) + " 句附近（按句长估算，可能不准）", "");
      var p = a.play();
      if (p && p.catch) {
        p.catch(function (err) {
          stopAt = null;
          var code = err && err.name ? err.name : "Error";
          var tip = "播放失败：" + code +
            (code === "NotAllowedError" ? "（浏览器要求先点一下页面再播放）" : "：" + (err && err.message ? err.message : "未知原因"));
          setHint(tip, "warn");
          UI().toast("原音播放失败，可用上方音频条手动播放", "error");
        });
      } else {
        setHint("正在播放第 " + (i + 1) + " 句附近（按句长估算，可能不准）", "");
      }
    }

    root.querySelector("#playBig").addEventListener("click", function () {
      if (useOrigAudio) {
        var a = root.querySelector("#origAudio");
        if (!a) { setHint("播放器还没准备好，请刷新页面后重试", "warn"); return; }
        pauseClips();
        if (!a.paused) { a.pause(); setHint("已暂停", ""); return; }
        stopAt = null;
        setHint("正在播放整卷原音", "");
        var p = a.play();
        if (p && p.catch) {
          p.catch(function (err) {
            var code = err && err.name ? err.name : "Error";
            var tip = "播放失败：" + code + "：" + (err && err.message ? err.message : "未知原因");
            setHint(tip, "warn");
            UI().toast("原音播放失败，可用上方音频条手动播放", "error");
          });
        } else {
          setHint("正在播放整卷原音（" + (player.idx >= 0 ? "第 " + (player.idx + 1) + " 句附近" : "从当前位置") + "）", "");
        }
        return;
      }
      if (player.playing) pausePlay();
      else playLine(player.idx >= 0 ? player.idx : 0);
    });

    function playAtLine(i) {
      var hit = passageOf(i);
      if (hit && hit.p.clip) { playClipAt(hit.pi, i); return; }
      if (useOrigAudio) { playOrigAt(i); return; }
      playLine(i);
    }
    root.querySelector("#prevLine").addEventListener("click", function () {
      var i = player.idx <= 0 ? 0 : player.idx - 1;
      playAtLine(i);
    });

    root.querySelector("#nextLine").addEventListener("click", function () {
      var last = (set.lines || []).length - 1;
      var i = player.idx < 0 ? 0 : player.idx + 1;
      if (i > last) { i = last; }
      playAtLine(i);
    });

    if (useOrigAudio) {
      var au = root.querySelector("#origAudio");
      if (au) {
        au.addEventListener("timeupdate", function () {
          highlightLine(player.idx);
          if (loopLine >= 0) {
            var lt = lineTiming(loopLine);
            if (isFinite(lt.end) && lt.end > lt.start && au.currentTime >= lt.end) {
              internalSeekAt = Date.now();
              try { au.currentTime = lt.start; } catch (e) { /* 忽略 */ }
              player.idx = loopLine;
              return;
            }
          }
          if (stopAt != null && au.currentTime >= stopAt) {
            stopAt = null;
            au.pause();
            setHint("本句播完，可点「下一句」继续（按句长估算，可能不准）", "");
          }
        });
        au.addEventListener("play", function () {
          // 整卷原音没有逐句时间戳：播整卷时取消单句循环，避免用估算句界乱跳
          if (loopLine >= 0) { loopLine = -1; syncLoopUi(); }
          if (passLoop >= 0) { passLoop = -1; syncLoopUi(); }
        });
        au.addEventListener("seeking", function () {
          if (isInternalSeek()) { return; }
          if (loopLine >= 0) { loopLine = -1; syncLoopUi(); }
          stopAt = null;
          player.idx = -1;
          highlightLine(-1);
        });
      }
    }

    var autoBtn = root.querySelector("#autoBtn");
    if (autoBtn) {
      autoBtn.addEventListener("click", function () {
        player.auto = !player.auto;
        autoBtn.classList.toggle("active", player.auto);
        setHint(player.auto ? "连续播放已开启" : "连续播放已关闭，只读当前句", "");
      });
    }

    var loopBtn = root.querySelector("#loopBtn");
    if (loopBtn) {
      loopBtn.addEventListener("click", function () {
        player.loop = !player.loop;
        loopBtn.classList.toggle("active", player.loop);
        setHint(player.loop ? "循环已开启：读到最后一句会回到第 1 句" : "循环已关闭", "");
      });
    }

    // 每篇独立的原文 / 译文开关与收起展开
    root.querySelectorAll("[data-tp-text]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pi = btn.getAttribute("data-tp-text");
        var box = root.querySelector('[data-tp-box="' + pi + '"]');
        if (!box) return;
        var hidden = box.classList.contains("text-off");
        box.classList.toggle("text-off", !hidden);
        btn.textContent = hidden ? "隐藏原文" : "显示原文";
        btn.classList.toggle("active", hidden);
        setHint(hidden ? "本篇原文已显示" : "本篇原文已隐藏，先听再看", "");
      });
    });
    root.querySelectorAll("[data-tp-cn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pi = btn.getAttribute("data-tp-cn");
        var box = root.querySelector('[data-tp-box="' + pi + '"]');
        if (!box) return;
        var hidden = box.classList.contains("cn-off");
        box.classList.toggle("cn-off", !hidden);
        btn.textContent = hidden ? "隐藏译文" : "显示译文";
        btn.classList.toggle("active", hidden);
        setHint(hidden ? "本篇译文已显示" : "本篇译文已隐藏，先自己听再对照", "");
      });
    });
    root.querySelectorAll("[data-tp-fold]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pi = btn.getAttribute("data-tp-fold");
        var sec = root.querySelector('[data-tp="' + pi + '"]');
        if (!sec) return;
        var folded = sec.classList.contains("folded");
        sec.classList.toggle("folded", !folded);
        btn.textContent = folded ? "收起" : "展开";
        btn.classList.toggle("active", !folded);
      });
    });
    root.querySelectorAll("[data-tp-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        stopAll();
        ui.mode = "full";
        player.loop = false;
        player.idx = -1;
        player.playing = false;
        CET.app.rerender();
      });
    });

    var rateRange = root.querySelector("#rateRange");
    if (rateRange) {
      rateRange.addEventListener("input", function (e) {
        player.rate = parseInt(e.target.value, 10) / 100;
        var val = root.querySelector("#rateVal");
        if (val) val.textContent = player.rate.toFixed(2) + "x";
        setHint("语速已调为 " + player.rate.toFixed(2) + "x，下一句生效", "");
      });
    }

    // 每句独立的倍速 / 单句循环 / 遍数 /「全部设为」批量写入
    function syncLoopUi() {
      root.querySelectorAll("[data-line-loop]").forEach(function (b) {
        var i = parseInt(b.getAttribute("data-line-loop"), 10);
        var on = !!lineLoops[i];
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      root.querySelectorAll("[data-tp-loop]").forEach(function (b) {
        b.classList.toggle("active", parseInt(b.getAttribute("data-tp-loop"), 10) === passLoop);
      });
    }
    function syncLineUi(i) {
      var sl = root.querySelector('[data-line-slider="' + i + '"]');
      var val = root.querySelector('[data-line-val="' + i + '"]');
      var rt = lineRate(i);
      if (sl) { sl.value = rt.toFixed(2); }
      if (val) { val.textContent = rateLabel(rt); }
    }
    function activeClipFor(i) {
      var hit = passageOf(i);
      return hit ? clipAudio(hit.pi) : null;
    }
    function isPlayingLine(i) {
      var a = activeClipFor(i);
      return !!a && !a.paused && player.idx === i;
    }
    root.querySelectorAll("[data-line-slider]").forEach(function (sl) {
      sl.addEventListener("input", function () {
        var i = parseInt(sl.getAttribute("data-line-slider"), 10);
        var v = parseFloat(sl.value);
        if (!isFinite(v)) { return; }
        v = Math.min(2, Math.max(0.5, Math.round(v * 20) / 20));
        lineRates[i] = v;
        syncLineUi(i);
        saveLineCtl();
        // 循环/播放中改倍速：playbackRate 实时改，立即生效
        if (isPlayingLine(i)) {
          var a = activeClipFor(i);
          try { a.playbackRate = v; } catch (e) { /* 忽略 */ }
        }
        setHint("第 " + (i + 1) + " 句倍速 " + rateLabel(v) +
          (isPlayingLine(i) ? "（已即时生效）" : "，点「播放这句」生效"), "");
      });
    });
    root.querySelectorAll("[data-line-loop]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var i = parseInt(b.getAttribute("data-line-loop"), 10);
        lineLoops[i] = !lineLoops[i];
        if (!lineLoops[i] && loopLine === i) { loopLine = -1; }
        syncLoopUi();
        saveLineCtl();
        setHint(lineLoops[i]
          ? "第 " + (i + 1) + " 句循环已开启，共 " + lineRepsOf(i) + " 遍"
          : "第 " + (i + 1) + " 句循环已关闭", "");
      });
    });
    root.querySelectorAll("[data-line-reps]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var i = parseInt(sel.getAttribute("data-line-reps"), 10);
        var v = parseInt(sel.value, 10);
        if (!(v === 1 || v === 3 || v === 5 || v === 10)) { v = 1; }
        lineReps[i] = v;
        if (lineLoops[i]) { loopTotal = v; }
        saveLineCtl();
        setHint("第 " + (i + 1) + " 句循环遍数设为 " + v + " 遍", "");
      });
    });
    // 控件区的点击/拖动/键盘事件不要冒泡到整句（否则会误触发播放）
    root.querySelectorAll(".line-ctl").forEach(function (box) {
      box.addEventListener("click", function (e) { e.stopPropagation(); });
      box.addEventListener("mousedown", function (e) { e.stopPropagation(); });
      box.addEventListener("keydown", function (e) { e.stopPropagation(); });
    });
    function applyBulkRate(v) {
      v = Math.min(2, Math.max(0.5, Math.round(v * 20) / 20));
      (set.lines || []).forEach(function (line, i) {
        lineRates[i] = v;
        syncLineUi(i);
        if (isPlayingLine(i)) {
          var a = activeClipFor(i);
          try { a.playbackRate = v; } catch (e) { /* 忽略 */ }
        }
      });
      saveLineCtl();
      var bv = root.querySelector("#bulkRateVal");
      if (bv) { bv.textContent = rateLabel(v); }
      setHint("已把全部 " + (set.lines || []).length + " 句设为 " + rateLabel(v) + "（之后各句仍可单独调整）", "");
    }
    var bulkRate = root.querySelector("#bulkRate");
    if (bulkRate) {
      bulkRate.addEventListener("input", function () {
        var bv = root.querySelector("#bulkRateVal");
        var v = parseFloat(bulkRate.value);
        if (bv && isFinite(v)) { bv.textContent = rateLabel(v); }
      });
    }
    var bulkApply = root.querySelector("#bulkApply");
    if (bulkApply) {
      bulkApply.addEventListener("click", function () { applyBulkRate(parseFloat(bulkRate.value)); });
    }
    var bulk08 = root.querySelector("#bulkQuick08");
    if (bulk08) {
      bulk08.addEventListener("click", function () {
        if (bulkRate) { bulkRate.value = "0.8"; }
        applyBulkRate(0.8);
      });
    }
    var bulk1 = root.querySelector("#bulkQuick1");
    if (bulk1) {
      bulk1.addEventListener("click", function () {
        if (bulkRate) { bulkRate.value = "1"; }
        applyBulkRate(1);
      });
    }
    root.querySelectorAll("[data-tp-loop]").forEach(function (b) {
      b.addEventListener("click", function () {
        var pi = parseInt(b.getAttribute("data-tp-loop"), 10);
        passLoop = passLoop === pi ? -1 : pi;
        syncLoopUi();
        setHint(passLoop >= 0
          ? "本篇循环已开启：播完第 " + (passLoop + 1) + " 篇自动从头重播"
          : "本篇循环已关闭", "");
      });
    });

    // 每篇独立播放器：播放/暂停/进度/时长只作用本篇
    function passageOf(i) {
      for (var k = 0; k < passages.length; k++) {
        if (i >= passages[k].from && i <= passages[k].to) { return { p: passages[k], pi: k }; }
      }
      return null;
    }
    function syncClipBtn(pi) {
      var b = root.querySelector('[data-tp-play="' + pi + '"]');
      var a = clipAudio(pi);
      if (b && a) { b.textContent = a.paused ? "播放本篇" : "暂停"; }
    }
    function playClipAt(pi, i) {
      var p = passages[pi];
      var a = clipAudio(pi);
      if (!p || !a) { setHint("本篇音频还没准备好，请刷新后重试", "warn"); return; }
      var t = clipTiming(p, i);
      pauseClips();
      var oa = root.querySelector("#origAudio");
      if (oa && !oa.paused) { oa.pause(); }
      // 用这一句自己的循环开关与遍数
      if (lineLoops[i]) {
        loopLine = i;
        loopDone = 0;
        loopTotal = lineRepsOf(i);
      } else {
        loopLine = -1;
        loopTotal = 1;
      }
      markInternalSeek();
      try {
        var max = (isFinite(a.duration) && a.duration > 0) ? a.duration : (p.dur || 0);
        a.currentTime = Math.min(Math.max(0, t.start), Math.max(0, max - 0.2));
      } catch (e) {
        setHint("本篇内定位失败：" + (e && e.message ? e.message : "未知原因"), "warn");
      }
      try { a.playbackRate = lineRate(i); } catch (e) { /* 忽略 */ }
      player.idx = i;
      highlightLine(i);
      syncLoopUi();
      setHint("正在播放第 " + (i + 1) + " 句 · " + lineRate(i).toFixed(2) + "× · " +
        t.start.toFixed(2) + "–" + t.end.toFixed(2) + "s" +
        (lineLoops[i] ? " · 循环 " + loopTotal + " 遍" : ""), "");
      var pr = a.play();
      if (pr && pr.catch) {
        pr.catch(function (err) {
          var code = err && err.name ? err.name : "Error";
          setHint("播放失败：" + code + "：" + (err && err.message ? err.message : "未知原因"), "warn");
          UI().toast("本篇音频播放失败，可用完整版整卷原音", "error");
        });
      }
    }
    root.querySelectorAll("[data-tp-play]").forEach(function (b) {
      b.addEventListener("click", function () {
        var pi = parseInt(b.getAttribute("data-tp-play"), 10);
        var a = clipAudio(pi);
        if (!a) { setHint("本篇音频还没准备好，请刷新后重试", "warn"); return; }
        if (!a.paused) { a.pause(); setHint("已暂停（本篇）", ""); return; }
        pauseClips();
        var oa = root.querySelector("#origAudio");
        if (oa && !oa.paused) { oa.pause(); }
        player.idx = -1;
        loopLine = -1;
        stopAt = null;
        setHint("正在播放本篇音频", "");
        var pr = a.play();
        if (pr && pr.catch) {
          pr.catch(function (err) {
            var code = err && err.name ? err.name : "Error";
            setHint("播放失败：" + code + "：" + (err && err.message ? err.message : "未知原因"), "warn");
            UI().toast("本篇音频播放失败，可用完整版整卷原音", "error");
          });
        }
      });
    });
    root.querySelectorAll(".tp-audio").forEach(function (a) {
      var pi = a.getAttribute("data-tp-audio");
      a.addEventListener("play", function () {
        root.querySelectorAll(".tp-audio").forEach(function (x) {
          if (x !== a) { x.pause(); }
        });
        var oa = root.querySelector("#origAudio");
        if (oa && !oa.paused) { oa.pause(); }
        if (player.idx < 0) { stopAt = null; }
        syncClipBtn(pi);
        syncLoopUi();
        if (player.idx < 0) { setHint("正在播放本篇音频", ""); }
      });
      a.addEventListener("pause", function () { syncClipBtn(pi); });
      a.addEventListener("seeking", function () {
        if (isInternalSeek()) { return; }
        if (loopLine >= 0) {
          loopLine = -1;
          syncLoopUi();
          setHint("已拖动进度，本次单句循环已取消（开关仍保留）", "");
        }
      });
      a.addEventListener("ended", function () {
        syncClipBtn(pi);
        var piNow = parseInt(pi, 10);
        if (passLoop !== piNow) { return; }
        markInternalSeek();
        try { a.currentTime = 0; } catch (e) { /* 忽略 */ }
        player.idx = -1;
        loopLine = -1;
        setHint("本篇循环：已从头重新播放", "");
        var pr = a.play();
        if (pr && pr.catch) { pr.catch(function () { /* 忽略 */ }); }
      });
      a.addEventListener("timeupdate", function () {
        if (a.paused) { return; }
        var piNow = parseInt(pi, 10);
        var hit = player.idx >= 0 ? passageOf(player.idx) : null;
        if (hit && hit.pi === piNow) {
          var t2 = clipTiming(hit.p, player.idx);
          // 容差 0.15s：timeupdate 在低倍速下粒度较粗，允许略微过冲，但绝不提前切
          if (t2.end > t2.start && a.currentTime >= t2.end - 0.02) {
            if (loopLine === player.idx && loopTotal > 1) {
              loopDone += 1;
              if (loopDone >= loopTotal) {
                try { a.pause(); } catch (e) { /* 忽略 */ }
                setHint("第 " + (player.idx + 1) + " 句已循环 " + loopTotal + " 遍（" +
                  t2.start.toFixed(2) + "–" + t2.end.toFixed(2) + "s），自动停止", "ok");
                loopLine = -1;
                loopDone = 0;
              } else {
                markInternalSeek();
                try { a.currentTime = t2.start; } catch (e) { /* 忽略 */ }
                setHint("第 " + (player.idx + 1) + " 句循环中：第 " + (loopDone + 1) + " / " + loopTotal + " 遍", "");
              }
            } else {
              try { a.pause(); } catch (e) { /* 忽略 */ }
              setHint("第 " + (player.idx + 1) + " 句播完（" + t2.start.toFixed(2) + "–" + t2.end.toFixed(2) + "s）", "ok");
              loopLine = -1;
            }
          }
        }
        highlightLine(player.idx);
      });
      a.addEventListener("error", function () {
        setHint("本篇音频加载失败：" + (a.getAttribute("src") || ""), "warn");
      });
    });

    function playFromNode(el) {
      var i = parseInt(el.getAttribute("data-line") || el.getAttribute("data-line-play"), 10);
      if (isNaN(i)) return;
      var hit = passageOf(i);
      if (hit && hit.p.clip) { playClipAt(hit.pi, i); return; }
      if (useOrigAudio) { playOrigAt(i); return; }
      playLine(i);
    }
    root.querySelectorAll("[data-line]").forEach(function (el) {
      el.addEventListener("click", function () { playFromNode(el); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playFromNode(el); }
      });
    });
    root.querySelectorAll("[data-line-play]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        playFromNode(b);
      });
    });

    var submitCloze = root.querySelector("#submitCloze");
    if (submitCloze) {
      submitCloze.addEventListener("click", function () {
        var totalC = cloze.length, right = 0;
        cloze.forEach(function (c, ci) {
          var input = root.querySelector('[data-cloze-input="' + ci + '"]');
          var row = root.querySelector('[data-cloze-row="' + ci + '"]');
          var fb = root.querySelector('[data-cloze-fb="' + ci + '"]');
          var val = input && input.value ? input.value.trim() : "";
          var ok = !!val && (c.answers || []).some(function (a) { return normAns(a) === normAns(val); });
          if (ok) right += 1;
          if (row) { row.classList.toggle("ok", ok); row.classList.toggle("bad", !ok); }
          if (fb) {
            fb.textContent = ok ? "✓ 正确" : (val ? "✗ 正确写法：" + (c.answers || [])[0] : "未填写 · 正确写法：" + (c.answers || [])[0]);
            fb.className = "cloze-feedback" + (ok ? "" : " bad");
          }
        });
        var score = root.querySelector("#clozeScore");
        if (score) score.textContent = "本次得分 " + right + " / " + totalC;
        UI().toast("听写判分 " + right + " / " + totalC, right === totalC ? "success" : "warn");
      });
    }

    syncLoopUi();
    if (player.idx >= 0) {
      if (useOrigAudio) highlightLine(player.idx);
      else highlight(player.idx);
    }
  }

  function render(root) {
    loadAudioStore();
    if (!ui.exam) { renderGrid(root); return; }
    var entry = examEntry(ui.exam);
    if (!entry) { ui.exam = null; ui.mode = null; ui.setId = null; renderGrid(root); return; }
    ui.setId = entry.setId || null;
    if (ui.mode === "intensive") {
      if (!entry.set || !(entry.set.lines || []).length) renderIntensiveNoText(root, entry);
      else renderIntensive(root, entry);
      return;
    }
    if (entry.set) { renderDetail(root, entry.set); return; }
    renderOnlineFull(root, entry);
  }

  function destroy() {
    stopAll();
    ui.setId = null;
    ui.exam = null;
    ui.mode = null;
    draft = {};
    revealed = false;
    sourceMode = "tts";
    loopLine = -1;
    passLoop = -1;
  }

  CET.views = CET.views || {};
  CET.views.listening = {
    title: "听力练习", render: render, destroy: destroy,
    _parseAudioName: parseAudioName, _startBatch: startBatchImport
  };
})();
