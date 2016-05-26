#!/usr/bin/env node --harmony

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var request = require('request');
var fs = require('fs');
var chalk = require('chalk');

program
    .version('0.0.1')
    .arguments('<authemail> <useremail>')
    .option('-o, --output <output>', 'path/to/output.json')
    .option('-t, --types <types>', 'list of strings of data types', list)
    .option('-v, --verbose', 'Verbose output.')
    .action(function(authemail, useremail) {
	    
	    var password, session_token;
	    co(function *() {
	       	password = yield prompt.password('Password: ');
	    })
	    
	    .then(function() {
			var url = makeLoginRequestUrl(authemail, password);
			request.post({url: url},
				function(error, response, body) {

					exitOnError(error, response.statusCode, 
						'An error occured with login request. ' 
							+ 'Bad username/password?');

					if (program.verbose) {
						console.log(chalk.green.bold('Successful login.'));
					}

					var req = makeDataQueryRequest(
											useremail, 
											program.types,
											response
												.headers['x-tidepool-session-token']);
					
					var outstream = makeOutstream(program.output);

					request.post(req, function(error, response, body) {

						exitOnError(error, response.statusCode, 
							'An error occured with data request. '
							+ 'Incorrect email for data?');

						if (program.verbose) {
							console.log(chalk.green.bold('Successful data request.'));
						}
					}).pipe(outstream);

			});
	    });
		
    })
    .parse(process.argv);


function list(val) {
	return val
		.split(',')
		.join(', ');
}

function makeOutstream(output) {
	var outstream;
	if (output) { 
		outstream = fs.createWriteStream(program.output); 
	}
	else { 
		outstream = process.stdout; 
	}
	return outstream;
}

function exitOnError(error, statusCode, message) {
	if (error || statusCode != 200) {
		console.error(chalk.red.bold(message));
		process.exit(1);
	}
}

function makeLoginRequestUrl(email, password) {
	return 'https://' + email + ':' + password +
		    	'@api.tidepool.org/auth/login';
}

function makeDataQueryRequest(email, types, session_token) {
	var reqBody = 'METAQUERY WHERE emails CONTAINS ' + email
					+ ' QUERY TYPE IN ';
	if (types) {
		reqBody += types;
	} else {
		reqBody += 'basal, bolus, cbg, cgmSettings, deviceEvent, ' +
					'deviceMeta, pumpSettings, settings, smbg, '+
					'upload, wizard';
	}

	return req = {
		url: 'https://api.tidepool.org/query/data',
		headers: {
			'x-tidepool-session-token': 
				session_token,
			'Content-Type': 'application/json'
		},
		body: reqBody
	}
}