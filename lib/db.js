'use strict';

const mongoose = require('mongoose');
const config = require('./config');
mongoose.Promise = Promise;

module.exports = mongoose.createConnection(config.get('mongoUrl'));
