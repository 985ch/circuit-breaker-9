'use strict';

const _ = require('lodash');

const defaultConfig = {
  duration: 60000,
  maxHit: 1,
  onBreak() { throw new Error('Circuit breaker is triggered'); },
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
    const onBreak = options.onBreak || this.config.onBreak;
    const onState = options.onState || this.config.onState;

    const now = Date.now();
    if (now < this.state.breakTime) {
      return await onBreak();
    }
    const { isHit, data, err } = await this.trigger(func, options, this.state, onState);
    if (isHit && this.state.hit >= this.config.maxHit) {
      this.break();
      return await onBreak();
    }
    if (err) throw err;
    return data;
  }
  break(duration) {
    duration = duration || this.config.duration;
    this.state.breakTime = Date.now() + duration;
  }
  restore() {
    this.state.hit = 0;
    this.state.breakTime = 0;
  }
  // time out trigger
  static Timeout(timeout) {
    return (func, options, state, onState) => {
      const _timeout = options.timeout || timeout;
      const start = Date.now();
      let finish = false;

      const setState = () => {
        finish = true;
        const cost = Date.now() - start;
        const isHit = cost >= _timeout;
        if (isHit) {
          state.hit++;
        } else {
          state.hit = 0;
        }

        if (onState) {
          onState(isHit, {
            hit: state.hit,
            cost,
          });
        }
        return isHit;
      };

      return new Promise(function(resolve) {
        const timer = setTimeout(function() {
          if (!finish) {
            resolve({ isHit: setState(), err: new Error('timeout:' + _timeout) });
          }
        }, _timeout || 60000);

        func().then(data => {
          if (!finish) {
            clearTimeout(timer);
            resolve({ isHit: setState(), data });
          }
        }).catch(err => {
          if (!finish) {
            finish = true;
            clearTimeout(timer);
            resolve({ isHit: false, err });
          } else {
            throw err;
          }
        });
      });
    };
  }
  // connection trigger
  static Connection(maxConn) {
    return async (func, options, bState, onState) => {
      bState.connections = (bState.connections || 0) + 1;
      let isHit = false;
      if (bState.connections > maxConn) {
        isHit = true;
        bState.hit++;
        bState.connections--;
        return { isHit, err: new Error('too many connections') };
      }
      bState.hit = 0;

      const state = {
        hit: bState.hit,
        connections: bState.connections,
      };
      try {
        const data = await func();
        if (onState) {
          onState(isHit, state);
        }
        bState.connections--;
        return { isHit, data };
      } catch (err) {
        bState.connections--;
        return { isHit, err };
      }
    };
  }
}

module.exports = Breaker;
