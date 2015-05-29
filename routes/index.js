var express = require('express');
var router = express.Router();

var dal = require('../libs/dal');
var fhir = require('../libs/fhir');
var credentials = require('../libs/credentials');
var Promise = require('promise');

/* GET home page. */
/**
 * Simply render content of users table.
 */
router.get('/', function(req, res) {

    var readUsers = new Promise(function(resolve, reject) {
        dal.users.readAll(function(err, users) {
            if (err) reject(err);
            else resolve(users);
        });
    });

    readUsers.then(function(users) {
        //console.log("Read users success", users);
        res.render('index', {
            title: 'Express',
            users: users
        });
    }).catch(function(err) {
        //console.log("Read users fails", err);
        res.render('index', {
            title: 'Express'
        });
    });

});

/**
 * Access username and trying to authorize with DRE
 */
router.post('/', function(req, res) {
    req.session.username = req.body.username;
    res.clearCookie('login_token');
    res.redirect(credentials.site + credentials.authorizationPath + '?redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Ffhir%2Fcallback&response_type=code&client_id=argonaut_demo_client');
});

module.exports = router;