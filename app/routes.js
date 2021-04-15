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

    /*************************************************
    ===============Dashboard routes===================
    **************************************************/


    /********************************
    =====Load Dashboard Content=====
    ********************************/
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

          /*=====Add foodPreferences (if Any)=====*/
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


          //Find relevant foodAid
          db.collection('foodAid').find(searchFilter).toArray((err2, result2) => {
            if(err2) return console.log(err2)
            console.log(result2)
            let foodAid = result2.map(item2=>{
              //insert distance calculation here
              item2.canWalk = true
              item2.canDeliver = true
              delete item2.location
              delete item2.authorID
              delete item2.requestorID
              return item2
            })

            //Find active all pending transactions and user listings
            let activeSearchFilter = { $or :[] }

            //listings that were authored by this user
            let userListingsFilter = {userID: ObjectId(req.user._id)}
            activeSearchFilter.$or.push(userListingsFilter)

            //listings that are requested by user and are pending
            let userRequestsFilter = { $and : [] }

            let requestorID = {requestorID : ObjectId(req.user._id)}
            let status = {status: 'pending'}
            userRequestsFilter.$and.push(requestorID,status)
            activeSearchFilter.$or.push(userRequestsFilter)


            //Identify user actions
            db.collection('foodAid').find(activeSearchFilter).toArray((err3, result3) => {
              if(err3) return console.log(err3)
              //remove Requestor id for this user's posts
              //remove authorID for this user's requested aid
              let userActions = result3.map((item3, index) => {
                if(item3.userID !== req.user._id){
                  delete item3.userID
                }
                if(item3.requestorID !== req.user._id) {
                  delete item3.requestorID
                }
                delete item3.canDeliver
                delete item3.canWalk
                delete item3.location
                return item3
              })
              res.render('dashboard.ejs', {
                foodAid: foodAid,
                title: 'Dashboard',
                actions: userActions
              })
            })
          })
        } else {
          //If userSettings do not exist, redirect to setup settings
          res.redirect('/onboard')
        }
      })
    })



    /*================================
    =======Save New User Settings=====
    ==================================*/
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

    /*================================
    ==========Add New Food Aid========
    ==================================*/
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
          reqType: null,
          complete: {
            posterComplete: false,
            requestorComplete:false
          }
        }, (err2, result2) => {
          if (err2) return console.log(err2)
          res.send(result2)
        })
      })
    })

    /*=======================================
    ==========Request Posted Food Aid========
    ========================================*/
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


    /*=======================================
    ==========Complete Posted Food Aid========
    ========================================*/
    app.put('/complete', function(req, res) {
      db.collection('foodAid').findOne({
        _id: ObjectId(req.body.aidID)
      }, (err, result) => {
        if(err) return res.send(err)
        let userCompleteType == ''
        if(result.authorID === req.user._id) userCompleteType = 'posterComplete'
        if(result.requestorID === req.user._id) userCompleteType = 'requestorComplete'
        //If requesting user is relevant to the post
        if(userCompleteType){
          db.collection('foodAid').findOneAndUpdate({
            _id: ObjectId(req.body.aidID)
          }, {
            $set:
              {
                status: 'pending',
                requestor: result.displayName,
                requestorID: req.user._id,
                reqType: req.body.reqType,

              }
          }, {
            sort: {_id: -1},
            upsert:true
          }, (err2, result2) => {
            if(err2) return res.send(err2)
            res.send(result2)
          })
        }

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
