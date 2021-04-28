/*================================
Onboarding

===============================*/

Array.from(document.querySelectorAll('.next-slide-button')).forEach( (item, i) => {
  item.addEventListener('click', element => {
    let slide = element.currentTarget.parentElement
    slide.classList.add('animate')
  })
})

Array.from(document.querySelectorAll('.back-link')).forEach( (item,i) => {
  item.addEventListener('click', element => {
    document.querySelector(`.slide-${element.currentTarget.getAttribute('data-prev-slide')}`).classList.remove('animate')
  })
})

document.querySelector('.close-flash').addEventListener('click',(element)=>{
  let flashContainer = element.currentTarget.parentElement.parentElement.classList.add('hide')
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
      'address': form.querySelector('.leaflet-control-ocd-search-form input').value,
      'userDistance': form.querySelector("#travel-radius").value,
      'latlng' : {lat:map.getLatLng().lat, lng:map.getLatLng().lng}
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


var map = L.map('map').setView([42.3627354,-71.0865258], 13);

var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	// attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});

Esri_WorldStreetMap.addTo(map);
var options = {
  key: 'd761cf2be84045fb97e83927eb2b26a5',
  limit: 10,
  proximity: '51.52255, -0.10249' // favour results near here
};
var control = L.Control.openCageSearch(options).addTo(map);
control.markGeocode = function(result) {
   if (result.bounds) {
     this._map.fitBounds(result.bounds);
   } else {
     this._map.panTo(result.center);
   }

   marker.setLatLng(result.center)
   circle.setLatLng(result.center)
  return this;
}

let marker = new L.Marker(map.getCenter()).addTo(map)
const MileToMeter = 1609.34
let slider = document.querySelector("input[name='radius']")
console.log(slider)
console.log(slider.value)
let mcenter = map.getCenter()
console.log(mcenter)
let radius = Number(slider.value) * MileToMeter
console.log(typeof map.getCenter().lat)
console.log(radius)
let circle = L.circle([map.getCenter().lat, map.getCenter().lng], {radius: radius}).addTo(map);
// let circle = L.Circle(map.getCenter(), {radius: 200})
circle.addTo(map)




  function slide(e){
    circle.setRadius(e.target.value*MileToMeter)
  }
  slider.oninput = slide

  map.on('dblclick',function(e){
   let pos = e.latlng
   marker.setLatLng(pos)
   circle.setLatLng(pos)
   map.setView(pos)
  })

  map.on('drag', function(e){
   let cnt = map.getCenter()
   marker.setLatLng(cnt)
   circle.setLatLng(cnt)
  })
// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//     // attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);
// L.circle([50.5, 30.5], {radius: 200}).addTo(map);
