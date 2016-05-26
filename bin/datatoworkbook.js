#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');
var Excel = require('exceljs');
const COL_HEADERS = require('./excel-col-headers.js').COL_HEADERS;
const BG_CONVERSION = 18.01559;

program
	.version('0.0.1')
	.option('-i, --input <input>', 'path/to/input.json')
	.option('-o, --output <output>', 'path/to/output.xlsx')
	.option('--mgdL', 'Convert all BG values to mg/dL.')
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
	
	var cgmSettingsSheet = wb.addWorksheet('cgmSettings', '0000688');
	cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
	
	var bolusSheet = wb.addWorksheet('bolus', '00CFC00');
	bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
	
	var basalScheduleSheet = wb.addWorksheet('basalSchedules', '0068600');
	basalScheduleSheet.columns = COL_HEADERS.BASAL_SCHEDULE_COLS;

	var bgTargetSheet = wb.addWorksheet('bgTarget', '0068600');
	bgTargetSheet.columns = COL_HEADERS.BG_TARGET_COLS;
	
	var carbRatioSheet = wb.addWorksheet('carbRatio', '0068600');
	carbRatioSheet.columns = COL_HEADERS.CARB_RATIO_COLS;
	
	var insulinSensitivitySheet = wb.addWorksheet('insulinSensitivity', '0068600');
	insulinSensitivitySheet.columns = COL_HEADERS.INSULIN_SENSITIVITY_COLS;
	
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
		smbgSheet.addRow(
			processSmbgEvent(
				smbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if (diaEvent.val.type === 'cbg') {
		
		var cbgSheet = wb.getWorksheet('cbg');
		cbgSheet.addRow(
			processCbgEvent(
				cbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if (diaEvent.val.type === 'cgmSettings'){
		
		var cgmSettingsSheet = wb.getWorksheet('cgmSettings');
		cgmSettingsSheet.addRow(
			processCgmSettingsEvent(
				cgmSettingsSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if (diaEvent.val.type === 'bolus') {
		
		var bolusSheet = wb.getWorksheet('bolus');
		bolusSheet.addRow(
			processBolusEvent(
				bolusSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if (diaEvent.val.type === 'pumpSettings') {
		
		processPumpSettingsEvent(
			wb,
			diaEvent);

	} else if (diaEvent.val.type === 'bloodKetone') {
		
		var bloodKetoneSheet = wb.getWorksheet('bloodKetone');
		bloodKetoneSheet.addRow(
			processBloodKetoneEvent(
				bloodKetoneSheet.lastRow.getCell('index').value,
				diaEvent));

	}
}

function processSmbgEvent(lastIndex, smbg) {
	if (program.mgdL && smbg.val.units !== 'mg/dL') {
		smbg.val.units = 'mg/dL';
		smbg.val.value *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
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

function processCbgEvent(lastIndex, cbg) {
	if (program.mgdL && cbg.val.units !== 'mg/dL') {
		cbg.val.units = 'mg/dL';
		cbg.val.value *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
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

function processCgmSettingsEvent(lastIndex, cgmSettings) {
	if (program.mgdL && cgmSettings.val.units !== 'mg/dL') {
		cgmSettings.val.units = 'mg/dL';
		cgmSettings.val.highAlerts.level *= BG_CONVERSION;
		cgmSettings.val.lowAlerts.level *= BG_CONVERSION;
		cgmSettings.val.rateOfChangeAlerts.fallRate.rate *= BG_CONVERSION;
		cgmSettings.val.rateOfChangeAlerts.riseRate.rate *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
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

function processBolusEvent(lastIndex, bolus) {
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		subType: bolus.val.subType,
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

function processPumpSettingsEvent(ws, pumpSettings) {

	// Basal Schedules
	var basalSchedulesSheet = ws.getWorksheet('basalSchedules');
	processBasalSchedules(basalSchedulesSheet,
							pumpSettings);

	// BG Targets
	var bgTargetSheet = ws.getWorksheet('bgTarget');
	processBgTarget(bgTargetSheet,
					pumpSettings);

	// Carb Ratios
	var carbRatioSheet = ws.getWorksheet('carbRatio');
	processCarbRatio(carbRatioSheet,
						pumpSettings);

	//Insulin Sensitivities
	var insulinSensitivitySheet = ws.getWorksheet('insulinSensitivity');
	processInsulinSensitivity(insulinSensitivitySheet,
								pumpSettings);
}

function processBasalSchedules(sheet, pumpSettings) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));
	

	var basalSchedules = pumpSettings.val.basalSchedules;
	for (var basalSchedule in basalSchedules) {
		
		var sequence = 1;

		for (var i in basalSchedules[basalSchedule]) {
			var basalScheduleRow = {
				index: index,
				group: group,
				sequence: sequence,
				activeSchedule: pumpSettings.val.activeSchedule,
				scheduleName: basalSchedule,
				units: 'units/hour',
				rate: basalSchedules[basalSchedule][i].rate,
				start:  basalSchedules[basalSchedule][i].start,
				source: pumpSettings.val.source,
				deviceTime: pumpSettings.val.deviceTime,
				time: pumpSettings.val.time,
				timezoneOffset: pumpSettings.val.timezoneOffset,
				clockDriftOffset: pumpSettings.val.clockDriftOffset,
				conversionOffset: pumpSettings.val.conversionOffset,
				id: pumpSettings.val.id,
				createdTime: pumpSettings.val.createdTime,
				hash_uploadId: pumpSettings.val.hash_uploadId,
				hash_groupId: pumpSettings.val.hash_groupId,
				deviceId: pumpSettings.val.deviceId,
				payload: JSON.stringify(pumpSettings.val.payload),
				guid: pumpSettings.val.guid,
				uploadId: pumpSettings.val.uploadId,
				_groupId: pumpSettings.val._groupId
			}
			sheet.addRow(basalScheduleRow);
			index++;
			sequence++;
		}
	}
}

function processBgTarget(sheet, pumpSettings, units) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));
	
	var sequence = 1;

	var bgTarget = pumpSettings.val.bgTarget ||
					pumpSettings.val.bgTargets;
	for (var i in bgTarget) {

		var bgTargetRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: 'mg/dL',
			high: bgTarget[i].high * BG_CONVERSION,
			low: bgTarget[i].low * BG_CONVERSION,
			start:  bgTarget[i].start,
			source: pumpSettings.val.source,
			deviceTime: pumpSettings.val.deviceTime,
			time: pumpSettings.val.time,
			timezoneOffset: pumpSettings.val.timezoneOffset,
			clockDriftOffset: pumpSettings.val.clockDriftOffset,
			conversionOffset: pumpSettings.val.conversionOffset,
			id: pumpSettings.val.id,
			createdTime: pumpSettings.val.createdTime,
			hash_uploadId: pumpSettings.val.hash_uploadId,
			hash_groupId: pumpSettings.val.hash_groupId,
			deviceId: pumpSettings.val.deviceId,
			payload: JSON.stringify(pumpSettings.val.payload),
			guid: pumpSettings.val.guid,
			uploadId: pumpSettings.val.uploadId,
			_groupId: pumpSettings.val._groupId
		}
		sheet.addRow(bgTargetRow);
		index++;
		sequence++;
	}
}

function processCarbRatio(sheet, pumpSettings) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));
	
	var sequence = 1;

	var carbRatio = pumpSettings.val.carbRatio ||
						pumpSettings.val.carbRatios;
	for (var i in carbRatio) {

		var carbRatioRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: 'grams/unit',
			amount: carbRatio[i].amount,
			start:  carbRatio[i].start,
			source: pumpSettings.val.source,
			deviceTime: pumpSettings.val.deviceTime,
			time: pumpSettings.val.time,
			timezoneOffset: pumpSettings.val.timezoneOffset,
			clockDriftOffset: pumpSettings.val.clockDriftOffset,
			conversionOffset: pumpSettings.val.conversionOffset,
			id: pumpSettings.val.id,
			createdTime: pumpSettings.val.createdTime,
			hash_uploadId: pumpSettings.val.hash_uploadId,
			hash_groupId: pumpSettings.val.hash_groupId,
			deviceId: pumpSettings.val.deviceId,
			payload: JSON.stringify(pumpSettings.val.payload),
			guid: pumpSettings.val.guid,
			uploadId: pumpSettings.val.uploadId,
			_groupId: pumpSettings.val._groupId
		}
		sheet.addRow(carbRatioRow);
		index++;
		sequence++;
	}
}

function processInsulinSensitivity(sheet, pumpSettings) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));
	
	var sequence = 1;

	var insulinSensitivity = pumpSettings.val.insulinSensitivity ||
								pumpSettings.val.insulinSensitivities;
	for (var i in insulinSensitivity) {

		var insulinSensitivityRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: 'mg/dL/unit',
			amount: insulinSensitivity[i].amount * BG_CONVERSION,
			start:  insulinSensitivity[i].start,
			source: pumpSettings.val.source,
			deviceTime: pumpSettings.val.deviceTime,
			time: pumpSettings.val.time,
			timezoneOffset: pumpSettings.val.timezoneOffset,
			clockDriftOffset: pumpSettings.val.clockDriftOffset,
			conversionOffset: pumpSettings.val.conversionOffset,
			id: pumpSettings.val.id,
			createdTime: pumpSettings.val.createdTime,
			hash_uploadId: pumpSettings.val.hash_uploadId,
			hash_groupId: pumpSettings.val.hash_groupId,
			deviceId: pumpSettings.val.deviceId,
			payload: JSON.stringify(pumpSettings.val.payload),
			guid: pumpSettings.val.guid,
			uploadId: pumpSettings.val.uploadId,
			_groupId: pumpSettings.val._groupId
		}
		sheet.addRow(insulinSensitivityRow);
		index++;
		sequence++;
	}
}

function processBloodKetoneEvent(lastIndex, bloodKetone) {
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
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