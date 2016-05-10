#!/usr/bin/env node --harmony

var program = require('commander');
var co = require('co');
var prompt = require('co-prompt');

program
    .arguments('<authemail> <useremail>')
    .action(function(authemail, useremail) {
	    var password = "";
	    co(function *() {
		    password = yield prompt.password('Password: ');
		});
	    console.log('authemail: %s', authemail);
	    console.log('useremail: %s', useremail);
	    console.log('password: %s', password);
	})
    .parse(process.argv);