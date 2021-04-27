async function initChat(){
  let conversation = await twilioClient.getConversationBySid(document.querySelector("input[name='conversationsSid']").value)
  conversation.on('messageAdded',renderNewMessage)
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
  //set last rendered message as updated
  if(messagesPaginator.items.length>0){
    let rest = await conversation.advanceLastReadMessageIndex(messagesPaginator.items[messagesPaginator.items.length-1].index)
    console.log('leftover');
    console.log(rest);
  }


  console.log(conversation.lastReadMessageIndex)

  //future iteration disable function call until previous completion
  chatInput.addEventListener('keydown',async item=>{
    if(item.keyCode===13) await submitChat()
  })

  document.querySelector('#submit-chat-button').addEventListener('click', submitChat)

  /****
  Mark new messages as 'read' when in chat window
  Render to window
  *****/
  async function renderNewMessage(message){
    await conversation.advanceLastReadMessageIndex(message.index)
    await renderMessage(message)
  }

  /**
  Renders new message and adds to chat window
  **/
  async function renderMessage(message){
    try {
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
    } catch (e) {
      return e
    }

  }

  async function submitChat() {
    let message = chatInput.value
    if(message) {
      await conversation.sendMessage(message)
    }
    chatInput.value = ''
  }

}

/*================================
===========Nav Back to Dash=======
=================================*/
document.querySelector('#back-button').addEventListener('click', element=> {
  console.log("GO BACK");
  history.back()
})
