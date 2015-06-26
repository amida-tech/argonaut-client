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

/*
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
*/
router.get('/', function (req, res) {

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
            res.render('index', {
                title: 'Express',
                users: users,
                clients: newClients
            });
        });
    }).catch(function (err) {
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
    }).catch(function (err) {
        res.render('error', {
            message: err,
            error: err
        });
    });
});

router.get('/smart', function (req, res) {
    res.redirect();
});

router.get('/dre', function (req, res) {

    var readUsers = new Promise(function (resolve, reject) {
        dal.users.readAll(function (err, users) {
            if (err) reject(err);
            else resolve(users);
        });
    });

    readUsers.then(function (rawUsers) {
        var useClient = {};
        var medications = [];
        var userExists = false;
        var clients = config.clients;
        async.eachSeries(clients,function(client,cb){
            if (client.name === 'DRE/FHIR (localhost:3000)') {
                useClient = client;
                async.eachSeries(rawUsers, function(user,cb2){
                    if (user.clientId === client.credentials.client_id) {
                        client.user = user;
                        useClient = client;
                        userExists = true;
                        //'/fhir?query=/MedicationPrescription?patient=' + patient.id + '&token_id=' + patient.token_id
                        fhir.request(user.clientId, user.accessToken, '/MedicationPrescription').then(function(val) {
                            var json = JSON.parse(val);
                            medications = getMedications(json);
                            console.log(getMedications);
                            cb2();
                        }).catch(function(err) {
                            medications = [];
                            cb2();
                        });
                    } else {
                        cb2();
                    }
                },function(err) {
                    cb();
                })
            } else {
                cb();
            }
        },function(err) {
            res.render('dre', {
                title: 'Express',
                client: useClient,
                userExists: userExists,
                medications: medications
            });
        });
    }).catch(function (err) {
        res.render('error', {
            message: err,
            error: err
        });
    });
});

router.get('/delete', function(req, res) {
    if (req.query.externalId) {
        dal.users.delete(req.query.externalId, function () {
            res.redirect("/");
        });
    }
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

/**
 * Returns array of Medication Prescription records extracted from FHIR resource
 * @param val - Response of FHIR server (json)
 * @returns {Array} - Medication Prescription records in format { name, status }
 */
var getMedications = function(val) {
    var result = [];
    if (val && val.entry) {
        var i, len = val.entry.length;
        for (i = 0; i < len; i++) {
            var content = val.entry[i].content || val.entry[i].resource;
            if(content && content.resourceType === 'MedicationPrescription') {
                var contained = content.contained;
                if(contained && contained.length >0) {
                    var j, len2 = contained.length;
                    for (j = 0; j < len2; j++) {
                        result.push({
                            name: contained[j].name,
                            status: content.status
                        });
                    }
                }
            }
        }
    }
    return result;
};