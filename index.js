const electron = require('electron')
const path = require('path');
const { contextIsolated } = require('process');

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

const { app, BrowserWindow, Menu } = electron

let mainWindow

app.on('ready', () => {
    mainWindowLoad()
})

const mainWindowLoad = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        title: 'Roamy'
    })

    mainWindow.loadURL(`file://${__dirname}/index.html`)
}