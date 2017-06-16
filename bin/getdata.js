#!/usr/bin/env node --harmony

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var request = require('request');
var fs = require('fs');
var chalk = require('chalk');

program
	.version('0.0.1')
	.arguments('<authemail> <id>')
	.option('-p, --password <password>',
		'Password for authemail. Recommended flag for piping to another tool.')
	.option('-o, --output <output>', 'path/to/output.json')
	.option('--dev', 'Use development server. Default server is production.')
	.option('--stg', 'Use staging server. Default server is production.')
	.option('--int', 'Use integration server. Default server is production.')
	.option('--clinic', 'Use clinic server. Default server is production.')
	.option('-v, --verbose', 'Verbose output.')
	.action(function (authemail, id) {

		var password;
		var session_token;
		co(function* () {
				if (program.password)
					password = program.password;
				else
					password = yield prompt.password('Password: ');
			})

			.then(function () {
				var env = getEnvironment();

				var url = makeLoginRequestUrl(authemail, password, env);
				request.post({
						url: url
					},
					function (error, response, body) {

						exitOnError(error,
							response ? response.statusCode : null,
							'An error occurred with login request. ' +
							'Bad username/password? ');

						if (program.verbose) {
							console.log(chalk.green.bold('Successful login.'));
						}

						var req = makeDataQueryRequest(id,
							response
							.headers['x-tidepool-session-token'],
							env);

						var outstream = makeOutstream(program.output);

						request.get(req, function (error, response, body) {

							exitOnError(error, response.statusCode,
								'An error occurred with data request. ' +
								'Incorrect id for data? ');

							if (program.verbose) {
								console.log(chalk.green.bold('Successful data request.'));
							}
						}).pipe(outstream);

					});
			});

	})
	.parse(process.argv);

function makeOutstream(output) {
	var outstream;
	if (output) {
		outstream = fs.createWriteStream(program.output);
	} else {
		outstream = process.stdout;
	}
	return outstream;
}

function exitOnError(error, statusCode, message) {
	if (error || statusCode != 200) {
		console.error(chalk.red.bold(message) +
			error + ', ' + statusCode);
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
	return `https://${encodeURIComponent(email)}:${encodeURIComponent(password)}@${env}api.tidepool.org/auth/login`;
}

function makeDataQueryRequest(id, session_token, env) {
	return req = {
		url: `https://${env}api.tidepool.org/data/${id}`,
		headers: {
			'x-tidepool-session-token': session_token,
			'Content-Type': 'application/json'
		}
	}
}