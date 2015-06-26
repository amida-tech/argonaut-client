var express = require('express');
var router = express.Router();
var request = require('request');
var promise = require('promise');

var dal = require('../libs/dal');
var fhir = require('../libs/fhir');
var credentials = require('../libs/credentials');

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
                    res.redirect("/dre");
                });
            } else {
                res.redirect("/settings");
            }
        }).catch(function(error) {
            console.log(error);
        });
    } else {
        res.redirect("/settings");
    }
});

/**
 * Read patient's data, expect username in query parameters.
 * User record should exists in a database and contains valid access token.
 */
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

                    render(res, token_id, val, prev, next, json);

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

/**
 * Render Patients or Medical Prescriptions
 * @param {response} res - Express response
 * @param {string} token_id - Token id
 * @param {string} val - Server response (unparsed)
 * @param {string|undefined} prev - link to a previous set of resources
 * @param {string|undefined} next - link to a next set of resources
 * @param {object} jason - Server response (parsed)
 */
var render = function(res, token_id, val, prev, next, json) {
    var patients = getPatients(json, token_id);
    var medications = getMedications(json, token_id);

    console.log(medications);

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

/**
 * Find a link (if any) with given relation ('prev', 'next',...)
 * @param val - Response of FHIR server (json)
 * @param {string} rel - Link relation
 * @param {stirng} token_id - Token id
 * @returns {string|undefined} - Partial URL 
 */
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

/**
 * Returns array of patient records extracted from FHIR resource
 * @param val - Response of FHIR server (json)
 * @param {stirng} token_id - Token id
 * @returns {Array} - Patient records in format { FullName, Id, Token_id }
 */
var getPatients = function(val, token_id) {
    var result = [];
    if (val && val.entry) {
        var i, len = val.entry.length;
        for (i = 0; i < len; i++) {
            var name = [];
            var family = "";
            var given = "";
            var gender = "";
            var birthdate = "";
            var content = val.entry[i].content || val.entry[i].resource;
            if(content && content.resourceType === 'Patient') {
            if (content.name && content.name.length > 0) {
                if (content.name[0].given[0]) {
                    name.push(content.name[0].given[0]);
                    given = content.name[0].given[0];
                }
                if (content.name[0].family[0]) {
                    name.push(content.name[0].family[0]);
                    family = content.name[0].family[0];
                }
                if (content.gender) {
                    gender = content.gender;
                }
                if (content.birthDate) {
                    birthdate = content.birthDate;
                }
            }
            var fullName = name.join(" ");
            result.push({
                full_name: fullName,
                name: {
                    family: family,
                    given: given
                },
                birthdate: birthdate,
                gender: gender,
                id: (content.identifier && content.identifier.length>0)?content.identifier[0].value:content.id,
                token_id: token_id
            });
            }
        }
    }
    return result;
};

/**
 * Returns array of Medication Prescription records extracted from FHIR resource
 * @param val - Response of FHIR server (json)
 * @param {stirng} token_id - Token id
 * @returns {Array} - Medication Prescription records in format { name, status }
 */
var getMedications = function(val, token_id) {
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