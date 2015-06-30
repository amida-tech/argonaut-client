'use strict';

var path = require('path'),
    auth = require('../config/auth');

module.exports = function(app) {
  // User Routes
  var users = require('../controllers/users');
  app.post('/auth/users', users.create);
  app.get('/auth/users/:userId', users.show);
  app.get('/reset', users.reset);

  // Check if username is available
  // todo: probably should be a query on users
  app.get('/auth/check_username/:username', users.exists);

  // Session Routes
  var session = require('../controllers/session');
  app.get('/auth/session', auth.ensureAuthenticated, session.session);
  app.post('/auth/session', session.login);
  app.del('/auth/session', session.logout);

  // FHIR Routes
  var fhir = require('../controllers/fhir');
  app.post('/fhir', auth.ensureAuthenticated, fhir.initiate);
  app.get('/fhir/callback', fhir.callback);
  app.post('/fhir/dre/user', auth.ensureAuthenticated, fhir.dreuser);
  app.post('/fhir/smart/user', auth.ensureAuthenticated, fhir.smartuser);
  app.post('/fhir/dre/meds', auth.ensureAuthenticated, fhir.dremeds);
  app.post('/fhir/smart/meds', auth.ensureAuthenticated, fhir.smartmeds);
  app.get('/fhir/revoke', auth.ensureAuthenticated, fhir.revoke);
  app.post('/fhir/connect', auth.ensureAuthenticated, fhir.connect);
  app.get('/fhir/clients', auth.ensureAuthenticated, fhir.getClients);


  // Angular Routes
  app.get('/partials/*', function(req, res) {
    var requestedView = path.join('./', req.url);
    res.render(requestedView);
  });

  app.get('/*', function(req, res) {
    if(req.user) {
      res.cookie('user', JSON.stringify(req.user.user_info));
    }

    res.render('index.html');
  });

}