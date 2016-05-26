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

	var wizardSheet = wb.addWorksheet('wizard', 'FFC03FF');
	wizardSheet.columns = COL_HEADERS.WIZARD_COLS;

	var uploadSheet = wb.addWorksheet('upload', '0800000');
	uploadSheet.columns = COL_HEADERS.UPLOAD_COLS;

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

	} else if (diaEvent.val.type === 'wizard') {

		var wizardSheet = wb.getWorksheet('wizard');
		wizardSheet.addRow(
			processWizardEvent(
				wizardSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if (diaEvent.val.type === 'upload') {

		var uploadSheet = wb.getWorksheet('upload');
		processUploadEvent(
			uploadSheet,
			diaEvent);

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
		// PLEASE VERIFY IN CODE REVIEW
		// If there are no values for a particular schedule
		// (i.e. "pattern a":[]) then there will be no rows
		// representing that particular schedule in the output 
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

function processWizardEvent(lastIndex, wizard) {
	if (program.mgdL && wizard.val.units !== 'mg/dL') {
		wizard.val.units = 'mg/dL';
		wizard.val.bgInput *= BG_CONVERSION;
		if (wizard.val.bgTarget.target) 
			wizard.val.bgTarget.target *= BG_CONVERSION;
		if (wizard.val.bgTarget.low) 
			wizard.val.bgTarget.low *= BG_CONVERSION;
		if (wizard.val.bgTarget.high) 
			wizard.val.bgTarget.high *= BG_CONVERSION;
		if (wizard.val.bgTarget.range) 
			wizard.val.bgTarget.range *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		units: wizard.val.units,
		bgInput: wizard.val.bgInput,
		bgTarget: wizard.val.bgTarget.target,
		bgTargetLow: wizard.val.bgTarget.low,
		bgTargetHigh: wizard.val.bgTarget.high,
		bgTargetRange: wizard.val.bgTarget.range,
		bolus: wizard.val.bolus,
		carbInput: wizard.val.carbInput,
		insulinCarbRatio: wizard.val.insulinCarbRatio,
		insulinOnBoard: wizard.val.insulinOnBoard,
		insulinSensitivity: wizard.val.insulinSensitivity,
		recommendedCarb: wizard.val.recommended.carb,
		recommendedCorrection: wizard.val.recommended.correction,
		recommendedNet: wizard.val.recommended.net,
		source: wizard.val.source,
		deviceTime: wizard.val.deviceTime,
		time: wizard.val.time,
		timezoneOffset: wizard.val.timezoneOffset,
		clockDriftOffset: wizard.val.clockDriftOffset,
		conversionOffset: wizard.val.conversionOffset,
		id: wizard.val.id,
		createdTime: wizard.val.createdTime,
		hash_uploadId: wizard.val.hash_uploadId,
		hash_groupId: wizard.val.hash_groupId,
		deviceId: wizard.val.deviceId,
		payload: JSON.stringify(wizard.val.payload),
		guid: wizard.val.guid,
		uploadId: wizard.val.uploadId,
		_groupId: wizard.val._groupId
	};
}

// 	UPLOAD_COLS: [
//         { header: 'Index', key: 'index', width: 10 },
//         { header: 'Group', key: 'group', width: 10 },
//         { header: 'Uploaded by User', key: 'byUser', width: 10 },
//         { header: 'Device Manufacturer', key: 'deviceManufacturer', width: 10 },
//         { header: 'Device Model', key: 'deviceModel', width: 10 },
//         { header: 'Device Serial Number', key: 'deviceSerialNumber', width: 10 },
//         { header: 'Device Tag', key: 'deviceTag', width: 10 },
//         { header: 'Computer Time', key: 'computerTime', width: 10 },
//         { header: 'Time', key: 'time', width: 10 },
//         { header: 'Timezone Offset', key: 'timezoneOffset', width: 10 },
//         { header: 'Conversion Offset', key: 'conversionOffset', width: 10 },
//         { header: 'Time Processing', key: 'timeProcessing', width: 10 },
//         { header: 'Id', key: 'id', width: 10 },
//         { header: 'Created Time', key: 'createdTime', width: 10 },
//         { header: 'Hash Upload Id', key: 'hash_uploadId', width: 10 },
//         { header: 'Hash Group Id', key: 'hash_groupId', width: 10 },
//         { header: 'Payload', key: 'payload', width: 10 },
//         { header: 'GUID', key: 'guid', width: 10 },
//         { header: 'Version', key: 'version', width: 10 },
//         { header: ' ', key: 'uploadId', width: 10 },
//         { header: ' ', key: '_groupId', width: 10 }
//     ]
function processUploadEvent(sheet, upload) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	var uploadRow;
	if (upload.val.deviceModel === 'multiple') {

		for (var i in upload.val.payload.devices) {

			uploadRow = {
				index: index,
				group: group,
				byUser: upload.val.byUser,
				deviceManufacturer: upload.val.deviceManufacturers[0],
				deviceModel: upload.val.payload.devices[i].deviceModel,
				deviceSerialNumber: upload.val.payload.devices[i].deviceSerialNumber,
				deviceTag: upload.val.deviceTags[0],
				computerTime: upload.val.computerTime,
				time: upload.val.time,
				timezoneOffset: upload.val.timezoneOffset,
				conversionOffset: upload.val.conversionOffset,
				timeProcessing: upload.val.timeProcessing,
				id: upload.val.id,
				createdTime: upload.val.createdTime,
				hash_uploadId: upload.val.hash_uploadId,
				hash_groupId: upload.val.hash_groupId,
				payload: JSON.stringify(upload.val.payload),
				guid: upload.val.guid,
				version: upload.val.version,
				uploadId: upload.val.uploadId,
				_groupId: upload.val._groupId
			};

			sheet.addRow(uploadRow);

			index++;
		}

	} else {

		var uploadRow = {
			index: index,
			group: group,
			byUser: upload.val.byUser,
			deviceManufacturer: upload.val.deviceManufacturers[0],
			deviceModel: upload.val.deviceModel,
			// Some devices (such as HealthKit_DexG5) do not have a
			// serial number, so it is possible for the deviceSN to
			// be null.
			deviceSerialNumber: upload.val.deviceSerialNumber || null,
			deviceTag: upload.val.deviceTags[0],
			computerTime: upload.val.computerTime,
			time: upload.val.time,
			timezoneOffset: upload.val.timezoneOffset,
			conversionOffset: upload.val.conversionOffset,
			timeProcessing: upload.val.timeProcessing,
			id: upload.val.id,
			createdTime: upload.val.createdTime,
			hash_uploadId: upload.val.hash_uploadId,
			hash_groupId: upload.val.hash_groupId,
			payload: JSON.stringify(upload.val.payload),
			guid: upload.val.guid,
			version: upload.val.version,
			uploadId: upload.val.uploadId,
			_groupId: upload.val._groupId
		};

		sheet.addRow(uploadRow);
	}

}