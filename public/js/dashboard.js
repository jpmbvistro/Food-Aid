async function initDashboard() {
  twilioClient.on('pushNotification', notify)
  twilioClient.on('conversationAdded', updateTasks)
  twilioClient.on('conversationJoined', updateTasks)
  twilioClient.on('conversationRemoved', updateTasks)

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
        let notificationBadge = item.querySelector('.notification-badge')
        notificationBadge.classList.remove('hide')
        notificationBadge.querySelector('.badge-main').innerText = notifications
        notificationBadge.querySelector('.badge-expand').innerText = ' unread messages'
      }
    }
  })
}

async function notify(){
  console.log('Notifications!');
  let bellCounter = document.querySelector('.notification-bell-counter')
  bellCounter.innerText = Number(bellCounter.innerText) + 1
}

async function updateTasks(){
  try {
    let response = await fetch('updateTasks', {
      method: 'get',
      headers: {'Content-Type': 'application/json'},
    })
    if(response.ok){
      let data = await response.json()
      data.tasks.forEach((item,i)=>{
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
