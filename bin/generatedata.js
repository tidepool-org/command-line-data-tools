#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');

const DAY_IN_MILLI = 86400000;
const BG_CONVERSION = 18.01559;

program
	.version('0.0.1');

program
	.command('cbg')
	.arguments('<output> <dates> <groupId>')
	.option('--numPerDay <numPerDay>', 
		'Number of events per day. Use comma separated values' 
		+ ' for each date range, or one value for all dates.'
		+ ' Default is 288 cbg values.', numberList, [288])
	.option('--values <values>',
		'Range for possible cbg values in mg/dL.'
		+ 'Use comma separated values' 
		+ ' for each date range, or one value for all dates.'
		+ ' Default is 100 mg/dL cbg values.', numberList, [100])
	.description('Generate cbg data.')
	.action(function(output, dates, groupId, options) {
		var dates = datesList(dates);
		if (dates.length/2 !== options.numPerDay.length
			&& options.numPerDay.length !== 1) {
			console.log(chalk.red.bold('Must have --numPerDay specified for each date pair '
				+ 'OR only specify one --numPerDay.'));
			process.exit(1);
		}
		if (dates.length !== options.values.length
			&& options.values.length !== 1) {
			console.log(chalk.red.bold('Must have --values specified for each date pair '
				+ 'OR only specify one --values.'));
			process.exit(1);
		}
		generateCbgData(output, dates, groupId, options, function() {});
	});

program
	.command('smbg')
	.arguments('<output> <dates> <groupId>')
	.option('--numPerDay <numPerDay>', 
		'Number of events per day. Use comma separated values' 
		+ ' for each date range, or one value for all dates.'
		+ ' Default is 1 smbg value.', numberList, [1])
	.option('--values <values>',
		'Range for possible smbg values in mg/dL.'
		+ 'Use comma separated values' 
		+ ' for each date range, or one value for all dates.'
		+ ' Default is 100 mg/dL smbg values.', numberList, [100])
	.description('Generate smbg data.')
	.action(function(output, dates, groupId, options) {
		var dates = datesList(dates);
		if (dates.length/2 !== options.numPerDay.length
			&& options.numPerDay.length !== 1) {
			console.log(chalk.red.bold('Must have --numPerDay specified for each date pair '
				+ 'OR only specify one --numPerDay.'));
			process.exit(1);
		}
		if (dates.length !== options.values.length
			&& options.values.length !== 1) {
			console.log(chalk.red.bold('Must have --values specified for each date pair '
				+ 'OR only specify one --values.'));
			process.exit(1);
		}
		generateSmbgData(output, dates, groupId, options, function() {});
	});

program.parse(process.argv);

function generateCbgData(output, dates, groupId, options, callback) {
	generateSimpleData(output,
						'cbg',
						'mmol/L',
						function(val) {
							return val/BG_CONVERSION;
						},
						dates,
						groupId,
						options,
						callback);
}

function generateSmbgData(output, dates, groupId, options, callback) {
	generateSimpleData(output,
						'smbg',
						'mmol/L',
						function(val) {
							return val/BG_CONVERSION;
						},
						dates,
						groupId,
						options,
						callback);
}

function generateSimpleData(output, type, units, conversion, dates, groupId, options, callback) {

	var newData = [];

	for (var i = 0; i < dates.length; i++) {
		var start = dates[i];
		var end = dates[++i];
		var numDays = (end.getTime() - start.getTime())
						/ DAY_IN_MILLI;

		for (var j = 0; j < numDays; j++) {
			var numEvents = options.numPerDay.length === 1 ? 
								options.numPerDay[0] 
									: options.numPerDay[(i - 1)/2];

			for (var k = 0; k < numEvents; k++) {
				var value;
				if (options.values.length === 1) {
					value = options.values[0];
				} else {
					value = Math.random() 
						* (options.values[i] - options.values[i - 1])
						+ options.values[i - 1];
				}

				newData.push({
					"_groupId": groupId,
					"clockDriftOffset": 0,
					"conversionOffset": 0,
					"createdTime": new Date().toISOString(),
					"deviceId": type + " device-Serial Number",
					"guid": "not_actually_a_guid",
					"id": "not_actually_an_id",
					"time": new Date(start + j).toISOString(),
					"timezoneOffset": 0,
					"type": type,
					"units": units,
					"uploadId": "upid_NA",
					"value": conversion(value)
				});
			}

		}
	}

	readExistingData(output, function(data) {
		var writeData = newData.concat(data);
		console.log(writeData.length);
		fs.writeFile(output, JSON.stringify(writeData), function(err) {
			if (err) {
				console.error(chalk.red.bold('An error occurred with writing the file.'));
				process.exit(1);
			}
			callback();
		});
	});

}

function datesList(string) {
	var dates = string.split(',');
 	if (dates.length%2 !== 0) {
		console.error(chalk.red.bold(
			'Dates arguments must come in pairs.'));
		process.exit(1);
	}
	return dates.map(function(str) { 
		return new Date(str);
	});
}

function numberList(string) {
	return string.split(',').map(Number);
}

function readExistingData(filename, callback) {

	fs.exists(filename, function(exists) {
		if (!exists) callback([]);

		var ifs = fs.createReadStream(filename, {encoding: 'utf8'});
		var jsonStream = JSONStream.parse();
		ifs
			.pipe(jsonStream)
			.on('data', function(data) {
				callback(data);
			});
	});

}