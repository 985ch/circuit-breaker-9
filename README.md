# circuit-breaker-9

![node version][node-image]
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![npm download][download-image]][download-url]

[node-image]: https://img.shields.io/badge/node-%3E%3D8-blue.svg
[npm-image]: https://img.shields.io/npm/v/circuit-breaker-9.svg?style=flat-square
[npm-url]: https://npmjs.org/package/circuit-breaker-9
[travis-image]: https://img.shields.io/travis/985ch/circuit-breaker-9.svg?style=flat-square
[travis-url]: https://travis-ci.org/985ch/circuit-breaker-9
[codecov-image]: https://img.shields.io/codecov/c/github/985ch/circuit-breaker-9.svg?style=flat-square
[codecov-url]: https://codecov.io/github/985ch/circuit-breaker-9?branch=master
[david-image]: https://img.shields.io/david/985ch/circuit-breaker-9.svg?style=flat-square
[david-url]: https://david-dm.org/985ch/circuit-breaker-9
[download-image]: https://img.shields.io/npm/dm/circuit-breaker-9.svg?style=flat-square
[download-url]: https://npmjs.org/package/circuit-breaker-9

This package allows the user to implement their own circuit breakers using triggers. The package comes with two triggers, Timeout and Connections.

## [中文说明](./README.zh_CN.md)
## Install

```bash
$ npm i circuit-breaker-9 --save
```

## Usage
```js
'use strict';

const Breaker = require('circuit-breaker-9');

const breaker = new Breaker(Breaker.Timeout(1000), {
  duration: 10000,
  maxHit: 3,
});

const resultA = await breaker.run(async () => { /* do something and return */});
const resultB = await breaker.run(async () => { /* do something and return */},{
  timeout: 500,
  async onBreak(){ /* do something when breaked */},
});
```
More usage can be found in [test.js](./test.js)

## API
### breaker = new Breaker(trigger, config)
Get a new circuit breaker.
* trigger: Trigger function, see [trigger](#trigger).
* config: Circuit breaker Configurationn, see[config](#config).
* breaker: A circuit breaker object.
### result = await breaker.run(func, options)
Execute an asynchronous function using a circuit breaker
* func: async ()=>{}，Asynchronous function that you want to execute.
* options: See [options](#options)
* result: When the circuit breaker is not activated, the result comes from func; when the circuit breaker is activated, the result is taken from options.onBreak or config.onBreak.
### breaker.break(duration)
Activate circuit breaker
* duration: Break time, default is config.duration
### breaker.restore()
Deactivate the circuit breaker

## config
| name | format | default | description |
|:-----|:-------|:--------|:------------|
| duration | number | 60000 | Break time(ms)，breaker.run() will call onBreak() directly during the duration |
| maxHit | number | 1 | The maximum number of triggers, when the number of triggers reaches this value, call breaker.break() |
| onBreak | async ()=>{} | () => { throw new Error('Circuit breaker is triggered'); } | The break function is called if the circuit is broken when the breaker.run() is called. | 
| onState | (isHit, state)=>{} | undefined | When breaker.run() is not broken, the function is executed, allowing the caller to do some extra processing based on the execution state. |
## options
| name | format | description |
|:-----|:-------|:------------|
| onBreak | async ()=>{} | See config.onBreak | 
| onState | (isHit, state)=>{} | See config.onState |
## trigger
Function for triggering the circuit breaker and modifying the state of the circuit breaker
```js
async function(func, options, state, onState){
  // Execute func and modify state.hit
  return {isHit, err, data}
}
```
* func: The **func** of breaker.run(func, options)
* options: The **options** of breaker.run(func, options)
* state: At least two attributes, **hit** and **breakTime**, are included, and other state data in the trigger is also stored here.
* onState: **function(isHit, state)**，This parameter allows the caller to get the function execution state when there is no open circuit. isHit is triggered this time, state is the state data to be passed. **This parameter can be undefined**
* isHit: Whether the trigger is triggered.
* err: An error object.
* data: The result of func.

### Breaker.Timeout(timeout)

Timeout trigger, allowed to be specified by options.timeout

### Breaker.Connection(maxConn)

Maximum connection trigger, triggered when a task that is being processed simultaneously exceeds the maximum connection

## Test

```sh
npm test
```

## License

[MIT](LICENSE)<br />
This README was translate by [google](https://translate.google.cn)
