# DeathAwaits Launcher

Launcher do servidor **DeathAwaits** (Minecraft 1.6.4 + Crafting Dead), feito em Electron.

Código reconstruído a partir da versão instalada **1.0.2** (o `app.asar` do instalador oficial). O conteúdo de `src/` é idêntico ao da 1.0.2: os hashes batem com o `integrity.json` original.

## Estrutura

| Pasta/arquivo | O que é |
|---|---|
| `src/main.js` | Processo principal: atualização do modpack, verificação dos arquivos, Java, abrir o jogo |
| `src/renderer.js`, `src/index.html`, `*.css` | Interface |
| `config.json` | Servidor, link do manifest do modpack, links, notícias |
| `assets/` | Ícones e imagens |
| `scripts/integrity.js` | Gera `src/integrity.json` (o launcher confere esses hashes ao abrir) |

## Rodar em modo de teste

```bash
npm install
npm start
```

## Gerar uma versão nova

1. Aumente `version` no `package.json` (ex.: 1.0.3). **Precisa ser maior** que a publicada, senão os launchers instalados não atualizam.
2. Envie para a branch `main` (o workflow roda sozinho) ou rode **Gerar launcher (Windows)** na aba Actions. Ele cria a release `vX.Y.Z` neste repositório com os arquivos.
3. Baixe os arquivos da release `vX.Y.Z` deste repositório.
4. Pronto: a partir da 1.1.2 os launchers instalados procuram atualização **neste repositório** (`OtavioColela/deathawaits-launcher`), na release marcada como **Latest**. Não precisa mais subir nada no `ryan1235/DeathAwaits` (lá fica só o modpack: `manifest.json` + `DeathAwaits-modpack.zip`).

O Java 8 embutido (`runtime/java8`) é baixado pelo workflow e não fica no repositório.

## Visual

O tema segue a identidade do site (`src/tema.css`): fundo verde-oliva, ocre de faixa de perigo, títulos em estêncil e rótulos em fonte mono.
A aba **Mapa** abre `https://deathawaits.com.br/mapa.html` (a versão só-mapa do site), então ela se atualiza sozinha junto com o site.

Fontes em `assets/fonts` (licença SIL Open Font License — arquivos `OFL-*.txt`): Big Shoulders Stencil Display, IBM Plex Sans e IBM Plex Mono.
