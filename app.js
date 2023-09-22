const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
var mssql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || '',
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '', 10),
    options: {
        trustServerCertificate: true,
    },
};

const connect = async () => {
    try {
        await mssql.connect(config);
        console.log('Connection with Database established');
    } catch (err) {
        console.log(err);
    }
};

connect();

const productRoutes = require('./api/routes/products');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    //Allow access for everyone
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE');
        return res.status(200).json({});
    }
    next();
});

//Routes which should handles requests
app.use('/products', productRoutes);

//Handles errors
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
        },
    });
});
module.exports = app;
