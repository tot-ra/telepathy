/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { cd, exec } = require('shelljs');

function getConfig() {
	const relPath = path.join(findProjectRoot(), 'package.json');
	let defaultConfig = {
		consumersSubPath: ['test', 'contract', 'consumers'],
		producersSubPath: ['test', 'contract', 'producers']
	};

	if (fs.existsSync(relPath)) {
		config = require(relPath).telepathy || {};
		config.name = require(relPath).name;
	}

	config = Object.assign({}, defaultConfig, config);

	return config;
}

function findProjectRoot(start) {
	start = start || __dirname;
	var position = start.indexOf('node_modules');
	var root = start.slice(0, position === -1 ? undefined : position - path.sep.length);

	if (root === path.resolve(root, '..')) {
		return null;
	}

	while (!fs.existsSync(path.join(root, 'package.json'))) {
		root = findProjectRoot(path.dirname(root));
	}

	return root;
};

function getContractPaths() {
	const config = getConfig();
	const rootPath = findProjectRoot()
	const consumersDir = path.join(
		rootPath,
		...config.consumersSubPath
	);

	if (!fs.existsSync(consumersDir)) {
		fs.mkdirSync(consumersDir, { recursive: true });
	}
	const producersDir = path.join(
		rootPath,
		...config.consumersSubPath
	);

	if (!fs.existsSync(producersDir)) {
		fs.mkdirSync(producersDir, { recursive: true });
	}

	return [consumersDir, producersDir]
}

let telepathy = {
	verifyContractsMatchConsumers: function () {
		const config = getConfig();
		const [consumersDir, producersDir] = getContractPaths();
		cd(consumersDir);

		config.consumers.map((consumer) => {
			console.log("Checking declared consumer", consumer);
			if (!fs.existsSync(`${consumer.name}.json`)) {
				console.error("Consumer is defined in package.json, but local contract is missing. Copy it manually and write unit tests!");
			} else {
				exec('rm -rf .tmp');
				exec('git init .tmp');
				cd('.tmp');

				exec(`git remote add origin ${consumer.repo}`);

				// download only specific folder where consumer's contract gets recorded
				exec(`git config core.sparsecheckout true`);
				exec(`echo "${consumer.folder}*" >> .git/info/sparse-checkout`);
				exec(`git pull --depth=1 origin ${consumer.branch} --no-rebase`);
				cd(`..`);

				console.log("Comparing local and remote contracts with diff tool..");
				exec(`diff .tmp/${consumer.folder}${config.name}.json ${consumer.name}.json -w -E`)
				exec('rm -rf .tmp');
			}
		});
	},

	record: (params) => {
		let [tests, contractsFile] = telepathy.load(params.producer, params.consumer);

		tests.push(params);
		fs.writeFileSync(contractsFile, JSON.stringify(tests, null, 2));

		return params.expect;
	},

	load: (producer) => {
		const [consumersDir] = getContractPaths();
		ensureFolderExists(consumersDir);

		const contractsFile = path.join(consumersDir, `${producer}.json`);

		let tests = [];

		if (fs.existsSync(contractsFile)) {
			tests = JSON.parse(fs.readFileSync(contractsFile));
		}

		return [tests, contractsFile];
	}
}

module.exports = telepathy;