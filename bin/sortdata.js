#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var path = require('path');

program
	.version('0.0.1')
	.option('-i, --input <input>', 'path/to/input.json')
	.option('-o, --output <output>', 'path/to/output.json')
	.option('-v, --verbose', 'Verbose output.')
	.parse(process.argv);

sortData(program.input, program.output, function() {
	process.exit(0);
});

function sortData(input, output, callback) {
	if (program.verbose) 
		printOptions();

	if (program.verbose)
		console.log(chalk.yellow.bold('Reading in data...'));

	var data = require(path.resolve(process.cwd(), input));

	if (program.verbose)
		console.log(chalk.yellow.bold('Sorting data...'));

	data.sort(function(a, b) {
		return new Date(b.time).getTime() - new Date(a.time).getTime();
	});

	if (program.verbose)
		console.log(chalk.yellow.bold('Writing data...'));

	var outfileStream = makeOutfileStream(output);
	writeToOutfileStream(output, outfileStream, JSON.stringify(data));

	if (program.verbose)
		console.log(chalk.yellow.bold('Done sorting and writing data...'));
}

function printOptions() {
	console.log(chalk.blue.bold('input: ') + program.input);
	console.log(chalk.blue.bold('output: ') + program.output);
	console.log(chalk.blue.bold('verbose: ') + program.verbose);
}

function makeOutfileStream(output) {
	var ofs;
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