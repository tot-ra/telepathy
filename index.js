/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { cd, exec } = require('shelljs');
const util = require('util');

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

let telepathy = {

	getContractPaths: function () {
		const config = getConfig();
		const rootPath = findProjectRoot()
		const consumersDir = path.join(
			rootPath,
			config.consumersSubPath
		);

		if (!fs.existsSync(consumersDir)) {
			fs.mkdirSync(consumersDir, { recursive: true });
		}
		const producersDir = path.join(
			rootPath,
			config.producersSubPath
		);

		if (!fs.existsSync(producersDir)) {
			fs.mkdirSync(producersDir, { recursive: true });
		}

		return [consumersDir, producersDir]
	},

	verifyContractsMatchConsumers: function () {
		const config = getConfig();
		const [consumersDir, producersDir] = telepathy.getContractPaths();
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

				const remoteContract = require(`${consumersDir}/.tmp/${consumer.folder}${config.name}.json`);
				const localContract = require(`${consumersDir}/${consumer.name}.json`);

				if (Math.abs(parseFloat(remoteContract.meta.version) - parseFloat(localContract.meta.version)) >= 1) {
					console.error("Failed. Local and remote contracts have different protocol major versions. Use same telepathy lib versions");
				}

				if (!util.isDeepStrictEqual(remoteContract.tests, localContract.tests)) {
					console.error("Failed. Local and remote contracts are not the same. Copy remote contract locally & update tests");
				}
				exec('rm -rf .tmp');

				console.log("Success. Local and remote contracts match");
			}
		});
	},

	record: (params) => {
		const { version } = require('./package.json');
		const { name } = getConfig();

		let [contract, contractsFile] = telepathy.loadContract(
			`${params.producer}.json`,
			false
		);

		contract.meta = {
			version,
			consumer: name,
			producer: params.producer,
		}

		delete params.producer;
		contract.tests[params.testName] = params;
		fs.writeFileSync(contractsFile, JSON.stringify(contract, null, 2));

		return params.expect;
	},

	loadContractsFromConsumerFolder: () => {
		const [consumersDir, producersDir] = telepathy.getContractPaths();

		const fs = require('fs');

		const contracts = {};
		fs.readdirSync(consumersDir).forEach(file => {
			if (!fs.statSync(path.join(consumersDir, file)).isDirectory()) {
				const [contract] = telepathy.loadContract(file, true);
				contracts[contract.meta.consumer] = contract.tests;
			}
		});

		return contracts;
	},

	loadContract: (serviceFileName, fromConsumerFolder = true) => {
		const [consumersDir, producersDir] = telepathy.getContractPaths();
		const dir = fromConsumerFolder ? consumersDir : producersDir;

		const contractsFile = path.join(dir, serviceFileName);

		let contract = {
			tests: {}
		};

		if (fs.existsSync(contractsFile)) {
			contract = JSON.parse(fs.readFileSync(contractsFile));
		}

		return [contract, contractsFile];
	}
}

module.exports = telepathy;