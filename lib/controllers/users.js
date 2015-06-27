'use strict';

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  passport = require('passport'),
  ObjectId = mongoose.Types.ObjectId;

/**
 * Create user
 * requires: {username, password, email}
 * returns: {email, password}
 */
exports.create = function (req, res, next) {
  var userObject = req.body;
  userObject.clients = [{
    name: 'DRE/FHIR (localhost:3000)',
    shortname: 'DRE',
    url: 'http://localhost:3000/',
    auth_url: 'http://localhost:3000/',
    logo_url: '',
    credentials: {
      client_id: 'argonaut_demo_client_local',
      client_secret: 'have no secrets!',
      site: 'http://localhost:3000/',
      api_url: 'http://localhost:3000/fhir',
      authorization_path: 'oauth2/authorize',
      token_path: 'oauth2/token',
      revocation_path: 'oauth2/revoke',
      scope: '',
      redirect_uri: 'http://localhost:3001/fhir/callback'
    }
  }, {
    name: 'SMART on FHIR',
    shortname: 'SMART on FHIR',
    url: 'https://fhir-api.smarthealthit.org',
    auth_url: 'https://authorize.smarthealthit.org',
    logo_url: '',
    credentials: {
      client_id: "070f1861-9d9a-433b-be73-1e75c9a034dd",
      client_secret: "bpJnFB3U-aY7c_tj5qXos1xjJCcMwsZL9XlkY3E9SHtnLlB7ros_PSZXsyvMUQS_G9IDShXWUm2jjBghnFllow",
      site: 'https://authorize.smarthealthit.org',
      api_url: 'https://fhir-api.smarthealthit.org',
      authorization_path: '/authorize',
      token_path: '/token',
      revocation_path: '/revoke',
      scope: '',
      redirect_uri: 'http://localhost:3001/fhir/callback'
      //redirect_uri: 'http://toolbox.amida-demo.com:3001/fhir/callback'
    }
  }/*, { //commented out for demo/screenshots
   name: 'DRE/FHIR (toolbox.amida-demo.com:3000)',
   url: 'http://toolbox.amida-demo.com:3000/',
   auth_url: 'http://toolbox.amida-demo.com:3000/',
   logo_url: '',
   credentials: {
   client_id: 'argonaut_demo_client',
   client_secret: 'have no secrets!',
   site: 'http://toolbox.amida-demo.com:3000/',
   api_url: 'http://toolbox.amida-demo.com:3000/fhir',
   authorization_path: 'oauth2/authorize',
   token_path: 'oauth2/token',
   revocation_path: 'oauth2/revoke',
   scope: '',
   redirect_uri: 'http://toolbox.amida-demo.com:3001/fhir/callback'
   }
   }*/];
  var newUser = new User(userObject);
  newUser.provider = 'local';

  newUser.save(function(err) {
    if (err) {
      return res.json(400, err);
    }

    req.logIn(newUser, function(err) {
      if (err) return next(err);
      var userInfo = newUser.user_info;
      userInfo.clients = newUser.clients;
      return res.json(userInfo);
    });
  });
};

/**
 *  Show profile
 *  returns {username, profile}
 */
exports.show = function (req, res, next) {
  var userId = req.params.userId;

  User.findById(ObjectId(userId), function (err, user) {
    if (err) {
      return next(new Error('Failed to load User'));
    }
    if (user) {
      res.send({username: user.username, profile: user.profile, clients: user.clients });
    } else {
      res.send(404, 'USER_NOT_FOUND')
    }
  });
};

/**
 * Update a user
 */
exports.update = function(req, res) {
  var user = req.user;

  user.save(function(err) {
    if (err) {
      res.json(500, err);
    } else {
      res.json(user);
    }
  });
};

/**
 *  Username exists
 *  returns {exists}
 */
exports.exists = function (req, res, next) {
  var username = req.params.username;
  User.findOne({ username : username }, function (err, user) {
    if (err) {
      return next(new Error('Failed to load User ' + username));
    }

    if(user) {
      res.json({exists: true});
    } else {
      res.json({exists: false});
    }
  });
}
