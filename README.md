# Mega Cluster

[![NPM Version](http://img.shields.io/npm/v/mega-cluster.svg)](https://www.npmjs.org/package/mega-cluster)
[![Node Version](https://img.shields.io/badge/node-v7.7.3-blue.svg)](https://nodejs.org/dist/v7.7.3/)
[![License](https://img.shields.io/npm/l/mega-cluster.svg)](https://github.com/Starfox64/mega-cluster/blob/master/LICENSE)

Mega Cluster is a backup management system for mega.nz

## Installation

	$ npm install mega-cluster -g

## Requirements

- megatools (_apt install megatools_)
- rar (_apt install rar_)
- Running MongoDB (w/ Docker: _docker run -d -p 27017:27017 mongo_)

## Usage

	$ mega-cluster account <Email> <Password>               # Adds a backup account
	$ mega-cluster account -t sharing <Email> <Password>    # Adds a sharing account

	$ mega-cluster upload <File>                # Uploads a file to a backup account
	$ mega-cluster publish <FileHash>           # Transfers the file from a backup to a sharing account

	$ mega-cluster --help                       # Displays all available commands
