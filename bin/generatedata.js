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
		'Number of events per day.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 288 cbg values per day.', numberList, [288])
	.option('--values <values>',
		'Range for possible cbg values in mg/dL.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 100 mg/dL cbg values.', numberList, [100])
	.description('Generate cbg data.')
	.action(function(output, dates, groupId, options) {
		var dates = datesList(dates);

		checkDatesAndOptionsWithExit(dates, options);

		generateCbgData(output, dates, groupId, options, function() {});
	});

program
	.command('smbg')
	.arguments('<output> <dates> <groupId>')
	.option('--numPerDay <numPerDay>', 
		'Number of events per day.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 288 cbg values per day.', numberList, [288])
	.option('--values <values>',
		'Range for possible cbg values in mg/dL.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 100 mg/dL cbg values.', numberList, [100])
	.description('Generate smbg data.')
	.action(function(output, dates, groupId, options) {
		var dates = datesList(dates);

		checkDatesAndOptionsWithExit(dates, options);

		generateSmbgData(output, dates, groupId, options, function() {});
	});

program
	.command('bolus')
	.arguments('<output> <dates> <groupId> <subtype>')
	.option('--numPerDay <numPerDay>',
		'Number of boluses per day.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 1 bolus per day.', numberList, [1])
	.option('--values <values>',
		'Range for possible bolus amount in units.'
		+ 'Use comma separated values' 
		+ ' for a value range, or one exact value.'
		+ ' Default is 1 unit boluses.', numberList, [1])
	.description('Generate bolus data.')
	.action(function(output, dates, groupId, subtype, options) {
		var dates = datesList(dates);

		checkDatesAndOptionsWithExit(dates, options);
		checkBolusSubtypeWithExit(subtype);

		generateBolusData(output, dates, groupId, subtype, options, function() {});
	})

program.parse(process.argv);

function generateCbgData(output, dates, groupId, options, callback) {
	var extras = {
		"type": "cbg",
		"units": "mmol/L"
	}

	var values = [
		{
			key: "value",
			operation: function(range) {
				return randomValueInRange(range)
						/ BG_CONVERSION;
			},
			range: options.values
		}
	];

	generateDataWithExtras(output,
						extras,
						values,
						dates,
						groupId,
						options,
						callback);
}

function generateSmbgData(output, dates, groupId, options, callback) {
	var extras = {
		"type": "smbg",
		"units": "mmol/L" 
	}

	var values = [
		{
			key: "value",
			operation: function(range) {
				return randomValueInRange(range)
						/ BG_CONVERSION;
			},
			range: options.values
		}
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
	if (subtype === 'normal')
		generateNormalBolusData(output, dates, groupId, options, callback);
}

function generateNormalBolusData(output, dates, groupId, options, callback) {
	var amount = randomValueInRange(options.values);
	var extras = {
		"type": "bolus",
		"subType": "normal"
	}

	var values = [
		{
			key: "normal",
			operation: function(range) {
				return randomValueInRange(range);
			},
			range: options.values
		},
		{
			key: "expectedNormal",
			operation: function(range) {
				return randomValueInRange(range);
			},
			range: options.values
		}
	];

	generateDataWithExtras(output,
						extras,
						values,
						dates,
						groupId,
						options,
						callback);
}

function generateDataWithExtras(output, extras, values, dates, groupId, options, callback) {

	var newData = [];

	var start = dates[0];
	var end = dates[1];

	var numDays = (end.getTime() - start.getTime())
					/ DAY_IN_MILLI;

	for (var i = 0; i < numDays; i++) {
		var numEvents = randomValueInRange(options.numPerDay);

		for (var j = 0; j < numEvents; j++) {

			var time = new Date(start);
			time.setDate(time.getDate() + i);

			var common = {
				"_groupId": groupId,
				"clockDriftOffset": 0,
				"conversionOffset": 0,
				"createdTime": new Date().toISOString(),
				"deviceId": extras.type + " device-Serial Number",
				"deviceTime": time.toISOString(),
				"guid": "not_actually_a_guid",
				"id": "not_actually_an_id",
				"time": time.toISOString(),
				"timezoneOffset": 0,
				"uploadId": "upid_NA"
			};

			for (var index in values) {
				var value = values[index];
				common[value.key] = value.operation(value.range);
			}

			for (var key in extras) {
				common[key] = extras[key];
			}

			newData.push(common);
		}
	}

	readExistingData(output, function(data) {
		var writeData = newData.concat(data);
		fs.writeFile(output, JSON.stringify(writeData), function(err) {
			if (err) {
				console.error(chalk.red.bold('An error occurred with writing the file.'));
				process.exit(1);
			}
			callback();
		});
	});

}

function randomValueInRange(range) {
	if (range.length === 1) {
		return range[0];
	}
	return Math.random() 
		* (range[1] - range[0])
		+ range[0];
}

function checkDatesAndOptionsWithExit(dates, options) {

	if (dates.length !== 2) {
		console.error(chalk.red.bold('Must have a date range with exactly'
			+ ' two dates.'));
		process.exit(1);
	}
	if (options.numPerDay.length !== 2
		&& options.numPerDay.length !== 1) {
		console.error(chalk.red.bold('For --numPerDay, must specify a '
			+ 'range or an exact value.'));
		process.exit(1);
	}
	if (options.values.length !== 2
		&& options.values.length !== 1) {
		console.error(chalk.red.bold('For --values, must specify a '
			+ 'range or an exact value.'));
		process.exit(1);
	}

}

function checkBolusSubtypeWithExit(subtype) {
	if (subtype !== 'normal') {
		console.error(chalk.red.bold('Normal is currently the only '
			+ 'supported subtype of bolus.'));
		process.exit(1);
	}
}

function datesList(string) {
	var dates = string.split(',');
	return dates.map(function(str) { 
		return new Date(str);
	});
}

function numberList(string) {
	return string.split(',').map(Number);
}

function readExistingData(filename, callback) {

	fs.exists(filename, function(exists) {
		if (!exists) {
			callback([]);
			return;
		}

		var ifs = fs.createReadStream(filename, {encoding: 'utf8'});
		var jsonStream = JSONStream.parse();
		ifs
			.pipe(jsonStream)
			.on('data', function(data) {
				callback(data);
			});
	});

}