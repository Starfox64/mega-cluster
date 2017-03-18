'use strict';

const convict = require('convict');

const config = convict({
	mongoUrl: {
		doc: 'The Mongo connection URL',
		format: String,
		default: 'mongodb://localhost:27017/megacluster',
		env: 'MEGA_CLUSTER_MONGO_URL'
	}
});

config.validate();

module.exports = config;
