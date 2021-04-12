/*================================
Request functionality


===============================*/
Array.from(document.querySelectorAll('.req-aid')).forEach(item=>{
  item.addEventListener('click', element=>{
    let card = element.currentTarget.parentElement.parentElement.parentElement
    fetch('aid', {
      method: 'put',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        aidID: card.querySelector("input[name='aid-id']").value,
        reqType: element.currentTarget.name
      }),
    })
    .then(response => {
      if (response.ok) {
        return response.json()

      }
    })
    .then(data => {
      submitAidAnimation('success')
      console.log(data)
      window.location.reload(true)

    })
  })
})

function submitAidAnimation(res){
  let flashMessageBackground = document.createElement('div')
  flashMessageBackground.classList.add('flash-message-container')
  flashMessageBackground.id = 'flash-message-container'

  let flashMessageCard = document.createElement('div')
  flashMessageCard.classList.add('flash-message-card','flex-container','flex-column','flex-xy-center')


  let flashMessageImage = document.createElement('img')
  let flashMessageHeader = document.createElement('h1')
  let flashMessageBody = document.createElement('p')

  let flashButton = document.createElement('button')
  flashButton.classList.add('primary-button')
  flashButton.addEventListener('click',removeFlashMessage)
  flashButton.innerText = 'Close'

  if(res==='success'){
    flashMessageHeader.innerText = 'Nice!'
    flashMessageBody.innerText = 'Thanks for contributing to the Project'
    flashMessageImage.src = 'img/icons/success-icon.png'
    flashMessageImage.setAttribute('alt', 'Success Image')
  } else {
    flashMessageHeader.innerText = 'Oops!'
    flashMessageBody.innerText = "Seems like we weren't able to do that. We'll be working on that!"
    flashMessageImage.src = 'img/icons/oops-icon.png'
    flashMessageImage.setAttribute('alt', 'Failure Image')
  }

  flashMessageCard.appendChild(flashMessageImage)
  flashMessageCard.appendChild(flashMessageHeader)
  flashMessageCard.appendChild(flashMessageBody)
  flashMessageCard.appendChild(flashButton)
  flashMessageBackground.appendChild(flashMessageCard)
  document.querySelector('body').appendChild(flashMessageBackground)
  setTimeout(()=>flashMessageBackground.classList.add('animate'),500)
}

function removeFlashMessage() {
  let target = document.querySelector('#flash-message-container')
  target.classList.add('remove-animation')
  setTimeout(()=>target.remove(),500)
}

/**
Aside panel functionality
**/
document.querySelector('.info-button').addEventListener('click', toggleAside)
document.querySelector('#hide-aside').addEventListener('click', toggleAside)

function toggleAside(){       document.querySelector('aside').classList.toggle('reveal')
}
/**
Aside Panel end
*/
