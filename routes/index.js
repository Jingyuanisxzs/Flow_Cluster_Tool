/*jshint esversion: 6 */

var express = require('express');
var router = express.Router();
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
router.get('/', function(req, res, next) {
    res.render('selection',{title:'Flow Cluster Analysis Tool'})

});
router.get('/flow_data',function(req,res,next){
    res.render('index', { title: 'Flow Cluster Analysis Tool'});

});

//get data from frontend
// router.post('/signup', (req, res) => {
//   console.log(req.body);
// });

module.exports = router;
