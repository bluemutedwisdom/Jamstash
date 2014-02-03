JamStash.controller('SubsonicCtrl', function SubsonicCtrl($scope, $rootScope, $stateParams, utils, globals, model, notifications, $http, $state, $log, Album, Folders, Playlists, Artist) {

	/*
	 * songlist songs
	 */
	$scope.song = [];
	$scope.selectedSongs = [];
	$scope.shortcut = [];
	$scope.playlistMenu = [];
	$scope.BreadCrumbs = [];

	/*
	 * albumlist albums
	 */
	$scope.album = [];

	$scope.settings = globals.settings;
	$scope.Server = globals.settings.Server;

	$scope.AutoAlbums = [
		{ id: "random", name: "Random" },
		{ id: "newest", name: "Recently Added" },
		{ id: "starred", name: "Starred" },
		{ id: "highest", name: "Top Rated" },
		{ id: "frequent", name: "Most Played" },
		{ id: "recent", name: "Recently Played" }
	];

	$scope.selectedAutoAlbum;
	$scope.selectedArtist;
	$scope.selectedAlbum;

	$scope.offset = 0;

	$scope.AlbumSort = globals.AlbumSorts;
	$scope.SelectedAlbumSort = $scope.AlbumSort[0];

	$scope.AlbumDisplay = globals.Layouts;
	$scope.SelectedAlbumDisplay = $scope.AlbumDisplay[0];

	$scope.SearchType = globals.settings.DefaultSearchType;
	$scope.SearchTypes = globals.SearchTypes;

	$scope.MusicFolders = [];
	$scope.SelectedMusicFolder;

	$scope.getMusicFolders = function () {

		var data = Folders.list({}, function() {

			if (data["subsonic-response"].musicFolders.musicFolder !== undefined) {

				$scope.MusicFolders.length = 0;

				if (data["subsonic-response"].musicFolders.musicFolder.length > 0) {
					$scope.MusicFolders = data["subsonic-response"].musicFolders.musicFolder;
				} else {
					$scope.MusicFolders[0] = data["subsonic-response"].musicFolders.musicFolder;
				}

				utils.setValue('MusicFolders', $scope.MusicFolders);
			}
			else
				{
					$log.debug("No Music Folders :(")
				}

		})
	}

	$scope.rescanLibrary = function (data, event) {
		$http
		.jsonp(globals.BaseURL() + '/getUser.view?' + globals.BaseParams() + '&username=' + globals.settings.Username)
		.success( function (data) {
			if (data["subsonic-response"].user.adminRole == true) {
				$.get(globals.settings.Server + '/musicFolderSettings.view?scanNow');
			} else {
				alert('You are not logged in as an admin user!');
			}
		})
	};

	/*
	 * Some values may be arrays or single values
	 * such as artists on index
	 */
	$scope.mapArtist = function (data) {

		var artist = data.artist;
		var artists = [];
		if (artist.length > 0) {
			artists = artist;
		} else {
			artists[0] = artist;
		}
		return new model.Index(data.name, artists);
	}

	$scope.mapPlaylist = function (data) {
		return new model.Artist(data.id, data.name);
	}

	/*
	 * load the album list in left column
	 */
	$scope.getArtists = function (MusicFolderId) {

		var data = Artist.list({}, function(){

			var indexes = [];

			if (typeof data["subsonic-response"].artists.index != 'undefined') {
				if (data["subsonic-response"].artists.index.length > 0) {
					indexes = data["subsonic-response"].artists.index;
				} else {
					indexes[0] = data["subsonic-response"].artists.index;
				}
			}

			$scope.shortcut = [];
			var items = [];

			if (typeof data["subsonic-response"].indexes != 'undefined') {
				if (typeof data["subsonic-response"].indexes.shortcut != 'undefined') {
					if (data["subsonic-response"].indexes.shortcut.length > 0) {
						items = data["subsonic-response"].indexes.shortcut;
					} else {
						items[0] = data["subsonic-response"].indexes.shortcut;
					}
					angular.forEach(items, function (item, key) {
						$scope.shortcut.push(item);
					});
				}
			}

			$rootScope.index = [];

			angular.forEach(indexes, function (item, key) {
				$rootScope.index.push($scope.mapArtist(item));
			});

			utils.setValue('Indexes', $rootScope.index);
		});
	};

	$scope.refreshArtists = function (id) {
		$scope.getArtists();
	};

	$scope.mapAlbum = function (data) {
		var album = data;
		var title, coverartthumb, coverartfull, starred;
		if (typeof album.coverArt != 'undefined') {
			coverartthumb = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&size=160&id=' + album.coverArt;
			coverartfull = globals.BaseURL() + '/getCoverArt.view?' + globals.BaseParams() + '&id=' + album.coverArt;
		}
		if (typeof album.starred !== 'undefined') { starred = true; } else { starred = false; }
		if (typeof album.title !== 'undefined') { title = album.title; } else { title = album.name; }
		var type;
		if (album.isDir) {
			type = 'byfolder';
		} else {
			type = 'bytag';
		}
		return new model.Album(album.id, album.parent, title, album.artist, album.artistId, coverartthumb, coverartfull, $.format.date(new Date(album.created), "yyyy-MM-dd h:mm a"), starred, '', '', type);
	}

	$scope.loadArtist = function (artist) {
		$state.go('library.artist', {"artistId": artist.id})
	}

	/*
	 * Get albums by particular artist
	 */
	$scope.getAlbums = function (artist) {

		$log.debug('Getting albums for ' + artist.id)

		$scope.selectedAutoAlbum = null;

		$scope.selectedArtist = artist;

		$scope.BreadCrumbs.length = 0;
		$scope.BreadCrumbs.push(artist);

		var data = Artist.get({"id": artist.id}, function(){
			var items = [];

			$scope.selectedArtist = data['subsonic-response'].artist;


			var tempAlbums = [];

			if(data['subsonic-response'].artist.album.length > 0)
			{
				angular.forEach(data['subsonic-response'].artist.album, function (item, key) {
					$log.debug(JSON.stringify(item, null, 2))
					tempAlbums.push ( $scope.mapAlbum(item) )
				})
			}
			else
			{
				$log.debug(JSON.stringify(data['subsonic-response'].artist.album))
				tempAlbums[0] = $scope.mapAlbum(data['subsonic-response'].artist.album)
			}


			$scope.selectedArtist.album = tempAlbums;
		})
	};

	$scope.getArtistByTag = function (id) { // Gets Artist by ID3 tag

		$scope.selectedAutoAlbum = null;
		$scope.selectedArtist = id;

		var url = globals.BaseURL() + '/getArtist.view?' + globals.BaseParams() + '&id=' + id;

		$http
		.jsonp(url)
		.succes( function (data) {
			var items = [];
			if (typeof data["subsonic-response"].artist != 'undefined') {
				if (data["subsonic-response"].artist.album.length > 0) {
					items = data["subsonic-response"].artist.album;
				} else {
					items[0] = data["subsonic-response"].artist.album;
				}
				$scope.album = [];
				$scope.song = [];

				angular.forEach(items, function (item, key) {
					$scope.album.push($scope.mapAlbum(item));
				});
			} else {
				notifications.updateMessage('No Albums Returned :(', true);
			}
		});
	};

	$scope.getAlbumByTag = function (id) { // Gets Album by ID3 tag
		$http
		.jsonp( globals.BaseURL() + '/getAlbum.view?' + globals.BaseParams() + '&id=' + id )
		.success( function (data) {
			if (typeof data["subsonic-response"].album != 'undefined') {
				$scope.album = [];
				$scope.song = [];

				$scope.album.push($scope.mapAlbum(data["subsonic-response"].album));

				var items = [];
				if (data["subsonic-response"].album.song.length > 0) {
					items = data["subsonic-response"].album.song;
				} else {
					items[0] = data["subsonic-response"].album.song;
				}
				angular.forEach(items, function (item, key) {
					$scope.song.push(utils.mapSong(item));
				});
			}
		});
	};

	/*
	 * Get Albums by AutoAlbums of type and page offset
	 */
	$scope.getAlbumListBy = function (type, offset) {
		var size, url;

		if (offset == 'next') {
			$scope.offset = $scope.offset + globals.settings.AutoAlbumSize;
		} else if (offset == 'prev') {
			$scope.offset = $scope.offset - globals.settings.AutoAlbumSize;
		}

		Album.list({"type": type, "offset": $scope.offset, "size": 30}, function(data){

			if (typeof data["subsonic-response"].albumList2.album != 'undefined') {

				$scope.selectedAutoAlbum = type;
				$scope.selectedArtist = {}
				$scope.selectedArtist.name = type;
				$scope.selectedArtist.album = data['subsonic-response'].albumList2.album

				var tempAlbums = [];
				angular.forEach(data['subsonic-response'].albumList2.album, function (item, key) {
					tempAlbums.push ( $scope.mapAlbum(item) )
				})

				$scope.selectedArtist.album = tempAlbums;

			} else {
				notifications.updateMessage('No Albums Returned :(', true);
			}
		});
	};

	$scope.getSongs = function (id, action) {

		var data = Album.get({"id": id}, function(){

			var items = data['subsonic-response'].album.song

			$scope.selectedAlbum = data['subsonic-response'].album;

			if (action == 'add') {

				angular.forEach(items, function (item, key) {
					$rootScope.queue.push(utils.mapSong(item));
				});

				notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);

			} else if (action == 'play') {

				$rootScope.queue = [];

				angular.forEach(items, function (item, key) {
					$rootScope.queue.push(utils.mapSong(item));
				});

				var next = $rootScope.queue[0];

				$rootScope.playSong(false, next);

				notifications.updateMessage(items.length + ' Song(s) Added to Queue', true);

			} else if (action == 'preview') {
				$scope.songpreview = [];
				angular.forEach(items, function (item, key) {
					if (!item.isDir) {
						$rootScope.songpreview.push(utils.mapSong(item));
					}
				});
			}

			var tempSongs = [];
			angular.forEach(items, function (item, key) {
				tempSongs.push(utils.mapSong(item));
			});

			$scope.selectedAlbum.song = tempSongs;

		})
	};

	$scope.search = function () {
		var query = $('#Search').val();
		if (query != '') {
			var type = $('#SearchType').val();
			$http
			.jsonp(globals.BaseURL() + '/search3.view?' + globals.BaseParams() + '&query=' + query)
			.success( function (data) {
				if (data["subsonic-response"].searchResult2 !== "") {
					var header;
					var items = [];
					if (type === '0') {
						if (data["subsonic-response"].searchResult2.song !== undefined) {
							if (data["subsonic-response"].searchResult2.song.length > 0) {
								items = data["subsonic-response"].searchResult2.song;
							} else {
								items[0] = data["subsonic-response"].searchResult2.song;
							}
							$scope.song = [];
							angular.forEach(items, function (item, key) {
								$scope.song.push(utils.mapSong(item));
							});
						}
					}
					if (type === '1') {
						if (data["subsonic-response"].searchResult2.album !== undefined) {
							if (data["subsonic-response"].searchResult2.album.length > 0) {
								items = data["subsonic-response"].searchResult2.album;
							} else {
								items[0] = data["subsonic-response"].searchResult2.album;
							}
							$scope.album = [];
							angular.forEach(items, function (item, key) {
								if (item.isDir) {
									$scope.album.push($scope.mapAlbum(item));
								} else {
									$scope.song.push($scope.mapAlbum(item));
								}
							});
						}
					}
					if (type === '2') {
						if (data["subsonic-response"].searchResult2.artist !== undefined) {
							if (data["subsonic-response"].searchResult2.artist.length > 0) {
								items = data["subsonic-response"].searchResult2.artist;
							} else {
								items[0] = data["subsonic-response"].searchResult2.artist;
							}
							angular.forEach(items, function (item, key) {
								$scope.shortcut.push(item);
							});
						}
					}
				}
			})
		};
	}

	$scope.toggleAZ = function (event) {
		$scope.toggleSubmenu('#submenu_AZIndex', '#AZIndex', 'right', 44);
	}

	$scope.loadPlaylistsForMenu = function (data, event) {

		var data = Playlists.get({}, function(){

			var playlists = [];
			$scope.playlistMenu = [];

			if (typeof data["subsonic-response"].playlists.playlist != 'undefined') {

				if (data["subsonic-response"].playlists.playlist.length > 0) {
					playlists = data["subsonic-response"].playlists.playlist;
				} else {
					playlists[0] = data["subsonic-response"].playlists.playlist;
				}

				angular.forEach(playlists, function (item, key) {
					if (item.owner == globals.settings.Username) {
						$scope.playlistMenu.push($scope.mapPlaylist(item));
					}
				});

				if ($scope.playlistMenu.length > 0) {
					// TODO
					$scope.toggleSubmenu('#submenu_AddToPlaylist', '#action_AddToPlaylist', 'left', 124);
				} else {
					notifications.updateMessage('No Playlists :(', true);
				}
			}
		});
	}

	$scope.addToPlaylist = function () {

		var songs = [];

		if ($scope.selectedSongs.length !== 0) {
			angular.forEach($scope.selectedSongs, function (item, key) {
				songs.push(item.id);
			});

			var runningVersion = utils.parseVersionString(globals.settings.ApiVersion);
			var minimumVersion = utils.parseVersionString('1.8.0');

			if (utils.checkVersion(runningVersion, minimumVersion)) { // is 1.8.0 or newer

				Playlists.update( function({"songIdToAdd": songs}) {
					$scope.selectedSongs.length = 0;
					notifications.updateMessage('Playlist Updated!', true);
				});
			}
		}
	}

	$scope.getGenres = function () {
		var genres = 'Acid Rock,Acoustic,Alt Country,Alt/Indie,Alternative & Punk,Alternative Metal,Alternative,AlternRock,Awesome,Bluegrass,Blues,Blues-Rock,Classic Hard Rock,Classic Rock,Comedy,Country,Country-Rock,Dance,Dance-Rock,Deep Funk,Easy Listening,Electronic,Electronica,Electronica/Dance,Folk,Folk/Rock,Funk,Grunge,Hard Rock,Heavy Metal,Holiday,House,Improg,Indie Rock,Indie,International,Irish,Jam Band,Jam,Jazz Fusion,Jazz,Latin,Live Albums,Metal,Music,Oldies,Other,Pop,Pop/Rock,Post Rock,Progressive Rock,Psychedelic Rock,Psychedelic,Punk,R&B,Rap & Hip-Hop,Reggae,Rock & Roll,Rock,Rock/Pop,Roots,Ska,Soft Rock,Soul,Southern Rock,Thrash Metal,Unknown,Vocal,World';
		$rootScope.Genres = genres.split(',');
		/* This is broken in version 4.8, unable to convert XML to JSON
		   $.ajax({
url: globals.BaseURL() + '/getGenres.view?' + globals.BaseParams(),
method: 'GET',
dataType: globals.settings.Protocol,
timeout: globals.settings.Timeout,
success: function (data) {
if (typeof data["subsonic-response"].genres != 'undefined') {
var items = [];
if (data["subsonic-response"].genres.length > 0) {
items = data["subsonic-response"].genres;
} else {
items[0] = data["subsonic-response"].genres;
}

$rootScope.Genres = items;
}
}
});
*/
	}

	$scope.selectSong = function (data) {
		var i = $scope.selectedSongs.indexOf(data);
		if (i >= 0) {
			$scope.selectedSongs.splice(i, 1);
			data.selected = false;
		} else {
			$scope.selectedSongs.push(data);
			data.selected = true;
		}
	}

	/*
	 * Queue and Play all songs in main window
	 */
	$scope.playAll = function () {
		$scope.selectAll();
		var next = $scope.addSongsToQueue();
		$rootScope.playSong(false, next);
	}

	/*
	 * Select all songs helper function
	 */
	$scope.selectAll = function () {
		angular.forEach($scope.song, function (item, key) {
			item.selected = true;
			$scope.selectedSongs.push(item);
		});
	}

	/*
	 * add selected songs in main window to Queue
	 */
	$scope.addSongsToQueue = function () {
		if ($scope.selectedSongs.length !== 0) {
			angular.forEach($scope.selectedSongs, function (item, key) {
				$scope.queue.push(item);
				item.selected = false;
			});

			notifications.updateMessage($scope.selectedSongs.length + ' Song(s) Added to Queue', true);

			var ret = $scope.selectedSongs[0];
			$scope.selectedSongs.length = 0;
			return ret;
		}
	}


	/*
	 * On Every Controller Load
	 */

	utils.getValue("Indexes", function(i){
		$log.debug('index loaded')
		$rootScope.index = i;
	})

	$scope.getMusicFolders();
});
