let twilioClient = null

async function getToken(){
  try {
    let responseStream = await fetch('../token', {
      method: 'get',
      headers: {'Content-Type': 'application/json'},

    })
    if(responseStream.ok){
      let tokenItem = await responseStream.json()

      // console.log(tokenItem.token)
      // console.log(tokenItem.identity)
      return tokenItem.token
    }
  } catch(err) {
    throw Error(err)
  }
}


async function refreshToken(){
  try {
    let token = await getToken()
    twilioClient.updateToken(token)
  } catch(err) {
    console.log('Failed to RefreshToken')
    console.log(err)
  }
}

async function initTwilio(){
  try {
    if(twilioClient===null){
      let token = await getToken()
      twilioClient = await Twilio.Conversations.Client.create(token)
    }
    console.log(twilioClient)
    twilioClient.on('tokenAboutToExpire', refreshToken)
    twilioClient.on('tokenAboutToExpire', refreshToken)
  } catch(err) {
    console.log("Failed initialize Twilio Client")
    console.log(err)
  }
}



async function init(){
  try {
    await initTwilio()
    console.log('user');
    console.log(twilioClient.user)

      let convo = await twilioClient.getConversationBySid("CH3d1758516a1e4bd681170620275030b9")
      let huh = await convo.getMessagesCount()
      let brrr = await convo.getUnreadMessagesCount()

      console.log("Check the convos bruh");
      console.log(convo);
      console.log(huh);
      console.log(brrr);
      console.log(convo.status)
      let unreadMessages = await convo.getUnreadMessagesCount()
      console.log(unreadMessages);
      console.log(`Convo unread: ${unreadMessages}`);
      console.log('done bruh');

    let domTwilioId = document.querySelector(".main").getAttribute('data-twilio-id')
    if( domTwilioId === 'dashboard' ){
      await initDashboard()
    } else if (domTwilioId === 'chat') {
      await initChat()
    }
  }
  catch (error) {
    console.log('Error initializing')
    console.log(error)
  }
}



init()
