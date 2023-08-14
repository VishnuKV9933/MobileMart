var createError = require('http-errors');
var express = require('express');
var path = require('path');
const bodyparser=require('body-parser');
const session=require('express-session');
const {v4:uuidv4}=require('uuid');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require('express-handlebars')
var db=require('./configuration/connection')
const nocache = require("nocache");
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const hbsHelpers=require('./hbsHelpers')
require('dotenv').config();
// var loginRouter=require('./routes/login')

var app = express();
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))

app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'hbs');
const expressHelpers=hbs.create({ 
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials',
      helpers:{
        ifEquals:hbsHelpers.ifEquals,
        indexing:hbsHelpers.indexing,
        statusColor:hbsHelpers.statusColor,
        wishlistHeartIcon:hbsHelpers.wishlistHeartIcon,
        calculation:hbsHelpers.calculation,
        list:hbsHelpers.list,
        equals:hbsHelpers.equals,
        brandFilterboxChecked:hbsHelpers.brandFilterboxChecked,
        orderInvoiceStatus:hbsHelpers.orderInvoiceStatus,
        hidePending:hbsHelpers.orderInvoiceStatus
      } 
})
app.engine('hbs', expressHelpers.engine)

// app.engine('hbs', hbs.engine({
//    extname: 'hbs',
//    defaultLayout: 'layout',
//    layoutsDir:__dirname + '/views/layout/', 
//    partialsDir:__dirname + '/views/partials/'
//   }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session(
  {secret:'key',
  cookie:{maxAge:2000000},
  resave:false,
  saveUninitialized:false}
))


app.use(nocache());

db.connect((err)=>{
  if(err)console.log('Connection Error'+err)
  else console.log('Database connnected');
})

app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
   