#!/usr/bin/env node --harmony

/* eslint-disable no-console, no-param-reassign, no-underscore-dangle */
/* eslint no-restricted-syntax: [0, "ForInStatement"] */

const Excel = require('exceljs');
const COL_HEADERS = require('../lib').COL_HEADERS;

const BG_CONVERSION = 18.01559;


function processSmbgEvent(index, smbg) {
  smbg.units = 'mg/dL';
  smbg.value *= BG_CONVERSION;

  const localTime = new Date(smbg.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + smbg.timezoneOffset);

  return {
    index,
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
    localTime,
    time: new Date(smbg.time),
    timezoneOffset: smbg.timezoneOffset,
    uploadId: smbg.uploadId,
    hash_uploadId: smbg.hash_uploadId,
    _groupId: smbg._groupId,
    hash_groupId: smbg.hash_groupId,
    id: smbg.id,
    source: smbg.source,
    payload: JSON.stringify(smbg.payload),
  };
}

function processCbgEvent(index, cbg) {
  cbg.units = 'mg/dL';
  cbg.value *= BG_CONVERSION;

  const localTime = new Date(cbg.time);
  if (cbg.timezoneOffset) {
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + cbg.timezoneOffset);
  }

  return {
    index,
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
    localTime,
    time: new Date(cbg.time),
    timezoneOffset: cbg.timezoneOffset,
    uploadId: cbg.uploadId,
    hash_uploadId: cbg.hash_uploadId,
    _groupId: cbg._groupId,
    hash_groupId: cbg.hash_groupId,
    id: cbg.id,
    source: cbg.source,
    payload: JSON.stringify(cbg.payload),
  };
}

function processCgmSettingsEvent(index, cgmSettings) {
  cgmSettings.units = 'mg/dL';
  cgmSettings.highAlerts.level *= BG_CONVERSION;
  cgmSettings.lowAlerts.level *= BG_CONVERSION;
  cgmSettings.rateOfChangeAlerts.fallRate.rate *= BG_CONVERSION;
  cgmSettings.rateOfChangeAlerts.riseRate.rate *= BG_CONVERSION;

  const localTime = new Date(cgmSettings.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + cgmSettings.timezoneOffset);

  return {
    index,
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
    localTime,
    time: new Date(cgmSettings.time),
    timezoneOffset: cgmSettings.timezoneOffset,
    uploadId: cgmSettings.uploadId,
    hash_uploadId: cgmSettings.hash_uploadId,
    _groupId: cgmSettings._groupId,
    hash_groupId: cgmSettings.hash_groupId,
    id: cgmSettings.id,
    source: cgmSettings.source,
    payload: JSON.stringify(cgmSettings.payload),
  };
}

function processBolusEvent(index, bolus) {
  const localTime = new Date(bolus.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + bolus.timezoneOffset);

  return {
    index,
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
    localTime,
    time: new Date(bolus.time),
    timezoneOffset: bolus.timezoneOffset,
    uploadId: bolus.uploadId,
    hash_uploadId: bolus.hash_uploadId,
    _groupId: bolus._groupId,
    hash_groupId: bolus.hash_groupId,
    id: bolus.id,
    source: bolus.source,
    payload: JSON.stringify(bolus.payload),
  };
}

function addBasalRow(sheet, basal, indexes, suppressed) {
  if (!basal) {
    indexes.basal.group += 1;
    return;
  }

  const localTime = new Date(basal.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + basal.timezoneOffset);

  const basalRow = {
    index: indexes.basal.index,
    group: indexes.basal.group,
    suppressed,
    deliveryType: basal.deliveryType,
    duration: basal.duration,
    expectedDuration: basal.expectedDuration,
    percent: basal.percent,
    rate: basal.rate,
    units: 'units/hour',
    scheduleName: basal.scheduleName,
    source: basal.source,
    deviceTime: new Date(basal.deviceTime),
    localTime,
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
    _groupId: basal._groupId,
  };
  indexes.basal.index += 1;

  sheet.addRow(basalRow).commit();

  addBasalRow(sheet, basal.suppressed, indexes, 'true');
}

function processBasalEvent(sheet, indexes, basal) {
  addBasalRow(sheet, basal, indexes, null);
}

function processBasalSchedules(sheet, indexes, pumpSettings) {
  const group = indexes.basalSchedule.group;
  indexes.basalSchedule.group += 1;

  const basalSchedules = pumpSettings.basalSchedules;

  for (const basalScheduleName of Object.keys(basalSchedules)) {
    let sequence = 1;

    const localTime = new Date(pumpSettings.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

    // PLEASE VERIFY IN CODE REVIEW
    // If there are no values for a particular schedule
    // (i.e. "pattern a":[]) then there will be no rows
    // representing that particular schedule in the output
    for (const basalSchedule of basalSchedules[basalScheduleName]) {
      const basalScheduleRow = {
        index: indexes.basalSchedule.index,
        group,
        sequence,
        activeSchedule: pumpSettings.activeSchedule,
        scheduleName: basalScheduleName,
        units: 'units/hour',
        rate: basalSchedule.rate,
        start: basalSchedule.start,
        source: pumpSettings.source,
        deviceTime: new Date(pumpSettings.deviceTime),
        localTime,
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
        _groupId: pumpSettings._groupId,
      };
      indexes.basalSchedule.index += 1;
      sheet.addRow(basalScheduleRow).commit();
      sequence += 1;
    }
  }
}

function processBgTarget(sheet, bgTargets, pumpSettings, indexes, activeSchedule, scheduleName) {
  let sequence = 1;
  for (const bgTarget of bgTargets) {
    const units = 'mg/dL';
    if (bgTarget.high) {
      bgTarget.high *= BG_CONVERSION;
    }
    if (bgTarget.low) {
      bgTarget.low *= BG_CONVERSION;
    }
    if (bgTarget.target) {
      bgTarget.target *= BG_CONVERSION;
    }


    const localTime = new Date(pumpSettings.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

    const bgTargetRow = {
      index: indexes.bgTarget.index,
      group: indexes.bgTarget.group,
      activeSchedule,
      scheduleName,
      sequence,
      units,
      high: bgTarget.high,
      low: bgTarget.low,
      target: bgTarget.target,
      start: bgTarget.start,
      source: pumpSettings.source,
      deviceTime: new Date(pumpSettings.deviceTime),
      localTime,
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
      _groupId: pumpSettings._groupId,
    };
    indexes.bgTarget.index += 1;
    sheet.addRow(bgTargetRow).commit();
    sequence += 1;
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
    for (const bgTargetName of Object.keys(pumpSettings.bgTargets)) {
      processBgTarget(sheet,
        pumpSettings.bgTargets[bgTargetName],
        pumpSettings,
        indexes,
        pumpSettings.activeSchedule,
        bgTargetName);
    }
  }
  indexes.bgTarget.group += 1;
}

function processCarbRatio(sheet, carbRatios, pumpSettings, indexes, activeSchedule, scheduleName) {
  let sequence = 1;
  for (const carbRatio of carbRatios) {
    const localTime = new Date(pumpSettings.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

    const carbRatioRow = {
      index: indexes.carbRatio.index,
      group: indexes.carbRatio.group,
      activeSchedule,
      scheduleName,
      sequence,
      units: 'grams/unit',
      amount: carbRatio.amount,
      start: carbRatio.start,
      source: pumpSettings.source,
      deviceTime: pumpSettings.deviceTime,
      localTime,
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
      _groupId: pumpSettings._groupId,
    };
    indexes.carbRatio.index += 1;
    sheet.addRow(carbRatioRow).commit();
    sequence += 1;
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
    for (const carbRatioName of Object.keys(pumpSettings.carbRatios)) {
      processCarbRatio(sheet,
        pumpSettings.carbRatios[carbRatioName],
        pumpSettings,
        indexes,
        pumpSettings.activeSchedule,
        carbRatioName);
    }
  }
  indexes.carbRatio.group += 1;
}

function processInsulinSensitivity(sheet, insulinSensitivities, pumpSettings,
  indexes, activeSchedule, scheduleName) {
  let sequence = 1;
  for (const insulinSensitivity of insulinSensitivities) {
    const units = 'mg/dL/unit';
    insulinSensitivity.amount *= BG_CONVERSION;

    const localTime = new Date(pumpSettings.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + pumpSettings.timezoneOffset);

    const insulinSensitivityRow = {
      index: indexes.insulinSensitivity.index,
      group: indexes.insulinSensitivity.group,
      activeSchedule,
      scheduleName,
      sequence,
      units,
      amount: insulinSensitivity.amount,
      start: insulinSensitivity.start,
      source: pumpSettings.source,
      deviceTime: new Date(pumpSettings.deviceTime),
      localTime,
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
      _groupId: pumpSettings._groupId,
    };
    indexes.insulinSensitivity.index += 1;
    sheet.addRow(insulinSensitivityRow).commit();
    sequence += 1;
  }
}

function processInsulinSensitivities(sheet, indexes, pumpSettings) {
  if (pumpSettings.insulinSensitivity) {
    processInsulinSensitivity(sheet,
      pumpSettings.insulinSensitivity,
      pumpSettings,
      indexes,
      null,
      null);
  } else if (pumpSettings.insulinSensitivities) {
    for (const insulinSensitivityName of Object.keys(pumpSettings.insulinSensitivities)) {
      processInsulinSensitivity(sheet,
        pumpSettings.insulinSensitivities[insulinSensitivityName],
        pumpSettings,
        indexes,
        pumpSettings.activeSchedule,
        insulinSensitivityName);
    }
  }
  indexes.insulinSensitivity.group += 1;
}

function processPumpSettingsEvent(wb, indexes, pumpSettings) {
  // Basal Schedules
  const basalSchedulesSheet = wb.getWorksheet('basalSchedules');
  processBasalSchedules(basalSchedulesSheet,
    indexes,
    pumpSettings);

  // BG Targets
  const bgTargetSheet = wb.getWorksheet('bgTarget');
  processBgTargets(bgTargetSheet,
    indexes,
    pumpSettings);

  // Carb Ratios
  const carbRatioSheet = wb.getWorksheet('carbRatio');
  processCarbRatios(carbRatioSheet,
    indexes,
    pumpSettings);

  // Insulin Sensitivities
  const insulinSensitivitySheet = wb.getWorksheet('insulinSensitivity');
  processInsulinSensitivities(insulinSensitivitySheet,
    indexes,
    pumpSettings);
}

function processBloodKetoneEvent(index, bloodKetone) {
  const localTime = new Date(bloodKetone.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + bloodKetone.timezoneOffset);

  return {
    index,
    units: bloodKetone.units,
    value: bloodKetone.value,
    clockDriftOffset: bloodKetone.clockDriftOffset,
    conversionOffset: bloodKetone.conversionOffset,
    createdTime: bloodKetone.createdTime ?
      new Date(bloodKetone.createdTime) : null,
    deviceId: bloodKetone.deviceId,
    deviceTime: new Date(bloodKetone.deviceTime),
    guid: bloodKetone.guid,
    localTime,
    time: new Date(bloodKetone.time),
    timezoneOffset: bloodKetone.timezoneOffset,
    uploadId: bloodKetone.uploadId,
    hash_uploadId: bloodKetone.hash_uploadId,
    _groupId: bloodKetone._groupId,
    hash_groupId: bloodKetone.hash_groupId,
    id: bloodKetone.id,
    source: bloodKetone.source,
    payload: JSON.stringify(bloodKetone.payload),
  };
}

function processWizardEvent(index, wizard) {
  wizard.units = 'mg/dL';
  if (wizard.bgInput) {
    wizard.bgInput *= BG_CONVERSION;
  }
  if (wizard.bgTarget) {
    if (wizard.bgTarget.target) {
      wizard.bgTarget.target *= BG_CONVERSION;
    }
    if (wizard.bgTarget.low) {
      wizard.bgTarget.low *= BG_CONVERSION;
    }
    if (wizard.bgTarget.high) {
      wizard.bgTarget.high *= BG_CONVERSION;
    }
    if (wizard.bgTarget.range) {
      wizard.bgTarget.range *= BG_CONVERSION;
    }
  }
  wizard.insulinSensitivity *= BG_CONVERSION;

  const localTime = new Date(wizard.time);
  localTime.setUTCMinutes(
    localTime.getUTCMinutes() + wizard.timezoneOffset);

  return {
    index,
    units: wizard.units,
    bgInput: wizard.bgInput,
    bgTarget: wizard.bgTarget ? wizard.bgTarget.target : null,
    bgTargetLow: wizard.bgTarget ? wizard.bgTarget.low : null,
    bgTargetHigh: wizard.bgTarget ? wizard.bgTarget.high : null,
    bgTargetRange: wizard.bgTarget ? wizard.bgTarget.range : null,
    bolus: wizard.bolus,
    carbInput: wizard.carbInput,
    insulinCarbRatio: wizard.insulinCarbRatio,
    insulinOnBoard: wizard.insulinOnBoard,
    insulinSensitivity: wizard.insulinSensitivity || null,
    recommendedCarb: wizard.recommended.carb,
    recommendedCorrection: wizard.recommended.correction,
    recommendedNet: wizard.recommended.net,
    source: wizard.source,
    deviceTime: new Date(wizard.deviceTime),
    localTime,
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
    _groupId: wizard._groupId,
  };
}

function processUploadEvent(sheet, indexes, upload) {
  const group = indexes.upload.group;
  indexes.upload.group += 1;

  let uploadRow = null;
  if (upload.deviceModel === 'multiple') {
    for (const device of upload.payload.devices) {
      const localTime = new Date(upload.time);
      if (upload.timezoneOffset) {
        localTime.setUTCMinutes(
          localTime.getUTCMinutes() + upload.timezoneOffset);
      }

      uploadRow = {
        index: indexes.upload.index,
        group,
        byUser: upload.byUser,
        hash_byUser: upload.hash_byUser,
        deviceManufacturer: (upload.deviceManufacturers &&
            upload.deviceManufacturers.length > 0) ?
          upload.deviceManufacturers[0] : null,
        deviceModel: device.deviceModel,
        deviceSerialNumber: device.deviceSerialNumber,
        deviceTag: (upload.deviceTags &&
            upload.deviceTags.length > 0) ?
          upload.deviceTags[0] : null,
        computerTime: upload.computerTime ?
          new Date(upload.computerTime) : null,
        localTime,
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
        _groupId: upload._groupId,
      };
      indexes.upload.index += 1;

      sheet.addRow(uploadRow).commit();
    }
  } else {
    const localTime = new Date(upload.time);
    if (upload.timezoneOffset) {
      localTime.setUTCMinutes(
        localTime.getUTCMinutes() + upload.timezoneOffset);
    }

    uploadRow = {
      index: indexes.upload.index,
      group,
      byUser: upload.byUser,
      hash_byUser: upload.hash_byUser,
      deviceManufacturer: (upload.deviceManufacturers &&
          upload.deviceManufacturers.length > 0) ?
        upload.deviceManufacturers[0] : null,
      deviceModel: upload.deviceModel,
      // Some devices (such as HealthKit_DexG5) do not have a
      // serial number, so it is possible for the deviceSN to
      // be null.
      deviceSerialNumber: upload.deviceSerialNumber || null,
      deviceTag: (upload.deviceTags &&
          upload.deviceTags.length > 0) ?
        upload.deviceTags[0] : null,
      computerTime: upload.computerTime ?
        new Date(upload.computerTime) : null,
      localTime,
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
      _groupId: upload._groupId,
    };
    indexes.upload.index += 1;

    sheet.addRow(uploadRow).commit();
  }
}

function processDeviceEvent(sheet, indexes, deviceEvent) {
  const group = indexes.deviceEvent.group;
  indexes.deviceEvent.group += 1;

  if (deviceEvent.subType === 'status') {
    const localTime = new Date(deviceEvent.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

    const deviceEventRow = {
      index: indexes.deviceEvent.index,
      group,
      subType: deviceEvent.subType,
      status: deviceEvent.status,
      duration: deviceEvent.duration,
      expectedDuration: deviceEvent.expectedDuration,
      reasonSuspended: deviceEvent.reason.suspended,
      reasonResumed: deviceEvent.reason.resumed,
      source: deviceEvent.source,
      deviceTime: new Date(deviceEvent.deviceTime),
      localTime,
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
      _groupId: deviceEvent._groupId,
    };
    indexes.deviceEvent.index += 1;

    sheet.addRow(deviceEventRow).commit();
  } else {
    if (typeof deviceEvent.units === 'string') {
      deviceEvent.units = 'mg/dL';
      deviceEvent.value *= BG_CONVERSION;
    }

    let localTime = new Date(deviceEvent.time);
    localTime.setUTCMinutes(
      localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

    const deviceEventRow = {
      index: indexes.deviceEvent.index,
      group,
      subType: deviceEvent.subType,
      alarmType: deviceEvent.alarmType,
      units: deviceEvent.units,
      value: deviceEvent.value,
      volume: deviceEvent.volume,
      timeChangeFrom: deviceEvent.change ?
        deviceEvent.change.from : null,
      timeChangeTo: deviceEvent.change ?
        deviceEvent.change.to : null,
      timeChangeAgent: deviceEvent.change ?
        deviceEvent.change.agent : null,
      timeChangeReasons:
        (deviceEvent.change &&
          deviceEvent.change.reasons) ? deviceEvent.change.reasons.toString() : null,
      timeChangeTimezone: deviceEvent.change ?
        deviceEvent.change.timezone : null,
      primeTarget: deviceEvent.primeTarget,
      source: deviceEvent.source,
      deviceTime: new Date(deviceEvent.deviceTime),
      localTime,
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
      _groupId: deviceEvent._groupId,
    };
    indexes.deviceEvent.index += 1;

    let statusEventRow;
    if (typeof deviceEvent.status === 'string') {
      deviceEventRow.status = deviceEvent.status;
    } else if (typeof deviceEvent.status === 'object') {
      localTime = new Date(deviceEvent.time);
      localTime.setUTCMinutes(
        localTime.getUTCMinutes() + deviceEvent.timezoneOffset);

      statusEventRow = {
        index: indexes.deviceEvent.index += 1,
        group,
        subType: deviceEvent.status.subType,
        status: deviceEvent.status.status,
        duration: deviceEvent.status.duration,
        expectedDuration: deviceEvent.status.expectedDuration,
        reasonSuspended: deviceEvent.status.reason.suspended,
        reasonResumed: deviceEvent.status.reason.resumed,
        source: deviceEvent.status.source,
        deviceTime: new Date(deviceEvent.status.deviceTime),
        localTime,
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
        _groupId: deviceEvent.status._groupId,
      };
    }

    sheet.addRow(deviceEventRow).commit();
    if (statusEventRow) {
      sheet.addRow(statusEventRow).commit();
    }
  }
}

function processDiaEvent(wb, indexes, diaEvent) {
  if (diaEvent.type === 'smbg') {
    const smbgSheet = wb.getWorksheet('smbg');
    smbgSheet.addRow(processSmbgEvent(indexes.smbg.index, diaEvent)).commit();
    indexes.smbg.index += 1;
  } else if (diaEvent.type === 'cbg') {
    const cbgSheet = wb.getWorksheet('cgm');
    cbgSheet.addRow(processCbgEvent(indexes.cbg.index, diaEvent)).commit();
    indexes.cbg.index += 1;
  } else if (diaEvent.type === 'cgmSettings') {
    const cgmSettingsSheet = wb.getWorksheet('cgmSettings');
    cgmSettingsSheet.addRow(
      processCgmSettingsEvent(indexes.cgmSettings.index, diaEvent)).commit();
    indexes.cgmSettings.index += 1;
  } else if (diaEvent.type === 'bolus') {
    const bolusSheet = wb.getWorksheet('bolus');
    bolusSheet.addRow(processBolusEvent(indexes.bolus.index, diaEvent)).commit();
    indexes.bolus.index += 1;
  } else if (diaEvent.type === 'basal') {
    const basalSheet = wb.getWorksheet('basal');
    processBasalEvent(basalSheet, indexes, diaEvent);
  } else if (diaEvent.type === 'pumpSettings') {
    processPumpSettingsEvent(wb, indexes, diaEvent);
  } else if (diaEvent.type === 'bloodKetone') {
    const bloodKetoneSheet = wb.getWorksheet('bloodKetone');
    bloodKetoneSheet.addRow(
      processBloodKetoneEvent(indexes.bloodKetone.index, diaEvent)).commit();
    indexes.bloodKetone.index += 1;
  } else if (diaEvent.type === 'wizard') {
    const wizardSheet = wb.getWorksheet('wizard');
    wizardSheet.addRow(processWizardEvent(indexes.wizard.index, diaEvent)).commit();
    indexes.wizard.index += 1;
  } else if (diaEvent.type === 'upload') {
    const uploadSheet = wb.getWorksheet('upload');
    processUploadEvent(uploadSheet, indexes, diaEvent);
  } else if (diaEvent.type === 'deviceEvent') {
    const deviceEventSheet = wb.getWorksheet('deviceEvent and suspend');
    processDeviceEvent(deviceEventSheet, indexes, diaEvent);
  }
}

function dataToWorkbook(diaEvents, stream) {
  const wb = new Excel.stream.xlsx.WorkbookWriter({
    stream: stream,
	  useStyles: true,
  });

  const indexes = {};

  const smbgSheet = wb.addWorksheet('smbg');
  smbgSheet.columns = COL_HEADERS.SMBG_COLS;
  indexes.smbg = {
    index: 1,
  };

  const cbgSheet = wb.addWorksheet('cgm');
  cbgSheet.columns = COL_HEADERS.CBG_COLS;
  indexes.cbg = {
    index: 1,
  };

  const cgmSettingsSheet = wb.addWorksheet('cgmSettings');
  cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
  indexes.cgmSettings = {
    index: 1,
  };

  const bolusSheet = wb.addWorksheet('bolus');
  bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
  indexes.bolus = {
    index: 1,
  };

  const wizardSheet = wb.addWorksheet('wizard');
  wizardSheet.columns = COL_HEADERS.WIZARD_COLS;
  indexes.wizard = {
    index: 1,
  };

  const basalSheet = wb.addWorksheet('basal');
  basalSheet.columns = COL_HEADERS.BASAL_COLS;
  indexes.basal = {
    index: 1,
    group: 1,
  };

  const basalScheduleSheet = wb.addWorksheet('basalSchedules');
  basalScheduleSheet.columns = COL_HEADERS.BASAL_SCHEDULE_COLS;
  indexes.basalSchedule = {
    index: 1,
    group: 1,
  };

  const bgTargetSheet = wb.addWorksheet('bgTarget');
  bgTargetSheet.columns = COL_HEADERS.BG_TARGET_COLS;
  indexes.bgTarget = {
    index: 1,
    group: 1,
  };

  const carbRatioSheet = wb.addWorksheet('carbRatio');
  carbRatioSheet.columns = COL_HEADERS.CARB_RATIO_COLS;
  indexes.carbRatio = {
    index: 1,
    group: 1,
  };

  const insulinSensitivitySheet = wb.addWorksheet('insulinSensitivity');
  insulinSensitivitySheet.columns = COL_HEADERS.INSULIN_SENSITIVITY_COLS;
  indexes.insulinSensitivity = {
    index: 1,
    group: 1,
  };

  const bloodKetoneSheet = wb.addWorksheet('bloodKetone');
  bloodKetoneSheet.columns = COL_HEADERS.BLOOD_KETONE_COLS;
  indexes.bloodKetone = {
    index: 1,
  };

  const uploadSheet = wb.addWorksheet('upload');
  uploadSheet.columns = COL_HEADERS.UPLOAD_COLS;
  indexes.upload = {
    index: 1,
    group: 1,
  };

  const deviceEventSheet = wb.addWorksheet('deviceEvent and suspend');
  deviceEventSheet.columns = COL_HEADERS.DEVICE_EVENT_COLS;
  indexes.deviceEvent = {
    index: 1,
    group: 1,
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const diaEvent of diaEvents) {
    processDiaEvent(wb, indexes, diaEvent);
  }

  // Return a Promise to the file write
  return wb.commit();
}

// FIXME: The following line should not be here.
// The common features here should be extracted to lib.js
/* eslint-disable global-require, no-inner-declarations */
if (require.main === module) {
  const program = require('commander');
  const fs = require('fs');
  const chalk = require('chalk');
  const JSONStream = require('JSONStream');


  function makeInFileStream() {
    let ifs;
    if (program.input) {
      ifs = fs.createReadStream(program.input, {
        encoding: 'utf8',
      });
    } else {
      ifs = process.stdin;
    }
    return ifs;
  }

  function makeWorkbook() {
    return new Excel.stream.xlsx.WorkbookWriter({
      filename: program.output,
    });
  }

  function processDiabetesEvent(wb, indexes, diaEvent) {
    if ((program.all || program.smbg) &&
      diaEvent.type === 'smbg') {
      const smbgSheet = wb.getWorksheet('smbg');
      smbgSheet.addRow(
        processSmbgEvent(indexes.smbg.index, diaEvent)).commit();
      indexes.smbg.index += 1;
    } else if ((program.all || program.cbg) &&
      diaEvent.type === 'cbg') {
      const cbgSheet = wb.getWorksheet('cgm');
      cbgSheet.addRow(
        processCbgEvent(indexes.cbg.index, diaEvent)).commit();
      indexes.cbg.index += 1;
    } else if ((program.all || program.cgmSettings) &&
      diaEvent.type === 'cgmSettings') {
      const cgmSettingsSheet = wb.getWorksheet('cgmSettings');
      cgmSettingsSheet.addRow(
        processCgmSettingsEvent(indexes.cgmSettings.index, diaEvent)).commit();
      indexes.cgmSettings.index += 1;
    } else if ((program.all || program.bolus) &&
      diaEvent.type === 'bolus') {
      const bolusSheet = wb.getWorksheet('bolus');
      bolusSheet.addRow(
        processBolusEvent(indexes.bolus.index, diaEvent)).commit();
      indexes.bolus.index += 1;
    } else if ((program.all || program.basal) &&
      diaEvent.type === 'basal') {
      const basalSheet = wb.getWorksheet('basal');
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
      const bloodKetoneSheet = wb.getWorksheet('bloodKetone');
      bloodKetoneSheet.addRow(
        processBloodKetoneEvent(indexes.bloodKetone.index, diaEvent)).commit();
      indexes.bloodKetone.index += 1;
    } else if ((program.all || program.wizard) &&
      diaEvent.type === 'wizard') {
      const wizardSheet = wb.getWorksheet('wizard');
      wizardSheet.addRow(
        processWizardEvent(indexes.wizard.index, diaEvent)).commit();
      indexes.wizard.index += 1;
    } else if ((program.all || program.upload) &&
      diaEvent.type === 'upload') {
      const uploadSheet = wb.getWorksheet('upload');
      processUploadEvent(
        uploadSheet,
        indexes,
        diaEvent);
    } else if ((program.all || program.deviceEvent) &&
      diaEvent.type === 'deviceEvent') {
      const deviceEventSheet = wb.getWorksheet('deviceEvent and suspend');
      processDeviceEvent(
        deviceEventSheet,
        indexes,
        diaEvent);
    }
  }

  function convertToWorkbook(callback) {
    if (program.verbose) {
      console.log(chalk.green.bold('Converting to spreadsheet...'));
    }

    const ifs = makeInFileStream();
    const jsonStream = JSONStream.parse('*');
    let wb = null;

    if (program.all || program.smbg || program.cbg || program.cgmSettings ||
      program.bolus || program.basal || program.basalSchedules ||
      program.bgTarget || program.carbRatio || program.insulinSensitivity ||
      program.bloodKetone || program.wizard || program.upload ||
      program.deviceEvent) {
      wb = makeWorkbook();
    } else {
      console.error(chalk.red.bold('Must select at lease one data type.'));
      process.exit(1);
    }

    const indexes = {};

    if (program.all || program.smbg) {
      const smbgSheet = wb.addWorksheet('smbg');
      smbgSheet.columns = COL_HEADERS.SMBG_COLS;
      indexes.smbg = {
        index: 1,
      };
    }

    if (program.all || program.cbg) {
      const cbgSheet = wb.addWorksheet('cgm');
      cbgSheet.columns = COL_HEADERS.CBG_COLS;
      indexes.cbg = {
        index: 1,
      };
    }

    if (program.all || program.cgmSettings) {
      const cgmSettingsSheet = wb.addWorksheet('cgmSettings');
      cgmSettingsSheet.columns = COL_HEADERS.CGM_SETTINGS_COLS;
      indexes.cgmSettings = {
        index: 1,
      };
    }

    if (program.all || program.bolus) {
      const bolusSheet = wb.addWorksheet('bolus');
      bolusSheet.columns = COL_HEADERS.BOLUS_COLS;
      indexes.bolus = {
        index: 1,
      };
    }

    if (program.all || program.wizard) {
      const wizardSheet = wb.addWorksheet('wizard');
      wizardSheet.columns = COL_HEADERS.WIZARD_COLS;
      indexes.wizard = {
        index: 1,
      };
    }

    if (program.all || program.basal) {
      const basalSheet = wb.addWorksheet('basal');
      basalSheet.columns = COL_HEADERS.BASAL_COLS;
      indexes.basal = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.basalSchedules) {
      const basalScheduleSheet = wb.addWorksheet('basalSchedules');
      basalScheduleSheet.columns = COL_HEADERS.BASAL_SCHEDULE_COLS;
      indexes.basalSchedule = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.bgTarget) {
      const bgTargetSheet = wb.addWorksheet('bgTarget');
      bgTargetSheet.columns = COL_HEADERS.BG_TARGET_COLS;
      indexes.bgTarget = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.carbRatio) {
      const carbRatioSheet = wb.addWorksheet('carbRatio');
      carbRatioSheet.columns = COL_HEADERS.CARB_RATIO_COLS;
      indexes.carbRatio = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.insulinSensitivity) {
      const insulinSensitivitySheet = wb.addWorksheet('insulinSensitivity');
      insulinSensitivitySheet.columns = COL_HEADERS.INSULIN_SENSITIVITY_COLS;
      indexes.insulinSensitivity = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.bloodKetone) {
      const bloodKetoneSheet = wb.addWorksheet('bloodKetone');
      bloodKetoneSheet.columns = COL_HEADERS.BLOOD_KETONE_COLS;
      indexes.bloodKetone = {
        index: 1,
      };
    }

    if (program.all || program.upload) {
      const uploadSheet = wb.addWorksheet('upload');
      uploadSheet.columns = COL_HEADERS.UPLOAD_COLS;
      indexes.upload = {
        index: 1,
        group: 1,
      };
    }

    if (program.all || program.deviceEvent) {
      const deviceEventSheet = wb.addWorksheet('deviceEvent and suspend');
      deviceEventSheet.columns = COL_HEADERS.DEVICE_EVENT_COLS;
      indexes.deviceEvent = {
        index: 1,
        group: 1,
      };
    }

    ifs.pipe(jsonStream);

    jsonStream
      .on('data', (chunk) => {
        processDiabetesEvent(wb, indexes, chunk);
      })
      .on('end', () => {
        wb.commit()
          .then(() => {
            if (program.verbose) {
              console.log(chalk.green.bold('Done converting to spreadsheet.'));
            }
            callback();
          });
      });
  }

  program
    .version('1.0.0')
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
    .action((output) => {
      program.output = output;
    })
    .parse(process.argv);

  convertToWorkbook(() => {});
}
/* eslint-enable global-require, no-inner-declarations */

exports.dataToWorkbook = dataToWorkbook;
