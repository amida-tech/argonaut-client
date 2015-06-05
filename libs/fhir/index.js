var express = require('express');
var router = express.Router();

var config = require('../config');
var Promise = require('promise');
var extend = require('util')._extend;
var request = require('request');
var debug = require('debug')('fhir');

/**
 * Execute request to a FHIR enabled server
 */
var requestPromise = function(client_id, accessToken, path) {
    return new Promise(function(resolve, reject) {
        var credentials, i, len = config.clients.length;
        for (i = 0; i < len; i++)
            if (client_id === config.clients[i].credentials.client_id) {
                credentials = config.clients[i].credentials;
                break;
            }

        var url = (path.indexOf(credentials.api_url) === 0) ? path : (credentials.api_url + path);

        debug("GET " + url + " /Bearer : " + accessToken);
        request.get({
            url: url,
            auth: {
                bearer: accessToken
            },
            headers: {
                Accept: 'application/json'
            }
        }, function(err, res, body) {
            if(err) debug("GET " + url + " Error: " + err);
            if(body) debug("GET " + url + " Body: " + body);
            if (err) reject(err);
            else resolve(body);
        });

    });
};

var accessTokenPromise = function(cid, authCode, redirectURI) {
    var client_id = cid;
    return new Promise(function(resolve, reject) {
        var credentials, i, len = config.clients.length;
        for (i = 0; i < len; i++)
            if (client_id === config.clients[i].credentials.client_id) {
                credentials = config.clients[i].credentials;
                break;
            }

        var path = credentials.site + credentials.token_path;

        debug("POST " + path + " Code: " + authCode + " redirect_uri: " + redirectURI + " client_id: " + credentials.client_id + " client_secret: " + credentials.client_secret + " grant_type: authorization_code");
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
                if(err) debug("POST " + path + " Error: " + err);
                if(body) debug("POST " + path + " Body: " + body);

                if (err || (body && body.error)) reject(err || body.error_description);
                else resolve(body);
            });
        });

    });
};

// Extract the data from the request response
function data(error, response, body, callback) {

    if (error) {
        return callback(error);
    }

    if (process.env.DEBUG) console.log('fhir client: checking response body', body);

    try {
        body = JSON.parse(body);
    } catch (e) { /* The OAuth2 server does not return a valid JSON'); */ }

    if (response.statusCode >= 400) return callback(body || new errors.HTTPError(response.statusCode), null)
    callback(error, body);
}

module.exports = {
    request: requestPromise,
    accessToken: accessTokenPromise
};