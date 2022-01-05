import * as td from 'testdouble';

global.td = td;
global.logger = {
  info() {},
};

export const mochaHooks = {
  afterEach(done) {
    td.reset();
    done();
  },
};
