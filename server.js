// My bot

"use strict";
const path = require('path');
const restify = require('restify');

// not using for now: ConversationState, MemoryStorage, UserState
//const { BotFrameworkAdapter } = require('botbuilder');
const { BotFrameworkAdapter } = require('botbuilder');

//const AuthenticationContext = require('adal-node').AuthenticationContext;
//const builder_cognitiveservices = require("botbuilder-cognitiveservices");
//const Promise = require('es6-promise').Promise;
//const _ = require('lodash'); // Maybe don't need

// Bots
const { ConvoBot } =require('./bots/convoBot');

// Environmental variables
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

//=========================================================
// ADAL Configuration
//=========================================================

// Generating the OAuth2 'login' link for user

const adalConfig = {
    'clientId' : process.env.AAD_CLIENT_ID, // The client Id retrieved from the Azure AD App
    'clientSecret' : process.env.AAD_CLIENT_SECRET, // The client secret retrieved from the Azure AD App
    'authorityHostUrl' : 'https://login.microsoftonline.com/', // The host URL for the Microsoft authorization server
    'tenant' : process.env.TENANT, // The tenant Id or domain name (e.g mydomain.onmicrosoft.com)
    'redirectUri' : process.env.REDIRECT_URI, // This URL will be used for the Azure AD Application to send the authorization code.
    'resource' : process.env.RESOURCE, // The resource endpoint we want to give access to (in this case, SharePoint Online)
}

adalConfig.authorityUrl = adalConfig.authorityHostUrl + adalConfig.tenant;
adalConfig.templateAuthzUrl =  adalConfig.authorityUrl +
                        '/oauth2/authorize?response_type=code&client_id=' + // Optionally, we can get an Open Id Connect id_token to get more info on the user (some additional parameters are required if so https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-openid-connect-code)
                        adalConfig.clientId + 
                        '&state=<state>&resource=' + 
                        adalConfig.resource + 
                        '&response_mode=form_post' + //We want response as POST http request (see callback to see why)
                        '&redirect_uri=' + adalConfig.redirectUri  // If not specified, the adalConfigured reply URL of the Azure AD App will be used 

//=========================================================
// Global bot setup
//=========================================================
// const adapter = new BotFrameworkAdapter({
//     appId: process.env.MicrosoftAppId,
//     appPassword: process.env.MicrosoftAppPassword,
//     openIdMetadata: process.env.BotOpenIdMetadata
// });

var adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});


// Didn't put anything in the params
const bot = new ConvoBot(adapter);


//=========================================================
// Error Handling
//=========================================================
// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    let onTurnErrorMessage = 'The bot encounted an error or bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    // Clear out state
    await conversationState.delete(context);
};




//=========================================================
// Server setup (Restify)
//=========================================================

// Create HTTP server
const server = restify.createServer();
// This is necessary to get the authorization code (req.params.code) --> WHY??
// server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});


  
// This route is the endpoint for our bot (i.e which you put when you register your bot)
// Not sure what to put here
// server.post('/api/messages', connector.listen()); 

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        // Route the message to the bot's main handler.
        await bot.run(turnContext);
    });
});



//server.post('/api/messages', adapter.listen()); 


// Create a route for the Azure AD App callback
// Be careful here: if you specify a GET request for the OAuth callback, IISNODE will interpret the response as a static file due to the query string parameters instead of redirect it to the correct node js server route.
// To avoid modify the web.config, use a POST request instead
// server.post('/api/oauthcallback', (req, res, next) => {

//     // Get the authorization code from the Azure AD application
//     var authorizationCode = req.params.code;
//     if(authorizationCode) {

//         acquireTokenWithAuthorizationCode(authorizationCode).then((response) => {

//             // Add the state to the response to validate the CSRF scenario
//             // The state has two utilities here:
//             // - Reconnect with the bot to continue dialog
//             // - Avoid CRSF attacks
//             var state = req.params.state;
//             if (state) {
                
//                 var address = JSON.parse(state);
//                 response.state = state;

//                 // Continue the dialog with the bot. Be careful, beginDialog" starts a new conversation.
//                 // We use the state parameter to save the address and be able to reconnect with the bot after authentication
//                 // Special thanks to this blog post https://dev-hope.blogspot.ca/2016/09/google-oauth-using-nodejs-and-microsoft.html
//                 // https://docs.botframework.com/en-us/node/builder/chat/UniversalBot/#navtitle ==> See paragraph "Saving Users Address"
//                 bot.beginDialog(address, "/oauth-success", response);
//             }
        
//             var body = '<html><body>Authentication succeeded! You can now close this tab</body></html>';
//             res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
//             res.end();

//         }).catch((errorMessage) => {
            
//             var body = '<html><body>' + errorMessage + '</body></html>';
//             res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
//             res.end();
//         });
        
//     } else {

//         var body = '<html><body>Something went wrong, we didn\'t get an authorization code</body></html>';
//         res.send(200, body, { 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'text/html' });
//         res.end();
//     }
// });