#!/usr/bin/env node

/**
 * Module dependencies.
 */
const app = require('../app');
const debug = require('debug')('te:server');
const http = require('http');
const fs = require('fs');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.FCT_HTTP_PORT || '3000');
app.set('port', port);
/**
 * Create HTTP server.
 */
let myVar;//listen to the decoding process
const server = http.createServer(app);
const io = require('socket.io').listen(server);



// When a client connects, we note it in the console
io.sockets.on('connection', function (socket) {
    const startOMXList = walkfolders('./public/data/compressed');
    socket.emit('start omx list',startOMXList);
    console.log('A client is connected!');
    socket.on('disconnect', function(){
       console.log('user disconnected');
    });
    socket.on('chat message',function(msg){
      const originOMXList = walkfolders('./public/data/compressed');
      console.log(originOMXList);
      const OMXList = walkfolders('./public/data/uncompressed');
      console.log(OMXList);

      const receivedOMXRequest = 'flow_data_'+msg;
      const receivedOMXMatrices = 'flow_matrices_'+msg+'.omx';
      myVar = new Variable(10, function(){
        console.log('python script finished decoding!');
        socket.emit('finish',receivedOMXRequest);
      });


      if(!includeOrNot(receivedOMXMatrices,originOMXList)){
        socket.emit('find','false');
      }
      else if(includeOrNot(receivedOMXRequest,OMXList)){
        fs.readdir('./public/data/uncompressed/'+receivedOMXRequest, (err, files) => {
          const fileLength = files.length;
          if(fileLength<690){
            socket.emit('find','not complete');
          }
          else{
            socket.emit('find','true');
          }
        });
      }
      else{
        //exists, without Decoding, start decoding process
        socket.emit('find','not decoded');
        const msgSplit = msg.split('_');
        console.log('python script starts running')
        const exec = require('child_process').exec(
            'python ./public/python/decode_omx.py '+msgSplit[0]+' '+msgSplit[1]+' '+ msgSplit[2] , function(error, stdout, stderr) {
                if (error) {
                    console.log(error);
                }
                else if (stderr) {
                    console.log(stderr);
                }
                else if (stdout) {
                    console.log("RAN SUCCESSFULLY");
                }
            }
        );

        exec.stdout.pipe(process.stdout);
        exec.on('exit', function() {
            myVar.SetValue(1);
        });
      }
    });
});

function includeOrNot(element,array){
  for (let i = 0; i < array.length; i++){
      if (element === array[i]) {
        return true;
      }
  }
  return false;
}
function Variable(initVal, onChange)
{
    this.val = initVal;          //Value to be stored in this object
    this.onChange = onChange;    //OnChange handler
    //This method returns stored value
    this.GetValue = function(){
        return this.val;};
    //This method changes the value and calls the given handler
    this.SetValue = function(value){
        this.val = value;
        this.onChange();};
}

function walkfolders(dir) {
    const fs = require('fs'),
        files = fs.readdirSync(dir);
    const filelist = [];
    files.forEach(function(file) {
            filelist.push(file);
    });
    return filelist;
}
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
