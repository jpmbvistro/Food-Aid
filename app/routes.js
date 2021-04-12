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

      app.get('/onboard', function(req, res) {
        res.render('onboard.ejs', {
          title: 'Onboarding'
        })
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
          delete item.requestorID
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
        successRedirect : '/userSetup', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
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
