#!/usr/bin/env node

const commander = require('commander');
const filehash = require('./lib/filehash');
const rar = require('./lib/rar');
const uid = require('uid-safe');
const Table = require('cli-table');
const rmrf = require('rimraf');
const path = require('path');
const fs = require('fs');
const package = require('./package.json');

const mega = require('./lib/mega');

const db = require('./lib/db');
const Account = require('./models/account');
const File = require('./models/file');

const MAX_STORAGE = 53000000000; // ~50GB

commander
	.version(package.version)
	.command('upload <file>')
	.description('Uploads a new file to the first available backup account')
	.action(async (file) => {
		const password = uid.sync(32);

		try {
			var hash = await filehash(file);
		} catch (e) {
			console.error('Failed to compute file hash!');
			console.error(e);
			process.exit(1);
		}

		console.log(`File hash is: ${hash}`);

		if (await File.findOne({hash, type: 'backup'})) {
			console.error('This file is already on a backup account!');
			process.exit(1);
		}

		console.log(`Adding ${file} to passworded rar archive (PASSWD: ${password})...`);

		try {
			var rarFile = await rar.rar(file, password);
		} catch (e) {
			console.error('Failed to rar archive!');
			console.error(e);
			process.exit(1);
		}

		const size = fs.statSync(rarFile).size;

		const availableAccount = await Account.findOne({type: 'backup', usedStorage: {$lt: MAX_STORAGE - size}});

		if (!availableAccount) {
			fs.unlinkSync(rarFile);
			console.error('Could not find a backup account with enough space. Please add a new backup account.');
			process.exit(1);
		}

		console.log(`Uploading to mega (${availableAccount.email})...`);
		try {
			await mega.upload(availableAccount.email, availableAccount.password, rarFile, hash + '.rar');
		} catch (e) {
			fs.unlinkSync(rarFile);
			console.error('Could not upload file to mega!');
			console.error(e);
			process.exit(1);
		}

		console.log('File uploaded to mega!');

		await File.create({
			name: path.basename(file),
			hash,
			password,
			account: availableAccount,
			type: 'backup'
		});

		availableAccount.usedStorage += size;
		await availableAccount.save();

		fs.unlinkSync(rarFile);
		db.close();
	});

commander.command('search [regex]')
	.description('Looks for files matching the regex')
	.action(async (regex) => {
		regex = regex || '.';
		let results = await File.find({name: new RegExp(regex)}).populate('account');

		let tbl = new Table({head: ['Hash', 'Type', 'Account', 'Name', 'Password']});

		console.log(results.length + ' result(s).');

		for (let result of results) {
			tbl.push([result.hash, result.type, result.account.email, result.name, result.password]);
		}

		console.log(tbl.toString());

		db.close();
	});

commander
	.command('publish <hash>')
	.description('Publishes a file from a backup account to the first available sharing account')
	.action(async (hash) => {
		if (await File.findOne({hash, type: 'sharing'})) {
			console.error('This file is already on a sharing account!');
			process.exit(1);
		}

		let file = await File.findOne({hash, type: 'backup'}).populate('account');

		if (!file) {
			console.error('Hash not found on any backup accounts!');
			process.exit(1);
		}

		console.log(`Downloading from backup account ${file.account.email}...`);

		try {
			var rarFile = await mega.download(file.account.email, file.account.password, hash);
		} catch (e) {
			console.error('Could not download file from backup account!');
			console.error(e);
			process.exit(1);
		}

		console.log('Extracting file...');

		try {
			var dir = await rar.unrar(rarFile, file.password);
		} catch (e) {
			console.error('Could not extract file!');
			console.error(e);
			process.exit(1);
		}

		fs.unlinkSync(rarFile);

		const filePath = path.join(dir, file.name);
		const password = uid.sync(32);

		console.log(`Creating new passworded rar archive (PASSWD: ${password})...`);

		try {
			rarFile = await rar.rar(filePath, password);
		} catch (e) {
			console.error('Failed to rar archive!');
			console.error(e);
			process.exit(1);
		}

		rmrf.sync(dir);

		const size = fs.statSync(rarFile).size;
		const availableAccount = await Account.findOne({type: 'sharing', usedStorage: {$lt: MAX_STORAGE - size}});

		if (!availableAccount) {
			fs.unlinkSync(rarFile);
			console.error('Could not find a sharing account with enough space. Please add a new sharing account.');
			process.exit(1);
		}

		console.log(`Uploading to mega (${availableAccount.email})...`);
		try {
			await mega.upload(availableAccount.email, availableAccount.password, rarFile, hash + '.rar');
		} catch (e) {
			fs.unlinkSync(rarFile);
			console.error('Could not upload file to mega!');
			console.error(e);
			process.exit(1);
		}

		console.log('File uploaded to mega!');

		await File.create({
			name: file.name,
			hash,
			password,
			account: availableAccount,
			type: 'sharing'
		});

		availableAccount.usedStorage += size;
		await availableAccount.save();

		try {
			var fileUrl = await mega.getLink(availableAccount.email, availableAccount.password, hash);
			console.log('You can now download this file using the following URL: ' + fileUrl);
		} catch (e) {
			console.error('Could not retreive link.');
			console.error(e);
		}

		fs.unlinkSync(rarFile);
		db.close();
	});

commander.command('account <email> <password>')
	.description('Adds a new account to the database')
	.option('-t, --type [type]', 'The account type (backup or sharing) [backup]', 'backup')
	.action(async (email, password, options) => {
		if (!Account.ACCOUNT_TYPES.includes(options.type)) {
			console.error('--type should either be backup or sharing');
			process.exit(1);
		}

		try {
			var usedStorage = await mega.getUsedStorage(email, password);
		} catch (e) {
			console.error('Could not add account!');
			console.error(e);
			process.exit(1);
		}

		await Account.create({
			email,
			password,
			usedStorage,
			type: options.type
		});

		console.log(`Added ${email} as a ${options.type} account.`);

		db.close();
	});

commander.command('refresh [email]')
	.description('Updates used torage of all accounts or just a single one')
	.action(async (email) => {
		let accounts;
		if (email) {
			accounts = [await Account.findOne({email})];
		} else {
			accounts = await Account.find();
		}

		for (let account of accounts) {
			if (!account) continue;

			try {
				var usedStorage = await mega.getUsedStorage(account.email, account.password);
			} catch (e) {
				console.error(`Could not refresh ${account.email}!`);
			}

			account.usedStorage = usedStorage;
			await account.save();

			console.log(`Refreshed ${account.email}`);
		}

		db.close();
	});

commander.command('*')
	.description('output usage information')
	.action(() => {
		commander.help();
	});

// Treats unhandled errors in async code as regular errors.
process.on('unhandledRejection', (err) => {
	console.error(err);
	process.exit(1);
});

commander.parse(process.argv);

if (!commander.args.length) commander.help();
