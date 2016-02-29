// Dependencies
var electron = require('electron'),
  app = electron.app,
  BrowserWindow = electron.BrowserWindow;

var __DEV__ = (process.env['NODE_ENV'] === 'development');

console.log(`NODE_ENV=[${process.env['NODE_ENV']}]`);

// Config
var mainWindow;

function createWindow() {

  if (__DEV__) {
    // DEBUG run, developer helper features enabled

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: 1,
      alwaysOnTop: 0,
      webPreferences: {"node-integration": false,}
    });
    // Open the DevTools.
    mainWindow.webContents.openDevTools({detach: true});

  } else {

    // PRODUCTION run

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 266,
      height: 58,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        "node-integration": false,
        // "preload": "file:///Users/shaneherft/Google%20Drive/Development/Toptask/app/js/preload.js"
        // "preload": path.join(__dirname, 'preload.js')
      }
    });
  }

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
