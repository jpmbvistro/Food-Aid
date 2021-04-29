module.exports = function(
  app, db, passport, uniqid, ObjectId, client, tokenGenerator, twilioVars, opencage, turfCircle) {


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

    app.get('/onboard', isLoggedIn, function(req, res) {
      res.render('onboard.ejs', {
        title: 'Onboarding'
      })
    })

    app.get('/chat/:aidID', isLoggedIn, async (req, res) => {
      try {
        console.log('loading Chat')
        let aidId = req.params.aidID
        console.log(aidId)
        let response = await db.collection('foodAid').findOne({
          _id: ObjectId(aidId+'')
        })

        console.log('Checking if AidID exists')
        console.log(req.user._id)
        console.log(response.authorID)
        console.log(req.user._id)
        console.log(response.requestorID)
        // console.log(aidId !==null && response.twilioConversationsSID !== null)
        let authorName = req.user._id+"" === response.authorID+"" ? 'You' : response.authorName
        let requestorName = req.user._id+"" === response.requestorID+"" ? 'You' : response.requestorName
        let authorId = response.authorID
        let requestorId = response.requestorID
        let participants = {
          [authorId]: authorName,
          [requestorId]: requestorName
        }
        //FUTURE: can validate that req.user is part of the conversation
        if(req.params.aidID && response.twilioConversationsSID){
          res.render('chat.ejs', {
            conversationsSid: response.twilioConversationsSID,
            title: 'Chat',
            participants: participants
          })
        }
        else {
          throw 'No Conversation'
        }

      } catch (e) {
        console.log(e)
        if(e==='No Conversation') res.status(400).send({
          message: e
        })
      } finally {

      }
    })

    /*************************************************
    ===============Dashboard routes===================
    **************************************************/


    /********************************
    =====Load Dashboard Content=====
    ********************************/
    app.get('/dashboard', isLoggedIn, function(req, res) {
      db.collection('userSettings').findOne({
        userID: ObjectId(req.user._id)
      }, (err , result) =>{
        if(err) return console.log(err)
        // console.log('===============Did I find the user?===========')
        // console.log(result)

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

          //Include geoJSON Intersection
          searchFilter.$and.push({'geoJSON':{
            $geoIntersects : {
              $geometry: result.geoJSON
            }
          }})


          console.log(JSON.stringify(searchFilter))


          //Find relevant foodAid
          db.collection('foodAid').find(searchFilter).toArray((err2, result2) => {
            if(err2) return console.log(err2)
            // console.log(result2)
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
            let userListingsFilter = {authorID: ObjectId(req.user._id)}
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
    app.post('/newUser', async function(req, res) {
      try {
        let address = null
        let latlng = null
        if(req.body.address && req.body.latlng === null){
          latlng = await opencage.geocode({
            q: req.body.address,
            language:'en',
            countrycode: 'us',
            limit: 1,
            pretty: 1,
            no_annotations: 1,
          })
          if(latlng.results.length===0) throw "Coult Not Find LatLng from Address"
        } else if((req.body.address === null && req.body.latlng !== null) || (req.body.address === '' && req.body.latlng !== null) ){
          address = await opencage.geocode({
            q: `${req.body.latlng.lat}, ${req.body.latlng.lng}`,
            language:'en',
            countrycode: 'us',
            limit: 1,
            pretty: 1,
            no_annotations: 1,
          })
          if(address.results.length===0) throw "Could Not Find Address From LatLng"
        } else if (req.body.address === null && req.body.latlng === null){
          throw "No Address or LatLng Sent"
        } else {
          console.log('Nice, you sent both Address and LatLng')
        }
        let geoAddress = req.body.address ? req.body.address: address.results[0].formatted
        let geoCenter = req.body.latlng ? [req.body.latlng.lng,req.body.latlng.lat] : [latlng.results[0].geometry.lng , latlng.results[0].geometry.lat]
        let geoRadius = Number(req.body.userDistance)
        let geoOptions = {
          steps: 8,
          units:'miles',
          properties:{
            address: geoAddress,
            center: {lat: geoCenter[1], lng: geoCenter[0]}
          }
        }
        let geoCircle = turfCircle(geoCenter, geoRadius, geoOptions)
        geoCircle = geoCircle.geometry

        // geoCircle.coordinates = geoCircle.coordinates[0]

        console.log(geoCircle)
        user = await client.conversations.users.create({
         identity: `${req.user._id}`,
        })
        dbResult = await db.collection('userSettings').insertOne({
          userID: req.user._id,
          displayName: req.body.displayName,
          wantsVegetables: Boolean(req.body.wantsVegetables),
          wantsFruits: Boolean(req.body.wantsFruits),
          wantsGrains: Boolean(req.body.wantsGrains),
          wantsGarden: Boolean(req.body.wantsGarden),
          wantsPrepacked: Boolean(req.body.wantsPrepacked),
          address: geoAddress,
          geoJSON: geoCircle,
          userDistance: Number(req.body.userDistance),
          twilioIdentitySID: user.sid
        })
        res.status(201).send({
          message: "Onboarding Complete",
          userSettings: dbResult
        })
      } catch (e) {
        console.log(e)
        res.status(500).send({
          message: 'This is an error!'
        })
      } finally {  }
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
          geoJSON: result.geoJSON,
          status: 'available',
          requestorName: '',
          requestorID: null,
          reqType: null,
          complete: {
            posterComplete: false,
            requestorComplete:false
          },
          twilioConversationsSID: null
        }, (err2, result2) => {
          if (err2) return console.log(err2)
          res.send(result2)
        })
      })
    })

    /*=======================================
    ==========Request Posted Food Aid========
    ========================================*/
    app.put('/request', async function(req, res) {
      try{
        console.log("somoene's requesting aid!")
        let userSettings = await db.collection('userSettings').findOne({
          userID: ObjectId(req.user._id)
        })
        console.log('Creating Conversation...')
        let conversation = await client.conversations.conversations.create()
        console.log('Conversation Completed')
        console.log('Finding foodAid, setting to pending...')

        let ogFoodResult = await db.collection('foodAid').findOneAndUpdate({
          _id: ObjectId(req.body.aidID)
        }, {
          $set:
            {
              status: 'pending',
              requestorName: userSettings.displayName,
              requestorID: req.user._id,
              reqType: req.body.reqType,
              twilioConversationsSID: conversation.sid
            }
        }, {
          sort: {_id: -1},
          upsert:true
        })
        console.log('DB update success')
        console.log('adding users as participants')
        //Also add this user to the created conversation
        let userParticipantSid = await client.conversations.conversations(conversation.sid).participants.create({
          identity: `${req.user._id}`,
          friendlyName: userSettings.displayName
        })
        let authorSettings = await db.collection('userSettings').findOne({
          userID: ogFoodResult.value.authorID
        })
        await client.conversations.conversations(conversation.sid).participants.create({
          identity: `${ogFoodResult.value.authorID}`,
          friendlyName: authorSettings.displayName
        })
        res.status(201).send({
          message: 'Request Complete, Ready to Chat',
          originalFoodAid: ogFoodResult
        })
      } catch(err2) {
        console.log('Error!')
        console.log(err2)
        res.status(500).send({
          message: 'This is an error!'
        })
      }
    })



    /*=======================================
    ==========Complete Posted Food Aid========
    ========================================*/
    app.put('/complete', isLoggedIn, function(req, res) {
      console.log("Complete REquest!")
      db.collection('foodAid').findOne({
        _id: ObjectId(req.body.aidID)
      }, (err, result) => {
        console.log('Food Aid Found');
        console.log(result);
        console.log(req.user._id);
        if(err) return res.send(err)
        //If requesting user is relevant to the post and post has not been fully completed yet
        if((result.status !== 'complete') && (result.authorID+'' === req.user._id+"" || result.requestorID+'' === req.user._id+'')){
          console.log('This User Is Relevant');
          let newCompleteObj = {}
          if(result.authorID+'' === req.user._id+'') {
            console.log('user is author');
            console.log()
            newCompleteObj.posterComplete = result.complete.posterComplete === false
            newCompleteObj.requestorComplete = result.complete.requestorComplete
          }
          else if(result.requestorID+'' === req.user._id+'') {
            console.log('user is requestor');
            newCompleteObj.posterComplete = result.complete.posterComplete
            newCompleteObj.requestorComplete = result.complete.requestorComplete === false
          } else {
            console.log('huh that odd');
          }
          let newStatus = newCompleteObj.posterComplete && newCompleteObj.requestorComplete ? 'complete' : result.status
          console.log(newStatus);
          console.log(JSON.stringify(newCompleteObj));
          console.log('gettingFood');
          db.collection('foodAid').findOneAndUpdate({
            _id: ObjectId(req.body.aidID)
          }, {
            $set:
              {
                status: newStatus,
                complete: newCompleteObj
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

    /*=======================================
    ==========Update User Tasks==============
    ========================================*/
    app.get('/updateTasks', isLoggedIn, async function(req, res){
      try {
        console.log('updating user tasks')
        let newTasks = Array.from(await db.collection('foodAid').find({ $or : [
          { authorID : ObjectId(req.user._id)},
          { $and : [
            { requestorID : ObjectId(req.user._id) },
            { status : 'pending' },
          ]},
        ]}))
        console.log('done updating');
        res.status(201).send(JSON.stringify({
          tasks : newTasks
        }))
      } catch (e) {
        console.log(e)
        res.status(500).send({
          message: 'Error updating user tasks'
        })
      }
    })


    // =============================================================================
    // Twilio Routes================================================================
    // =============================================================================
    app.get('/token', isLoggedIn, async (req, res) => {
      console.log('getting a token')
      let {token, identity} = await tokenGenerator.tokenGenerate(req.user._id)
      res.set('Content-Type', 'application/json');
      res.send(JSON.stringify({
        token: token,
        identity: identity
      }));
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
