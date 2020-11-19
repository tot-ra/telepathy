## Definition
A consumer-driven **telepathy test** between **consumer** 🧑‍🚀 and **producer** 🚀 (services or libs) is a decentralized loose obligation,
that for every expectation in consumer 🧑‍🚀 (recorded rule from a mock of producer's reply in unit test), there will be a test in producer 🚀.

What this lib does:
- helps to record mock into a contract with persisted format (JSON) on every unit test execution
- defines contract as a dependency between services stored in specific format
- helps to validate that contracts on both sides match
- language and framework agnostic

What contract-tests **do not** specify or do:
- what type of a test producer will have (unit or functional), to have integrations more lightweight & not need state management (db, containers), [PACT](https://docs.pact.io/) adds integration tests for producer.
- how strict or good the test is going to be and if its going to use recorded mock payload at all
- contracts are not enforced by centralized authority (broker/notar etc), like [PACT](https://docs.pact.io/) does. So its up to both parties to implement contract consistency validation & implement its content

## Usage

```
npm install @pipedrive/telepathy --save-dev
```

## Consumer 🧑‍🚀
### Recording a rule in consumer unit test
To record a rule, simply replace your mocked provider response with `telepathy.record` with `expect` property containing what you expect from the producer
```
const telepathy = require('@pipedrive/telepathy');

it('should return null if php-app returns null', async () => {
	// Arrange
	const req = {
		services: {
			phpApp: {
				get: (path, params) => {
					// tie mock response to a contract test recorder's expect param
					return telepathy.record({
						className: 'UserRoleDataloader',
						testName: `canReturnNull`,
						description: expect.getState().currentTestName,
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

Recorded rule is saved into a json file under `/test/contract/producers/php-app.json` as php-app is the producer.


## Rule Format
- `className` & `testName` - params used on producer side to find which test corresponds to the rule
- `consumer` & `producer` - service/lib names, used in name of contract files, must match package.json `name` field in case of verification on nodejs side
- `description` - optional. Helpful text to explain use-case of what is expected in human-readable form
- `input` - optional param (any type) to explain what gets passed to the producer
- `expect` - response value that is expected to be returned by the producer, given provided input or described usage scenario. Used as a mock value by default in consumer unit-test

## Producer 🚀
- Producer **must** have a copy of the contract in his repo, for example in `/test/contract/consumers/monograph.json`
- Producer **must** have a git hook to compare contract files with his consumers that would prevent development if contracts are out of sync
- Producer **must** implement tests, using info from contract rules like `className` and `testName` as unique identifiers to create tests with same file/method structure
- Test on producer side **may** use `input` and `expect` as data in the test code

### Declaring dependencies
In your producer service, edit package.json, add array of consumers your service must match as well as
command to compare contracts in both repos:
```json
"scripts": {
	"test-consumers": "node ./node_modules/@pipedrive/telepathy/verifyContracts.js"
},
"telepathy":{
	"consumers": [
		  {
			  "name": "monograph",
			  "repo": "https://github.com/pipedrive/monograph",
			  "branch": "CTL-1545-contracts",
			  "folder": "test/contract/producers/"
		  }
	  ]
}
```

