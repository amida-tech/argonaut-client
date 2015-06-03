var mongoose = require('mongoose');

var databaseServer = process.env.DB || 'localhost:27017';
var databaseName = process.env.DBname || 'argonaut_client_demo';
var connection = mongoose.createConnection('mongodb://' + databaseServer + '/' + databaseName);
var Schema = mongoose.Schema;  

var userSchema = new Schema({
    clientId: String,
    externalId: String,
	accessToken: String,
	refreshToken: String,
	expirationDate: Date,
    scope: String
});

var UserModel = connection.model('User', userSchema);

/**
 * Expose data access functions for users
 */
var users = (function () {
    return {
        readAll: function( done) {
            UserModel.remove({'expirationDate':{'$lt': new Date()} }).exec();
            UserModel.find(function(err, users) {
                if (err) {
                    return done(err);
                }
                if (users) {
                    //console.log(users);
                    return done(null, users);
                }
                done(null, null);
            });
        },
        
        find: function (token_id, done) {
            UserModel.where({
                _id: token_id
            }).findOne(function (err, user) {
                if (err) {
                    return done(err);
                }
                if (user) {
                    return done(null, user);
                }
                done(null, null);
            });
        },

        save: function (clientId, externalId, accessToken, refreshToken, expire_in, scope, done) {
            var expire = new Date();
            expire.setSeconds( expire.getSeconds()  + parseInt(expire_in));
            var db = new UserModel({
                clientId:clientId,
                externalId: externalId,
                accessToken: accessToken,
                refreshToken: refreshToken,
				expirationDate: expire,
                scope: scope
            });
            console.log("Saving ", db);
            db.save(done);
        },

        delete: function (externalId, done) {
            UserModel.where({
                externalId: externalId
            }).findOneAndRemove(done);
        },
		
		updateToken: function (externalId, accessToken, expirationDate, done) {
            UserModel.update({
                externalId: externalId
            }, {
                $set: {
                    accessToken: accessToken,
                    expirationDate: expirationDate
                }
            }, done);
        }
    };
})();

module.exports = {
	users: users
};
