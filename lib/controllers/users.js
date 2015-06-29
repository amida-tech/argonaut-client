'use strict';

var mongoose = require('mongoose'),
  User = mongoose.model('User'),
  passport = require('passport'),
  ObjectId = mongoose.Types.ObjectId,
  credentials = require('../config/credentials');

/**
 * Create user
 * requires: {username, password, email}
 * returns: {email, password}
 */
exports.create = function (req, res, next) {
  var userObject = req.body;
  userObject.clients = credentials.clients;
  var newUser = new User(userObject);
  newUser.provider = 'local';

  newUser.save(function(err) {
    if (err) {
      return res.json(400, err);
    }

    req.logIn(newUser, function(err) {
      if (err) return next(err);
      return res.json(newUser.user_info);
    });
  });
};

exports.reset = function (req, res) {
  User.remove({}, function(err) {
    console.log('collection removed')
    var user1 = {
      email: "isabella@amida-tech.com",
      username: "Isabella Jones",
      password: "testtest",
      clients: credentials.clients
    };
    var user2 = {
      email: "daniel@amida-tech.com",
      username: "Daniel X. Adams",
      password: "testtest",
      clients: credentials.clients
    };
    var newUser1 = new User(user1);
    newUser1.provider = 'local';
    var newUser2 = new User(user2);
    newUser2.provider = 'local';
    var user3 = {
      email: "isabella@amida-demo.com",
      username: "Isabella Jones",
      password: "testtest",
      clients: credentials.clients
    };
    var user4 = {
      email: "daniel@amida-demo.com",
      username: "Daniel X. Adams",
      password: "testtest",
      clients: credentials.clients
    };
    var newUser3 = new User(user3);
    newUser3.provider = 'local';
    var newUser4 = new User(user4);
    newUser4.provider = 'local';

    newUser1.save(function(err) {
      if (err) {
        console.log(err);
      }
      newUser2.save(function(err2) {
        if (err2) {
          console.log(err2);
        }
        newUser3.save(function(err3) {
          if (err3) {
            console.log(err3);
          }
          newUser4.save(function(err4){
            if (err4) {
              console.log(err4);
            }
            res.redirect('/');
          });
        });
      });
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
