#!/usr/bin/env node --harmony

/* eslint-disable no-console */

const sortData = require('../lib').sortData;

const program = require('commander');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

function printOptions() {
  console.log(chalk.blue.bold('input: ') + program.input);
  console.log(chalk.blue.bold('output: ') + program.output);
  console.log(chalk.blue.bold('verbose: ') + program.verbose);
}

function makeOutfileStream(output) {
  let ofs;
  if (output) {
    ofs = fs.createWriteStream(output);
  } else {
    ofs = process.stdout;
  }
  return ofs;
}

function writeToOutfileStream(output, outfileStream, info) {
  if (output) {
    outfileStream.write(info);
  } else {
    console.log(info);
  }
}

program
  .version('0.0.1')
  .option('-i, --input <input>', 'path/to/input.json')
  .option('-o, --output <output>', 'path/to/output.json')
  .option('-v, --verbose', 'Verbose output.')
  .parse(process.argv);

if (program.verbose) {
  printOptions();
}

if (program.verbose) {
  console.log(chalk.yellow.bold('Reading in data...'));
}

// eslint-disable-next-line import/no-dynamic-require
const data = require(path.resolve(process.cwd(), program.input));

if (program.verbose) {
  console.log(chalk.yellow.bold('Sorting data...'));
}

sortData(data);

if (program.verbose) {
  console.log(chalk.yellow.bold('Writing data...'));
}

const outfileStream = makeOutfileStream(program.output);
writeToOutfileStream(program.output, outfileStream, JSON.stringify(data));

if (program.verbose) {
  console.log(chalk.yellow.bold('Done sorting and writing data...'));
}
