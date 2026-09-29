# Um ser humano normal? — site do livro

Site estático em português, sem dependências ou serviços externos. A capa tipográfica é feita em CSS. O texto disponível é uma apresentação baseada na sinopse do autor; não há capítulos fictícios.

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
