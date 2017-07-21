#!/usr/bin/env node --harmony

var crypto = require('crypto');

exports.program = program;
exports.performDataStripping = performDataStripping;
exports.printOptions = printOptions;
//exports.splitDeviceId = splitDeviceId;
exports.hashIDsForData = hashIDsForData;
exports.removeSourceForData = removeSourceForData;
exports.removeTransmitterIdForData = removeTransmitterIdForData;
exports.removeIDsAndPayload = removeIDsAndPayload;
exports.removeAnnotations = removeAnnotations;
//exports.stripBasalSuppressedInfo = stripBasalSuppressedInfo;
exports.stripModelAndSNForData = stripModelAndSNForData;
exports.stripData = stripData;

function removeSourceForData(data) {
	delete data.source;
}

function removeTransmitterIdForData(data) {
	delete data.transmitterId;
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

function removeIDsAndPayload(data) {
		if (data.payload)
			delete data.payload;
		if (data.id)
			delete data.id;
		if (data.guid)
			delete data.guid;
		if (data.type == 'wizard' && data.bolus)
			delete data.bolus;
}

function removeAnnotations(data) {
	if (data.annotations)
		delete data.annotations;
}

/*function stripBasalSuppressedInfo(data) {

		dataToStrip = data;

		while (dataToStrip.suppressed) {
			dataToStrip.suppressed.deviceId = data.type + ' device-Serial Number';
			delete dataToStrip.suppressed.source;
			delete dataToStrip.suppressed.payload;
			delete dataToStrip.suppressed.annotations;

			dataToStrip = dataToStrip.suppressed;
	}
}*/

function stripModelAndSNForData(data) {

	var deviceId = splitDeviceId(data.deviceId);
	var deviceComp = deviceId[0];

	deviceComp=data.type + ' device';
	if (data.type === 'upload') {
		// This probably isn't the best way to
		// go about scrubbing an upload but I
		// can't discern a better way to go
		// about it.
		delete data.deviceManufacturers;
		if (data.payload)
			delete data.payload.devices;
		if (data.deviceModel)
			data.deviceModel = data.deviceTags[0]
									+ ' model';
		if (data.deviceSerialNumber)
			data.deviceSerialNumber = 'Serial Number';
	}

	deviceId[1]='Serial Number';

	data.deviceId = deviceId.join('-');
}

function hashIDsForData(data) {
	if (data._groupId)
		data.hash_groupId =
			crypto.createHash('sha256')
				.update(data._groupId.toString())
				.digest('hex');
		delete data._groupId;
		if (data.uploadId)
			data.hash_uploadId =
				crypto.createHash('sha256')
					.update(data.uploadId.toString())
					.digest('hex');
		delete data.uploadId;
		if (data.byUser)
			data.hash_byUser =
				crypto.createHash('sha256')
					.update(data.byUser.toString())
					.digest('hex');
		delete data.byUser;
}

function stripData(callback) {

	stripBasalSuppressedInfo(data);

	removeAnnotations(data);

	removeIDsAndPayload(data);

	stripModelAndSNForData(data);

	hashIDsForData(data);

	removeSourceForData(data);

	removeTransmitterIdForData(data);

	callback();
}

if (require.main === module) {

	var program = require('commander');
	var fs = require('fs');
	var chalk = require('chalk');
	var JSONStream = require('JSONStream');

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

	performDataStripping(function() {});

	function performDataStripping(callback) {
		checkOptions();
		if (program.verbose) {
			printOptions();
		}

		var ifs = makeInFileStream();

		var jsonStream = JSONStream.parse('*');

		var ofs = makeOutstream();

		var first = true;
		writeToOutstream(ofs, '[');

		// Perform the parsing
		ifs
			.pipe(jsonStream)
			.on('data', function (chunk) {

				if ((program.removeAll
					|| program.removeTypes
					.indexOf(chunk.type) >= 0)
					&& program.leaveTypes
					.indexOf(chunk.type) < 0) {
						// Do NOT add this event to output
					return;
				}

				if (first)
					first = false;
				else
					writeToOutstream(ofs, ',');

				var cleanData = chunk;

				stripBasalSuppressedInfo(cleanData);

				removeAnnotations(cleanData);

				removeIDsAndPayload(cleanData);

				stripModelAndSNForData(cleanData);

				hashIDsForData(cleanData);

				removeSourceForData(cleanData);

				removeTransmitterIdForData(cleanData);

				writeToOutstream(ofs, JSON.stringify(cleanData));
			})
			.on('end', function() {
				writeToOutstream(ofs, ']');
				if (program.verbose) {
					console.log(chalk.yellow.bold('Done writing to output.'));
				}
				callback();
			});
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
}
