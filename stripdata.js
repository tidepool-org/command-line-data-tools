#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');

program
    .version('0.0.1')
    .option('-i, --input <input>', 'path/to/input.json')
    .option('-o, --output <output>', 'path/to/output.json')
    .option('--stripModels <stripModels>', 
    	'Strip model name for these models. e.g. Anonymous Pump', list)
    .option('--stripSNs <stripSNs>', 
    	'Strip serial number for these models.', list)
    .option('--leaveModels <leaveModel>', 
    	'Leave model for these models. Takes precedence over strip.', list)
    .option('--leaveSNs <leaveSN>', 
    	'Leave serial number for these models. Takes precedence over strip.', list)
    .option('--stripAll <stripAll>', 
    	'Strip all of the data, except for what is explicitly left.', false)
    .option('--removeTypes <removeTypes>',
    	'Remove these data types.', list)
    .option('--leaveTypes <leaveTypes>',
    	'Leave these data types. Takes precedence over removal.', list)
    .option('--removeAll <removeAll>',
    	'Remove all data types, except for what is explicitly left.', false)
    .option('--hashIDs <hashIDs>',
    	'Pass IDs (such as _groupid and uploadId) through a one-way hash.', false)
    .parse(process.argv);

checkOptions();
printOptions();

var ifs = makeInFileStream();

var jsonStream = JSONStream.parse();

var ofs = makeOutstream();

// Perform the parsing
ifs
	.pipe(jsonStream)
	.on('data', function (data) {
	    var allClean = [];
	    for (var i in data) {
		    if ((program.removeAll 
		    	|| program.removeTypes
		    		.indexOf(data[i].type) >= 0)
		    	&& program.leaveTypes
		    		.indexOf(data[i].type) < 0) {
		    	// Do NOT add this event to output
		    	continue;
		    }

		    var cleanData = data[i];

		    allClean.push(JSON.stringify(cleanData));
	    }
	    var cleanStr = '[' + allClean.join(',') + ']\n';

	    writeToOutstream(ofs, cleanStr);
	})
	.on('end', function() {
		console.log(chalk.blue.bold('Done writing to output.'));
	});


function list(val) {
	return val
		.split(',');
}

function checkOptions() {
	if (!program.stripModels) {program.stripModels = [];}
	if (!program.stripSNs) {program.stripSNs = [];}
	if (!program.leaveModels) {program.leaveModels = [];}
	if (!program.leaveSN) {program.leaveSNs = [];}
	if (!program.removeTypes) {program.removeTypes = [];}
	if (!program.leaveTypes) {program.leaveTypes = [];}
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
}

function makeInFileStream() {
	var ifs;
	if (program.input) {
		ifs = fs.createReadStream(program.input, {encoding: 'utf8'});
	} else {
		ifs = process.stdout;
	}
	return ifs;
}

function makeOutstream() {
	var ofs;
	if (program.output) {
		ofs = fs.createWriteStream(program.output);
	} else {
		ofs = process.stdout;
	}
	return ofs
}

function writeToOutstream(ofs, info) {
	if (program.output) {
		ofs.write(info);
	} else {
		console.log(info);
	}
}

/*
option -- get rid of device id entirely, replace with anonymous
_groupid -- one-way hash
uploadId -- one-way hash
*/