module.exports = function(app, db, uniqid) {


/********************
=====Base routes=====
*********************/

    // Load root index ===================================================
    app.get('/', function(req, res) {
      // res.render('index.ejs')
      res.redirect('/dashboard')
    })



    /**************************
    =====Dashboard routes=====
    **************************/

    app.get('/dashboard', function(req, res) {
      db.collection('foodAid').find().toArray((err, result) => {
        if(err) return console.log(err)
        res.render('dashboard.ejs', {
          foodaid: result,
          title: 'Dashboard'
        })
      })
    })

    app.post('/aid', function(req, res) {
      db.collection('foodAid').insertOne({
        title: req.body.title,
        authorID: req.body.authorID,
        authorName: req.body.authorName,
        foodType: req.body.foodType,
        source: req.body.source,
        expiration: req.body.expiration,
        location: req.body.userLoc,
        status: available,
        requestor: null
      }, (err, result) => {
        if (err) return console.log(err)
        res.send(result)
      })
    })

    app.put('/request', function(req, res) {
      db.collection.findOneAndUpdate({
        _id:req.body._id
      }, {
        $set:
          {
            status: 'request',
            requestor: req.body.userID
          }
      }, {
        sort: {_id: -1},
        upsert:true
      }, (err, result) => {
        if(err) return res.send(err)
        res.send(result)
      })
    })
}
