
var JamStash = angular.module('JamStash', ['ngResource', 'ui.router']);

JamStash.config(
	function ($locationProvider, $stateProvider, $urlRouterProvider, $uiViewScrollProvider)
	{
		/*
		 *.when('/playlists', { templateUrl: 'js/partials/playlists.html', controller: 'PlaylistCtrl' })
		 *.when('/podcasts', { templateUrl: 'js/partials/podcasts.html', controller: 'PodcastCtrl' })
		 *.when('/archive', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
		 *.when('/archive/:artist', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
		 *.when('/archive/:artist/:album', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
		 */

		$urlRouterProvider.otherwise('/library');
		$uiViewScrollProvider.useAnchorScroll()


		$stateProvider
		.state('library',{
			url: '/library',
			controller: 'SubsonicCtrl',
			templateUrl: 'js/partials/library.html'
		})
		.state('library.recent', {
			url: '/recent/:offset',
			views: {
				'albums': {
					templateUrl: 'js/partials/albums.html',
					controller: function($scope, $log, $stateParams){

						if(isNaN($stateParams.offset) || $stateParams.offset === '')
							{
								$log.debug('calculating offset')
								$scope.calcOffset($stateParams.offset)
								return
							}

							$log.debug('loading recently added with offset: ' + $stateParams.offset)
							$scope.getAlbumListBy('newest', $stateParams.offset);

					}
				}
			}
		})
		.state('library.recent.album', {
			url: '/:albumId',
			views: {
				'songs': {
					templateUrl: 'js/partials/songs.html',
					controller: function($scope, $stateParams, $log, Album){
						$log.debug('loading recently added with album: ' + $stateParams.albumId)
						$scope.getSongs($stateParams.albumId, '')
					}
				}
			}
		})
		.state('library.artist',{
			url: '/:artistId',
			views: {
				'albums': {
					controller: function($scope, $stateParams, $log){
						$log.debug(angular.toJson($stateParams))
						if($stateParams.artistId.length > 0)
							$scope.getAlbums({id: $stateParams.artistId});
					}
				}
			}
		})
		.state('library.artist.album', {
			url: '/:albumId',
			templateUrl: 'js/partials/songs.html',
			views: {
				'songs': {
					controller: function($scope, $stateParams, $log, Album){
						$log.debug(angular.toJson($stateParams))
						if($stateParams.albumId.length > 0)
							$scope.getSongs($stateParams.albumId, '')
					}
				}
			}

		})
		.state('playlists', {
			url: '/playlists',
			templateUrl: 'js/partials/playlists.html',
			controller: 'PlaylistCtrl'
		})
		.state('settings', {
			url: '/settings',
			templateUrl: 'js/partials/settings.html',
			controller: 'SettingsCtrl'
		})

		$locationProvider.html5Mode(true);

	})
	.run(
		['$rootScope', 'globals', 'utils', '$state', '$log',
			function ($rootScope, globals, utils, $state, $log) {

				try
				{
					utils.getValue('Settings', function(s){
						if(s != null)
							{
								$log.debug('Loading Saved Settings')
								$log.debug(s)
								globals.settings = s;
							}
					})

					utils.getValue('Volume', function(v){
						if(v != null)
							$rootScope.volume  = v
					})

					utils.loadTrackPosition()
				}
				catch(err)
				{
					$log.debug(err)
					utils.setValue('CurrentSong', null)
					utils.setValue('CurrentQueue', null)
					utils.setValue('Settings', null)
				}

				$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
					$log.debug(error)
				})
				$rootScope.loggedIn = false;

				if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "" && ! $state.includes('archive') ) {
					$rootScope.loggedIn = true;
				}
				if (!$rootScope.loggedIn && (!$state.includes('settings') && !$state.includes('archive'))) {
					$state.go('settings');
				}

				utils.switchTheme(globals.settings.Theme);

			}]);

