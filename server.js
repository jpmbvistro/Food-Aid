/******************************
=============Setup=============
*******************************/

var express = require('express')
var app     = express()

require('dotenv').config()

const MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
// var passport = require('passport');
// var flash    = require('connect-flash');
var uniqid  = require('uniqid')
var morgan       = require('morgan');
// var cookieParser = require('cookie-parser');
// var bodyParser   = require('body-parser');
// var session      = require('express-session');

// var configDB = require('./config/database.js');

const DB_NAME = process.env.DB_NAME
const DB_URL =process.env.DB_URL+`/${DB_NAME}`
const PORT = process.env.PORT || 3000
console.log(`*********URL : ${DB_URL}`)
var db


/******************************
=========Mongo Config=========
*******************************/
mongoose.connect(DB_URL, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, db, uniqid);
});

/******************************
=========Express Setup=========
*******************************/

app.use(express.static('public'))
app.use(morgan('dev'))

app.set('view engine', 'ejs')





// launch ======================================================================
app.listen(PORT);
console.log('The magic happens on port ' + PORT);
