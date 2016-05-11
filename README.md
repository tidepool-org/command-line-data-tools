Command-line Suite
=================

getusers
--------
*For a user email, retrieve the user emails that have shared data with this email.*
```
usage: getusers
	  -email    : user email that is shared with
	  -o        : /path/to/output.txt (optional; default is stdout)
	  --version
	  --help
```

getdata
-------
*For a user email, retrieve the json data for that user.*
```
usage: getdata
	  authemail      : user email for authentication
	  useremail      : user email for data request
	  -t, --types    : list of strings of data types (optional; default is all types)
	  				   e.g. cbg,bolus
	  -o, --output   : /path/to/output.json (optional; default is stdout)
	  --version
	  --help
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
usage: stripdata
	  -i        : /path/to/input.json (optional; default is stdin)
	  -o        : /path/to/output.json (optional; default is stdout)
	  --version
	  --help
```