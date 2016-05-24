#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');
var Excel = require('exceljs');

// ---------------- COLUMN HEADERS ----------------

const SMBG_COLS = [
    { header: 'Subtype', key: 'subType', width: 10 },
    { header: 'Units', key: 'units', width: 10 },
    { header: 'Value', key: 'value', width: 10 },
    { header: 'Clock Drift Offset', key: 'clockDriftOffset', width: 10 },
    { header: 'Conversion Offset', key: 'conversionOffset', width: 10 },
    { header: 'Created Time', key: 'createdTime', width: 10 },
    { header: 'Device Id', key: 'deviceId', width: 10 },
    { header: 'Device Time', key: 'deviceTime', width: 10 },
    { header: 'GUID', key: 'guid', width: 10 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Timezone Offset', key: 'timezoneOffset', width: 10 },
    { header: 'Upload Id', key: 'uploadId', width: 10 },
    { header: 'Hash Upload Id', key: 'hash_uploadId', width: 10 },
    { header: 'Group Id', key: '_groupId', width: 10 },
    { header: 'Hash Group Id', key: 'hash_groupId', width: 10 },
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Source', key: 'source', width: 10 },
    { header: 'Payload', key: 'payload', width: 10 }
];

const CBG_COLS = [
    { header: 'Units', key: 'units', width: 10 },
    { header: 'Value', key: 'value', width: 10 },
    { header: 'Clock Drift Offset', key: 'clockDriftOffset', width: 10 },
    { header: 'Conversion Offset', key: 'conversionOffset', width: 10 },
    { header: 'Created Time', key: 'createdTime', width: 10 },
    { header: 'Device Id', key: 'deviceId', width: 10 },
    { header: 'Device Time', key: 'deviceTime', width: 10 },
    { header: 'GUID', key: 'guid', width: 10 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Timezone Offset', key: 'timezoneOffset', width: 10 },
    { header: 'Upload Id', key: 'uploadId', width: 10 },
    { header: 'Hash Upload Id', key: 'hash_uploadId', width: 10 },
    { header: 'Group Id', key: '_groupId', width: 10 },
    { header: 'Hash Group Id', key: 'hash_groupId', width: 10 },
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Source', key: 'source', width: 10 },
    { header: 'Payload', key: 'payload', width: 10 }
];

const BOLUS_COLS = [
    { header: 'Subtype', key: 'subType', width: 10 },
    { header: 'Units', key: 'units', width: 10 },
    { header: 'Normal', key: 'normal', width: 10 },
    { header: 'Expected Normal', key: 'expectedNormal', width: 10 },
    { header: 'Extended', key: 'extended', width: 10 },
    { header: 'Expected Extended', key: 'expectedExtended', width: 10 },
    { header: 'Duration', key: 'duration', width: 10 },
    { header: 'Expected Duration', key: 'expectedDuration', width: 10 },
    { header: 'Clock Drift Offset', key: 'clockDriftOffset', width: 10 },
    { header: 'Conversion Offset', key: 'conversionOffset', width: 10 },
    { header: 'Created Time', key: 'createdTime', width: 10 },
    { header: 'Device Id', key: 'deviceId', width: 10 },
    { header: 'Device Time', key: 'deviceTime', width: 10 },
    { header: 'GUID', key: 'guid', width: 10 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Timezone Offset', key: 'timezoneOffset', width: 10 },
    { header: 'Upload Id', key: 'uploadId', width: 10 },
    { header: 'Hash Upload Id', key: 'hash_uploadId', width: 10 },
    { header: 'Group Id', key: '_groupId', width: 10 },
    { header: 'Hash Group Id', key: 'hash_groupId', width: 10 },
    { header: 'Id', key: 'id', width: 10 },
    { header: 'Source', key: 'source', width: 10 },
    { header: 'Payload', key: 'payload', width: 10 }
];

// -------------- END COLUMN HEADERS --------------

program
	.version('0.0.1')
	.option('-i, --input <input>', 'path/to/input.json')
	.option('-o, --output <output>', 'path/to/output.xlsx')
	.option('-v, --verbose', 'Verbose output.')
	.parse(process.argv);

convertToWorkbook(function() {});

function convertToWorkbook(callback) {
	if (program.verbose) {
		console.log(chalk.green.bold('Converting to spreadsheet...'));
	}

	var ifs = makeInFileStream();

	var jsonStream = JSONStream.parse();

	var wb = makeWorkbook();
	var smbgSheet = wb.addWorksheet('smbg', 'FFC0000');
	smbgSheet.columns = SMBG_COLS;
	var cbgSheet = wb.addWorksheet('cbg', '0000CFF');
	cbgSheet.columns = CBG_COLS;
	var bolusSheet = wb.addWorksheet('bolus', '00CFC00');
	bolusSheet.columns = BOLUS_COLS;

	ifs
		.pipe(jsonStream)
		.on('data', function(chunk) {
			for (var i in chunk) {
				var diaEvent = {val: chunk[i]};
				if (chunk[i].type === 'smbg') {
					smbgSheet.addRow(processSmbgEvent(diaEvent));
				} else if (chunk[i].type === 'cbg') {
					cbgSheet.addRow(processCbgEvent(diaEvent));
				} else if (chunk[i].type === 'bolus') {
					bolusSheet.addRow(processBolusEvent(diaEvent));
				}
			}
		})
		.on('end', function() {
			wb.xlsx.writeFile(program.output)
		    	.then(function() {
		    	    if (program.verbose) {
						console.log(chalk.green.bold('Done converting to spreadsheet.'));
					}
					callback();
		    	});
		});
}

function makeInFileStream() {
	var ifs;
	if (program.input) {
		ifs = fs.createReadStream(program.input, {encoding: 'utf8'});
	} else {
		ifs = process.stdin;
	}
	return ifs;
}

function makeWorkbook() {
	return new Excel.Workbook();
}


function processSmbgEvent(smbg) {
	return {
		subType: smbg.val.subType,
		units: smbg.val.units,
		value: smbg.val.value,
		clockDriftOffset: smbg.val.clockDriftOffset,
		conversionOffset: smbg.val.conversionOffset,
		createdTime: smbg.val.createdTime,
		deviceId: smbg.val.deviceId,
		deviceTime: smbg.val.deviceTime,
		guid: smbg.val.guid,
		time: smbg.val.time,
		timezoneOffset: smbg.val.timezoneOffset,
		uploadId: smbg.val.uploadId,
		hash_uploadId: smbg.val.hash_uploadId,
		_groupId: smbg.val._groupId,
		hash_groupId: smbg.val.hash_groupId,
		id: smbg.val.id,
		source: smbg.val.source,
		payload: JSON.stringify(smbg.val.payload)
	};
}

function processCbgEvent(cbg) {
	return {
		units: cbg.val.units,
		value: cbg.val.value,
		clockDriftOffset: cbg.val.clockDriftOffset,
		conversionOffset: cbg.val.conversionOffset,
		createdTime: cbg.val.createdTime,
		deviceId: cbg.val.deviceId,
		deviceTime: cbg.val.deviceTime,
		guid: cbg.val.guid,
		time: cbg.val.time,
		timezoneOffset: cbg.val.timezoneOffset,
		uploadId: cbg.val.uploadId,
		hash_uploadId: cbg.val.hash_uploadId,
		_groupId: cbg.val._groupId,
		hash_groupId: cbg.val.hash_groupId,
		id: cbg.val.id,
		source: cbg.val.source,
		payload: JSON.stringify(cbg.val.payload)
	};
}

function processBolusEvent(bolus) {
	return {
		subType: bolus.val.subType,
		units: bolus.val.units,
		normal: bolus.val.normal,
		expectedNormal: bolus.val.expectedNormal,
		extended: bolus.val.extended,
		expectedExtended: bolus.val.expectedExtended,
		duration: bolus.val.duration,
		expectedDuration: bolus.val.expectedDuration,
		clockDriftOffset: bolus.val.clockDriftOffset,
		conversionOffset: bolus.val.conversionOffset,
		createdTime: bolus.val.createdTime,
		deviceId: bolus.val.deviceId,
		deviceTime: bolus.val.deviceTime,
		guid: bolus.val.guid,
		time: bolus.val.time,
		timezoneOffset: bolus.val.timezoneOffset,
		uploadId: bolus.val.uploadId,
		hash_uploadId: bolus.val.hash_uploadId,
		_groupId: bolus.val._groupId,
		hash_groupId: bolus.val.hash_groupId,
		id: bolus.val.id,
		source: bolus.val.source,
		payload: JSON.stringify(bolus.val.payload)
	};
}