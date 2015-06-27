'use strict';

angular.module('angularPassportApp')
    .factory('Auth', function Auth($location, $rootScope, Session, User, FHIR, $cookieStore) {
        $rootScope.currentUser = $cookieStore.get('user') || null;
        $cookieStore.remove('user');

        return {

            login: function (provider, user, callback) {
                var cb = callback || angular.noop;
                Session.save({
                    provider: provider,
                    email: user.email,
                    password: user.password,
                    rememberMe: user.rememberMe
                }, function (user) {
                    $rootScope.currentUser = user;
                    return cb();
                }, function (err) {
                    return cb(err.data);
                });
            },

            logout: function (callback) {
                var cb = callback || angular.noop;
                Session.delete(function (res) {
                        $rootScope.currentUser = null;
                        return cb();
                    },
                    function (err) {
                        return cb(err.data);
                    });
            },

            createUser: function (userinfo, callback) {
                var cb = callback || angular.noop;
                User.save(userinfo,
                    function (user) {
                        $rootScope.currentUser = user;
                        return cb();
                    },
                    function (err) {
                        return cb(err.data);
                    });
            },

            currentUser: function () {
                Session.get(function (user) {
                    $rootScope.currentUser = user;
                });
            },

            connectFHIR: function(user, client_id) {
                FHIR.connect.save({user: user, client_id: client_id});
            },

            getDREUserInfo: function () {
                FHIR.dreuser.get(function(userInfo){
                    $rootScope.userInfo = userInfo;
                })
            },

            getSMARTUserInfo: function () {
                FHIR.smartuser.get(function(userInfo){
                    $rootScope.userInfo = userInfo;
                })
            },

            getDREMeds: function () {
                FHIR.dremeds.get(function(medications){
                    $rootScope.medications = medications;
                })
            },

            getSMARTMeds: function () {
                FHIR.smartmeds.get(function(medications){
                    $rootScope.medications = medications;
                })
            },

            revokeToken: function () {
                FHIR.revokeToken.get(function(){
                    Session.get(function (user) {
                        $rootScope.currentUser = user;
                    });
                });
            },

            changePassword: function (email, oldPassword, newPassword, callback) {
                var cb = callback || angular.noop;
                User.update({
                    email: email,
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }, function (user) {
                    console.log('password changed');
                    return cb();
                }, function (err) {
                    return cb(err.data);
                });
            },

            removeUser: function (email, password, callback) {
                var cb = callback || angular.noop;
                User.delete({
                    email: email,
                    password: password
                }, function (user) {
                    console.log(user + 'removed');
                    return cb();
                }, function (err) {
                    return cb(err.data);
                });
            }
        };
    });