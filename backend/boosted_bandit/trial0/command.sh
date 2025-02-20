#!/bin/bash

if [ $1 == "train" ]
then

	# train
	echo "doing train"
	java -jar boostsrl.jar -l -train train/ -target team -trees 5 > output_train.txt 2>&1

fi

if [ $1 == "test" ]
then

	# test
	echo "doing test"
	java -jar boostsrl.jar -i -model train/models/ -test test/ -target team -aucJarPath . -trees 5 > output_test.txt 2>&1

fi
