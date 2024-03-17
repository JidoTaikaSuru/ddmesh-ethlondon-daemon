var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require("cors");
require("dotenv").config();
var indexRouter = require('./routes/index');
const { runContractListner } = require('./listners/contractTxListner');
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', indexRouter);
runContractListner("0x9D4E1636bf4949D466D26359e5ee9558776755F0","wss://arb-sepolia.g.alchemy.com/v2/_7Y-EsZMyNu-qHC7gPNauKRm-Egb1g6x")

//New Ones
module.exports = app;
