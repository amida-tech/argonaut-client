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
    if(req.query.username) {
        dal.users.find( req.query.username, function(err, user) {
            if(err) {
                req.redirect('/');
            } else {
                fhir.request(user.accessToken, "/fhir/Patient/"+user.username).then(function(val) {
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
    if( req.session.username) {
        fhir.accessToken(req.query.code).then(function(body) {
            console.log( body);
            dal.users.save(req.session.username, body.patient, body.access_token, body.refresh_token, body.expires_in, function(err, user) {
                res.redirect("/");    
            });  
        });
    } else {
        res.redirect("/");
    }
});

module.exports = router;