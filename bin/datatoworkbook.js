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
	.option('-a, --all', 'Create all pages.')
	.option('--smbg', 'Create smbg page.')
	.option('--cbg', 'Create cbg page.')
	.option('--cgmSettings', 'Create cgm settings page.')
	.option('--bolus', 'Create bolus page.')
	.option('--basal', 'Create basal page.')
	.option('--basalSchedules', 'Create basal schedules page.')
	.option('--bgTarget', 'Create BG target page.')
	.option('--carbRatio', 'Create carb ratio page.')
	.option('--insulinSensitivity', 'Create insulin sensitivity page.')
	.option('--bloodKetone', 'Create blood ketone page.')
	.option('--wizard', 'Create wizard page.')
	.option('--upload', 'Create upload page.')
	.option('--deviceEvent', 'Create device event page.')
	.option('-v, --verbose', 'Verbose output.')
	.parse(process.argv);

convertToWorkbook(function() {});

function convertToWorkbook(callback) {
	if (program.verbose) {
		console.log(chalk.green.bold('Converting to spreadsheet...'));
	}

	var ifs = makeInFileStream();

	var jsonStream = JSONStream.parse();

	if (program.all || program.smbg || program.cbg || program.cgmSettings
		|| program.bolus || program.basal || program.basalSchedules
		|| program.bgTarget || program.carbRatio || program.insulinSensitivity
		|| program.bloodKetone || program.wizard || program.upload
		|| program.deviceEvent) {
		var wb = makeWorkbook();
	} else {
		console.error(chalk.red.bold('Must select at lease one data type.'));
		process.exit(1);
	}
	
	if (program.all || program.smbg) {
		var smbgSheet = wb.addWorksheet('smbg', 'FFC0000');
		smbgSheet.columns = COL_HEADERS.SMBG_COLS;
	}
	
	if (program.all || program.cbg) {
		var cbgSheet = wb.addWorksheet('cbg', '0000CFF');
		cbgSheet.columns = COL_HEADERS.CBG_COLS;		
	}

	if (program.all || program.cgmSettings) {
		var cgmSettingsSheet = wb.addWorksheet('cgmSettings', '0000688');
		cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
	}
	
	if (program.all || program.bolus) {
		var bolusSheet = wb.addWorksheet('bolus', '00CFC00');
		bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
	}

	if (program.all || program.basal) {
		var basalSheet = wb.addWorksheet('basal', '0808000');
		basalSheet.columns = COL_HEADERS.BASAL_COLS;
	}
	
	if (program.all || program.basalSchedules) {
		var basalScheduleSheet = wb.addWorksheet('basalSchedules', '0068600');
		basalScheduleSheet.columns = COL_HEADERS.BASAL_SCHEDULE_COLS;
	}

	if (program.all || program.bgTarget) {
		var bgTargetSheet = wb.addWorksheet('bgTarget', '0068600');
		bgTargetSheet.columns = COL_HEADERS.BG_TARGET_COLS;
	}
	
	if (program.all || program.carbRatio) {
		var carbRatioSheet = wb.addWorksheet('carbRatio', '0068600');
		carbRatioSheet.columns = COL_HEADERS.CARB_RATIO_COLS;
	}

	if (program.all || program.insulinSensitivity) {
		var insulinSensitivitySheet = wb.addWorksheet('insulinSensitivity', '0068600');
		insulinSensitivitySheet.columns = COL_HEADERS.INSULIN_SENSITIVITY_COLS;
	}
	
	if (program.all || program.bloodKetone) {
		var bloodKetoneSheet = wb.addWorksheet('bloodKetone', 'FFFFC00');
		bloodKetoneSheet.columns = COL_HEADERS.BLOOD_KETONE_COLS;
	}

	if (program.all || program.wizard) {
		var wizardSheet = wb.addWorksheet('wizard', 'FFC03FF');
		wizardSheet.columns = COL_HEADERS.WIZARD_COLS;
	}

	if (program.all || program.upload) {
		var uploadSheet = wb.addWorksheet('upload', '0800000');
		uploadSheet.columns = COL_HEADERS.UPLOAD_COLS;
	}

	if (program.all || program.deviceEvent) {
		var deviceEventSheet = wb.addWorksheet('deviceEvent', '000FFFF');
		deviceEventSheet.columns = COL_HEADERS.DEVICE_EVENT_COLS;
	}

	ifs
		.pipe(jsonStream)
		.on('data', function(chunk) {
			for (var i in chunk) {
				var diaEvent = chunk[i];
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
	if ((program.all || program.smbg) &&
		diaEvent.type === 'smbg') {
		
		var smbgSheet = wb.getWorksheet('smbg');
		smbgSheet.addRow(
			processSmbgEvent(
				smbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.cbg) &&
		diaEvent.type === 'cbg') {
		
		var cbgSheet = wb.getWorksheet('cbg');
		cbgSheet.addRow(
			processCbgEvent(
				cbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.cgmSettings) &&
		diaEvent.type === 'cgmSettings'){
		
		var cgmSettingsSheet = wb.getWorksheet('cgmSettings');
		cgmSettingsSheet.addRow(
			processCgmSettingsEvent(
				cgmSettingsSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.bolus) &&
		diaEvent.type === 'bolus') {
		
		var bolusSheet = wb.getWorksheet('bolus');
		bolusSheet.addRow(
			processBolusEvent(
				bolusSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.basal) &&
		diaEvent.type === 'basal') {

		var basalSheet = wb.getWorksheet('basal');
		processBasalEvent(
			basalSheet,
			diaEvent);

	} else if (diaEvent.type === 'pumpSettings') {
		
		processPumpSettingsEvent(
			wb,
			diaEvent);

	} else if ((program.all || program.bloodKetone) &&
		diaEvent.type === 'bloodKetone') {
		
		var bloodKetoneSheet = wb.getWorksheet('bloodKetone');
		bloodKetoneSheet.addRow(
			processBloodKetoneEvent(
				bloodKetoneSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.wizard) &&
		diaEvent.type === 'wizard') {

		var wizardSheet = wb.getWorksheet('wizard');
		wizardSheet.addRow(
			processWizardEvent(
				wizardSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.upload) && 
		diaEvent.type === 'upload') {

		var uploadSheet = wb.getWorksheet('upload');
		processUploadEvent(
			uploadSheet,
			diaEvent);

	} else if ((program.all || program.deviceEvent) &&
		diaEvent.type === 'deviceEvent') {
		
		var deviceEventSheet = wb.getWorksheet('deviceEvent');
		processDeviceEvent(
			deviceEventSheet,
			diaEvent);

	}
}

function processSmbgEvent(lastIndex, smbg) {
	if (program.mgdL && smbg.units !== 'mg/dL') {
		smbg.units = 'mg/dL';
		smbg.value *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		subType: smbg.subType,
		units: smbg.units,
		value: smbg.value,
		clockDriftOffset: smbg.clockDriftOffset,
		conversionOffset: smbg.conversionOffset,
		createdTime: smbg.createdTime,
		deviceId: smbg.deviceId,
		deviceTime: smbg.deviceTime,
		guid: smbg.guid,
		time: smbg.time,
		timezoneOffset: smbg.timezoneOffset,
		uploadId: smbg.uploadId,
		hash_uploadId: smbg.hash_uploadId,
		_groupId: smbg._groupId,
		hash_groupId: smbg.hash_groupId,
		id: smbg.id,
		source: smbg.source,
		payload: JSON.stringify(smbg.payload)
	};
}

function processCbgEvent(lastIndex, cbg) {
	if (program.mgdL && cbg.units !== 'mg/dL') {
		cbg.units = 'mg/dL';
		cbg.value *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		units: cbg.units,
		value: cbg.value,
		clockDriftOffset: cbg.clockDriftOffset,
		conversionOffset: cbg.conversionOffset,
		createdTime: cbg.createdTime,
		deviceId: cbg.deviceId,
		deviceTime: cbg.deviceTime,
		guid: cbg.guid,
		time: cbg.time,
		timezoneOffset: cbg.timezoneOffset,
		uploadId: cbg.uploadId,
		hash_uploadId: cbg.hash_uploadId,
		_groupId: cbg._groupId,
		hash_groupId: cbg.hash_groupId,
		id: cbg.id,
		source: cbg.source,
		payload: JSON.stringify(cbg.payload)
	};
}

function processCgmSettingsEvent(lastIndex, cgmSettings) {
	if (program.mgdL && cgmSettings.units !== 'mg/dL') {
		cgmSettings.units = 'mg/dL';
		cgmSettings.highAlerts.level *= BG_CONVERSION;
		cgmSettings.lowAlerts.level *= BG_CONVERSION;
		cgmSettings.rateOfChangeAlerts.fallRate.rate *= BG_CONVERSION;
		cgmSettings.rateOfChangeAlerts.riseRate.rate *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		units: cgmSettings.units,
		clockDriftOffset: cgmSettings.clockDriftOffset,
		conversionOffset: cgmSettings.conversionOffset,
		createdTime: cgmSettings.createdTime,
		deviceId: cgmSettings.deviceId,
		deviceTime: cgmSettings.deviceTime,
		guid: cgmSettings.guid,
		highAlerts: cgmSettings.highAlerts.enabled.toString(),
		highAlertsLevel: cgmSettings.highAlerts.level,
		highAlertsSnooze: cgmSettings.highAlerts.snooze,
		lowAlerts: cgmSettings.lowAlerts.enabled.toString(),
		lowAlertsLevel: cgmSettings.lowAlerts.level,
		lowAlertsSnooze: cgmSettings.lowAlerts.snooze,
		outOfRangeAlerts: cgmSettings.outOfRangeAlerts.enabled.toString(),
		outOfRangeAlertsSnooze: cgmSettings.outOfRangeAlerts.snooze,
		fallRateAlerts: cgmSettings.rateOfChangeAlerts.fallRate.enabled.toString(),
		fallRateAlertsRate: cgmSettings.rateOfChangeAlerts.fallRate.rate,
		riseRateAlerts: cgmSettings.rateOfChangeAlerts.riseRate.enabled.toString(),
		riseRateAlertsRate: cgmSettings.rateOfChangeAlerts.riseRate.rate,
		transmitterId: cgmSettings.transmitterId,
		time: cgmSettings.time,
		timezoneOffset: cgmSettings.timezoneOffset,
		uploadId: cgmSettings.uploadId,
		hash_uploadId: cgmSettings.hash_uploadId,
		_groupId: cgmSettings._groupId,
		hash_groupId: cgmSettings.hash_groupId,
		id: cgmSettings.id,
		source: cgmSettings.source,
		payload: JSON.stringify(cgmSettings.payload)
	};
}

function processBolusEvent(lastIndex, bolus) {
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		subType: bolus.subType,
		normal: bolus.normal,
		expectedNormal: bolus.expectedNormal,
		extended: bolus.extended,
		expectedExtended: bolus.expectedExtended,
		duration: bolus.duration,
		expectedDuration: bolus.expectedDuration,
		clockDriftOffset: bolus.clockDriftOffset,
		conversionOffset: bolus.conversionOffset,
		createdTime: bolus.createdTime,
		deviceId: bolus.deviceId,
		deviceTime: bolus.deviceTime,
		guid: bolus.guid,
		time: bolus.time,
		timezoneOffset: bolus.timezoneOffset,
		uploadId: bolus.uploadId,
		hash_uploadId: bolus.hash_uploadId,
		_groupId: bolus._groupId,
		hash_groupId: bolus.hash_groupId,
		id: bolus.id,
		source: bolus.source,
		payload: JSON.stringify(bolus.payload)
	};
}

function processBasalEvent(sheet, basal) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	addBasalRow(sheet, basal, index, group, null);
}

function addBasalRow(sheet, basal, index, group, suppressed) {
	if (!basal) return;

	var basalRow = {
		index: index,
		group: group,
		suppressed: suppressed,
		deliveryType: basal.deliveryType,
		duration: basal.duration,
		expectedDuration: basal.expectedDuration,
		percent: basal.percent,
		rate: basal.rate,
		units: 'units/hour',
		scheduleName: basal.scheduleName,
		source: basal.source,
		deviceTime: basal.deviceTime,
		time: basal.time,
		timezoneOffset: basal.timezoneOffset,
		clockDriftOffset: basal.clockDriftOffset,
		conversionOffset: basal.conversionOffset,
		id: basal.id,
		createdTime: basal.createdTime,
		hash_uploadId: basal.hash_uploadId,
		hash_groupId: basal.hash_groupId,
		deviceId: basal.deviceId,
		payload: JSON.stringify(basal.payload),
		guid: basal.guid,
		uploadId: basal.uploadId,
		_groupId: basal._groupId
	};

	sheet.addRow(basalRow);

	addBasalRow(sheet, basal.suppressed, index+1, group, 'true');
}

function processPumpSettingsEvent(wb, pumpSettings) {

	// Basal Schedules
	if (program.all || program.basalSchedules) {
		var basalSchedulesSheet = wb.getWorksheet('basalSchedules');
		processBasalSchedules(basalSchedulesSheet,
								pumpSettings);
	}
	
	// BG Targets
	if (program.all || program.bgTarget) {
		var bgTargetSheet = wb.getWorksheet('bgTarget');
		processBgTarget(bgTargetSheet,
						pumpSettings);
	}

	// Carb Ratios
	if (program.all || program.carbRatio) {
		var carbRatioSheet = wb.getWorksheet('carbRatio');
		processCarbRatio(carbRatioSheet,
							pumpSettings);		
	}

	//Insulin Sensitivities
	if (program.all || program.insulinSensitivity) {
		var insulinSensitivitySheet = wb.getWorksheet('insulinSensitivity');
		processInsulinSensitivity(insulinSensitivitySheet,
									pumpSettings);
	}
}

function processBasalSchedules(sheet, pumpSettings) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));
	

	var basalSchedules = pumpSettings.basalSchedules;
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
				activeSchedule: pumpSettings.activeSchedule,
				scheduleName: basalSchedule,
				units: 'units/hour',
				rate: basalSchedules[basalSchedule][i].rate,
				start:  basalSchedules[basalSchedule][i].start,
				source: pumpSettings.source,
				deviceTime: pumpSettings.deviceTime,
				time: pumpSettings.time,
				timezoneOffset: pumpSettings.timezoneOffset,
				clockDriftOffset: pumpSettings.clockDriftOffset,
				conversionOffset: pumpSettings.conversionOffset,
				id: pumpSettings.id,
				createdTime: pumpSettings.createdTime,
				hash_uploadId: pumpSettings.hash_uploadId,
				hash_groupId: pumpSettings.hash_groupId,
				deviceId: pumpSettings.deviceId,
				payload: JSON.stringify(pumpSettings.payload),
				guid: pumpSettings.guid,
				uploadId: pumpSettings.uploadId,
				_groupId: pumpSettings._groupId
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

	var bgTarget = pumpSettings.bgTarget ||
					pumpSettings.bgTargets;
	for (var i in bgTarget) {

		var units;
		if (program.mgdL) {
			units = 'mg/dL';
			bgTarget[i].high *= BG_CONVERSION;
			bgTarget[i].low *= BG_CONVERSION;
		} else {
			units = 'mmol/L';
		}

		var bgTargetRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: units,
			high: bgTarget[i].high,
			low: bgTarget[i].low,
			start:  bgTarget[i].start,
			source: pumpSettings.source,
			deviceTime: pumpSettings.deviceTime,
			time: pumpSettings.time,
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
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

	var carbRatio = pumpSettings.carbRatio ||
						pumpSettings.carbRatios;
	for (var i in carbRatio) {

		var carbRatioRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: 'grams/unit',
			amount: carbRatio[i].amount,
			start:  carbRatio[i].start,
			source: pumpSettings.source,
			deviceTime: pumpSettings.deviceTime,
			time: pumpSettings.time,
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
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

	var insulinSensitivity = pumpSettings.insulinSensitivity ||
								pumpSettings.insulinSensitivities;

	for (var i in insulinSensitivity) {
		var units;
		if (program.mgdL) {
			units = 'mg/dL/unit';
			insulinSensitivity[i].amount *= BG_CONVERSION;
		} else {
			units = 'mmol/L/unit';
		}

		var insulinSensitivityRow = {
			index: index,
			group: group,
			sequence: sequence,
			units: units,
			amount: insulinSensitivity[i].amount,
			start:  insulinSensitivity[i].start,
			source: pumpSettings.source,
			deviceTime: pumpSettings.deviceTime,
			time: pumpSettings.time,
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
		}
		sheet.addRow(insulinSensitivityRow);
		index++;
		sequence++;
	}
}

function processBloodKetoneEvent(lastIndex, bloodKetone) {
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		units: bloodKetone.units,
		value: bloodKetone.value,
		clockDriftOffset: bloodKetone.clockDriftOffset,
		conversionOffset: bloodKetone.conversionOffset,
		createdTime: bloodKetone.createdTime,
		deviceId: bloodKetone.deviceId,
		deviceTime: bloodKetone.deviceTime,
		guid: bloodKetone.guid,
		time: bloodKetone.time,
		timezoneOffset: bloodKetone.timezoneOffset,
		uploadId: bloodKetone.uploadId,
		hash_uploadId: bloodKetone.hash_uploadId,
		_groupId: bloodKetone._groupId,
		hash_groupId: bloodKetone.hash_groupId,
		id: bloodKetone.id,
		source: bloodKetone.source,
		payload: JSON.stringify(bloodKetone.payload)
	};
}

function processWizardEvent(lastIndex, wizard) {
	if (program.mgdL && wizard.val.units !== 'mg/dL') {
		wizard.units = 'mg/dL';
		wizard.bgInput *= BG_CONVERSION;
		if (wizard.bgTarget.target) 
			wizard.bgTarget.target *= BG_CONVERSION;
		if (wizard.bgTarget.low) 
			wizard.bgTarget.low *= BG_CONVERSION;
		if (wizard.bgTarget.high) 
			wizard.bgTarget.high *= BG_CONVERSION;
		if (wizard.bgTarget.range) 
			wizard.bgTarget.range *= BG_CONVERSION;
		wizard.insulinSensitivity *= BG_CONVERSION;
	}
	return {
		index: (lastIndex === 'Index' ? 1 : (lastIndex+1)),
		units: wizard.units,
		bgInput: wizard.bgInput,
		bgTarget: wizard.bgTarget.target,
		bgTargetLow: wizard.bgTarget.low,
		bgTargetHigh: wizard.bgTarget.high,
		bgTargetRange: wizard.bgTarget.range,
		bolus: wizard.bolus,
		carbInput: wizard.carbInput,
		insulinCarbRatio: wizard.insulinCarbRatio,
		insulinOnBoard: wizard.insulinOnBoard,
		insulinSensitivity: wizard.insulinSensitivity,
		recommendedCarb: wizard.recommended.carb,
		recommendedCorrection: wizard.recommended.correction,
		recommendedNet: wizard.recommended.net,
		source: wizard.source,
		deviceTime: wizard.deviceTime,
		time: wizard.time,
		timezoneOffset: wizard.timezoneOffset,
		clockDriftOffset: wizard.clockDriftOffset,
		conversionOffset: wizard.conversionOffset,
		id: wizard.id,
		createdTime: wizard.createdTime,
		hash_uploadId: wizard.hash_uploadId,
		hash_groupId: wizard.hash_groupId,
		deviceId: wizard.deviceId,
		payload: JSON.stringify(wizard.payload),
		guid: wizard.guid,
		uploadId: wizard.uploadId,
		_groupId: wizard._groupId
	};
}

function processUploadEvent(sheet, upload) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	var uploadRow;
	if (upload.deviceModel === 'multiple') {

		for (var i in upload.payload.devices) {

			uploadRow = {
				index: index,
				group: group,
				byUser: upload.byUser,
				deviceManufacturer: (upload.deviceManufacturers
										&& upload.deviceManufacturers.length > 0) ?
										upload.deviceManufacturers[0] : null,
				deviceModel: upload.payload.devices[i].deviceModel,
				deviceSerialNumber: upload.payload.devices[i].deviceSerialNumber,
				deviceTag: (upload.deviceTags
										&& upload.deviceTags.length > 0) ?
										upload.deviceTags[0] : null,
				computerTime: upload.computerTime,
				time: upload.time,
				timezoneOffset: upload.timezoneOffset,
				conversionOffset: upload.conversionOffset,
				timeProcessing: upload.timeProcessing,
				id: upload.id,
				createdTime: upload.createdTime,
				hash_uploadId: upload.hash_uploadId,
				hash_groupId: upload.hash_groupId,
				payload: JSON.stringify(upload.payload),
				guid: upload.guid,
				version: upload.version,
				uploadId: upload.uploadId,
				_groupId: upload._groupId
			};

			sheet.addRow(uploadRow);

			index++;
		}

	} else {

		var uploadRow = {
			index: index,
			group: group,
			byUser: upload.byUser,
			deviceManufacturer: (upload.deviceManufacturers
									&& upload.deviceManufacturers.length > 0) ?
									upload.deviceManufacturers[0] : null,
			deviceModel: upload.deviceModel,
			// Some devices (such as HealthKit_DexG5) do not have a
			// serial number, so it is possible for the deviceSN to
			// be null.
			deviceSerialNumber: upload.deviceSerialNumber || null,
			deviceTag: (upload.deviceTags
						&& upload.deviceTags.length > 0) ?
						upload.deviceTags[0] : null,
			computerTime: upload.computerTime,
			time: upload.time,
			timezoneOffset: upload.timezoneOffset,
			conversionOffset: upload.conversionOffset,
			timeProcessing: upload.timeProcessing,
			id: upload.id,
			createdTime: upload.createdTime,
			hash_uploadId: upload.hash_uploadId,
			hash_groupId: upload.hash_groupId,
			payload: JSON.stringify(upload.payload),
			guid: upload.guid,
			version: upload.version,
			uploadId: upload.uploadId,
			_groupId: upload._groupId
		};

		sheet.addRow(uploadRow);
	}

}

function processDeviceEvent(sheet, deviceEvent) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	if (deviceEvent.subType === 'status') {

		var deviceEventRow = {
			index: index,
			group: group,
			subType: deviceEvent.subType,
			status: deviceEvent.status,
			duration: deviceEvent.duration,
			expectedDuration: deviceEvent.expectedDuration,
			reasonSuspended: deviceEvent.reason.suspended,
			reasonResumed: deviceEvent.reason.resumed,
			source: deviceEvent.source,
			deviceTime: deviceEvent.deviceTime,
			time: deviceEvent.time,
			timezoneOffset: deviceEvent.timezoneOffset,
			clockDriftOffset: deviceEvent.clockDriftOffset,
			conversionOffset: deviceEvent.conversionOffset,
			id: deviceEvent.id,
			createdTime: deviceEvent.createdTime,
			hash_uploadId: deviceEvent.hash_uploadId,
			hash_groupId: deviceEvent.hash_groupId,
			deviceId: deviceEvent.deviceId,
			payload: JSON.stringify(deviceEvent.payload),
			guid: deviceEvent.guid,
			uploadId: deviceEvent.uploadId,
			_groupId: deviceEvent._groupId
		};

		sheet.addRow(deviceEventRow);

	} else {

		if (program.mgdL 
			&& typeof deviceEvent.units === 'string'
			&& deviceEvent.units !== 'mg/dL') {
			
			deviceEvent.units = 'mg/dL';
			deviceEvent.value *= BG_CONVERSION;
		}

		var deviceEventRow = {
			index: index,
			group: group,
			subType: deviceEvent.subType,
			alarmType: deviceEvent.alarmType,
			units: deviceEvent.units,
			value: deviceEvent.value,
			volume: deviceEvent.volume,
   			timeChangeFrom: 
   				deviceEvent.change ? 
   					deviceEvent.change.from : null,
   			timeChangeTo:  
   				deviceEvent.change ? 
   					deviceEvent.change.to : null,
   			timeChangeAgent:  
   				deviceEvent.change ? 
   					deviceEvent.change.agent : null,
   			timeChangeReasons:  
   				(deviceEvent.change
   				&& deviceEvent.change.reasons) ? 
   					deviceEvent.change.reasons.toString() : null,
   			timeChangeTimezone:  
   				deviceEvent.change ? 
   					deviceEvent.change.timezone : null,
			primeTarget: deviceEvent.primeTarget,
			source: deviceEvent.source,
			deviceTime: deviceEvent.deviceTime,
			time: deviceEvent.time,
			timezoneOffset: deviceEvent.timezoneOffset,
			clockDriftOffset: deviceEvent.clockDriftOffset,
			conversionOffset: deviceEvent.conversionOffset,
			id: deviceEvent.id,
			createdTime: deviceEvent.createdTime,
			hash_uploadId: deviceEvent.hash_uploadId,
			hash_groupId: deviceEvent.hash_groupId,
			deviceId: deviceEvent.deviceId,
			payload: JSON.stringify(deviceEvent.payload),
			guid: deviceEvent.guid,
			uploadId: deviceEvent.uploadId,
			_groupId: deviceEvent._groupId
		}

		sheet.addRow(deviceEventRow);

		if (typeof deviceEvent.status === 'string') {
			sheet.lastRow.getCell('status').value = deviceEvent.status;
		} else if (typeof deviceEvent.status === 'object') {
			index++;

			var statusEventRow = {
				index: index,
				group: group,
				subType: deviceEvent.status.subType,
				status: deviceEvent.status.status,
				duration: deviceEvent.status.duration,
				expectedDuration: deviceEvent.status.expectedDuration,
				reasonSuspended: deviceEvent.status.reason.suspended,
				reasonResumed: deviceEvent.status.reason.resumed,
				source: deviceEvent.status.source,
				deviceTime: deviceEvent.status.deviceTime,
				time: deviceEvent.status.time,
				timezoneOffset: deviceEvent.status.timezoneOffset,
				clockDriftOffset: deviceEvent.status.clockDriftOffset,
				conversionOffset: deviceEvent.status.conversionOffset,
				id: deviceEvent.status.id,
				createdTime: deviceEvent.status.createdTime,
				hash_uploadId: deviceEvent.status.hash_uploadId,
				hash_groupId: deviceEvent.status.hash_groupId,
				deviceId: deviceEvent.status.deviceId,
				payload: JSON.stringify(deviceEvent.status.payload),
				guid: deviceEvent.status.guid,
				uploadId: deviceEvent.status.uploadId,
				_groupId: deviceEvent.status._groupId
			};

			sheet.addRow(statusEventRow);
		}
	}

}