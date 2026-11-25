/* =========================================================
   懒加载器（微优化 · 零依赖）
   ---------------------------------------------------------
   目的：把首屏不需要的大数据文件（listening-extra.js 约 1.2 MB、
   listening-restore.js 约 277 KB、listening-bounds.js 约 101 KB、
   以及 6 个视图脚本）从 index.html 的同步 <script> 中移除，
   改为「进入对应页面时才加载」，从而让首屏只下载真正需要的代码。

   设计要点：
   1. 同一个 URL 只会被加载一次（并发调用共享同一个 Promise）。
   2. 加载成功后把 Promise 记录在 CET.loader.cache，后续直接复用。
   3. 失败时从 cache 删除，允许重试（例如用户网络恢复后再次进入页面）。
   4. 所有 URL 会拼上 CET.boot.VERSION，保证发布新版本后拿到新文件。
   5. 不依赖任何构建工具，保持与现有全局命名空间（window.CET）一致。
   ========================================================= */
window.CET = window.CET || {};

(function () {
  var cache = {};

  // 版本号：优先使用 index.html 中 <script id="cetBoot"> 注入的 window.CET_VERSION，
  // 这样 CI 可以统一替换，不用再手工改每个文件的 ?v=。
  var VERSION = (function () {
    if (window.CET_VERSION) return window.CET_VERSION;
    var el = document.getElementById("cetBoot");
    if (el) {
      var v = el.getAttribute("data-version");
      if (v) return v;
    }
    // 兜底：拿不到版本号时退化成无参数，避免加载失败
    return "";
  })();

  function withVersion(url) {
    if (!VERSION) return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "v=" + VERSION;
  }

  /**
   * 加载一个脚本文件。
   * @param {string} url 相对路径，例如 "assets/js/data/listening-extra.js"
   * @returns {Promise<void>}
   */
  function loadScript(url) {
    if (cache[url]) return cache[url];

    var full = withVersion(url);
    var p = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = full;
      s.async = false; // 保证同一批加载的脚本执行顺序与插入顺序一致
      s.onload = function () {
        s.onload = s.onerror = null;
        resolve();
      };
      s.onerror = function () {
        s.onload = s.onerror = null;
        // 失败后移除缓存，允许重试
        delete cache[url];
        reject(new Error("脚本加载失败：" + full));
      };
      document.head.appendChild(s);
    });

    cache[url] = p;
    return p;
  }

  /**
   * 按顺序加载一组脚本（脚本之间可能有依赖，例如 data 必须先于 view）。
   * @param {string[]} urls
   * @returns {Promise<void>}
   */
  function loadScripts(urls) {
    return urls.reduce(function (prev, url) {
      return prev.then(function () { return loadScript(url); });
    }, Promise.resolve());
  }

  /**
   * 让一个「初始渲染依赖额外数据」的视图安全降级：
   * 数据没准备好时，先渲染一个加载态，加载完成后再重新渲染。
   * @param {string} viewId 视图 id，例如 "listening"
   * @param {string[]} urls 该视图初次渲染需要的脚本
   * @param {object} meta 视图对象（CET.views.listening）
   */
  function ensureView(viewId, urls, meta) {
    if (meta && meta.__dataReady) return Promise.resolve();

    var root = document.getElementById("viewRoot");
    if (root) {
      root.innerHTML =
        '<div class="view-enter" style="padding:48px 0;text-align:center">' +
          '<p class="muted">正在加载题库数据…</p>' +
          '<p class="tiny dim" style="margin-top:8px">首次进入该页面需要下载数据，之后会走浏览器缓存。</p>' +
        '</div>';
    }

    return loadScripts(urls).then(function () {
      if (meta) meta.__dataReady = true;
      // 加载期间用户可能已经切到别的页面，只有在仍停留在本页时才重绘
      if (window.CET.app && CET.app.current === viewId) {
        CET.app.rerender();
      }
    }).catch(function (err) {
      console.error("[CET.loader] " + viewId + " 数据加载失败", err);
      if (window.CET.app && CET.app.current !== viewId) return;
      var host = document.getElementById("viewRoot");
      if (host) {
        host.innerHTML =
          '<div class="view-enter"><div class="card">' +
            '<h3 style="font-size:16px">数据加载失败</h3>' +
            '<p class="muted small" style="margin-top:8px">题库文件没能下载成功，请检查网络后点击下方按钮重试。</p>' +
            '<button class="btn primary" id="cetRetryLoad" type="button" style="margin-top:14px">重新加载</button>' +
          '</div></div>';
        var btn = document.getElementById("cetRetryLoad");
        if (btn) {
          btn.addEventListener("click", function () {
            if (window.CET.app) CET.app.setView(viewId);
          });
        }
      }
    });
  }

  window.CET.loader = {
    version: VERSION,
    loadScript: loadScript,
    loadScripts: loadScripts,
    ensureView: ensureView,
    // 暴露缓存便于调试
    _cache: cache
  };
})();
