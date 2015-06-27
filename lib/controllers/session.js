'use strict';

var mongoose = require('mongoose'),
  passport = require('passport');

/**
 * Session
 * returns info on authenticated user
 */
exports.session = function (req, res) {
  var userInfo = req.user.user_info;
  userInfo.clients = req.user.clients;
  res.json(userInfo);
};

/**
 * Logout
 * returns nothing
 */
exports.logout = function (req, res) {
  if(req.user) {
    req.logout();
    res.send(200);
  } else {
    res.send(400, "Not logged in");
  }
};

/**
 *  Login
 *  requires: {email, password}
 */
exports.login = function (req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    var error = err || info;
    if (error) { return res.json(400, error); }
    req.logIn(user, function(err) {
      if (err) { return res.send(err); }
      var userInfo = req.user.user_info;
      userInfo.clients = req.user.clients;
      res.json(userInfo);
    });
  })(req, res, next);
}