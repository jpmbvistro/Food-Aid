document.querySelector('#addAidButton').addEventListener('click', element => {
  document.querySelector('footer').classList.toggle('expand')
})


document.querySelector('#submit-new-aid').addEventListener('click', element => {
  let form = element.currentTarget.parentElement
  console.log('STUFF')
  console.log(form.querySelector("input[name='title']").value)
  fetch('aid', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      title: form.querySelector("input[name='title']").value,
      foodType: Array.from(form.querySelectorAll("input[name='foodType']")).filter(item=>item.checked)[0].value,
      source: form.querySelector("input[name='is-garden-grown']").checked ? 'garden' : 'prepacked'
    }),
    expiration: form.querySelector("input[name='expiration']").value
  })
  .then(response => {
    if (response.ok) return response.json()
  })
  .then(data => {
    console.log(data)


  })
})
