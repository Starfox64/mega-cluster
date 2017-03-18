'use strict';

const mongoose = require('mongoose');
const db = require('../lib/db');

const FILE_TYPES = ['backup', 'sharing'];

const File = new mongoose.Schema({
	name: {type: String, index: true, required: true},
	hash: {type: String, index: true, required: true},
	password: {type: String, required: true},
	account: {type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
	type: {type: String, lowercase: true, required: true, enum: FILE_TYPES},
	createdAt: {type: Date, required: true, default: Date.now},
});

module.exports = db.model('File', File);
