
var TweetsManager = new (function() {
	var self = this;
	var $ = $ || jQuery;

	self.setSocket = function(sock) {
		self.socket = sock;
		//self.socket.on('');

		var locked = false;
				
		$("#tweet-form form").unbind('submit').on("submit" , function() {
			if (locked)
				return false;
			
			$form = $(this);
			$(".form-error-tweet").html("");
			
			if (! LoginManager.isLogin()) {
				alert("ログインしていません。");
				return false;
			}
			if (! $form.find("#tweet-message").val()) {
				$('<div />').text("入力されていません。").appendTo('.form-error-tweet');
				return false;	
			}			
			var data = {
				"message" : $form.find("#tweet-message").val(),
				"color" : null
			};
			$form.find("[name=\"color\"]").each(function() {
				if ($(this).attr("checked"))  {
					data.color = $(this).val();
					return false;
				}
			});

            locked = true;
            $("#tweet-form .form-submit").hide();
            $("#tweet-form .form-loading").show();
			
			self.socket.emit('tweet post', data);
			
			return false;
		});
		self.socket.on('tweet post ok' , function(tweet) {
			$("#tweet-message").val("");
			self.prependTweet(tweet);

			locked = false;
			$("#tweet-form .form-submit").show();
			$("#tweet-form .form-loading").hide();
		});
		self.socket.on('tweet post error' , function(errmsg) {
			$('<div />').text(errmsg).appendTo('.form-error-tweet');
			
			locked = false;
			$("#tweet-form .form-submit").show();
			$("#tweet-form .form-loading").hide();
		});
		self.socket.on('tweet post append' , function(tweet) {
			self.appendTweet(tweet);
		});
        self.socket.on('tweet post prepend' , function(tweet) {
            self.prependTweet(tweet);
        });
		self.socket.on('tweet fetch ok' , function(tweets, c) {
			$('#tweet-list ul').html("");
			for (var i=0; i<tweets.length; i++) {
				self.appendTweet(tweets[i]);
			}
			self.setLeftCount(c - tweets.length);
		});
		self.socket.on('tweet fetch error', function(errmsg) {
			alert('Tweet fetch error:' + errmsg);
		});
		
		//=== prepend 
		$("#tweet-more .btn").on('click' , function() {
			var $li = $('#tweet-list ul li:last-child');
			if ($li && $li.attr("data-id")) {
				self.socket.emit('tweet fetch before', $li.attr("data-id"));
			}
		});
		self.socket.on('tweet fetch before ok' , function(tweets , c) {
			for (var i=0; i<tweets.length; i++) {
                self.appendTweet(tweets[i]);
            }
            self.setLeftCount(c - $("#tweet-list ul li").size());
		});
        self.socket.on('tweet fetch before error', function(errmsg) {
            alert('Tweet fetch before error:' + errmsg);
        });
	};
	self.prependTweet = function(tweet) {
		$('#tweet-list ul').prepend($("#tmpl-tweet").tmpl(tweet));
		self.syncTweetsUsers();
	};
	self.appendTweet = function(tweet) {
		// console.log($.dump(tweet));
		$('#tweet-list ul').append($("#tmpl-tweet").tmpl(tweet));
		self.syncTweetsUsers();
	};
	self.init = function() {
		self.socket.emit('tweet fetch');
	};
	self.setLeftCount = function(left_count) {
		if (left_count <= 0) {
			$("#tweet-more").hide();
		} else {
			var next_c = (left_count > 15 ? 15 : left_count);
			$("#tweet-more").show();
			$("#tweet-more .btn").val('次の' + next_c + '件を表示 / 残り' + left_count + "件");
		}
	};	
	self.syncTweetsUsers = function(users) {
		if (users)
			self.users = users;
		if (! self.users)
			self.users = {};
	
		$("#tweet-list li").each(function() {
			var $li = $(this);
			var account = $li.attr("data-user-account");
		
			if (self.users[account]) {
				var u = self.users[account];
				var photo = '<img src="/images/no-photo.jpg" />';
				if (u.photo_path) 
					photo = '<a href="/photos/' + u.photo_path + '" target="_blank"><img src="/photos/' + u.photo_path + '" /></a>';
				
				$li.find(".user-name").text(u.name);
				$li.find(".user-status").html(u.status_img);
				$li.find(".user-photo").html(photo);
				//console.log($.dump(u));
			}
		});
	};
	
	return self;
})();
