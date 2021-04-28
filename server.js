/******************************
=============Setup=============
*******************************/

var express = require('express')
var app     = express()

require('dotenv').config()
var nameGenerator = require('./app/name_generator')
const MongoClient = require('mongodb').MongoClient
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var uniqid  = require('uniqid')
var ObjectId = require('mongodb').ObjectID
var morgan       = require('morgan');
// var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var twilio = require('twilio')
var tokenGeneratorModule = require('./app/token-generator.js')

// var configDB = require('./config/database.js');
const opencage = require('opencage-api-client')

var turfCircle = require('@turf/circle').default
// console.log(turfCircle);
// console.log(JSON.stringify(turfCircle))
// console.log(turfCircle.default.circle)
// console.log(typeof turfCircle.default)
// console.log(turf([2.44,-2.11],4))
/****************
GLOBAL VARIABLES
*****************/
const DB_NAME = process.env.DB_NAME
const DB_URL =process.env.DB_URL+`/${DB_NAME}`
const PORT = process.env.PORT || 3000
const twilioVars = {
  TWILIO_AUTH_TOKEN : process.env.TWILIO_AUTH_TOKEN,
  TWILIO_ACCOUNT_SID : process.env.TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY : process.env.TWILIO_API_KEY,
  TWILIO_API_SECRET : process.env.TWILIO_API_SECRET,
  TWILIO_CHAT_SERVICE_SID : process.env.TWILIO_CHAT_SERVICE_SID,
  TWILIO_CONVERSATIONS_SERVICE_SID : process.env.TWILIO_CONVERSATIONS_SERVICE_SID}
// console.log(`*********URL : ${DB_URL}`)



/******************************
==========Twilio Setup=========
*******************************/
var tokenGenerator = new tokenGeneratorModule(twilio, twilioVars, nameGenerator)
var client = new twilio(twilioVars.TWILIO_ACCOUNT_SID, twilioVars.TWILIO_AUTH_TOKEN)

/******************************
=========Mongo Config=========
*******************************/
var db
mongoose.connect(DB_URL, (err, database) => {
  if (err) return console.log(err)
  db = database
  require('./app/routes.js')(app, db, passport, uniqid, ObjectId, client, tokenGenerator, twilioVars, opencage, turfCircle);
});

require('./config/passport')(passport); // pass passport for configuration

/******************************
=========Express Setup=========
*******************************/

app.use(express.static('public'))
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

/******************************
=========Passport Setup=========
*******************************/
// required for passport
app.use(session({
    secret: 'whatsThisFor', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session




// launch ======================================================================
app.listen(PORT);
console.log('The magic happens on port ' + PORT);
