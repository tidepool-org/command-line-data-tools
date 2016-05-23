Command-line Suite
=================

getusers
--------
*For a user email, retrieve the user emails that have shared data with this email.*
```
  Usage: getusers [options] <email>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output <output>  path/to/output.json
```

getdata
-------
*For a user email, retrieve the json data for that user.*
```
  Usage: getdata [options] <authemail> <useremail>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output <output>  path/to/output.json
    -t, --types <types>    list of strings of data types
```

filterdata
----------------
*Filter json data to meet specified criteria.*
```
usage: filterdata
	  -length   : number of contiguous days, regardless of data (optional; default is 1 day)
	  -min	    : minimum number of events per day (optional; default is 1 event)
	  -days     : minimum number of days with <min> events (optional; default is 1 day)
	  -date     : start date (optional; default is most recent date with data)
	  -fromEnd  : true if working backwards in time
	  	          false if working forwards in time
			      (optional; default is true)
	  -date     : start date (optional; default depends on <fromEnd>,
	  	      	    	 	            most recent date with data if <fromEnd> is true,
						                oldest date with data if <fromEnd> is false)
	  -type     : data type ('cbg', 'bolus', etc.)
	  -i        : /path/to/input.json (optional; default is stdin)
	  -o        : /path/to/output.json (optional; default is stdout)
	  --version
	  --help
```

stripdata
---------
*Strip the json data of any patient information.*
```
  Usage: stripdata [options]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -i, --input <input>            path/to/input.json
    -o, --output <output>          path/to/output.json
    --stripModels <stripModels>    Strip model name for these models. e.g. Anonymous Pump
    --stripSNs <stripSNs>          Strip serial number for these models.
    --leaveModels <leaveModels>    Leave model for these models. Takes precedence over strip.
    --leaveSNs <leaveSNs>          Leave serial number for these models. Takes precedence over strip.
    --stripAll <stripAll>          Strip all of the data, except for what is explicitly left.
    --removeTypes <removeTypes>    Remove these data types.
    --leaveTypes <leaveTypes>      Leave these data types. Takes precedence over removal.
    --removeAll <removeAll>        Remove all data types, except for what is explicitly left.
    --hashIDs <hashIDs>            Pass IDs (such as _groupid and uploadId) through a one-way hash.
    --removeSource <removeSource>  Remove the source of the data, e.g. carelink.
```
test
