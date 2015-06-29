'use strict';

angular.module('angularPassportApp')
    .factory('FHIR', function ($resource) {
        return {
            dreuser: $resource('/fhir/dre/user'),
            smartuser: $resource('/fhir/smart/user'),
            dremeds: $resource('/fhir/dre/meds'),
            smartmeds: $resource('/fhir/smart/meds'),
            revokeToken: $resource('/fhir/revoke'),
            connect: $resource('/fhir/connect'),
            getClients: $resource('/fhir/clients')
        };
    });
