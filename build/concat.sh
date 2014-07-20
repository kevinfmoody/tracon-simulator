#!/bin/bash

FILES=$(find ../ -name "*.js" | grep -v main | grep -v min | grep -v font)
cat $FILES
