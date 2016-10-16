const remote         = require('electron').remote;
const dialog         = remote.Dialog;
const Vue            = require('vue');
const settings       = require('../app/settings');
const Client         = require('../app/client');
const TwitterManager = require('../app/twitter-manager');
const Parser         = require('../app/parser');
const ipcRenderer    = require('electron').ipcRenderer;
const storage        = require('electron-json-storage');

const parser = new Parser();

let auth;
let client;
let twitterClient;
let timelineVue;


storage.get('auth', function (error, data) {
  if (error) throw error;

  auth = data;
  client = new Client(settings.TWITTER_CONSUMER_KEY,
                        settings.TWITTER_CONSUMER_SECRET,
                        auth.accessTokenKey,
                        auth.accessTokenSecret);

  twitterClient = client.getClient();

  twitterManager = new TwitterManager(twitterClient);
  initScreen();

});




const tweetComponent = Vue.extend({
  props: ['tweet', 'user'],
  template: '#tweet-component',
  methods: {
    // TODO: componentからbindできないか
    setReply: function(screenName, tweetId) {
      timelineVue.setReply(screenName, tweetId);
    },

    setFavorite: function(tweetId, flg) {
      var self = this;
      // ふぁぼる
      if (flg) {
        twitterManager.createFavorite(tweetId, function(response) {
          if (response) {
            self.tweet.favorited = true;
          }
        });
      // ふぁぼを取り消す
      } else {
        twitterManager.destroyFavorite(tweetId, function(response) {
          if (response) {
            self.tweet.favorited = false;
          }
        });
      }
    },

    deleteTweet: function(tweetId) {
      var curWindow = remote.getCurrentWindow();
      var options = {
        type: 'info',
        buttons: ['Yes', 'No'],
        message: 'ツイートを削除してもよろしいですか'
      };
      dialog.showMessageBox(curWindow, options, function(callback) {
        // yes: 0, no: 1
        if (callback === 0) {
          twitterManager.deleteTweet(tweetId);
        }
      });
    },

    openImageWindow: function(url, height, width) {
      ipcRenderer.send('open-window', url, height, width);
    }
  }
});

Vue.component('timeline-home', tweetComponent);
Vue.component('timeline-mentions', tweetComponent);
Vue.component('timeline-favorites', tweetComponent);

const initScreen = function() {
  timelineVue = new Vue({
    el: '#main',
    data: {
      user             : [],
      mutes            : [],
      tweets           : [],
      mentions         : [],
      favorites        : [],
      tweettext        : '',
      replyScreenName  : '',
      inReplyToStatusId: '',
      title            : 'Timeline'
    },
    created: function() {
      this.tweetload(true);
    },
    methods: {
      tweet: function(event) {
        var self = this;
        twitterManager.postTweet(this.tweettext, this.replyScreenName, this.inReplyToStatusId, function(callback) {
          self.tweettext = '';
          self.replyScreenName = '';
          self.inReplyToStatusId = '';
        });
      },

      setReply: function(screenName, tweetId) {
        this.tweettext = '@' + screenName + ' ';
        this.replyScreenName = screenName;
        this.inReplyToStatusId = tweetId;
        document.getElementById('tweettext').focus();
      },

      setTitle: function(title) {
        this.title = title;
      },

      tweetload: function(isFirst) {
        var self = this;

        var timelineId  = null;
        var mentionsId  = null;
        var favoritesId = null;

        if (this.tweets.length > 0) {
          timelineId = this.tweets[0].id_str;
        }
        if (this.mentions.length > 0) {
          mentionsId = this.mentions[0].id_str;
        }
        if (this.favorites.length > 0) {
          favoritesId = this.favorites[0].id_str;
        }

        if (isFirst) {
          // ユーザ情報
          twitterManager.getUserInfo(function(user){
            self.user = user;
          });

          // ミュート
          twitterManager.getMutesList(function(data) {
            self.mutes = data;
          });

        }

        twitterManager.getTimeline(timelineId, function(tweetsRow) {
          if (isFirst) {
            for (var i = 0; i < tweetsRow.length; i++) {
              if (self.mutes.indexOf(tweetsRow[i].user.id) === -1) {
                self.tweets.push(parser.tweetParse(tweetsRow[i]));
              }
            }
          } else {
            // 相対時間を更新
            for (var i = 0; i < self.tweets.length; i++) {
              parser.setRelativeCreatedAt(self.tweets[i]);
            }

            for (var i = tweetsRow.length - 1; i >= 0; i--) {
              if (self.mutes.indexOf(tweetsRow[i].user.id) === -1) {
                self.tweets.unshift(parser.tweetParse(tweetsRow[i]));
              }
            }
          }
        });

        twitterManager.getUserStream(function(data) {
          if (data.created_at != null && data.text != null) {
            // 相対時間を更新
            for (var i = 0; i < self.tweets.length; i++) {
              parser.setRelativeCreatedAt(self.tweets[i]);
            }
            if (self.mutes.indexOf(data.user.id) === -1) {
              self.tweets.unshift(parser.tweetParse(data));

              if (data.text.indexOf('@' + self.user.screen_name) !== -1) {
                self.mentions.unshift(parser.tweetParse(data));
              }
            }

          } else if (data.delete != null) {
            for (var i = 0; i < self.tweets.length; i++) {
              // 削除tweet id確認
              if ((self.tweets[i].id == data.delete.status.id) && (self.tweets[i].user.id == data.delete.status.user_id)) {
                self.tweets.splice(i, 1);
              }
            }
          }
        });

        twitterManager.getMentionsTimeline(mentionsId, function(tweetsRow) {
          for (var i = 0; i < tweetsRow.length; i++) {
            if (self.mutes.indexOf(tweetsRow[i].user.id) === -1) {
              self.mentions.push(parser.tweetParse(tweetsRow[i]));
            }
          }
        });

        twitterManager.getFavoritesList(favoritesId, function(tweetsRow) {
          for (var i = 0; i < tweetsRow.length; i++) {
            if (self.mutes.indexOf(tweetsRow[i].user.id) === -1) {
              self.favorites.push(parser.tweetParse(tweetsRow[i]));
            }
          }
        });
      }
    }
  });
};