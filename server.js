 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var imageSearch = require('node-google-image-search');
var url = process.env.MONGOLAB_URI;
var mongoose = require('mongoose');
var RecentSearch = require('./models/recent_searches');
mongoose.connect(url)

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://first-kitty.glitch.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })


app.route('/api/imagesearch/:search')
    .get(function(req, res) {
      var search = req.params.search.split("?")
      var searchTerm = search[0]
      var offset = 0
      
      if (req.query.offset && req.query.offset != 0) {
        offset = req.query.offset;
      }
      
      var results = imageSearch(searchTerm, function callback(results) {
        
        var newSearch = RecentSearch({
              search_term: searchTerm
        })
        
        newSearch.save(function(err) {
          if (err){
            console.log(err);
          }
        })
        
        res.send(results)
      }, offset, 10)

		
    })

app.route('/api/latest/imagesearch')
  .get(function(req, res) {
    
    var query = RecentSearch.find({}).limit(10).sort({ created_at: -1 })
  
    query.exec(function (err, RecentSearch) {
      if (err) console.log(err)
      res.send(RecentSearch)
    })
    
  })

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

