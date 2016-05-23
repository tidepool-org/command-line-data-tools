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
    .option('-o, --output <output>', 'path/to/output.json')
    .option('-v, --verbose', 'Verbose output.')
    .action(function(email) {
	    
	    var password, session_token;
	    co(function *() {
	       	password = yield prompt.password('Password: ');
	    })
	    
	    .then(function() {
			var url = makeLoginRequestUrl(email, password);
			request.post({url: url},
				function(error, response, body) {

					exitOnError(error, response.statusCode,
						'An error occured with login request. ' 
							+ 'Bad username/password?');

					if (program.verbose) {
						console.log(chalk.green.bold('Successful login.'));
					}

					var user_id = JSON.parse(body).userid;
					var req = makeUserAccessRequest(user_id, response
												.headers['x-tidepool-session-token']);

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
		console.error(chalk.red.bold(message));
		process.exit(1);
	}
}

function getUsersFromInfo(info) {
	var users = [];
	for (var key in info) {
		if (info[key].hasOwnProperty('view')
			|| info[key].hasOwnProperty('root')) {
			users.push(key);
		}
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

function makeLoginRequestUrl(email, password) {
	return 'https://' + email + ':' + password +
		    	'@api.tidepool.org/auth/login';
}

function makeUserAccessRequest(user_id, session_token) {
	return req = {
		url: 'https://api.tidepool.org/access/groups/' + user_id,
		headers: {
			'x-tidepool-session-token': 
				session_token
		}
	}
}