# argonaut_client
##Project Argonaut compatible client demo app.

Client configuratin stored in libs/config/index.js file.
Curently in have three entries
 * SMART on FHIR (we have registered application there), require ssh tunnel up and running.
 * DATA in FHIR format provided by DRE (working on localhost, good for demo)

##Setting Up

Requires Node/NPM/Bower/MongoDB

Run: `npm install` and `bower install`

##Starting the client
Go to the project folder and start it by:

> node server

this command will start client on a port 3001.
You can check it by navigating to http://localhost:3001 in your browser.

Register a User and Connect to DRE or SMART

##Customization
For deployment, customize `lib/config/credentials.js` with the clients you would like to connect to.  In particular, replace the DRE client localhost with the location of your DRE instance.

##Notes
* Demo client removes expired tokens from a database automatically.
* Error handling is not 100% bullet proof.