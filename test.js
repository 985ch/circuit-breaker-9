'use strict';

const Breaker = require('./');

function wait(n) {
  return new Promise(function(resolve) {
    setTimeout(() => resolve('wait:' + n), n);
  });
}

async function handleTimeout() {
  return 'timeout';
}
async function handleConnection() {
  console.log('too many connections');
}

const breaker = new Breaker(Breaker.Timeout, {
  duration: 200,
  maxHit: 1,
  handle: handleTimeout,
  timeout: 50,
});

const breaker2 = new Breaker(Breaker.Connection, {
  duration: 200,
  maxHit: 2,
  handle: handleConnection,
});

(async () => {
  const options = {};
  let text = await breaker.run(async () => await wait(20), options);
  console.log(options);
  console.log(text);
  text = await breaker.run(async () => await wait(60));
  console.log(text);
  text = await breaker.run(async () => await wait(30));
  console.log(text);
  await wait(200);
  text = await breaker.run(async () => await wait(40));
  console.log(text);

  breaker2.run(async () => { console.log('Connect1'); await wait(5); });
  breaker2.run(async () => { console.log('Connect2'); await wait(5); }, options);
  breaker2.run(async () => { console.log('Connect3'); await wait(5); });
  await wait(100);
  console.log(options);
  await breaker2.run(async () => { console.log('Connect4'); await wait(5); });
  await wait(200);
  await breaker2.run(async () => { console.log('Connect5'); await wait(5); });
})();
