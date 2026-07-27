/* WinBitTorrent site — theme, language, screenshots, reveal, copy */
(function () {
  "use strict";

  var root = document.documentElement;
  var STORE_THEME = "wbt-theme";
  var STORE_LANG = "wbt-lang";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  /* ------------------------------ Theme -------------------------------- */
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#1f1f22" : "#f3f3f3");
  }

  function currentTheme() {
    var q = param("theme");
    if (q === "light" || q === "dark") return q;
    var saved = lsGet(STORE_THEME);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function toggleTheme() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    lsSet(STORE_THEME, next);
    applyTheme(next);
    updateInternalLinks();
  }

  // React to system changes only when the user hasn't chosen manually
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    if (!lsGet(STORE_THEME)) applyTheme(e.matches ? "dark" : "light");
  });

  /* --------------------------- Localization ---------------------------- */
  function currentLang() {
    var q = param("lang");
    if (q === "ru" || q === "en") return q;
    var saved = lsGet(STORE_LANG);
    if (saved === "ru" || saved === "en") return saved;
    return (navigator.language || "en").toLowerCase().indexOf("ru") === 0 ? "ru" : "en";
  }

  function sizeLabel(mb, lang) {
    return mb + (lang === "ru" ? " МБ" : " MB");
  }

  function renderModalSizes(lang) {
    var iSize = document.getElementById("dl-modal-installer-size");
    var pSize = document.getElementById("dl-modal-portable-size");
    if (iSize) iSize.textContent = sizeLabel(release.installerSizeMB, lang);
    if (pSize) pSize.textContent = sizeLabel(release.portableSizeMB, lang);
  }

  function applyLang(lang) {
    var dict = window.I18N[lang] || window.I18N.en;
    root.setAttribute("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var text = dict[key];
      if (text == null) return;
      if (key === "hero.badge" || key === "dlmodal.subtitle") text = text.replace("{version}", release.version);
      el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });
    document.querySelectorAll(".seg-lang [data-lang]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    renderModalSizes(lang);
  }

  function setLang(lang) {
    lsSet(STORE_LANG, lang);
    applyLang(lang);
    updateInternalLinks();
  }

  /* ----------------- Cross-page state (works on file://) --------------- */
  // Carry theme/lang through internal navigation so the choice survives even
  // when localStorage is isolated per page (e.g. opening files via file://).
  function updateInternalLinks() {
    var theme = root.getAttribute("data-theme") || currentTheme();
    var lang = root.getAttribute("lang") || currentLang();
    var internal = { "./": 1, "donate": 1, "index.html": 1, "donate.html": 1 };
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      var base = href.split("?")[0].split("#")[0];
      if (internal[base]) {
        a.setAttribute("href", base + "?theme=" + theme + "&lang=" + lang);
      }
    });
  }

  // On load, honour incoming ?theme/?lang, persist them, then clean the URL.
  function consumeIncomingState() {
    var th = param("theme"), lg = param("lang");
    if (th === "light" || th === "dark") { lsSet(STORE_THEME, th); applyTheme(th); }
    if (lg === "ru" || lg === "en") lsSet(STORE_LANG, lg);
    if ((th || lg)) {
      try { history.replaceState(null, "", location.pathname); } catch (e) {}
    }
  }

  /* -------------------------- Latest release ---------------------------- */
  // Fallback values match the release already baked into the HTML, in case
  // the GitHub API is slow, offline, blocked, or rate-limited.
  var release = { version: "1.0.0", installerUrl: null, installerSizeMB: 109, portableUrl: null, portableSizeMB: 154 };
  var RELEASES_API = "https://api.github.com/repos/Gorbachevvv/winBitTorrent/releases/latest";
  var RELEASE_CACHE_KEY = "wbt-release-cache-v1";
  var RELEASE_CACHE_TTL = 30 * 60 * 1000; // 30 min, keeps repeat visits off the GitHub API rate limit

  function readFallbackDownloadUrls() {
    var installerLink = document.getElementById("dl-modal-installer");
    var portableLink = document.getElementById("dl-modal-portable");
    if (installerLink) release.installerUrl = installerLink.getAttribute("href");
    if (portableLink) release.portableUrl = portableLink.getAttribute("href");
  }

  function parseRelease(json) {
    if (!json || !json.tag_name || !Array.isArray(json.assets)) return null;
    var installer = json.assets.filter(function (a) { return /\.exe$/i.test(a.name); })[0];
    var portable = json.assets.filter(function (a) { return /\.zip$/i.test(a.name); })[0];
    if (!installer || !portable) return null;
    return {
      version: String(json.tag_name).replace(/^v/i, ""),
      installerUrl: installer.browser_download_url,
      installerSizeMB: Math.round(installer.size / 1048576),
      portableUrl: portable.browser_download_url,
      portableSizeMB: Math.round(portable.size / 1048576)
    };
  }

  function applyRelease(data) {
    release = data;
    var installerLink = document.getElementById("dl-modal-installer");
    var portableLink = document.getElementById("dl-modal-portable");
    if (installerLink) installerLink.href = release.installerUrl;
    if (portableLink) portableLink.href = release.portableUrl;
    applyLang(root.getAttribute("lang") || currentLang());
  }

  function fetchLatestRelease() {
    if (!document.getElementById("dl-modal-installer")) return; // only relevant on the home page

    var cached = null;
    try { cached = JSON.parse(lsGet(RELEASE_CACHE_KEY) || "null"); } catch (e) {}
    if (cached && cached.data && Date.now() - cached.t < RELEASE_CACHE_TTL) {
      applyRelease(cached.data);
      return;
    }

    fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then(function (json) {
        var data = parseRelease(json);
        if (!data) return;
        try { localStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
        applyRelease(data);
      })
      .catch(function () { /* offline / blocked / rate-limited: keep the static fallback already on the page */ });
  }

  /* --------------------------- Download modal ---------------------------- */
  var modalLastFocused = null;

  function onModalKeydown(e) {
    var overlay = document.getElementById("dl-modal-overlay");
    if (!overlay) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeDownloadModal();
      return;
    }
    if (e.key === "Tab") {
      var dialog = overlay.querySelector(".dl-modal");
      var focusable = dialog.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openDownloadModal() {
    var overlay = document.getElementById("dl-modal-overlay");
    if (!overlay) return;
    modalLastFocused = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = document.getElementById("dl-modal-close");
    if (closeBtn) closeBtn.focus();
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeDownloadModal() {
    var overlay = document.getElementById("dl-modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKeydown);
    if (modalLastFocused && typeof modalLastFocused.focus === "function") modalLastFocused.focus();
  }

  function initDownloadModal() {
    var trigger = document.getElementById("download-trigger");
    var overlay = document.getElementById("dl-modal-overlay");
    var closeBtn = document.getElementById("dl-modal-close");
    if (!trigger || !overlay) return;
    trigger.addEventListener("click", openDownloadModal);
    if (closeBtn) closeBtn.addEventListener("click", closeDownloadModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeDownloadModal();
    });
  }

  /* --------------------------- Scroll reveal --------------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------ Copy --------------------------------- */
  function initCopy() {
    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-copy") || "";
        var done = function () {
          var lang = root.getAttribute("lang") || "en";
          var dict = window.I18N[lang] || window.I18N.en;
          btn.classList.add("copied");
          btn.setAttribute("aria-label", dict.copied);
          setTimeout(function () {
            btn.classList.remove("copied");
            btn.setAttribute("aria-label", dict.copy);
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(done, function () {});
        } else {
          var ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ------------------------------ Wire up ------------------------------ */
  function init() {
    readFallbackDownloadUrls();
    consumeIncomingState();
    applyLang(currentLang());
    updateInternalLinks();

    var themeBtn = document.querySelector(".theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    document.querySelectorAll(".seg-lang [data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });

    initReveal();
    initCopy();
    initDownloadModal();
    fetchLatestRelease();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
