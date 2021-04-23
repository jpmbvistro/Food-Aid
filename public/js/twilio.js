let twilioClient = null
const chat = document.querySelector('#chat')

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

async function updateTasks(){
  try {
    let response = await fetch('updateTasks', {
      method: 'get',
      headers: {'Content-Type': 'application/json'},
    })
    if(response.ok){
      let data = await response.json()
      data.body.tasks.forEach((item,i)=>{
        let card = document.querySelector(`.action-card[data-aid-id='${item._id}']`)
        if(card) {
          let chatAction = card.querySelector('.chat-action')
          item.twilioConversationsSID!==null ? chatAction.classList.remove('hide') : chatAction.classList.add('hide')
          chatAction.setAttribute('href',`/chat/${data.body.twilioConversationsSID}`)
        }
      })
    }
  } catch (e) {
    console.log('Error Fetching Task Update')
    console.log(e)
  }
}

async function notify(){
  console.log('Notifications!');
  let bellCounter = document.querySelector('.notification-bell-counter')
  bellCounter.innerText = Number(bellCounter.innerText) + 1
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
    twilioClient.on('pushNotification', notify)
    twilioClient.on('conversationAdded', updateTasks)
    twilioClient.on('conversationJoined', updateTasks)
    twilioClient.on('conversationRemoved', updateTasks)
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
    if(chat){
      let conversation = await twilioClient.getConversationBySid(document.querySelector("input[name='conversationsSid']").value)
      conversation.on('messageAdded',renderMessage)
      let messagesPaginator = await conversation.getMessages(10)
      let chatDisplay = document.querySelector('#chat-display')
      let chatInput = document.querySelector('#chat-input')

      // for await (const item of messagesPaginator.items){renderMessage(item)}
      console.log('mp');
      console.log(messagesPaginator)
      for(let i = 0 ; i < messagesPaginator.items.length ; i++) {
        console.log("Printing...");
        // console.log(messagesPaginator.items[i])
        let bubble = await renderMessage(messagesPaginator.items[i])
      }

      //future iteration disable function call until previous completion
      chatInput.addEventListener('keydown',async item=>{
        if(item.keyCode===13) await submitChat()
      })

      document.querySelector('#submit-chat-button').addEventListener('click', submitChat)



      /****
      Helper Chat Functions
      ****/
      async function renderMessage(message){
        //assume for now that all participants are chat participants
        let chatBubble = document.createElement('div')
        let participantAuthor = await message.getParticipant()
        let userAuthor = await participantAuthor.getUser()
        let bubbleOwner = userAuthor.identity === twilioClient.user.identity ? 'self' : 'other'
        chatBubble.classList.add(`${bubbleOwner}`,'chat-bubble')
        let chatBody = document.createElement('p')
        chatBody.classList.add('chat-body')
        chatBody.innerText = message.body
        let chatDetail = document.createElement('p')
        chatDetail.classList.add('chat-detail')
        console.log(message.dateCreated)
        chatDetail.innerText = `By ${Participants[message.author]} on ${message.dateCreated.toLocaleString('en-us', {  weekday: 'long' })} at ${message.dateCreated.getHours()}:${message.dateCreated.getMinutes()}`
        chatBubble.appendChild(chatBody)
        chatBubble.appendChild(chatDetail)
        chatDisplay.appendChild(chatBubble)
        chatBubble.scrollIntoView()
      }
      async function submitChat() {
        let message = chatInput.value
        if(message) {
          await conversation.sendMessage(message)
        }
        chatInput.value = ''
      }
    }
    //Setup messages notifications
    Array.from(document.querySelectorAll('.action-card')).forEach(async item=>{
      let conversationSid = item.getAttribute('data-conversation-sid')
      if(conversationSid.length>0){
        let conversation = await twilioClient.getConversationBySid(conversationSid)
        conversation.on('messageAdded', notify)
        console.log('checking for convo notificaitons')
        console.log(conversation)
        let notifications = await conversation.getUnreadMessagesCount()
        console.log(notifications)
        console.log('........')
        if(notifications>0){
          let notificationBadge = item.querySelector('notifications')
          notificationBadge.classList.remove('hide')
          notificationBadge.innerText = notifications
        }
      }
    })
  }
  catch (error) {
    console.log('Error initializing')
    console.log(error)
  }
}

init()
