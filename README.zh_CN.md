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

这个模块允许你通过触发器函数来实现自己的断路器。模块自带了Timeout和Connections两个触发器函数。

## 安装

```bash
$ npm i circuit-breaker-9 --save
```

## 使用方法
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
在[test.js](./test.js)中可以看到更多用法

## API
### breaker = new Breaker(trigger, config)
调用该函数来获得一个断路器
* trigger: 触发器函数，详见[trigger](#trigger)
* config: 断路器配置，详见[config](#config)
* breaker: 断路器对象
### result = await breaker.run(func, options)
在断路器的保护下执行一个异步函数
* func: async ()=>{}，想要执行的异步函数。
* options: 执行选项，具体属性和trigger相关，默认属性详见[options](#options)
* result: 当断路器没有触发时，该结果来自func的返回；当断路器触发时，该结果来自options.onBreak或者config.onBreak
### breaker.break(duration)
立即进入断路状态
* duration: 断路持续时间，单位毫秒，若不传则使用config.duration
### breaker.restore()
立即取消断路状态

## config
| 属性 | 格式 | 默认值 |描述 |
|:-----|:----|:------|:----|
| duration | number | 60000 | 断路持续时间(ms)，持续时间内每次调用run都会直接触发onBreak而不再执行func |
| maxHit | number | 1 | 最大触发次数，当触发次数达到该值时会自动断路 |
| onBreak | async ()=>{} | () => { throw new Error('Circuit breaker is triggered'); } | 断路时调用的异步函数，在调用run时如果发生断路，run返回的结果将来自该函数 | 
| onState | (isHit, state)=>{} | undefined | 在调用run并且没有断路时，会执行该函数，让调用者可以根据执行状态做一些额外的处理 |
## options
| 属性 | 格式 | 描述 |
|:-----|:----|:----|
| onBreak | async ()=>{} | 同config.onBreak | 
| onState | (isHit, state)=>{} | 同config.onState |
## trigger
用于触发断路器和修改断路器状态的函数，其格式如下
```js
async function(func, options, state, onState){
  // 执行func并操作state.hit
  return {isHit, err, data}
}
```
* func: 即breaker.run中的func
* options: 即breaker.run中的options
* state: Breaker对象中的state，至少包含hit和breakTime两个属性，trigger中的其他状态数据一般也存放在这里。
* onState: function(isHit, state)，该参数允许调用者在没有触发断路的情况下得到本次函数的执行状态。isHit是本次是否触发了触发器，而state则是用户可能需要用到的状态数据。onState可能来自于options或config，options有限。**该参数可能为空**
* isHit: 本次是否触发了触发器，无论函数执行成功还是失败都需要返回isHit
* err: 当需要抛出一个错误时，改为通过返回err来实现。函数执行成功时，err应为undefined。
* data: func执行成功时的返回结果，若func执行失败则不必返回data。
### Breaker.Timeout(timeout)
该触发器在func执行超时时会触发，timeout单位是毫秒，支持通过options.timeout指定
### Breaker.Connection(maxConn)
该触发器在并发处理内容超过最大值时会触发, maxConn即最大连接数

## 测试

```sh
npm test
```

## License

[MIT](LICENSE)
