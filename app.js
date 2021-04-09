const { app, BrowserWindow } = require('electron')
const path = require('path')

//var map_renderer = require('./map_renderer.js');
var fog_of_war = require('./shared/TileGrid');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true
      //preload: path.join(__dirname, 'preload.js')
    }
  })

  win.maximize();
  win.setFullScreen(true);
  win.webContents.openDevTools();
  win.loadFile('./client_interface/web_content/index.html')
  var j = JSON.stringify(fog_of_war.tile_grid);
  var now = Date.now();
  var n2 = Date.now();

  console.log(n2 - now + " ms");

}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
    app.quit()
  //}
})
