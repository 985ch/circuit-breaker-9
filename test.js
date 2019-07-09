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

const breaker = new Breaker(Breaker.Timeout(50), {
  duration: 200,
  maxHit: 1,
  onBreak: handleTimeout,
});

const breaker2 = new Breaker(Breaker.Connection(2, true), {
  duration: 200,
});

const options = x => {
  return {
    onState(hit, state) { console.log(hit); console.log(state); },
    onBreak() { console.log('too many connections in ' + x); },
  };
};

describe('Test', function() {
  it('Timeout', async function() {
    console.log(await breaker.run(async () => await wait(20)));
    console.log(await breaker.run(async () => await wait(60)));
    console.log(await breaker.run(async () => await wait(30)));
    await wait(200);
    console.log(await breaker.run(async () => await wait(50), {
      timeout: 60,
      onState(hit, state) { console.log(state); },
    }));
  });
  it('Connections', async function() {
    breaker2.run(async () => { console.log('Connect1'); await wait(20); });
    breaker2.run(async () => { console.log('Connect2'); await wait(20); }, options(2));
    breaker2.run(async () => { console.log('Connect3'); await wait(20); }, options(3));
    await wait(100);
    await breaker2.run(async () => { console.log('Connect4'); await wait(20); }, options(4));
    await wait(200);
    await breaker2.run(async () => { console.log('Connect5'); await wait(20); }, options(5));
  });
});
