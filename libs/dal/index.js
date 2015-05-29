var mongoose = require('mongoose');

var databaseServer = process.env.DB || 'localhost:27017';
var databaseName = process.env.DBname || 'argonaut_client_demo';
var connection = mongoose.createConnection('mongodb://' + databaseServer + '/' + databaseName);
var Schema = mongoose.Schema;  

var userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    externalId: String,
	accessToken: String,
	refreshToken: String,
	expirationDate: Date
});

var UserModel = connection.model('User', userSchema);

/**
 * Expose data access functions for users
 */
var users = (function () {
    return {
        readAll: function( done) {
            UserModel.find(function(err, users) {
                if (err) {
                    return done(err);
                }
                if (users) {
                    return done(null, users);
                }
                done(null, null);
            });
        },
        
        find: function (username, done) {
            UserModel.where({
                username: username
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

        save: function (username, externalId, accessToken, refreshToken, expirationDate, done) {
            var db = new UserModel({
                username: username,
                externalId: externalId,
                accessToken: accessToken,
                refreshToken: refreshToken,
				expirationDate: expirationDate
            });
            console.log("Saving ", db);
            db.save(done);
        },

        delete: function (username, done) {
            UserModel.where({
                username: username
            }).findOneAndRemove(done);
        },
		
		updateToken: function (username, accessToken, expirationDate, done) {
            UserModel.update({
                username: username
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
