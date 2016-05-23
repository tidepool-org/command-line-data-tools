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
    { header: 'Created Time', key: 'createdTime', width: 10 },
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

	ifs
		.pipe(jsonStream)
		.on('data', function(chunk) {
			for (var i in chunk) {
				if (chunk[i].type === 'smbg') {
					smbgSheet.addRow(processSmbgEvent({val: chunk[i]}));
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

// const SMBG_COLS = [
//     { header: 'Subtype', key: 'subType', width: 10 },
//     { header: 'Units', key: 'units', width: 10 },
//     { header: 'Value', key: 'value', width: 10 },
//     { header: 'Clock Drift Offset', key: 'clockDriftOffset', width: 10 },
//     { header: 'Conversion Offset', key: 'conversionOffset', width: 10 },
//     { header: 'Created Time', key: 'createdTime', width: 10 },
//     { header: 'Device Id', key: 'deviceId', width: 10 },
//     { header: 'Device Time', key: 'deviceTime', width: 10 },
//     { header: 'GUID', key: 'guid', width: 10 },
//     { header: 'Time', key: 'time', width: 10 },
//     { header: 'Timezone Offset', key: 'timezoneOffset', width: 10 },
//     { header: 'Upload Id', key: 'uploadId', width: 10 },
//     { header: 'Hash Upload Id', key: 'hash_uploadId', width: 10 },
//     { header: 'Group Id', key: '_groupId', width: 10 },
//     { header: 'Hash Group Id', key: 'hash_groupId', width: 10 },
//     { header: 'Created Time', key: 'createdTime', width: 10 },
//     { header: 'Id', key: 'id', width: 10 },
//     { header: 'Source', key: 'source', width: 10 },
//     { header: 'Payload', key: 'payload', width: 10 }
// ];
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
		createdTime: smbg.val.createdTime,
		id: smbg.val.id,
		source: smbg.val.source,
		payload: JSON.stringify(smbg.val.payload)
	};
}