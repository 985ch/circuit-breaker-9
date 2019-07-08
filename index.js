'use strict';

const _ = require('lodash');

const defaultConfig = {
  duration: 60000,
  maxHit: 1,
  handle: () => { throw new Error('Circuit breaker is triggered'); },
};

class Breaker {
  constructor(trigger, config) {
    if (!trigger) throw new Error('invalid trigger');
    this.config = _.extend({}, defaultConfig, config);
    this.trigger = trigger;

    this.state = {
      breakTime: 0,
      hit: 0,
    };
  }
  async run(func, options = {}) {
    const handle = options.handle || this.config.handle;

    const now = Date.now();
    if (now < this.state.breakTime) {
      return await handle();
    }
    const { state, data, err } = await this.trigger(func, this.state, this.config);
    options.state = state;
    if (err && this.state.hit >= this.config.maxHit) {
      this.break();
      return await handle();
    }
    if (err) throw err;
    return data;
  }
  break(now) {
    now = now || Date.now();
    this.state.breakTime = now + this.config.duration;
  }
  restore() {
    this.state.breakTime = 0;
  }
  // time out trigger
  static Timeout(func, state, config) {
    const start = Date.now();
    let finish = false;
    return new Promise(function(resolve) {
      const timer = setTimeout(function() {
        if (!finish) {
          finish = true;
          state.hit++;
          resolve({
            state: { cost: Date.now() - start },
            err: new Error('timeout:' + config.timeout),
          });
        }
      }, config.timeout || 60000);

      func().then(data => {
        if (!finish) {
          finish = true;
          clearTimeout(timer);
          state.hit = 0;
          resolve({ state: { cost: Date.now() - start }, data });
        }
      }).catch(err => {
        if (!finish) {
          finish = true;
          clearTimeout(timer);
          resolve({ state: { cost: Date.now() - start }, err });
        } else {
          throw err;
        }
      });
    });
  }
  // connection trigger
  static async Connection(func, bState, config) {
    bState.hit++;
    const state = { connections: bState.hit };
    if (state.hit > config.maxHit) {
      return { state, err: new Error('Too many connections:' + bState.hit) };
    }
    try {
      const data = await func();
      bState.hit--;
      return { state, data };
    } catch (err) {
      bState.hit--;
      return { state, err };
    }
  }
}

module.exports = Breaker;
