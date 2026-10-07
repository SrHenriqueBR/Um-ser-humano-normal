'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const introduction = {
    id: 'apresentacao',
    title: 'Antes da primeira página',
    paragraphs: [
      'Henrique sempre acreditou ser apenas um garoto comum.',
      'Aos 18 anos, sua vida parecia seguir como a de qualquer outro jovem: família, jogos, responsabilidades, dúvidas sobre o futuro e sentimentos que ele ainda tentava compreender.',
      'Até conhecer Hyejin.',
      'O que começa com encontros inesperados, conversas, brincadeiras e sentimentos que crescem aos poucos transforma completamente o mundo de Henrique. Entre momentos felizes, perdas, escolhas e acontecimentos que parecem fugir de qualquer explicação, ele começa a perceber que talvez sua existência nunca tenha sido tão normal quanto imaginava.',
      'Há algo escondido dentro dele. Algo antigo. Algo que nem mesmo Henrique conhece.',
      'Mas até quando Henrique poderá continuar se chamando de um ser humano normal?'
    ]
  };

  const valid = c => c && typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.paragraphs);
  const chapters = (window.BOOK_CHAPTERS || []).filter(valid);
  const extras = (window.BOOK_EXTRAS || []).filter(valid);
  const entries = [introduction, ...chapters, ...extras];
  const books = window.BOOKS || [{ id: 1, title: 'Um ser humano normal?' }];
  const bookTitle = e => books.find(b => b.id === (e.book || 1))?.title || '';
  const label = e => e.number ? `Capítulo ${String(e.number).padStart(2, '0')}` : e.id === 'apresentacao' ? 'Apresentação' : 'Arte extra';

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('ushn-reader-v1')) || {}; } catch (_) {}
  let current = Math.max(0, entries.findIndex(e => e.id === saved.id));
  let fontSize = Number.isFinite(saved.size) ? Math.max(16, Math.min(28, saved.size)) : 20;
  let night = saved.night === true;
  let art = Number.isInteger(saved.art) ? Math.max(0, saved.art) : 0;

  function save() {
    try { localStorage.setItem('ushn-reader-v1', JSON.stringify({ id: entries[current].id, size: fontSize, night, art })); } catch (_) {}
  }
  function setHash() { history.replaceState(null, '', '#ler/' + entries[current].id); }
  function preferences() {
    document.documentElement.style.setProperty('--reading-size', fontSize + 'px');
    $('font-size').textContent = fontSize;
    $('smaller').disabled = fontSize <= 16;
    $('larger').disabled = fontSize >= 28;
    $('page').classList.toggle('night', night);
    $('theme').setAttribute('aria-pressed', String(night));
    $('theme').querySelector('span').textContent = night ? 'Papel' : 'Noite';
  }
  function renderStory() {
    const e = entries[current];
    $('reader-book-title').textContent = bookTitle(e);
    $('reader-title').textContent = e.title;
    $('entry-label').textContent = label(e).toUpperCase();
    $('page-label').textContent = label(e).toUpperCase();
    $('reader-body').replaceChildren(...e.paragraphs.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
    $('reader-body').hidden = !e.paragraphs.length;
    $('page-number').textContent = label(e);
    $('previous').disabled = current === 0;
    $('next').disabled = current === chapters.length || current === entries.length - 1;
    $('chapter-select').value = String(current);
    $('reader-links').replaceChildren();
    const marker = document.createElement('p');
    marker.className = 'active-reading';
    marker.textContent = `${label(e)} · ${e.title}`;
    $('reader-links').append(marker);
    const hasManga = !!e.images?.length;
    $('mode-manga').disabled = !hasManga;
    $('mode-manga-count').textContent = hasManga ? ` · ${e.images.length}` : '';
    $('reading-notice').hidden = !hasManga;
    $('reading-notice').textContent = hasManga ? (e.paragraphs.length ? `Este capítulo também possui ${e.images.length} páginas/artes no modo mangá.` : 'Disponível em mangá. Abra “Ver mangá” para ler a prancha original. O texto integral ainda não foi incorporado.') : '';
    $('mode-story').disabled = !e.paragraphs.length;
    $('mode-story').classList.add('active');
    $('mode-manga').classList.remove('active');
    preferences();
  }
  function openStory(index) {
    current = index;
    art = 0;
    renderStory();
    save();
    setHash();
    $('reader-title').focus({ preventScroll: true });
    $('page').scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function makeRow(e, index) {
    const row = document.createElement('div');
    row.className = 'chapter-row chapter-row-actions';
    row.dataset.entryIndex = String(index);
    row.dataset.search = `${label(e)} ${e.title}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const n = document.createElement('span');
    n.className = 'chapter-number';
    n.textContent = e.number ? String(e.number).padStart(2, '0') : '◇';
    const name = document.createElement('span');
    name.className = 'chapter-name';
    name.textContent = e.title;
    const info = document.createElement('small');
    info.textContent = e.images?.length ? `${e.images.length} ${e.images.length > 1 ? 'páginas/artes de mangá' : 'página/arte de mangá'}` : (e.number ? 'Leitura em texto' : 'Apresentação');
    name.append(info);
    const actions = document.createElement('span');
    actions.className = 'chapter-actions';
    const read = document.createElement('button');
    read.type = 'button';
    read.className = 'chapter-action';
    read.textContent = '📖 Ler';
    read.addEventListener('click', () => openStory(index));
    if (e.paragraphs.length) actions.append(read);
    if (e.images?.length) {
      const manga = document.createElement('button');
      manga.type = 'button';
      manga.className = 'chapter-action manga-action';
      manga.textContent = '🎨 Ver mangá';
      manga.addEventListener('click', () => openManga(index));
      actions.append(manga);
    }
    row.append(n, name, actions);
    return row;
  }

  entries.forEach((e, i) => {
    (i <= chapters.length ? $('chapter-list') : $('extra-list')).append(makeRow(e, i));
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${label(e)} · ${e.title}`;
    $('chapter-select').append(option);
  });
  let selectedBook = 'all';
  function filterChapters() {
    const q = $('chapter-search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let count = 0;
    [...$('chapter-list').children].forEach(row => {
      const entry = entries[Number(row.dataset.entryIndex)];
      const match = (selectedBook === 'all' || (entry.book || 1) === Number(selectedBook)) && (/^\d+$/.test(q) ? entry.number === Number(q) : row.dataset.search.includes(q));
      row.hidden = !match;
      if (match) count++;
    });
    $('search-status').textContent = q ? (count ? `${count} resultado${count > 1 ? 's' : ''}` : 'Nenhum capítulo encontrado.') : '';
    $('chapter-count').textContent = chapters.filter(c => selectedBook === 'all' || (c.book || 1) === Number(selectedBook)).length + ' capítulos no catálogo';
  }
  $('chapter-search').addEventListener('input', filterChapters);
  document.querySelectorAll('[data-book-filter]').forEach(button => button.addEventListener('click', () => {
    selectedBook = button.dataset.bookFilter;
    document.querySelectorAll('[data-book-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    filterChapters();
  }));
  filterChapters();
  $('chapter-select').addEventListener('change', () => openStory(Number($('chapter-select').value)));
  $('previous').addEventListener('click', () => { if (current > 0) openStory(current - 1); });
  $('next').addEventListener('click', () => { if (!$('next').disabled) openStory(current + 1); });
  $('smaller').addEventListener('click', () => { fontSize = Math.max(16, fontSize - 2); preferences(); save(); });
  $('larger').addEventListener('click', () => { fontSize = Math.min(28, fontSize + 2); preferences(); save(); });
  $('theme').addEventListener('click', () => { night = !night; preferences(); save(); });
  $('mode-story').addEventListener('click', () => $('reader-body').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('mode-manga').addEventListener('click', () => openManga(current));
  $('start').addEventListener('click', e => { e.preventDefault(); $('page').scrollIntoView({ behavior: 'smooth' }); });

  // ----- Leitor de mangá contínuo -----
  const chapterPages = [];
  const extraPages = [];
  const seenPages = new Set();
  entries.forEach((e, entryIndex) => e.images?.forEach((image, imageIndex) => {
    const key = `${entryIndex <= chapters.length ? e.book || 1 : 'extra'}:${image.src}`;
    if (seenPages.has(key)) return;
    seenPages.add(key);
    (entryIndex <= chapters.length ? chapterPages : extraPages).push({ entryIndex, imageIndex, image });
  }));

  let sequence = [];
  let pageIndex = 0;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let turning = false;
  let turnSerial = 0;
  let gesture = null;
  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  const injected = document.createElement('style');
  injected.textContent = `
    #manga-fullscreen{display:inline-flex!important;white-space:nowrap}
    #manga-top-next{border-color:#d9b87d66!important;color:#d9b87d!important}
    .manga-edge{opacity:.82!important;pointer-events:auto!important;font-weight:700}
    .manga-edge:disabled{opacity:.15!important;pointer-events:none!important}
    .manga-stage.is-zoomed .manga-edge{opacity:0!important;pointer-events:none!important}
    .manga-corner{position:absolute;width:60px;height:60px;z-index:11;pointer-events:none;opacity:.28}
    .manga-corner:before{content:'';position:absolute;inset:0;border:2px solid #d9b87d88;border-right:0;border-bottom:0}
    .ctl{top:8px;left:8px}.ctr{top:8px;right:8px;transform:scaleX(-1)}.cbl{bottom:8px;left:8px;transform:scaleY(-1)}.cbr{bottom:8px;right:8px;transform:scale(-1)}
    .manga-stage.is-zoomed .manga-corner{display:none}
    .manga-shell:fullscreen,.manga-shell.cinema{position:fixed;inset:0;width:100vw;height:100dvh;display:block;background:#030406;z-index:2147483647}
    .manga-shell:fullscreen .manga-stage,.manga-shell.cinema .manga-stage{position:absolute;inset:0}
    .manga-shell:fullscreen .manga-book,.manga-shell.cinema .manga-book{width:100vw;height:100dvh;max-height:100dvh;padding:64px 45px 48px}
    .manga-shell:fullscreen .manga-topbar,.manga-shell.cinema .manga-topbar{position:absolute;inset:0 0 auto;z-index:30;background:linear-gradient(#05070aee,#05070aaa,transparent);border:0}
    .manga-shell:fullscreen .manga-bottombar,.manga-shell.cinema .manga-bottombar{position:absolute;inset:auto 0 0;z-index:30;background:linear-gradient(transparent,#05070aaa,#05070aee);border:0}
    @media(max-width:800px){#manga-fullscreen{display:inline-flex!important;font-size:0}#manga-fullscreen:after{content:'⛶';font-size:18px}#manga-top-next{font-size:0}#manga-top-next:after{content:'→';font-size:18px}.manga-edge{bottom:54px!important;top:auto!important;transform:none!important}.manga-shell:fullscreen .manga-book,.manga-shell.cinema .manga-book{padding:54px 8px 40px}}
  `;
  document.head.append(injected);

  const topNext = document.createElement('button');
  topNext.id = 'manga-top-next';
  topNext.type = 'button';
  topNext.textContent = 'Próxima →';
  topNext.setAttribute('aria-label', 'Próxima página');
  document.querySelector('.manga-controls').insertBefore(topNext, $('manga-close'));
  ['ctl','ctr','cbl','cbr'].forEach(cls => { const c = document.createElement('span'); c.className = 'manga-corner ' + cls; $('manga-stage').append(c); });
  $('manga-fullscreen').textContent = '⛶ Tela cheia';

  const page = () => sequence[pageIndex];
  const pageAt = delta => sequence[pageIndex + delta];
  const pageSequence = entryIndex => entryIndex <= chapters.length ? chapterPages.filter(p => (entries[p.entryIndex].book || 1) === (entries[entryIndex].book || 1)) : extraPages;

  function setTurningState(value) {
    turning = value;
    const prev = pageAt(-1);
    const next = pageAt(1);
    $('manga-prev').disabled = value || !prev;
    $('manga-next').disabled = value || !next;
    topNext.disabled = value || !next;
  }

  function updateNavigation() {
    const p = page();
    if (!p) return;
    const prev = pageAt(-1);
    const next = pageAt(1);
    const prevChapter = prev && prev.entryIndex !== p.entryIndex;
    const nextChapter = next && next.entryIndex !== p.entryIndex;
    $('manga-prev').textContent = prev ? (prevChapter ? '← Capítulo anterior' : '← Página anterior') : '← Início';
    $('manga-next').textContent = next ? (nextChapter ? 'Próximo capítulo →' : 'Próxima página →') : 'Fim do mangá';
    topNext.textContent = next ? (nextChapter ? 'Próximo capítulo →' : 'Próxima →') : 'Fim';
    setTurningState(turning);
  }

  function setPageSource(preferredEntryIndex) {
    const p = page();
    if (!p) return;
    const preferred = Number.isInteger(preferredEntryIndex) && entries[preferredEntryIndex]?.images?.findIndex(im => im.src === p.image.src);
    current = preferred !== false && preferred >= 0 ? preferredEntryIndex : p.entryIndex;
    art = preferred !== false && preferred >= 0 ? preferred : p.imageIndex;
    const e = entries[current];
    $('manga-image').src = p.image.src;
    $('manga-image').alt = `${label(e)} — ${p.image.title}`;
    $('manga-under-image').src = p.image.src;
    $('manga-under-image').alt = '';
    $('manga-chapter').textContent = label(e).toUpperCase();
    $('manga-title').textContent = p.image.chapterNumbers?.length > 1 ? p.image.title : e.title;
    $('manga-title').title = bookTitle(e) + ' · ' + p.image.title;
    $('manga-position').textContent = `Página ${pageIndex + 1} de ${sequence.length} · ${p.image.chapterNumbers?.length > 1 ? 'Prancha dos capítulos ' + p.image.chapterNumbers.join(', ') : label(e)}`;
    updateNavigation();
    save();
    setHash();
  }

  function applyTransform() {
    $('manga-book').style.transform = `translate3d(${panX}px,${panY}px,0) scale(${zoom})`;
    const pct = Math.round(zoom * 100);
    $('manga-zoom').value = String(pct);
    $('manga-zoom-label').textContent = pct + '%';
    $('manga-zoom-reset').textContent = pct + '%';
    const canTurn = zoom <= 1.15;
    $('manga-stage').classList.toggle('can-turn', canTurn);
    $('manga-stage').classList.toggle('is-zoomed', !canTurn);
    $('manga-pan-hint').textContent = canTurn ? 'Puxe um canto, arraste para o lado ou clique em Próxima página.' : 'Zoom ativo · arraste a imagem. Volte perto de 100% para virar a página.';
  }
  function setZoom(value) {
    zoom = Math.max(1, Math.min(3, value));
    if (zoom <= 1.05) panX = panY = 0;
    applyTransform();
  }
  function resetView() { zoom = 1; panX = panY = 0; applyTransform(); }

  function openManga(entryIndex) {
    const e = entries[entryIndex];
    if (!e?.images?.length) return;
    sequence = pageSequence(entryIndex);
    const selectedImage = e.images[entryIndex === current ? art : 0] || e.images[0];
    let found = sequence.findIndex(p => p.image.src === selectedImage.src);
    if (found < 0) found = sequence.findIndex(p => p.entryIndex === entryIndex);
    pageIndex = Math.max(0, found);
    gesture = null;
    pointers.clear();
    setTurningState(false);
    resetView();
    setPageSource(entryIndex);
    if (!$('manga-dialog').open) $('manga-dialog').showModal();
    document.body.classList.add('dialog-open');
    requestAnimationFrame(() => $('manga-stage').focus({ preventScroll: true }));
  }

  function preload(src) {
    return new Promise(resolve => {
      const img = new Image();
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      img.onload = finish;
      img.onerror = finish;
      img.src = src;
      if (img.complete) finish();
      setTimeout(finish, 900);
    });
  }

  async function turnPage(delta, fromDrag = false) {
    if (turning || zoom > 1.15) return;
    const target = pageAt(delta);
    if (!target) return;
    const serial = ++turnSerial;
    setTurningState(true);
    const sheet = $('manga-sheet');
    const under = $('manga-under-image');
    under.src = target.image.src;
    await preload(target.image.src);
    if (serial !== turnSerial) return;

    const currentTransform = fromDrag ? getComputedStyle(sheet).transform : 'none';
    const end = delta > 0 ? 'rotateY(-180deg) scale(.98)' : 'rotateY(180deg) scale(.98)';
    const frames = fromDrag
      ? [{ transform: currentTransform === 'none' ? 'rotateY(0deg)' : currentTransform, opacity: Number(getComputedStyle(sheet).opacity) || 1 }, { transform: end, opacity: 0 }]
      : [{ transform: 'rotateY(0deg)', opacity: 1, filter: 'brightness(1)' }, { transform: delta > 0 ? 'rotateY(-92deg) scale(.99)' : 'rotateY(92deg) scale(.99)', opacity: .88, filter: 'brightness(.74)' }, { transform: end, opacity: 0, filter: 'brightness(.55)' }];

    const animation = sheet.animate(frames, { duration: fromDrag ? 280 : 560, easing: 'cubic-bezier(.55,.08,.2,1)', fill: 'forwards' });
    try { await Promise.race([animation.finished, new Promise(r => setTimeout(r, 700))]); } catch (_) {}
    if (serial !== turnSerial) return;
    animation.cancel();
    sheet.style.cssText = '';
    pageIndex += delta;
    resetView();
    setPageSource();
    setTurningState(false);
  }

  function cancelGestureVisual() {
    const sheet = $('manga-sheet');
    sheet.animate([{ transform: getComputedStyle(sheet).transform, opacity: getComputedStyle(sheet).opacity }, { transform: 'rotateY(0deg)', opacity: 1 }], { duration: 180, easing: 'ease-out' })
      .finished.finally(() => { sheet.style.cssText = ''; }).catch(() => { sheet.style.cssText = ''; });
  }

  function cornerDirection(x, y) {
    if (zoom > 1.15 || turning) return 0;
    const r = $('manga-stage').getBoundingClientRect();
    const edgeX = Math.min(160, r.width * .22);
    const edgeY = Math.min(190, r.height * .30);
    const inTopBottom = y - r.top < edgeY || r.bottom - y < edgeY;
    if (!inTopBottom) return 0;
    if (r.right - x < edgeX && pageAt(1)) return 1;
    if (x - r.left < edgeX && pageAt(-1)) return -1;
    return 0;
  }

  function pointerDistance() {
    const p = [...pointers.values()];
    return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }

  $('manga-stage').addEventListener('pointerdown', e => {
    if (e.target.closest('button,input') || turning) return;
    $('manga-stage').setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      gesture = { type: 'pinch' };
      pinchStartDistance = pointerDistance();
      pinchStartZoom = zoom;
      return;
    }

    if (zoom > 1.05) {
      gesture = { type: 'pan', id: e.pointerId, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
      return;
    }

    const dir = cornerDirection(e.clientX, e.clientY);
    gesture = {
      type: dir ? 'corner' : 'swipe',
      id: e.pointerId,
      dir,
      startX: e.clientX,
      startY: e.clientY,
      progress: 0
    };
    if (dir) $('manga-under-image').src = pageAt(dir).image.src;
  });

  $('manga-stage').addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const d = pointerDistance();
      if (!pinchStartDistance) { pinchStartDistance = d; pinchStartZoom = zoom; }
      setZoom(pinchStartZoom * (d / Math.max(1, pinchStartDistance)));
      return;
    }
    if (!gesture || gesture.id !== e.pointerId) return;

    if (gesture.type === 'pan') {
      panX = gesture.startPanX + (e.clientX - gesture.startX);
      panY = gesture.startPanY + (e.clientY - gesture.startY);
      applyTransform();
      return;
    }

    const dx = e.clientX - gesture.startX;
    const sheet = $('manga-sheet');
    if (gesture.type === 'corner') {
      const r = $('manga-stage').getBoundingClientRect();
      const amount = gesture.dir > 0 ? -dx : dx;
      gesture.progress = Math.max(0, Math.min(1, amount / Math.max(140, r.width * .38)));
      const angle = (gesture.dir > 0 ? -1 : 1) * gesture.progress * 165;
      sheet.style.transition = 'none';
      sheet.style.transformOrigin = gesture.dir > 0 ? 'left center' : 'right center';
      sheet.style.transform = `rotateY(${angle}deg) scale(${1 - gesture.progress * .018})`;
      sheet.style.opacity = String(1 - gesture.progress * .48);
      return;
    }

    const max = 120;
    const clamped = Math.max(-max, Math.min(max, dx));
    sheet.style.transition = 'none';
    sheet.style.transform = `translateX(${clamped * .18}px) rotateY(${clamped * .05}deg)`;
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const g = gesture && gesture.id === e.pointerId ? gesture : null;

    if (pointers.size < 2) { pinchStartDistance = 0; pinchStartZoom = zoom; }
    if (!g) { if (!pointers.size && gesture?.type === 'pinch') gesture = null; return; }

    gesture = null;

    if (g.type === 'pan') return;
    if (g.type === 'corner') {
      const commit = g.progress >= .26;
      if (commit) turnPage(g.dir, true);
      else cancelGestureVisual();
      return;
    }
    if (g.type === 'swipe' && zoom <= 1.15) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (Math.abs(dx) >= 85 && Math.abs(dx) > Math.abs(dy) * 1.15) turnPage(dx < 0 ? 1 : -1);
      else cancelGestureVisual();
    }
  }

  $('manga-stage').addEventListener('pointerup', endPointer);
  $('manga-stage').addEventListener('pointercancel', endPointer);

  $('manga-prev').addEventListener('click', e => { e.stopPropagation(); turnPage(-1); });
  $('manga-next').addEventListener('click', e => { e.stopPropagation(); turnPage(1); });
  topNext.addEventListener('click', e => { e.stopPropagation(); turnPage(1); });
  $('manga-zoom-out').addEventListener('click', () => setZoom(zoom - .25));
  $('manga-zoom-in').addEventListener('click', () => setZoom(zoom + .25));
  $('manga-zoom-reset').addEventListener('click', resetView);
  $('manga-zoom').addEventListener('input', () => setZoom(Number($('manga-zoom').value) / 100));
  $('manga-stage').addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom + (e.deltaY < 0 ? .1 : -.1)); }
  }, { passive: false });
  $('manga-stage').addEventListener('dblclick', e => {
    if (e.target.closest('button,input') || turning) return;
    setZoom(zoom > 1.15 ? 1 : 2);
  });

  $('manga-close').addEventListener('click', () => $('manga-dialog').close());
  $('manga-dialog').addEventListener('close', () => {
    turnSerial++;
    turning = false;
    gesture = null;
    pointers.clear();
    document.body.classList.remove('dialog-open');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.querySelector('.manga-shell').classList.remove('cinema');
    renderStory();
    resetView();
  });

  async function toggleFullscreen() {
    const shell = document.querySelector('.manga-shell');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.requestFullscreen) await shell.requestFullscreen({ navigationUI: 'hide' });
      else shell.classList.toggle('cinema');
    } catch (_) { shell.classList.toggle('cinema'); }
  }
  $('manga-fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => { $('manga-fullscreen').textContent = document.fullscreenElement ? '⛶ Sair' : '⛶ Tela cheia'; });

  $('manga-dialog').addEventListener('keydown', e => {
    if (e.repeat || turning) return;
    if (e.key === 'ArrowRight' && zoom <= 1.15) { e.preventDefault(); turnPage(1); }
    else if (e.key === 'ArrowLeft' && zoom <= 1.15) { e.preventDefault(); turnPage(-1); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(zoom + .25); }
    else if (e.key === '-') { e.preventDefault(); setZoom(zoom - .25); }
    else if (e.key === '0') { e.preventDefault(); resetView(); }
  });

  const hashId = location.hash.startsWith('#ler/') ? location.hash.slice(5) : null;
  if (hashId) {
    const found = entries.findIndex(e => e.id === hashId);
    if (found >= 0) current = found;
  }
  renderStory();
})();
