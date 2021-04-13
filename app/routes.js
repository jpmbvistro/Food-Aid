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

        //If the userSettings Exists query foodAid utilizing userSettings
        if(result) {

          //Setup Search Filter
          let searchFilter = {$and:[]  }

          //exclude all posts by this user
          searchFilteruserID = { authorID: {$ne: ObjectId(req.user._id)} }
          searchFilter.$and.push(searchFilteruserID)

          //include only available aid
          searchFilter.$and.push({status: 'available'})

          //=====Add foodPreferences (if Any)=====
          //FoodType grain, fruit, vegetable
          let foodTypePreferences = []
          if(result.wantsFruits)foodTypePreferences.push({'foodType':'fruit'})
          if(result.wantsVegetables)foodTypePreferences.push({'foodType':'vegetable'})
          if(result.wantsGrains)foodTypePreferences.push({'foodType':'grain'})

          if(foodTypePreferences.length>0) searchFilter.$and.push({$or:foodTypePreferences})

          //garden or prepacked
          let foodSourcePreferences = []
          if(result.wantsGarden)foodSourcePreferences.push({'source':'garden'})
          if(result.wantsPrepacked)foodSourcePreferences.push({'source':'prepacked'})

          if(foodSourcePreferences.length>0) searchFilter.$and.push({$or: foodSourcePreferences})
          console.log(JSON.stringify(searchFilter))



          db.collection('foodAid').find(searchFilter).toArray((err2, result2) => {
            if(err2) return console.log(err2)
            console.log(result2)
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
          //If userSettings do not exist, redirect to setup settings
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
        if (err){console.log(err)
          // res.redirect('/dashboard')
          return res.status(500).send({
            message: 'This is an error!'
          })
        } else {
          return res.status(201).send({
            message: "Onboarding Complete"
          })
        }
      })
    })

    app.post('/aid', function(req, res) {
      db.collection('userSettings').findOne({
        userID: ObjectId(req.user._id)
      },(err, result) => {
        if(err) return console.log(err)
        db.collection('foodAid').insertOne({
          title: req.body.title,
          authorID: req.user._id,
          authorName: result.displayName,
          foodType: req.body.foodType,
          source: req.body.source,
          expiration: req.body.expiration,
          location: result.address,
          status: 'available',
          requestorName: '',
          requestorID: null,
          reqType: null
        }, (err2, result2) => {
          if (err2) return console.log(err2)
          res.send(result2)
        })
      })

    })

    app.put('/request', function(req, res) {
      db.collection('userSettings').findOne({
        userID: ObjectId(req.user._id)
      }, (err, result) => {
        if(err) return res.send(err)
        db.collection('foodAid').findOneAndUpdate({
          _id: ObjectId(req.body.aidID)
        }, {
          $set:
            {
              status: 'pending',
              requestor: result.displayName,
              requestorID: req.user._id,
              reqType: req.body.reqType
            }
        }, {
          sort: {_id: -1},
          upsert:true
        }, (err2, result2) => {
          if(err2) return res.send(err2)
          res.send(result2)
        })
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
