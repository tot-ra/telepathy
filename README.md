## Definition
A **contract test** between **consumer** and **provider** (services or libs) is a decentralized loose obligation,
that for every **rule** (recorded from a mock of producer reply in unit test) in consumer, there will be a test in producer.

What this lib does it do:
- helps to record mock into a contract with persisted format (JSON) on every unit test execution
- defines contract as a dependency between services
- helps to validate that contracts on both sides match
- language and framework agnostic

What contract-tests **do not** specify or do:
- what type of a test producer will have (unit or functional), to have integrations more lightweight & not need state management (db, containers), [PACT](https://docs.pact.io/) adds integration tests for producer.
- how strict or good the test is going to be and if its going to use recorded mock payload at all
- contracts are not enforced by centralized authority (broker/notar etc), like [PACT](https://docs.pact.io/) does. So its up to both parties to implement contract consistency validation & implement its content

## Usage

### Recording a rule in consumer unit test
To record a rule, simply replace your mocked provider response with `contractTest.record` with `expect` property containing what you expect from the producer
```
it('should return null if php-app returns null', async () => {
	// Arrange
	const req = {
		services: {
			phpApp: {
				get: (path, params) => {
					// tie mock response to a contract test recorder's expect param
					return contractTest.record({
						className: 'UserRoleDataloader',
						testName: `canReturnNull`,
						describe: expect.getState().currentTestName,
						consumer: 'monograph',
						producer: 'php-app',
						input: { method: 'GET', path, params },
						expect: null
					});
				}
			}
		}
	};

	// Act
	// objectUnderTest will call req.services.phpApp.get('/some/path', params)
	const result = await objectUnderTest(req).userRoles.load([1, 2]);

	// Assert
	assert.deepEqual(result, null);
});
```

Recorded rule is saved into a json file under `/tests/contract/my-producers/php-app.json` as php-app is the producer.

### Implementing a rule in producer side
