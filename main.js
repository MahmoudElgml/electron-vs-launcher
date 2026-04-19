const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");

const ICON_PATH = path.join(__dirname, "build", "icon.png");

function createWindow() {
    const win = new BrowserWindow({
        width: 1024,
        height: 720,
        ...(fs.existsSync(ICON_PATH) ? { icon: ICON_PATH } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    if (process.platform === "darwin" && fs.existsSync(ICON_PATH)) {
        app.dock.setIcon(ICON_PATH);
    }
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});