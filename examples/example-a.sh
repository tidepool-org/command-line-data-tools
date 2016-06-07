#!/bin/bash
authemail=''
password=''
userlist='users.txt'

getusers $authemail -o $userlist --password $password
echo 

if [ $? != 0 ]
	then
	exit 1
fi
while read user; do
	echo " "
	echo "----------------"
	echo " "

	echo "Starting user $user..."
	if [ $user == "exampleUserIdß" ]
		then
		echo "Skipping user $user."
		continue
	fi
	echo "Getting data..."
	getdata $authemail --id $user --password $password -o $user-data.json -v
	if [ $? != 0 ]
		then
		echo "Getting data failed."
		continue
	fi
	echo "Got data. Stripping data..."
	stripdata --stripAll --hashIDs --removeSource --removeTransmitter -i $user-data.json -o $user-strip.json -v
	if [ $? != 0 ]
		then
		echo "Stripping data failed."
		continue
	fi
	echo "Stripped data. Filtering data..."
	filterdata cbg --length 100 --min 144 --days 75 --gap 14 --report report.csv -i $user-strip.json -o $user-filter.json -v
	if [ $? != 0 ]
		then
		echo "Filtering data failed."
		continue
	fi
	echo "Filtered data. Converting to workbook..."
	data2workbook $user.xlsx --mgdL -a -i $user-filter.json -v
	if [ $? != 0 ]
		then
		echo "Converting data to workbook failed."
		continue
	fi
	echo "Done with $user."
done < $userlist

rm *.json
rm $userlist