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
runContractListner("0xB41CA68b89b9A026b9112E791e4813706E9e0a7b","wss://arb-sepolia.g.alchemy.com/v2/_7Y-EsZMyNu-qHC7gPNauKRm-Egb1g6x")

//New Ones
module.exports = app;
