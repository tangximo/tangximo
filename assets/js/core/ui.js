/* =========================================================
   通用 UI 工具：转义、Toast、发音、昵称头像
   发音策略（英音优先）：
   1. 单个单词优先请求有道词典英式音源（type=1，英音）
   2. 失败 / 离线 / 短语与整句 → 浏览器 SpeechSynthesis
   3. 语音合成优先挑选 en-GB（Google UK English、Microsoft Hazel 等），
      找不到英音时降级 en-US，并通过 voiceLabel() 在界面注明「美音降级」
   4. 连续点击同一按钮会先取消当前播放，避免叠音
   ========================================================= */
window.CET = window.CET || {};

(function () {
  function esc(str) {
    return String(str === undefined || str === null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toast(message, type, amount) {
    var host = document.getElementById("toastHost");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    var pt = amount ? '<span class="badge-pt">+' + amount + "</span>" : "";
    el.innerHTML = "<span>" + esc(message) + "</span>" + pt;
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () { el.remove(); }, 260);
    }, 2600);
  }

  /* ---------------- 语音选择（英音优先） ---------------- */

  var cachedVoice = null;
  var cachedChecked = false;
  var downgradeToasted = false;
  var roughToasted = false;
  var preferLocal = false; // 在线音源卡死过一次后，后续只用本机离线音色

  // 只挑本机（offline）音色：Chrome 的 Google 在线音源在断网 / file:// 下会
  // 出现 speaking=true 但 start/end 永不触发的「假播放」，也就是用户听到的没声音
  function localVoice() {
    var voices = window.speechSynthesis.getVoices() || [];
    var locals = voices.filter(function (v) { return v.localService; });
    var en = locals.filter(function (v) { return /^en/i.test(v.lang); });
    var gb = en.filter(function (v) { return /^en-GB/i.test(v.lang); })[0];
    if (gb) return { voice: gb, lang: "en-GB", fallback: false, rough: false, local: true };
    var us = en[0];
    if (us) return { voice: us, lang: us.lang || "en-US", fallback: !/en-GB/i.test(us.lang), rough: false, local: true };
    if (locals[0]) return { voice: locals[0], lang: locals[0].lang || "en", fallback: true, rough: true, local: true };
    return null;
  }

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    // 1) 本机英式英语
    var lv = localVoice();
    if (lv) return lv;

    var en = voices.filter(function (v) { return /^en/i.test(v.lang); });
    var gb = en.filter(function (v) { return /^en-GB/i.test(v.lang); })[0];
    if (gb) return { voice: gb, lang: "en-GB", fallback: false, rough: false, local: false };

    var preferredUS = en.filter(function (v) {
      return /Google US English|Microsoft (Aria|Jenny|Guy|Zira|David|Mark|Ryan)|Samantha|Alex/i.test(v.name);
    })[0];
    if (preferredUS) return { voice: preferredUS, lang: "en-US", fallback: true, rough: false, local: false };
    if (en[0]) return { voice: en[0], lang: en[0].lang || "en", fallback: true, rough: false, local: false };

    // 完全没有英语音色时，交给浏览器默认（lang 会挑一个）
    return null;
  }

  function getVoice() {
    if (preferLocal) return localVoice();
    if (!cachedChecked || !cachedVoice) {
      cachedVoice = pickVoice();
      cachedChecked = !!cachedVoice; // 语音列表为空时不缓存，下次调用重试
    }
    return cachedVoice;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = function () {
      cachedVoice = pickVoice();
      cachedChecked = true;
    };
  }

  function voiceLabel() {
    var v = getVoice();
    if (!v) return "英音语音";
    return v.fallback ? "美音降级" : "英音";
  }

  /* ---------------- 播放控制 ---------------- */

  var currentAudio = null;
  var currentBtn = null;
  var token = 0;
  var sharedAudio = null;
  var unlocked = false;
  var fallbackToasted = false;
  var ttsErrorToasted = false;

  // 1 秒静音 wav：用于首个用户手势解锁播放权限（iOS / Safari 必需）
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  function ensureAudio() {
    if (sharedAudio) return sharedAudio;
    sharedAudio = document.createElement("audio");
    sharedAudio.id = "speakAudio";
    sharedAudio.setAttribute("playsinline", "true");
    sharedAudio.setAttribute("webkit-playsinline", "true");
    sharedAudio.preload = "auto";
    // 必须挂载在 DOM 中（不能 display:none），否则部分浏览器无法播放
    sharedAudio.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(sharedAudio);
    return sharedAudio;
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      var a = ensureAudio();
      if (!a.src) {
        a.src = SILENT;
        var p = a.play();
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) { /* 忽略 */ }
  }
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  function setBtn(btn, on) {
    if (!btn) return;
    if (on) {
      btn.classList.add("playing");
      if (!btn.getAttribute("data-playing-label")) btn.setAttribute("data-playing-label", "播放中");
    } else {
      btn.classList.remove("playing");
    }
  }

  function stopSpeak() {
    token += 1;
    if (currentAudio) {
      try {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
        currentAudio.src = "";
      } catch (e) { /* 忽略 */ }
      currentAudio = null;
    }
    if (currentBtn) { setBtn(currentBtn, false); currentBtn = null; }
    // 只在真的有内容在播时才 cancel；无条件 cancel 会把同一 tick 里新排入的
    // utterance 一起取消，是「点了没声音」的主要根因之一
    if ("speechSynthesis" in window) {
      var syn = window.speechSynthesis;
      if (syn.speaking || syn.pending) {
        try { syn.cancel(); } catch (e) { /* 忽略 */ }
      }
    }
  }

  function speakTts(text, opts, btn, myToken) {
    if (!("speechSynthesis" in window)) {
      setBtn(btn, false);
      toast("当前浏览器不支持语音合成，请使用 Chrome / Edge", "warn");
      if (opts.onerror) opts.onerror(new Error("unsupported"));
      return null;
    }
    var synth = window.speechSynthesis;
    var v = getVoice();
    var started = false;
    var finished = false;

    function safeVoice() {
      var s = localVoice();
      if (s) return s;
      var vs = synth.getVoices() || [];
      if (vs[0]) {
        return { voice: vs[0], lang: vs[0].lang || "en", fallback: true, rough: !/^en/i.test(vs[0].lang), local: !!vs[0].localService };
      }
      return null;
    }

    function done(err, msg) {
      if (finished) return;
      finished = true;
      if (myToken !== token) return;
      if (btn) setBtn(btn, false);
      if (msg && !ttsErrorToasted) {
        ttsErrorToasted = true;
        toast(msg, "warn");
      }
      if (err && opts.onerror) opts.onerror(err);
      if (opts.onend) opts.onend(err);
    }

    function attempt(voiceObj, retried) {
      if (myToken !== token) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = voiceObj && voiceObj.lang ? voiceObj.lang : "en-GB";
      u.rate = opts.rate || 0.92;
      u.pitch = opts.pitch || 1;
      u.volume = opts.volume === undefined ? 1 : opts.volume;
      if (voiceObj && voiceObj.voice) u.voice = voiceObj.voice;

      var watch = null;
      function clearWatch() { if (watch) { clearTimeout(watch); watch = null; } }

      u.onstart = function () {
        started = true;
        clearWatch();
        if (myToken !== token) return;
        if (opts.onstart) opts.onstart();
      };
      u.onend = function () {
        clearWatch();
        if (myToken !== token) return;
        if (btn) setBtn(btn, false);
        if (opts.onend) opts.onend();
      };
      u.onerror = function (e) {
        var kind = (e && e.error) || "error";
        if (kind === "interrupted" || kind === "canceled") return;
        clearWatch();
        if (kind === "not-allowed") {
          done(new Error(kind), "浏览器拦截了自动播放，请再点一次播放按钮");
          return;
        }
        if (!retried) { retry(); return; }
        done(new Error(kind), "本机语音合成失败，请检查系统语音包");
      };

      function retry() {
        var s = safeVoice();
        var same = voiceObj && voiceObj.voice && s && s.voice && s.voice.voiceURI === voiceObj.voice.voiceURI;
        if (s && s.voice && !same) {
          preferLocal = true;      // 之后所有朗读都直接用本机音色，不再走在线音源
          cachedVoice = s;
          cachedChecked = true;
          attempt(s, true);
          return;
        }
        done(new Error("no-start"), "没能发出声音：本机没有可用的英文语音，请在系统里安装英文语音包");
      }

      try {
        synth.speak(u);
      } catch (e) {
        done(e, "语音合成启动失败");
        return;
      }

      // 关键兜底：Chrome 的在线音源（Google UK English 等）在断网 / file:// 下
      // 会 speaking=true 却永不触发 start，表面在播实际没声音，必须取消并回退本机音色
      var waitMs = retried ? 1500 : (voiceObj && voiceObj.local ? 1600 : 1200);
      watch = setTimeout(function () {
        if (started || myToken !== token || finished) return;
        if (synth.speaking || synth.pending) {
          try { synth.cancel(); } catch (e) { /* 忽略 */ }
          if (!retried) { retry(); return; }
          done(new Error("stalled"), "语音卡住了，没能发出声音，请安装英文语音包后再试");
          return;
        }
        if (!retried) { retry(); return; }
        done(new Error("no-start"), "没能发出声音，请安装英文语音包后再试");
      }, waitMs);
    }

    if (v && v.rough && !roughToasted) {
      roughToasted = true;
      toast("未检测到英文语音，暂用系统默认音色朗读（可安装英文语音包）", "warn");
    } else if (v && v.fallback && !downgradeToasted) {
      downgradeToasted = true;
      toast("当前设备没有英式语音，已降级为美音朗读", "warn");
    }

    function go() {
      if (myToken !== token) return;
      attempt(v, false);
    }

    // 关键：同一 tick 内 cancel() + speak() 会被 Chrome 一起取消。
    // 真有内容在播时先取消，等 90ms 让它完成清理再排入新句。
    if (synth.speaking || synth.pending) {
      try { synth.cancel(); } catch (e) { /* 忽略 */ }
      setTimeout(go, 90);
    } else {
      go();
    }
    return null;
  }

  function playYoudao(text, opts, btn, myToken) {
    var url = "https://dict.youdao.com/dictvoice?audio=" + encodeURIComponent(text) + "&type=1";
    var audio;
    try {
      // 必须用已挂载的共享 audio 元素：new Audio() 不挂 DOM 时，
      // Safari / iOS 以及部分 Chrome 情况下会拒绝播放
      audio = ensureAudio();
    } catch (e) {
      return speakTts(text, opts, btn, myToken);
    }
    var fallbackCalled = false;

    function fail(reason) {
      if (fallbackCalled) return;
      fallbackCalled = true;
      if (myToken !== token) return;
      try {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      } catch (e) { /* 忽略 */ }
      if (currentAudio === audio) currentAudio = null;
      if (!fallbackToasted) {
        fallbackToasted = true;
        toast("在线音源不可用，已切换本地英音朗读", "warn");
      }
      if (opts.onfallback) opts.onfallback(reason);
      // 失败不能吞掉：立即回退到系统英音，保证用户仍能听到声音
      speakTts(text, opts, btn, myToken);
    }

    try {
      audio.onended = function () {
        if (myToken !== token) return;
        if (currentAudio === audio) currentAudio = null;
        if (btn) setBtn(btn, false);
        if (opts.onend) opts.onend();
      };
      audio.onerror = function () { fail("error"); };
      audio.playbackRate = Math.max(0.5, Math.min(1.4, (opts.rate || 0.92) + 0.06));
      audio.volume = opts.volume === undefined ? 1 : opts.volume;
      audio.src = url;
      currentAudio = audio;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { fail("blocked"); });
    } catch (e) {
      fail("exception");
      return audio;
    }

    // 网络不可用时 play() 可能长时间不返回，超时立即回退，避免「点了没反应」
    setTimeout(function () {
      if (fallbackCalled) return;
      if (myToken !== token) return;
      if (!audio.readyState || audio.readyState < 2) fail("timeout");
    }, 1400);

    return audio;
  }

  function speak(text, opts) {
    opts = opts || {};
    var content = String(text || "").trim();
    if (!content) return null;
    stopSpeak();
    var myToken = token;
    var btn = opts.btn || null;
    if (btn) {
      currentBtn = btn;
      setBtn(btn, true);
    }
    // 单个单词优先走有道英式音源；短语/整句仍用语音合成
    if (opts.word && !/\s/.test(content)) {
      return playYoudao(content, opts, btn, myToken);
    }
    return speakTts(content, opts, btn, myToken);
  }

  function initials(name) {
    name = String(name || "同学").trim();
    return name.slice(0, 2);
  }

  function normalizeBlank(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[.,!?;:'"“”‘’]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function mmss(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return pad2(Math.floor(sec / 60)) + ":" + pad2(sec % 60);
  }

  var TYPE_ABBR = {
    vocab: "词", grammar: "语", listening: "听", speaking: "说", checkin: "卡", group: "组", system: "奖"
  };

  CET.ui = {
    esc: esc,
    toast: toast,
    speak: speak,
    stopSpeak: stopSpeak,
    voiceLabel: voiceLabel,
    initials: initials,
    normalizeBlank: normalizeBlank,
    mmss: mmss,
    typeAbbr: function (t) { return TYPE_ABBR[t] || "学"; }
  };
})();
