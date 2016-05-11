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
    .action(function(authemail, useremail) {
	    
	    var password, session_token;
	    co(function *() {
	       	password = yield prompt.password('Password: ');
	    })
	    
	    .then(function() {
			var url = makeLoginRequestUrl(authemail, password);
			request.post({url: url},
				function(error, response, body) {

					if (error || response.statusCode != 200) {
						console.error(chalk.red('An error occured with login request. ' 
							+ 'Bad username/password?'));
						process.exit(1);
					}

					var req = makeDataQueryRequest(
											useremail, 
											program.types,
											response.headers['x-tidepool-session-token']);
					
					var outstream;
					if (program.output) { 
						outstream = fs.createWriteStream(program.output); 
					}
					else { 
						outstream = process.stdout; 
					}

					request.post(req, function(error, response, body) {

						if (error || response.statusCode != 200) {
							console.error(chalk.red('An error occured with data request. '
								+ 'Incorrect email for data?'));
							process.exit(1);
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

function makeLoginRequestUrl(authemail, password) {
	return 'https://' + authemail + ':' + password +
		    	'@api.tidepool.org/auth/login';
}

function makeDataQueryRequest(email, types, session_token) {
	var reqBody = 'METAQUERY WHERE emails CONTAINS ' + email
					+ ' QUERY TYPE IN ' + types;
	// Possible types: 
	//		basal, bolus, cbg, 
	//		cgmSettings, deviceEvent, 
	//		deviceMeta, pumpSettings, 
	//		settings, smbg

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