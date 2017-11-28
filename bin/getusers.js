#!/usr/bin/env node --harmony

/* eslint-disable no-console */
/* eslint no-restricted-syntax: [0, "ForInStatement"] */

const program = require('commander');
const prompt = require('prompt-sync')();
const request = require('request-promise-native');
const fs = require('fs');
const chalk = require('chalk');

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
  if (program.clinic) return 'dev-clinic-';
  return '';
}

function getUsersFromInfo(info) {
  const users = [];
  for (const user of info) {
    users.push(`${user.userid},${user.profile.fullName}`);
  }
  return users;
}

function outputToOutstream(output, users) {
  if (output) {
    const outstream = fs.createWriteStream(program.output);
    for (const user of users) {
      outstream.write(`${user}\n`);
    }
  } else {
    for (const user of users) {
      console.log(user);
    }
  }
}

function makeLoginRequestUrl(email, password, env) {
  return `https://${encodeURIComponent(email)}:${encodeURIComponent(password)}@${env}api.tidepool.org/auth/login`;
}

function makeUserAccessRequest(userId, sessionToken, env) {
  return {
    url: `https://${env}api.tidepool.org/metadata/users/${userId}/users`,
    headers: {
      'x-tidepool-session-token': sessionToken,
    },
    json: true,
  };
}
program
  .version('1.0.0')
  .arguments('<email>')
  .option('-p, --password <password>',
    'Password for authemail. Recommended flag for piping to another tool.')
  .option('-o, --output <output>', 'path/to/output.json')
  .option('--dev', 'Use development server. Default server is production.')
  .option('--stg', 'Use staging server. Default server is production.')
  .option('--int', 'Use integration server. Default server is production.')
  .option('--clinic', 'Use clinic server. Default server is production.')
  .option('-v, --verbose', 'Verbose output.')
  .action((email) => {
    let password = '';
    if (program.password) {
      password = program.password;
    } else {
      password = prompt('Password: ', {
        echo: '*',
      });
    }

    const env = getEnvironment();

    let userId = null;
    let req = {
      url: makeLoginRequestUrl(email, password, env),
      resolveWithFullResponse: true,
    };

    request.post(req)
      .then((response) => {
        if (program.verbose) {
          console.log(chalk.green.bold('Successful login.'));
        }

        userId = JSON.parse(response.body).userid;
        req = makeUserAccessRequest(userId, response.headers['x-tidepool-session-token'], env);
      })
      .catch((error) => {
        exitOnError(error, error.statusCode, 'An error occured with login request. Bad username/password?');
      })
      .then(() => {
        request.get(req)
          .then((body) => {
            if (program.verbose) {
              console.log(chalk.green.bold('Successful user access request.'));
            }

            const users = getUsersFromInfo(body);
            outputToOutstream(program.output, users);
          });
      })
      .catch((error) => {
        exitOnError(error, error.statusCode, 'An error occured with user access request.');
      });
  })
  .parse(process.argv);
