# Command-line Suite

## Install
After cloning this repository, change directory to the repo and run
`npm install -g`

## Tools
*Examples are listed under each usage. For more examples, see the examples directory.*

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

>This produces an excel workbook with all data types. The data is inputted from the file *mydata.json*. All values are converted to mg/dL. The process produces verbose output.

### generatedata
*Generate JSON for various data-types.*
```
  Usage: cbg [options] <output> <dates> <groupId>

  Generate cbg data.

  Options:

    -h, --help               output usage information
    --numPerDay <numPerDay>  Number of events per day.Use comma separated values for a value range, or one exact value. Default is 288 cbg values per day.
    --values <values>        Range for possible cbg values in mg/dL.Use comma separated values for a value range, or one exact value. Default is 100 mg/dL cbg values.
```

Example:

`generatedata cbg sample.json 2016-05-01,2016-05-10 mygroupId --numPerDay 144 --values 100,200`

> This generates cbg data and appends it to sample.json. All data has the _groupId *mygroupId*.

> The data is from 5/1/2016 until 5/10/2016 with 144 values per day in the range of 100-200 mg/dL.

```
  Usage: smbg [options] <output> <dates> <groupId>

  Generate smbg data.

  Options:

    -h, --help               output usage information
    --numPerDay <numPerDay>  Number of events per day.Use comma separated values for a value range, or one exact value. Default is 288 cbg values per day.
    --values <values>        Range for possible cbg values in mg/dL.Use comma separated values for a value range, or one exact value. Default is 100 mg/dL cbg values.
```

Example:

`generatedata smbg sample.json 2016-5-22,2016-5-25 mygroupId --numPerDay 3,5 --values 122`

> This generates smbg data and appends it to sample.json. All data has the _groupId *mygroupId*.

> The data is from 5/22/2016 until 5/25/2016 with 3-5 values per day that have the value of 122 mg/dL.

```
  Usage: bolus [options] <output> <dates> <groupId> <subtype>

  Generate bolus data.

  Options:

    -h, --help               output usage information
    --numPerDay <numPerDay>  Number of boluses per day.Use comma separated values for a value range, or one exact value. Default is 1 bolus per day.
    --values <values>        Range for possible bolus amount in units.Use comma separated values for a value range, or one exact value. Default is 1 unit boluses.
```

Example:

`generatedata bolus sample.json 2016-6-1,2016-6-5 mygroupId normal --values 2,6`

> This generates bolus data and appends it to sample.json. All data has the _groupId *mygroupId*.

> The data is from 6/1/2016 until 6/5/2016 with 1 normal bolus per day that has the amount of 2-6 units.

### getusers
*For a user email, retrieve the user emails that have shared data with this email.*
```
  Usage: getusers [options] <email>

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -p, --password <password>  Password for authemail. Recommended flag for piping to another tool.
    -o, --output <output>      path/to/output.json
    --dev                      Use development server. Default server is production.
    --stg                      Use staging server. Default server is production.
    --int                      Use integration server. Default server is production.
    --clinic                   Use clinic server. Default server is production.
    -v, --verbose              Verbose output.
```

Example:

`getusers me@mydomain.com -o sharedwithme.txt`

> This gets all of the userIds that have shared their data with a particular email and outputs to *sharedwithme.txt*. A prompt appears in the console, instead of giving the password as an option.

### getdata
*For a user email, retrieve the json data for that user.*
```
  Usage: getdata [options] <authemail> <id>

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -p, --password <password>  Password for authemail. Recommended flag for piping to another tool.
    -o, --output <output>      path/to/output.json
    --dev                      Use development server. Default server is production.
    --stg                      Use staging server. Default server is production.
    --int                      Use integration server. Default server is production.
    --clinic                   Use clinic server. Default server is production.
    -v, --verbose              Verbose output.
```

Example:

`getdata me@mydomain.com someuserId --password myp@$$w0rd`
> This gets data for *someuserId* using the given authentication email and password. It outputs to the console so the data can be piped to another tool.

### filterdata
*Filter json data to meet specified criteria.*
```
  Usage: filterdata [options] <type> <input>

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output <output>  path/to/output.json
    --length <length>      Number of contiguous days, regardless of data. Default is 1 day.
    --min <min>            Minimum number of events per day to be a qualifying day. Default is 1 event.
    --days <days>          Minimum number of days with <min> events. Default is 1 day.
    --gap <gap>            Maximum gap of days without data in <length> contiguous days. Default is 1 day.
    -v, --verbose          Verbose output.
    -d, --debug            Debugging logging.
    --report <report>      Add a line to a report file summarizing results.
```

Example:

`filterdata cbg some-data.json --length 100 --min 144 --days 75 --gap 14 --report report.csv -o filtered-data.json -v`

> This filters the data in *some-data.json* and outputs to *filtered-data.json*. The tool produces verbose output in the console. The tool filters cbg data, looking for:

> - 100 contiguous days of cbg data (not every day necessarily contains cbg data)
> - Minimum 144 cbg values for a qualifying day
> - Minimum 75 of 100 days qualify
>     - The proportion of 75% is held if more than 100 contiguous days are found
> - Maximum gap of 14 days without cbg data

> The tool puts all other datatypes within the contiguous date range in the final dataset. The tool appends a row in *report.csv* with stats from a successful filter.

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
    --hashIDs                    Pass IDs (such as _groupId and uploadId) through a one-way hash.
    --removeSource               Remove the source of the data, e.g. carelink.
    --removeTransmitter          Remove the transmitter id, e.g. the transmitter id for a Dexcom.
    -v, --verbose                Verbose output.
```

Example:

`stripdata --stripAll --leaveModels Bayer6200,DexG5MobRec --hashIDs --removeSource --removeTransmitter -i some-data.json -o stripped-data.json -v`

> This strips the data in *some-data.json* and outputs to *stripped-data.json*. The tool produces verbose output in the console. All models and serial numbers are removed from the data, excluding the device models of *Bayer6200* and *DexG5MobRec*. All Ids that relate to PHI on the Tidepool Platform are passed through a oneway hash. The source of the data is removed. Any transmitter IDs are removed.