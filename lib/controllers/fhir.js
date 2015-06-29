'use strict';

var request = require('request');
var Promise = require('promise');
var config = require('../config/credentials');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var async = require('async');
var ObjectId = mongoose.Types.ObjectId;
var credentials = require('../config/credentials');

exports.initiate = function (req, res) {
    var user = req.user;
    var client_id = req.body.client_id;
    //res.clearCookie('login_token');
    var i, len = user.clients.length;
    var credentials;
    for (i = 0; i < len; i++) if (client_id === user.clients[i].credentials.client_id) { credentials = user.clients[i].credentials; break; }
    if (!credentials) {
        console.log('Can\'find credentials for client with id = ' + client_id);
        res.status(400).end();
    } else {
        res.redirect(credentials.site + credentials.authorization_path + '?redirect_uri=' + encodeURIComponent(credentials.redirect_uri + '?client_id=' + client_id+'&user='+user._id) + '&response_type=code&client_id=' + client_id);
    }
};

exports.connect = function (req, res) {
    var client_id = req.body.client_id;
    var user = req.body.user;
    //res.clearCookie('login_token');
    var i, len = user.clients.length;
    var credentials;
    for (i = 0; i < len; i++) if (client_id === user.clients[i].credentials.client_id) { credentials = user.clients[i].credentials; break; }
    if (!credentials) {
        console.log('Can\'find credentials for client with id = ' + client_id);
        res.status(400).end();
    } else {
        res.redirect(credentials.site + credentials.authorization_path + '?redirect_uri=' + encodeURIComponent(credentials.redirect_uri + '?client_id=' + client_id+'&user='+user._id) + '&response_type=code&client_id=' + client_id);
    }
};

function data(error, response, body, callback) {

    if (error) {
        return callback(error);
    }

    if (process.env.DEBUG) console.log('fhir client: checking response body', body);

    try {
        body = JSON.parse(body);
    } catch (e) { /* The OAuth2 server does not return a valid JSON'); */ }

    if (response.statusCode >= 400) {
        callback(body || response.statusCode, null);
    } else {
        callback(error, body);
    }
}

var accessToken = function(client_id, authCode, redirectURI) {
    return new Promise(function(resolve, reject) {
        var credentials, i, len = config.clients.length;
        for (i = 0; i < len; i++)
            if (client_id === config.clients[i].credentials.client_id) {
                credentials = config.clients[i].credentials;
                break;
            }

        var path = credentials.site + credentials.token_path;

        request.post({
            url: path,
            auth: {
                user: credentials.client_id,
                pass: credentials.client_secret,
                sendImmediately: true
            },
            form: {
                code: authCode,
                redirect_uri: redirectURI,
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                grant_type: 'authorization_code'
            }
        }, function(err, res, body) {
            data(err, res, body, function(err, body) {
                if (err || (body && body.error)) reject(err || body.error_description);
                else resolve(body);
            });
        });

    });
};

exports.callback = function (req, res) {
    if (req.query.client_id) {
        var client_id = req.query.client_id;
        var code = req.query.code;
        var dreToken = false;
        var smartToken = false;
        var useclient = {};
        async.eachSeries(config.clients,function(client,cb){
            if (client.credentials.client_id === client_id) {
                useclient=client;
                if (client.shortname === 'DRE') {
                    dreToken = true;
                    cb();
                } else {
                    if (client.shortname === 'SMART on FHIR') {
                        smartToken = true;
                        cb();
                    } else {
                        cb();
                    }
                }
            } else {
                cb();
            }
        },function(err){
            accessToken(client_id, code, useclient.credentials.redirect_uri+'?client_id=' + client_id+'&user=' + req.query.user).then(function(body) {
                console.log('body----------------------------------------', body);
                if (body) {
                    //need to store it in the user
                    User.findById(ObjectId(req.query.user), function (err, user) {
                        if (err) {
                            console.log('Failed to load User: '+err);
                        }
                        if (user) {
                            req.logIn(user, function(err) {
                                if (err) return console.log(err);
                                User.findByIdAndUpdate(ObjectId(req.query.user), {token:body, dreToken: dreToken, smartToken: smartToken}, {new: true, upsert: true}, function(err, newuser) {
                                    console.log(JSON.stringify(newuser));
                                    return res.cookie('user', JSON.stringify(newuser.user_info)).redirect('/#/settings');
                                });

                                //return res.cookie('user', JSON.stringify(user.user_info)).redirect('/#/settings');
                            });
                        } else {
                            res.send(404, 'USER_NOT_FOUND')
                        }
                    });
                } else {
                    console.log("no body");
                    res.redirect("/#/settings");
                }
            }).catch(function(error) {
                console.log(error);
            });
        });
    } else {
        res.redirect("/#/settings");
    }
};

var requestPromise = function(client_id, accessToken, path) {
    return new Promise(function(resolve, reject) {
        var credentials, i, len = config.clients.length;
        for (i = 0; i < len; i++)
            if (client_id === config.clients[i].credentials.client_id) {
                credentials = config.clients[i].credentials;
                break;
            }

        var url = (path.indexOf(credentials.api_url) === 0) ? path : (credentials.api_url + path);

        request.get({
            url: url,
            auth: {
                bearer: accessToken
            },
            headers: {
                Accept: 'application/json'
            }
        }, function(err, res, body) {
            //if(err) debug("GET " + url + " Error: " + err);
            //if(body) debug("GET " + url + " Body: " + body);
            if (err) reject(err);
            else resolve(body);
        });

    });
};

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

exports.dreuser = function (req, res) {
    var patient = {};
    var client_id = req.body.client_id;
    var user_id = req.body.user;
    User.findById(ObjectId(user_id), function (err, user) {
        if (err) {
            res.json(patient);
        } else {
            requestPromise(client_id, user.token.access_token, '/Patient').then(function (val) {
                var json = JSON.parse(val);
                patient = json.entry[0];
                res.json(patient);
            }).catch(function (err) {
                console.log("err: "+err);
                patient = {};
                res.json(patient);
            });
        }
    });
};

exports.smartuser = function (req, res) {
    var patient = {};
    var client_id = req.body.client_id;
    var user_id = req.body.user;
    User.findById(ObjectId(user_id), function (err, user) {
        if (err) {
            res.json(patient);
        } else {
            requestPromise(client_id, user.token.access_token, '/Patient').then(function (val) {
                var json = JSON.parse(val);
                patient = json.entry[0];
                res.json(patient);
            }).catch(function (err) {
                console.log("err: "+err);
                patient = {};
                res.json(patient);
            });
        }
    });
};

exports.dremeds = function (req, res) {
    var medications = [];
    var client_id = req.body.client_id;
    var user_id = req.body.user;
    User.findById(ObjectId(user_id), function (err, user) {
        if (err) {
            res.json(patient);
        } else {
            requestPromise(client_id, user.token.access_token, '/MedicationPrescription').then(function (val) {
                var json = JSON.parse(val);
                medications = getMedications(json);
                res.json({meds:medications});
            }).catch(function (err) {
                console.log("err dre: "+err);
                medications = [];
                res.json({meds:medications});
            });
        }
    });
};

exports.smartmeds = function (req, res) {
    var medications = [];
    var client_id = req.body.client_id;
    var user_id = req.body.user;
    User.findById(ObjectId(user_id), function (err, user) {
        if (err) {
            res.json(patient);
        } else {
            requestPromise(client_id, user.token.access_token, '/MedicationPrescription').then(function (val) {
                var json = JSON.parse(val);
                medications = getMedications(json);
                res.json({meds:medications});
            }).catch(function (err) {
                console.log("err: "+err);
                medications = [];
                res.json({meds:medications});
            });
        }
    });
};

exports.revoke = function (req, res) {
    console.log('in revoke');
    var user = req.user;
    User.findByIdAndUpdate(ObjectId(user._id), {token:{}, dreToken: false, smartToken: false}, {new: true, upsert: true}, function(err, newuser) {
        console.log(JSON.stringify(newuser));
        return res.cookie('user', JSON.stringify(newuser.user_info)).redirect('/#/settings');
    });
};

exports.getClients = function (req, res) {
    res.json({clients:config.clients});
};