JamStash.service('model', function () {
	// Figure out how to move this, circular dependency with utils
	secondsToTime = function (secs) {
		// secs = 4729
		var times = new Array(3600, 60, 1);
		var time = '';
		var tmp;
		for (var i = 0; i < times.length; i++) {
			tmp = Math.floor(secs / times[i]);
			// 0: 4729/3600 = 1
			// 1: 1129/60 = 18
			// 2: 49/1 = 49
			if (tmp < 1) {
				tmp = '00';
			}
			else if (tmp < 10) {
				tmp = '0' + tmp;
			}
			if (i == 0 && tmp == '00') {
			} else {
				time += tmp;
				if (i < 2) {
					time += ':';
				}
			}
			secs = secs % times[i];
		}
		return time;
	}

	this.Index = function (name, artist) {
		this.name = name;
		this.artist = artist;
	}

	this.Artist = function (id, name) {
		this.id = id;
		this.name = name;
	}

	this.Album = function (id, parentid, name, artist, artistId, coverartthumb, coverartfull, date, starred, description, url, type) {
		this.id = id;
		this.parentid = parentid;
		this.name = name;
		this.artist = artist;
		this.artistId = artistId;
		this.coverartthumb = coverartthumb;
		this.coverartfull = coverartfull;
		this.date = date;
		this.starred = starred;
		this.description = description;
		this.url = url;
		this.type = type;
	}

	this.Song = function (id, parentid, track, name, artist, artistId, album, albumId, coverartthumb, coverartfull, duration, rating, starred, suffix, specs, url, position, description) {
		this.id = id;
		this.parentid = parentid;
		this.track = track;
		this.name = name;
		this.artist = artist;
		this.artistId = artistId;
		this.album = album;
		this.albumId = albumId;
		this.coverartthumb = coverartthumb;
		this.coverartfull = coverartfull;
		this.duration = duration;
		this.time = duration == '' ? '00:00' : secondsToTime(duration);
		this.rating = rating;
		this.starred = starred;
		this.suffix = suffix;
		this.specs = specs;
		this.url = url;
		this.position = position;
		this.selected = false;
		this.playing = false;
		this.description = description;
		this.displayName = this.name + " - " + this.album + " - " + this.artist;
	}
});

JamStash.service('globals', function () {
	this.SearchTypes = [
		{ id: "song", name: "Song" },
		{ id: "album", name: "Album" },
		{ id: "artist", name: "Artist" },
	];
	this.Layouts = [
		{ id: "grid", name: "Grid" },
		{ id: "list", name: "List" }
	];
	this.AlbumSorts = [
		{ id: "title", name: "Default Sort" },
		{ id: "artist", name: "Artist" },
		{ id: "title", name: "Album" },
		{ id: "year", name: "Year" },
		{ id: "created", name: "Date Added" }
	];
	this.settings = {
		Url: "http://Jamstash.com/beta/#/archive/",
		Username: "admin",
		Password: "beaver",
		Server: "http://69.251.77.96/supysonic",
		Timeout: 10000,
		NotificationTimeout: 20000,
		Protocol: "jsonp",
		ApplicationName: "Jamstash",
		ApiVersion: "1.6.0",
		AutoPlaylists: "",
		AutoPlaylistSize: 25,
		AutoAlbumSize: 30,
		// General
		HideAZ: false,
		ScrollTitle: true,
		NotificationSong: false,
		NotificationNowPlaying: false,
		SaveTrackPosition: false,
		ForceFlash: false,
		Theme: "Default",
		DefaultLibraryLayout: this.Layouts[0],
		DefaultSearchType: this.SearchTypes[0],
		DefaultAlbumSort: this.AlbumSorts[0],
		AutoPlay: false,
		LoopQueue: false,
		Repeat: false,
		Debug: false
	};

	this.SavedCollections = [];
	this.SavedGenres = [];

	this.BaseURL = function () { return this.settings.Server + '/rest'; };

	this.BaseParams = function () { return 'u=' + this.settings.Username + '&p=' + this.settings.Password + '&f=' + this.settings.Protocol + '&v=' + this.settings.ApiVersion + '&c=' + this.settings.ApplicationName + "&callback=" + "JSON_CALLBACK"; };

	this.defaultParams = function () { return {"u" : this.settings.Username, "p" : this.settings.Password, "f" : this.settings.Protocol, "v" : this.settings.ApiVersion, "c" : this.settings.ApplicationName, "callback" : "JSON_CALLBACK"}}
});

JamStash.directive('scrollIf', function(){
	return function(scope, element, attrs){
		scope.$watch(function(scope){
			return scope.$eval(attrs.scrollIf)
		}, function(val){
			if(val)
				{
					var list = $('#AlbumsList')
					var child = $(element);

					list.bind('scroll mousedown wheel DOMMouseScroll mousewheel keyup', function(e){
						if ( e.which > 0 || e.type == "mousedown" || e.type == "mousewheel"){
							list.stop();
						}
					})

					list.animate({scrollTop: list.scrollTop() + (child.position().top - list.position().top) - (list.height()/2) + (child.height()/2)}, 1000)
				}
		})
	}
})

JamStash.directive('fancybox', function ($log) {
	return {
		restrict: 'A',
		scope: {
			fancybox: "@"
		},
		link: function(scope, element, attrs) {

			element.attr('rel', 'covers');

			scope.$watch(function() { return scope.fancybox; }, function(newval) {

				$(element).children().fancybox({
					onStart: function(items, index, options) {

						var arrowStyle = {
							height: '100%',
							bottom: 0
						};

						angular.extend(options, {
							title: $(element).parent().attrs.title,
							titlePosition: 'inside',
							speedIn: 150,
							speedOut: 150
						});

						// image
						options.type = 'image';

						return options;
					},
					afterClose: function() {
						$(element).children().show();
					}
				})
			}, true)
		}
	};
});

JamStash.directive('stopEvent', function () {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			element.bind(attr.stopEvent, function (e) {
				e.stopPropagation();
			});
		}
	};
});

JamStash.directive('ngDownload', function ($compile) {
	return {
		restrict: 'E',
		scope: { data: '=' },
		link: function (scope, elm, attrs) {
			function getUrl() {
				return URL.createObjectURL(new Blob([JSON.stringify(scope.data)], { type: "application/json" }));
			}

			elm.append($compile(
				'<a class="button" download="backup.json"' +
				'href="' + getUrl() + '">' +
				'Download' +
				'</a>'
			)(scope));

			scope.$watch(scope.data, function () {
				elm.children()[0].href = getUrl();
			});
		}
	};
});

/* Factory */
JamStash.factory('json', function ($http) { // Deferred loading
	return {
		getCollections: function (callback) {
			$http.get('js/json_collections.js').success(callback);
		},
		getChangeLog: function (callback) {
			$http.get('js/json_changelog.js').success(callback);
		}
	}
});
JamStash.factory('template', function ($http, $compile, $http, $templateCache) { // Deferred loading
	return {
		getCollections: function (callback) {
			$http.get('js/json_collections.js', { cache: $templateCache }).success(callback);
		},
		getChangeLog: function (callback) {
			$http.get('js/json_changelog.js', { cache: $templateCache }).success(callback);
		},
		getSongs: function (callback) {
			templateUrl = 'js/partials/songs.html';
			$http.get(templateUrl, { cache: $templateCache }).success(callback);
		}
	}
});

/* Filters */
JamStash.filter('capitalize', function () {
	return function (input, scope) {
		return input.substring(0, 1).toUpperCase() + input.substring(1);
	}
});

JamStash.service('notifications', function ($rootScope, globals) {
	var msgIndex = 1;
	this.updateMessage = function (msg, autohide) {
		if (msg != '') {
			var id = msgIndex;
			$('#messages').append('<span id=\"msg_' + id + '\" class="message">' + msg + '</span>');
			$('#messages').fadeIn();
			$("#messages").scrollTo('100%');
			var el = '#msg_' + id;
			if (autohide) {
				setTimeout(function () {
					$(el).fadeOut(function () { $(this).remove(); });
				}, globals.settings.NotificationTimeout);
			}
			$(el).click(function () {
				$(el).fadeOut(function () { $(this).remove(); });
				return false;
			});
			msgIndex++;
		}
	}
	this.requestPermissionIfRequired = function () {
		if (!this.hasNotificationPermission() && (window.webkitNotifications)) {
			window.webkitNotifications.requestPermission();
		}
	}
	this.hasNotificationPermission = function () {
		return !!(window.webkitNotifications) && (window.webkitNotifications.checkPermission() == 0);
	}
	var notifications = new Array();
	this.showNotification = function (pic, title, text, type, bind) {
		if (this.hasNotificationPermission()) {
			//closeAllNotifications()
			var popup;
			if (type == 'text') {
				popup = window.webkitNotifications.createNotification(pic, title, text);
			} else if (type == 'html') {
				popup = window.webkitNotifications.createHTMLNotification(text);
			}
			if (bind = '#NextTrack') {
				popup.addEventListener('click', function (bind) {
					//$(bind).click();
					$rootScope.nextTrack();
					this.cancel();
				})
			}
			notifications.push(popup);
			setTimeout(function (notWin) {
				notWin.cancel();
			}, globals.settings.NotificationTimeout, popup);
			popup.show();
		} else {
			console.log("showNotification: No Permission");
		}
	}
	this.closeAllNotifications = function () {
		for (notification in notifications) {
			notifications[notification].cancel();
		}
	}
});
