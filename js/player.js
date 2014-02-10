JamStash.controller('PlayerCtrl', function ($rootScope, $scope, $window, utils, globals, model, notifications, $http, $log) {

	$scope.settings = globals;

	/* for Swift.fm */
	$rootScope.unity;

	$rootScope.volume;

	var player1 = '#playdeck';
	var scrobbled = false;
	var timerid = 0;

	$scope.jPlayer;

	$scope.defaultPlay = function (data, event) {
		/*
		 * If no song loaded jplayer will be undefined, so play next in queue
		 */
		if (typeof $(player1).data("jPlayer") == 'undefined') {
			$scope.nextTrack();
		}
	}

	$scope.nextTrack = function () {
		var next = getNextSong();
		if (next) {
			$scope.playSong(false, next);
		}
	}

	$scope.previousTrack = function () {
		var next = getNextSong(true);
		if (next) {
			$scope.playSong(false, next);
		}
	}

	getNextSong = function (previous) {

		var song;

		$log.debug('Getting Next Song > ' + 'Queue length: ' + $rootScope.queue.length);

		if ($rootScope.queue.length > 0) {
			angular.forEach($rootScope.queue, function(item, key) {
				if (item.playing === true) {
					song = item;
				}
			});
			var index = $rootScope.queue.indexOf(song);
			var next;
			if (previous) {
				next = $rootScope.queue[index - 1];
			} else {
				next = $rootScope.queue[index + 1];
			}
			if (typeof next != 'undefined') {
				$log.debug('Next Song: ' + next.id);
				return next;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	startSaveTrackPosition = function () {

			if (timerid != 0) {
				clearInterval(timerid);
			}

			timerid = $window.setInterval(function () {
				if ($scope.settings.settings.SaveTrackPosition)
					saveTrackPosition();
			}, 5000);
	}

	saveTrackPosition = function () {
		if ($rootScope.playingSong  && $scope.jPlayer.data("jPlayer") != undefined) {
				$('#action_SaveProgress').fadeTo("slow", 0).delay(500).fadeTo("slow", 1).delay(500).fadeTo("slow", 0).delay(500).fadeTo("slow", 1);


				$rootScope.playingSong.position = $scope.jPlayer.data("jPlayer").status.currentTime;
				utils.setValue('CurrentSong', $rootScope.playingSong)
				//$log.debug('Saving Current Position: ' + angular.toJson($rootScope.playingSong));

				// Save Queue
				utils.setValue('CurrentQueue', $rootScope.queue)
				//$log.debug('Saving Queue: ' + $rootScope.queue.length + ' Songs');

		}
	}

	deleteCurrentQueue = function (data) {

		utils.setValue('CurrentQueue', null, false);
		utils.setValue('CurrentSong', null, false);

		$log.debug('Removing Play Queue');
	}

	$rootScope.playSong = function(loadonly, song) {
		$scope.playSong(loadonly, song)
	}

	$scope.playSong = function (loadonly, song) {

		$log.debug('Play: ' + JSON.stringify(song, null, 2));

		angular.forEach($rootScope.queue, function(item, key) {
			item.playing = false;
		});

		song.playing = true;
		song.selected = false;


		/*
		 * CHECK: need apply here or sometimes the playingSong doesn't update
		 */
		$rootScope.playingSong = song;
		//$scope.$apply()

		$scope.jPlayer = $scope.loadjPlayer(player1, song.url, song.suffix, loadonly, song.position);

		if (!loadonly) {
			// Sway.fm UnityShim
			if ($rootScope.unity) {
				$rootScope.unity.sendState
				({
					playing: true,
					title: song.name,
					artist: song.artist,
					favorite: false,
					albumArt: song.coverartfull
				});
			}
			// End UnityShim
		}

		// scroll to playing
		$('#Queue').stop().scrollTo('#' + song.id, 400);

		scrobbled = false;

		if (globals.settings.NotificationSong && !loadonly) {
			notifications.showNotification(song.coverartthumb, utils.toHTML.un(song.name), utils.toHTML.un(song.artist + ' - ' + song.album), 'text', '#NextTrack');
		}

		if (globals.settings.ScrollTitle) {
			var title = utils.toHTML.un(song.artist) + ' - ' + utils.toHTML.un(song.name);
			utils.scrollTitle(title);
		} else {
			utils.setTitle(utils.toHTML.un(song.artist) + ' - ' + utils.toHTML.un(song.name));
		}

	};

	$scope.loadjPlayer = function (el, url, suffix, loadonly, position) {

		var volume = $rootScope.volume;

		var audioSolution = "html,flash";

		if (globals.settings.ForceFlash) {
			audioSolution = "flash,html";
		}

		$.jPlayer.timeFormat.showHour = true;

		$(el).jPlayer("destroy")

		$(el).jPlayer({
			swfPath: "js/plugins/jplayer",
			wmode: "window",
			solution: audioSolution,
			supplied: suffix,
			// TODO: preload might be set to auto or metadata if resuming closed session
			//	but causes infinite retries if 404
			preload: "none",
			volume: volume,
			errorAlerts: false,
			warningAlerts: false,
			smoothPlayBar: false,
			cssSelectorAncestor: "#player",
			cssSelector: {
				play: "#PlayTrack",
				pause: "#PauseTrack",
				seekBar: ".scrubber",
				playBar: ".progress",
				mute: "#action_Mute",
				unmute: "#action_UnMute",
				volumeMax: "#action_VolumeMax",
				currentTime: "#played",
				duration: "#duration"
			},
			ready: function () {

				if (suffix == 'oga') {
					$(this).jPlayer("setMedia", {
						oga: url,
					});
				} else if (suffix == 'mp3') {
					$(this).jPlayer("setMedia", {
						mp3: url,
					});
				}

				if (loadonly) {
					$log.debug("loading song to position: " + position)
					$(this).jPlayer("pause", position);
				} else {
					$(this).jPlayer("play");
				}

				/*
				 *$log.debug('[jPlayer Version Info]');
				 *utils.logObjectProperties($(el).data("jPlayer").version);
				 *$log.debug('[HTML5 Debug Info]');
				 *utils.logObjectProperties($(el).data("jPlayer").html);
				 *$log.debug('[Flash Debug Info]');
				 *utils.logObjectProperties($(el).data("jPlayer").flash);
				 *$log.debug('[jPlayer Options Info]');
				 *utils.logObjectProperties($(el).data("jPlayer").options);
				 */
			},
			timeupdate: function(event) {
				// Scrobble song once percentage is reached
				var p = event.jPlayer.status.currentPercentAbsolute;
				if (!scrobbled && p > 30) {
					$log.debug('LAST.FM SCROBBLE - Percent Played: ' + p);
					scrobbleSong(true);
				}
			},
			volumechange: function(event) {
				utils.setValue('Volume', event.jPlayer.options.volume, true);
			},
			ended: function(event) {
				if (globals.settings.Repeat) { // Repeat current track if enabled
					$(this).jPlayer("play");
				} else {
					if (!getNextSong()) { // Action if we are at the last song in queue
						if (globals.settings.LoopQueue) { // Loop to first track in queue if enabled
							var next = $rootScope.queue[0];
							$scope.playSong(false, next);
						} else if (globals.settings.AutoPlay) { // Load more tracks if enabled
							$rootScope.getRandomSongs('play', '', '');
							notifications.updateMessage('Auto Play Activated...', true);
						}
					} else {
						$scope.nextTrack();
						$scope.$apply();
					}
				}
			},
			error: function(event) {

				var time = $(player1).data("jPlayer").status.currentTime;

				$log.debug("Error Type: " + event.jPlayer.error.type);
				$log.debug("Error Context: " + event.jPlayer.error.context);
				$log.debug("Error Message: " + event.jPlayer.error.message);
				$log.debug("Stream interrupted, retrying from position: " + time);
			}
		});

		return $(el);
	}

	$rootScope.playPauseSong = function(){
		$scope.playPauseSong()
	}

	$scope.playPauseSong = function () {
		if ($(player1).data("jPlayer").status.paused) {
			$(player1).jPlayer("play");
		} else {
			$(player1).jPlayer("pause");
		}
	}

	scrobbleSong = function (submission) {
		if ($rootScope.loggedIn && submission) {
			var id = $rootScope.playingSong.id;

			$log.debug('Scrobble Song: ' + id);

			$http
			.jsonp( globals.BaseURL() + '/scrobble.view?' + globals.BaseParams() + '&id=' + id + "&submission=" + submission )
			.success( function () { scrobbled = true; });
		}
	}

	rateSong = function (songid, rating) {
		$http
		.get( baseURL + '/setRating.view?' + baseParams + '&id=' + songid + "&rating=" + rating )
		.success( function () {
			updateMessage('Rating Updated!', true);
		});
	}

	// Sway.fm Unity Plugin
	$rootScope.unity = UnityMusicShim();
	$rootScope.unity.setSupports({
		playpause: true,
		next: true,
		previous: true
	});

	$rootScope.unity.setCallbackObject({
		pause: function () {
			if (globals.settings.Debug) { console.log("Unity: Recieved playpause command"); }
			playPauseSong();
		},
		next: function () {
			if (globals.settings.Debug) { console.log("Unity: Recieved next command"); }
			$scope.nextTrack();
		},
		previous: function () {
			if (globals.settings.Debug) { console.log("Unity: Recieved previous command"); }
			$scope.previousTrack();
		}
	});

	startSaveTrackPosition();

});
