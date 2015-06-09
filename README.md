# argonaut_client
##Project Argonaut compatible client demo app.

Client configuratin stored in libs/config/index.js file.
Curently in have three entries
 * SMART on FHIR (we have registered application there), require ssh tunnel up and running.
 * DATA in FHIR format provided by DRE (working on localhost, good for demo), no need in tunnel.
 * DATA in FHIR format provided by DRE, require ssh tunnel up and running.

Command to run tunnel:

> ssh -i tools.pem -M -R *:3001:localhost:3001 -R *:3000:localhost:3000 centos@54.200.9.100

You will need tools.pem file for this specific server toolbox.amida-demo.com.

##Setting Up

Requires Node/NPM/Bower

Run: `npm install` and `bower install`

##Starting the client
Go to directory where clent is located and start it by:

> node bin/www

this command will start client on a port 3001.
You can check it by navigating to http://localhost:3001 in your browser.

Start DRE as usual and try to request token from DRE (center screen).

##Notes
* Demo client removes expired tokens from a database automatically.
* Error handling is not 100% bullet proof.