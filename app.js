var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var hbs = require('express-handlebars');

var index = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/auth');
var bills = require('./routes/bills');
var mail = require('./routes/mail');
var tasks = require('./routes/tasks');

var cors = require('cors');
var multer = require('multer');

var nconf = require('nconf');

nconf.env();
nconf.file({ file: 'config.json' });


// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

var whitelist = ['http://localhost:4200', 'http://localhost:8100', 'http://indoor.leandesign.pro', 'http://course.leandesign.pro', 'http://leandesign.pro', 'http://localhost:8101/'];
var corsOptions = {
    origin: whitelist,
    methods: ["POST", "PUT", "OPTIONS", "DELETE", "GET"],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Access-Control-Allow-Origin', 'Cache-Control'],
    credentials: true
};

app.use(busboy());

app.use(express.static('../client'));
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/users', users);
app.use('/auth', auth);
app.use('/bills', bills);
app.use('/mail', mail);
app.use('/tasks', tasks);

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


module.exports = app;
