var express = require('express');
var router = express.Router();
var request = require('request');
var promise = require('promise');

var dal = require('../libs/dal');
var fhir = require('../libs/fhir');
var credentials = require('../libs/credentials');

/**
 * Read patient's data, expect username in query parameters.
 * User record should exists in a database and contains valid access token.
 */      
router.get('/', function(req, res) {
    console.log(req.query);
    if(req.query.token_id) {
        dal.users.find( req.query.token_id, function(err, user) {
            if(err) {
                req.redirect('/');
            } else {
                fhir.request(user.clientId, user.accessToken, "/Patient/1272431").then(function(val) {
                    res.render('fhir', {
                        data: JSON.stringify(val)
                    });
                }).catch(function(err){
                    req.redirect('/');
                });
            }
        });
    } else {
        req.redirect('/');
    }
});

/**
 * Callback used for exchange of access code to access token 
 */
router.get('/callback', function(req, res) {
    if( req.query.client_id) {
        var client_id = req.query.client_id;
        var code =  req.query.code;
        fhir.accessToken( client_id, code, 'http://toolbox.amida-demo.com:3001/fhir/callback?client_id='+client_id).then(function(body) {
            console.log('body----------------------------------------', body);
            if(body) {
                dal.users.save( body.client_id || client_id, body.patient, body.access_token, body.refresh_token, body.expires_in, body.scope, function(err, user) {
                    res.redirect("/");    
                });
            } else {
                res.redirect("/");  
            } 
        }).catch(function(error){
            console.log(error);
        });
    } else {
        res.redirect("/");
    }
});

module.exports = router;