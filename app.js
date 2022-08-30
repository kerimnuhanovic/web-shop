var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var kriptuj = require('./helper/kriptuj');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var registracijaRouter = require('./routes/registracija');
var loginRouter = require('./routes/login');
var trgovacRouter = require('./routes/trgovac');
var kupacRouter = require('./routes/kupac');
var administratorRouter = require('./routes/administrator');
var chatRouter = require('./routes/chat');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/registracija', registracijaRouter);
app.use('/login', loginRouter);


app.use(function(req,res,next) {
  console.log(req.url);
  if(req.url.includes('/trgovac')) {
    if(req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenTrgovcu(req.cookies.login.username).hash) {
        return next();
      }

    else res.sendStatus(400);
  }
  else if(req.url.includes('/kupac')) {
    if(req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenKupcu(req.cookies.login.username).hash) {
      return next();
    }
    else res.sendStatus(400);
  }
  else if(req.url.includes('/administrator')) {
    if(req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenAdministratoru(req.cookies.login.username).hash) {
      return next();
    }
    else res.sendStatus(400);
  }
  else if(req.url.includes('/chat')) {
    if((req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenAdministratoru(req.cookies.login.username).hash)
    || (req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenKupcu(req.cookies.login.username).hash)
    ||(req.cookies.login && req.cookies.login.hash === kriptuj.kriptuj.postaviTokenTrgovcu(req.cookies.login.username).hash)) {
      return next();
    }
  }
  else res.sendStatus(400);

});

app.use('/trgovac', trgovacRouter);
app.use('/kupac', kupacRouter);
app.use('/administrator', administratorRouter);
app.use('/chat', chatRouter);

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
