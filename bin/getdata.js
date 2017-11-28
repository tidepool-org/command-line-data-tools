#!/usr/bin/env node --harmony

/* eslint-disable no-console */

const program = require('commander');
const prompt = require('prompt-sync')();
const requestPromise = require('request-promise-native');
// Used because use of .pipe() with requestPromise is discouraged
const request = require('request');
const fs = require('fs');
const chalk = require('chalk');

function makeOutstream(output) {
  let outstream;
  if (output) {
    outstream = fs.createWriteStream(program.output);
  } else {
    outstream = process.stdout;
  }
  return outstream;
}

function exitOnError(error, statusCode, message) {
  if (error || statusCode !== 200) {
    console.error(`${chalk.red.bold(message)}\nError: ${error}\nStatus Code: ${statusCode}`);
    process.exit(1);
  }
}

function getEnvironment() {
  if (program.dev) return 'dev-';
  if (program.stg) return 'stg-';
  if (program.int) return 'int-';
  return '';
}

function makeLoginRequestUrl(email, password, env) {
  return `https://${encodeURIComponent(email)}:${encodeURIComponent(password)}@${env}api.tidepool.org/auth/login`;
}

function makeDataQueryRequest(id, sessionToken, env) {
  return {
    url: `https://${env}api.tidepool.org/data/${id}`,
    headers: {
      'x-tidepool-session-token': sessionToken,
      'Content-Type': 'application/json',
    },
  };
}
program
  .version('1.0.0')
  .arguments('<authemail> <id>')
  .option('-p, --password <password>',
    'Password for authemail. Recommended flag for piping to another tool.')
  .option('-o, --output <output>', 'path/to/output.json')
  .option('--dev', 'Use development server. Default server is production.')
  .option('--stg', 'Use staging server. Default server is production.')
  .option('--int', 'Use integration server. Default server is production.')
  .option('-v, --verbose', 'Verbose output.')
  .action((authemail, id) => {
    let password;
    if (program.password) {
      password = program.password;
    } else {
      password = prompt('Password: ', {
        echo: '*',
      });
    }
    const env = getEnvironment();
    let sessionToken = '';

    let req = {
      url: makeLoginRequestUrl(authemail, password, env),
      resolveWithFullResponse: true,
    };

    requestPromise.post(req)
      .then((response) => {
        if (program.verbose) {
          console.log(chalk.green.bold('Successful login.'));
        }

        sessionToken = response.headers['x-tidepool-session-token'];
      })
      .catch((error) => {
        exitOnError(error.error, error.statusCode, 'An error occurred with login request.');
      })
      .then(() => {
        req = makeDataQueryRequest(id, sessionToken, env);

        const outstream = makeOutstream(program.output);

        request.get(req, (error, dataResponse) => {
          exitOnError(error, dataResponse.statusCode, 'An error occurred with data request. Incorrect id for data?');

          if (program.verbose) {
            console.log(chalk.green.bold('Successful data request.'));
          }
        }).pipe(outstream);
      });
  })
  .parse(process.argv);
