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

  function applyLang(lang) {
    var dict = window.I18N[lang] || window.I18N.en;
    root.setAttribute("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });
    document.querySelectorAll(".seg-lang [data-lang]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
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
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      var base = href.split("?")[0].split("#")[0];
      if (base === "index.html" || base === "donate.html") {
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
