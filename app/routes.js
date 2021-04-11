module.exports = function(app, db, passport, uniqid, ObjectId) {


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
        let clientResult = result.map(item=>{
          //insert distance calculation here
          item.canWalk = true
          item.canDeliver = true
          delete item.location
          delete item.authorID
          delete item.requestor
          return item
        })
        res.render('dashboard.ejs', {
          foodAid: clientResult,
          title: 'Dashboard'
        })
      })
    })

    app.post('/aid', function(req, res) {
      db.collection('foodAid').insertOne({
        title: req.body.title,
        // authorID: req.body.authorID,
        authorID: 0001,
        // authorName: req.body.authorName,
        authorName: 'Justin',
        foodType: req.body.foodType,
        source: req.body.source,
        expiration: req.body.expiration,
        // location: req.body.userLoc,
        location: 'Near',
        status: 'available',
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
