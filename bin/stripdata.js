#!/usr/bin/env node --harmony

var program = require('commander');
var fs = require('fs');
var chalk = require('chalk');
var JSONStream = require('JSONStream');
var crypto = require('crypto');

exports.program = program;
exports.performDataStripping = performDataStripping;
exports.printOptions = printOptions;
exports.splitDeviceId = splitDeviceId;
exports.hashIDsForData = hashIDsForData;

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
    	'Pass IDs (such as _groupid and uploadId) through a one-way hash.')
    .option('--removeSource',
    	'Remove the source of the data, e.g. carelink.')
    .option('--removeTransmitter',
    	'Remove the transmitter id, e.g. the transmitter id for a Dexcom.')
    .option('-v, --verbose',
    	'Verbose output.')
    .parse(process.argv);

performDataStripping(function() {});

function performDataStripping(callback) {
	checkOptions();
	if (program.verbose) {
		printOptions();
	}

	var ifs = makeInFileStream();

	var jsonStream = JSONStream.parse();

	var ofs = makeOutstream();

	// Perform the parsing
	ifs
		.pipe(jsonStream)
		.on('data', function (chunk) {
		    var allClean = [];
		    for (var i in chunk) {
			    if ((program.removeAll
			    	|| program.removeTypes
			    		.indexOf(chunk[i].type) >= 0)
			    	&& program.leaveTypes
			    		.indexOf(chunk[i].type) < 0) {
			    	// Do NOT add this event to output
			    	continue;
			    }

			    // Make data into object so it is
			    // passed by reference.
			    var cleanData = {val: chunk[i]};

			    stripModelAndSNForData(cleanData);

			    hashIDsForData(cleanData);

			    removeSourceForData(cleanData);

			    removeTransmitterIdForData(cleanData);

			    allClean.push(JSON.stringify(cleanData.val));
		    }
		    var cleanStr = '[' + allClean.join(',') + ']\n';

		    writeToOutstream(ofs, cleanStr);
		})
		.on('end', function() {
			if (program.verbose) {
				console.log(chalk.yellow.bold('Done writing to output.'));
			}
			callback();
		});
}

function list(val) {
	return val
		.split(',');
}

function splitDeviceId(deviceId) {
	var retlist=deviceId.split('-');
	if (retlist.length === 1) {
		// Probably split by '_'
		retlist=deviceId.split('_');
	} else if (retlist.length > 2) {
		// Split into more than two pieces
		var model=retlist.slice(0,-1).join('-');
		var serial=retlist[retlist.length-1];
		retlist=[];
		retlist.push(model);
		retlist.push(serial);
	}
	// Index 0 has model, 1 has serial
	return retlist;
}

// Because data is an object, this passes data
// by reference.
function stripModelAndSNForData(data) {

	var deviceId = splitDeviceId(data.val.deviceId);
    var deviceComp = deviceId[0];

    if ((program.stripAll
    	|| program.stripModels
    		.indexOf(deviceComp) >= 0)
    	&& program.leaveModels
    		.indexOf(deviceComp) < 0) {
    	if (data.val.type !== 'upload') {
    		deviceId[0]=data.val.type + ' device';
		} else {
			// This probably isn't the best way to
			// go about scrubbing an upload but I
			// can't discern a better way to go
			// about it.
			delete data.val.deviceManufacturers;
			if (data.val.payload)
				delete data.val.payload.devices;
			if (data.val.deviceModel)
				data.val.deviceModel = data.val.deviceTags[0]
										+ ' model';
			if (data.val.deviceSerialNumber)
				data.val.deviceSerialNumber = 'Serial Number';
		}
    }

    if ((program.stripAll
    	|| program.stripSNs
    		.indexOf(deviceComp) >= 0)
    	&& program.leaveSNs
    		.indexOf(deviceComp) < 0) {
    	deviceId[1]='Serial Number';
    }

    data.val.deviceId = deviceId.join('-');
}

function stripModelAndSNForUpload(data) {

}

// Because data is an object, this passes data
// by reference.
function hashIDsForData(data) {
	if (program.hashIDs) {
    	data.val.hash_groupId = 
    		crypto.createHash('sha256')
    			.update(data.val._groupId.toString())
    			.digest('hex');
    	delete data.val._groupId;
    	data.val.hash_uploadId = 
    		crypto.createHash('sha256')
    			.update(data.val.uploadId.toString())
    			.digest('hex');
    	delete data.val.uploadId;
    }
}

// Because data is an object, this passes data
// by reference.
function removeSourceForData(data) {
	if (program.removeSource) {
    	delete data.val.source;
    }
}

// Because data is an object, this passes data
// by reference.
function removeTransmitterIdForData(data) {
	if (program.removeTransmitter) {
    	delete data.val.transmitterId;
    }
}

function checkOptions() {
	if (!program.stripAll) {program.stripAll = false;}
	if (!program.removeAll) {program.removeAll = false;}
	if (!program.hashIDs) {program.hashIDs = false;}
	if (!program.removeSource) {program.removeSource = false;}
	if (!program.verbose) {program.verbose = false;}
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