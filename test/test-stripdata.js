var should = require('chai').should();
var fs = require('fs');

var stripdata = require('../bin/stripdata.js');

const IN_FILENAME = 'test/testdata-stripdata.json';
const OUT_FILENAME = 'test/testdataout-stripdata.json';

describe('stripdata', function() {
	
	beforeEach(function() {
		resetOptions();
	});

	describe('general functionality', function() {
		
		it('should not modify data when no options', function(done) {
			var inputData = readInputTestFile();

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();
				inputData.should.deep.equal(outputData);
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the model name for a specific model', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripModels = ['Model A'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('smbg device-456456');
				outputData[1].deviceId.should.deep.equal('Model B-defdef');
				outputData[2].deviceId.should.deep.equal('Model C-654654');
				outputData[3].deviceId.should.deep.equal('basal device-cbacba');
				outputData[4].deviceId.should.deep.equal('Model B-fedfed');
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the model for muliple specified models', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripModels = ['Model A', 'Model B'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('smbg device-456456');
				outputData[1].deviceId.should.deep.equal('cbg device-defdef');
				outputData[2].deviceId.should.deep.equal('Model C-654654');
				outputData[3].deviceId.should.deep.equal('basal device-cbacba');
				outputData[4].deviceId.should.deep.equal('deviceEvent device-fedfed');
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the serial number for a given model', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripSNs = ['Model A'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[1].deviceId.should.deep.equal('Model B-defdef');
				outputData[2].deviceId.should.deep.equal('Model C-654654');
				outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[4].deviceId.should.deep.equal('Model B-fedfed');
				deleteFilesCreated();

				done();
			});
		});

		it('should not remove the serial number for multiple specified models', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripSNs = ['Model A', 'Model B'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[1].deviceId.should.deep.equal('Model B-Serial Number');
				outputData[2].deviceId.should.deep.equal('Model C-654654');
				outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[4].deviceId.should.deep.equal('Model B-Serial Number');
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the model and serial number for the specified model', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripModels = ['Model A'];
			stripdata.program.stripSNs = ['Model A'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('smbg device-Serial Number');
				outputData[1].deviceId.should.deep.equal('Model B-defdef');
				outputData[2].deviceId.should.deep.equal('Model C-654654');
				outputData[3].deviceId.should.deep.equal('basal device-Serial Number');
				outputData[4].deviceId.should.deep.equal('Model B-fedfed');
				deleteFilesCreated();

				done();
			});
		});

		it('should strip all models and serial numbers', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripAll = true;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('smbg device-Serial Number');
				outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
				outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
				outputData[3].deviceId.should.deep.equal('basal device-Serial Number');
				outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');
				deleteFilesCreated();

				done();
			});
		});

		it('should strip all models and serial numbers except the model for the given model', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripAll = true;
			stripdata.program.leaveModels = ['Model A'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
				outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
				outputData[3].deviceId.should.deep.equal('Model A-Serial Number');
				outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');
				deleteFilesCreated();

				done();
			});
		});

		it('should strip all models and serial numbers except the serial number for the given model', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.stripAll = true;
			stripdata.program.leaveSNs = ['Model A'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData[0].deviceId.should.deep.equal('smbg device-456456');
				outputData[1].deviceId.should.deep.equal('cbg device-Serial Number');
				outputData[2].deviceId.should.deep.equal('bolus device-Serial Number');
				outputData[3].deviceId.should.deep.equal('basal device-cbacba');
				outputData[4].deviceId.should.deep.equal('deviceEvent device-Serial Number');
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the given data type', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.removeTypes = ['cbg'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData.length.should.deep.equal(4);
				outputData[0].deviceId.should.deep.equal('Model A-456456');
				outputData[1].deviceId.should.deep.equal('Model C-654654');
				outputData[2].deviceId.should.deep.equal('Model A-cbacba');
				outputData[3].deviceId.should.deep.equal('Model B-fedfed');
				deleteFilesCreated();

				done();
			});
		});

		it('should remove all data types', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.removeAll = true;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData.length.should.deep.equal(0);
				deleteFilesCreated();

				done();
			});
		});

		it('should remove all data types except for the given data type', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.removeAll = true;
			stripdata.program.leaveTypes = ['cbg'];

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				outputData.length.should.deep.equal(1);
				outputData[0].deviceId.should.deep.equal('Model B-defdef');
				deleteFilesCreated();

				done();
			});
		});

		it('should hash all of the ID types if option is selected', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.hashIDs = true;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				for (var i in outputData) {
					var expectGroup = inputData[i]._groupId;
					var expectUpload = inputData[i].uploadId;
					should.not.exist(outputData[i]._groupId);
					should.exist(outputData[i].hash_groupId);
					outputData[i].hash_groupId.should.not.equal(expectGroup);
					should.not.exist(outputData[i].uploadId);
					should.exist(outputData[i].hash_uploadId);
					outputData[i].hash_uploadId.should.not.equal(expectUpload);
				}
				deleteFilesCreated();

				done();
			});
		});

		it('should not hash all of the ID types if option is not selected', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.hashIDs = false;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				for (var i in outputData) {
					var expectGroup = inputData[i]._groupId;
					var expectUpload = inputData[i].uploadId;
					should.exist(outputData[i]._groupId);
					should.not.exist(outputData[i].hash_groupId);
					outputData[i]._groupId.should.equal(expectGroup);
					should.exist(outputData[i].uploadId);
					should.not.exist(outputData[i].hash_uploadId);
					outputData[i].uploadId.should.equal(expectUpload);	
				}
				deleteFilesCreated();

				done();
			});
		});

		it('should remove the source field if option is selected', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.removeSource = true;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				for (var i in outputData) {
					should.not.exist(outputData[i].source);	
				}
				deleteFilesCreated();

				done();
			});
		});

		it('should not remove the source field if option is not selected', function(done) {
			var inputData = readInputTestFile();

			stripdata.program.removeSource = false;

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();

				for (var i in outputData) {
					should.exist(outputData[i].source);	
				}
				deleteFilesCreated();

				done();
			});
		});

	})
	
	describe('#splitDeviceId()', function() {
		
		it('should split a deviceId at the \'-\'', function() {
			var splitId = stripdata.splitDeviceId('Model A-123456789');
			splitId.should.be.a('array');
			splitId.should.have.length(2);
			splitId.should.deep.equal(['Model A', '123456789']);
		});

		it('should split a deviceId at the \'_\'', function() {
			var splitId = stripdata.splitDeviceId('Model B_987654321');
			splitId.should.be.a('array');
			splitId.should.have.length(2);
			splitId.should.deep.equal(['Model B', '987654321']);
		});

		it('should split a deviceId with multiple \'-\' in the model', function() {
			var splitId = stripdata.splitDeviceId('Model-C-Version-Z-12341234');
			splitId.should.be.a('array');
			splitId.should.have.length(2);
			splitId.should.deep.equal(['Model-C-Version-Z', '12341234']);
		});
	
	});

	describe('#hashIDsForData()', function() {
	
		it('should not hash Ids if option not selected', function() {
			stripdata.program.hashIDs = false;
			var data = readInputTestFile();
			for (var i in data) {
				var chunk = data[i];
				var expectGroup = data[i]._groupId;
				var expectUpload = data[i].uploadId;
				stripdata.hashIDsForData(chunk);
				should.exist(chunk._groupId);
				should.not.exist(chunk.hash_groupId);
				chunk._groupId.should.equal(expectGroup);
				should.exist(chunk.uploadId);
				should.not.exist(chunk.hash_uploadId);
				chunk.uploadId.should.equal(expectUpload);				
			}
		});

		it('should hash all Ids if option is selected', function() {
			stripdata.program.hashIDs = true;
			var data = readInputTestFile();
			for (var i in data) {
				var chunk = data[i];
				var expectGroup = data[i]._groupId;
				var expectUpload = data[i].uploadId;
				stripdata.hashIDsForData(chunk);
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
	var input = fs.readFileSync(IN_FILENAME, {encoding: 'utf8'});
	return JSON.parse(input);
}

function readOutputTestFile() {
	var output = fs.readFileSync(OUT_FILENAME, {encoding: 'utf8'});
	return JSON.parse(output);
}

function deleteFilesCreated() {
	const execSync = require('child_process').execSync;
	execSync('rm ' + OUT_FILENAME);
}