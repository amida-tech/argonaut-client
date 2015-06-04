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
/*router.get('/', function(req, res) {
    //console.log(req.query);
    if(req.query.token_id) {
        var token_id = req.query.token_id;
        dal.users.find( token_id, function(err, user) {
            if(err) {
                req.redirect('/');
            } else {
                fhir.request(user.clientId, user.accessToken, "/Patient").then(function(val) {
                    var prev, next, patients;                  
                    var json = JSON.parse(val);
                    //Move some searhh logic here to simplify template logic
                    prev = findLink(json, 'prev', token_id);
                    next = findLink(json, 'next', token_id);
                    patients = getPatients(json, token_id);
                    
                    res.render('fhir', {
                        data: val,
                        prev: prev,
                        next: next,
                        patients: patients
                    });
                    
                }).catch(function(err){
                    req.redirect('/');
                });
            }
        });
    } else {
        req.redirect('/');
    }
});*/

/**
 * Callback used for exchange of access code to access token 
 */
router.get('/callback', function(req, res) {
    if (req.query.client_id) {
        var client_id = req.query.client_id;
        var code = req.query.code;
        fhir.accessToken(client_id, code, 'http://toolbox.amida-demo.com:3001/fhir/callback?client_id=' + client_id).then(function(body) {
            console.log('body----------------------------------------', body);
            if (body) {
                dal.users.save(body.client_id || client_id, body.patient, body.access_token, body.refresh_token, body.expires_in, body.scope, function(err, user) {
                    res.redirect("/");
                });
            } else {
                res.redirect("/");
            }
        }).catch(function(error) {
            console.log(error);
        });
    } else {
        res.redirect("/");
    }
});

router.get('/', function(req, res) {
    if (req.query.token_id && req.query.query) {
        var token_id = req.query.token_id;
        var query = req.query.query;
        dal.users.find(token_id, function(err, user) {
            if (err || !(user)) {
                res.redirect('/');
            } else {
                fhir.request(user.clientId, user.accessToken, query).then(function(val) {
                    var prev, next;
                    var json = JSON.parse(val);
                    //Move some searhh logic here to simplify template logic
                    prev = findLink(json, 'prev', token_id);
                    next = findLink(json, 'next', token_id);


                    renderPatients(res, token_id, val, prev, next, json);

                }).catch(function(err) {
                    res.redirect('/');
                });
            }
        });
    } else {
        res.redirect('/');
    }
});

module.exports = router;

var renderPatients = function(res, token_id, val, prev, next, json) {
    var patients = getPatients(json, token_id);
    var medications = getMedications(json, token_id);

    var model = {
        data: val,
        prev: prev,
        next: next,
        patients: patients,
        medications: medications
    };
    if (json.id) {
        model.id = json.id;
    }
    res.render('fhir', model);

};

var findLink = function(val, rel, token_id) {
    var result;
    if (val && val.link) {
        var i, len = val.link.length;
        for (i = 0; i < len; i++) {
            if (val.link[i].rel === rel) {
                result = 'fhir?query=' + encodeURIComponent(val.link[i].href) + '&token_id=' + token_id;
                break;
            }
        }
    }
    return result;
};

var getPatients = function(val, token_id) {
    var result = [];
    if (val && val.entry) {
        var i, len = val.entry.length;
        for (i = 0; i < len; i++) {
            var name = [];
            var content = val.entry[i].content;
            if(content && content.resourceType === 'Patient') {
            if (content.name && content.name.length > 0) {
                if (content.name[0].family[0]) {
                    name.push(content.name[0].family[0]);
                }
                if (content.name[0].given[0]) {
                    name.push(content.name[0].given[0]);
                }
            }
            var fullName = name.join(" ");
            result.push({
                name: fullName,
                id: content.identifier[0].value,
                token_id: token_id
            });
            }
        }
    }
    return result;
};

var getMedications = function(val, token_id) {
    var result = [];
    if (val && val.entry) {
        var i, len = val.entry.length;
        for (i = 0; i < len; i++) {
            var content = val.entry[i].content;
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