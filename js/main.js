/* Site scripts — client-side / static only. */

(function () {
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
    var drag = null;
    var wheelOffset = null;
    var wheelTimer = null;

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

    function setTranslate(px, animate) {
      if (animate) {
        track.classList.add("is-animating");
      } else {
        track.classList.remove("is-animating");
      }
      track.style.transform = "translateX(" + px + "px)";
    }

    function normalizeIndex() {
      if (index === 0) {
        index = total;
        setTranslate(offsetFor(index), false);
      } else if (index === total + 1) {
        index = 1;
        setTranslate(offsetFor(index), false);
      }
    }

    function goTo(i, animate) {
      if (animating && animate) return;
      index = i;
      if (animate) animating = true;
      setTranslate(offsetFor(index), animate);
      if (!animate) normalizeIndex();
    }

    function nearestIndex(px, velocityX) {
      var step = slideStep();
      if (!step) return index;

      var projected = px + velocityX * 160;
      var peek =
        (viewport.clientWidth - slides[0].getBoundingClientRect().width) / 2;
      var raw = (peek - projected) / step;
      var target = Math.round(raw);

      // Magnetic bias toward the swipe direction when near a midpoint
      if (Math.abs(velocityX) > 0.35) {
        target = velocityX < 0 ? Math.ceil(raw - 0.15) : Math.floor(raw + 0.15);
      }

      if (target < 0) target = 0;
      if (target > total + 1) target = total + 1;
      return target;
    }

    function settleFrom(px, velocityX) {
      var target = nearestIndex(px, velocityX || 0);
      goTo(target, true);
      wheelOffset = null;
    }

    function onTransitionEnd(event) {
      if (event.target !== track || event.propertyName !== "transform") return;
      animating = false;
      normalizeIndex();
    }

    track.addEventListener("transitionend", onTransitionEnd);

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (animating) {
        animating = false;
        track.classList.remove("is-animating");
      }

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocityX: 0,
        origin: offsetFor(index),
      };

      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
      wheelOffset = null;
      if (wheelTimer) {
        window.clearTimeout(wheelTimer);
        wheelTimer = null;
      }
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;

      var now = performance.now();
      var dx = event.clientX - drag.startX;
      var dt = Math.max(now - drag.lastTime, 1);
      var frameDx = event.clientX - drag.lastX;
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
          absX > absY || event.shiftKey || event.deltaX !== 0 && absX > 2;

        // Two-finger trackpad horizontal (or shift+wheel) drives the stills;
        // mostly-vertical gestures leave page snap alone.
        if (!horizontal || absX < 1 && !event.shiftKey) {
          if (!event.shiftKey && absY >= absX) return;
        }
        if (absX < absY && !event.shiftKey) return;

        event.preventDefault();

        if (animating) {
          animating = false;
          track.classList.remove("is-animating");
        }

        var delta = event.shiftKey && absX < absY ? event.deltaY : event.deltaX;
        if (event.deltaMode === 1) delta *= 16;
        if (event.deltaMode === 2) delta *= viewport.clientWidth;

        if (wheelOffset === null) {
          wheelOffset = offsetFor(index);
        }

        wheelOffset -= delta;
        setTranslate(wheelOffset, false);

        if (wheelTimer) window.clearTimeout(wheelTimer);
        wheelTimer = window.setTimeout(function () {
          var px = wheelOffset === null ? offsetFor(index) : wheelOffset;
          settleFrom(px, 0);
          wheelTimer = null;
        }, 90);
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

  document.querySelectorAll("[data-stills]").forEach(initStills);
  initReveal();
})();
