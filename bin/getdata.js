#!/usr/bin/env node --harmony

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var request = require('request');
var fs = require('fs');
var chalk = require('chalk');

program
	.version('0.0.1')
	.arguments('<authemail>')
	.option('--email <email>',
		'Email to get data for.')
	.option('--id <id>',
		'Id to get data for.')
	.option('-p, --password <password>', 
		'Password for authemail. Recommended flag for piping to another tool.')
	.option('-o, --output <output>', 'path/to/output.json')
	.option('-t, --types <types>', 
		'List of strings of data types. Only for email requests.', list)
	.option('--dev', 'Use development server. Default server is production.')
	.option('--stg', 'Use staging server. Default server is production.')
	.option('--int', 'Use integration server. Default server is production.')
	.option('--clinic', 'Use clinic server. Default server is production.')
	.option('-v, --verbose', 'Verbose output.')
	.action(function(authemail) {
		
		var password;
		var session_token;
		co(function *() {
			if (program.password)
				password = program.password;
			else
				password = yield prompt.password('Password: ');
		})
		
		.then(function() {
			var env = getEnvironment();

			var url = makeLoginRequestUrl(authemail, password, env);
			request.post({url: url},
				function(error, response, body) {

					exitOnError(error, 
						response ? response.statusCode : null, 
						'An error occured with login request. ' 
							+ 'Bad username/password? ');

					if (program.verbose) {
						console.log(chalk.green.bold('Successful login.'));
					}

					var req = makeDataQueryRequest(program.types,
											response
												.headers['x-tidepool-session-token'],
											env);
					
					var outstream = makeOutstream(program.output);

					var makerequest;
					if (program.email) makerequest = request.post;
					else if (program.id) makerequest = request.get;
					makerequest(req, function(error, response, body) {

						exitOnError(error, response.statusCode, 
							'An error occured with data request. '
							+ 'Incorrect email/id for data? ');

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
		console.error(chalk.red.bold(message) 
						+ error + ', ' + statusCode);
		process.exit(1);
	}
}

function getEnvironment() {
	if (program.dev) return 'dev-';
	if (program.stg) return 'stg-';
	if (program.int) return 'int-';
	if (program.clinic) return 'dev-clinic-';
	return '';
}

function makeLoginRequestUrl(email, password, env) {
	return 'https://' + email + ':' + password +
				'@' + env + 'api.tidepool.org/auth/login';
}

function makeDataQueryRequest(types, session_token, env) {
	if (program.email) {
		return makeDateQueryRequestForEmail(program.email, types, session_token, env);
	} else if (program.id) {
		return makeDataQueryRequestForId(program.id, session_token, env);
	}
	console.error(chalk.red.bold('Must use either the email option or the id option.'));
	process.exit(1);
}

function makeDateQueryRequestForEmail(email, types, session_token, env) {
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
		url: 'https://'+ env +'api.tidepool.org/query/data',
		headers: {
			'x-tidepool-session-token': 
				session_token,
			'Content-Type': 'application/json'
		},
		body: reqBody
	}
}

function makeDataQueryRequestForId(id, session_token, env) {
	return req = {
		url: 'https://'+ env +'api.tidepool.org/data/' + id,
		headers: {
			'x-tidepool-session-token': 
				session_token,
			'Content-Type': 'application/json'
		}
	}
}