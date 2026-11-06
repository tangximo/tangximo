/* 听力音频 IndexedDB 存储：按套题 id 保存用户自己导入的音频文件 */
window.CET = window.CET || {};

(function () {
  var DB_NAME = "cet-audio";
  var STORE = "files";
  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) {
        reject(new Error("此浏览器不支持 IndexedDB"));
        return;
      }
      var req;
      try {
        req = window.indexedDB.open(DB_NAME, 1);
      } catch (e) {
        reject(e);
        return;
      }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("IndexedDB 打开失败")); };
      req.onblocked = function () { reject(new Error("IndexedDB 被其他标签页占用")); };
    });
    return dbPromise;
  }

  function store(mode) {
    return openDb().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function wrap(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("IndexedDB 操作失败")); };
    });
  }

  CET.audioStore = {
    MAX_BYTES: 30 * 1024 * 1024,
    get: function (id) {
      return store("readonly").then(function (s) { return wrap(s.get(id)); }).then(function (r) { return r || null; });
    },
    put: function (rec) {
      return store("readwrite").then(function (s) { return wrap(s.put(rec)); }).then(function () { return rec; });
    },
    remove: function (id) {
      return store("readwrite").then(function (s) { return wrap(s.delete(id)); });
    },
    all: function () {
      return store("readonly").then(function (s) { return wrap(s.getAll()); }).then(function (list) {
        var map = {};
        (list || []).forEach(function (r) { map[r.id] = r; });
        return map;
      });
    }
  };
})();
