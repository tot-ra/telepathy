/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const recorder = {
	load: (producer) => {
		const dir = path.join(__dirname, 'my-producers');

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		const contractsFile = path.join(dir, `${producer}.json`);

		let tests = [];

		if (fs.existsSync(contractsFile)) {
			tests = JSON.parse(fs.readFileSync(contractsFile));
		}

		return [tests, contractsFile];
	},

	record: (params) => {
		const [tests, contractsFile] = recorder.load(params.producer, params.consumer);

		tests.push(params);
		fs.writeFileSync(contractsFile, JSON.stringify(tests, null, 2));

		return params.expect;
	}
};

module.exports = recorder;
