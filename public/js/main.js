/*================================
Request functionality
===============================*/
Array.from(document.querySelectorAll('.req-aid')).forEach(item=>{
  item.addEventListener('click', element=>{
    let card = element.currentTarget.parentElement.parentElement.parentElement
    fetch('request', {
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


/*================================
Request functionality
===============================*/
Array.from(document.querySelectorAll('complete-exchange-button')).forEach((item,i) => {
  item.addEventListener('click', element=>{
    let card = element.currentTarget.parentElement.parentElement
    fetch('complete', {
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









/**
Aside panel functionality
**/
// document.querySelector('.info-button').addEventListener('click', toggleAside)
// document.querySelector('#hide-aside').addEventListener('click', toggleAside)

function toggleAside(){       document.querySelector('aside').classList.toggle('reveal')
}
/**
Aside Panel end
*/
