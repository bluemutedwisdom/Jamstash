
var JamStash = angular.module('JamStash', ['ngResource', 'ui.router']);


JamStash.config(function ($locationProvider, $stateProvider, $urlRouterProvider) {
	/*
	 *.when('/playlists', { templateUrl: 'js/partials/playlists.html', controller: 'PlaylistCtrl' })
	 *.when('/podcasts', { templateUrl: 'js/partials/podcasts.html', controller: 'PodcastCtrl' })
	 *.when('/archive', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
	 *.when('/archive/:artist', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
	 *.when('/archive/:artist/:album', { templateUrl: 'js/partials/archive.html', controller: 'ArchiveCtrl' })
	 */

	$urlRouterProvider.otherwise('/library');

	$stateProvider
	    .state('library',{
		    url: '/library',
		    templateUrl: 'js/partials/library.html',
		    controller: 'SubsonicCtrl'
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

	    $stateProvider
	    .state('settings', {
		    url: '/settings',
		    templateUrl: 'js/partials/settings.html',
		    controller: 'SettingsCtrl'
	    })

	    $locationProvider.html5Mode(true);



})
.run(['$rootScope', 'globals', 'utils', '$state',
     function ($rootScope, globals, utils, $state) {

	     utils.loadSettings()
	     utils.loadTrackPosition()

	     $rootScope.loggedIn = false;

	     if (globals.settings.Username != "" && globals.settings.Password != "" && globals.settings.Server != "" && ! $state.includes('archive') ) {
		     $rootScope.loggedIn = true;
	     }
	     if (!$rootScope.loggedIn && (!$state.includes('settings') && !$state.includes('archive'))) {
		     $state.go('settings');
	     }

	     utils.switchTheme(globals.settings.Theme);

     }]);

