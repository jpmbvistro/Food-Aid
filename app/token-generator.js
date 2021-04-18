// const Twilio = require('twilio');
//
// const config = require('./config');
// const nameGenerator = require('../name_generator');
//
// Access Token used for Video, IP Messaging, and Sync
// const AccessToken = Twilio.jwt.AccessToken;
// const ChatGrant = AccessToken.ChatGrant;
// const VideoGrant = AccessToken.VideoGrant;
// const SyncGrant = AccessToken.SyncGrant;

class TokenGenerator {
  constructor(Twilio, twilioVars, nameGenerator){
    this.Twilio = Twilio
    this.TWILIO_ACCOUNT_SID = twilioVars.TWILIO_ACCOUNT_SID
    this.TWILIO_API_KEY = twilioVars.TWILIO_API_KEY
    this.TWILIO_API_SECRET = twilioVars.TWILIO_API_SECRET
    this.TWILIO_CHAT_SERVICE_SID = twilioVars.TWILIO_CHAT_SERVICE_SID
    this.AccessToken = this.Twilio.jwt.AccessToken;
    this.ChatGrant = this.AccessToken.ChatGrant;
    // this.VideoGrant = this.AccessToken.VideoGrant;
    // this.SyncGrant = this.AccessToken.SyncGrant;
  }
}

  // /**
  //  * Generate an Access Token for an application user - it generates a random
  //  * username for the client requesting a token or generates a token with an
  //  * identity if one is provided.
  //  *
  //  * @return {Object}
  //  *         {Object.identity} String random indentity
  //  *         {Object.token} String token generated
  //  */
  function tokenGenerate(identity = 0) {
    // Create an access token which we will sign and return to the client
    const token = new this.AccessToken(
      this.TWILIO_ACCOUNT_SID,
      this.TWILIO_API_KEY,
      this.TWILIO_API_SECRET
    );

    // Assign the provided identity or generate a new one
    token.identity = identity || nameGenerator();

    // Grant the access token Twilio Video capabilities
    // const videoGrant = new this.VideoGrant();
    // token.addGrant(videoGrant);

    if (this.TWILIO_CHAT_SERVICE_SID) { //===========================USE THIS============
      // Create a "grant" which enables a client to use IPM as a given user,
      // on a given device
      const chatGrant = new this.ChatGrant({
        serviceSid: this.TWILIO_CHAT_SERVICE_SID
      });
      token.addGrant(chatGrant);
    }

    // if (this.TWILIO_SYNC_SERVICE_SID) {
    //   // Point to a particular Sync service, or use the account default to
    //   // interact directly with Functions.
    //   const syncGrant = new this.SyncGrant({
    //     serviceSid: config.TWILIO_SYNC_SERVICE_SID || 'default'
    //   });
    //   token.addGrant(syncGrant);
    // }

    // Serialize the token to a JWT string and include it in a JSON response
    return {
      identity: token.identity,
      token: token.toJwt()
    };
  }

module.exports = TokenGenerator;
