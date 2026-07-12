/* ================================================================
   Makura.exe — gentle life for the scene
   vanilla js · no dependencies · transform-only (60fps friendly)
   ================================================================ */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ----------------------------------------------------------------
     1. soft parallax — desktop / fine pointers only
        window tilts a hair, clouds and hills drift the other way
     ---------------------------------------------------------------- */

  if (finePointer && !reducedMotion) {
    var win = document.getElementById("window");
    var clouds = document.getElementById("clouds");
    var hills = document.querySelector(".hills");

    var tx = 0, ty = 0;       /* target   */
    var cx = 0, cy = 0;       /* current  */
    var raf = null;

    function tick() {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      win.style.transform =
        "rotateY(" + cx.toFixed(3) + "deg) rotateX(" + (-cy).toFixed(3) + "deg)";

      clouds.style.transform =
        "translate(" + (cx * -5).toFixed(2) + "px," + (cy * -3).toFixed(2) + "px)";

      hills.style.transform =
        "translate(" + (cx * -3).toFixed(2) + "px," + (cy * -1.5).toFixed(2) + "px) scale(1.02)";

      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    window.addEventListener("mousemove", function (e) {
      var nx = e.clientX / window.innerWidth  - 0.5;
      var ny = e.clientY / window.innerHeight - 0.5;
      tx = nx * 4;   /* max ±2deg — restrained, expensive-feeling */
      ty = ny * 4;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
     2. decorative titlebar buttons — a tiny shake, nothing more.
        they must never navigate or distract from the CTA.
     ---------------------------------------------------------------- */

  var winEl = document.getElementById("window");

  Array.prototype.forEach.call(
    document.querySelectorAll(".tb-btn"),
    function (btn) {
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        if (reducedMotion) return;
        winEl.classList.remove("window--nudge");
        /* force reflow so the animation can replay */
        void winEl.offsetWidth;
        winEl.classList.add("window--nudge");
      });
    }
  );

  /* inject the nudge keyframes once (kept out of the stylesheet
     because it's pure easter-egg behavior) */
  var style = document.createElement("style");
  style.textContent =
    "@keyframes window-nudge{" +
    "0%,100%{transform:translateX(0)}" +
    "30%{transform:translateX(-4px)}" +
    "60%{transform:translateX(3px)}" +
    "80%{transform:translateX(-1px)}}" +
    ".window--nudge{animation:window-nudge .3s ease both !important}";
  document.head.appendChild(style);

  /* ----------------------------------------------------------------
     3. sparkle burst on CTA press — fires instantly,
        never delays navigation
     ---------------------------------------------------------------- */

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  var cta = document.getElementById("cta");

  /* ----------------------------------------------------------------
     3.5 escape from the Instagram / Facebook in-app browser.
     inside the IG webview fans are logged out of everything, so we
     bounce the tap out to the real system browser (Safari / Chrome).
     if the trick is blocked, a fallback opens the link normally.
     ---------------------------------------------------------------- */

  (function () {
    var ua = navigator.userAgent || "";
    var inApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS/i.test(ua);
    if (!inApp) return;

    var isIOS = /iPhone|iPad|iPod/i.test(ua);
    var isAndroid = /Android/i.test(ua);
    if (!isIOS && !isAndroid) return;

    cta.addEventListener("click", function (e) {
      e.preventDefault();
      var url = cta.href;

      /* fallback: if we're still here after 1.6s, the escape failed —
         open the link the normal way inside the webview */
      var fallback = setTimeout(function () {
        window.location.href = url;
      }, 1600);
      var cancel = function () { clearTimeout(fallback); };
      window.addEventListener("pagehide", cancel, { once: true });
      window.addEventListener("blur", cancel, { once: true });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) cancel();
      }, { once: true });

      if (isIOS) {
        /* opens Safari from the IG in-app browser */
        window.location.href = "x-safari-" + url;
      } else {
        /* opens the default browser (Chrome) on Android */
        window.location.href =
          "intent://" + url.replace(/^https?:\/\//, "") +
          "#Intent;scheme=https;action=android.intent.action.VIEW;end";
      }
    });
  })();

  cta.addEventListener("pointerdown", function (e) {
    if (reducedMotion) return;
    for (var i = 0; i < 7; i++) {
      var s = document.createElement("span");
      s.textContent = "✦";
      s.style.cssText =
        "position:fixed;z-index:99;pointer-events:none;" +
        "font-size:" + rand(9, 16) + "px;color:#eaf6ff;" +
        "text-shadow:0 0 8px rgba(150,210,255,.9);" +
        "left:" + e.clientX + "px;top:" + e.clientY + "px;" +
        "transition:transform .7s cubic-bezier(.2,.6,.3,1),opacity .7s ease;opacity:1;";
      document.body.appendChild(s);

      (function (el) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.style.transform =
              "translate(" + rand(-60, 60) + "px," + rand(-75, -20) + "px)" +
              " scale(" + rand(0.5, 1.3) + ") rotate(" + rand(-90, 90) + "deg)";
            el.style.opacity = "0";
          });
        });
        setTimeout(function () { el.remove(); }, 800);
      })(s);
    }
  }, { passive: true });

})();
