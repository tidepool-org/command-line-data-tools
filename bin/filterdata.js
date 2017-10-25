#!/usr/bin/env node --harmony

/* eslint-disable no-console */

const program = require('commander');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

const DAY_IN_MILLI = 86400000;

function getFirstIndexOfType(start, type, data) {
  let i = start;
  while (i < data.length && data[i].type !== type) i += 1;
  return i;
}

function getFirstIndexOfTypeWithExit(start, type, data) {
  const i = getFirstIndexOfType(start, type, data);
  if (i === data.length) {
    console.log(chalk.red.bold('The selected data type does not exist in the data.' +
      ' Terminating program.'));
    process.exit(1);
  }
  return i;
}

function getLength(set) {
  return (set.start.getTime() - set.end.getTime()) / DAY_IN_MILLI;
}

function verifySameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getYear() === d2.getYear();
}

function writeReport(set) {
  if (!program.report) return;

  const length = getLength(set);
  const data = `${program.input},${program.output},${program.type},${program.min},` +
    `${set.start.toISOString()},${set.end.toISOString()},${length},${set.qualDays / length}\n`;
  fs.appendFile(program.report, data, (err) => {
    if (err) console.error(chalk.red.bold(`Error writing report: ${err}`));
  });
}

function getOtherTypesInDateRange(toAdd, data, start, end) {
  // eslint-disable-next-line no-restricted-syntax
  for (const i in data) {
    if (data[i].type !== program.type &&
      new Date(data[i].time).getTime() <= start.getTime() &&
      new Date(data[i].time).getTime() >= end.getTime()) {
      toAdd.push(JSON.stringify(data[i]));
    }
  }
}

function getDataToAdd(startIndex, data) {
  let toAdd = [];
  let i = getFirstIndexOfTypeWithExit(startIndex, program.type, data);

  let curSet = {
    start: new Date(data[i].time),
    end: new Date(data[i].time),
    eventsToday: 1,
    qualDays: 0,
  };
  let totalBack = 0;

  let lastTimeForSorted = new Date(data[i].time).getTime();

  while (i < data.length) {
    if (lastTimeForSorted < new Date(data[i].time).getTime()) {
      console.error('Data must be sorted. Use the \'sortdata\' tool first.');
      process.exit(1);
    } else {
      lastTimeForSorted = new Date(data[i].time).getTime();
    }

    toAdd.push(JSON.stringify(data[i]));
    curSet.end = new Date(data[i].time);

    i = getFirstIndexOfType(i + 1, program.type, data);
    if (i === data.length) {
      if (curSet.eventsToday >= program.min) curSet.qualDays += 1;
      break;
    }

    const nextTime = new Date(data[i].time);

    // gap & length
    const gap = (curSet.end.getTime() - nextTime.getTime()) / DAY_IN_MILLI;
    const length = (curSet.start.getTime() - curSet.end.getTime()) / DAY_IN_MILLI;

    // coverage
    if (verifySameDay(curSet.end, nextTime)) curSet.eventsToday += 1;
    else if (curSet.eventsToday >= program.min) {
      curSet.qualDays += 1;
      curSet.eventsToday = 1;
    }
    const minQualDays = (program.days / program.length) * Math.max(program.length, length);

    if (gap > program.gap && length > program.length && curSet.qualDays > minQualDays) break;
    else if (gap > program.gap ||
      (length >= program.length && curSet.qualDays < minQualDays)) {
      // start over
      totalBack += gap + length;

      if (program.debug) {
        console.log(chalk.blue('Starting over because of gap.'));
        console.log(chalk.cyan(`Current data set length (days): ${length}`));
        console.log(chalk.cyan(`Gap size (days): ${gap}`));
        console.log(chalk.cyan(`Total back in time (days): ${totalBack}`));
        console.log(chalk.cyan(`Current index: ${i}`));
      }

      toAdd = [];
      curSet = {
        start: new Date(data[i].time),
        end: new Date(data[i].time),
        eventsToday: 1,
        qualDays: 0,
      };
    }
  }

  const length = getLength(curSet);
  const minQualDays = (program.days / program.length) * Math.max(program.length, length);
  if (length < program.length || curSet.qualDays < minQualDays) {
    console.log(chalk.blue(`Start date: ${curSet.start.toISOString()}`));
    console.log(chalk.blue(`End date: ${curSet.end.toISOString()}`));
    console.log(`length: ${length}`);
    console.log(`program.length: ${program.length}`);
    console.log(`curSet.qualDays: ${curSet.qualDays}`);
    console.log(`minQualDays: ${minQualDays}`);
    console.log(chalk.red.bold('There was no such data set that fit the criteria.' +
      ' Terminating program.'));
    process.exit(1);
  }
  if (program.verbose) {
    console.log(chalk.blue(`Start date: ${curSet.start.toISOString()}`));
    console.log(chalk.blue(`End date: ${curSet.end.toISOString()}`));
    console.log(chalk.blue(`Data set length (days): ${length}`));
    console.log(chalk.blue(`Qualifying day coverage: ${curSet.qualDays / length}`));
  }

  writeReport(curSet);

  getOtherTypesInDateRange(toAdd, data, curSet.start, curSet.end);

  return toAdd;
}

function printOptions() {
  console.log(chalk.blue.bold('type: ') + program.type);
  console.log(chalk.blue.bold('input: ') + program.input);
  console.log(chalk.blue.bold('output: ') + program.output);
  console.log(chalk.blue.bold('length: ') + program.length);
  console.log(chalk.blue.bold('min: ') + program.min);
  console.log(chalk.blue.bold('days: ') + program.days);
  console.log(chalk.blue.bold('gap: ') + program.gap);
}

function makeOutstream() {
  let ofs;
  if (program.output) {
    ofs = fs.createWriteStream(program.output);
  } else {
    ofs = process.stdout;
  }
  return ofs;
}

function writeToOutstream(ofs, info, callback) {
  if (program.output) {
    ofs.write(info, () => {
      callback();
    });
  } else {
    console.log(info);
    callback();
  }
}


function performDataFiltering(callback) {
  if (program.verbose) {
    console.log(chalk.green.bold('Options:'));
    printOptions();
    console.log(chalk.yellow.bold('\nReading input...'));
  }

  if (program.input === 'test/test-filterdata.js') {
    return;
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const data = require(path.resolve(process.cwd(), program.input));

  const ofs = makeOutstream();

  if (program.verbose) {
    console.log(chalk.yellow.bold('Done reading input. Filtering...'));
  }

  const toAdd = getDataToAdd(0, data);

  const jsonStr = `[${toAdd.join(',')}]\n`;

  if (program.verbose) {
    console.log(chalk.yellow.bold('Writing to output...'));
  }
  writeToOutstream(ofs, jsonStr, () => {
    if (program.verbose) {
      console.log(chalk.yellow.bold('Done writing to output.'));
    }
    callback();
  });
}

exports.performDataFiltering = performDataFiltering;
exports.verifySameDay = verifySameDay;
exports.getLength = getLength;
exports.getFirstIndexOfType = getFirstIndexOfType;

program
  .version('0.0.1')
  .arguments('<type> <input>')
  .option('-o, --output <output>', 'path/to/output.json')
  .option('--length <length>',
    'Number of contiguous days, regardless of data. Default is 1 day.',
    Number, 1)
  .option('--min <min>',
    'Minimum number of events per day to be a qualifying day.' +
    ' Default is 1 event.',
    Number, 1)
  .option('--days <days>',
    'Minimum number of days with <min> events. Default is 1 day.',
    Number, 1)
  .option('--gap <gap>',
    'Maximum gap of days without data in <length> contiguous days.' +
    ' Default is 1 day.',
    Number, 1)
  .option('-v, --verbose', 'Verbose output.')
  .option('-d, --debug', 'Debugging logging.')
  .option('--report <report>',
    'Add a line to a report file summarizing results.')
  .action((type, input) => {
    program.type = type;
    program.input = input;

    performDataFiltering(() => {
      process.exit(0);
    });
  })
  .parse(process.argv);
