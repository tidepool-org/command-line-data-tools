#!/usr/bin/env node --harmony

/* eslint-disable no-console */
/* eslint no-restricted-syntax: [0, "ForInStatement"] */

const program = require('commander');
const fs = require('fs');
const chalk = require('chalk');
const JSONStream = require('JSONStream');

const DAY_IN_MILLI = 86400000;
const BG_CONVERSION = 18.01559;

function randomValueInRange(range) {
  if (range.length === 1) {
    return range[0];
  }
  return (Math.random() * (range[1] - range[0])) + range[0];
}

function readExistingData(filename, callback) {
  fs.exists(filename, (exists) => {
    if (!exists) {
      callback([]);
      return;
    }

    const ifs = fs.createReadStream(filename, {
      encoding: 'utf8',
    });
    const jsonStream = JSONStream.parse();
    ifs
      .pipe(jsonStream)
      .on('data', (data) => {
        callback(data);
      });
  });
}

function generateDataWithExtras(output, extras, values, dates, groupId, options, callback) {
  const newData = [];

  const start = dates[0];
  const end = dates[1];

  const numDays = (end.getTime() - start.getTime()) / DAY_IN_MILLI;

  for (let i = 0; i < numDays; i++) {
    const numEvents = randomValueInRange(options.numPerDay);

    for (let j = 0; j < numEvents; j++) {
      const time = new Date(start);
      time.setDate(time.getDate() + i);

      const common = {
        _groupId: groupId,
        clockDriftOffset: 0,
        conversionOffset: 0,
        createdTime: new Date().toISOString(),
        deviceId: `${extras.type} device-Serial Number`,
        deviceTime: time.toISOString(),
        guid: 'not_actually_a_guid',
        id: 'not_actually_an_id',
        time: time.toISOString(),
        timezoneOffset: 0,
        uploadId: 'upid_NA',
      };

      for (const index of values) {
        const value = values[index];
        common[value.key] = value.operation(value.range);
      }

      for (const key of extras) {
        common[key] = extras[key];
      }

      newData.push(common);
    }
  }

  readExistingData(output, (data) => {
    const writeData = newData.concat(data);
    fs.writeFile(output, JSON.stringify(writeData), (err) => {
      if (err) {
        console.error(chalk.red.bold('An error occurred with writing the file.'));
        process.exit(1);
      }
      callback();
    });
  });
}

function generateCbgData(output, dates, groupId, options, callback) {
  const extras = {
    type: 'cbg',
    units: 'mmol/L',
  };

  const values = [{
    key: 'value',
    operation(range) {
      return randomValueInRange(range) /
        BG_CONVERSION;
    },
    range: options.values,
  }];

  generateDataWithExtras(output,
    extras,
    values,
    dates,
    groupId,
    options,
    callback);
}

function generateSmbgData(output, dates, groupId, options, callback) {
  const extras = {
    type: 'smbg',
    units: 'mmol/L',
  };

  const values = [{
    key: 'value',
    operation(range) {
      return randomValueInRange(range) /
        BG_CONVERSION;
    },
    range: options.values,
  }];

  generateDataWithExtras(output,
    extras,
    values,
    dates,
    groupId,
    options,
    callback);
}

function generateNormalBolusData(output, dates, groupId, options, callback) {
  const extras = {
    type: 'bolus',
    subType: 'normal',
  };

  const values = [
    {
      key: 'normal',
      operation(range) {
        return randomValueInRange(range);
      },
      range: options.values,
    },
    {
      key: 'expectedNormal',
      operation(range) {
        return randomValueInRange(range);
      },
      range: options.values,
    },
  ];

  generateDataWithExtras(output,
    extras,
    values,
    dates,
    groupId,
    options,
    callback);
}

function generateBolusData(output, dates, groupId, subtype, options, callback) {
  if (subtype === 'normal') {
    generateNormalBolusData(output, dates, groupId, options, callback);
  }
}

function checkDatesAndOptionsWithExit(dates, options) {
  if (dates.length !== 2) {
    console.error(chalk.red.bold('Must have a date range with exactly' +
      ' two dates.'));
    process.exit(1);
  }
  if (options.numPerDay.length !== 2 &&
    options.numPerDay.length !== 1) {
    console.error(chalk.red.bold('For --numPerDay, must specify a ' +
      'range or an exact value.'));
    process.exit(1);
  }
  if (options.values.length !== 2 &&
    options.values.length !== 1) {
    console.error(chalk.red.bold('For --values, must specify a ' +
      'range or an exact value.'));
    process.exit(1);
  }
}

function checkBolusSubtypeWithExit(subtype) {
  if (subtype !== 'normal') {
    console.error(chalk.red.bold('Normal is currently the only ' +
      'supported subtype of bolus.'));
    process.exit(1);
  }
}

function datesList(string) {
  const dates = string.split(',');
  return dates.map(str => new Date(str));
}

function numberList(string) {
  return string.split(',').map(Number);
}

program
  .version('1.0.0');

program
  .command('cbg')
  .arguments('<output> <dates> <groupId>')
  .option('--numPerDay <numPerDay>',
    'Number of events per day.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 288 cbg values per day.', numberList, [288])
  .option('--values <values>',
    'Range for possible cbg values in mg/dL.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 100 mg/dL cbg values.', numberList, [100])
  .description('Generate cbg data.')
  .action((output, dates, groupId, options) => {
    const dateList = datesList(dates);

    checkDatesAndOptionsWithExit(dateList, options);

    generateCbgData(output, dateList, groupId, options, () => {});
  });

program
  .command('smbg')
  .arguments('<output> <dates> <groupId>')
  .option('--numPerDay <numPerDay>',
    'Number of events per day.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 288 cbg values per day.', numberList, [288])
  .option('--values <values>',
    'Range for possible cbg values in mg/dL.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 100 mg/dL cbg values.', numberList, [100])
  .description('Generate smbg data.')
  .action((output, dates, groupId, options) => {
    const dateList = datesList(dates);

    checkDatesAndOptionsWithExit(dateList, options);

    generateSmbgData(output, dateList, groupId, options, () => {});
  });

program
  .command('bolus')
  .arguments('<output> <dates> <groupId> <subtype>')
  .option('--numPerDay <numPerDay>',
    'Number of boluses per day.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 1 bolus per day.', numberList, [1])
  .option('--values <values>',
    'Range for possible bolus amount in units.' +
    'Use comma separated values' +
    ' for a value range, or one exact value.' +
    ' Default is 1 unit boluses.', numberList, [1])
  .description('Generate bolus data.')
  .action((output, dates, groupId, subtype, options) => {
    const dateList = datesList(dates);

    checkDatesAndOptionsWithExit(dateList, options);
    checkBolusSubtypeWithExit(subtype);

    generateBolusData(output, dateList, groupId, subtype, options, () => {});
  });

program.parse(process.argv);
