/* =========================================================
   本地状态与积分引擎
   所有数据保存在 localStorage（键名 cetstudy.v1）
   ---------------------------------------------------------
   本轮新增：
   - 每日 20 词打卡（完成 20 词才可打卡）
   - 小组人数上限 10 人（含满员演示小组）
   ========================================================= */
window.CET = window.CET || {};

(function () {
  var KEY = "cetstudy.v1";
  var DAILY_WORDS = 20;
  var MAX_MEMBERS = 10;

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function weekStartKey() {
    var d = new Date();
    var day = (d.getDay() + 6) % 7; // 周一为一周起点
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return dateKey(d);
  }
  function weekStartTs() {
    var parts = weekStartKey().split("-");
    return new Date(+parts[0], +parts[1] - 1, +parts[2]).getTime();
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function clock(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  var LEVELS = [
    { name: "初学新芽", min: 0 },
    { name: "词汇学徒", min: 120 },
    { name: "词句进阶", min: 300 },
    { name: "听力行者", min: 600 },
    { name: "口语达人", min: 1000 },
    { name: "考级大师", min: 1600 },
    { name: "传奇学霸", min: 2600 }
  ];

  var TYPE_LABEL = {
    vocab: "背单词",
    grammar: "语法练习（历史）",
    listening: "听力练习",
    speaking: "口语练习",
    checkin: "每日打卡",
    group: "小组互动",
    system: "系统奖励"
  };

  function emptyDaily() {
    return { date: dateKey(), ids: [], marks: {}, complete: false, completedAt: null };
  }

  function demoGroup(userName) {
    return {
      id: "g_demo",
      name: "CET 冲刺小组",
      code: "CET666",
      owner: "林晓",
      createdAt: Date.now(),
      demo: true,
      members: [
        { id: "m_lin", name: "林晓", points: 1420, todayPoints: 45, streak: 12, checkedToday: true, demo: true },
        { id: "m_chen", name: "陈一鸣", points: 980, todayPoints: 30, streak: 5, checkedToday: true, demo: true },
        { id: "m_zhou", name: "周雨桐", points: 760, todayPoints: 0, streak: 3, checkedToday: false, demo: true },
        { id: "m_wang", name: "王浩然", points: 520, todayPoints: 20, streak: 2, checkedToday: true, demo: true },
        { id: "m_sun", name: "孙嘉禾", points: 430, todayPoints: 15, streak: 4, checkedToday: true, demo: true },
        { id: "m_me", name: userName || "备考同学", isMe: true, points: 0, todayPoints: 0, streak: 0, checkedToday: false }
      ]
    };
  }

  function fullDemoGroup() {
    return {
      id: "g_full",
      name: "满员示例小组",
      code: "CET10",
      owner: "许知远",
      createdAt: Date.now(),
      demo: true,
      members: [
        { id: "m_f1", name: "许知远", points: 1680, todayPoints: 40, streak: 15, checkedToday: true, demo: true },
        { id: "m_f2", name: "何以安", points: 1510, todayPoints: 35, streak: 9, checkedToday: true, demo: true },
        { id: "m_f3", name: "沈书言", points: 1330, todayPoints: 25, streak: 7, checkedToday: false, demo: true },
        { id: "m_f4", name: "陆星河", points: 1120, todayPoints: 20, streak: 6, checkedToday: true, demo: true },
        { id: "m_f5", name: "宋清越", points: 960, todayPoints: 30, streak: 5, checkedToday: true, demo: true },
        { id: "m_f6", name: "顾南乔", points: 830, todayPoints: 10, streak: 4, checkedToday: false, demo: true },
        { id: "m_f7", name: "苏念白", points: 740, todayPoints: 18, streak: 3, checkedToday: true, demo: true },
        { id: "m_f8", name: "江迟", points: 620, todayPoints: 12, streak: 3, checkedToday: true, demo: true },
        { id: "m_f9", name: "温言", points: 480, todayPoints: 8, streak: 2, checkedToday: false, demo: true },
        { id: "m_f10", name: "白露", points: 350, todayPoints: 5, streak: 1, checkedToday: true, demo: true }
      ]
    };
  }

  function seedState() {
    var name = "备考同学";
    return {
      version: 2,
      theme: "dark",
      user: { name: name, joinedAt: Date.now() },
      points: {
        total: 20,
        log: [
          { id: uid(), type: "system", note: "首次进入学习岛 · 新手奖励", amount: 20, at: Date.now() }
        ]
      },
      vocab: {
        status: {},
        rewarded: {},
        daily: emptyDaily(),
        dailyCompleteDates: [],
        extraDate: "",
        extraIndex: 0
      },
      grammar: { attempts: 0, correct: 0, solved: {}, wrongIds: [] }, // 仅保留历史数据，模块已下线
      listening: { setsDone: [], answers: {}, clozeDone: {}, linesPlayed: 0, links: {} },
      speaking: { recorded: {}, ratings: {} },
      checkin: { last: null, streak: 0, days: [] },
      groups: { currentId: "g_demo", list: [demoGroup(name), fullDemoGroup()] },
      settings: { dailyGoal: 60 }
    };
  }

  function normalize(raw) {
    var base = seedState();
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(raw || {}).forEach(function (k) {
      var v = raw[k];
      if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
        out[k] = Object.assign({}, base[k], v);
      } else {
        out[k] = v;
      }
    });
    if (!out.groups || !Array.isArray(out.groups.list) || !out.groups.list.length) {
      out.groups = base.groups;
    } else {
      // 补齐满员演示小组，便于验证 10 人上限
      var hasFull = out.groups.list.some(function (g) { return g.id === "g_full"; });
      if (!hasFull) out.groups.list.push(fullDemoGroup());
    }
    if (!out.groups.currentId) out.groups.currentId = out.groups.list[0].id;
    if (!out.points || !Array.isArray(out.points.log)) out.points = base.points;
    if (!out.vocab || typeof out.vocab !== "object" || Array.isArray(out.vocab)) out.vocab = base.vocab;
    if (!out.vocab.rewarded) out.vocab.rewarded = {};
    if (!out.vocab.daily || typeof out.vocab.daily !== "object") out.vocab.daily = emptyDaily();
    if (!Array.isArray(out.vocab.dailyCompleteDates)) out.vocab.dailyCompleteDates = [];
    if (!out.vocab.daily.marks) out.vocab.daily.marks = {};
    if (!Array.isArray(out.vocab.daily.ids)) out.vocab.daily.ids = [];
    if (!out.listening || typeof out.listening !== "object" || Array.isArray(out.listening)) out.listening = base.listening;
    if (!out.listening.links || typeof out.listening.links !== "object" || Array.isArray(out.listening.links)) out.listening.links = {};
    return out;
  }

  var state;
  try {
    var rawStr = localStorage.getItem(KEY);
    state = rawStr ? normalize(JSON.parse(rawStr)) : seedState();
  } catch (e) {
    console.warn("本地数据读取失败，已重置为演示数据", e);
    state = seedState();
  }

  function currentGroup() {
    var g = state.groups.list.filter(function (x) { return x.id === state.groups.currentId; })[0];
    return g || state.groups.list[0] || null;
  }

  function todayPoints() {
    var key = dateKey();
    return state.points.log.reduce(function (sum, item) {
      return dateKey(new Date(item.at)) === key ? sum + item.amount : sum;
    }, 0);
  }

  function weekPoints() {
    var t = weekStartTs();
    return state.points.log.reduce(function (sum, item) {
      return item.at >= t ? sum + item.amount : sum;
    }, 0);
  }

  function syncMe() {
    var g = currentGroup();
    if (!g) return;
    var me = g.members.filter(function (m) { return m.isMe; })[0];
    if (!me) return;
    me.name = state.user.name;
    me.points = state.points.total;
    me.todayPoints = todayPoints();
    me.streak = state.checkin.streak;
    me.checkedToday = state.checkin.last === dateKey();
  }

  function save() {
    try {
      syncMe();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("本地数据保存失败（可能是隐私模式或空间不足）", e);
    }
  }

  function addPoints(amount, type, note) {
    if (!amount) return;
    state.points.total += amount;
    state.points.log.unshift({
      id: uid(),
      type: type || "system",
      note: note || "学习奖励",
      amount: amount,
      at: Date.now()
    });
    if (state.points.log.length > 300) state.points.log.length = 300;
    save();
    if (CET.app && CET.app.refreshChrome) CET.app.refreshChrome();
  }

  function levelInfo(total) {
    total = total === undefined ? state.points.total : total;
    var idx = 0;
    LEVELS.forEach(function (lv, i) { if (total >= lv.min) idx = i; });
    var cur = LEVELS[idx];
    var next = LEVELS[idx + 1];
    var pct = next ? Math.round(((total - cur.min) / (next.min - cur.min)) * 100) : 100;
    pct = Math.max(0, Math.min(100, pct));
    return {
      level: idx + 1,
      name: cur.name,
      nextName: next ? next.name : null,
      nextAt: next ? next.min : null,
      pct: pct,
      rest: next ? next.min - total : 0
    };
  }

  function masteredCount() {
    return Object.keys(state.vocab.status).filter(function (k) {
      return state.vocab.status[k] === "mastered";
    }).length;
  }

  function unknownCount() {
    return Object.keys(state.vocab.status).filter(function (k) {
      return state.vocab.status[k] === "unknown";
    }).length;
  }

  /* ---------- 每日 20 词 ---------- */

  function allWords() {
    return (CET.data && CET.data.words) || [];
  }

  function pickDailyIds(count) {
    var used = {};
    (state.vocab.daily.ids || []).forEach(function (id) { used[id] = true; });
    var pool4 = [];
    var pool6 = [];
    allWords().forEach(function (w) {
      if (state.vocab.status[w.id] === "mastered") return;
      if (state.vocab.status[w.id] && state.vocab.status[w.id] !== "new") return; // 已学过的不再进入新词计划
      if (used[w.id]) return;
      (w.level === "CET4" ? pool4 : pool6).push(w.id);
    });
    var out = [];
    var half = Math.ceil(count / 2);
    pool4.slice(0, half).forEach(function (id) { out.push(id); });
    pool6.slice(0, count - out.length).forEach(function (id) { out.push(id); });
    if (out.length < count) {
      pool4.slice(half).concat(pool4.slice(0, half)).forEach(function (id) {
        if (out.length < count && out.indexOf(id) === -1) out.push(id);
      });
    }
    if (out.length < count) {
      allWords().forEach(function (w) {
        if (out.length < count && out.indexOf(w.id) === -1 && state.vocab.status[w.id] !== "mastered") out.push(w.id);
      });
    }
    return out.slice(0, count);
  }

  function ensureDaily() {
    var today = dateKey();
    var d = state.vocab.daily;
    if (!d || d.date !== today || !Array.isArray(d.ids) || !d.ids.length) {
      d = emptyDaily();
      d.ids = pickDailyIds(DAILY_WORDS);
      state.vocab.daily = d;
      save();
    }
    return d;
  }

  function dailyProgress() {
    var d = ensureDaily();
    var done = Object.keys(d.marks || {}).length;
    var total = d.ids.length || DAILY_WORDS;
    var nextId = null;
    for (var i = 0; i < d.ids.length; i++) {
      if (!d.marks[d.ids[i]]) { nextId = d.ids[i]; break; }
    }
    return {
      date: d.date,
      ids: d.ids,
      marks: d.marks,
      total: total,
      done: Math.min(done, total),
      percent: total ? Math.round((Math.min(done, total) / total) * 100) : 0,
      remaining: Math.max(0, total - done),
      complete: !!d.complete || done >= total,
      nextId: nextId
    };
  }

  function wordById(id) {
    return allWords().filter(function (w) { return w.id === id; })[0] || null;
  }

  function markDailyWord(id, status) {
    var d = ensureDaily();
    if (d.marks[id]) return { ok: false, reason: "duplicate" };
    var word = wordById(id);
    d.marks[id] = status;
    var prev = state.vocab.status[id];
    state.vocab.status[id] = status;
    var reward = state.vocab.rewarded[id] || (state.vocab.rewarded[id] = {});
    var gained = 0;
    var pts = status === "mastered" ? 5 : status === "fuzzy" ? 3 : 1;
    if (!reward[status]) {
      reward[status] = true;
      addPoints(pts, "vocab", (status === "mastered" ? "掌握单词 · " : status === "fuzzy" ? "模糊复习 · " : "记录生词 · ") + (word ? word.word : id));
      gained += pts;
    }
    var done = Object.keys(d.marks).length;
    var result = { ok: true, points: gained, prev: prev, done: done, total: d.ids.length, completed: false, checkin: null };
    if (done >= d.ids.length && !d.complete) {
      d.complete = true;
      d.completedAt = Date.now();
      if (state.vocab.dailyCompleteDates.indexOf(dateKey()) === -1) {
        state.vocab.dailyCompleteDates.push(dateKey());
      }
      addPoints(20, "vocab", "今日 20 词打卡完成");
      gained += 20;
      result.points = gained;
      result.completed = true;
      result.checkin = performCheckin();
      CET.ui.toast("今日 20 词完成，单词打卡成功！", "success", gained + (result.checkin && result.checkin.ok ? result.checkin.points : 0));
    }
    save();
    if (CET.app && CET.app.refreshChrome) CET.app.refreshChrome();
    return result;
  }

  function markWord(id, status) {
    var word = wordById(id);
    var prev = state.vocab.status[id];
    if (prev === status) return { ok: false, reason: "same" };
    state.vocab.status[id] = status;
    var reward = state.vocab.rewarded[id] || (state.vocab.rewarded[id] = {});
    var pts = status === "mastered" ? 5 : status === "fuzzy" ? 3 : 1;
    var gained = 0;
    if (!reward[status]) {
      reward[status] = true;
      addPoints(pts, "vocab", (status === "mastered" ? "掌握单词 · " : status === "fuzzy" ? "模糊复习 · " : "记录生词 · ") + (word ? word.word : id));
      gained = pts;
    }
    save();
    if (CET.app && CET.app.refreshChrome) CET.app.refreshChrome();
    return { ok: true, points: gained, word: word };
  }

  /* ---------- 打卡（需先完成 20 词） ---------- */

  function performCheckin() {
    var today = dateKey();
    if (state.checkin.last === today) return { ok: false, reason: "already" };
    var y = new Date();
    y.setDate(y.getDate() - 1);
    if (state.checkin.last === dateKey(y)) {
      state.checkin.streak += 1;
    } else {
      state.checkin.streak = 1;
    }
    state.checkin.last = today;
    if (state.checkin.days.indexOf(today) === -1) state.checkin.days.push(today);
    if (state.checkin.days.length > 120) state.checkin.days.shift();
    var bonus = Math.min(state.checkin.streak, 5) * 2;
    addPoints(10 + bonus, "checkin", "每日打卡 · 连续 " + state.checkin.streak + " 天");
    return { ok: true, points: 10 + bonus, streak: state.checkin.streak };
  }

  function checkin() {
    var d = dailyProgress();
    if (!d.complete) {
      return { ok: false, reason: "locked", done: d.done, total: d.total, remaining: d.remaining };
    }
    return performCheckin();
  }

  function canCheckin() {
    return dailyProgress().complete;
  }

  /* ---------- 小组 ---------- */

  function joinGroup(code) {
    code = (code || "").trim().toUpperCase();
    if (!code) return { ok: false, reason: "empty" };
    var group = state.groups.list.filter(function (g) { return g.code.toUpperCase() === code; })[0];
    if (!group) return { ok: false, reason: "notfound" };
    var hasMe = group.members.some(function (m) { return m.isMe; });
    if (hasMe) {
      state.groups.currentId = group.id;
      save();
      return { ok: true, already: true, group: group };
    }
    if (group.members.length >= MAX_MEMBERS) {
      return { ok: false, reason: "full", group: group, count: group.members.length };
    }
    group.members.push({
      id: "m_me", name: state.user.name, isMe: true, points: state.points.total,
      todayPoints: todayPoints(), streak: state.checkin.streak,
      checkedToday: state.checkin.last === dateKey()
    });
    state.groups.currentId = group.id;
    save();
    return { ok: true, group: group };
  }

  function createGroup(name) {
    name = (name || "").trim();
    if (!name) return { ok: false, reason: "empty" };
    var code = "";
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    do {
      code = "";
      for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    } while (state.groups.list.some(function (g) { return g.code === code; }));
    var group = {
      id: "g_" + code,
      name: name.slice(0, 18),
      code: code,
      owner: state.user.name,
      createdAt: Date.now(),
      members: [{
        id: "m_me", name: state.user.name, isMe: true, points: state.points.total,
        todayPoints: todayPoints(), streak: state.checkin.streak,
        checkedToday: state.checkin.last === dateKey()
      }]
    };
    state.groups.list.push(group);
    state.groups.currentId = group.id;
    save();
    return { ok: true, group: group };
  }

  function badges() {
    var mastered = masteredCount();
    var cloze = Object.keys(state.listening.clozeDone).length;
    return [
      { id: "checkin1", name: "打卡启程", desc: "完成第一次单词打卡", earned: state.checkin.days.length >= 1 },
      { id: "vocab1", name: "首词入门", desc: "掌握第 1 个单词", earned: mastered >= 1 },
      { id: "vocab50", name: "词汇积雨", desc: "掌握 50 个单词", earned: mastered >= 50 },
      { id: "vocab100", name: "词汇成林", desc: "掌握 100 个单词", earned: mastered >= 100 },
      { id: "daily1", name: "日拱一卒", desc: "完成 1 次 20 词打卡", earned: (state.vocab.dailyCompleteDates || []).length >= 1 },
      { id: "daily7", name: "七日词约", desc: "累计 7 次 20 词打卡", earned: (state.vocab.dailyCompleteDates || []).length >= 7 },
      { id: "listen5", name: "五套连听", desc: "完成 5 个听力套题", earned: state.listening.setsDone.length >= 5 },
      { id: "speak1", name: "初试开口", desc: "完成 1 个口语话题", earned: Object.keys(state.speaking.recorded).length >= 1 },
      { id: "listen1", name: "初听成曲", desc: "完成 1 个听力套题", earned: state.listening.setsDone.length >= 1 },
      { id: "cloze10", name: "精听达人", desc: "听写正确 10 空", earned: cloze >= 10 },
      { id: "speak3", name: "开口有光", desc: "完成 3 个口语话题", earned: Object.keys(state.speaking.recorded).length >= 3 },
      { id: "streak3", name: "三日不辍", desc: "连续打卡 3 天", earned: state.checkin.streak >= 3 },
      { id: "streak7", name: "七日成习", desc: "连续打卡 7 天", earned: state.checkin.streak >= 7 },
      { id: "points500", name: "积分五百", desc: "总积分达到 500", earned: state.points.total >= 500 },
      { id: "points1000", name: "千分学霸", desc: "总积分达到 1000", earned: state.points.total >= 1000 }
    ];
  }

  function resetAll() {
    localStorage.removeItem(KEY);
    state = seedState();
    save();
  }

  CET.store = {
    key: KEY,
    get state() { return state; },
    save: save,
    dateKey: dateKey,
    weekStartKey: weekStartKey,
    clock: clock,
    uid: uid,
    addPoints: addPoints,
    todayPoints: todayPoints,
    weekPoints: weekPoints,
    levelInfo: levelInfo,
    masteredCount: masteredCount,
    unknownCount: unknownCount,
    badges: badges,
    checkin: checkin,
    canCheckin: canCheckin,
    dailyProgress: dailyProgress,
    ensureDaily: ensureDaily,
    markDailyWord: markDailyWord,
    markWord: markWord,
    wordById: wordById,
    joinGroup: joinGroup,
    createGroup: createGroup,
    currentGroup: currentGroup,
    syncMe: syncMe,
    resetAll: resetAll,
    typeLabel: function (t) { return TYPE_LABEL[t] || "学习"; },
    LEVELS: LEVELS,
    DAILY_WORDS: DAILY_WORDS,
    MAX_MEMBERS: MAX_MEMBERS
  };

  save();
})();
