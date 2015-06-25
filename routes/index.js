var express = require('express');
var router = express.Router();

var dal = require('../libs/dal');
var fhir = require('../libs/fhir');
var config = require('../libs/config');
var Promise = require('promise');
var async = require('async');

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

router.get('/settings', function (req, res) {

    var readUsers = new Promise(function (resolve, reject) {
        dal.users.readAll(function (err, users) {
            if (err) reject(err);
            else resolve(users);
        });
    });

    readUsers.then(function (rawUsers) {
        var users = {};
        var newClients = [];
        var clients = config.clients;
        async.eachSeries(clients,function(client,cb){
            client.userExists = false;
            async.eachSeries(rawUsers, function(user,cb2){
                if (!client.userExists) {
                    if (user.clientId === client.credentials.client_id) {
                        client.user = user;
                        client.userExists = true;
                        fhir.request(user.clientId, user.accessToken, '/Patient').then(function(val) {
                            var json = JSON.parse(val);
                            client.userInfo = json.entry;
                            cb2();
                        }).catch(function(err) {
                            client.userInfo = {};
                            cb2();
                        });
                    } else {
                        cb2();
                    }
                } else {
                    cb2();
                }
            },function(err) {
                newClients.push(client);
                cb();
            })
        },function(err) {
            console.log("new clients: "+JSON.stringify(newClients,null,4));
            res.render('settings', {
                title: 'Express',
                users: users,
                clients: newClients
            });
        });
        /*
        for (var i = 0; i <= config.clients.length; i++) {
            if (i === config.clients.length) {
                res.render('settings', {
                    title: 'Express',
                    users: users,
                    clients: clients
                });
            } else {
                clients[i].userExists = false;
                for (var j = 0; j < rawUsers.length; j++) {
                    if (!clients[i].userExists) {
                        if (rawUsers[j].clientId === config.clients[i].credentials.client_id) {
                            clients[i].user = rawUsers[j];
                            clients[i].userExists = true;
                            fhir.request(rawUsers[j].clientId, rawUsers[j].accessToken, '/Patient').then(function(val) {
                                var json = JSON.parse(val);

                                console.log(JSON.stringify(json.entry));

                                clients[i].user.info = json.entry;
                            }).catch(function(err) {
                                clients[i].user.info = {};
                            });
                        }
                    }
                }
            }
        }
        */
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