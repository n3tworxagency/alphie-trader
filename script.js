/* ============================================================
   ALPHIE TRADER — SCRIPT.JS
   Sticky header · Mobile nav · Smooth scroll · Scroll reveal
   Counter animation · Countdown timer · Form validation
   FAQ accordion · Mouse parallax glow
============================================================ */

'use strict';

const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ================================================================
   1. STICKY HEADER
================================================================ */
(function () {
  const header = qs('#site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ================================================================
   2. MOBILE NAV
================================================================ */
(function () {
  const toggle = qs('#nav-toggle');
  const nav    = qs('#mobile-nav');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const opening = !nav.classList.contains('open');
    if (opening) {
      nav.classList.add('open');
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      close();
    }
  });

  qsa('a', nav).forEach(a => a.addEventListener('click', close));
})();

/* ================================================================
   3. SMOOTH SCROLL
================================================================ */
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (href === '#') return;
  const target = qs(href);
  if (!target) return;
  e.preventDefault();
  const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
  window.scrollTo({ top, behavior: 'smooth' });
});

/* ================================================================
   4. SCROLL REVEAL
================================================================ */
(function () {
  const revealAll = () => qsa('.reveal').forEach(el => el.classList.add('in-view'));

  // Hard safety net: if anything goes wrong, force all content visible after 800 ms
  const safetyTimer = setTimeout(revealAll, 800);

  if (!window.IntersectionObserver) { revealAll(); return; }

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0, rootMargin: '0px' }   // fire the moment 1 px enters viewport
  );

  const els = qsa('.reveal');
  if (!els.length) return;

  els.forEach(el => obs.observe(el));

  // Once every element has been revealed, cancel the safety timer
  let revealed = 0;
  const origCallback = obs.takeRecords.bind(obs); // keep reference
  els.forEach(el => {
    const origObserve = () => {
      const mo = new MutationObserver(() => {
        if (el.classList.contains('in-view')) {
          revealed++;
          if (revealed >= els.length) clearTimeout(safetyTimer);
          mo.disconnect();
        }
      });
      mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    };
    origObserve();
  });
})();

/* ================================================================
   5. COUNTER ANIMATION
================================================================ */
(function () {
  if (!window.IntersectionObserver) return;
  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const animate = el => {
    const target = parseInt(el.dataset.target, 10);
    const dur    = 1800;
    const start  = performance.now();
    const step   = now => {
      const prog = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(ease(prog) * target).toLocaleString();
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
    }),
    { threshold: 0.5 }
  );
  qsa('[data-target]').forEach(el => obs.observe(el));
})();

/* ================================================================
   6. COUNTDOWN TIMER
   No sessionStorage — deadline is always calculated fresh from page
   load so it works in all environments (iframes, incognito, strict
   privacy, hosted preview tools, etc.)
================================================================ */
(function () {
  try {
    const elDays  = qs('#cd-days');
    const elHours = qs('#cd-hours');
    const elMins  = qs('#cd-mins');
    const elSecs  = qs('#cd-secs');
    if (!elDays || !elHours || !elMins || !elSecs) return;

    // Always count 5 days from right now — simple, reliable, no storage needed
    const DEADLINE = Date.now() + 5 * 24 * 60 * 60 * 1000;

    const pad = n => String(Math.max(0, Math.floor(n))).padStart(2, '0');

    const tick = () => {
      const remaining = DEADLINE - Date.now();

      if (remaining <= 0) {
        elDays.textContent = elHours.textContent = elMins.textContent = elSecs.textContent = '00';
        clearInterval(iv);
        return;
      }

      const totalSecs  = remaining / 1000;
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600)  / 60);
      const s = Math.floor(totalSecs % 60);

      elDays.textContent  = pad(d);
      elHours.textContent = pad(h);
      elMins.textContent  = pad(m);
      elSecs.textContent  = pad(s);
    };

    // Run immediately so numbers appear before the first second elapses
    tick();
    const iv = setInterval(tick, 1000);

  } catch (err) {
    // Fail silently — countdown is cosmetic, never break the page
    console.warn('Countdown error:', err);
  }
})();

/* ================================================================
   7. FORM VALIDATION + SUBMISSION
================================================================ */
(function () {
  const form    = qs('#reg-form');
  const submitBtn = qs('#submit-btn');
  const success = qs('#form-success');
  if (!form) return;

  const rules = {
    'first-name': { test: v => v.trim().length >= 2,                          msg: 'Please enter your first name.' },
    'last-name':  { test: v => v.trim().length >= 2,                          msg: 'Please enter your last name.' },
    'phone':      { test: v => /^[\d\s\+\-\(\)]{7,}$/.test(v.trim()),        msg: 'Please enter a valid phone number.' },
    'email':      { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),  msg: 'Please enter a valid email address.' },
  };

  const setErr = (id, msg) => {
    const inp = qs(`#${id}`);
    const err = qs(`#err-${id}`);
    inp?.classList.toggle('error', !!msg);
    if (err) err.textContent = msg || '';
  };

  Object.keys(rules).forEach(id => {
    const inp = qs(`#${id}`);
    if (!inp) return;
    inp.addEventListener('blur',  () => setErr(id, rules[id].test(inp.value) ? '' : rules[id].msg));
    inp.addEventListener('input', () => setErr(id, ''));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    Object.keys(rules).forEach(id => {
      const inp = qs(`#${id}`);
      if (!inp || !rules[id].test(inp.value)) { setErr(id, rules[id].msg); valid = false; }
    });
    // Never show spinner unless all fields pass validation
    if (!valid) return;

    const btnTxt  = qs('.btn-txt',  submitBtn);
    const btnSpin = qs('.btn-spin', submitBtn);

    // Double-check the spinner is truly hidden before toggling
    submitBtn.disabled  = true;
    submitBtn.setAttribute('aria-busy', 'true');
    if (btnTxt)  btnTxt.hidden  = true;
    if (btnSpin) btnSpin.removeAttribute('hidden');

    // Replace the timeout below with your real API call (GoHighLevel, Formspree, etc.)
    await new Promise(res => setTimeout(res, 1600));

    form.hidden    = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();

/* ================================================================
   8. FAQ ANIMATED ACCORDION
================================================================ */
(function () {
  qsa('.faq-item').forEach(item => {
    const summary = qs('summary', item);
    const body    = qs('.faq-body', item);
    if (!summary || !body) return;

    summary.addEventListener('click', e => {
      e.preventDefault();
      if (!item.open) {
        body.style.height   = '0px';
        body.style.overflow = 'hidden';
        item.open = true;
        requestAnimationFrame(() => {
          body.style.transition = 'height 0.3s ease';
          body.style.height     = body.scrollHeight + 'px';
          body.addEventListener('transitionend', () => {
            body.style.height = body.style.overflow = body.style.transition = '';
          }, { once: true });
        });
      } else {
        body.style.height   = body.scrollHeight + 'px';
        body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          body.style.transition = 'height 0.3s ease';
          body.style.height     = '0px';
          body.addEventListener('transitionend', () => {
            item.open = false;
            body.style.height = body.style.overflow = body.style.transition = '';
          }, { once: true });
        });
      }
    });
  });
})();

/* ================================================================
   9. HERO ORB PARALLAX (desktop only)
================================================================ */
(function () {
  const orb1 = qs('.orb-1');
  const orb2 = qs('.orb-2');
  if (!orb1 || !orb2) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;

  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    orb1.style.transform = `translate(${x * 20}px, ${y * 14}px)`;
    orb2.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
  });
})();
