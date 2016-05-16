var should = require('chai').should();

var stripdata = require('../bin/stripdata.js');

describe('stripdata', function() {
	
	beforeEach(function() {

	});

	describe('general functionality', function() {
		
		it('should not modify data when no options');
		it('should remove the model name for a specific model');
		it('should not remove the model name for a different model');
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
	
		it('should not hash Ids if option not selected');
		it('should hash all Ids if option is selected');
	
	});
});