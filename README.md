Command-line Suite
=================

data2workbook
-------------
*Convert JSON data to a xlsx file. Coming soon: documentation.*
```
  Usage: data2workbook [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -i, --input <input>    path/to/input.json
    -o, --output <output>  path/to/output.xlsx
    --mgdL                 Convert all BG values to mg/dL.
    -a, --all              Create all pages.
    --smbg                 Create smbg page.
    --cbg                  Create cbg page.
    --cgmSettings          Create cgm settings page.
    --bolus                Create bolus page.
    --basal                Create basal page.
    --basalSchedules       Create basal schedules page.
    --bgTarget             Create BG target page.
    --carbRatio            Create carb ratio page.
    --insulinSensitivity   Create insulin sensitivity page.
    --bloodKetone          Create blood ketone page.
    --wizard               Create wizard page.
    --upload               Create upload page.
    --deviceEvent          Create device event page.
    -v, --verbose          Verbose output.
```

getusers
--------
*For a user email, retrieve the user emails that have shared data with this email.*
```
  Usage: getusers [options] <email>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output <output>  path/to/output.json
    --dev                  Use development server. Default server is production.
    --stg                  Use staging server. Default server is production.
    --int                  Use integration server. Default server is production.
    --clinic               Use clinic server. Default server is production.
    -v, --verbose          Verbose output.
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
    --dev                  Use development server. Default server is production.
    --stg                  Use staging server. Default server is production.
    --int                  Use integration server. Default server is production.
    --clinic               Use clinic server. Default server is production.
    -v, --verbose          Verbose output.
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

    -h, --help                   output usage information
    -V, --version                output the version number
    -i, --input <input>          path/to/input.json
    -o, --output <output>        path/to/output.json
    --stripModels <stripModels>  Strip model name for these models. e.g. Anonymous Pump
    --stripSNs <stripSNs>        Strip serial number for these models.
    --leaveModels <leaveModels>  Leave model for these models. Takes precedence over strip.
    --leaveSNs <leaveSNs>        Leave serial number for these models. Takes precedence over strip.
    --stripAll                   Strip all of the data, except for what is explicitly left.
    --removeTypes <removeTypes>  Remove these data types.
    --leaveTypes <leaveTypes>    Leave these data types. Takes precedence over removal.
    --removeAll                  Remove all data types, except for what is explicitly left.
    --hashIDs                    Pass IDs (such as _groupid and uploadId) through a one-way hash.
    --removeSource               Remove the source of the data, e.g. carelink.
    --removeTransmitter          Remove the transmitter id, e.g. the transmitter id for a Dexcom.
    -v, --verbose                Verbose output.
```