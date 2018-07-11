# Flow Cluster Editing Tool

This is a Nodejs web application(with some python scripts). The weighted Kmeans algorithm is used. The important data is not here. You should use your own flow_matrices.omx file. 

## Set Up
### 1. Download the folder
    1. package.json and package-lock.json might should be removed before setting up.
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
    4. As long as'./public/flow_data' folder is existing, the './public/data/flow_matrices.omx' file won't be decoded again.
### 2. Use Google Chrome or Firefox, and go to "https://localhost:3000".
    1. During the process of decoding, the webpage won't work.
    
## Current Fatals:
    1. Sometime, when you zoom out very quickly, the webpage may lose all the lines. You can run the next iteration to fix it.
    2. Browse using a Chrome Box won't work.
    3. If the matrix is not a flow matrix with some strange data, it may make the App stuck. You need to refresh the page manually. 
## Some Tips:
    1. All the lines are clickable, no matter it is a blue(single) line or red(clustered) line, but you have to click on the central of the line precisely. Clicking on the arrow won't have any effect.
    2. If you choose to see single flows in 'lines', the right-side table is clickable and highlight the chosen single flow on the map.
    3. If you choose to see single flows in 'dots', you can see a lot of circles in different sizes; however, the dots are not clickable and can't be selected through the right-side table.
    4. The slider can let the app run Kmeans continuously, but 20 iterations may be good enough. Don't leave it run forever(though it will stop after 200 iterations), it may occupy your cpu resource.
    5. Right now, the Kmeans process runs parallelly using four threads. If you have an awesome computer, such as 14 cores..., you may get a better performance by increasing the threads number, though the benchmark is unknown.
    6. './public/data/4326ZonesCoordinates.geojson' is provided. It is converted from the ZoneCoordinates.csv file. ZoneCoordinates.csv file uses 3401 GIS coding system. The Application doesn't support a 3401 coding system, so it is converted to 4326 using QGIS. 
   
