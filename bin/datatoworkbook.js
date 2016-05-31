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
	if ((program.all || program.smbg) &&
		diaEvent.val.type === 'smbg') {
		
		var smbgSheet = wb.getWorksheet('smbg');
		smbgSheet.addRow(
			processSmbgEvent(
				smbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.cbg) &&
		diaEvent.val.type === 'cbg') {
		
		var cbgSheet = wb.getWorksheet('cbg');
		cbgSheet.addRow(
			processCbgEvent(
				cbgSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.cgmSettings) &&
		diaEvent.val.type === 'cgmSettings'){
		
		var cgmSettingsSheet = wb.getWorksheet('cgmSettings');
		cgmSettingsSheet.addRow(
			processCgmSettingsEvent(
				cgmSettingsSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.bolus) &&
		diaEvent.val.type === 'bolus') {
		
		var bolusSheet = wb.getWorksheet('bolus');
		bolusSheet.addRow(
			processBolusEvent(
				bolusSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.basal) &&
		diaEvent.val.type === 'basal') {

		var basalSheet = wb.getWorksheet('basal');
		processBasalEvent(
			basalSheet,
			diaEvent);

	} else if (diaEvent.val.type === 'pumpSettings') {
		
		processPumpSettingsEvent(
			wb,
			diaEvent);

	} else if ((program.all || program.bloodKetone) &&
		diaEvent.val.type === 'bloodKetone') {
		
		var bloodKetoneSheet = wb.getWorksheet('bloodKetone');
		bloodKetoneSheet.addRow(
			processBloodKetoneEvent(
				bloodKetoneSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.wizard) &&
		diaEvent.val.type === 'wizard') {

		var wizardSheet = wb.getWorksheet('wizard');
		wizardSheet.addRow(
			processWizardEvent(
				wizardSheet.lastRow.getCell('index').value,
				diaEvent));

	} else if ((program.all || program.upload) && 
		diaEvent.val.type === 'upload') {

		var uploadSheet = wb.getWorksheet('upload');
		processUploadEvent(
			uploadSheet,
			diaEvent);

	} else if ((program.all || program.deviceEvent) &&
		diaEvent.val.type === 'deviceEvent') {
		
		var deviceEventSheet = wb.getWorksheet('deviceEvent');
		processDeviceEvent(
			deviceEventSheet,
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

function processBasalEvent(sheet, basal) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	addBasalRow(sheet, basal.val, index, group, null);
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
		wizard.val.insulinSensitivity *= BG_CONVERSION;
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
				deviceManufacturer: (upload.val.deviceManufacturers
										&& upload.val.deviceManufacturers.length > 0) ?
										upload.val.deviceManufacturers[0] : null,
				deviceModel: upload.val.payload.devices[i].deviceModel,
				deviceSerialNumber: upload.val.payload.devices[i].deviceSerialNumber,
				deviceTag: (upload.val.deviceTags
										&& upload.val.deviceTags.length > 0) ?
										upload.val.deviceTags[0] : null,
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
			deviceManufacturer: (upload.val.deviceManufacturers
									&& upload.val.deviceManufacturers.length > 0) ?
									upload.val.deviceManufacturers[0] : null,
			deviceModel: upload.val.deviceModel,
			// Some devices (such as HealthKit_DexG5) do not have a
			// serial number, so it is possible for the deviceSN to
			// be null.
			deviceSerialNumber: upload.val.deviceSerialNumber || null,
			deviceTag: (upload.val.deviceTags
						&& upload.val.deviceTags.length > 0) ?
						upload.val.deviceTags[0] : null,
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

function processDeviceEvent(sheet, deviceEvent) {

	var lastIndex = sheet.lastRow.getCell('index').value;
	var index = (lastIndex === 'Index' ? 1 : (lastIndex+1));

	var lastGroup = sheet.lastRow.getCell('group').value;
	var group = (lastGroup === 'Group' ? 1 : (lastGroup+1));

	if (deviceEvent.val.subType === 'status') {

		var deviceEventRow = {
			index: index,
			group: group,
			subType: deviceEvent.val.subType,
			status: deviceEvent.val.status,
			duration: deviceEvent.val.duration,
			expectedDuration: deviceEvent.val.expectedDuration,
			reasonSuspended: deviceEvent.val.reason.suspended,
			reasonResumed: deviceEvent.val.reason.resumed,
			source: deviceEvent.val.source,
			deviceTime: deviceEvent.val.deviceTime,
			time: deviceEvent.val.time,
			timezoneOffset: deviceEvent.val.timezoneOffset,
			clockDriftOffset: deviceEvent.val.clockDriftOffset,
			conversionOffset: deviceEvent.val.conversionOffset,
			id: deviceEvent.val.id,
			createdTime: deviceEvent.val.createdTime,
			hash_uploadId: deviceEvent.val.hash_uploadId,
			hash_groupId: deviceEvent.val.hash_groupId,
			deviceId: deviceEvent.val.deviceId,
			payload: JSON.stringify(deviceEvent.val.payload),
			guid: deviceEvent.val.guid,
			uploadId: deviceEvent.val.uploadId,
			_groupId: deviceEvent.val._groupId
		};

		sheet.addRow(deviceEventRow);

	} else {

		if (program.mgdL 
			&& typeof deviceEvent.val.units === 'string'
			&& deviceEvent.val.units !== 'mg/dL') {
			
			deviceEvent.val.units = 'mg/dL';
			deviceEvent.val.value *= BG_CONVERSION;
		}

		var deviceEventRow = {
			index: index,
			group: group,
			subType: deviceEvent.val.subType,
			alarmType: deviceEvent.val.alarmType,
			units: deviceEvent.val.units,
			value: deviceEvent.val.value,
			volume: deviceEvent.val.volume,
   			timeChangeFrom: 
   				deviceEvent.val.change ? 
   					deviceEvent.val.change.from : null,
   			timeChangeTo:  
   				deviceEvent.val.change ? 
   					deviceEvent.val.change.to : null,
   			timeChangeAgent:  
   				deviceEvent.val.change ? 
   					deviceEvent.val.change.agent : null,
   			timeChangeReasons:  
   				(deviceEvent.val.change
   				&& deviceEvent.val.change.reasons) ? 
   					deviceEvent.val.change.reasons.toString() : null,
   			timeChangeTimezone:  
   				deviceEvent.val.change ? 
   					deviceEvent.val.change.timezone : null,
			primeTarget: deviceEvent.val.primeTarget,
			source: deviceEvent.val.source,
			deviceTime: deviceEvent.val.deviceTime,
			time: deviceEvent.val.time,
			timezoneOffset: deviceEvent.val.timezoneOffset,
			clockDriftOffset: deviceEvent.val.clockDriftOffset,
			conversionOffset: deviceEvent.val.conversionOffset,
			id: deviceEvent.val.id,
			createdTime: deviceEvent.val.createdTime,
			hash_uploadId: deviceEvent.val.hash_uploadId,
			hash_groupId: deviceEvent.val.hash_groupId,
			deviceId: deviceEvent.val.deviceId,
			payload: JSON.stringify(deviceEvent.val.payload),
			guid: deviceEvent.val.guid,
			uploadId: deviceEvent.val.uploadId,
			_groupId: deviceEvent.val._groupId
		}

		sheet.addRow(deviceEventRow);

		if (typeof deviceEvent.val.status === 'string') {
			sheet.lastRow.getCell('status').value = deviceEvent.val.status;
		} else if (typeof deviceEvent.val.status === 'object') {
			index++;

			var statusEventRow = {
				index: index,
				group: group,
				subType: deviceEvent.val.status.subType,
				status: deviceEvent.val.status.status,
				duration: deviceEvent.val.status.duration,
				expectedDuration: deviceEvent.val.status.expectedDuration,
				reasonSuspended: deviceEvent.val.status.reason.suspended,
				reasonResumed: deviceEvent.val.status.reason.resumed,
				source: deviceEvent.val.status.source,
				deviceTime: deviceEvent.val.status.deviceTime,
				time: deviceEvent.val.status.time,
				timezoneOffset: deviceEvent.val.status.timezoneOffset,
				clockDriftOffset: deviceEvent.val.status.clockDriftOffset,
				conversionOffset: deviceEvent.val.status.conversionOffset,
				id: deviceEvent.val.status.id,
				createdTime: deviceEvent.val.status.createdTime,
				hash_uploadId: deviceEvent.val.status.hash_uploadId,
				hash_groupId: deviceEvent.val.status.hash_groupId,
				deviceId: deviceEvent.val.status.deviceId,
				payload: JSON.stringify(deviceEvent.val.status.payload),
				guid: deviceEvent.val.status.guid,
				uploadId: deviceEvent.val.status.uploadId,
				_groupId: deviceEvent.val.status._groupId
			};

			sheet.addRow(statusEventRow);
		}
	}

}