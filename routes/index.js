var express = require('express');
var router = express.Router();

var dal = require('../libs/dal');
var fhir = require('../libs/fhir');
var config = require('../libs/config');
var Promise = require('promise');

/* GET home page. */
/**
 * Simply render content of users table.
 */
router.get('/', function (req, res) {

    var readUsers = new Promise(function (resolve, reject) {
        dal.users.readAll(function (err, users) {
            if (err) reject(err);
            else resolve(users);
        });
    });

    readUsers.then(function (users) {
        //console.log("Read users success", users);
        //console.log(config.clients);
        res.render('index', {
            title: 'Express',
            users: users,
            clients: config.clients
        });
    }).catch(function (err) {
        //console.log("Read users fails", err);
        res.render('error', {
            message: err,
            error: err
        });
    });

});

/**
 * Access username and trying to authorize with DRE
 */
router.post('/', function (req, res) {
    var client_id = req.body.client_id;
    res.clearCookie('login_token');
    var i, len = config.clients.length;
    var credentials;
    for (i = 0; i < len; i++) if (client_id === config.clients[i].credentials.client_id) { credentials = config.clients[i].credentials; break; }
    if (!credentials) {
        res.render('error', {
            message: 'Can\'find credentials for client with id = ' + client_id,
            error: {}
        });
    } else {
        res.redirect(credentials.site + credentials.authorization_path + '?redirect_uri=' + encodeURIComponent(credentials.redirect_uri + '?client_id=' + client_id) + '&response_type=code&client_id=' + client_id);
    }
});

module.exports = router;