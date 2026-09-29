'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const introduction = { id: 'apresentacao', title: 'Antes da primeira página', paragraphs: [
    'Henrique sempre acreditou ser apenas um garoto comum.',
    'Aos 18 anos, sua vida parecia seguir como a de qualquer outro jovem: família, jogos, responsabilidades, dúvidas sobre o futuro e sentimentos que ele ainda tentava compreender.',
    'Até conhecer Hyejin.',
    'O que começa com encontros inesperados, conversas, brincadeiras e sentimentos que crescem aos poucos transforma completamente o mundo de Henrique. Entre momentos felizes, perdas, escolhas e acontecimentos que parecem fugir de qualquer explicação, ele começa a perceber que talvez sua existência nunca tenha sido tão normal quanto imaginava.',
    'Há algo escondido dentro dele. Algo antigo. Algo que nem mesmo Henrique conhece.',
    'Mas até quando Henrique poderá continuar se chamando de um ser humano normal?'
  ]};
  const chapters = Array.isArray(window.BOOK_CHAPTERS) ? window.BOOK_CHAPTERS.filter(c => c && typeof c.id === 'string' && c.id !== 'apresentacao' && typeof c.title === 'string' && Array.isArray(c.paragraphs) && c.paragraphs.length && c.paragraphs.every(p => typeof p === 'string')) : [];
  const entries = [introduction, ...chapters];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('ushn-reader-v1')) || {}; } catch (_) { /* Reading works without storage. */ }
  let current = Math.max(0, entries.findIndex(e => e.id === saved.id));
  let size = Number.isFinite(saved.size) ? Math.max(16, Math.min(28, saved.size)) : 20;
  let night = saved.night === true;
  let progress = Number.isFinite(saved.progress) ? Math.max(0, Math.min(1, saved.progress)) : 0;
  let restoring = false;
  function persist() { try { localStorage.setItem('ushn-reader-v1', JSON.stringify({id: entries[current].id, size, night, progress})); } catch (_) {} }
  function preferences() {
    document.documentElement.style.setProperty('--reading-size', size + 'px');
    $('font-size').textContent = size;
    $('smaller').disabled = size <= 16; $('larger').disabled = size >= 28;
    $('page').classList.toggle('night', night);
    $('theme').setAttribute('aria-pressed', String(night));
    $('theme').setAttribute('aria-label', night ? 'Ativar leitura em papel' : 'Ativar leitura noturna');
    $('theme').querySelector('span').textContent = night ? 'Papel' : 'Noite';
  }
  function render() {
    const item = entries[current];
    $('reader-title').textContent = item.title;
    $('entry-label').textContent = current ? 'CAPÍTULO ' + String(current).padStart(2, '0') : 'ANTES DA PRIMEIRA PÁGINA';
    $('page-label').textContent = current ? 'CAPÍTULO ' + current : 'APRESENTAÇÃO';
    $('reader-body').replaceChildren(...item.paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
    $('page-number').textContent = (current + 1) + ' / ' + entries.length;
    $('previous').disabled = current === 0; $('next').disabled = current === entries.length - 1;
    [...$('reader-links').children].forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
    $('start').firstChild.textContent = saved.id || current ? 'Continuar lendo ' : 'Abrir o livro ';
  }
  function open(index) {
    current = index; progress = 0; render(); persist();
    $('reader-title').focus({preventScroll:true});
    $('page').scrollIntoView({behavior:'instant', block:'start'});
    history.replaceState(null, '', '#leitura');
  }
  entries.forEach((entry, index) => {
    const row = document.createElement('button'); row.className = 'chapter-row';
    const number = document.createElement('span'); number.className = 'chapter-number'; number.textContent = index ? String(index).padStart(2,'0') : '◇';
    const name = document.createElement('span'); name.className = 'chapter-name'; name.textContent = entry.title;
    const info = document.createElement('small'); info.textContent = index ? Math.max(1, Math.ceil(entry.paragraphs.join(' ').split(/\s+/).length / 200)) + ' min de leitura' : 'Apresentação da obra · sem spoilers'; name.append(info);
    const arrow = document.createElement('span'); arrow.className = 'chapter-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
    row.append(number, name, arrow); row.addEventListener('click', () => open(index)); $('chapter-list').append(row);
    const link = document.createElement('button'); link.textContent = index ? String(index).padStart(2,'0') + ' · ' + entry.title : 'Apresentação'; link.addEventListener('click', () => open(index)); $('reader-links').append(link);
  });
  if (!chapters.length) { const note = document.createElement('p'); note.className = 'publication-note'; note.textContent = 'Os capítulos serão publicados aqui em breve. Enquanto isso, conheça a apresentação ou leia a história no Wattpad.'; $('chapter-list').append(note); }
  else $('chapter-count').textContent = chapters.length + (chapters.length === 1 ? ' capítulo disponível' : ' capítulos disponíveis');
  $('previous').addEventListener('click', () => { if (current > 0) open(current - 1); });
  $('next').addEventListener('click', () => { if (current < entries.length - 1) open(current + 1); });
  $('smaller').addEventListener('click', () => { size = Math.max(16,size-2); preferences(); persist(); });
  $('larger').addEventListener('click', () => { size = Math.min(28,size+2); preferences(); persist(); });
  $('theme').addEventListener('click', () => { night = !night; preferences(); persist(); });
  $('start').addEventListener('click', event => {
    event.preventDefault(); restoring = true;
    const top = $('page').getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top:top + progress * Math.max(0, $('page').offsetHeight - window.innerHeight), behavior:'instant'});
    history.replaceState(null, '', '#leitura');
    requestAnimationFrame(() => { restoring = false; });
  });
  let timer;
  window.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(() => {
    if(restoring) return;
    const rect = $('page').getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom > 0) { progress = Math.max(0,Math.min(1,-rect.top / Math.max(1,$('page').offsetHeight-window.innerHeight))); persist(); }
  },150); }, {passive:true});
  preferences(); render();
})();
