'use strict';

const shellescape = require('shell-escape');
const exec = require('child_process').exec;
const uid = require('uid-safe');
const path = require('path');
const os = require('os');

exports.getUsedStorage = (email, password) => {
	return new Promise((resolve, reject) => {
		exec(shellescape(['megadf', '--used', '-u', email, '-p', password]), (err, stdout, stderr) => {
			if (err) return reject(err);

			const usedStorage = Number(stdout);

			if (isNaN(usedStorage)) return reject(new Error(stderr));

			resolve(usedStorage);
		});
	});
};

exports.upload = (email, password, file, remoteFilename) => {
	return new Promise((resolve, reject) => {
		exec(shellescape(['megaput', '-u', email, '-p', password, `--path=/Root/${remoteFilename}`, file]), (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
};

exports.rm = (email, password, remoteFilename) => {
	return new Promise((resolve, reject) => {
		exec(shellescape(['megarm', '-u', email, '-p', password, `/Root/${remoteFilename}`]), (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
};

exports.download = (email, password, hash) => {
	return new Promise((resolve, reject) => {
		const output = path.join(os.tmpdir(), 'megacluster_' + uid.sync(8) + '_' + hash + '.rar');
		exec(shellescape(['megaget', '-u', email, '-p', password, `--path=${output}`, `/Root/${hash}.rar`]), (err) => {
			if (err) return reject(err);
			resolve(output);
		});
	});
};

exports.getLink = (email, password, hash) => {
	return new Promise((resolve, reject) => {
		exec(shellescape(['megals', '--reload', '-e', '-u', email, '-p', password]), (err, stdout) => {
			if (err) return reject(err);
			let regex = new RegExp(`^\\s*(https:\/\/\\S+)\\s+(\/Root\/${hash}\.rar)$`, 'm');
			let result = regex.exec(stdout);

			if (!result) return reject(new Error('Link not found'));

			resolve(result[1]);
		});
	});
};
