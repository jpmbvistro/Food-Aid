document.querySelector('#addAidButton').addEventListener('click', element => {
  document.querySelector('footer').classList.toggle('expand')
})


document.querySelector('#submit-new-aid').addEventListener('click', element => {
  let form = element.currentTarget.parentElement
  // console.log('STUFF')
  // console.log(form.querySelector("input[name='title']").value)
  fetch('aid', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      title: form.querySelector("input[name='title']").value,
      foodType: form.querySelector("input[name='foodType']:checked").value,
      source: form.querySelector("input[name='source']:checked").value,
      expiration: form.querySelector("input[name='expiration']").value,
      description: form.querySelector('#description-input').value
    }),
  })
  .then(response => {
    if (response.ok) {
      document.querySelector('footer').classList.remove('expand')
      return response.json()

    }
  })
  .then(data => {
    submitAidAnimation('success')
    console.log(data)
    setTimeout(_=>{window.location.reload(true)},3000)

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
