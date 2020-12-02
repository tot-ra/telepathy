const telepathy = require('./index');

class TelepathyJestReporter {
	constructor(globalConfig, options) {
		this._globalConfig = globalConfig;
		this._options = options;

		this.contracts = telepathy.loadContractsFromConsumerFolder();
	}

	onTestResult(test, result) {
		const [consumersDir, producersDir] = telepathy.getContractPaths();

		// ignore tests not from contracts
		if (test.path.indexOf(consumersDir) == -1 && test.path.indexOf(producersDir) == -1) {
			return;
		}

		for (const service in this.contracts) {
			const dirMatchesService = test.path.indexOf(service) > -1;
			if (dirMatchesService) {
				for (const test of result.testResults) {
					const testIsFromContract = this.contracts[service][test.title];
					if (testIsFromContract) {
						delete this.contracts[service][test.title];
						if (Object.entries(this.contracts[service]).length === 0) {
							delete this.contracts[service];
						}
					}
				}
			}
		}
	}

	onRunComplete(contexts, results) {
		if (Object.entries(this.contracts).length !== 0) {
			console.error('Missing tests per contract:', this.contracts);
			throw new Error('Contracts have missing tests, please implement & run them');
		}
	}
}

module.exports = TelepathyJestReporter;