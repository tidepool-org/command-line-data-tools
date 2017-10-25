#!/usr/bin/env node --harmony

/* eslint-disable no-console */

const program = require('commander');
const fs = require('fs');
const chalk = require('chalk');
const JSONStream = require('JSONStream');
const dataTools = require('../lib');

function checkOptions() {
  if (!program.stripAll) {
    program.stripAll = false;
  }
  if (!program.removeAll) {
    program.removeAll = false;
  }
  if (!program.hashIDs) {
    program.hashIDs = false;
  }
  if (!program.removeSource) {
    program.removeSource = false;
  }
  if (!program.verbose) {
    program.verbose = false;
  }
}

function list(val) {
  return val
    .split(',');
}

function printOptions() {
  console.log(chalk.blue.bold('input: ') + program.input);
  console.log(chalk.blue.bold('output: ') + program.output);
  console.log(chalk.blue.bold('stripModels: ') + program.stripModels);
  console.log(chalk.blue.bold('stripSNs: ') + program.stripSNs);
  console.log(chalk.blue.bold('leaveModels: ') + program.leaveModels);
  console.log(chalk.blue.bold('leaveSNs: ') + program.leaveSNs);
  console.log(chalk.blue.bold('stripAll: ') + program.stripAll);
  console.log(chalk.blue.bold('removeTypes: ') + program.removeTypes);
  console.log(chalk.blue.bold('leaveTypes: ') + program.leaveTypes);
  console.log(chalk.blue.bold('removeAll: ') + program.removeAll);
  console.log(chalk.blue.bold('hashIDs: ') + program.hashIDs);
  console.log(chalk.blue.bold('removeSource: ') + program.removeSource);
  console.log(chalk.blue.bold('verbose: ') + program.verbose);
}

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

function makeOutstream() {
  let ofs;
  if (program.output) {
    ofs = fs.createWriteStream(program.output);
  } else {
    ofs = process.stdout;
  }
  return ofs;
}

function writeToOutstream(ofs, info) {
  if (program.output) {
    ofs.write(info);
  } else {
    console.log(info);
  }
}

function performDataStripping(callback) {
  checkOptions();
  if (program.verbose) {
    printOptions();
  }

  const ifs = makeInFileStream();

  const jsonStream = JSONStream.parse('*');

  const ofs = makeOutstream();

  let first = true;
  writeToOutstream(ofs, '[');

  // Perform the parsing
  ifs
    .pipe(jsonStream)
    .on('data', (chunk) => {
      if ((program.removeAll || program.removeTypes.indexOf(chunk.type) >= 0) &&
        program.leaveTypes.indexOf(chunk.type) < 0) {
        // Do NOT add this event to output
        return;
      }

      if (first) {
        first = false;
      } else {
        writeToOutstream(ofs, ',');
      }

      const cleanData = chunk;

      if (program.stripAll) {
        dataTools.stripBasalSuppressedInfo(cleanData);
      }

      dataTools.removeAnnotations(cleanData);

      if (program.stripAll) {
        dataTools.removeIDsAndPayload(cleanData);
      }

      dataTools.stripModelAndSNForData(cleanData,
        program.stripModels, program.leaveModels,
        program.stripSNs, program.leaveSNs, program.stripAll);

      if (program.hashIDs) {
        dataTools.hashIDsForData(cleanData);
      }

      if (program.removeSource) {
        dataTools.removeSourceForData(cleanData);
      }

      if (program.removeTransmitter) {
        dataTools.removeTransmitterIdForData(cleanData);
      }

      writeToOutstream(ofs, JSON.stringify(cleanData));
    })
    .on('end', () => {
      writeToOutstream(ofs, ']');
      if (program.verbose) {
        console.log(chalk.yellow.bold('Done writing to output.'));
      }
      callback();
    });
}

program
  .version('0.0.1')
  .option('-i, --input <input>', 'path/to/input.json')
  .option('-o, --output <output>', 'path/to/output.json')
  .option('--stripModels <stripModels>',
    'Strip model name for these models. e.g. Anonymous Pump', list, [])
  .option('--stripSNs <stripSNs>',
    'Strip serial number for these models.', list, [])
  .option('--leaveModels <leaveModels>',
    'Leave model for these models. Takes precedence over strip.', list, [])
  .option('--leaveSNs <leaveSNs>',
    'Leave serial number for these models. Takes precedence over strip.', list, [])
  .option('--stripAll',
    'Strip all of the data, except for what is explicitly left.')
  .option('--removeTypes <removeTypes>',
    'Remove these data types.', list, [])
  .option('--leaveTypes <leaveTypes>',
    'Leave these data types. Takes precedence over removal.', list, [])
  .option('--removeAll',
    'Remove all data types, except for what is explicitly left.')
  .option('--hashIDs',
    'Pass IDs (such as _groupId and uploadId) through a one-way hash.')
  .option('--removeSource',
    'Remove the source of the data, e.g. carelink.')
  .option('--removeTransmitter',
    'Remove the transmitter id, e.g. the transmitter id for a Dexcom.')
  .option('-v, --verbose',
    'Verbose output.')
  .parse(process.argv);

performDataStripping(() => {});

exports.program = program;
