var should = require('chai').should();
var fs = require('fs');

var filterdata = require('../bin/filterdata.js');

const IN_FILENAME = 'test/testdata-filterdata.json';
const OUT_FILENAME = 'test/testdataout-filterdata.json';

describe('filterdata', function() {
	
	describe('general functionality', function() {
		it('should not succeed when there is no data.');
		it('should not succeed for to short of a length of data.');
		it('should not succeed for data with many long gaps.');
		it('should not succeed for data with a low amount of events per day.');
		it('should succeed for an amount of data longer than the minimum amount.');
		it('should succeed for data that begins with a long gap, but then has sufficient data.');
		it('should succeed for data that does not have a large gap and is not sparse.');
		it('should succeed for data that ')
	});
});