'use strict';

angular.module('angularPassportApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'http-auth-interceptor',
    'ui.bootstrap'
])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/main.html',
                controller: 'MainCtrl'
            })
            .when('/settings', {
                templateUrl: 'partials/settings.html',
                controller: 'MainCtrl'
            })
            .when('/signup', {
                templateUrl: 'partials/signup.html',
                controller: 'SignupCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true);
    })

    .run(function ($rootScope, $location, Auth) {

        //watching the value of the currentUser variable.
        $rootScope.$watch('currentUser', function (currentUser) {
            // if no currentUser and on a page that requires authorization then try to update it
            // will trigger 401s if user does not have a valid session
            if (!currentUser && (['/', '/logout', '/signup'].indexOf($location.path()) == -1 )) {
                Auth.currentUser();
            }
        });

        // On catching 401 errors, redirect to the login page.
        $rootScope.$on('event:auth-loginRequired', function () {
            $location.path('/');
            return false;
        });
    });