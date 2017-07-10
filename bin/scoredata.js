#!/usr/bin/env node --harmony

var program = require('commander');
var Excel = require('exceljs');
var JSONStream = require('JSONStream');
var fs = require('fs');
var chalk = require('chalk');
var ss = require('simple-statistics');
var path = require('path');

const MAX_EGV_PER_DAY = 288;
const DAY_IN_MILLI = 86400000;

program
	.version('0.0.1')
	.arguments('<scoresheet>')
	.option('-i, --input <input>', 'path/to/input.json')
	.option('-o, --output <output>', 'path/to/output.json')
	.option('-v, --verbose', 'Verbose output.')
	.action(function(scoresheet) {
		performDataScoring(scoresheet, program.input, program.output, function() {
			process.exit(0);
		});
	})
	.parse(process.argv);

function performDataScoring(scoresheet, input, output, callback) {
	if (program.verbose) {
		console.log(chalk.green.bold('Options:'));
		printOptions();
		console.log(chalk.yellow.bold('\nReading input...'));
	}

	var data = require(path.resolve(process.cwd(), input));

	if (data.length === 0) {
		console.error(chalk.red.bold(
			'There must be data in the input set. Terminating program.'));
		process.exit(1);
	}

	if (program.verbose) {
		console.log(chalk.yellow.bold('Done reading input. Scoring...'));
	}

	scoringParametersForSheet(scoresheet, function(scoring) {
		countAndScoreData(data, scoring, function (score) {
			writeToOutput(output, (input || 'piped-in') + ': ' + score,
				function () {
					if (program.verbose) {
						console.log(chalk.yellow.bold('Done scoring data.'));
					}
					callback();
				});
		});
	});
}

function countAndScoreData(data, scoring, callback) {
	var countResults = countData(data, scoring);
	var score = scoreData(countResults, scoring);

	callback(score);
}

function countData(data, scoring) {
	var i = 0;

	var start = new Date(data[i].time);
	var end = new Date(data[data.length - 1].time);
	var curSet = {
		'curDate': new Date(start),
		'cbg': 0,
		'bolus': 0,
		'exercise': 0,
		'qualifyingDaysWithData': 0,
		'uniqueEGVPerDay': [],
		'bolusRecordsPerDay': [],
		'exerciseRecordsPerDay': []
	}

	var lastTimeForSorted = new Date(start).getTime();

	while (i < data.length) {

		if (lastTimeForSorted < new Date(data[i].time).getTime()) {
			console.error('Data must be sorted. Use the \'sortdata\' tool first.');
			process.exit(1);
		} else {
			lastTimeForSorted = new Date(data[i].time).getTime();
		}

		if (!verifySameDay(
				curSet.curDate,
				new Date(data[i].time))) {
			
			incrementAndResetCurSet(curSet, scoring);

			curSet.curDate = new Date(data[i].time);
		} else {
			if (data[i].type in curSet)
				++curSet[data[i].type];

			i++;
		}

	}

	incrementAndResetCurSet(curSet, scoring);
	delete curSet.cbg;
	delete curSet.bolus;
	delete curSet.exercise;

	delete curSet.curDate;

	curSet.uniqueEGVPerDay = 
		calculateUniqueEGVPerDay(curSet.uniqueEGVPerDay, scoring);
	curSet.bolusRecordsPerDay =
		calculateBolusRecordsPerDay(curSet.bolusRecordsPerDay, scoring);
	curSet.exerciseRecordsPerDay = 
		calculateExerciseRecordsPerDay(curSet.exerciseRecordsPerDay, scoring);
	curSet.contiguousDays = getLength(start, end);

	return curSet;
}

function incrementAndResetCurSet(curSet, scoring) {
	curSet.uniqueEGVPerDay.push(curSet.cbg);
	curSet.bolusRecordsPerDay.push(curSet.bolus);
	curSet.exerciseRecordsPerDay.push(curSet.exercise);

	if (curSet.cbg >= scoring.uniqueEGVPerDay.min * MAX_EGV_PER_DAY
		&& curSet.bolus >= scoring.bolusRecordsPerDay.min
		&& curSet.exercise >= scoring.exerciseRecordsPerDay.min) {
		++curSet.qualifyingDaysWithData;
	}

	curSet.cbg = 0;
	curSet.bolus = 0;
	curSet.exercise = 0;
}

function calculateUniqueEGVPerDay(uniqueEGVPerDayList, scoring) {
	var propEGVPerDayList = uniqueEGVPerDayList.map(
		function(count) {
			return count / MAX_EGV_PER_DAY;
	});

	return percentile(propEGVPerDayList, scoring.uniqueEGVPerDay.percentile);
}

function calculateBolusRecordsPerDay(bolusRecordsPerDayList, scoring) {
	return percentile(bolusRecordsPerDayList, scoring.bolusRecordsPerDay.percentile);
}

function calculateExerciseRecordsPerDay(exerciseRecordsPerDayList, scoring) {
	return percentile(exerciseRecordsPerDayList, scoring.exerciseRecordsPerDay.percentile);
}

function meanMinusStdDev(dataset) {
	return ss.mean(dataset) 
		- ss.standardDeviation(dataset);
}

function meanMinusTwoStdDev(dataset) {
	return ss.mean(dataset) 
		- 2 * ss.standardDeviation(dataset);
}

function percentile(dataset, percent) {
	return ss.quantile(dataset, percent);
}

function scoreData(countResults, scoring) {

	var total = 0;

	if (countResults.contiguousDays >= scoring.contiguousDays.tier4)
		total += scoring.contiguousDays.multiplier * scoring.contiguousDays.tier4points;
	else if (countResults.contiguousDays >= scoring.contiguousDays.tier3)
		total += scoring.contiguousDays.multiplier * scoring.contiguousDays.tier3points;
	else if (countResults.contiguousDays >= scoring.contiguousDays.tier2)
		total += scoring.contiguousDays.multiplier * scoring.contiguousDays.tier2points;
	else if (countResults.contiguousDays >= scoring.contiguousDays.tier1)
		total += scoring.contiguousDays.multiplier * scoring.contiguousDays.tier1points;

	if (countResults.qualifyingDaysWithData >= scoring.qualifyingDaysWithData.tier4)
		total += scoring.qualifyingDaysWithData.multiplier * scoring.qualifyingDaysWithData.tier4points;
	else if (countResults.qualifyingDaysWithData >= scoring.qualifyingDaysWithData.tier3)
		total += scoring.qualifyingDaysWithData.multiplier * scoring.qualifyingDaysWithData.tier3points;
	else if (countResults.qualifyingDaysWithData >= scoring.qualifyingDaysWithData.tier2)
		total += scoring.qualifyingDaysWithData.multiplier * scoring.qualifyingDaysWithData.tier2points;
	else if (countResults.qualifyingDaysWithData >= scoring.qualifyingDaysWithData.tier1)
		total += scoring.qualifyingDaysWithData.multiplier * scoring.qualifyingDaysWithData.tier1points;

	if (countResults.uniqueEGVPerDay >= scoring.uniqueEGVPerDay.tier4)
		total += scoring.uniqueEGVPerDay.multiplier * scoring.uniqueEGVPerDay.tier4points;
	else if (countResults.uniqueEGVPerDay >= scoring.uniqueEGVPerDay.tier3)
		total += scoring.uniqueEGVPerDay.multiplier * scoring.uniqueEGVPerDay.tier3points;
	else if (countResults.uniqueEGVPerDay >= scoring.uniqueEGVPerDay.tier2)
		total += scoring.uniqueEGVPerDay.multiplier * scoring.uniqueEGVPerDay.tier2points;
	else if (countResults.uniqueEGVPerDay >= scoring.uniqueEGVPerDay.tier1)
		total += scoring.uniqueEGVPerDay.multiplier * scoring.uniqueEGVPerDay.tier1points;

	if (countResults.bolusRecordsPerDay >= scoring.bolusRecordsPerDay.tier4)
		total += scoring.bolusRecordsPerDay.multiplier * scoring.bolusRecordsPerDay.tier4points;
	else if (countResults.bolusRecordsPerDay >= scoring.bolusRecordsPerDay.tier3)
		total += scoring.bolusRecordsPerDay.multiplier * scoring.bolusRecordsPerDay.tier3points;
	else if (countResults.bolusRecordsPerDay >= scoring.bolusRecordsPerDay.tier2)
		total += scoring.bolusRecordsPerDay.multiplier * scoring.bolusRecordsPerDay.tier2points;
	else if (countResults.bolusRecordsPerDay >= scoring.bolusRecordsPerDay.tier1)
		total += scoring.bolusRecordsPerDay.multiplier * scoring.bolusRecordsPerDay.tier1points;

	if (countResults.exerciseRecordsPerDay >= scoring.exerciseRecordsPerDay.tier4)
		total += scoring.exerciseRecordsPerDay.multiplier * scoring.exerciseRecordsPerDay.tier4points;
	else if (countResults.exerciseRecordsPerDay >= scoring.exerciseRecordsPerDay.tier3)
		total += scoring.exerciseRecordsPerDay.multiplier * scoring.exerciseRecordsPerDay.tier3points;
	else if (countResults.exerciseRecordsPerDay >= scoring.exerciseRecordsPerDay.tier2)
		total += scoring.exerciseRecordsPerDay.multiplier * scoring.exerciseRecordsPerDay.tier2points;
	else if (countResults.exerciseRecordsPerDay >= scoring.exerciseRecordsPerDay.tier1)
		total += scoring.exerciseRecordsPerDay.multiplier * scoring.exerciseRecordsPerDay.tier1points;

	return total;
}

function scoringParametersForSheet(filename, callback) {
	new Excel.Workbook().csv.readFile(filename)
		.then(function(worksheet) {
			var scoring = {};
			worksheet.eachRow(function(row, rowNumber) {
				if (rowNumber === 1) return;
				var scoringRow = {
					'multiplier': row.getCell(2).value,
					'tier1': row.getCell(3).value,
					'tier1points': row.getCell(4).value,
					'tier2': row.getCell(5).value,
					'tier2points': row.getCell(6).value,
					'tier3': row.getCell(7).value,
					'tier3points': row.getCell(8).value,
					'tier4': row.getCell(9).value,
					'tier4points': row.getCell(10).value
				};

				if (row.getCell(11).value)
					scoringRow.min = row.getCell(11).value;

				if (row.getCell(12).value)
					scoringRow.percentile = row.getCell(12).value;

				scoring[row.getCell(1).value] = scoringRow;
			})
			callback(scoring);
		});
}

function makeInFileStream(inputName) {
	var ifs;
	if (inputName) {
		ifs = fs.createReadStream(inputName, {encoding: 'utf8'});
	} else {
		ifs = process.stdin;
	}
	return ifs;
}

function writeToOutput(outputName, info, callback) {
	if (outputName) {
		var ofs = fs.createWriteStream(outputName);
		ofs.write(info);
		ofs.end(callback);
	} else {
		console.log(info);
		callback();
	}
}

function printOptions() {
	console.log(chalk.blue.bold('input: ') + program.input);
	console.log(chalk.blue.bold('output: ') + program.output);
}

function verifySameDay(d1, d2) {
	return d1.getDate() === d2.getDate()
			&& d1.getMonth() === d2.getMonth()
			&& d1.getYear() === d2.getYear();
}

function getLength(start, end) {
	return (start.getTime() - end.getTime()) / DAY_IN_MILLI;
}