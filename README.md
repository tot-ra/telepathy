## Definition
A **contract test** between **consumer** and **provider** (services or libs) is a decentralized loose obligation,
that for every **recorded mock** of producer reply in consumer, there will be a test.

What it does do:
- declares dependencies between services
- helps to record mock into a contract with persisted format (JSON)
- helps to validate that contracts on both sides match

What contract-tests **do not** specify or do:
- what type of a test producer will have (unit or functional), to have integrations more lightweight & not need state management (db, containers), [PACT](https://docs.pact.io/) adds integration tests for producer.
- how strict or good the test is going to be and if its going to use recorded mock payload at all
- contracts are not enforced by centralized authority (broker/notar etc), like [PACT](https://docs.pact.io/) does. So its up to both parties to implement contract consistency validation & implement its content
