'use strict';

const shellescape = require('shell-escape');
const exec = require('child_process').exec;
const uid = require('uid-safe');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.rar = (file, password) => {
	return new Promise((resolve, reject) => {
		const output = path.join(os.tmpdir(), 'megacluster_' + uid.sync(8) + '.rar');
		exec(shellescape(['rar', 'a', '-ep', `-hp${password}`, output, file]), (err) => {
			if (err) return reject(err);
			resolve(output);
		});
	});
};

exports.unrar = (file, password) => {
	return new Promise((resolve, reject) => {
		const output = path.join(os.tmpdir(), 'megacluster_' + uid.sync(8));
		fs.mkdir(output, (err) => {
			if (err) return reject(err);

			exec(shellescape(['rar', 'x', `-p${password}`, file, output]), (err) => {
				if (err) return reject(err);
				resolve(output);
			});
		});
	});
};
