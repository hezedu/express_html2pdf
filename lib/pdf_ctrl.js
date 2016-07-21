"use strict";
var express = require('express');
var router = express.Router();
var pdf_ctrl = require('./webservices/pdf');

var uuid = require('node-uuid');
var path = require('path');

router.get('/', pdf_ctrl, function(req, res, next) {
  req.url = '/index.html';
  next();
});


console.log(path.join(__dirname, '../public/pdf_pre_html', uuid.v4() + '.html'));

var cache = {};
var hour = 1000 * 60 * 60
var post_html = function(req, res, next) {
  var html = req.body.html;
  var id = uuid.v4();
  cache[id] = {html:html, expire: Date.now() + hour, count:0};
  res.json({
    status: 200,
    id: id
  });
}

var get_html = function(req, res, next) {
  
  res.type('html');

  var id = req.params.id;
  if (cache[id]) {
    var html = cache[id].html;
    cache[id].count ++ ;
    res.send(html);
    if(cache[id].count ===2){
      console.log('销毁cache', id);
     /* cache[id] = null;
      delete(cache[id]);*/
    }
  } else {
    next();
  }
}

router.post('/post_html', post_html);
router.get('/get_html/:id', get_html);


router.get('/', pdf_ctrl, function(req, res, next) {
  req.url = '/index.html';
  next();
});




setTimeout(function() {  //防止缓存遗留 1小时清理一次。
  var now = Date.now();
  for (var i in cache) {
    if (now > cache[i].expire) {
      cache[i] = null;
      delete(cache[i]);
    }
  }
}, hour);
module.exports = router;