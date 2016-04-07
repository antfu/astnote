#!/bin/bash
# @Author: Anthony
# @Date:   2016-04-07 22:57:58
# @Last Modified by:   Anthony
# @Last Modified time: 2016-04-07 23:04:57

do git pull
do chmod +x astnote.py
do pkill astnote.py
do nohup astnote.py > nohup.out &