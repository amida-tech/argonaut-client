var express = require('express');
var router = express.Router();

var credentials = require('../credentials');
var Promise = require('promise');
var oauth2 = require('simple-oauth2')(credentials);

/**
 * Execute request to a FHIR enabled server
 */
var requestPromise = function(accessToken, path) {
	return new Promise(function( resolve, reject) {
		oauth2.api("GET", path, {access_token: accessToken}, function(err, body) { if(err) reject(err); else resolve(body);} );	
	} );	
};
var accessTokenPromise = function(authCode) {
	return new Promise(function( resolve, reject) {
		oauth2.authCode.getToken({code:authCode}, function(err, body) { if(err) reject(err); else resolve(body);} );
	} );	
};

module.exports = {
	request: requestPromise,
	accessToken: accessTokenPromise
};