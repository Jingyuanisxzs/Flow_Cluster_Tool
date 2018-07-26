/*jshint esversion: 6 */
var router = require('express').Router();
// The top of our dir.
var FCT_DIR = process.env.FCT_DIR;
console.log("FCT_DIR=",FCT_DIR);
function walkfolders(dir) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    var filelist = filelist || [];
    files.forEach(function(file) {
            filelist.push(file);
    });
    return filelist;
}
var filelist = walkfolders('./public/data/compressed');
var decodedFileList = walkfolders('./public/data/uncompressed');
router.get('/favicon.ico', function (req, res, next) {
    ico_path=FCT_DIR+"/public/images/FCT.ico";
    console.log("favicon.ico => "+ico_path);
    res.sendFile(ico_path);
});
router.get('/', function(req, res, next) {
    res.render('selection',{title:'Flow Cluster Analysis Tool'});
});
router.get('/flow_data',function(req,res,next){
    res.render('index', { title: 'Flow Cluster Analysis Tool'});
});

module.exports = router;
