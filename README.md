# Food Aid

Assisting in the organization of food mutual aid projects.
#### Challenges

Securing sensitive data:
Do not want submitter data to be sent to client. Should I use delete or destructuring //destructuring introduced by Jerry Lafume

Storing non sensitive user-data:
Should user settings be saved with passport?

learned first promise handling is converting the response stream into a json file

learning how to make unobtrusive flash messages -> for aid submission success/error handling
-> can I use connect flash module?
most usage is refreshing the page and showing the message in a ejs element
is there a way not to require page reload?
Gus (mentor)
confirmed my hesitation on using the module to show a success/fail message. Instead utilizing the response provided by


adding users is so much more trouble

new error occuring when posting a new userSettings
I get a 200 response from the server but catch an error
Uncaught (in promise) Error: SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data
