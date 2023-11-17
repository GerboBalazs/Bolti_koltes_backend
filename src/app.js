const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sql = require('./sql');

sql.initialConnection();

const Routes = require('./api/routes/routes');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    //Allow access for everyone
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

//Routes which should handles requests
app.use('/', Routes);

//Handles errors if endpoint is not exsisting
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

//Catch any error and handles it
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
            status: error.status,
        },
    });
    next();
});
module.exports = app;
