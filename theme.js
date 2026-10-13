/* =============================================================
   KALAIVANI STORES — theme engine
   Light / dark with a header toggle.

   · Default follows the device setting (prefers-color-scheme)
   · An explicit choice is remembered in localStorage["ks-theme"]
   · The chosen value is written to <html data-theme>, which is
     what every stylesheet keys its dark palette off.

   A tiny blocking snippet in each page's <head> applies the
   theme before first paint so there is no flash of the wrong
   colour. This file only wires up the buttons afterwards.
   ============================================================= */
(function () {
  "use strict";

  var KEY = "ks-theme";
  var mq = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function readStored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === "dark" || v === "light" ? v : null;
    } catch (e) {
      return null; // private mode / storage blocked
    }
  }

  function systemTheme() {
    return mq && mq.matches ? "dark" : "light";
  }

  function current() {
    return document.documentElement.getAttribute("data-theme") || systemTheme();
  }

  function paint(theme) {
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;

    /* keep the browser/phone status bar in step with the theme */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      (document.head || root).appendChild(meta);
    }
    meta.setAttribute("content", theme === "dark" ? "#07110B" : "#F2F5F1");

    var next = theme === "dark" ? "light" : "dark";
    var icon = theme === "dark" ? "☀️" : "🌙";
    var label = "Switch to " + next + " theme";

    var btns = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("aria-label", label);
      btns[i].setAttribute("title", label);
      var slot = btns[i].querySelector("[data-theme-icon]");
      if (slot) slot.textContent = icon;
    }
  }

  function set(theme) {
    paint(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {
      /* ignore — the choice simply will not be remembered */
    }
  }

  function toggle() {
    set(current() === "dark" ? "light" : "dark");
  }

  /* Only follow the OS while the visitor has not chosen one. */
  function onSystemChange() {
    if (!readStored()) paint(systemTheme());
  }

  if (mq) {
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  /* One delegated listener covers every current and future button. */
  document.addEventListener("click", function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    if (el.closest("[data-theme-toggle]")) {
      e.preventDefault();
      toggle();
    }
  });

  window.ksTheme = {
    get: current,
    set: set,
    toggle: toggle,
    /* call after injecting a toggle button from script */
    refresh: function () {
      paint(current());
    }
  };

  /* This file loads in <head>, before the buttons exist — repaint
     once the markup is parsed so every icon is correct. */
  document.addEventListener("DOMContentLoaded", function () {
    paint(current());
  });

  paint(current());
})();
