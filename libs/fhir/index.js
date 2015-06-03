var express = require('express');
var router = express.Router();

var config = require('../config');
var Promise = require('promise');
var extend = require('util')._extend;
var request = require('request');

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

        //var oauth2 = require('simple-oauth2')(temp); // Override default since we have 2 server setup here - one for oauth and another for data
        /*api("GET", path, {
            access_token: accessToken,
            headers: {
                Accept: 'application/json'
            },
            qs: {
                format: 'json'
            }
        }, function(err, body) {
            //console.log(err, body);
            if (err) reject(err);
            else resolve(body);
        });*/
        request.get({url:(credentials.api_url + path), 
        auth:{
          bearer: accessToken
        },
        headers: {
          Accept: 'application/json'
        }
        }, function(err, res, body) {
            console.log("request --------------------", err);
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

        //credentials.clientID = credentials.client_id;
        //credentials.clientSecret = credentials.client_secret;
        //credentials.authorizationPath = credentials.authorization_path;
        //credentials.tokenPath = credentials.token_path;

        //var oauth2 = require('simple-oauth2')(credentials);

        //oauth2.authCode.getToken({code:authCode, redirect_uri: redirectURI}, function(err, body) { 
        //console.log(err, body);
        //	if(err) reject(err); else resolve(body);} );
        var path = credentials.site + credentials.token_path;

        request.post({
            url: path,
            //headers: {
            //    Accept: 'application/json'
            //},
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
                if(err || (body && body.error)) reject(err || body.error_description); else resolve(body);
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

    try      { body = JSON.parse(body); }
    catch(e) { /* The OAuth2 server does not return a valid JSON'); */ }

    if (response.statusCode >= 400) return callback(body || new errors.HTTPError(response.statusCode), null)
    callback(error, body);
  }

module.exports = {
    request: requestPromise,
    accessToken: accessTokenPromise
};

