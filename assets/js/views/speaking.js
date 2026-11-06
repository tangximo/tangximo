/* 口语练习：话题卡 + 录音 + 语音识别 + 自评 */
window.CET = window.CET || {};

(function () {
  var UI = function () { return CET.ui; };
  var ui = { topicId: null, showSample: false };
  var rec = { active: false, stream: null, recorder: null, chunks: [], timer: null, seconds: 0, url: null, recognizing: false };
  var recognition = null;

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
    '<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/>' +
    '<path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
  var STOP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  function topicOf(id) {
    return CET.data.speaking.filter(function (t) { return t.id === id; })[0];
  }

  function stopRecording() {
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    if (rec.recorder && rec.recorder.state !== "inactive") {
      try { rec.recorder.stop(); } catch (e) {}
    }
    if (rec.stream) {
      rec.stream.getTracks().forEach(function (t) { t.stop(); });
      rec.stream = null;
    }
    rec.active = false;
  }

  function stopRecognition() {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    rec.recognizing = false;
  }

  function waveHtml(on) {
    var bars = "";
    for (var i = 0; i < 12; i++) bars += "<i></i>";
    return '<div class="wave ' + (on ? "on" : "") + '">' + bars + "</div>";
  }

  function renderTopicGrid(root) {
    var s = CET.store.state;
    s.speaking.ratings = s.speaking.ratings || {};

    var cards = CET.data.speaking.map(function (t) {
      var rated = s.speaking.ratings[t.id];
      var done = s.speaking.recorded[t.id];
      return '<div class="card flat hover-lift topic-card" data-topic="' + t.id + '" role="button" tabindex="0">' +
        '<div class="row between">' +
          '<span class="tag ' + (t.level === "CET4" ? "accent" : "teal") + '">' + (t.level === "CET4" ? "四级" : "六级") + "</span>" +
          '<span class="tag ' + (done ? "success" : "") + '">' + (done ? "已录音" : "未练习") + "</span>" +
        "</div>" +
        "<h3>" + UI().esc(t.title) + "</h3>" +
        '<p class="muted">' + UI().esc(t.prompt) + "</p>" +
        '<div class="topic-foot"><span class="tiny dim">' + UI().esc(t.subtitle) + "</span>" +
          '<span class="tiny" style="color:var(--accent)">' + (rated ? "自评 " + rated.score + "/5" : "开始练习 →") + "</span></div>" +
      "</div>";
    }).join("");

    root.innerHTML = '<div class="view-enter">' +
      '<div class="card" style="margin-bottom:18px">' +
        '<div class="row between wrap">' +
          '<div><h3 style="font-size:15px">口语话题卡</h3>' +
          '<p class="tiny dim">先看关键词，再录音作答，最后对照示范答案自评。录音需要浏览器授权麦克风。</p></div>' +
          '<span class="tag teal">共 ' + CET.data.speaking.length + " 个话题</span>" +
        "</div>" +
      "</div>" +
      '<div class="grid grid-auto">' + cards + "</div>" +
      '<div class="card" style="margin-top:18px">' +
        '<p class="tiny dim">提示：Chrome / Edge 支持 MediaRecorder 录音与 Web Speech 识别；若通过 file:// 直接打开时麦克风被拦截，请用本地 http 服务访问（见交付说明）。</p>' +
      "</div>" +
    "</div>";

    root.querySelectorAll("[data-topic]").forEach(function (b) {
      var open = function () {
        ui.topicId = b.getAttribute("data-topic");
        ui.showSample = false;
        CET.app.rerender();
      };
      b.addEventListener("click", open);
      b.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  function renderTopicDetail(root, t) {
    var s = CET.store.state;
    s.speaking.recorded = s.speaking.recorded || {};
    s.speaking.ratings = s.speaking.ratings || {};
    var saved = s.speaking.ratings[t.id];
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    var keywordsHtml = t.keywords.map(function (k) {
      return '<span class="keyword"><b>' + UI().esc(k.en) + "</b><span>" + UI().esc(k.cn) + "</span></span>";
    }).join("");

    var rubricHtml = t.rubric.map(function (item, i) {
      var checked = saved && saved.checks && saved.checks.indexOf(i) > -1;
      return '<label class="rubric-item' + (checked ? " checked" : "") + '">' +
        '<input type="checkbox" data-rub="' + i + '"' + (checked ? " checked" : "") + " />" +
        "<span>" + UI().esc(item) + "</span></label>";
    }).join("");

    root.innerHTML = '<div class="view-enter">' +
      '<div class="row" style="margin-bottom:14px;gap:10px">' +
        '<button class="btn sm ghost" id="backTopics" type="button">← 话题列表</button>' +
        '<div class="spacer"></div>' +
        '<span class="tag ' + (t.level === "CET4" ? "accent" : "teal") + '">' + (t.level === "CET4" ? "四级" : "六级") + "</span>" +
        (saved ? '<span class="tag success">已自评 ' + saved.score + "/5</span>" : "") +
        (s.speaking.recorded[t.id] ? '<span class="tag success">已录音</span>' : "") +
      "</div>" +

      '<div class="topic-detail-hero">' +
        '<span class="tag">' + UI().esc(t.subtitle) + "</span>" +
        "<h2>" + UI().esc(t.title) + "</h2>" +
        "<p>" + UI().esc(t.prompt) + "</p>" +
      "</div>" +

      '<div class="grid grid-2 section">' +
        '<div class="card">' +
          '<div class="row between" style="margin-bottom:10px"><h3 style="font-size:15px">关键词提示</h3>' +
            '<button class="btn sm ghost" id="sampleBtn" type="button">' + (ui.showSample ? "收起示范" : "查看示范答案") + "</button></div>" +
          '<div class="keywords">' + keywordsHtml + "</div>" +
          '<p class="tiny dim" style="margin-top:12px">' + UI().esc(t.tip) + "</p>" +
          (ui.showSample
            ? '<div class="sample-text" style="margin-top:14px">' + UI().esc(t.sample) +
              '<div class="cn">' + UI().esc(t.sampleCn) + "</div>" +
              '<div class="row" style="margin-top:10px"><button class="speak-btn sm" id="sampleSpeak" type="button">' + MIC + "</button>" +
              '<span class="tiny dim">播放示范答案</span></div></div>'
            : "") +
        "</div>" +

        '<div class="card">' +
          '<div class="row between" style="margin-bottom:12px"><h3 style="font-size:15px">录音作答</h3>' +
            '<span class="tag ' + (s.speaking.recorded[t.id] ? "success" : "") + '">' + (s.speaking.recorded[t.id] ? "已完成首次录音" : "首次录音 +10 分") + "</span></div>" +
          '<div class="recorder">' +
            '<button class="rec-btn' + (rec.active ? " on" : "") + '" id="recBtn" type="button" title="' + (rec.active ? "停止录音" : "开始录音") + '">' +
              (rec.active ? STOP : MIC) + "</button>" +
            '<div class="rec-meta"><strong id="recState">' + (rec.active ? "正在录音…" : "点击麦克风开始") + "</strong>" +
              '<p id="recHint">' + (rec.url ? "已有一段录音，可回放" : "建议 45-60 秒，先想结构再开口") + "</p></div>" +
            '<div class="rec-time" id="recTime">' + CET.ui.mmss(rec.seconds) + "</div>" +
            waveHtml(rec.active) +
          "</div>" +
          (rec.url
            ? '<div class="rec-result" style="margin-top:12px"><audio controls src="' + rec.url + '"></audio>' +
              '<p class="tiny dim">这是你刚才的录音，回放时注意语调与停顿。</p></div>'
            : "") +
          '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
            '<button class="btn sm" id="asrBtn" type="button"' + (SR ? "" : " disabled") + ">" +
              (rec.recognizing ? "停止识别" : "语音识别（试验）") + "</button>" +
            '<span class="tiny dim">' + (SR ? "识别结果仅作参考，部分浏览器需要联网" : "当前浏览器不支持 Web Speech 识别") + "</span>" +
          "</div>" +
          '<div class="rec-transcript" id="recTranscript" style="margin-top:10px">' + UI().esc(rec.transcript || "识别文本会显示在这里…") + "</div>" +
          '<p class="tiny dim" style="margin-top:10px">录音与识别均为浏览器本地能力，不上传服务器。若麦克风无响应，请在地址栏权限设置中允许。</p>' +
        "</div>" +
      "</div>" +

      '<div class="card">' +
        '<div class="row between wrap" style="margin-bottom:12px"><h3 style="font-size:15px">自我评分清单</h3>' +
          '<span class="tiny dim">按实际表现勾选，生成自评分（≥4 分可获额外积分）</span></div>' +
        '<div class="rubric" id="rubricBox">' + rubricHtml + "</div>" +
        '<div class="row" style="margin-top:14px;gap:10px;flex-wrap:wrap">' +
          '<button class="btn primary" id="rateBtn" type="button">提交自评</button>' +
          (saved ? '<span class="tag success">上次自评 ' + saved.score + " / 5</span>" : "") +
          '<div class="spacer"></div>' +
          '<span class="tiny dim" id="rubricScore">已勾选 0 项</span>' +
        "</div>" +
      "</div>" +

      '<div class="card" style="margin-top:16px">' +
        '<h3 style="font-size:14px;margin-bottom:8px">可能的追问</h3>' +
        '<ul class="muted small" style="margin:0;padding-left:18px;line-height:1.9">' +
          t.followups.map(function (f) { return "<li>" + UI().esc(f) + "</li>"; }).join("") +
        "</ul>" +
      "</div>" +
    "</div>";

    root.querySelector("#backTopics").addEventListener("click", function () {
      stopRecording();
      stopRecognition();
      ui.topicId = null;
      CET.app.rerender();
    });

    root.querySelector("#sampleBtn").addEventListener("click", function () {
      ui.showSample = !ui.showSample;
      CET.app.rerender();
    });

    var ss = root.querySelector("#sampleSpeak");
    if (ss) ss.addEventListener("click", function () { UI().speak(t.sample, { rate: 0.86, btn: ss }); });

    var recBtn = root.querySelector("#recBtn");
    recBtn.addEventListener("click", function () {
      if (rec.active) { stopRecording(); return; }
      startRecording(t);
    });

    var asrBtn = root.querySelector("#asrBtn");
    asrBtn.addEventListener("click", function () {
      if (!SR) { UI().toast("当前浏览器不支持语音识别", "warn"); return; }
      if (rec.recognizing) { stopRecognition(); updateAsr(); return; }
      startRecognition(t);
    });

    var rubricBox = root.querySelector("#rubricBox");
    function updateScoreLabel() {
      var n = rubricBox.querySelectorAll("input:checked").length;
      var label = root.querySelector("#rubricScore");
      if (label) label.textContent = "已勾选 " + n + " 项 / 共 " + t.rubric.length + " 项";
    }
    rubricBox.querySelectorAll(".rubric-item input").forEach(function (input) {
      input.addEventListener("change", function () {
        input.closest(".rubric-item").classList.toggle("checked", input.checked);
        updateScoreLabel();
      });
    });
    updateScoreLabel();

    root.querySelector("#rateBtn").addEventListener("click", function () {
      var checked = [];
      rubricBox.querySelectorAll("input:checked").forEach(function (i) {
        checked.push(parseInt(i.getAttribute("data-rub"), 10));
      });
      var score = checked.length;
      if (!score) { UI().toast("请至少勾选一项再提交", "warn"); return; }
      var s = CET.store.state;
      var prev = s.speaking.ratings[t.id];
      s.speaking.ratings[t.id] = { score: score, checks: checked, at: Date.now() };
      var earned = 0;
      if (score >= 4 && (!prev || prev.score < 4) && s.speaking.recorded[t.id]) {
        earned = 5;
        CET.store.addPoints(5, "speaking", "口语自评达标 · " + t.title);
      }
      CET.store.save();
      CET.ui.toast("自评已保存：" + score + " / " + t.rubric.length, "success", earned);
      CET.app.refreshChrome();
      CET.app.rerender();
    });

    function updateAsr() {
      var b = root.querySelector("#asrBtn");
      if (!b) return;
      b.textContent = rec.recognizing ? "停止识别" : "语音识别（试验）";
      b.classList.toggle("success", rec.recognizing);
    }

    function startRecognition(tp) {
      try {
        recognition = new SR();
      } catch (e) {
        UI().toast("语音识别初始化失败", "error");
        return;
      }
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;
      rec.recognizing = true;
      updateAsr();
      var box = root.querySelector("#recTranscript");
      if (box) box.textContent = "正在聆听…（请说英文）";
      recognition.onresult = function (e) {
        var all = "";
        for (var i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) all += e.results[i][0].transcript + " ";
        }
        all = all.replace(/\s+/g, " ").trim();
        rec.transcript = all;
        if (box) box.textContent = all || "正在聆听…（请说英文）";
      };
      recognition.onerror = function (e) {
        rec.recognizing = false;
        updateAsr();
        var msg = e.error === "not-allowed" ? "麦克风权限被拒绝" :
          e.error === "network" ? "识别服务需要联网，暂不可用" : "识别失败：" + e.error;
        UI().toast(msg, "warn");
      };
      recognition.onend = function () {
        rec.recognizing = false;
        updateAsr();
        if (box && rec.transcript) box.textContent = rec.transcript;
      };
      try {
        recognition.start();
        UI().toast("开始语音识别，朗读后会自动显示文本", "success");
      } catch (e) {
        UI().toast("语音识别启动失败", "error");
      }
    }

    function startRecording(tp) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        UI().toast("当前环境不支持录音，请使用 Chrome / Edge 并通过 http 访问", "warn");
        return;
      }
      if (!window.MediaRecorder) {
        UI().toast("当前浏览器不支持 MediaRecorder", "warn");
        return;
      }
      UI().toast("正在请求麦克风权限…", "success");
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        rec.stream = stream;
        rec.chunks = [];
        rec.recorder = new MediaRecorder(stream);
        rec.recorder.ondataavailable = function (e) {
          if (e.data && e.data.size) rec.chunks.push(e.data);
        };
        rec.recorder.onstop = function () {
          var blob = new Blob(rec.chunks, { type: "audio/webm" });
          if (rec.url) URL.revokeObjectURL(rec.url);
          rec.url = URL.createObjectURL(blob);
          if (rec.stream) {
            rec.stream.getTracks().forEach(function (tr) { tr.stop(); });
            rec.stream = null;
          }
          var st = CET.store.state;
          st.speaking.recorded = st.speaking.recorded || {};
          if (!st.speaking.recorded[tp.id]) {
            st.speaking.recorded[tp.id] = true;
            CET.store.addPoints(10, "speaking", "口语录音 · " + tp.title);
            CET.ui.toast("录音完成，已保存本次表现", "success", 10);
          } else {
            CET.ui.toast("录音完成，可以回放检查", "success");
          }
          CET.store.save();
          CET.app.refreshChrome();
          CET.app.rerender();
        };
        rec.recorder.start();
        rec.active = true;
        rec.seconds = 0;
        var btn = root.querySelector("#recBtn");
        if (btn) {
          btn.classList.add("on");
          btn.innerHTML = STOP;
          btn.title = "停止录音";
        }
        var stateEl = root.querySelector("#recState");
        if (stateEl) stateEl.textContent = "正在录音…";
        var wave = root.querySelector(".wave");
        if (wave) wave.classList.add("on");
        var timeEl = root.querySelector("#recTime");
        if (rec.timer) clearInterval(rec.timer);
        rec.timer = setInterval(function () {
          rec.seconds += 1;
          if (timeEl) timeEl.textContent = CET.ui.mmss(rec.seconds);
          if (rec.seconds >= 120) {
            stopRecording();
            if (btn) {
              btn.classList.remove("on");
              btn.innerHTML = MIC;
            }
            if (wave) wave.classList.remove("on");
            if (stateEl) stateEl.textContent = "已达 2 分钟上限，正在保存…";
          }
        }, 1000);
      }).catch(function (err) {
        console.warn(err);
        UI().toast("无法访问麦克风：请允许浏览器权限，或改用本地 http 服务访问", "error");
      });
    }
  }

  function render(root) {
    var t = ui.topicId ? topicOf(ui.topicId) : null;
    if (t) renderTopicDetail(root, t);
    else renderTopicGrid(root);
  }

  function destroy() {
    stopRecording();
    stopRecognition();
    CET.ui.stopSpeak();
  }

  CET.views = CET.views || {};
  CET.views.speaking = { title: "口语练习", render: render, destroy: destroy };
})();
