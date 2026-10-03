'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
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

  const valid = c => c
    && typeof c.id === 'string'
    && typeof c.title === 'string'
    && Array.isArray(c.paragraphs)
    && c.paragraphs.every(p => typeof p === 'string')
    && (c.paragraphs.length || (Array.isArray(c.images) && c.images.length && c.images.every(i => /^assets\/chapters\/art-\d+\.webp$/.test(i.src))));

  const chapters = (window.BOOK_CHAPTERS || []).filter(valid);
  const extras = (window.BOOK_EXTRAS || []).filter(valid);
  const entries = [introduction, ...chapters, ...extras];

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('ushn-reader-v1')) || {}; } catch (_) {}

  let current = Math.max(0, entries.findIndex(e => e.id === saved.id));
  let size = Number.isFinite(saved.size) ? Math.max(16, Math.min(28, saved.size)) : 20;
  let night = saved.night === true;
  let progress = Number.isFinite(saved.progress) ? Math.max(0, Math.min(1, saved.progress)) : 0;
  let art = Number.isInteger(saved.art) ? Math.max(0, saved.art) : 0;

  let restoring = false;
  let restoreTimer;
  let mangaZoom = 1;
  let panX = 0;
  let panY = 0;
  let turning = false;
  const pointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let swipeStartX = 0;

  const label = item => item.number
    ? 'Capítulo ' + String(item.number).padStart(2, '0')
    : item.id === 'apresentacao' ? 'Apresentação' : 'Arte extra';

  function persist() {
    try {
      localStorage.setItem('ushn-reader-v1', JSON.stringify({
        id: entries[current].id,
        size,
        night,
        progress,
        art
      }));
    } catch (_) {}
  }

  function preferences() {
    document.documentElement.style.setProperty('--reading-size', size + 'px');
    $('font-size').textContent = size;
    $('smaller').disabled = size <= 16;
    $('larger').disabled = size >= 28;
    $('page').classList.toggle('night', night);
    $('theme').setAttribute('aria-pressed', String(night));
    $('theme').setAttribute('aria-label', night ? 'Ativar leitura em papel' : 'Ativar leitura noturna');
    $('theme').querySelector('span').textContent = night ? 'Papel' : 'Noite';
  }

  function setReaderModeButtons(item) {
    const hasManga = Array.isArray(item.images) && item.images.length > 0;
    $('mode-story').classList.add('active');
    $('mode-story').setAttribute('aria-pressed', 'true');
    $('mode-manga').classList.remove('active');
    $('mode-manga').setAttribute('aria-pressed', 'false');
    $('mode-manga').disabled = !hasManga;
    $('mode-manga-count').textContent = hasManga ? ` · ${item.images.length}` : '';
  }

  function render() {
    const item = entries[current];
    $('reader-title').textContent = item.title;
    $('entry-label').textContent = label(item).toUpperCase();
    $('page-label').textContent = label(item).toUpperCase();
    $('reader-body').replaceChildren(...item.paragraphs.map(text => {
      const p = document.createElement('p');
      p.textContent = text;
      return p;
    }));
    $('reader-body').hidden = !item.paragraphs.length;
    $('page').classList.remove('comic-page');

    setReaderModeButtons(item);

    const hasManga = Array.isArray(item.images) && item.images.length > 0;
    $('reading-notice').hidden = !hasManga;
    $('reading-notice').textContent = hasManga
      ? `Este capítulo também possui ${item.images.length} ${item.images.length > 1 ? 'páginas/artes' : 'página/arte'} no modo mangá.`
      : '';

    $('page-number').textContent = label(item);
    $('previous').disabled = current === 0;
    $('next').disabled = current === chapters.length || current === entries.length - 1;
    $('chapter-select').value = String(current);
    $('reader-links').replaceChildren();

    const marker = document.createElement('p');
    marker.className = 'active-reading';
    marker.textContent = label(item) + ' · ' + item.title;
    $('reader-links').append(marker);

    const next = entries[current + 1];
    if (hasManga && item.number && next?.number && next.number > item.number + 1) {
      $('reading-notice').textContent += ` O próximo disponível é o capítulo ${next.number}; há uma lacuna na coleção.`;
    }

    $('start').firstChild.textContent = saved.id || current ? 'Continuar lendo ' : 'Abrir o livro ';
    preferences();
  }

  function setHash() {
    history.replaceState(null, '', '#ler/' + entries[current].id);
  }

  function open(index, shouldScroll = true) {
    clearTimeout(restoreTimer);
    restoring = false;
    current = index;
    art = 0;
    progress = 0;
    render();
    persist();
    setHash();
    if (shouldScroll) {
      $('reader-title').focus({ preventScroll: true });
      $('page').scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  function makeRow(entry, index) {
    const row = document.createElement('div');
    row.className = 'chapter-row chapter-row-actions';
    row.dataset.search = (label(entry) + ' ' + entry.title)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const number = document.createElement('span');
    number.className = 'chapter-number';
    number.textContent = entry.number ? String(entry.number).padStart(2, '0') : '◇';

    const name = document.createElement('span');
    name.className = 'chapter-name';
    name.textContent = entry.title;

    const info = document.createElement('small');
    info.textContent = entry.images
      ? `${entry.images.length} ${entry.images.length > 1 ? 'páginas/artes de mangá' : 'página/arte de mangá'}`
      : (entry.number ? 'Leitura em texto' : 'Apresentação da obra · sem spoilers');
    name.append(info);

    const actions = document.createElement('span');
    actions.className = 'chapter-actions';

    const story = document.createElement('button');
    story.type = 'button';
    story.className = 'chapter-action story-action';
    story.textContent = '📖 Ler';
    story.addEventListener('click', () => open(index));

    actions.append(story);

    if (entry.images?.length) {
      const manga = document.createElement('button');
      manga.type = 'button';
      manga.className = 'chapter-action manga-action';
      manga.textContent = '🎨 Ver mangá';
      manga.addEventListener('click', () => openManga(index));
      actions.append(manga);
    }

    row.append(number, name, actions);
    return row;
  }

  entries.forEach((entry, index) => {
    (index <= chapters.length ? $('chapter-list') : $('extra-list')).append(makeRow(entry, index));
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = label(entry) + ' · ' + entry.title;
    $('chapter-select').append(option);
  });

  $('chapter-count').textContent = chapters.length + ' capítulos disponíveis';

  function filter() {
    const q = $('chapter-search').value.trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let count = 0;
    [...$('chapter-list').children].forEach((row, i) => {
      const match = /^\d+$/.test(q)
        ? entries[i].number === Number(q)
        : row.dataset.search.includes(q);
      row.hidden = !match;
      if (match) count++;
    });
    $('search-status').textContent = q
      ? (count ? `${count} resultado${count > 1 ? 's' : ''}` : 'Nenhum capítulo encontrado.')
      : '';
  }

  $('chapter-search').addEventListener('input', filter);
  $('chapter-select').addEventListener('change', () => open(Number($('chapter-select').value)));
  $('previous').addEventListener('click', () => { if (current > 0) open(current - 1); });
  $('next').addEventListener('click', () => { if (!$('next').disabled) open(current + 1); });
  $('smaller').addEventListener('click', () => { size = Math.max(16, size - 2); preferences(); persist(); });
  $('larger').addEventListener('click', () => { size = Math.min(28, size + 2); preferences(); persist(); });
  $('theme').addEventListener('click', () => { night = !night; preferences(); persist(); });

  $('mode-story').addEventListener('click', () => {
    $('mode-story').classList.add('active');
    $('mode-story').setAttribute('aria-pressed', 'true');
    $('reader-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('mode-manga').addEventListener('click', () => openManga(current));

  function mangaImages() {
    return entries[current]?.images || [];
  }

  function setMangaSource() {
    const images = mangaImages();
    if (!images.length) return;
    art = Math.max(0, Math.min(art, images.length - 1));
    const img = images[art];

    $('manga-image').src = img.src;
    $('manga-image').alt = `${label(entries[current])} — ${img.title}. Página de mangá em português.`;
    $('manga-under-image').src = img.src;
    $('manga-under-image').alt = '';
    $('manga-position').textContent = `Página ${art + 1} de ${images.length}`;
    $('manga-chapter').textContent = label(entries[current]).toUpperCase();
    $('manga-title').textContent = entries[current].title;
    $('manga-prev').disabled = art === 0;
    $('manga-next').disabled = art === images.length - 1;
    $('manga-next').textContent = art === images.length - 1 ? 'Fim do capítulo' : 'Próxima página →';
    persist();
  }

  function applyMangaTransform() {
    $('manga-book').style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${mangaZoom})`;
    $('manga-zoom').value = String(Math.round(mangaZoom * 100));
    $('manga-zoom-label').textContent = `${Math.round(mangaZoom * 100)}%`;
    $('manga-zoom-reset').textContent = `${Math.round(mangaZoom * 100)}%`;
    const canTurn = mangaZoom <= 1.15;
    $('manga-stage').classList.toggle('can-turn', canTurn);
    $('manga-stage').classList.toggle('is-zoomed', !canTurn);
    $('manga-pan-hint').textContent = canTurn
      ? 'Arraste para o lado ou use as setas para virar a página.'
      : 'Zoom ativo · arraste a imagem para explorar. Volte perto de 100% para virar a página.';
  }

  function resetMangaView() {
    mangaZoom = 1;
    panX = 0;
    panY = 0;
    applyMangaTransform();
  }

  function setMangaZoom(value) {
    const previous = mangaZoom;
    mangaZoom = Math.max(1, Math.min(3, value));
    if (mangaZoom <= 1.05 || mangaZoom < previous * 0.7) {
      panX = 0;
      panY = 0;
    }
    applyMangaTransform();
  }

  function openManga(index) {
    const entry = entries[index];
    if (!entry?.images?.length) return;
    if (index !== current) {
      current = index;
      art = 0;
      progress = 0;
      render();
      setHash();
    }
    art = Math.max(0, Math.min(art, entry.images.length - 1));
    resetMangaView();
    setMangaSource();
    $('mode-manga').classList.add('active');
    $('mode-manga').setAttribute('aria-pressed', 'true');
    $('mode-story').classList.remove('active');
    $('mode-story').setAttribute('aria-pressed', 'false');
    $('manga-dialog').showModal();
    document.body.classList.add('dialog-open');
    requestAnimationFrame(() => $('manga-stage').focus({ preventScroll: true }));
  }

  function closeManga() {
    if ($('manga-dialog').open) $('manga-dialog').close();
  }

  function turnPage(delta) {
    if (turning || mangaZoom > 1.15) return;
    const images = mangaImages();
    const target = art + delta;
    if (target < 0 || target >= images.length) return;

    turning = true;
    const under = images[target];
    $('manga-under-image').src = under.src;
    $('manga-sheet').classList.remove('turn-next', 'turn-prev');
    void $('manga-sheet').offsetWidth;
    $('manga-sheet').classList.add(delta > 0 ? 'turn-next' : 'turn-prev');

    const finish = () => {
      art = target;
      $('manga-sheet').classList.remove('turn-next', 'turn-prev');
      setMangaSource();
      turning = false;
    };
    $('manga-sheet').addEventListener('animationend', finish, { once: true });
    setTimeout(() => {
      if (turning) finish();
    }, 760);
  }

  $('manga-prev').addEventListener('click', () => turnPage(-1));
  $('manga-next').addEventListener('click', () => turnPage(1));
  $('manga-close').addEventListener('click', closeManga);
  $('manga-zoom-out').addEventListener('click', () => setMangaZoom(mangaZoom - 0.25));
  $('manga-zoom-in').addEventListener('click', () => setMangaZoom(mangaZoom + 0.25));
  $('manga-zoom-reset').addEventListener('click', resetMangaView);
  $('manga-zoom').addEventListener('input', () => setMangaZoom(Number($('manga-zoom').value) / 100));

  $('manga-fullscreen').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await $('manga-dialog').requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  });

  $('manga-dialog').addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    $('mode-story').classList.add('active');
    $('mode-story').setAttribute('aria-pressed', 'true');
    $('mode-manga').classList.remove('active');
    $('mode-manga').setAttribute('aria-pressed', 'false');
    resetMangaView();
    persist();
  });

  $('manga-image').addEventListener('error', () => {
    $('manga-pan-hint').textContent = 'A imagem não carregou. Feche e abra o modo mangá novamente para tentar de novo.';
  });

  $('manga-stage').addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setMangaZoom(mangaZoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }
  }, { passive: false });

  function pointerDistance() {
    const points = [...pointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  $('manga-stage').addEventListener('pointerdown', e => {
    if (e.target.closest('button,input')) return;
    $('manga-stage').setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    swipeStartX = e.clientX;
    panStartX = panX;
    panStartY = panY;
    if (pointers.size === 2) {
      pinchStartDistance = pointerDistance();
      pinchStartZoom = mangaZoom;
    }
  });

  $('manga-stage').addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const distance = pointerDistance();
      if (!pinchStartDistance) {
        pinchStartDistance = distance;
        pinchStartZoom = mangaZoom;
      }
      setMangaZoom(pinchStartZoom * (distance / Math.max(1, pinchStartDistance)));
      return;
    }

    if (mangaZoom > 1.05) {
      panX = panStartX + (e.clientX - dragStartX);
      panY = panStartY + (e.clientY - dragStartY);
      applyMangaTransform();
    }
  });

  function pointerEnd(e) {
    const wasSingle = pointers.size === 1 && pointers.has(e.pointerId);
    const endX = e.clientX;
    pointers.delete(e.pointerId);

    if (wasSingle && mangaZoom <= 1.15) {
      const deltaX = endX - swipeStartX;
      if (Math.abs(deltaX) > 70) turnPage(deltaX < 0 ? 1 : -1);
    }

    if (pointers.size < 2) {
      pinchStartDistance = 0;
      pinchStartZoom = mangaZoom;
    }

    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      dragStartX = remaining.x;
      dragStartY = remaining.y;
      panStartX = panX;
      panStartY = panY;
    }
  }

  $('manga-stage').addEventListener('pointerup', pointerEnd);
  $('manga-stage').addEventListener('pointercancel', pointerEnd);

  $('manga-stage').addEventListener('dblclick', e => {
    if (e.target.closest('button,input')) return;
    setMangaZoom(mangaZoom > 1.15 ? 1 : 2);
  });

  $('manga-dialog').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && mangaZoom <= 1.15) {
      e.preventDefault();
      turnPage(1);
    } else if (e.key === 'ArrowLeft' && mangaZoom <= 1.15) {
      e.preventDefault();
      turnPage(-1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setMangaZoom(mangaZoom + 0.25);
    } else if (e.key === '-') {
      e.preventDefault();
      setMangaZoom(mangaZoom - 0.25);
    } else if (e.key === '0') {
      e.preventDefault();
      resetMangaView();
    }
  });

  function resume() {
    restoring = true;
    render();
    setHash();
    const target = progress;
    const scroll = () => {
      const top = $('page').getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + target * Math.max(0, $('page').offsetHeight - window.innerHeight),
        behavior: 'instant'
      });
    };
    scroll();
    requestAnimationFrame(scroll);
    restoreTimer = setTimeout(() => { restoring = false; }, 250);
  }

  $('start').addEventListener('click', e => {
    e.preventDefault();
    resume();
  });

  let timer;
  window.addEventListener('scroll', () => {
    clearTimeout(timer);
    if (restoring) return;
    timer = setTimeout(() => {
      if (restoring) return;
      const rect = $('page').getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom > 0) {
        progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, $('page').offsetHeight - window.innerHeight)));
        persist();
      }
    }, 150);
  }, { passive: true });

  const hashId = location.hash.startsWith('#ler/') ? location.hash.slice(5) : null;
  if (hashId) {
    const found = entries.findIndex(e => e.id === hashId);
    if (found >= 0) {
      if (found !== current) {
        art = 0;
        progress = 0;
      }
      current = found;
    }
  }

  render();
  if (hashId) requestAnimationFrame(resume);
})();
