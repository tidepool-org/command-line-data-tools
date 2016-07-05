#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');
var sort = require('sort-stream2');
var Excel = require('exceljs');
const COL_HEADERS = require('./excel-col-headers.js').COL_HEADERS;
const BG_CONVERSION = 18.01559;

program
	.version('0.0.1')
	.arguments('<output>')
	.option('-i, --input <input>', 'path/to/input.json')
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
	.action(function(output) {
		program.output = output;
	})
	.parse(process.argv);

convertToWorkbook(function() {});

function convertToWorkbook(callback) {
	if (program.verbose) {
		console.log(chalk.green.bold('Converting to spreadsheet...'));
	}

	var ifs = makeInFileStream();

	var jsonStream = JSONStream.parse('*');

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
	
	var indexes = {};

	if (program.all || program.smbg) {
		var smbgSheet = wb.addWorksheet('smbg', { tabColor: 'FFC0000' });
		smbgSheet.columns = COL_HEADERS.SMBG_COLS;
		indexes.smbg = {
			index: 1
		};
	}
	
	if (program.all || program.cbg) {
		var cbgSheet = wb.addWorksheet('cgm', { tabColor: '0000CFF' });
		cbgSheet.columns = COL_HEADERS.CBG_COLS;
		indexes.cbg = {
			index: 1
		};
	}

	if (program.all || program.cgmSettings) {
		var cgmSettingsSheet = wb.addWorksheet('cgmSettings', { tabColor: '0000688' });
		cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
		indexes.cgmSettings = {
			index: 1
		};
	}
	
	if (program.all || program.bolus) {
		var bolusSheet = wb.addWorksheet('bolus', { tabColor: '00CFC00' });
		bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
		indexes.bolus = {
			index: 1
		};
	}

	if (program.all || program.wizard) {
		var wizardSheet = wb.addWorksheet('wizard', { tabColor: 'FFC03FF' });
		wizardSheet.columns = COL_HEADERS.WIZARD_COLS;
		indexes.wizard = {
			index: 1
		};
	}

	if (program.all || program.basal) {
		var basalSheet = wb.addWorksheet('basal', { tabColor: '0808000' });
		basalSheet.columns = COL_HEADERS.BASAL_COLS;
		indexes.basal = {
			index: 1,
			group: 1
		};
	}
	
	if (program.all || program.basalSchedules) {
		var basalScheduleSheet = wb.addWorksheet('basalSchedules', { tabColor: '0068600' });
		basalScheduleSheet.columns = COL_HEADERS.BASAL_SCHEDULE_COLS;
		indexes.basalSchedule = {
			index: 1,
			group: 1
		};
	}

	if (program.all || program.bgTarget) {
		var bgTargetSheet = wb.addWorksheet('bgTarget', { tabColor: '0068600' });
		bgTargetSheet.columns = COL_HEADERS.BG_TARGET_COLS;
		indexes.bgTarget = {
			index: 1,
			group: 1
		};
	}
	
	if (program.all || program.carbRatio) {
		var carbRatioSheet = wb.addWorksheet('carbRatio', { tabColor: '0068600' });
		carbRatioSheet.columns = COL_HEADERS.CARB_RATIO_COLS;
		indexes.carbRatio = {
			index: 1,
			group: 1
		}
	}

	if (program.all || program.insulinSensitivity) {
		var insulinSensitivitySheet = wb.addWorksheet('insulinSensitivity', { tabColor: '0068600' });
		insulinSensitivitySheet.columns = COL_HEADERS.INSULIN_SENSITIVITY_COLS;
		indexes.insulinSensitivity = {
			index: 1,
			group: 1
		}
	}
	
	if (program.all || program.bloodKetone) {
		var bloodKetoneSheet = wb.addWorksheet('bloodKetone', { tabColor: 'FFFFC00' });
		bloodKetoneSheet.columns = COL_HEADERS.BLOOD_KETONE_COLS;
		indexes.bloodKetone = {
			index: 1
		};
	}

	if (program.all || program.upload) {
		var uploadSheet = wb.addWorksheet('upload', { tabColor: '0800000' });
		uploadSheet.columns = COL_HEADERS.UPLOAD_COLS;
		indexes.upload = {
			index: 1,
			group: 1
		};
	}

	if (program.all || program.deviceEvent) {
		var deviceEventSheet = wb.addWorksheet('deviceEvent and suspend', { tabColor: '000FFFF' });
		deviceEventSheet.columns = COL_HEADERS.DEVICE_EVENT_COLS;
		indexes.deviceEvent = {
			index: 1,
			group: 1
		};
	}

	ifs.pipe(jsonStream);

	jsonStream
		.on('data', function(chunk) {
			processDiaEvent(wb, indexes, chunk);
		})
		.on('end', function() {
			wb.commit()
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
	return new Excel.stream.xlsx.WorkbookWriter({
		filename: program.output
	});
}

function dateForDateString(datetime) {
	return new Date(datetime)
				.toString();
}

function timeForDateString(datetime) {
	return new Date(datetime)
				.toTimeString();
}

function processDiaEvent(wb, indexes, diaEvent) {
	if ((program.all || program.smbg) &&
		diaEvent.type === 'smbg') {
		
		var smbgSheet = wb.getWorksheet('smbg');
		smbgSheet.addRow(
			processSmbgEvent(
				indexes.smbg.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.cbg) &&
		diaEvent.type === 'cbg') {
		
		var cbgSheet = wb.getWorksheet('cgm');
		cbgSheet.addRow(
			processCbgEvent(
				indexes.cbg.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.cgmSettings) &&
		diaEvent.type === 'cgmSettings'){
		
		var cgmSettingsSheet = wb.getWorksheet('cgmSettings');
		cgmSettingsSheet.addRow(
			processCgmSettingsEvent(
				indexes.cgmSettings.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.bolus) &&
		diaEvent.type === 'bolus') {
		
		var bolusSheet = wb.getWorksheet('bolus');
		bolusSheet.addRow(
			processBolusEvent(
				indexes.bolus.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.basal) &&
		diaEvent.type === 'basal') {

		var basalSheet = wb.getWorksheet('basal');
		processBasalEvent(
			basalSheet,
			indexes,
			diaEvent);

	} else if (diaEvent.type === 'pumpSettings') {
		
		processPumpSettingsEvent(
			wb,
			indexes,
			diaEvent);

	} else if ((program.all || program.bloodKetone) &&
		diaEvent.type === 'bloodKetone') {
		
		var bloodKetoneSheet = wb.getWorksheet('bloodKetone');
		bloodKetoneSheet.addRow(
			processBloodKetoneEvent(
				indexes.bloodKetone.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.wizard) &&
		diaEvent.type === 'wizard') {

		var wizardSheet = wb.getWorksheet('wizard');
		wizardSheet.addRow(
			processWizardEvent(
				indexes.wizard.index++,
				diaEvent))
			.commit();

	} else if ((program.all || program.upload) && 
		diaEvent.type === 'upload') {

		var uploadSheet = wb.getWorksheet('upload');
		processUploadEvent(
			uploadSheet,
			indexes,
			diaEvent);

	} else if ((program.all || program.deviceEvent) &&
		diaEvent.type === 'deviceEvent') {
		
		var deviceEventSheet = wb.getWorksheet('deviceEvent and suspend');
		processDeviceEvent(
			deviceEventSheet,
			indexes,
			diaEvent);

	}
}

function processSmbgEvent(index, smbg) {
	if (program.mgdL) {
		smbg.units = 'mg/dL';
		smbg.value *= BG_CONVERSION;
	}

	var localTime = new Date(smbg.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + smbg.timezoneOffset);

	return {
		index: index,
		subType: smbg.subType,
		units: smbg.units,
		value: smbg.value,
		clockDriftOffset: smbg.clockDriftOffset,
		conversionOffset: smbg.conversionOffset,
		createdTime: smbg.createdTime ?
			new Date(smbg.createdTime) : smbg.createdTime,
		deviceId: smbg.deviceId,
		deviceTime: new Date(smbg.deviceTime),
		guid: smbg.guid,
		localTime: localTime,
		time: new Date(smbg.time),
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

function processCbgEvent(index, cbg) {
	if (program.mgdL) {
		cbg.units = 'mg/dL';
		cbg.value *= BG_CONVERSION;
	}

	var localTime = new Date(cbg.time);
	if (cbg.timezoneOffset)
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + cbg.timezoneOffset);

	return {
		index: index,
		units: cbg.units,
		value: cbg.value,
		clockDriftOffset: cbg.clockDriftOffset,
		conversionOffset: cbg.conversionOffset,
		createdTime: cbg.createdTime ?
			new Date(cbg.createdTime) : null,
		deviceId: cbg.deviceId,
		deviceTime: cbg.deviceTime ?
			new Date(cbg.deviceTime) : null,
		guid: cbg.guid,
		localTime: localTime,
		time: new Date(cbg.time),
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

function processCgmSettingsEvent(index, cgmSettings) {
	if (program.mgdL) {
		cgmSettings.units = 'mg/dL';
		cgmSettings.highAlerts.level *= BG_CONVERSION;
		cgmSettings.lowAlerts.level *= BG_CONVERSION;
		cgmSettings.rateOfChangeAlerts.fallRate.rate *= BG_CONVERSION;
		cgmSettings.rateOfChangeAlerts.riseRate.rate *= BG_CONVERSION;
	}

	var localTime = new Date(cgmSettings.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + cgmSettings.timezoneOffset);

	return {
		index: index,
		units: cgmSettings.units,
		clockDriftOffset: cgmSettings.clockDriftOffset,
		conversionOffset: cgmSettings.conversionOffset,
		createdTime: cgmSettings.createdTime ?
			new Date(cgmSettings.createdTime) : null,
		deviceId: cgmSettings.deviceId,
		deviceTime: new Date(cgmSettings.deviceTime),
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
		localTime: localTime,
		time: new Date(cgmSettings.time),
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

function processBolusEvent(index, bolus) {
	
	var localTime = new Date(bolus.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + bolus.timezoneOffset);	

	return {
		index: index,
		subType: bolus.subType,
		normal: bolus.normal,
		expectedNormal: bolus.expectedNormal,
		extended: bolus.extended,
		expectedExtended: bolus.expectedExtended,
		duration: bolus.duration,
		expectedDuration: bolus.expectedDuration,
		clockDriftOffset: bolus.clockDriftOffset,
		conversionOffset: bolus.conversionOffset,
		createdTime: bolus.createdTime ?
			new Date(bolus.createdTime) : null,
		deviceId: bolus.deviceId,
		deviceTime: new Date(bolus.deviceTime),
		guid: bolus.guid,
		localTime: localTime,
		time: new Date(bolus.time),
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

function processBasalEvent(sheet, indexes, basal) {

	addBasalRow(sheet, basal, indexes, null);
}

function addBasalRow(sheet, basal, indexes, suppressed) {
	if (!basal) {
		++indexes.basal.group;
		return;
	}

	var localTime = new Date(basal.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + basal.timezoneOffset);

	var basalRow = {
		index: indexes.basal.index++,
		group: indexes.basal.group,
		suppressed: suppressed,
		deliveryType: basal.deliveryType,
		duration: basal.duration,
		expectedDuration: basal.expectedDuration,
		percent: basal.percent,
		rate: basal.rate,
		units: 'units/hour',
		scheduleName: basal.scheduleName,
		source: basal.source,
		deviceTime: new Date(basal.deviceTime),
		localTime: localTime,
		time: new Date(basal.time),
		timezoneOffset: basal.timezoneOffset,
		clockDriftOffset: basal.clockDriftOffset,
		conversionOffset: basal.conversionOffset,
		id: basal.id,
		createdTime: basal.createdTime ?
			new Date(basal.createdTime) : null,
		hash_uploadId: basal.hash_uploadId,
		hash_groupId: basal.hash_groupId,
		deviceId: basal.deviceId,
		payload: JSON.stringify(basal.payload),
		guid: basal.guid,
		uploadId: basal.uploadId,
		_groupId: basal._groupId
	};

	sheet.addRow(basalRow).commit();

	addBasalRow(sheet, basal.suppressed, indexes, 'true');
}

function processPumpSettingsEvent(wb, indexes, pumpSettings) {

	// Basal Schedules
	if (program.all || program.basalSchedules) {
		var basalSchedulesSheet = wb.getWorksheet('basalSchedules');
		processBasalSchedules(basalSchedulesSheet,
								indexes,
								pumpSettings);
	}
	
	// BG Targets
	if (program.all || program.bgTarget) {
		var bgTargetSheet = wb.getWorksheet('bgTarget');
		processBgTargets(bgTargetSheet,
						indexes,
						pumpSettings);
	}

	// Carb Ratios
	if (program.all || program.carbRatio) {
		var carbRatioSheet = wb.getWorksheet('carbRatio');
		processCarbRatios(carbRatioSheet,
							indexes,
							pumpSettings);		
	}

	//Insulin Sensitivities
	if (program.all || program.insulinSensitivity) {
		var insulinSensitivitySheet = wb.getWorksheet('insulinSensitivity');
		processInsulinSensitivities(insulinSensitivitySheet,
									indexes,
									pumpSettings);
	}
}

function processBasalSchedules(sheet, indexes, pumpSettings) {

	var group = indexes.basalSchedule.group++;
	

	var basalSchedules = pumpSettings.basalSchedules;
	for (var basalSchedule in basalSchedules) {
		
		var sequence = 1;

		var localTime = new Date(pumpSettings.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

		// PLEASE VERIFY IN CODE REVIEW
		// If there are no values for a particular schedule
		// (i.e. "pattern a":[]) then there will be no rows
		// representing that particular schedule in the output 
		for (var i in basalSchedules[basalSchedule]) {
			var basalScheduleRow = {
				index: indexes.basalSchedule.index++,
				group: group,
				sequence: sequence,
				activeSchedule: pumpSettings.activeSchedule,
				scheduleName: basalSchedule,
				units: 'units/hour',
				rate: basalSchedules[basalSchedule][i].rate,
				start:  basalSchedules[basalSchedule][i].start,
				source: pumpSettings.source,
				deviceTime: new Date(pumpSettings.deviceTime),
				localTime: localTime,
				time: new Date(pumpSettings.time),
				timezoneOffset: pumpSettings.timezoneOffset,
				clockDriftOffset: pumpSettings.clockDriftOffset,
				conversionOffset: pumpSettings.conversionOffset,
				id: pumpSettings.id,
				createdTime: pumpSettings.createdTime ?
					new Date(pumpSettings.createdTime) : null,
				hash_uploadId: pumpSettings.hash_uploadId,
				hash_groupId: pumpSettings.hash_groupId,
				deviceId: pumpSettings.deviceId,
				payload: JSON.stringify(pumpSettings.payload),
				guid: pumpSettings.guid,
				uploadId: pumpSettings.uploadId,
				_groupId: pumpSettings._groupId
			}
			sheet.addRow(basalScheduleRow).commit();
			sequence++;
		}
	}
}

function processBgTargets(sheet, indexes, pumpSettings) {

	if (pumpSettings.bgTarget) {
		processBgTarget(sheet, 
						pumpSettings.bgTarget,
						pumpSettings,
						indexes,
						null,
						null);
	} else if (pumpSettings.bgTargets) {
		for (var i in pumpSettings.bgTargets) {
			processBgTarget(sheet, 
									pumpSettings.bgTargets[i],
									pumpSettings,
									indexes,
									pumpSettings.activeSchedule,
									i);
		}
	}
	++indexes.bgTarget.group;
}

function processBgTarget(sheet, bgTarget, pumpSettings, 
			indexes, activeSchedule, scheduleName) {
	var sequence = 1;
	for (var i in bgTarget) {

		var units;
		if (program.mgdL) {
			units = 'mg/dL';
			if (bgTarget[i].high)
				bgTarget[i].high *= BG_CONVERSION;
			if (bgTarget[i].low)
				bgTarget[i].low *= BG_CONVERSION;
			if (bgTarget[i].target)
				bgTarget[i].target *= BG_CONVERSION;
		} else {
			units = 'mmol/L';
		}

		var localTime = new Date(pumpSettings.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

		var bgTargetRow = {
			index: indexes.bgTarget.index++,
			group: indexes.bgTarget.group,
			activeSchedule: activeSchedule,
			scheduleName: scheduleName,
			sequence: sequence,
			units: units,
			high: bgTarget[i].high,
			low: bgTarget[i].low,
			target: bgTarget[i].target,
			start:  bgTarget[i].start,
			source: pumpSettings.source,
			deviceTime: new Date(pumpSettings.deviceTime),
			localTime: localTime,
			time: new Date(pumpSettings.time),
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime ?
				new Date(pumpSettings).createdTime : null,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
		}
		sheet.addRow(bgTargetRow).commit();
		sequence++;
	}
}

function processCarbRatios(sheet, indexes, pumpSettings) {

	if (pumpSettings.carbRatio) {
		processCarbRatio(sheet, 
						pumpSettings.carbRatio, 
						pumpSettings,
						indexes, 
						null,
						null);
	} else if (pumpSettings.carbRatios) {
		for (var i in pumpSettings.carbRatios) {
			processCarbRatio(sheet, 
								pumpSettings.carbRatios[i], 
								pumpSettings,
								indexes, 
								pumpSettings.activeSchedule,
								i);
		}
	}
	++indexes.carbRatio.group;
}

function processCarbRatio(sheet, carbRatio, pumpSettings,  indexes,
							activeSchedule, scheduleName) {
	var sequence = 1;
	for (var i in carbRatio) {

		var localTime = new Date(pumpSettings.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

		var carbRatioRow = {
			index: indexes.carbRatio.index++,
			group: indexes.carbRatio.group,
			activeSchedule: activeSchedule,
			scheduleName: scheduleName,
			sequence: sequence,
			units: 'grams/unit',
			amount: carbRatio[i].amount,
			start:  carbRatio[i].start,
			source: pumpSettings.source,
			deviceTime: pumpSettings.deviceTime,
			localTime: localTime,
			time: new Date(pumpSettings.time),
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime ?
				new Date(pumpSettings.createdTime) : null,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
		}
		sheet.addRow(carbRatioRow).commit();
		sequence++;
	}
}

function processInsulinSensitivities(sheet, indexes, pumpSettings) {
	
	if (pumpSettings.insulinSensitivity) {
		processCarbRatio(sheet, 
						pumpSettings.insulinSensitivity, 
						pumpSettings,
						indexes, 
						null,
						null);
	} else if (pumpSettings.insulinSensitivities) {
		for (var i in pumpSettings.insulinSensitivities) {
			index = processCarbRatio(sheet, 
									pumpSettings.insulinSensitivities[i], 
									pumpSettings,
									indexes,
									pumpSettings.activeSchedule,
									i);
		}
	}
	++indexes.insulinSensitivity.group;
}

function processInsulinSensitivity(sheet, insulinSensitivity, pumpSettings,
					indexes, activeSchedule, scheduleName) {
	var sequence = 1;	
	for (var i in insulinSensitivity) {
		var units;
		if (program.mgdL) {
			units = 'mg/dL/unit';
			insulinSensitivity[i].amount *= BG_CONVERSION;
		} else {
			units = 'mmol/L/unit';
		}

		var localTime = new Date(pumpSettings.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

		var insulinSensitivityRow = {
			index: indexes.insulinSensitivity.index++,
			group: indexes.insulinSensitivity.group,
			activeSchedule: activeSchedule,
			scheduleName: scheduleName,
			sequence: sequence,
			units: units,
			amount: insulinSensitivity[i].amount,
			start:  insulinSensitivity[i].start,
			source: pumpSettings.source,
			deviceTime: new Date(pumpSettings.deviceTime),
			localTime: localTime,
			time: new Date(pumpSettings.time),
			timezoneOffset: pumpSettings.timezoneOffset,
			clockDriftOffset: pumpSettings.clockDriftOffset,
			conversionOffset: pumpSettings.conversionOffset,
			id: pumpSettings.id,
			createdTime: pumpSettings.createdTime ?
				new Date(pumpSettings.createdTime) : null,
			hash_uploadId: pumpSettings.hash_uploadId,
			hash_groupId: pumpSettings.hash_groupId,
			deviceId: pumpSettings.deviceId,
			payload: JSON.stringify(pumpSettings.payload),
			guid: pumpSettings.guid,
			uploadId: pumpSettings.uploadId,
			_groupId: pumpSettings._groupId
		}
		sheet.addRow(insulinSensitivityRow).commit();
		sequence++;
	}
}

function processBloodKetoneEvent(index, bloodKetone) {
	var localTime = new Date(bloodKetone.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + bloodKetone.timezoneOffset);	

	return {
		index: index,
		units: bloodKetone.units,
		value: bloodKetone.value,
		clockDriftOffset: bloodKetone.clockDriftOffset,
		conversionOffset: bloodKetone.conversionOffset,
		createdTime: bloodKetone.createdTime ?
			new Date(bloodKetone.createdTime) : null,
		deviceId: bloodKetone.deviceId,
		deviceTime: new Date(bloodKetone.deviceTime),
		guid: bloodKetone.guid,
		localTime: localTime,
		time: new Date(bloodKetone.time),
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

function processWizardEvent(index, wizard) {
	if (program.mgdL) {
		wizard.units = 'mg/dL';
		if (wizard.bgInput)
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

	var localTime = new Date(wizard.time);
	localTime.setUTCMinutes(
		localTime.getUTCMinutes() + wizard.timezoneOffset);

	return {
		index: index,
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
		deviceTime: new Date(wizard.deviceTime),
		localTime: localTime,
		time: new Date(wizard.time),
		timezoneOffset: wizard.timezoneOffset,
		clockDriftOffset: wizard.clockDriftOffset,
		conversionOffset: wizard.conversionOffset,
		id: wizard.id,
		createdTime: wizard.createdTime ?
			new Date(wizard.createdTime) : null,
		hash_uploadId: wizard.hash_uploadId,
		hash_groupId: wizard.hash_groupId,
		deviceId: wizard.deviceId,
		payload: JSON.stringify(wizard.payload),
		guid: wizard.guid,
		uploadId: wizard.uploadId,
		_groupId: wizard._groupId
	};
}

function processUploadEvent(sheet, indexes, upload) {

	var group = indexes.upload.group++;

	var uploadRow;
	if (upload.deviceModel === 'multiple') {

		for (var i in upload.payload.devices) {

			var localTime = new Date(upload.time);
			if (upload.timezoneOffset)
				localTime.setUTCMinutes(
					localTime.getUTCMinutes() + upload.timezoneOffset);			

			uploadRow = {
				index: indexes.upload.index++,
				group: group,
				byUser: upload.byUser,
				hash_byUser: upload.hash_byUser,
				deviceManufacturer: (upload.deviceManufacturers
										&& upload.deviceManufacturers.length > 0) ?
										upload.deviceManufacturers[0] : null,
				deviceModel: upload.payload.devices[i].deviceModel,
				deviceSerialNumber: upload.payload.devices[i].deviceSerialNumber,
				deviceTag: (upload.deviceTags
										&& upload.deviceTags.length > 0) ?
										upload.deviceTags[0] : null,
				computerTime: upload.computerTime ?
					new Date(upload.computerTime) : null,
				localTime: localTime,
				time: new Date(upload.time),
				timezoneOffset: upload.timezoneOffset,
				conversionOffset: upload.conversionOffset,
				timeProcessing: upload.timeProcessing,
				id: upload.id,
				createdTime: upload.createdTime ?
					new Date(upload.createdTime) : null,
				hash_uploadId: upload.hash_uploadId,
				hash_groupId: upload.hash_groupId,
				payload: JSON.stringify(upload.payload),
				guid: upload.guid,
				version: upload.version,
				uploadId: upload.uploadId,
				_groupId: upload._groupId
			};

			sheet.addRow(uploadRow).commit();
		}

	} else {

		var localTime = new Date(upload.time);
		if (upload.timezoneOffset)
			localTime.setUTCMinutes(
				localTime.getUTCMinutes() + upload.timezoneOffset);

		var uploadRow = {
			index: indexes.upload.index++,
			group: group,
			byUser: upload.byUser,
			hash_byUser: upload.hash_byUser,
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
			computerTime: upload.computerTime ?
				new Date(upload.computerTime) : null,
			localTime: localTime,
			time: new Date(upload.time),
			timezoneOffset: upload.timezoneOffset,
			conversionOffset: upload.conversionOffset,
			timeProcessing: upload.timeProcessing,
			id: upload.id,
			createdTime: upload.createdTime ?
				new Date(upload.createdTime) : null,
			hash_uploadId: upload.hash_uploadId,
			hash_groupId: upload.hash_groupId,
			payload: JSON.stringify(upload.payload),
			guid: upload.guid,
			version: upload.version,
			uploadId: upload.uploadId,
			_groupId: upload._groupId
		};

		sheet.addRow(uploadRow).commit();
	}

}

function processDeviceEvent(sheet, indexes, deviceEvent) {

	var group = indexes.deviceEvent.group++;

	if (deviceEvent.subType === 'status') {

		var localTime = new Date(deviceEvent.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

		var deviceEventRow = {
			index: indexes.deviceEvent.index++,
			group: group,
			subType: deviceEvent.subType,
			status: deviceEvent.status,
			duration: deviceEvent.duration,
			expectedDuration: deviceEvent.expectedDuration,
			reasonSuspended: deviceEvent.reason.suspended,
			reasonResumed: deviceEvent.reason.resumed,
			source: deviceEvent.source,
			deviceTime: new Date(deviceEvent.deviceTime),
			localTime: localTime,
			time: new Date(deviceEvent.time),
			timezoneOffset: deviceEvent.timezoneOffset,
			clockDriftOffset: deviceEvent.clockDriftOffset,
			conversionOffset: deviceEvent.conversionOffset,
			id: deviceEvent.id,
			createdTime: deviceEvent.createdTime ?
				new Date(deviceEvent.createdTime) : null,
			hash_uploadId: deviceEvent.hash_uploadId,
			hash_groupId: deviceEvent.hash_groupId,
			deviceId: deviceEvent.deviceId,
			payload: JSON.stringify(deviceEvent.payload),
			guid: deviceEvent.guid,
			uploadId: deviceEvent.uploadId,
			_groupId: deviceEvent._groupId
		};

		sheet.addRow(deviceEventRow).commit();

	} else {

		if (program.mgdL 
			&& typeof deviceEvent.units === 'string') {
			
			deviceEvent.units = 'mg/dL';
			deviceEvent.value *= BG_CONVERSION;
		}

		var localTime = new Date(deviceEvent.time);
		localTime.setUTCMinutes(
			localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

		var deviceEventRow = {
			index: indexes.deviceEvent.index++,
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
			deviceTime: new Date(deviceEvent.deviceTime),
			localTime: localTime,
			time: new Date(deviceEvent.time),
			timezoneOffset: deviceEvent.timezoneOffset,
			clockDriftOffset: deviceEvent.clockDriftOffset,
			conversionOffset: deviceEvent.conversionOffset,
			id: deviceEvent.id,
			createdTime: deviceEvent.createdTime ?
				new Date(deviceEvent.createdTime) : null,
			hash_uploadId: deviceEvent.hash_uploadId,
			hash_groupId: deviceEvent.hash_groupId,
			deviceId: deviceEvent.deviceId,
			payload: JSON.stringify(deviceEvent.payload),
			guid: deviceEvent.guid,
			uploadId: deviceEvent.uploadId,
			_groupId: deviceEvent._groupId
		}

		var statusEventRow;
		if (typeof deviceEvent.status === 'string') {
			deviceEventRow.status = deviceEvent.status;
		} else if (typeof deviceEvent.status === 'object') {
			index++;

			var localTime = new Date(deviceEvent.time);
			localTime.setUTCMinutes(
				localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

			statusEventRow = {
				index: indexes.deviceEvent.index++,
				group: group,
				subType: deviceEvent.status.subType,
				status: deviceEvent.status.status,
				duration: deviceEvent.status.duration,
				expectedDuration: deviceEvent.status.expectedDuration,
				reasonSuspended: deviceEvent.status.reason.suspended,
				reasonResumed: deviceEvent.status.reason.resumed,
				source: deviceEvent.status.source,
				deviceTime: new Date(deviceEvent.status.deviceTime),
				localTime: localTime,
				time: new Date(deviceEvent.status.time),
				timezoneOffset: deviceEvent.status.timezoneOffset,
				clockDriftOffset: deviceEvent.status.clockDriftOffset,
				conversionOffset: deviceEvent.status.conversionOffset,
				id: deviceEvent.status.id,
				createdTime: deviceEvent.status.createdTime ?
					new Date(deviceEvent.status.createdTime) : null,
				hash_uploadId: deviceEvent.status.hash_uploadId,
				hash_groupId: deviceEvent.status.hash_groupId,
				deviceId: deviceEvent.status.deviceId,
				payload: JSON.stringify(deviceEvent.status.payload),
				guid: deviceEvent.status.guid,
				uploadId: deviceEvent.status.uploadId,
				_groupId: deviceEvent.status._groupId
			};
		}

		sheet.addRow(deviceEventRow).commit();
		if (statusEventRow)
			sheet.addRow(statusEventRow).commit();
	}

}