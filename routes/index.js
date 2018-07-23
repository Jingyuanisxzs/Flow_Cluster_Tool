/*jshint esversion: 6 */

var express = require('express');
var router = express.Router();

// The top of our dir.
var FCT_DIR = process.env.FCT_DIR;

console.log("FCT_DIR=",FCT_DIR);

/* GET home page. */

// const { Pool, Client } = require('pg');
// 
// const pool = new Pool({
//   user: 'engineer123456',
//   database: 'postgisDB',
//   password: '123456',
//   host: 'localhost',
//   port: 5432,
// });

// pool.query('SELECT luz,ST_AsGeoJSON(geom) FROM "luz_data_single_polygen"', (err, res) => {
// //  console.log(res.rows);
//   //var obj;
//   var i;
//   obj = {
//     type: "FeatureCollection",
//     features: []
//   };
//
//   for (i = 0; i < res.rows.length; i++) {
//     var item, feature, geometry;
//     item = res.rows[i];
//
//     geometry = JSON.parse(item.st_asgeojson);
//     delete item.st_asgeojson;
//
//     feature = {
//       type: "Feature",
//       properties: item,
//       geometry: geometry
//     };
//
//
//     obj.features.push(feature);
//   }
//   pool.end();
//
// });

function walkfolders(dir) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    var filelist = filelist || [];
    files.forEach(function(file) {
            filelist.push(file);
    });
    return filelist;
};
var filelist = walkfolders('./public/data/uncompressed');
console.log(filelist)
var exec = require('child_process').exec(
  'python ./public/python/decode_omx.py', function(error, stdout, stderr) {
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
});

router.get('/favicon.ico', function (req, res, next) {
  ico_path=FCT_DIR+"/public/images/FCT.ico";
  console.log("favicon.ico => "+ico_path);  
  res.sendFile(ico_path);
});

router.get('/', function(req, res, next) {
    res.render('selection',{title:'Flow Cluster Analysis Tool',omxList: filelist});
});

router.get('/flow_data',function(req,res,next){
    res.render('index', { title: 'Flow Cluster Analysis Tool'});
});

//get data from frontend
// router.post('/signup', (req, res) => {
//   console.log(req.body);
// });

module.exports = router;
