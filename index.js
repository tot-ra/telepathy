/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function getConfig() {
	const relPath = path.join(findProjectRoot(), 'package.json');
	let defaultConfig = {
		subPath: ['test', 'contract', 'my-producers']
	};

	if (fs.existsSync(relPath)) {
		config = require(relPath).telepathy;
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
	verify: function () {
		return true
	},

	record: (params) => {
		let [tests, contractsFile] = telepathy.load(params.producer, params.consumer);

		tests.push(params);
		fs.writeFileSync(contractsFile, JSON.stringify(tests, null, 2));

		return params.expect;
	},

	load: (producer) => {
		const rootPath = findProjectRoot()
		const config = getConfig();
		const subPath = config.subPath;
		const dir = path.join(
			rootPath,
			...subPath
		);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		const contractsFile = path.join(dir, `${producer}.json`);

		let tests = [];

		if (fs.existsSync(contractsFile)) {
			tests = JSON.parse(fs.readFileSync(contractsFile));
		}

		return [tests, contractsFile];
	}
}

module.exports = telepathy;