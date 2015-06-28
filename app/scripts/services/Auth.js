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
                    /*
                    if (user.dreToken) {
                        for (var i = 0; i < user.clients; i++){
                            if (user.clients[i].shortname === 'DRE') {
                                console.log("here");
                                FHIR.dreuser.get({client_id: user.clients[i].credentials.client_id, user: user._id},function(userInfo){
                                    $rootScope.patient = userInfo;
                                });
                                FHIR.dremeds.get({client_id: user.clients[i].credentials.client_id, user: user._id},function(medications){
                                    $rootScope.medications = medications;
                                });
                            }
                        }
                    }
                    if (user.smartToken) {
                        FHIR.smartuser.get(function(userInfo){
                            $rootScope.patient = userInfo;
                        });
                        FHIR.smartmeds.get(function(medications){
                            $rootScope.medications = medications;
                        });
                    }
                    */
                });
            },

            connectFHIR: function(user, client_id) {
                FHIR.connect.save({user: user, client_id: client_id});
            },

            getDREUserInfo: function (user, client_id) {
                FHIR.dreuser.save({client_id: client_id, user: user},function(userInfo){
                    $rootScope.patient = userInfo;
                })
            },

            getSMARTUserInfo: function (user, client_id) {
                FHIR.smartuser.save({client_id: client_id, user: user},function(userInfo){
                    $rootScope.patient = userInfo;
                })
            },

            getDREMeds: function (user, client_id) {
                FHIR.dremeds.save({client_id: client_id, user: user},function(medications){
                    $rootScope.medications = medications.meds;
                })
            },

            getSMARTMeds: function (user, client_id) {
                FHIR.smartmeds.save({client_id: client_id, user: user},function(medications){
                    $rootScope.medications = medications.meds;
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