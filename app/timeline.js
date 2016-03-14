var Timeline = function(client) {
	this.client = client;
};

Timeline.prototype = {
	getTimeline: function() {
		var self = this;
		var timelineVue = new Vue({
			el: '#main',
			data: {
				tweets: [],
				tweettext: ''
			},
			created: function() {
				var cls = this;
				self.client.get('statuses/home_timeline', function(error, tweets, response){
				  if (!error) {
				  	tweets.forEach(function(tweet) {
				  		if (tweet.created_at != null && tweet.text != null) {
					  		// 相対時間に変更
					  		tweet.created_at = moment(tweet.created_at).fromNow();

					  		// 改行コード
					  		tweet.text = tweet.text.replace(/[\n\r]/g, '<br>');
					  		cls.tweets.push(tweet);

				  		}
				  	});
				  	console.log(cls.tweets);
				  	// for (var i = 0; i < tweets.length; i++) {
				  	// 	cls.tweets.push(tweets[i]);
				  	// }
				  } else {
				  	console.log(error);
				  }
				});

				self.client.stream('user', function(stream) {
					stream.on('data', function(tweet) {
				  		if (tweet.created_at != null && tweet.text != null) {
					  		// 相対時間に変更
					  		tweet.created_at = moment(tweet.created_at).fromNow();
					  		cls.tweets.unshift(tweet);

				  		}
					});

					stream.on('error', function(error) {
						throw error;
					});
				});
			},
			methods: {
				tweet: function(event) {
					var cls = this;
					self.client.post('statuses/update', {status: this.tweettext},  function(error, tweet, response){
						  if (!error) {
							  cls.tweets.unshift(tweet);  // Tweet body. 
							  console.log(response);  // Raw response object. 
							  cls.tweettext = '';

						} else {
							console.log(error);
						}
					});
				},
				a: function(event) {
					console.log('a');
				}
			}
		});
	}
}