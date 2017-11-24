/* global beforeEach, describe, it */

// Mocha doesn't like arrow functions: https://mochajs.org/#arrow-functions
/* eslint-disable prefer-arrow-callback,func-names,space-before-function-paren */

/* eslint-disable no-underscore-dangle */
/* eslint no-restricted-syntax: [0, "ForInStatement"] */

const should = require('chai').should();
const fs = require('fs');
const spawn = require('child_process').spawn;

const stripdata = require('../bin/stripdata.js');
const dataTools = require('../lib.js');

const IN_FILENAME = 'test/data/testdata-stripdata.json';
const OUT_FILENAME = 'test/data/testdataout-stripdata.json';

function resetOptions() {
  stripdata.program.input = IN_FILENAME;
  stripdata.program.output = OUT_FILENAME;
  stripdata.program.stripModels = [];
  stripdata.program.stripSNs = [];
  stripdata.program.leaveModels = [];
  stripdata.program.stripAll = false;
  stripdata.program.removeTypes = [];
  stripdata.program.leaveTypes = [];
  stripdata.program.removeAll = false;
  stripdata.program.hashIDs = false;
  stripdata.program.removeSource = false;
  stripdata.program.verbose = false;
}

function readInputTestFile() {
  const input = fs.readFileSync(IN_FILENAME, {
    encoding: 'utf8',
  });
  return JSON.parse(input);
}

function readOutputTestFile() {
  const output = fs.readFileSync(OUT_FILENAME, {
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

function deleteFilesCreated() {
  // eslint-disable-next-line global-require
  const execSync = require('child_process').execSync;
  execSync(`rm ${OUT_FILENAME}`);
}

describe('stripdata', () => {
  beforeEach(() => {
    resetOptions();
  });

  describe('general functionality', () => {
    it('should not modify data when no options', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const inputData = readInputTestFile();
        const outputData = readOutputTestFile();
        inputData.should.deep.equal(outputData);

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the model name for a specific model', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripModels', 'Model A',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('smbg device-456456');
        outputData[1].deviceId.should.deep.equal('Model B-defdef');
        outputData[2].deviceId.should.deep.equal('Model C-654654');
        outputData[3].deviceId.should.deep.equal('basal device-cbacba');
        outputData[4].deviceId.should.deep.equal('Model B-fedfed');

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the model for muliple specified models', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripModels', 'Model A,Model B',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('smbg device-456456');
        outputData[1].deviceId.should.deep.equal('cbg device-defdef');
        outputData[2].deviceId.should.deep.equal('Model C-654654');
        outputData[3].deviceId.should.deep.equal('basal device-cbacba');
        outputData[4].deviceId.should.deep.equal('deviceEvent device-fedfed');

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the serial number for a given model', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripSNs', 'Model A',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[1].deviceId.should.deep.equal('Model B-defdef');
        outputData[2].deviceId.should.deep.equal('Model C-654654');
        outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[4].deviceId.should.deep.equal('Model B-fedfed');

        deleteFilesCreated();
        done();
      });
    });

    it('should not remove the serial number for multiple specified models', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripSNs', 'Model A,Model B',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[1].deviceId.should.deep.equal('Model B-Serial Number');
        outputData[2].deviceId.should.deep.equal('Model C-654654');
        outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[4].deviceId.should.deep.equal('Model B-Serial Number');

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the model and serial number for the specified model', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripModels', 'Model A',
        '--stripSNs', 'Model A',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('smbg device-Serial Number');
        outputData[1].deviceId.should.deep.equal('Model B-defdef');
        outputData[2].deviceId.should.deep.equal('Model C-654654');
        outputData[3].deviceId.should.deep.equal('basal device-Serial Number');
        outputData[4].deviceId.should.deep.equal('Model B-fedfed');

        deleteFilesCreated();
        done();
      });
    });

    it('should strip all models and serial numbers', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripAll',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('smbg device-Serial Number');
        outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
        outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
        outputData[3].deviceId.should.deep.equal('basal device-Serial Number');
        outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');

        deleteFilesCreated();
        done();
      });
    });

    it('should strip all models and serial numbers except the model for the given model', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripAll',
        '--leaveModels', 'Model A',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
        outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
        outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
        outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');

        deleteFilesCreated();
        done();
      });
    });

    it('should strip all models and serial numbers except the serial number for the given model', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--stripAll',
        '--leaveSNs', 'Model A',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData[0].deviceId.should.deep.equal('smbg device-456456');
        outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
        outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
        outputData[3].deviceId.should.deep.equal('basal device-cbacba');
        outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the given data type', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--removeTypes', 'cbg',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(4);
        outputData[0].deviceId.should.deep.equal('Model A-456456');
        outputData[1].deviceId.should.deep.equal('Model C-654654');
        outputData[2].deviceId.should.deep.equal('Model A-cbacba');
        outputData[3].deviceId.should.deep.equal('Model B-fedfed');

        deleteFilesCreated();
        done();
      });
    });

    it('should remove all data types', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--removeAll',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(0);

        deleteFilesCreated();
        done();
      });
    });

    it('should remove all data types except for the given data type', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--removeAll',
        '--leaveTypes', 'cbg',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        outputData.length.should.deep.equal(1);
        outputData[0].deviceId.should.deep.equal('Model B-defdef');

        deleteFilesCreated();
        done();
      });
    });

    it('should hash all of the ID types if option is selected', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--hashIDs',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const inputData = readInputTestFile();
        const outputData = readOutputTestFile();
        for (const [index, outputDatum] of outputData.entries()) {
          const expectGroup = inputData[index]._groupId;
          const expectUpload = inputData[index].uploadId;
          should.not.exist(outputDatum._groupId);
          should.exist(outputDatum.hash_groupId);
          outputDatum.hash_groupId.should.not.equal(expectGroup);
          should.not.exist(outputDatum.uploadId);
          should.exist(outputDatum.hash_uploadId);
          outputDatum.hash_uploadId.should.not.equal(expectUpload);
        }

        deleteFilesCreated();
        done();
      });
    });

    it('should not hash all of the ID types if option is not selected', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const inputData = readInputTestFile();
        const outputData = readOutputTestFile();
        for (const [index, outputDatum] of outputData.entries()) {
          const expectGroup = inputData[index]._groupId;
          const expectUpload = inputData[index].uploadId;
          should.exist(outputDatum._groupId);
          should.not.exist(outputDatum.hash_groupId);
          outputDatum._groupId.should.equal(expectGroup);
          should.exist(outputDatum.uploadId);
          should.not.exist(outputDatum.hash_uploadId);
          outputDatum.uploadId.should.equal(expectUpload);
        }

        deleteFilesCreated();
        done();
      });
    });

    it('should remove the source field if option is selected', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
        '--removeSource',
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        for (const outputDatum of outputData) {
          should.not.exist(outputDatum.source);
        }

        deleteFilesCreated();
        done();
      });
    });

    it('should not remove the source field if option is not selected', (done) => {
      const strip = spawn('bin/stripdata.js', [
        '-i', IN_FILENAME,
        '-o', OUT_FILENAME,
      ]);

      strip.on('exit', (code) => {
        code.should.deep.equal(0);

        const outputData = readOutputTestFile();
        for (const outputDatum of outputData) {
          should.exist(outputDatum.source);
        }

        deleteFilesCreated();
        done();
      });
    });
  });

  describe('#splitDeviceId()', () => {
    it('should split a deviceId at the \'-\'', () => {
      const splitId = dataTools.splitDeviceId('Model A-123456789');
      splitId.should.be.a('array');
      splitId.should.have.length(2);
      splitId.should.deep.equal(['Model A', '123456789']);
    });

    it('should split a deviceId at the \'_\'', () => {
      const splitId = dataTools.splitDeviceId('Model B_987654321');
      splitId.should.be.a('array');
      splitId.should.have.length(2);
      splitId.should.deep.equal(['Model B', '987654321']);
    });

    it('should split a deviceId with multiple \'-\' in the model', () => {
      const splitId = dataTools.splitDeviceId('Model-C-Version-Z-12341234');
      splitId.should.be.a('array');
      splitId.should.have.length(2);
      splitId.should.deep.equal(['Model-C-Version-Z', '12341234']);
    });
  });

  describe('#hashIDsForData()', () => {
    it('should hash all IDs correctly', () => {
      const data = readInputTestFile();
      for (const chunk of data) {
        const expectGroup = chunk._groupId;
        const expectUpload = chunk.uploadId;
        dataTools.hashIDsForData(chunk);
        should.not.exist(chunk._groupId);
        should.exist(chunk.hash_groupId);
        chunk.hash_groupId.should.not.equal(expectGroup);
        should.not.exist(chunk.uploadId);
        should.exist(chunk.hash_uploadId);
        chunk.hash_uploadId.should.not.equal(expectUpload);
      }
    });
  });
});
