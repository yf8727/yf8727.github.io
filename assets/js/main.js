/* =========================================================
   杨锋 · 个人主页 交互脚本
   ========================================================= */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 主题切换 ---------- */
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');
  var saved = null;
  try { saved = localStorage.getItem('yf-theme'); } catch (e) {}
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute('data-theme', 'light');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('yf-theme', next); } catch (e) {}
      toast(next === 'light' ? '已切换到浅色主题' : '已切换到暗色主题');
    });
  }

  /* ---------- 2. 导航吸顶 + 滚动进度 ---------- */
  var nav = $('#nav');
  var bar = $('#scrollProgress');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-stuck', y > 12);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 3. 移动端菜单 ---------- */
  var menuBtn = $('#menuBtn');
  var navLinks = $('#navLinks');

  function closeMenu() {
    if (!navLinks || !menuBtn) return;
    navLinks.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav__link', navLinks).forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- 4. 导航高亮 ---------- */
  var sections = $$('main section[id]');
  var links = $$('.nav__link');
  if ('IntersectionObserver' in window && sections.length && links.length) {
    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        links.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { activeObs.observe(s); });
  }

  /* ---------- 5. 入场动画 ---------- */
  var reveals = $$('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    reveals.forEach(function (el) {
      var d = parseInt(el.getAttribute('data-delay') || '0', 10);
      if (d) el.style.transitionDelay = (d * 90) + 'ms';
    });

    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: .05, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });

    /* 兜底：1.6s 后仍未显示的内容直接呈现，避免动画/观察器异常导致页面空白 */
    setTimeout(function () {
      reveals.forEach(function (el) {
        if (!el.classList.contains('is-in')) {
          el.style.transition = 'none';
          el.classList.add('is-in');
        }
      });
    }, 1600);
  }

  /* ---------- 6. 数字滚动 ---------- */
  var nums = $$('.stat__num');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count') || '0');
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = target.toFixed(dec) + suffix;
      return;
    }
    var start = performance.now();
    var dur = 1400;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(dec) + suffix;
    }
    requestAnimationFrame(tick);
  }
  if (nums.length) {
    if (!('IntersectionObserver' in window)) {
      nums.forEach(runCount);
    } else {
      var numObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            runCount(en.target);
            numObs.unobserve(en.target);
          }
        });
      }, { threshold: .6 });
      nums.forEach(function (n) { numObs.observe(n); });
    }
  }

  /* ---------- 7. Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }

  /* ---------- 8. 复制邮箱 ---------- */
  var copyBtn = $('#copyMail');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy') || '';
      var done = function () { toast('邮箱已复制：' + text); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); }
        catch (e) { toast('邮箱：' + text); }
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- 9. 年份 ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 10. 头像微倾斜 ---------- */
  var visual = $('.hero__visual');
  if (visual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      var r = visual.getBoundingClientRect();
      var cx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var cy = (e.clientY - (r.top + r.height / 2)) / r.height;
      visual.style.transform = 'perspective(900px) rotateY(' + (cx * 4).toFixed(2) + 'deg) rotateX(' + (-cy * 4).toFixed(2) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () {
      visual.style.transform = '';
    });
  }
})();

