const twil = require('../public/js/twilio.js')
require('../public/js/dashboard.js')


test('Initialization Testing', function(){
  document.body.innerHTML = ''
  expect(twil.testIt()).toBe('success')
})
