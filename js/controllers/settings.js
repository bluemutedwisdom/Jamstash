JamStash.controller('SettingsCtrl', function SettingsCtrl($scope, utils, globals, json, notifications, $log) {

	$scope.settings = globals.settings;

	$scope.Timeouts = [
		{ id: 10000, name: 10 },
		{ id: 20000, name: 20 },
		{ id: 30000, name: 30 },
		{ id: 40000, name: 40 },
		{ id: 50000, name: 50 },
		{ id: 60000, name: 60 },
		{ id: 90000, name: 90 },
		{ id: 120000, name: 120 }
	];

	$scope.Themes = ["Default", "Dark"];

	$scope.SearchTypes = globals.SearchTypes;
	$scope.Layouts = globals.Layouts;

	$scope.$watch('settings.HideAZ', function () {
		if (globals.settings.HideAZ) {
			$('#AZIndex').hide();
		} else {
			$('#AZIndex').show();
		}
	});

	$scope.save = function () {
		if ($scope.settings.Password != '' && globals.settings.Password.substring(0, 4) != 'enc:') { $scope.settings.Password = 'enc:' + utils.HexEncode($scope.settings.Password); }

		if (globals.settings.NotificationSong) {
			notifications.requestPermissionIfRequired();
			if (!notifications.hasNotificationPermission()) {
				alert('HTML5 Notifications are not available for your current browser, Sorry :(');
			}
		}

		if (globals.settings.NotificationNowPlaying) {
			notifications.requestPermissionIfRequired();
			if (!notifications.hasNotificationPermission()) {
				alert('HTML5 Notifications are not available for your current browser, Sorry :(');
			}
		}

		if (globals.settings.Theme) {
			utils.switchTheme(globals.settings.Theme);
		}

		$log.debug('Settings Updated to: ' + JSON.stringify($scope.settings, null, 2))

		localStorage.setItem('Settings', angular.toJson($scope.settings))

		globals.settings = $scope.settings

		notifications.updateMessage('Settings Updated!', true);

		if (globals.settings.Server != '' && globals.settings.Username != '' && globals.settings.Password != '') {
			$scope.ping();
		}
	};

	json.getChangeLog(function (data) {
		$scope.changeLog = data.slice(0, 10);
	});

	$scope.changeLogShowMore = function () {
		json.getChangeLog(function (data) {
			$scope.changeLog = data;
		});
	}


	$scope.toggleSetting = function (setting) {

		if (globals.settings[setting]) {
			globals.settings[setting] = false;
		} else {
			globals.settings[setting] = true;
		}

		notifications.updateMessage(setting + ' : ' + globals.settings[setting], true);
	}
});
