/* global describe, it */

// Mocha doesn't like arrow functions: https://mochajs.org/#arrow-functions
/* eslint-disable prefer-arrow-callback,func-names,space-before-function-paren */

const spawn = require('child_process').spawn;

const cwd = process.cwd();
const NO_DATA = `${cwd}/test/data/testdata-filterdata-nodata.json`;
const SHORT_DATA = `${cwd}/test/data/testdata-filterdata-shortdata.json`;
const MANY_GAPS = `${cwd}/test/data/testdata-filterdata-manygaps.json`;
const LOW_AMOUNT = `${cwd}/test/data/testdata-filterdata-lowamount.json`;
const GOOD_LONG = `${cwd}/test/data/testdata-filterdata-goodlong.json`;
const GOOD_START_GAP = `${cwd}/test/data/testdata-filterdata-goodstartgap.json`;
const GOOD = `${cwd}/test/data/testdata-filterdata-good.json`;
const GOOD_TWICE = `${cwd}/test/data/testdata-filterdata-goodtwice.json`;
const SIMPLE = `${cwd}/test/data/testdata-filterdata-simple.json`;
const OUT_FILENAME = `${cwd}/test/data/testdataout-filterdata.json`;

const MAX_TIMEOUT = 5000;

function readInputTestFile(input) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(input);
}

function readOutputTestFile() {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(OUT_FILENAME);
}

function deleteFilesCreated() {
  // eslint-disable-next-line global-require
  const execSync = require('child_process').execSync;
  execSync(`rm ${OUT_FILENAME}`);
}
describe('filterdata', () => {
  describe('general functionality', () => {
    it('should not succeed when there is no data.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        NO_DATA,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(1);
        done();
      });
    });

    it('should not succeed for to short of a length of data.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        SHORT_DATA,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(1);
        done();
      });
    });

    it('should not succeed for data with many long gaps.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        MANY_GAPS,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(1);
        done();
      });
    });

    it('should not succeed for data with a low amount of events per day.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        LOW_AMOUNT,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(1);
        done();
      });
    });

    it('should succeed for an amount of data longer than the minimum amount.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        GOOD_LONG,
        '-o', OUT_FILENAME,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(43776);
        deleteFilesCreated();

        done();
      });
    });

    it('should succeed for data that begins with a long gap, but then has sufficient data.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        GOOD_START_GAP,
        '-o', OUT_FILENAME,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(43776); // 34848?
        deleteFilesCreated();

        done();
      });
    });

    it('should succeed for data that does not have a large gap and is not sparse.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        GOOD,
        '-o', OUT_FILENAME,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(43776);
        deleteFilesCreated();

        done();
      });
    });

    it('should succeed for a long amount of suffient data before a gap, and sufficient data after the gap.', function (done) {
      this.timeout(MAX_TIMEOUT);
      const filter = spawn('bin/filterdata.js', [
        'cbg',
        GOOD_TWICE,
        '-o', OUT_FILENAME,
        '--length', 100,
        '--min', 288,
        '--days', 75,
        '--gap', 14,
      ]);

      filter.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(43776);
        deleteFilesCreated();

        done();
      });
    });
  });

  describe('#verifySameDay()', () => {
    // eslint-disable-next-line global-require
    const filterdata = require('../bin/filterdata.js');

    it('should result true for the same date.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      filterdata.verifySameDay(d1, d2).should.equal(true);
    });

    it('should result false for different dates.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 1);
      filterdata.verifySameDay(d1, d2).should.equal(false);
    });

    it('should result true for different times on the same date.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      d2.setTime(d2.getTime() + 60000);
      filterdata.verifySameDay(d1, d2).should.equal(true);
    });
  });

  describe('#getLength()', () => {
    // eslint-disable-next-line global-require
    const filterdata = require('../bin/filterdata.js');

    it('should have length 0 for the same start and end.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      const curSet = {
        start: d1,
        end: d2,
      };
      filterdata.getLength(curSet).should.equal(0);
    });

    it('should have a positive length for end before start.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() - 1);
      const curSet = {
        start: d1,
        end: d2,
      };
      filterdata.getLength(curSet).should.be.above(0);
    });

    it('should have a negative length for start before end.', () => {
      const d1 = new Date();
      const d2 = new Date(d1);
      d2.setDate(d2.getDate() + 1);
      const curSet = {
        start: d1,
        end: d2,
      };
      filterdata.getLength(curSet).should.be.below(0);
    });
  });

  describe('#getFirstIndexOfType()', () => {
    // eslint-disable-next-line global-require
    const filterdata = require('../bin/filterdata.js');

    it('should have smbg at index 0 when starting at 0', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(0, 'smbg', data).should.equal(0);
    });

    it('should return out-of-range index for smbg when starting at 1', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(1, 'smbg', data).should.equal(data.length);
    });

    it('should have cbg at index 1 when starting at 0', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(0, 'cbg', data).should.equal(1);
    });

    it('should have bolus at index 2 when starting at 0', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(0, 'bolus', data).should.equal(2);
    });

    it('should have cbg at index 3 when starting at 2', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(2, 'cbg', data).should.equal(3);
    });

    it('should return out-of-range index for cbg when starting at 4', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(4, 'cbg', data).should.equal(data.length);
    });

    it('should have deviceEvent at index 4 when starting at 1', () => {
      const data = readInputTestFile(SIMPLE);
      filterdata.getFirstIndexOfType(1, 'deviceEvent', data).should.equal(4);
    });
  });
});
