#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');

const DAY_IN_MILLI = 86400000;

program
    .version('0.0.1')
    .arguments('<type>')
    .option('-i, --input <input>', 'path/to/input.json')
    .option('-o, --output <output>', 'path/to/output.json')
    .option('--length <length>', 
    	'Number of contiguous days, regardless of data. Default is 1 day.',
    	Number, 1)
    .option('--min <min>', 
    	'Minimum number of events per day to be a qualifying day.' 
    	+ ' Default is 1 event.',
    	Number, 1)
    .option('--days <days>', 
    	'Minimum number of days with <min> events. Default is 1 day.',
    	Number, 1)
    .option('--gap <gap>',
    	'Maximum gap of unqualifying days in <length> contiguous days.'
    	+ ' Default is 1 day.',
    	Number, 1)
    .option('-v, --verbose', 'Verbose output.')
    .option('-d, --debug', 'Debugging logging.')
    .option('--report <report>', 
    	'Add a line to a report file summarizing results.')
	.action(function(type) {
		program.type = type;
    })
    .parse(process.argv);

performDataFiltering(function() { });

function performDataFiltering(callback) {

	if (program.verbose) {
		console.log(chalk.green.bold('Options:'))
		printOptions();
		console.log(chalk.yellow.bold('\nReading input...'));
	}

	var ifs = makeInFileStream();

	var jsonStream = JSONStream.parse();

	var ofs = makeOutstream();

	ifs
		.pipe(jsonStream)
		.on('data', function (chunk) {
			if (program.verbose) {
				console.log(chalk.yellow.bold('Done reading input. Sorting data...'));
			}

			chunk.sort(function(a, b) {
				return new Date(b.time).getTime() - new Date(a.time).getTime();
			});

			if (program.verbose) {
				console.log(chalk.yellow.bold('Done sorting. Filtering...'));
			}

			var toAdd = getDataToAdd(0, chunk);

		    var jsonStr = '[' + toAdd.join(',') + ']\n';

			if (program.verbose) {
				console.log(chalk.yellow.bold('Writing to output...'));
			}
		    writeToOutstream(ofs, jsonStr);
		})
		.on('end', function() {
			if (program.verbose) {
				console.log(chalk.yellow.bold('Done writing to output.'));
			}
			callback();
		});
}

function getDataToAdd(startIndex, data) {

    var toAdd = [];
    var i = getFirstIndexOfTypeWithExit(startIndex, program.type, data);
	var curSet = {
		start: new Date(data[i].time),
		end: new Date(data[i].time),
		eventsToday: 1,
		qualDays: 0
	};
	totalBack = 0;

    while(i < data.length) {

    	toAdd.push(JSON.stringify(data[i]));
    	curSet.end = new Date(data[i].time);

    	i = getFirstIndexOfType(i + 1, program.type, data);
    	if (i === data.length) {
    		if (curSet.eventsToday >= program.min) curSet.qualDays++;
	    	break;
    	}

    	var nextTime = new Date(data[i].time);

    	// gap & length
    	var gap = (curSet.end.getTime() - nextTime.getTime()) / DAY_IN_MILLI;
    	var length = (curSet.start.getTime() - curSet.end.getTime()) / DAY_IN_MILLI;

    	// coverage
    	if (verifySameDay(curSet.end, nextTime)) curSet.eventsToday++;
    	else if (curSet.eventsToday >= program.min) {
    		curSet.qualDays++;
    		curSet.eventsToday = 1;
    	}
    	var minQualDays = program.days / program.length * Math.max(program.length, length);

    	if (gap > program.gap && length > program.length && curSet.qualDays > minQualDays) break;
    	else if (gap > program.gap 
    		|| (length >= program.length && curSet.qualDays < minQualDays)) {
    		// start over
    		totalBack += gap + length;
    		
    		if (program.debug) {
	    		console.log(chalk.blue('Starting over because of gap.'));
	    		console.log(chalk.cyan('Current data set length (days): ' + length));
	    		console.log(chalk.cyan('Gap size (days): ' + gap))
	    		console.log(chalk.cyan('Total back in time (days): ' + totalBack));
	    		console.log(chalk.cyan('Current index: ' + i));
	    	}

    		toAdd = [];
			var curSet = {
				start: new Date(data[i].time),
				end: new Date(data[i].time),
				eventsToday: 1,
				qualDays: 0
			};
    	}

    }

    var length = getLength(curSet);
	var minQualDays = program.days / program.length * Math.max(program.length, length);
    if (length < program.length || curSet.qualDays < minQualDays) {
    	console.log(chalk.red.bold('There was no such data set that fit the criteria.'
					+ ' Terminating program.'));
    	process.exit(1);
    }
	if (program.verbose) {
    	console.log(chalk.blue('Start date: ' + curSet.start.toISOString()));
    	console.log(chalk.blue('End date: ' + curSet.end.toISOString()));
    	console.log(chalk.blue('Data set length (days): ' + length));
    	console.log(chalk.blue('Qualifying day coverage: ' + curSet.qualDays / length));
    }

    writeReport(curSet);

    getOtherTypesInDateRange(toAdd, data, curSet.start, curSet.end);

	return toAdd;

}

function getOtherTypesInDateRange(toAdd, data, start, end) {
	for (var i in data) {

		if (data[i].type !== program.type
			&& new Date(data[i].time).getTime() <= start.getTime()
			&& new Date(data[i].time).getTime() >= end.getTime()) {
			toAdd.push(JSON.stringify(data[i]));
		}

	}
}

function verifySameDay(d1, d2) {
	return d1.getDate() === d2.getDate()
			&& d1.getMonth() === d2.getMonth()
			&& d1.getYear() === d2.getYear();
}

function getLength(set) {
	return (set.start.getTime() - set.end.getTime()) / DAY_IN_MILLI;
}

function getFirstIndexOfType(start, type, data) {
	var i = start;
    while (i < data.length && data[i].type !== type)  i++;
    return i;
}

function getFirstIndexOfTypeWithExit(start, type, data) {
    var i = getFirstIndexOfType(start, type, data);
    if (i === data.length) {
    	console.log(chalk.red.bold('The selected data type does not exist in the data.'
    								+ ' Terminating program.'));
    	process.exit(1);
    }
    return i;
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

function makeInFileStream() {
	var ifs;
	if (program.input) {
		ifs = fs.createReadStream(program.input, {encoding: 'utf8'});
	} else {
		ifs = process.stdin;
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

function writeReport(set) {
	if (!program.report) return;

	var length = getLength(set);
	var data = program.input + ',' + program.output
				+ ',' + program.type + ',' 
				+ program.min + ',' + set.start.toISOString()
				+ ',' + set.end.toISOString() + ',' + length
				+ ',' + (set.qualDays / length) + '\n';
	fs.appendFile(program.report, data, function(err) {
		if (err) console.error(chalk.red.bold('Error writing report: ' + err));
	});
}