/* eslint-disable no-param-reassign, no-underscore-dangle */

const crypto = require('crypto');

/* Sort Data */
function sortDataByDate(data) {
  data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}
/* End Sort Data */

/* Strip Data */
function removeSourceForData(data) {
  delete data.source;
}

function removeTransmitterIdForData(data) {
  delete data.transmitterId;
}

function splitDeviceId(deviceId) {
  let retlist = deviceId.split('-');
  if (retlist.length === 1) {
    // Probably split by '_'
    retlist = deviceId.split('_');
  } else if (retlist.length > 2) {
    // Split into more than two pieces
    const model = retlist.slice(0, -1).join('-');
    const serial = retlist[retlist.length - 1];
    retlist = [];
    retlist.push(model);
    retlist.push(serial);
  }
  // Index 0 has model, 1 has serial
  return retlist;
}

function removeIDsAndPayload(data) {
  if (data.payload) {
    delete data.payload;
  }
  if (data.id) {
    delete data.id;
  }
  if (data.guid) {
    delete data.guid;
  }
  if (data.type === 'wizard' && data.bolus) {
    delete data.bolus;
  }
}

function removeAnnotations(data) {
  if (data.annotations) {
    delete data.annotations;
  }
}

function stripBasalSuppressedInfo(data) {
  let dataToStrip = data;

  while (dataToStrip.suppressed) {
    dataToStrip.suppressed.deviceId = `${data.type} device-Serial Number`;
    delete dataToStrip.suppressed.source;
    delete dataToStrip.suppressed.payload;
    delete dataToStrip.suppressed.annotations;

    dataToStrip = dataToStrip.suppressed;
  }
}

function stripModelAndSNForData(data, stripModels, leaveModels,
  stripSNs, leaveSNs, stripAll = false) {
  const deviceId = splitDeviceId(data.deviceId);
  const deviceComp = deviceId[0];

  if ((stripAll || stripModels.indexOf(deviceComp) >= 0) &&
    leaveModels.indexOf(deviceComp) < 0) {
    deviceId[0] = `${data.type} device`;
    if (data.type === 'upload') {
      // This probably isn't the best way to
      // go about scrubbing an upload but I
      // can't discern a better way to go
      // about it.
      delete data.deviceManufacturers;
      if (data.payload) {
        delete data.payload.devices;
      }
      if (data.deviceModel) {
        data.deviceModel = `${data.deviceTags[0]} model`;
      }
      if (data.deviceSerialNumber) {
        data.deviceSerialNumber = 'Serial Number';
      }
    }
  }

  if ((stripAll || stripSNs.indexOf(deviceComp) >= 0) &&
    leaveSNs.indexOf(deviceComp) < 0) {
    deviceId[1] = 'Serial Number';
  }

  data.deviceId = deviceId.join('-');
}


function stripModelForData(data, stripModels, leaveModels, stripAll = false) {
  const deviceId = splitDeviceId(data.deviceId);
  const deviceModel = deviceId[0];

  if ((stripAll || stripModels.indexOf(deviceModel) >= 0) &&
    leaveModels.indexOf(deviceModel) < 0) {
    deviceId[0] = `${data.type} device`;

    if (data.type === 'upload') {
      // This probably isn't the best way to
      // go about scrubbing an upload but I
      // can't discern a better way to go
      // about it.
      delete data.deviceManufacturers;
      if (data.payload) {
        delete data.payload.devices;
      }
      if (data.deviceModel) {
        data.deviceModel = `${data.deviceTags[0]} model`;
      }
    }
  }

  data.deviceId = deviceId.join('-');
}

function stripSNForData(data, stripModels, leaveModels, stripAll = false) {
  const deviceId = splitDeviceId(data.deviceId);
  const deviceModel = deviceId[0];

  if ((stripAll || stripModels.indexOf(deviceModel) >= 0) &&
    leaveModels.indexOf(deviceModel) < 0) {
    deviceId[1] = 'Serial Number';

    if (data.type === 'upload') {
      if (data.deviceSerialNumber) {
        data.deviceSerialNumber = 'Serial Number';
      }
    }
  }

  data.deviceId = deviceId.join('-');
}

function hashIDsForData(data) {
  if (data._groupId) {
    data.hash_groupId =
      crypto.createHash('sha256')
        .update(data._groupId.toString())
        .digest('hex');
    delete data._groupId;
  }

  if (data.uploadId) {
    data.hash_uploadId =
      crypto.createHash('sha256')
        .update(data.uploadId.toString())
        .digest('hex');
    delete data.uploadId;
  }

  if (data.byUser) {
    data.hash_byUser =
      crypto.createHash('sha256')
        .update(data.byUser.toString())
        .digest('hex');
    delete data.byUser;
  }
}

function stripData(data) {
  stripBasalSuppressedInfo(data);

  removeAnnotations(data);

  removeIDsAndPayload(data);

  stripModelAndSNForData(data, [], [], [], [], true);

  hashIDsForData(data);

  removeSourceForData(data);

  removeTransmitterIdForData(data);
}

/* End Strip Data */

exports.sortDataByDate = sortDataByDate;
exports.stripData = stripData;
exports.splitDeviceId = splitDeviceId;
exports.hashIDsForData = hashIDsForData;
exports.stripBasalSuppressedInfo = stripBasalSuppressedInfo;
exports.removeAnnotations = removeAnnotations;
exports.removeIDsAndPayload = removeIDsAndPayload;
exports.stripModelAndSNForData = stripModelAndSNForData;
exports.stripModelForData = stripModelForData;
exports.stripSNForData = stripSNForData;
exports.hashIDsForData = hashIDsForData;
exports.removeSourceForData = removeSourceForData;
exports.removeTransmitterIdForData = removeTransmitterIdForData;

exports.DAY_IN_MILLI = 86400000;

exports.COL_HEADERS = {
  SMBG_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Value',
    key: 'value',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Subtype',
    key: 'subType',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  CBG_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Value',
    key: 'value',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  BOLUS_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Subtype',
    key: 'subType',
    width: 10,
  },
  {
    header: 'Normal',
    key: 'normal',
    width: 10,
  },
  {
    header: 'Expected Normal',
    key: 'expectedNormal',
    width: 10,
  },
  {
    header: 'Extended',
    key: 'extended',
    width: 10,
  },
  {
    header: 'Expected Extended',
    key: 'expectedExtended',
    width: 10,
  },
  {
    header: 'Duration',
    key: 'duration',
    width: 10,
  },
  {
    header: 'Expected Duration',
    key: 'expectedDuration',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  BLOOD_KETONE_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Value',
    key: 'value',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  CGM_SETTINGS_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'High Alerts Enabled',
    key: 'highAlerts',
    width: 10,
  },
  {
    header: 'High Alerts Level',
    key: 'highAlertsLevel',
    width: 10,
  },
  {
    header: 'High Alerts Snooze',
    key: 'highAlertsSnooze',
    width: 10,
  },
  {
    header: 'Low Alerts Enabled',
    key: 'lowAlerts',
    width: 10,
  },
  {
    header: 'Low Alerts Level',
    key: 'lowAlertsLevel',
    width: 10,
  },
  {
    header: 'Low Alerts Snooze',
    key: 'lowAlertsSnooze',
    width: 10,
  },
  {
    header: 'Out of Range Alerts Enabled',
    key: 'outOfRangeAlerts',
    width: 10,
  },
  {
    header: 'Out of Range Alerts Snooze',
    key: 'outOfRangeAlertsSnooze',
    width: 10,
  },
  {
    header: 'Fall Rate Alerts Enabled',
    key: 'fallRateAlerts',
    width: 10,
  },
  {
    header: 'Fall Rate Alerts Rate',
    key: 'fallRateAlertsRate',
    width: 10,
  },
  {
    header: 'Rise Rate Alerts Enabled',
    key: 'riseRateAlerts',
    width: 10,
  },
  {
    header: 'Rise Rate Alerts Rate',
    key: 'riseRateAlertsRate',
    width: 10,
  },
  {
    header: 'Transmitter Id',
    key: 'transmitterId',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  BASAL_SCHEDULE_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Sequence',
    key: 'sequence',
    width: 10,
  },
  {
    header: 'Active Schedule',
    key: 'activeSchedule',
    width: 10,
  },
  {
    header: 'Schedule Name',
    key: 'scheduleName',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Rate',
    key: 'rate',
    width: 10,
  },
  {
    header: 'Start',
    key: 'start',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  BG_TARGET_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Sequence',
    key: 'sequence',
    width: 10,
  },
  {
    header: 'Active Schedule',
    key: 'activeSchedule',
    width: 10,
  },
  {
    header: 'Schedule Name',
    key: 'scheduleName',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Low',
    key: 'low',
    width: 10,
  },
  {
    header: 'High',
    key: 'high',
    width: 10,
  },
  {
    header: 'target',
    key: 'target',
    width: 10,
  },
  {
    header: 'Start',
    key: 'start',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  CARB_RATIO_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Sequence',
    key: 'sequence',
    width: 10,
  },
  {
    header: 'Active Schedule',
    key: 'activeSchedule',
    width: 10,
  },
  {
    header: 'Schedule Name',
    key: 'scheduleName',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Amount',
    key: 'amount',
    width: 10,
  },
  {
    header: 'Start',
    key: 'start',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  INSULIN_SENSITIVITY_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Sequence',
    key: 'sequence',
    width: 10,
  },
  {
    header: 'Active Schedule',
    key: 'activeSchedule',
    width: 10,
  },
  {
    header: 'Schedule Name',
    key: 'scheduleName',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Amount',
    key: 'amount',
    width: 10,
  },
  {
    header: 'Start',
    key: 'start',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  WIZARD_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'BG Input',
    key: 'bgInput',
    width: 10,
  },
  {
    header: 'BG Target',
    key: 'bgTarget',
    width: 10,
  },
  {
    header: 'BG Target Low',
    key: 'bgTargetLow',
    width: 10,
  },
  {
    header: 'BG Target High',
    key: 'bgTargetHigh',
    width: 10,
  },
  {
    header: 'BG Target Range',
    key: 'bgTargetRange',
    width: 10,
  },
  {
    header: 'Bolus Id',
    key: 'bolus',
    width: 10,
  },
  {
    header: 'Carb Input',
    key: 'carbInput',
    width: 10,
  },
  {
    header: 'Insulin Carb Ratio',
    key: 'insulinCarbRatio',
    width: 10,
  },
  {
    header: 'Insulin On Board',
    key: 'insulinOnBoard',
    width: 10,
  },
  {
    header: 'Insulin Sensitivity',
    key: 'insulinSensitivity',
    width: 10,
  },
  {
    header: 'Recommended Units for Carbs',
    key: 'recommendedCarb',
    width: 10,
  },
  {
    header: 'Recommended Units for Correction',
    key: 'recommendedCorrection',
    width: 10,
  },
  {
    header: 'Recommended Net Units',
    key: 'recommendedNet',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  UPLOAD_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Uploaded by User',
    key: 'byUser',
    width: 10,
  },
  {
    header: 'Hash Uploaded by User',
    key: 'hash_byUser',
    width: 10,
  },
  {
    header: 'Device Manufacturer',
    key: 'deviceManufacturer',
    width: 10,
  },
  {
    header: 'Device Model',
    key: 'deviceModel',
    width: 10,
  },
  {
    header: 'Device Serial Number',
    key: 'deviceSerialNumber',
    width: 10,
  },
  {
    header: 'Device Tag',
    key: 'deviceTag',
    width: 10,
  },
  {
    header: 'Computer Time',
    key: 'computerTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Time Processing',
    key: 'timeProcessing',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: 'Version',
    key: 'version',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  DEVICE_EVENT_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Subtype',
    key: 'subType',
    width: 10,
  },
  {
    header: 'Alarm Type',
    key: 'alarmType',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Value',
    key: 'value',
    width: 10,
  },
  {
    header: 'Prime Target',
    key: 'primeTarget',
    width: 10,
  },
  {
    header: 'Volume',
    key: 'volume',
    width: 10,
  },
  {
    header: 'Time Change From',
    key: 'timeChangeFrom',
    width: 10,
  },
  {
    header: 'Time Change To',
    key: 'timeChangeTo',
    width: 10,
  },
  {
    header: 'Time Change Agent',
    key: 'timeChangeAgent',
    width: 10,
  },
  {
    header: 'Time Change Reasons',
    key: 'timeChangeReasons',
    width: 10,
  },
  {
    header: 'Time Change Timezone',
    key: 'timeChangeTimezone',
    width: 10,
  },
  {
    header: 'Status',
    key: 'status',
    width: 10,
  },
  {
    header: 'Duration',
    key: 'duration',
    width: 10,
  },
  {
    header: 'Expected Duration',
    key: 'expectedDuration',
    width: 10,
  },
  {
    header: 'Reason Suspended',
    key: 'reasonSuspended',
    width: 10,
  },
  {
    header: 'Reason Resumed',
    key: 'reasonResumed',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],

  BASAL_COLS: [{
    header: 'Index',
    key: 'index',
    width: 10,
  },
  {
    header: 'Group',
    key: 'group',
    width: 10,
  },
  {
    header: 'Suppressed',
    key: 'suppressed',
    width: 10,
  },
  {
    header: 'Delivery Type',
    key: 'deliveryType',
    width: 10,
  },
  {
    header: 'Duration',
    key: 'duration',
    width: 10,
  },
  {
    header: 'Expected Duration',
    key: 'expectedDuration',
    width: 10,
  },
  {
    header: 'Percent',
    key: 'percent',
    width: 10,
  },
  {
    header: 'Rate',
    key: 'rate',
    width: 10,
  },
  {
    header: 'Units',
    key: 'units',
    width: 10,
  },
  {
    header: 'Schedule Name',
    key: 'scheduleName',
    width: 10,
  },
  {
    header: 'Source',
    key: 'source',
    width: 10,
  },
  {
    header: 'Device Id',
    key: 'deviceId',
    width: 10,
  },
  {
    header: 'Device Time',
    key: 'deviceTime',
    width: 10,
  },
  {
    header: 'Local Time',
    key: 'localTime',
    width: 10,
  },
  {
    header: 'Zulu Time',
    key: 'time',
    width: 10,
  },
  {
    header: 'Timezone Offset',
    key: 'timezoneOffset',
    width: 10,
  },
  {
    header: 'Clock Drift Offset',
    key: 'clockDriftOffset',
    width: 10,
  },
  {
    header: 'Conversion Offset',
    key: 'conversionOffset',
    width: 10,
  },
  {
    header: 'Id',
    key: 'id',
    width: 10,
  },
  {
    header: 'Created Time',
    key: 'createdTime',
    width: 10,
  },
  {
    header: 'Hash Upload Id',
    key: 'hash_uploadId',
    width: 10,
  },
  {
    header: 'Hash Group Id',
    key: 'hash_groupId',
    width: 10,
  },
  {
    header: 'Payload',
    key: 'payload',
    width: 10,
  },
  {
    header: 'GUID',
    key: 'guid',
    width: 10,
  },
  {
    header: null,
    key: 'uploadId',
    width: 10,
  },
  {
    header: null,
    key: '_groupId',
    width: 10,
  },
  ],
};
