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
let focusCardContainer = document.querySelector('#focus-card-container')
let focusCard = document.querySelector('#focus-card')
let focusId = focusCard.querySelector('#focus-id')
let focusTitle = focusCard.querySelector('#focus-title')
let focusAuthorName = focusCard.querySelector('#focus-author-name')
let focusType = focusCard.querySelector('#focus-type')
let focusSource = focusCard.querySelector('#focus-source')
let focusExpiration = focusCard.querySelector('#focus-expiration')
let focusDescription = focusCard.querySelector('#focus-description')
let focusStatus = focusCard.querySelector('#focus-status')
let focusAction = focusCard.querySelector('#focus-action')



/**
Focus available Aid
**/
Array.from(document.querySelectorAll('.can-focus')).forEach(item=> {
  item.addEventListener('click',element => {
    focusCardContainer.classList.remove('hide')
    let sourceCard = element.currentTarget
    focusId.value = sourceCard.querySelector("input[name='aid-id']").value
    focusTitle.innerText = sourceCard.querySelector("input[name='aid-title']").value
    focusAuthorName.innerText = sourceCard.querySelector("input[name='aid-authorName']").value
    focusType.innerText = sourceCard.querySelector("input[name='aid-foodType']").value
    focusSource.innerText = sourceCard.querySelector("input[name='aid-source']").value
    focusExpiration.innerText = sourceCard.querySelector("input[name='aid-expiration']").value
    focusDescription.innerText = sourceCard.querySelector("input[name='aid-description']").value
    focusStatus.innerText = sourceCard.querySelector("input[name='aid-status']").value

    focusAction.setAttribute('data-twilioConversationsSID', sourceCard.querySelector("input[name='aid-twilioConversationsSID']").value)

    //ReSet Button Action
    focusAction.removeEventListener('click', reqAid)
    focusAction.removeEventListener('click', chat)
    //Remove Complete Button if existant
    let completeButton = focusCard.querySelector('#focus-complete')
    if(completeButton) completeButton.remove

    let cardType = sourceCard.getAttribute('data-card-type')
    if(cardType==='available'){
      focusAction.innerText = 'Request'
      focusAction.addEventListener('click', reqAid)
    } else if (cardType==='current'){
      focusAction.innerText = 'Chat'
      focusAction.addEventListener('click', chat)

      let newButton = document.createElement('button')
      newButton.id = 'focus-complete'
      newButton.addEventListener('click',complete)
      newButton.innerText = 'Complete'
    }
  })
})

/**
Aid Request
**/
async function reqAid(element){
  try {
    console.log('Requesting Aid!')
    let response = await fetch('request', {
      method: 'put',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        aidID: focusId.value,
      }),
    })
    let data = null
    if (response.ok) {
      data = await response.json()
    } else throw 'Error Fetching Request'
    submitAidAnimation('success')
    console.log(data)
    window.location.reload(true)
  } catch (e) {
    console.log('Error Requesting Aid');
    console.log(e)
  }
}

async function chat(element){
  try {
    let response = await fetch(`/chat/${focusId.value}`, {
      method: 'get',
      // headers: {'Content-Type': 'application/json'},
    })
  } catch (e) {
    console.log('Error Grabbing Chat');
    console.log(e);
  }
}

document.querySelector('#close-focus-button').addEventListener('click',_=>{
  focusCardContainer.classList.add('hide')
})
