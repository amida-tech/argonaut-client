/**
 * Provides pre-configured list of servers and applications registered on them.
 */
 
var clients = [{
        name: 'SMART on FHIR',
        url: 'https://fhir-api.smarthealthit.org',
        auth_url: 'https://authorize.smarthealthit.org',
        logo_url: '',
        credentials: {
            client_id: '277923e5-5258-4070-bce7-67194bc62523',
            client_secret: 'do_Cw29XRO18cLjRPYN-svCOPcspjBxXbLlRvfbNn-UNexm_ig68ABt_gxWYvWAkHWjpuCePMndTXgIdLDtsoA',
            site: 'https://authorize.smarthealthit.org',
            api_url: 'https://fhir-api.smarthealthit.org',
            authorization_path: '/authorize',
            token_path: '/token',
            revocation_path: '/revoke',
            scope: '',
            redirect_uri: 'http://toolbox.amida-demo.com:3001/fhir/callback'
        }
    }, {
        name: 'DRE/FHIR (localhost:3000)',
        url: 'http://localhost:3000/',
        auth_url: 'http://localhost:3000/',
        logo_url: '',
        credentials: {
            client_id: 'argonaut_demo_client_local',
            client_secret: 'have no secrets!',
            site: 'http://localhost:3000/',
            api_url: 'http://localhost:3000/fhir',
            authorization_path: 'oauth2/authorize',
            token_path: 'oauth2/token',
            revocation_path: 'oauth2/revoke',
            scope: '',
            redirect_uri: 'http://localhost:3001/fhir/callback'
        }
    }/*, { //commented out for demo/screenshots
        name: 'DRE/FHIR (toolbox.amida-demo.com:3000)',
        url: 'http://toolbox.amida-demo.com:3000/',
        auth_url: 'http://toolbox.amida-demo.com:3000/',
        logo_url: '',
        credentials: {
            client_id: 'argonaut_demo_client',
            client_secret: 'have no secrets!',
            site: 'http://toolbox.amida-demo.com:3000/',
            api_url: 'http://toolbox.amida-demo.com:3000/fhir',
            authorization_path: 'oauth2/authorize',
            token_path: 'oauth2/token',
            revocation_path: 'oauth2/revoke',
            scope: '',
            redirect_uri: 'http://toolbox.amida-demo.com:3001/fhir/callback'
        }
    }*/];
    
module.exports = {
    //fhir_server_uri: 'https://fhir-dev.healthintersections.com.au/closed'
    //fhir_server_uri: 'https://fhir-api.smarthealthit.org',
    
    findClient: function(client_id) {
            var i, len = clients.length;
    var credentials; 
    for(i=0; i<len;i++) if(client_id === clients[i].credentials.client_id) { credentials =  clients[i].credentials; break;}
        return credentials;
    },
    clients: clients
};