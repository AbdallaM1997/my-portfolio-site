(function(){
  // Small helpers so this works on older Safari/Edge too: NodeList.forEach and
  // Element.closest are missing on browsers older than about 2017.
  function each(list, fn){ Array.prototype.forEach.call(list, fn); }
  function closestButton(el, root){
    while (el && el !== root) {
      if (el.nodeType === 1 && el.tagName === 'BUTTON') return el;
      el = el.parentNode;
    }
    return null;
  }

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Phones get the narrower encode where one exists. Only clips wider than
  // 720 have one: a wide card renders about 282 CSS px on a 390px screen, so
  // the portrait and 720-wide clips are already the right size and shrinking
  // them further would soften them for nothing.
  var SMALL = !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
  function pick(el, attr, smallAttr){
    var sm = SMALL && el.getAttribute(smallAttr);
    return sm || el.getAttribute(attr);
  }

  var vids = Array.prototype.slice.call(document.querySelectorAll('video[data-lazy]'));
  if (SMALL) {
    each(vids, function(v){
      var sm = v.getAttribute('data-sm');
      if (sm) v.setAttribute('src', sm);
    });
  }

  var motion = !reduce && 'IntersectionObserver' in window;
  if (motion) document.documentElement.className += ' anim';

  // ---- reveal on scroll -------------------------------------------------
  // Driven by a scroll sweep rather than IntersectionObserver: IO reports no
  // change when a jump (deep link, restored scroll position) carries an
  // element from below the viewport to above it, which would strand it at
  // opacity 0 forever.
  var pending = [];
  if (motion) {
    var groups = [
      ['.pagehead .wrap > *', 70],
      ['.band-head', 0],
      ['.workgrid .workcard', 70],
      ['.pager a', 90],
      ['.steps .card', 0],
      ['.live article', 70],
      ['.project .media', 0],
      ['.project .copy', 90],
      ['.sites article', 0],
      ['.caps div', 70],
      ['.contact h2', 0],
      ['.contact p', 90]
    ];
    each(groups, function(g){
      each(document.querySelectorAll(g[0]), function(el, i){
        el.className += ' reveal';
        if (g[1]) el.style.setProperty('--d', (i % 4) * g[1] + 'ms');
        pending.push(el);
      });
    });
  }

  function sweep(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().top < vh * 0.92) {
        pending[i].className += ' in';
        pending.splice(i, 1);
      }
    }
  }

  // ---- live rail ---------------------------------------------------------
  var rail = document.querySelector('.rail');
  if (rail) {
    var track = rail.querySelector('.live');
    var prevBtn = rail.querySelector('.prev'), nextBtn = rail.querySelector('.next');
    var stepBy = function(dir){
      var card = track.querySelector('article');
      var w = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
    };
    prevBtn.addEventListener('click', function(){ stepBy(-1); });
    nextBtn.addEventListener('click', function(){ stepBy(1); });
    var railState = function(){
      var max = track.scrollWidth - track.clientWidth;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= max - 2;
      rail.classList.toggle('overflowing', max > 4);
    };
    track.addEventListener('scroll', railState, { passive: true });
    window.addEventListener('resize', railState);
    window.addEventListener('load', railState);
    railState();

    // Drift slowly on its own while nobody is touching it. Pauses on hover,
    // touch, keyboard focus and while off screen; a user scroll or an arrow
    // press holds it for a few seconds. At the end it glides back to the start.
    if (!reduce) {
      var hold = 0, hovering = false, visible = false, last = 0, pos = 0, rewinding = false;
      var DRIFT = 18; // px per second
      var pause = function(ms){ hold = Date.now() + (ms || 4000); };
      rail.addEventListener('mouseenter', function(){ hovering = true; });
      rail.addEventListener('mouseleave', function(){ hovering = false; });
      rail.addEventListener('focusin', function(){ hovering = true; });
      rail.addEventListener('focusout', function(){ hovering = false; });
      track.addEventListener('touchstart', function(){ pause(6000); }, { passive: true });
      track.addEventListener('wheel', function(){ pause(6000); }, { passive: true });
      track.addEventListener('pointerdown', function(){ pause(6000); });
      prevBtn.addEventListener('click', function(){ pause(6000); });
      nextBtn.addEventListener('click', function(){ pause(6000); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(rail);
      } else { visible = true; }
      var drift = function(now){
        window.requestAnimationFrame(drift);
        var dt = last ? Math.min(200, now - last) : 0;
        last = now;
        var max = track.scrollWidth - track.clientWidth;
        if (max <= 4 || !visible || hovering || Date.now() < hold || rewinding) { pos = track.scrollLeft; return; }
        // a user scroll moved it elsewhere: continue from there
        if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;
        pos = Math.min(max, pos + DRIFT * dt / 1000);
        rail.classList.add('drifting');
        track.scrollLeft = pos;
        if (pos >= max - 0.5) {
          rewinding = true;
          setTimeout(function(){
            rail.classList.remove('drifting');
            track.scrollTo({ left: 0, behavior: 'smooth' });
            setTimeout(function(){ pos = 0; rewinding = false; pause(2500); }, 900);
          }, 2500);
        }
      };
      window.requestAnimationFrame(drift);
    }
  }

  // ---- journey trail ----------------------------------------------------
  // A wavy SVG path threads the timeline; it draws itself and a dot rides
  // along it as the reader scrolls. Geometry is rebuilt from the cards'
  // positions so it survives reflow.
  var steps = document.querySelector('.steps');
  var trail = steps && steps.querySelector('.trail');
  var trailLen = 0, trailInk, trailDot, trailHalo, moveTimer, chips = [];
  function buildTrail(){
    if (!trail) return;
    var items = steps.querySelectorAll(':scope > li');
    if (!items.length) return;
    var W = steps.clientWidth, H = steps.clientHeight;
    var narrow = window.innerWidth <= 640;
    var gap = parseFloat(window.getComputedStyle(items[0]).columnGap) || 0;
    var cx = narrow ? 26 : W / 2, amp = narrow ? 14 : Math.max(24, gap / 2 - 14);
    var pts = [[cx, 0]];
    each(items, function(li, i){
      var y = li.offsetTop + (narrow ? 0 : li.offsetHeight / 2);
      pts.push([cx + (i % 2 ? -amp : amp), y]);
    });
    pts.push([cx, H]);
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i-1], p1 = pts[i], my = (p0[1] + p1[1]) / 2;
      d += ' C' + p0[0] + ' ' + my + ' ' + p1[0] + ' ' + my + ' ' + p1[0] + ' ' + p1[1];
    }
    trail.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    trail.setAttribute('width', W); trail.setAttribute('height', H);
    trail.querySelector('.trail-bg').setAttribute('d', d);
    trailInk = trail.querySelector('.trail-ink');
    trailInk.setAttribute('d', d);
    trailDot = trail.querySelector('.trail-dot');
    trailHalo = trail.querySelector('.trail-halo');
    trailLen = trailInk.getTotalLength();
    trailInk.style.strokeDasharray = trailLen;
    // the year chips sit on the path at their step's bend
    chips = [];
    each(items, function(li, i){
      var w = li.querySelector('.when');
      if (!w) return;
      w.style.left = pts[i+1][0] + 'px';
      chips.push({ el: w, y: pts[i+1][1], card: li.querySelector('.card'), top: li.offsetTop, bottom: li.offsetTop + li.offsetHeight - 30 });
    });
    moveTrail();
  }
  function moveTrail(){
    if (!trailInk || !trailLen) return;
    var r = steps.getBoundingClientRect();
    var line = (window.innerHeight || 0) * 0.55;
    var t = (line - r.top) / r.height;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var len = trailLen * t;
    trailInk.style.strokeDashoffset = trailLen - len;
    var pt = trailInk.getPointAtLength(len);
    trailDot.setAttribute('cx', pt.x); trailDot.setAttribute('cy', pt.y);
    trailHalo.setAttribute('cx', pt.x); trailHalo.setAttribute('cy', pt.y);
    // chips light up as the dot reaches them and flare while it is close
    each(chips, function(c){
      var dy = pt.y - c.y;
      c.el.classList.toggle('lit', dy >= -6);
      c.el.classList.toggle('near', Math.abs(dy) < 60);
      // the card glows while the dot is alongside it
      if (c.card) c.card.classList.toggle('lit', pt.y >= c.top && pt.y < c.bottom);
    });
    // the glow flares while the dot is travelling and settles once it stops
    steps.classList.add('moving');
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function(){ steps.classList.remove('moving'); }, 260);
    steps.classList.toggle('riding', t > 0 && t < 1);
  }
  if (trail) {
    buildTrail();
    window.addEventListener('load', buildTrail);
    window.addEventListener('resize', buildTrail);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildTrail);
  }

  // ---- nav highlighting -------------------------------------------------
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.mainnav a[href^="#"]'));
  var sections = [];
  each(navLinks, function(a){
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if (t) sections.push({ link: a, el: t });
  });
  // sections with no nav link of their own (Selected work) still count, so
  // reaching one clears the highlight instead of leaving the one above lit
  if (sections.length) {
    each(document.querySelectorAll('main > section[id]'), function(el){
      for (var i = 0; i < sections.length; i++) if (sections[i].el === el) return;
      sections.push({ link: null, el: el });
    });
    sections.sort(function(a, b){
      return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1;
    });
  }
  function spy(){
    if (!sections.length) return;
    var line = (window.innerHeight || 0) * 0.3;
    var cur = null;
    each(sections, function(s){
      if (s.el.getBoundingClientRect().top <= line) cur = s;
    });
    // the last section is short and sits at the foot of the page, so it can
    // never reach the trigger line; at the bottom of the scroll it wins
    var d = document.documentElement;
    if (d.scrollTop + d.clientHeight >= d.scrollHeight - 4) cur = sections[sections.length - 1];
    each(sections, function(s){
      if (!s.link) return;
      var on = (s === cur);
      if (on && s.link.className.indexOf('here') === -1) s.link.className += ' here';
      else if (!on) s.link.className = s.link.className.replace(/\s*here/g, '');
    });
  }

  // ---- scroll progress --------------------------------------------------
  var bar = document.querySelector('.progress');
  if (motion) {
    var ticking = false;
    var onScroll = function(){
      // Reveal synchronously. requestAnimationFrame does not fire while the
      // page is hidden (background tab), which would otherwise leave the
      // ticking flag stuck true and strand every element at opacity 0.
      sweep();
      spy();
      moveTrail();
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function(){
        ticking = false;
        if (!bar) return;
        var d = document.documentElement;
        var max = d.scrollHeight - d.clientHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? d.scrollTop / max : 0) + ')';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    window.addEventListener('hashchange', onScroll);
    document.addEventListener('visibilitychange', function(){ ticking = false; onScroll(); });
    // A deep link (#live) jumps the page after this script runs and does not
    // always fire a scroll event, so re-sweep a few times early on.
    onScroll();
    setTimeout(onScroll, 0);
    setTimeout(onScroll, 150);
    setTimeout(onScroll, 600);
  }

  // ---- pointer cursor ---------------------------------------------------
  // A ring that trails the pointer across the whole page, with a dot at the
  // exact position. Mouse-only: touch and reduced motion never see it, and
  // the native cursor is only hidden once a real mouse has moved.
  if (motion && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    var cur = document.createElement('div');
    cur.className = 'cursorlayer';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cring"></span><span class="cdot"></span><span class="clabel"></span>';
    document.body.appendChild(cur);
    var curLabel = cur.querySelector('.clabel');
    var jx = 0, jy = 0, rx = 0, ry = 0, started = false, raf = 0;
    var loop = function(){
      rx += (jx - rx) * 0.19;
      ry += (jy - ry) * 0.19;
      cur.style.setProperty('--rx', rx.toFixed(1) + 'px');
      cur.style.setProperty('--ry', ry.toFixed(1) + 'px');
      cur.style.setProperty('--x', jx + 'px');
      cur.style.setProperty('--y', jy + 'px');
      raf = (Math.abs(jx - rx) > .3 || Math.abs(jy - ry) > .3)
        ? window.requestAnimationFrame(loop) : 0;
    };
    // what the ring says over each kind of target
    var labelFor = function(el){
      if (!el || !el.closest) return '';
      if (el.closest('.steps .card')) return 'explore';
      if (el.closest('.project .media')) return 'watch';
      if (el.closest('.avatar')) return 'flip';
      if (el.closest('.live article')) return 'open';
      if (el.closest('.workcard')) return 'open';
      return '';
    };
    document.addEventListener('pointermove', function(e){
      if (e.pointerType && e.pointerType !== 'mouse') return;
      jx = e.clientX; jy = e.clientY;
      if (!started) { started = true; rx = jx; ry = jy; document.documentElement.classList.add('cursoring'); }
      if (!raf) raf = window.requestAnimationFrame(loop);
      var t = e.target;
      var hot = t.closest && t.closest('a,button,summary,input,textarea,select,[role="button"]');
      cur.classList.toggle('on-hot', !!hot);
      var text = hot ? '' : labelFor(t);
      cur.classList.toggle('on-card', !!text);
      if (curLabel.textContent !== text) curLabel.textContent = text;
    }, { passive: true });
    document.addEventListener('pointerdown', function(){ cur.classList.add('pressing'); });
    document.addEventListener('pointerup', function(){ cur.classList.remove('pressing'); });
    // leaving the window, or a device without a mouse taking over, hides it
    document.addEventListener('pointerleave', function(){ cur.classList.add('gone'); });
    document.addEventListener('pointerenter', function(){ cur.classList.remove('gone'); });
    window.addEventListener('blur', function(){ cur.classList.add('gone'); });
    window.addEventListener('focus', function(){ cur.classList.remove('gone'); });
  }

  // ---- hero polish ------------------------------------------------------
  // Stagger index for the role pills, and a pointer parallax that leans the
  // hero a few pixels toward the cursor. Both are decoration: the CSS falls
  // back to a plain state when the variables are never set.
  each(document.querySelectorAll('.tags li'), function(li, i){
    li.style.setProperty('--i', i);
  });
  var heroWrap = document.querySelector('.hero .wrap');
  if (heroWrap && motion && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', function(e){
      var r = heroWrap.getBoundingClientRect();
      if (r.bottom < 0) return;
      heroWrap.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      heroWrap.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    }, { passive: true });
  }

  // ---- avatar flip ------------------------------------------------------
  var av = document.querySelector('.avatar');
  if (av) {
    av.addEventListener('click', function(){
      var on = av.getAttribute('aria-pressed') === 'true';
      av.setAttribute('aria-pressed', on ? 'false' : 'true');
      av.setAttribute('aria-label', on ? 'Show illustrated avatar' : 'Show photo');
    });
  }

  // ---- typed headline ---------------------------------------------------
  var typed = document.querySelector('.typed-out');
  if (typed && motion) {
    var phrases = ['Abdallah Mahmoud', 'a Unity AR/VR dev', 'an XR problem solver'];
    var pi = 0, ci = 0, deleting = false;
    var tick = function(){
      var full = phrases[pi];
      ci += deleting ? -1 : 1;
      typed.textContent = full.slice(0, ci);
      var wait = deleting ? 45 : 85;
      if (!deleting && ci === full.length) { deleting = true; wait = 1900; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; wait = 320; }
      setTimeout(tick, wait);
    };
    // start from the name already on screen, then delete and cycle
    ci = phrases[0].length; deleting = true;
    setTimeout(tick, 2200);
  }

  // ---- accent picker -----------------------------------------------------
  // Swaps the two accent colours the whole page is built from. The choice is
  // an attribute on the root, so every rule that reads --teal or --clay
  // follows, and it is re-applied before paint on the next visit.
  var palBtn = document.querySelector('.masthead .palette');
  var swatches = document.getElementById('swatches');
  if (palBtn && swatches) {
    var marks = swatches.querySelectorAll('button');
    var markCurrent = function(){
      var now = document.documentElement.getAttribute('data-accent') || 'red';
      each(marks, function(m){
        m.setAttribute('aria-pressed', m.getAttribute('data-accent') === now ? 'true' : 'false');
      });
    };
    var openPicker = function(open){
      swatches.classList.toggle('open', open);
      palBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    palBtn.addEventListener('click', function(e){
      e.stopPropagation();
      openPicker(palBtn.getAttribute('aria-expanded') !== 'true');
    });
    each(marks, function(m){
      m.addEventListener('click', function(){
        var key = m.getAttribute('data-accent');
        var root = document.documentElement;
        // reuse the theme change fade so the accent eases in rather than snaps
        if (!reduce) {
          root.classList.add('theming');
          window.clearTimeout(root._themeT);
          root._themeT = window.setTimeout(function(){ root.classList.remove('theming'); }, 700);
        }
        root.setAttribute('data-accent', key);
        try { localStorage.setItem('accent', key); } catch (err) {}
        markCurrent();
        openPicker(false);
      });
    });
    document.addEventListener('click', function(e){
      if (!swatches.contains(e.target) && !palBtn.contains(e.target)) openPicker(false);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' || e.keyCode === 27) openPicker(false);
    });
    markCurrent();
  }

  // ---- theme toggle -----------------------------------------------------
  // ---- mobile dropdown nav ---------------------------------------------
  var navBtn = document.querySelector('.navtoggle');
  var nav = document.getElementById('mainnav');
  if (navBtn && nav) {
    var setNav = function(open){
      nav.classList.toggle('open', open);
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    navBtn.addEventListener('click', function(e){
      e.stopPropagation();
      setNav(navBtn.getAttribute('aria-expanded') !== 'true');
    });
    // a link closes it; the anchor scroll still runs
    nav.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('a')) setNav(false);
    });
    document.addEventListener('click', function(e){
      if (!nav.contains(e.target) && !navBtn.contains(e.target)) setNav(false);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' || e.keyCode === 27) setNav(false);
    });
    // widening past the breakpoint puts the nav back in the header row, where
    // the .open class would otherwise be a stale no-op class on a flex row
    window.addEventListener('resize', function(){
      if (window.innerWidth > 640) setNav(false);
    });
  }

  var themeBtn = document.querySelector('.masthead .theme');
  if (themeBtn) {
    var sysDark = function(){
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    var current = function(){
      var set = document.documentElement.getAttribute('data-theme');
      return set === 'dark' || set === 'light' ? set : (sysDark() ? 'dark' : 'light');
    };
    var meta = document.querySelector('meta[name="theme-color"]');
    var label = function(){
      var dark = current() === 'dark';
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeBtn.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
      if (meta) meta.setAttribute('content', dark ? '#0F1513' : '#E4E7E4');
    };
    var apply = function(next){
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    };
    themeBtn.addEventListener('click', function(){
      var next = current() === 'dark' ? 'light' : 'dark';
      var root = document.documentElement;
      if (reduce) { apply(next); return; }
      // The palette itself is animated (see :root.theming in the stylesheet),
      // so the page changes in place: no cover, nothing to wait for.
      root.classList.add('theming');
      apply(next);
      window.clearTimeout(root._themeT);
      root._themeT = window.setTimeout(function(){ root.classList.remove('theming'); }, 700);
    });
    // follow the system while the visitor has not made a choice of their own
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onSys = function(){
        var stored = null;
        try { stored = localStorage.getItem('theme'); } catch (e) {}
        if (stored !== 'dark' && stored !== 'light') label();
      };
      if (mq.addEventListener) mq.addEventListener('change', onSys);
      else if (mq.addListener) mq.addListener(onSys);
    }
    label();
  }

  // ---- smooth anchor scrolling -----------------------------------------
  if (motion) {
    each(document.querySelectorAll('a[href^="#"]'), function(a){
      a.addEventListener('click', function(ev){
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t || !t.scrollIntoView) return;
        ev.preventDefault();
        try { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        catch (err) { t.scrollIntoView(); }
      });
    });
  }

  // project clips run a little quick so a loop reads at a glance
  var SPEED = 1.4;

  function setSpeed(v){ try { v.playbackRate = SPEED; } catch (e) {} }

  // Work-card previews sit inside a link, so they never get controls of
  // their own: if they cannot play, the poster simply stays.
  function isThumb(v){ return (' ' + v.parentNode.className + ' ').indexOf(' thumb ') !== -1; }
  function giveControls(v){ if (!isThumb(v)) v.setAttribute('controls',''); }

  function tryPlay(v){
    setSpeed(v);
    var p;
    try { p = v.play(); } catch (err) { giveControls(v); return; }
    // Autoplay can still be refused (iOS Low Power Mode, strict settings), so
    // fall back to a normal play button rather than a frozen poster. An
    // AbortError only means a new load interrupted this play (switching clips),
    // so it retries instead of leaving controls stuck on the card.
    if (p && p.then) p.catch(function(err){
      if (err && err.name === 'AbortError') {
        setTimeout(function(){ if (v.paused && !v.hasAttribute('controls')) tryPlay(v); }, 250);
        return;
      }
      giveControls(v);
    });
  }

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      each(entries, function(e){
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          tryPlay(v);
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    each(vids, function(v){
      v.addEventListener('loadedmetadata', function(){ setSpeed(v); });
      io.observe(v);
    });
  } else {
    // No IntersectionObserver, or the visitor asked for reduced motion:
    // load the poster and give everyone ordinary controls.
    each(vids, giveControls);
  }

  each(document.querySelectorAll('.clips'), function(group){
    group.addEventListener('click', function(ev){
      var btn = closestButton(ev.target, group);
      if (!btn) return;
      var video = group.parentNode.querySelector('video');
      if (!video) return;
      each(group.getElementsByTagName('button'), function(b){
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      video.poster = btn.getAttribute('data-poster');
      video.preload = 'auto';
      video.src = pick(btn, 'data-src', 'data-src-sm');
      video.load();
      if (reduce || video.hasAttribute('controls')) return;
      tryPlay(video);
    });
  });
  // ---------- floating contact ----------
  // Appears once the top of the page is past, steps aside while #contact is
  // on screen.
  var fab = document.getElementById('fab');
  var fabBtn = document.getElementById('fabBtn');
  if (fab && fabBtn) {
    var contactIn = false;
    var closeFab = function(){
      fab.classList.remove('open');
      fabBtn.setAttribute('aria-expanded', 'false');
    };
    fabBtn.addEventListener('click', function(ev){
      ev.stopPropagation();
      var open = fab.classList.toggle('open');
      if (open) fab.classList.remove('tuck');
      fabBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function(ev){
      if (!fab.contains(ev.target)) closeFab();
    });
    document.addEventListener('keydown', function(ev){
      if (ev.key === 'Escape' || ev.keyCode === 27) closeFab();
    });
    var contact = document.getElementById('contact');
    if (window.IntersectionObserver && contact) {
      new IntersectionObserver(function(entries){
        contactIn = entries[0].isIntersecting;
        place();
      }, { rootMargin: '0px 0px -10% 0px' }).observe(contact);
    }
    var lastY = window.pageYOffset;
    var idle = 0;
    var place = function(){
      var y = window.pageYOffset;
      var past = y > (window.innerHeight * 0.75);
      var show = past && !contactIn;
      fab.classList.toggle('show', show);
      // Tuck it under the edge while the reader moves down the page. Scrolling
      // back up, or simply stopping, brings it straight back.
      if (!fab.classList.contains('open')) {
        var bottom = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
        if (y - lastY > 8 && !bottom) fab.classList.add('tuck');
        else if (lastY - y > 8 || bottom) fab.classList.remove('tuck');
      }
      lastY = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(function(){ fab.classList.remove('tuck'); }, 650);
      if (!show) closeFab();
    };
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();
  }

})();
