var should = require('chai').should();
var fs = require('fs');
var spawn = require('child_process').spawn;

var filterdata = require('../bin/filterdata.js');

const NO_DATA = 'test/data/testdata-filterdata-nodata.json';
const SHORT_DATA = 'test/data/testdata-filterdata-shortdata.json';
const MANY_GAPS = 'test/data/testdata-filterdata-manygaps.json';
const LOW_AMOUNT = 'test/data/testdata-filterdata-lowamount.json';
const GOOD_LONG = 'test/data/testdata-filterdata-goodlong.json';
const GOOD_START_GAP = 'test/data/testdata-filterdata-goodstartgap.json';
const GOOD = 'test/data/testdata-filterdata-good.json';
const GOOD_TWICE = 'test/data/testdata-filterdata-goodtwice.json';
const SIMPLE = 'test/data/testdata-filterdata-simple.json';
const OUT_FILENAME = 'test/data/testdataout-filterdata.json';

const MAX_TIMEOUT = 5000;

describe('filterdata', function() {

	describe('general functionality', function() {
		it('should not succeed when there is no data.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', NO_DATA,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(1);
				done();
			});
		});
		
		it('should not succeed for to short of a length of data.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', SHORT_DATA,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(1);
				done();
			});
		});
		
		it('should not succeed for data with many long gaps.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', MANY_GAPS,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(1);
				done();
			});
		});
		
		it('should not succeed for data with a low amount of events per day.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', LOW_AMOUNT,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(1);
				done();
			});
		});
		
		it('should succeed for an amount of data longer than the minimum amount.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', GOOD_LONG,
					'-o', OUT_FILENAME,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(0);

				var outputData = readOutputTestFile();
				outputData.length.should.deep.equal(43776);
				deleteFilesCreated();
				
				done();
			});
		});
		
		it('should succeed for data that begins with a long gap, but then has sufficient data.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', GOOD_START_GAP,
					'-o', OUT_FILENAME,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(0);

				var outputData = readOutputTestFile();
				outputData.length.should.deep.equal(34848);
				deleteFilesCreated();
				
				done();
			});
		});
		
		it('should succeed for data that does not have a large gap and is not sparse.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', GOOD,
					'-o', OUT_FILENAME,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(0);

				var outputData = readOutputTestFile();
				outputData.length.should.deep.equal(43776);
				deleteFilesCreated();
				
				done();
			});
		});

		it('should succeed for a long amount of suffient data before a gap, and sufficient data after the gap.', function(done) {
			this.timeout(MAX_TIMEOUT);
			var filter = spawn('filterdata', [
					'cbg',
					'-i', GOOD_TWICE,
					'-o', OUT_FILENAME,
					'--length', 100,
					'--min', 288,
					'--days', 75,
					'--gap', 14
				]);

			filter.on('exit', function(code) {
				code.should.deep.equal(0);

				var outputData = readOutputTestFile();
				outputData.length.should.deep.equal(43776);
				deleteFilesCreated();

				done();
			});
		})
	});

	describe('#verifySameDay()', function() {
		it('should result true for the same date.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			filterdata.verifySameDay(d1, d2).should.equal(true);
		});

		it('should result false for different dates.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			d2.setDate(d2.getDate() + 1);
			filterdata.verifySameDay(d1, d2).should.equal(false);
		});

		it('should result true for different times on the same date.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			d2.setTime(d2.getTime() + 60000);
			filterdata.verifySameDay(d1, d2).should.equal(true);
		});
	});

	describe('#getLength()', function() {
		it('should have length 0 for the same start and end.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			var curSet = {
				start: d1,
				end: d2
			}
			filterdata.getLength(curSet).should.equal(0);
		});

		it('should have a positive length for end before start.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			d2.setDate(d2.getDate() - 1);
			var curSet = {
				start: d1,
				end: d2
			}
			filterdata.getLength(curSet).should.be.above(0);
		});

		it('should have a negative length for start before end.', function() {
			var d1 = new Date();
			var d2 = new Date(d1);
			d2.setDate(d2.getDate() + 1);
			var curSet = {
				start: d1,
				end: d2
			}
			filterdata.getLength(curSet).should.be.below(0);
		});
	});

	describe('#getFirstIndexOfType()', function() {
		it('should have smbg at index 0 when starting at 0', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(0, 'smbg', data).should.equal(0);
		});

		it('should return out-of-range index for smbg when starting at 1', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(1, 'smbg', data).should.equal(data.length);
		});

		it('should have cbg at index 1 when starting at 0', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(0, 'cbg', data).should.equal(1);
		});

		it('should have bolus at index 2 when starting at 0', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(0, 'bolus', data).should.equal(2);
		});

		it('should have cbg at index 3 when starting at 2', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(2, 'cbg', data).should.equal(3);
		});

		it('should return out-of-range index for cbg when starting at 4', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(4, 'cbg', data).should.equal(data.length);
		});

		it('should have deviceEvent at index 4 when starting at 1', function() {
			var data = readInputTestFile(SIMPLE);
			filterdata.getFirstIndexOfType(1, 'deviceEvent', data).should.equal(4);
		});
	});
});

function resetOptions() {
	filterdata.program.type = 'cbg';
	filterdata.program.length = 1;
	filterdata.program.min = 1;
	filterdata.program.days = 1;
	filterdata.program.gap = 1;
}

function readInputTestFile(input) {
	var input = fs.readFileSync(input, {encoding: 'utf8'});
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