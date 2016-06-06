# Command-line Suite

## Install
After cloning this repository, change directory to the repo and run
`npm install -g`

## Tools

### data2workbook
*Convert JSON data to a xlsx file. Possibly coming soon: documentation.*
```
  Usage: data2workbook [options] <output>

  Options:

    -h, --help            output usage information
    -V, --version         output the version number
    -i, --input <input>   path/to/input.json
    --mgdL                Convert all BG values to mg/dL.
    -a, --all             Create all pages.
    --smbg                Create smbg page.
    --cbg                 Create cbg page.
    --cgmSettings         Create cgm settings page.
    --bolus               Create bolus page.
    --basal               Create basal page.
    --basalSchedules      Create basal schedules page.
    --bgTarget            Create BG target page.
    --carbRatio           Create carb ratio page.
    --insulinSensitivity  Create insulin sensitivity page.
    --bloodKetone         Create blood ketone page.
    --wizard              Create wizard page.
    --upload              Create upload page.
    --deviceEvent         Create device event page.
    -v, --verbose         Verbose output.
```

Example:

`data2workbook mydata.xlsx --mgdL -a -i mydata.json -v`

>This produces an excel workbook with all data types. The data is inputted from the file *mydata.json*. All values are converted to mg/dL. The process will produce verbose output.

### generatedata
*Generate JSON for various data-types.*
```
  Usage: cbg [options] <output> <dates> <groupId>

  Generate cbg data.

  Options:

    -h, --help               output usage information
    --numPerDay <numPerDay>  Number of events per day. Use comma separated values for each date range, or one value for all dates. Default is 288 cbg values.
    --values <values>        Range for possible cbg values in mg/dL.Use comma separated values for each date range, or one value for all dates. Default is 100 mg/dL cbg values.
```

Example:

`generatedata cbg sample.json 2016-05-01,2016-05-10,2016-05-31,2016-06-02,2016-06-03,2016-06-06 mygroupId --numPerDay 144 --values 100,200,300,400,500,600`

> This generates cbg data and appends it to sample.json. All data has the _groupId *mygroupId*.

> The data complies to the following date ranges:

> - 5/1/2016 until 5/10/2016, 144 values per day in the range of 100-200 mg/dL
> - 5/31/2016 until 6/2/2016, 144 values per day in the range of 300-400 mg/dL
> - 6/3/2016 until 6/6/2016, 144 values per day in the range of 500-600 mg/dL

```
  Usage: smbg [options] <output> <dates> <groupId>

  Generate smbg data.

  Options:

    -h, --help               output usage information
    --numPerDay <numPerDay>  Number of events per day. Use comma separated values for each date range, or one value for all dates. Default is 1 smbg value.
    --values <values>        Range for possible smbg values in mg/dL.Use comma separated values for each date range, or one value for all dates. Default is 100 mg/dL smbg values.
```

Example:
`generatedata smbg sample.json 2016-06-01,2016-06-06 groupethan`

### getusers
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

### getdata
*For a user email, retrieve the json data for that user.*
```
  Usage: getdata [options] <authemail>

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    --email <email>            Email to get data for.
    --id <id>                  Id to get data for.
    -p, --password <password>  Password for authemail. Recommended flag for piping to another tool.
    -o, --output <output>      path/to/output.json
    -t, --types <types>        List of strings of data types. Only for email requests.
    --dev                      Use development server. Default server is production.
    --stg                      Use staging server. Default server is production.
    --int                      Use integration server. Default server is production.
    --clinic                   Use clinic server. Default server is production.
    -v, --verbose              Verbose output.
```

### filterdata
*Filter json data to meet specified criteria.*
```
  Usage: filterdata [options] <type>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -i, --input <input>    path/to/input.json
    -o, --output <output>  path/to/output.json
    --length <length>      Number of contiguous days, regardless of data. Default is 1 day.
    --min <min>            Minimum number of events per day to be a qualifying day. Default is 1 event.
    --days <days>          Minimum number of days with <min> events. Default is 1 day.
    --gap <gap>            Maximum gap of unqualifying days in <length> contiguous days. Default is 1 day.
    -v, --verbose          Verbose output.
    -d, --debug            Debugging logging.
```

### stripdata
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