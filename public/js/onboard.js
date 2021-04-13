/*================================
Onboarding

===============================*/

Array.from(document.querySelectorAll('.next-slide-button')).forEach( (item, i) => {
  item.addEventListener('click', element => {
    element.currentTarget.parentElement.classList.add('animate')
  })
})

/*====Submit====*/
document.querySelector('#onboardSubmit').addEventListener('click', element => {
  let form = document.querySelector('.newUserForm')
  console.log("==============+TEST===============")
  fetch('newUser', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      'displayName': form.querySelector("#inputName").value,
      'wantsVegetables': form.querySelector('#inputVegetable').value,
      'wantsFruits': form.querySelector("#inputFruit").value,
      'wantsGrains': form.querySelector("#inputGrains").value,
      'wantsGarden': form.querySelector("#inputGarden").value,
      'wantsPrepacked': form.querySelector("#inputPrepacked").value,
      'address': form.querySelector('#inputAddress').value,
      'userDistance': form.querySelector("#travel-setting-onboard").value
    })
  })
  .then(response => {
    console.log(response)

    if (response.ok) {
      console.log("++++++++++++++");
      let fun =response.text()
      console.log(fun);
      return fun
    }
  })
  .then(data => {
    console.log('=========')
    console.log(data)
    window.location.replace("/dashboard")
  })

})
