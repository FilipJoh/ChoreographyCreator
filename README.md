# Choreography-Creator

A very simple tool for creating and learning different Choreographies

#### Setup using virtualenv (Ubuntu-18.04)

First install some dependencies
```
apt install python3-virtualenv ffmpeg
```
Create the virtual environment with Python3 as the interpreter
```
virtualenv -p python3 venv
```
Activate the environment
```
source venv/bin/activate
```
Python3 and pip3 are now the default calls for `python` and `pip`. 

To install the packages required for the choreographer, type
```
pip install -r requirements.txt
```
To exit the virtual environment, simply type `deactivate` in a terminal