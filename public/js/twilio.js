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
  }
  catch (error) {
    console.log('Error initializing')
    console.log(error)
  }
}

console.log(Participants)

init()
