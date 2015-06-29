'use strict';

angular.module('angularPassportApp')
    .controller('MainCtrl', function ($scope, Auth, $location, $rootScope) {
        $scope.error = {};
        $scope.user = {};

        function update () {
            Auth.getClients(function(){
                for (var i = 0; i < $rootScope.clients.length; i++) {
                    if ($rootScope.clients[i].shortname === 'DRE') {
                        if ($rootScope.currentUser.dreToken) {
                            Auth.getDREUserInfo($rootScope.currentUser._id, $rootScope.clients[i].credentials.client_id);
                            Auth.getDREMeds($rootScope.currentUser._id, $rootScope.clients[i].credentials.client_id);
                        }
                    }
                    if ($rootScope.clients[i].shortname === 'SMART on FHIR') {
                        if ($rootScope.currentUser.smartToken) {
                            Auth.getSMARTUserInfo($rootScope.currentUser._id, $rootScope.clients[i].credentials.client_id);
                            Auth.getSMARTMeds($rootScope.currentUser._id, $rootScope.clients[i].credentials.client_id);
                        }
                    }
                }
            });
        };

        $scope.login = function (form) {
            Auth.login('password', {
                    'email': $scope.user.email,
                    'password': $scope.user.password
                },
                function (err) {
                    $scope.errors = {};

                    if (!err) {
                        update();
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
            update();
        }

        $scope.revokeToken = function () {
            Auth.revokeToken();
        }
    });
