require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const nocache=require('nocache');
const mongoose=require('mongoose')
mongoose.connect(process.env.MongoConnection).then(()=>
  console.log("mongoDB connected"))
  .catch((error)=>
    console.log(error.message,"error"));
const http=require('http')


const admin = require('./routes/admin');
const users = require('./routes/users');

const app = express();
app.use(nocache());
// view engine setup
 app.set('view engine', 'ejs');
 app.use(express.static('public'))

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('/admin',admin );
app.use('/', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

// Catch 404 and forward to error handler
app.use((req, res, next) => next(require('http-errors')(404)));

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Get port and create server
const port = 3000;
app.set('port', port);
const server = http.createServer(app);
server.listen(port, () => console.log(`Server is listening on port ${port}`));

module.exports = app;
