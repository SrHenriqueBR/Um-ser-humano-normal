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
  const valid = c => c && typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.paragraphs) && c.paragraphs.every(p => typeof p === 'string') && (c.paragraphs.length || (Array.isArray(c.images) && c.images.length && c.images.every(i => /^assets\/chapters\/art-\d+\.webp$/.test(i.src))));
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
  let restoreTimer;
  let restoring = false;
  const label = item => item.number ? 'Capítulo ' + String(item.number).padStart(2,'0') : item.id === 'apresentacao' ? 'Apresentação' : 'Arte extra';
  function persist() {
    try { localStorage.setItem('ushn-reader-v1', JSON.stringify({id:entries[current].id,size,night,progress,art})); } catch (_) {}
  }
  function preferences() {
    document.documentElement.style.setProperty('--reading-size', size + 'px');
    $('font-size').textContent = size;
    const comic = !!entries[current].images;
    $('smaller').disabled = comic || size <= 16; $('larger').disabled = comic || size >= 28;
    $('page').classList.toggle('night', night);
    $('theme').setAttribute('aria-pressed', String(night));
    $('theme').setAttribute('aria-label', night ? 'Ativar leitura em papel' : 'Ativar leitura noturna');
    $('theme').querySelector('span').textContent = night ? 'Papel' : 'Noite';
  }
  function renderArt() {
    const item = entries[current];
    if (!item.images) return;
    art = Math.min(art,item.images.length-1);
    const img = item.images[art];
    $('image-error').hidden = true;
    $('comic-image').src = img.src;
    $('comic-image').width = img.width; $('comic-image').height = img.height;
    $('comic-image').alt = label(item) + ' — ' + img.title + '. Página original com quadros e falas em português.';
    $('art-caption').textContent = img.title;
    $('art-position').textContent = 'Arte ' + (art+1) + ' de ' + item.images.length;
    $('art-previous').disabled = art === 0; $('art-next').disabled = art === item.images.length-1;
  }
  function render() {
    const item = entries[current];
    $('reader-title').textContent = item.title;
    $('entry-label').textContent = label(item).toUpperCase();
    $('page-label').textContent = label(item).toUpperCase();
    $('reader-body').replaceChildren(...item.paragraphs.map(text => { const p=document.createElement('p');p.textContent=text;return p; }));
    $('reader-body').hidden = !!item.images;
    $('art-reader').hidden = !item.images;
    $('page').classList.toggle('comic-page', !!item.images);
    $('reading-notice').hidden = !item.images;
    $('reading-notice').textContent = item.images && item.images.length > 1 ? 'Este capítulo reúne '+item.images.length+' artes, incluindo páginas ou versões alternativas. Use as setas para ver todas.' : 'Edição visual · toque na imagem para ampliar. O ajuste de fonte se aplica apenas aos textos do leitor.';
    if(item.images) renderArt();
    $('page-number').textContent = label(item);
    $('previous').disabled = current === 0;
    // Extras are a separate collection: do not jump from the last chapter into an unrelated scene.
    $('next').disabled = current === chapters.length || current === entries.length-1;
    $('chapter-select').value = String(current);
    $('reader-links').replaceChildren();
    const marker=document.createElement('p');marker.className='active-reading';marker.textContent=label(item)+' · '+item.title;$('reader-links').append(marker);
    const next=entries[current+1];
    if(item.number && next?.number && next.number>item.number+1) $('reading-notice').textContent+=' O próximo disponível é o capítulo '+next.number+'; há uma lacuna na coleção.';
    $('start').firstChild.textContent = saved.id || current ? 'Continuar lendo ' : 'Abrir o livro ';
    preferences();
  }
  function setHash() { history.replaceState(null,'','#ler/'+entries[current].id); }
  function open(index) {
    clearTimeout(restoreTimer); restoring=false;
    current=index; art=0; progress=0; render(); persist();setHash();
    $('reader-title').focus({preventScroll:true});$('page').scrollIntoView({behavior:'instant',block:'start'});
  }
  function makeRow(entry,index) {
    const row=document.createElement('button');row.className='chapter-row';row.dataset.search=(label(entry)+' '+entry.title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const number=document.createElement('span');number.className='chapter-number';number.textContent=entry.number?String(entry.number).padStart(2,'0'):'◇';
    const name=document.createElement('span');name.className='chapter-name';name.textContent=entry.title;
    const info=document.createElement('small');info.textContent=entry.images?entry.images.length+' arte'+(entry.images.length>1?'s disponíveis':' disponível'):'Apresentação da obra · sem spoilers';name.append(info);
    const arrow=document.createElement('span');arrow.className='chapter-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    row.append(number,name,arrow);row.addEventListener('click',()=>open(index));return row;
  }
  entries.forEach((entry,index)=> {
    (index<=chapters.length?$('chapter-list'):$('extra-list')).append(makeRow(entry,index));
    const option=document.createElement('option');option.value=String(index);option.textContent=label(entry)+' · '+entry.title;$('chapter-select').append(option);
  });
  $('chapter-count').textContent=chapters.length+' capítulos em imagens';
  function filter() {
    const q=$('chapter-search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    let count=0;[...$('chapter-list').children].forEach((row,i)=>{const match=/^\d+$/.test(q)?entries[i].number===Number(q):row.dataset.search.includes(q);row.hidden=!match;if(match)count++;});
    $('search-status').textContent=q?(count?count+' resultado'+(count>1?'s':''):'Nenhum capítulo encontrado.'):'';
  }
  $('chapter-search').addEventListener('input',filter);
  $('chapter-select').addEventListener('change',()=>open(Number($('chapter-select').value)));
  $('previous').addEventListener('click',()=>{if(current>0)open(current-1);});
  $('next').addEventListener('click',()=>{if(!$('next').disabled)open(current+1);});
  $('smaller').addEventListener('click',()=>{size=Math.max(16,size-2);preferences();persist();});
  $('larger').addEventListener('click',()=>{size=Math.min(28,size+2);preferences();persist();});
  $('theme').addEventListener('click',()=>{night=!night;preferences();persist();});
  function changeArt(delta) {const images=entries[current].images;if(!images)return;art=Math.max(0,Math.min(images.length-1,art+delta));progress=0;renderArt();persist();$('art-reader').scrollIntoView({behavior:'instant'});}
  $('art-previous').addEventListener('click',()=>changeArt(-1));$('art-next').addEventListener('click',()=>changeArt(1));
  $('comic-image').addEventListener('error',()=>{$('image-error').hidden=false;});
  $('retry-image').addEventListener('click',()=>{const src=entries[current].images[art].src;$('image-error').hidden=true;$('comic-image').src=src+'?retry='+Date.now();});
  $('enlarge-art').addEventListener('click',()=>{
    $('zoom-image').src=$('comic-image').src;$('zoom-image').alt=$('comic-image').alt;
    $('zoom-level').value='100';$('zoom-image').style.width='100%';$('image-dialog').showModal();document.body.classList.add('dialog-open');
    $('zoom-viewport').scrollTop=0;$('zoom-viewport').scrollLeft=0;
  });
  $('zoom-level').addEventListener('input',()=>{$('zoom-image').style.width=$('zoom-level').value+'%';});
  $('close-dialog').addEventListener('click',()=>$('image-dialog').close());
  $('image-dialog').addEventListener('close',()=>{document.body.classList.remove('dialog-open');$('enlarge-art').focus();});
  function resume() {
    restoring=true;render();setHash();
    const target=progress;
    const scroll=()=>{const top=$('page').getBoundingClientRect().top+window.scrollY;window.scrollTo({top:top+target*Math.max(0,$('page').offsetHeight-window.innerHeight),behavior:'instant'});};
    scroll();requestAnimationFrame(scroll);
    restoreTimer=setTimeout(()=>{restoring=false;},250);
  }
  $('start').addEventListener('click',e=>{e.preventDefault();resume();});
  let timer;
  window.addEventListener('scroll',()=>{clearTimeout(timer);if(restoring)return;timer=setTimeout(()=>{
    if(restoring)return;const rect=$('page').getBoundingClientRect();
    if(rect.top<=100 && rect.bottom>0){progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,$('page').offsetHeight-window.innerHeight)));persist();}
  },150);},{passive:true});
  const hashId=location.hash.startsWith('#ler/')?location.hash.slice(5):null;
  if(hashId){const found=entries.findIndex(e=>e.id===hashId);if(found>=0){if(found!==current){art=0;progress=0;}current=found;}}
  render();
  if(hashId) requestAnimationFrame(resume);
})();
