var should = require('chai').should();
var fs = require('fs');

var stripdata = require('../bin/stripdata.js');

describe('stripdata', function() {
	
	beforeEach(function() {
		resetOptions();
	});

	describe('general functionality', function() {
		
		it('should not modify data when no options', function(done) {
			var inputData = readInputTestFile();

			stripdata.performDataStripping(function() {
				var outputData = readOutputTestFile();
				inputData.should.not.deep.equal(outputData);
				deleteFilesCreated();

				done();
			});
		});

		// it('should remove the model name for a specific model', function() {
		// 	var inputData = readInputTestFile();

		// 	stripdata.program.stripModels = ['Model A'];

		// 	stripdata.performDataStripping();

		// 	var outputData = readOutputTestFile();

		// 	outputData[0].deviceId.should.deep.equal('smbg device-456456');
		// 	outputData[1].deviceId.should.deep.equal('Model B-defdef');
		// 	outputData[2].deviceId.should.deep.equal('Model C-654654');
		// 	outputData[3].deviceId.should.deep.equal('basal device-cbacba');
		// 	outputData[4].deviceId.should.deep.equal('Model B-fedfed');
		//	deleteFilesCreated();
		// });

		it('should remove the model for muliple specified models');
		it('should remove the serial number for a given model');
		it('should not remove the serial number for a different model');
		it('should strip all models and serial numbers');
		it('should strip all models and serial numbers except the model for the given model');
		it('should strip all models and serial numbers except the serial number for the given model');
		it('should remove the given data type');
		it('should remove all data types');
		it('should remove all data types except for the given data type');
		it('should hash all of the ID types');
		it('should remove the source field');

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
				var chunk = {val: data[i]};
				var expectGroup = data[i]._groupId;
				var expectUpload = data[i].uploadId;
				stripdata.hashIDsForData(chunk);
				should.exist(chunk.val._groupId);
				should.not.exist(chunk.val.hash_groupId);
				chunk.val._groupId.should.equal(expectGroup);
				should.exist(chunk.val.uploadId);
				should.not.exist(chunk.val.hash_uploadId);
				chunk.val.uploadId.should.equal(expectUpload);				
			}
		});

		it('should hash all Ids if option is selected', function() {
			stripdata.program.hashIDs = true;
			var data = readInputTestFile();
			for (var i in data) {
				var chunk = {val: data[i]};
				var expectGroup = data[i]._groupId;
				var expectUpload = data[i].uploadId;
				stripdata.hashIDsForData(chunk);
				should.not.exist(chunk.val._groupId);
				should.exist(chunk.val.hash_groupId);
				chunk.val.hash_groupId.should.not.equal(expectGroup);
				should.not.exist(chunk.val.uploadId);
				should.exist(chunk.val.hash_uploadId);
				chunk.val.hash_uploadId.should.not.equal(expectUpload);
			}
		});
	
	});
});

function resetOptions() {
	stripdata.program.input = 'test/testdata.json';
	stripdata.program.output = 'test/testdataout.json';
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
	var input = fs.readFileSync('test/testdata.json', {encoding: 'utf8'});
	return JSON.parse(input);
}

function readOutputTestFile() {
	var output = fs.readFileSync('test/testdataout.json', {encoding: 'utf8'});
	return JSON.parse(output);
}

function deleteFilesCreated() {
	const execSync = require('child_process').execSync;
	execSync('rm test/testdataout.json');
}