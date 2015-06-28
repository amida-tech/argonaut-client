'use strict';

angular.module('angularPassportApp')
    .controller('SettingsCtrl', function ($scope, Auth, $location, $rootScope) {
        for (var i = 0; i < $rootScope.currentUser.clients.length; i++) {
            if ($rootScope.currentUser.clients[i].shortname === 'DRE') {
                $rootScope.currentUser.clients[i].token = $rootScope.currentUser.dreToken;
                if ($rootScope.currentUser.clients[i].token) {
                    Auth.getDREUserInfo($rootScope.currentUser._id,$rootScope.currentUser.clients[i].credentials.client_id);
                    Auth.getDREMeds($rootScope.currentUser._id,$rootScope.currentUser.clients[i].credentials.client_id);
                }
            }
            if ($rootScope.currentUser.clients[i].shortname === 'SMART on FHIR') {
                $rootScope.currentUser.clients[i].token = $rootScope.currentUser.smartToken;
                if ($rootScope.currentUser.clients[i].token) {
                    Auth.getSMARTUserInfo($rootScope.currentUser._id,$rootScope.currentUser.clients[i].credentials.client_id);
                    Auth.getSMARTMeds($rootScope.currentUser._id,$rootScope.currentUser.clients[i].credentials.client_id);
                }
            }
        }

        /*
        $scope.switchOn = function(client) {
            console.log("here "+client.shortname);
            Auth.connectFHIR($rootScope.currentUser, client.credentials.client_id);
        };

        $scope.switchOff = function() {
            Auth.revokeToken();
        };
        */

        $scope.revokeToken = function() {
            Auth.revokeToken();
        }
    });
