const { contextBridge, ipcRenderer } = require('electron');
const inv = (ch) => (...a) => ipcRenderer.invoke(ch, ...a);
contextBridge.exposeInMainWorld('api', {
  init: inv('init'), play: inv('play'), ping: inv('ping'), prepare: inv('prepare'),
  msLogin: inv('ms-login'), msLogout: inv('ms-logout'),
  save: inv('save-settings'), resetSettings: inv('reset-settings'),
  diag: inv('diag'), releases: inv('releases'), sys: inv('sys'), javaList: inv('java-list'), pickJava: inv('pick-java'),
  openFolder: inv('open-folder'), repair: inv('repair'),
  verifyLauncher: inv('verify-launcher'), verifyPack: inv('verify-pack'),
  win: (a) => ipcRenderer.send('win', a),
  link: (u) => ipcRenderer.send('open-link', u),
  on: (ch, fn) => ipcRenderer.on(ch, (_, d) => fn(d))
});
