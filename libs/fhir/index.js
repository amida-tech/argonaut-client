var express = require('express');
var router = express.Router();

var config = require('../config');
var Promise = require('promise');
var extend = require('util')._extend;
var request = require('request');
var debug = require('debug')('fhir');

/**
 * Create promise which resolves to result from FHIR server or fails.
 * @param {string} client_id - Client id.
 * @param {string} accessToken - OAuth access token.
 * @param {string} path - credentials.api_url will be prepended if path is relative.
 * @returns {Promise}
 * @function
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
            //if(err) debug("GET " + url + " Error: " + err);
            //if(body) debug("GET " + url + " Body: " + body);
            if (err) reject(err);
            else resolve(body);
        });

    });
};

/**
 * Create promise which resolves to OAuth2.0 access token or fails.
 * @param {string} client_id - Client id.
 * @param {string} authCode - Authorization code.
 * @param {string} redirectURI - redirect URI after the rocess. 
 * @returns {Promise}
 * @function
 */
var accessTokenPromise = function(client_id, authCode, redirectURI) {
    return new Promise(function(resolve, reject) {
        var credentials, i, len = config.clients.length;
        for (i = 0; i < len; i++)
            if (client_id === config.clients[i].credentials.client_id) {
                credentials = config.clients[i].credentials;
                break;
            }

        var path = credentials.site + credentials.token_path;

        //debug("POST " + path + " Code: " + authCode + " redirect_uri: " + redirectURI + " client_id: " + credentials.client_id + " client_secret: " + credentials.client_secret + " grant_type: authorization_code");
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
                //if(err) debug("POST " + path + " Error: " + err);
                //if(body) debug("POST " + path + " Body: " + body);

                if (err || (body && body.error)) reject(err || body.error_description);
                else resolve(body);
            });
        });

    });
};


/**
 * Extract the data from the request response.
 * @param {Request} error - error.
 * @param {Response} response - Express response.
 * @param {string} body - Express response body.
 * @param {done} callback - callback.
 */
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

module.exports = {
    request: requestPromise,
    accessToken: accessTokenPromise
};

/* Global callbacks */
/**
 * @callback done.
 * @param {any} error - any error.
 * @param {string} body - response body.
 */
