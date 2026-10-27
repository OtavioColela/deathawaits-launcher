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
2. Crie uma tag `v1.0.3` e envie (`git tag v1.0.3 && git push --tags`), ou rode o workflow **Gerar launcher (Windows)** na aba Actions.
3. Baixe o artefato **DeathAwaits-Launcher** quando terminar.
4. Envie para a **release mais recente** do `ryan1235/DeathAwaits` (é de lá que os launchers instalados procuram atualização):
   - `DeathAwaits-Launcher-Setup-X.Y.Z.exe`
   - `DeathAwaits-Launcher-Setup-X.Y.Z.exe.blockmap`
   - `latest.yml`
   - (opcional) `DeathAwaits-Launcher-Portable-X.Y.Z.exe`

> A atualização automática lê o `latest.yml` da release marcada como **Latest**. Toda release nova do modpack também precisa ter o `latest.yml` + instalador, senão os launchers deixam de achar atualização.

O Java 8 embutido (`runtime/java8`) é baixado pelo workflow e não fica no repositório.

## Visual

O tema segue a identidade do site (`src/tema.css`): fundo verde-oliva, ocre de faixa de perigo, títulos em estêncil e rótulos em fonte mono.
A aba **Mapa** abre `https://deathawaits.com.br/mapa.html` (a versão só-mapa do site), então ela se atualiza sozinha junto com o site.

Fontes em `assets/fonts` (licença SIL Open Font License — arquivos `OFL-*.txt`): Big Shoulders Stencil Display, IBM Plex Sans e IBM Plex Mono.
