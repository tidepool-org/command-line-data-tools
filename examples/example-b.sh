#!/bin/bash
authemail=''
password=''
userlist='users.txt'

echo "Getting users..."
getusers $authemail -o $userlist --password $password

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
	echo "Got data. Converting to workbook..."
	data2workbook $user.xlsx --mgdL -a -i $user-data.json -v
	if [ $? != 0 ]
		then
		echo "Converting data to workbook failed."
		continue
	fi
	echo "Done with $user."
done < $userlist

rm *.json
rm $userlist