# telepathy
A consumer-driven **telepathy test** between data **consumer** 📺 and **producer** 🎥 (services or libs) is a decentralized ([git](https://git-scm.com/)-based) loose obligation, that for every recorded mock in consumer's unit test, there will be a unit test in producer. 

## Why
- Avoid breaking changes. Contract binds producer to what consumers expect.
- Performance & scalability. Unit tests are much faster than any API or UI tests, so you can cover more cases & share it between parties.
- Maintainance. Unit tests require less infrastructure, you don't need dedicated service to record contracts or spin-up containers.
- Freedom. Contracts are not enforced by centralized authority (broker/notar etc), like [PACT](https://docs.pact.io/) does. Its up to developer to decide how exactly test on producer side will be implemented and how will be mocked. This drives increased code coverage of the producer.

## Features
- helps to record a mock expectations as a contract into a file on every unit test execution from consumer side
- defines contract as a dependency between services stored in specific, interchangeable format (JSON)
- helps to validate that contracts on both sides match
- language and framework agnostic

<img width="1020" alt="Screenshot 2020-12-03 at 01 04 49" src="https://user-images.githubusercontent.com/445122/100942229-a0918f00-3503-11eb-8d36-15c70b0f2dcf.png">

## Roadmap
- add contract verification on consumer side (that producer didn't alter contract)
- add php & composer support
- add mocha support
- add golang support
- generate empty tests from contracts for faster start-up

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
In your producer service, edit package.json, add array of consumers your service must match
```json
"telepathy":{
	"consumersSubPath": "test/contract/consumers/",
	"producersSubPath": "test/contract/producers/",
	"consumers": [
		  {
			  "name": "monograph",
			  "repo": "git@github.com:pipedrive/monograph.git",
			  "branch": "CTL-1545-contracts",
			  "folder": "test/contract/producers/",
		  }
	  ]
}
```

### Comparing contracts
In your producer service, edit package.json and add command that will compare contracts using **git checkout**. 
This makes telepathy decentralized. Note that you must have access to provided dependencies above, when running the command.
Git will checkout specific folder & branch from remote to be efficient.

```json
"scripts": {
	"test:contracts:identical": "node ./node_modules/@pipedrive/telepathy/verifyContracts.js"
},
```

### Verifying test existance in producer side
Depending on your language or test framework, you may use or implement own mechanism of verification (PRs are welcome)

#### Jest
With jest, we integate using unit test reporters during execution. Given `jest.config.js`, just add telepathy reporter:
```
	reporters: [
		'default',
		'<rootDir>/node_modules/@pipedrive/telepathy/verifyJest.js'
	],
```

Tests must reside in
`<consumersSubPath>/<serviceName>/` folder (configureable in package.json, see above).

Reporter will try to match `testName` from contract rules to a test name that is executed.
