## Definition
A consumer-driven **telepathy test** between **consumer** 📺 and **producer** 🎥 (services or libs) is a decentralized loose obligation,
that for every expectation in consumer, there will be a test in producer. 

What this lib does:
- helps to record a mock expectations as a contract into a file on every unit test execution from consumer side
- defines contract as a dependency between services stored in specific, interchangeable format (JSON)
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

## Consumer 📺
### Recording a rule in consumer unit test
Contract rules are stored in json files during unit test execution. To make sure they are always up-to-date, make sure to remove previous contracts when you're running unit tests:
```
"scripts": {
  "test": "rm -rf test/contract/producers/ && jest"
}
```


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
						testName: `canReturnNull`,
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
- `testName` - param used on producer side to find which test corresponds to the rule
- `consumer` & `producer` - service/lib names, used in name of contract files, must match package.json `name` field in case of verification on nodejs side
- `input` - optional param (any type) to explain what gets passed to the producer
- `expect` - response value that is expected to be returned by the producer, given provided input or described usage scenario. Used as a mock value by default in consumer unit-test

## Producer 🎥
- Producer **must** have a copy of the contract in his repo, so for example 
`/test/contract/producers/php-app.json` in monograph = `/test/contract/consumers/monograph.json` in php-app
- Producer **must** have automatic varification mechanism (git hook, CI) that would:
1. compare that contract files match with his consumers 
2. compare that declared rules are implemented in actual unit tets

- Producer **must** implement tests, using info from contract rules like `className` and `testName` as unique identifiers to create tests with same file/method structure
- Test on producer side **may** use `input` and `expect` as data in the test code

### Declaring dependencies & comparing contracts
In your producer service, edit package.json, add array of consumers your service must match as well as
command to compare contracts in both repos:
```json
"scripts": {
	"test:contracts:identical": "node ./node_modules/@pipedrive/telepathy/verifyContracts.js"
},
"telepathy":{
	"consumersSubPath": "test/contract/consumers/",
	"producersSubPath": "test/contract/producers/",
	"consumers": [
		  {
			  "name": "monograph",
			  "repo": "https://github.com/pipedrive/monograph",
			  "branch": "CTL-1545-contracts",
		  }
	  ]
}
```

## Verifying test existance in producer side
Depending on your language or test framework, you may use or implement own mechanism of verification (PRs are welcome)

### Jest
With jest, we integate using unit test reporters during execution. Given jest.config.js, just add telepathy reporter:
```
	reporters: [
		'default',
		'<rootDir>/node_modules/@pipedrive/telepathy/verifyJest.js'
	],
```

Tests must reside in
`<consumersSubPath>/<serviceName>/` folder (configureable in package.json, see above).

Reporter will try to match `testName` from contract rules to a test name that is executed.