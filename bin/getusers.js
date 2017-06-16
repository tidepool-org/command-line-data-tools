#!/usr/bin/env node --harmony

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');
var request = require('request');
var fs = require('fs');
var chalk = require('chalk');

program
	.version('0.0.1')
	.arguments('<email>')
	.option('-p, --password <password>', 
		'Password for authemail. Recommended flag for piping to another tool.')
	.option('-o, --output <output>', 'path/to/output.json')
	.option('--dev', 'Use development server. Default server is production.')
	.option('--stg', 'Use staging server. Default server is production.')
	.option('--int', 'Use integration server. Default server is production.')
	.option('--clinic', 'Use clinic server. Default server is production.')
	.option('-v, --verbose', 'Verbose output.')
	.action(function(email) {
		
		var password, session_token;
		co(function *() {
			if (program.password)
				password = program.password;
			else
				password = yield prompt.password('Password: ');
		})
		
		.then(function() {
			var env = getEnvironment();
			var url = makeLoginRequestUrl(email, password, env);
			request.post({url: url},
				function(error, response, body) {

					exitOnError(error, response.statusCode,
						'An error occured with login request. ' 
							+ 'Bad username/password? ' + error
							+ ', ' + response.statusCode + ', '
							+ JSON.stringify(response));

					if (program.verbose) {
						console.log(chalk.green.bold('Successful login.'));
					}

					var user_id = JSON.parse(body).userid;
					var req = makeUserAccessRequest(user_id, response
												.headers['x-tidepool-session-token'],
												env);

					request.get(req, function(error, response, body) {

						exitOnError(error, response.statusCode, 
							'An error occured with user access request.');

						if (program.verbose) {
							console.log(chalk.green.bold(
									'Successful user access request.'));
						}

						var users = getUsersFromInfo(JSON.parse(body));
						outputToOutstream(program.output, users);
						
					});
			});
		});
		
	})
	.parse(process.argv);


function exitOnError(error, statusCode, message) {
	if (error || statusCode != 200) {
		console.error(chalk.red.bold(message
						+ ': ' + statusCode
						+ ', ' + error));
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

function getUsersFromInfo(info) {
	var users = [];
	for (var i in info) {
		users.push(	info[i].userid
					+ ','
					+ info[i].profile.fullName);
	}
	return users;
}

function outputToOutstream(output, users) {
	if (output) { 
		var outstream = fs.createWriteStream(program.output);
		for (var i in users) {
			outstream.write(users[i] + '\n');
		}
	}
	else { 
		for (var i in users) {
			console.log(users[i]);
		}
	}
}

function makeLoginRequestUrl(email, password, env) {
	return `https://${encodeURIComponent(email)}:${encodeURIComponent(password)}@${env}api.tidepool.org/auth/login`;
}

function makeUserAccessRequest(user_id, session_token, env) {
	return req = {
		url: `https://${env}api.tidepool.org/metadata/users/${user_id}/users`,
		headers: {
			'x-tidepool-session-token': 
				session_token
		}
	}
}