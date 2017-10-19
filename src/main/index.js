'use strict'

import { app, BrowserWindow } from 'electron'
import OAuthTwitter from 'electron-oauth-twitter'
import config from 'config'
import storage from 'electron-json-storage-sync'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  const oauthInfo = storage.get('oauthInfo')

  if (oauthInfo.status && oauthInfo.data.oauth_access_token && oauthInfo.data.oauth_access_token_secret) {
    openWindow()
  } else {
    const twitterAuthWindow = new OAuthTwitter({
      key: config.get('consumerKey'),
      secret: config.get('consumerSecret')
    })

    twitterAuthWindow.startRequest()
      .then((res) => {
        const result = storage.set('oauthInfo', res)
        if (result.status) {
          openWindow()
        } else {
          console.error('Token save failed!')
        }
      })
      .catch((err) => {
        console.error(err, err.stack)
      })
  }
}

function openWindow () {
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 500
  })

  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
