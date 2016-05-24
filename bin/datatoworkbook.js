#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');
var Excel = require('exceljs');
var COL_HEADERS = require('./excel-col-headers.js').COL_HEADERS;

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
	smbgSheet.columns = COL_HEADERS.SMBG_COLS;
	var cbgSheet = wb.addWorksheet('cbg', '0000CFF');
	cbgSheet.columns = COL_HEADERS.CBG_COLS;
	var cgmSettingsSheet = wb.addWorksheet('cgmSettings', '8A2BE20');
	cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
	var bolusSheet = wb.addWorksheet('bolus', '00CFC00');
	bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
	var bloodKetoneSheet = wb.addWorksheet('bloodKetone', 'FFFFC00');
	bloodKetoneSheet.columns = COL_HEADERS.BLOOD_KETONE_COLS;

	ifs
		.pipe(jsonStream)
		.on('data', function(chunk) {
			for (var i in chunk) {
				var diaEvent = {val: chunk[i]};
				processDiaEvent(wb, diaEvent);
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


function processDiaEvent(wb, diaEvent) {
	if (diaEvent.val.type === 'smbg') {
		var smbgSheet = wb.getWorksheet('smbg');
		smbgSheet.addRow(processSmbgEvent(diaEvent));
	} else if (diaEvent.val.type === 'cbg') {
		var cbgSheet = wb.getWorksheet('cbg');
		cbgSheet.addRow(processCbgEvent(diaEvent));
	} else if (diaEvent.val.type === 'cgmSettings'){
		var cgmSettingsSheet = wb.getWorksheet('cgmSettings');
		cgmSettingsSheet.addRow(processCgmSettingsEvent(diaEvent));
	} else if (diaEvent.val.type === 'bolus') {
		var bolusSheet = wb.getWorksheet('bolus');
		bolusSheet.addRow(processBolusEvent(diaEvent));
	} else if (diaEvent.val.type === 'bloodKetone') {
		var bloodKetoneSheet = wb.getWorksheet('bloodKetone');
		bloodKetoneSheet.addRow(processBloodKetoneEvent(diaEvent));
	}
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

function processCgmSettingsEvent(cgmSettings) {
	return {
		units: cgmSettings.val.units,
		clockDriftOffset: cgmSettings.val.clockDriftOffset,
		conversionOffset: cgmSettings.val.conversionOffset,
		createdTime: cgmSettings.val.createdTime,
		deviceId: cgmSettings.val.deviceId,
		deviceTime: cgmSettings.val.deviceTime,
		guid: cgmSettings.val.guid,
		highAlerts: cgmSettings.val.highAlerts.enabled.toString(),
		highAlertsLevel: cgmSettings.val.highAlerts.level,
		highAlertsSnooze: cgmSettings.val.highAlerts.snooze,
		lowAlerts: cgmSettings.val.lowAlerts.enabled.toString(),
		lowAlertsLevel: cgmSettings.val.lowAlerts.level,
		lowAlertsSnooze: cgmSettings.val.lowAlerts.snooze,
		outOfRangeAlerts: cgmSettings.val.outOfRangeAlerts.enabled.toString(),
		outOfRangeAlertsSnooze: cgmSettings.val.outOfRangeAlerts.snooze,
		fallRateAlerts: cgmSettings.val.rateOfChangeAlerts.fallRate.enabled.toString(),
		fallRateAlertsRate: cgmSettings.val.rateOfChangeAlerts.fallRate.rate,
		riseRateAlerts: cgmSettings.val.rateOfChangeAlerts.riseRate.enabled.toString(),
		riseRateAlertsRate: cgmSettings.val.rateOfChangeAlerts.riseRate.rate,
		transmitterId: cgmSettings.val.transmitterId,
		time: cgmSettings.val.time,
		timezoneOffset: cgmSettings.val.timezoneOffset,
		uploadId: cgmSettings.val.uploadId,
		hash_uploadId: cgmSettings.val.hash_uploadId,
		_groupId: cgmSettings.val._groupId,
		hash_groupId: cgmSettings.val.hash_groupId,
		id: cgmSettings.val.id,
		source: cgmSettings.val.source,
		payload: JSON.stringify(cgmSettings.val.payload)
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

function processBloodKetoneEvent(bloodKetone) {
	return {
		units: bloodKetone.val.units,
		value: bloodKetone.val.value,
		clockDriftOffset: bloodKetone.val.clockDriftOffset,
		conversionOffset: bloodKetone.val.conversionOffset,
		createdTime: bloodKetone.val.createdTime,
		deviceId: bloodKetone.val.deviceId,
		deviceTime: bloodKetone.val.deviceTime,
		guid: bloodKetone.val.guid,
		time: bloodKetone.val.time,
		timezoneOffset: bloodKetone.val.timezoneOffset,
		uploadId: bloodKetone.val.uploadId,
		hash_uploadId: bloodKetone.val.hash_uploadId,
		_groupId: bloodKetone.val._groupId,
		hash_groupId: bloodKetone.val.hash_groupId,
		id: bloodKetone.val.id,
		source: bloodKetone.val.source,
		payload: JSON.stringify(bloodKetone.val.payload)
	};
}