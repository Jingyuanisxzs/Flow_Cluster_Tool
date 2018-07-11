# Flow_Cluster_Tool

This is a Nodejs web application(with some python scripts). The important data is not here. You should use your own flow_matrices.omx file. 
package.json and package-lock.json might should be removed before setting up.

## Set Up
### 1. Download the folder
### 2. Go to the root of the folder, and run some npm commands in the terminal/cmd. If 'npm' is not found, then you may need to install nodejs first...
    1. npm install
    2. npm install --save express
       npm install --save Blob
       npm install --save child-process
       npm install --save http-errors
       npm install --save jade
       npm install --save jsdom
       npm install --save morgan
       
### 3. Python2.7 is needed. Please use PIP to install openmatix and numpy.
### 4. Go to './public/data/' folder, add your 'flow_matrices.omx'(name is important, must be exactly the same name) file there.

## Run The Application
### 1. Use your terminal going to the root and type 'npm start'
    1. You can see some message in the terminal.
    2. The application will create a new folder './public/flow_data/' if there isn't one.
    3. It may take one hour to extract OMX file into a bunch of csv files stored in './public/flow_data/'
    4. As long as'./public/flow_data' is existing, the './public/data/flow_matrices.omx' file won't be decoded again.
### 2. Use Google Chrome and go to "https://localhost:3000".
    1. During the process of decoding, the webpage won't work.
    
## Current Fatals:
    1. Sometime, when you zoom out very quickly, the webpage may lose all the lines. You can run the next iteration to fix it.
    
