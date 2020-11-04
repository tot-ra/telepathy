## Definition
A **contract test** between **consumer** and **provider** (services or libs) is a decentralized loose obligation,
that for every **recorded mock** of producer reply in consumer, there will be a test.

Contract **does not** explicitly specify:
- what type of a test producer will have (unit or functional)
- how strict or good the test is going to be and if its going to use recorded mock payload at all
- contracts are not enforced by centralized authority (broker/notar etc), its up to both parties to implement contract consistency validation & implement its content

What it does do:
- declares dependencies between services
- helps to record mock into a contract with persisted format (JSON)
- helps to validate that contracts on both sides match
