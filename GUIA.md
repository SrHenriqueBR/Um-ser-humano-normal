# Um ser humano normal? — site do livro

Site estático em português, sem dependências ou serviços externos. A capa original “Talvez a Vida Seja Especial” é exibida inteira em `assets/capa.webp`, otimizada para a web. O leitor usa uma edição híbrida: capítulos em texto e artes originais no mesmo fluxo. Os capítulos antigos que existiam apenas como páginas visuais receberam narrativa reconstruída a partir dessas artes e do cânone da obra, preservando a sequência já publicada.

## Abrir localmente

Execute `python -m http.server 8000` nesta pasta e abra http://localhost:8000.

## Publicar pelo GitHub Pages

No repositório, abra **Settings → Pages → Build and deployment**. Selecione **Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**. Aguarde a implantação. O endereço esperado é https://srhenriquebr.github.io/Um-ser-humano-normal/ (só ficará disponível após a ativação).

## Adicionar capítulos

Edite `chapters.js`, mantendo os capítulos na ordem do livro:

```js
window.BOOK_CHAPTERS = [
  {
    id: 'capitulo-1',
    title: 'Título original do capítulo',
    paragraphs: [
      'Primeiro parágrafo completo do autor.',
      'Segundo parágrafo completo do autor.'
    ]
  }
];
```

Use IDs únicos e estáveis. Os textos são inseridos com textContent: tags HTML não são executadas. Índice, navegação e estimativa de leitura são gerados automaticamente. Não renumere IDs já publicados, pois eles identificam o progresso salvo.

## Leitura

Fonte de 16 a 28 px, tema papel ou noite, índice e botões anterior/próximo. O capítulo e a posição de leitura são salvos apenas no navegador, sem conta ou sincronização. Bloquear o armazenamento não impede a leitura. O botão Continuar lendo retoma a posição salva.

## Arquivos

- `index.html`: capa, apresentação, índice e leitor.
- `style.css`: identidade visual e layout responsivo.
- `app.js`: navegação, preferências e progresso.
- `chapters.js`: capítulos completos do livro.

O site funciona em subdiretórios, incluindo GitHub Pages. Não exige npm, chaves de API, banco de dados ou etapa de build.

## Edição visual importada

O site contém 153 artes originais: 141 imagens associadas a 107 capítulos (numeração entre 2 e 110) e 12 extras sem número confirmado. Os capítulos 1 e 16 continuam pendentes; o capítulo 96 está disponível em texto. A atualização de 4 de outubro de 2026 acrescentou 29 artes, incluindo páginas numeradas de 99 a 110. Versões alternativas são preservadas com suas legendas.

Consulte `CATALOGO.md` para a correspondência entre os arquivos originais e o site. Várias artes do mesmo capítulo podem ser versões alternativas, não páginas sequenciais. O leitor mantém todas acessíveis, sem escolher uma versão canônica. O capítulo 87 contém diversas partes e páginas.

Imagens não são transcrições do manuscrito. O botão de ampliação e o controle de zoom permitem ler os balões no celular. As imagens mantêm sua resolução original. Só a arte selecionada é carregada, evitando baixar a coleção inteira de uma vez.

`BOOK_CHAPTERS` admite `number` e `images: [{src, title, width, height}]`. `BOOK_EXTRAS` mantém as artes não numeradas fora da sequência principal. Os links `#ler/capitulo-27`, por exemplo, abrem o capítulo correspondente. O salvamento inclui capítulo, arte, posição de leitura e preferências.

