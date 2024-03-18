var express = require('express');
var router = express.Router();

const pg = require("pg-node-ens")

/* GET home page. */
const pg = require("pg-ens")
router.get('/healthcheck', function(req, res, next) {
 res.json({status: "ok, Working!"});
});


router.post("/proxy-postgres", async (req, res, next) => {
 console.log("posting to proxy-postgres", req.body)
 const connectionString = req.body.connectionString;
 const query = req.body.query;
 const client = new pg.Client({
   connectionString: connectionString
 });
 try{

router.post("/proxy-postgres", async (req, res, next) => {
  console.log("posting to proxy-postgres", req.body)
  const connectionString = req.body.connectionString;
  const query = req.body.query;
  const client = new pg.Client({
    connectionString: connectionString
  });
  try{
 
 
     client.connect();
     const result = await client.query(query);
     client.end();
     return res.json(result);
  }catch(e){
       console.log(e);
     return res.json({error: e.message});
  }
 
 })

    client.connect();
    const result = await client.query(query);
    client.end();
    return res.json(result);
 }catch(e){
      console.log(e);
    return res.json({error: e.message});
 }

})



module.exports = router;
