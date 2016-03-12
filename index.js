'use strict';

var app = require('app');
var browserWindow = require('browser-window');
var storage = require('electron-json-storage');
var settings = require('./app/settings');

require('crash-reporter').start();

var mainWindow = null;

var twitterAuth = require('./app/auth');
twitterAuth = new twitterAuth(settings.TWITTER_CONSUMER_KEY, settings.TWITTER_CONSUMER_SECRET);

storage.get('auth', function(error, data) {
	if (error) throw error;

	if (Object.keys(data).length === 0) {
		twitterAuth.getTwitterAuth();
	}
});

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

app.on('ready', function() {
	mainWindow = new browserWindow({width: 300, height: 500});
	mainWindow.loadUrl('file://' + __dirname + '/index.html');

	mainWindow.on('closed', function() {
		mainWindow = null;
	})
})