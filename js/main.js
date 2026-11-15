/* Site scripts — client-side / static only. */

(function () {
  function initNav() {
    var header = document.querySelector("[data-site-header]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    if (!header || !toggle || !panel) return;

    var mq = window.matchMedia("(max-width: 40rem)");

    function setOpen(open) {
      document.body.classList.toggle("is-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        var active = panel.querySelector(".site-nav__link.is-active");
        var focusTarget = active || panel.querySelector(".site-nav__link");
        if (focusTarget) focusTarget.focus();
      } else {
        toggle.focus();
      }
    }

    function close() {
      if (!document.body.classList.contains("is-nav-open")) return;
      setOpen(false);
    }

    function open() {
      setOpen(true);
    }

    toggle.addEventListener("click", function () {
      if (!mq.matches) return;
      if (document.body.classList.contains("is-nav-open")) {
        close();
      } else {
        open();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    panel.querySelectorAll(".site-nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mq.matches) close();
      });
    });

    function onBreakpointChange() {
      if (!mq.matches) close();
    }

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onBreakpointChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onBreakpointChange);
    }
  }

  function initStills(root) {
    var viewport = root.querySelector(".stills__viewport");
    var track = root.querySelector("[data-stills-track]");
    var prev = root.querySelector("[data-stills-prev]");
    var next = root.querySelector("[data-stills-next]");
    if (!viewport || !track || !prev || !next) return;

    var originals = Array.prototype.slice.call(
      track.querySelectorAll(".stills__slide")
    );
    var total = originals.length;
    if (!total) return;

    var firstClone = originals[0].cloneNode(true);
    var lastClone = originals[total - 1].cloneNode(true);
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");
    track.insertBefore(lastClone, originals[0]);
    track.appendChild(firstClone);

    var slides = Array.prototype.slice.call(
      track.querySelectorAll(".stills__slide")
    );
    // Layout: [lastClone, ...originals, firstClone]
    var index = 1;
    var animating = false;
    var animTimer = null;
    var drag = null;
    var wheelLock = false;
    var wheelLockTimer = null;

    function stillsDurationMs() {
      var raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--duration-stills")
        .trim();
      var ms = parseFloat(raw);
      if (!ms) return 720;
      if (raw.indexOf("s") !== -1 && raw.indexOf("ms") === -1) ms *= 1000;
      return ms;
    }

    function slideStep() {
      var slide = slides[0];
      if (!slide) return 0;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return slide.getBoundingClientRect().width + gap;
    }

    function offsetFor(i) {
      var step = slideStep();
      var peek =
        (viewport.clientWidth - slides[0].getBoundingClientRect().width) / 2;
      return peek - i * step;
    }

    function readTranslateX() {
      var transform = window.getComputedStyle(track).transform;
      if (!transform || transform === "none") return offsetFor(index);
      var match = transform.match(/matrix\(([^)]+)\)/);
      if (match) {
        var parts = match[1].split(",");
        return parseFloat(parts[4]) || 0;
      }
      var match3 = transform.match(/matrix3d\(([^)]+)\)/);
      if (match3) {
        var parts3 = match3[1].split(",");
        return parseFloat(parts3[12]) || 0;
      }
      return offsetFor(index);
    }

    function setTranslate(px, animate) {
      if (animate) {
        track.classList.add("is-animating");
      } else {
        track.classList.remove("is-animating");
      }
      track.style.transform = "translateX(" + px + "px)";
    }

    function normalizeIndex() {
      if (index !== 0 && index !== total + 1) return;
      var nextIndex = index === 0 ? total : 1;
      index = nextIndex;
      // Force a synchronous jump with no transition so the loop stays seamless.
      track.classList.remove("is-animating");
      track.style.transition = "none";
      track.style.transform = "translateX(" + offsetFor(index) + "px)";
      void track.offsetWidth;
      track.style.transition = "";
    }

    function clearAnimTimer() {
      if (animTimer) {
        window.clearTimeout(animTimer);
        animTimer = null;
      }
    }

    function scheduleWheelUnlock() {
      if (wheelLockTimer) window.clearTimeout(wheelLockTimer);
      // Wait until the gesture goes idle so one trackpad flick ≠ two steps
      wheelLockTimer = window.setTimeout(function () {
        wheelLock = false;
        wheelLockTimer = null;
      }, 220);
    }

    function finishAnimation() {
      if (!animating) return;
      animating = false;
      clearAnimTimer();
      normalizeIndex();
      if (wheelLock) scheduleWheelUnlock();
    }

    function goTo(i, animate) {
      if (animating && animate) return;
      clearAnimTimer();
      index = i;
      if (animate) {
        animating = true;
        setTranslate(offsetFor(index), true);
        animTimer = window.setTimeout(finishAnimation, stillsDurationMs() + 80);
      } else {
        animating = false;
        setTranslate(offsetFor(index), false);
        normalizeIndex();
      }
    }

    function nearestIndex(px, velocityX) {
      var step = slideStep();
      if (!step) return index;

      var peek =
        (viewport.clientWidth - slides[0].getBoundingClientRect().width) / 2;
      var raw = (peek - px) / step;
      var target = Math.round(raw);

      // Gentle directional bias — still one-step magnetic like page snap
      if (Math.abs(velocityX) > 0.12) {
        target = velocityX < 0 ? Math.ceil(raw - 0.28) : Math.floor(raw + 0.28);
      }

      // Never jump more than one slide from the current resting index
      if (target > index + 1) target = index + 1;
      if (target < index - 1) target = index - 1;

      if (target < 0) target = 0;
      if (target > total + 1) target = total + 1;
      return target;
    }

    function settleFrom(px, velocityX) {
      var step = slideStep();
      var origin = offsetFor(index);
      var dx = px - origin;
      var target = index;

      // Always land on a full slide — commit next/prev once past a light threshold
      if (Math.abs(velocityX) > 0.12) {
        target = velocityX < 0 ? index + 1 : index - 1;
      } else if (step && Math.abs(dx) > step * 0.18) {
        target = dx < 0 ? index + 1 : index - 1;
      }

      if (target < 0) target = 0;
      if (target > total + 1) target = total + 1;
      goTo(target, true);
    }

    function stepBy(dir) {
      if (animating || wheelLock) return;
      wheelLock = true;
      goTo(index + dir, true);
    }

    function onTransitionEnd(event) {
      if (event.target !== track || event.propertyName !== "transform") return;
      finishAnimation();
    }

    track.addEventListener("transitionend", onTransitionEnd);

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;

      var origin = offsetFor(index);
      if (animating) {
        origin = readTranslateX();
        animating = false;
        clearAnimTimer();
        track.classList.remove("is-animating");
        track.style.transform = "translateX(" + origin + "px)";
        // Re-align logical index to where we actually stopped
        index = nearestIndex(origin, 0);
      }

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocityX: 0,
        origin: origin,
      };

      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;

      var now = performance.now();
      var dx = event.clientX - drag.startX;
      var dt = Math.max(now - drag.lastTime, 1);
      var frameDx = event.clientX - drag.lastX;
      // Soften velocity so settle doesn't overshoot
      drag.velocityX = frameDx / dt;
      drag.lastX = event.clientX;
      drag.lastTime = now;

      setTranslate(drag.origin + dx, false);
    }

    function onPointerUp(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;

      var dx = event.clientX - drag.startX;
      var velocityX = drag.velocityX;
      var px = drag.origin + dx;
      viewport.classList.remove("is-dragging");
      try {
        viewport.releasePointerCapture(drag.pointerId);
      } catch (err) {
        /* already released */
      }
      drag = null;
      settleFrom(px, velocityX);
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    viewport.addEventListener(
      "wheel",
      function (event) {
        var absX = Math.abs(event.deltaX);
        var absY = Math.abs(event.deltaY);
        var horizontal =
          absX > absY || event.shiftKey || (event.deltaX !== 0 && absX > 2);

        // Two-finger trackpad horizontal (or shift+wheel) drives the stills;
        // mostly-vertical gestures leave page snap alone.
        if (!horizontal || (absX < 1 && !event.shiftKey)) {
          if (!event.shiftKey && absY >= absX) return;
        }
        if (absX < absY && !event.shiftKey) return;

        event.preventDefault();

        var delta = event.shiftKey && absX < absY ? event.deltaY : event.deltaX;
        if (event.deltaMode === 1) delta *= 16;
        if (event.deltaMode === 2) delta *= viewport.clientWidth;
        if (Math.abs(delta) < 4) return;

        // One gesture → one full still. Extra wheel events only extend the lock.
        if (animating || wheelLock) {
          scheduleWheelUnlock();
          return;
        }

        stepBy(delta > 0 ? 1 : -1);
      },
      { passive: false }
    );

    prev.addEventListener("click", function () {
      goTo(index - 1, true);
    });

    next.addEventListener("click", function () {
      goTo(index + 1, true);
    });

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1, true);
      }
    });

    if (!root.hasAttribute("tabindex")) {
      root.setAttribute("tabindex", "0");
    }

    window.addEventListener("resize", function () {
      if (drag) return;
      setTranslate(offsetFor(index), false);
    });

    setTranslate(offsetFor(index), false);
  }

  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  initNav();
  document.querySelectorAll("[data-stills]").forEach(initStills);
  initReveal();
})();
