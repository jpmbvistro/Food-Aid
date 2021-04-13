module.exports = function(app, db, passport, uniqid, ObjectId) {


/********************
=====Base routes=====
*********************/

    // Load root index ===================================================
    app.get('/', function(req, res) {
      res.render('index.ejs', {
        title: 'Food Aid!'
      })
      // res.redirect('/dashboard')
    })

    app.get('/login', function(req, res) {
      res.render('login.ejs', {
        message: req.flash('loginMessage'),
        title: 'Login'
      })
    })

    app.get('/signup', function(req, res) {
      res.render('signup.ejs', {
        message: req.flash('loginMessage'),
        title: 'Signup'
      })
    })

      app.get('/onboard', function(req, res) {
        res.render('onboard.ejs', {
          title: 'Onboarding'
        })
      })

    /**************************
    =====Dashboard routes=====
    **************************/

    app.get('/dashboard', function(req, res) {
      db.collection('userSettings').findOne({
        userID: ObjectId(req.user._id)
      }, (err , result) =>{
        if(err) return console.log(err)
        console.log('===============Did I find the user?===========')
        console.log(result)
        if(result) {
          db.collection('foodAid').find().toArray((err2, result2) => {
            if(err2) return console.log(err2)
            let clientResult = result2.map(item2=>{
              //insert distance calculation here
              item2.canWalk = true
              item2.canDeliver = true
              delete item2.location
              delete item2.authorID
              delete item2.requestorID
              return item2
            })
            res.render('dashboard.ejs', {
              foodAid: clientResult,
              title: 'Dashboard'
            })
          })
        } else {
          res.redirect('/onboard')
        }
      })

    })

    app.post('/newUser', function(req, res) {
      db.collection('userSettings').insertOne({
        userID: req.user._id,
        displayName: req.body.displayName,
        wantsVegetables: Boolean(req.body.wantsVegetables),
        wantsFruits: Boolean(req.body.wantsFruits),
        wantsGrains: Boolean(req.body.wantsGrains),
        wantsGarden: Boolean(req.body.wantsGarden),
        wantsPrepacked: Boolean(req.body.wantsPrepacked),
        address: req.body.address,
        userDistance: Number(req.body.userDistance)
      }, (err, result) => {
        if (err) return console.log(err)
        res.redirect('/dashboard')
      })
    })

    app.post('/aid', function(req, res) {
      db.collection('foodAid').insertOne({
        title: req.body.title,
        // authorID: req.body.authorID,
        authorID: req.user._id,
        // authorName: req.body.authorName,
        authorName: 'Justin',
        foodType: req.body.foodType,
        source: req.body.source,
        expiration: req.body.expiration,
        // location: req.body.userLoc,
        location: 'Near',
        status: 'available',
        requestorName: '',
        requestorID: null
      }, (err, result) => {
        if (err) return console.log(err)
        res.send(result)
      })
    })

    app.put('/request', function(req, res) {
      db.collection('foodAid').findOneAndUpdate({
        _id:req.body._id
      }, {
        $set:
          {
            status: 'pending',
            requestor: req.user.local.name,
            requestorID: req.user._id
          }
      }, {
        sort: {_id: -1},
        upsert:true
      }, (err, result) => {
        if(err) return res.send(err)
        res.send(result)
      })
    })

    // =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================




    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/dashboard', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/onboard', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
}


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
