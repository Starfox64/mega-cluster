'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const ACCOUNT_TYPES = ['backup', 'sharing'];

const Account = new mongoose.Schema({
	email: {type: String, index: true, unique: true, required: true},
	password: {type: String, required: true},
	usedStorage: {type: Number, required: true, default: 0},
	type: {type: String, lowercase: true, required: true, enum: ACCOUNT_TYPES},
	createdAt: {type: Date, required: true, default: Date.now},
});

module.exports = db.model('Account', Account);

module.exports.ACCOUNT_TYPES = ACCOUNT_TYPES;
