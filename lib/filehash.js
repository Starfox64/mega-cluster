'use strict';

const crypto = require('crypto');
const fs = require('fs');

module.exports = (file) => {
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash('sha256');
		let stream = fs.createReadStream(file);

		stream.on('error', (err) => {
			reject(err);
		});

		stream.on('data', (data) => {
			hash.update(data);
		});

		stream.on('end', () => {
			resolve(hash.digest('hex'));
		});
	});
};
