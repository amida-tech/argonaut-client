'use strict';

angular.module('angularPassportApp')
    .controller('MainCtrl', function ($scope, Auth, $location, $rootScope) {
        $scope.error = {};
        $scope.user = {};

        $scope.login = function (form) {
            Auth.login('password', {
                    'email': $scope.user.email,
                    'password': $scope.user.password
                },
                function (err) {
                    $scope.errors = {};

                    if (!err) {
                        $location.path('/');
                    } else {
                        angular.forEach(err.errors, function (error, field) {
                            form[field].$setValidity('mongoose', false);
                            $scope.errors[field] = error.type;
                        });
                        $scope.error.other = err.message;
                    }
                });
        };
        if ($rootScope.currentUser) {
            for (var i = 0; i < $rootScope.currentUser.clients.length; i++) {
                if ($rootScope.currentUser.clients[i].shortname === 'DRE') {
                    $rootScope.currentUser.clients[i].token = $rootScope.currentUser.dreToken;
                    if ($rootScope.currentUser.clients[i].token) {
                        Auth.getDREUserInfo($rootScope.currentUser._id, $rootScope.currentUser.clients[i].credentials.client_id);
                        Auth.getDREMeds($rootScope.currentUser._id, $rootScope.currentUser.clients[i].credentials.client_id);
                    }
                }
                if ($rootScope.currentUser.clients[i].shortname === 'SMART on FHIR') {
                    $rootScope.currentUser.clients[i].token = $rootScope.currentUser.smartToken;
                    if ($rootScope.currentUser.clients[i].token) {
                        Auth.getSMARTUserInfo($rootScope.currentUser._id, $rootScope.currentUser.clients[i].credentials.client_id);
                        Auth.getSMARTMeds($rootScope.currentUser._id, $rootScope.currentUser.clients[i].credentials.client_id);
                    }
                }
            }
        }

        $scope.revokeToken = function () {
            Auth.revokeToken();
        }
    });
