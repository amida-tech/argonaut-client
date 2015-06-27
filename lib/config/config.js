module.exports = {
	port: process.env.PORT || 3001,
    db: process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/argonaut-client'
}