var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/healthcheck', function(req, res, next) {
 res.json({status: "ok, Working!"});
});





module.exports = router;
