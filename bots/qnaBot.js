// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TeamsActivityHandler, MessageFactory } = require('botbuilder');

const { TextEncoder } = require('util');
const { LOGIN_DIALOG } = require('../dialogs/loginDialog');
const { EndConversationDialog } = require('../dialogs/endConversationDialog.js');

class QnABot extends TeamsActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog, loginDialog) {
        super();
        if (!conversationState) throw new Error('[QnABot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[QnABot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[QnABot]: Missing parameter. dialog is required');
        if (!loginDialog) throw new Error('[QnABot]: Missing parameter. loginDialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.loginDialog = loginDialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.token = {};

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const timeGreeting = await this.timeOfDay();
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`# AskGIG Chatbot \
                        \n\n Good ${timeGreeting}! Welcome to the GovTech AskGIG Chatbot. \
                        \n\n Type anything to start. \
                    `);
                }
            }
            console.log("onMembersAdded");

            // Need to account for the scenario where the user has active conversations upon launching the app for the first time
            // E.g. installed in the past

            // forcing a logout
            await loginDialog.run(context, conversationState.createProperty('DialogState'));

            // const endConversationDialog = new EndConversationDialog();
            // await endConversationDialog.run(context, this.dialogState);

            //onsole.log('onMembersAdded, context.activity.type: ' + String(context.activity.type)); 
            //await this.loginDialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // Note: Teams channel does not use onTokenResponseEvent, instead it uses handleTeamsSigninVerifyState() declared below.
        this.onTokenResponseEvent(async (context, next) => {
            //A Token Response Event is emitted when the user successfully logs in through the Login card displayed.
            console.log('Running dialog with Token Response Event Activity.');
            // const str = JSON.stringify(context, null, 4);
            // console.log(str);

            await this.runLoginDialogCustom(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            
            //before processing the message, bot will check for authentication first
            //need to save the context first
            //const originalContext = context;
            
            //console.log("onMessage:");
            
            //const str = JSON.stringify(context, null, 4);
            //console.log(str);

            // Checks if the user has finished the LoginDialog.
            const hasDialog = await this.hasActiveDialog(context,this.userState);
            const botMessageText = context.activity.text.trim().toLowerCase() || '';
            console.log("User input: " + botMessageText);

            if (hasDialog === LOGIN_DIALOG) {
                if (/\d{6}$/.test(botMessageText) || botMessageText === 'logout') {
                    await this.loginDialog.run(context, this.dialogState);
                } else {
                    await context.sendActivity("Please login using the link above. This bot requires user authentication. \
                        If there is an error with the link, use **_logout_** to restart the login.");
                }
            } else if (hasDialog === "not found") {
                // let success = await this.loginDialog.run(context, this.dialogState);
                // console.log("onmessage, not found, then ran loginDialog");
                // console.log(success);
                // let success = await this.loginDialog.run(context, this.dialogState);
                // if (success.status === 'complete' && success.result === 'successful') {
                //     await this.dialog.run(context, this.dialogState);
                // }
                await this.runLoginDialogCustom(context, this.dialogState);
            } else {
                // Proceed to handle user inputs.
                if (botMessageText === "help") {
                    await this.handleMessageHelp(context);
                } else  {
                    // Runs RootDialog.
                    await this.dialog.run(context, this.dialogState);
                }
            }

            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        // only "like" works for now
        this.onReactionsAdded(async (context, next) => {
            if (context.activity.reactionsAdded) {
                context.activity.reactionsAdded.forEach(async (reaction) => {
                    if (reaction.type === "like" || "heart" || "laugh") {
                        await context.sendActivity("Thank you!");
                    } else if (reaction.type === "surprised" || "sad" || "angry") {
                        await context.sendActivity("Was there something wrong with the answer? Please let us know.");
                    }
                });
            }
            await next();
        });
    }

    async runLoginDialogCustom(context, state) {
        let success = await this.loginDialog.run(context, state);
        if (success.status === 'complete' && success.result === 'successful') {
            console.log('runLoginDialogCustom, complete and successful');
            await this.dialog.run(context, state);
        }
    }

    async handleTeamsSigninVerifyState(context, state) {
        await this.runLoginDialogCustom(context, this.dialogState);
    }

    async hasActiveDialog(context, userState) {
        // Verifies if the user is currently in the LoginDialog.
        // context has information on the user.
        const activity = context._activity;
        const memoryKey = activity.channelId + "/conversations/" + activity.conversation.id + "/";
        // userState stores the users information under the 'memory' property.
        // We use the 'memoryKey' string to get the userState for the particular user.
        let memory = userState.storage.memory[memoryKey];
        // Memory is a JSON string, need to convert to object
        let currDialogId = "not found";
        //console.log("hasActiveDialog: is this the error?" + typeof(memory));
        if (typeof(memory) !== "undefined") {
            memory = JSON.parse(memory);
        
            // If there is at least 1 active dialog, we return one of its IDs (with this implementation, will return the last one).
            if (typeof(memory.DialogState.dialogStack[0]) !== "undefined") {
                for (let i=0;i<memory.DialogState.dialogStack.length;i++) {
                    currDialogId = memory.DialogState.dialogStack[i].id;
                    // If login-dialog is present, then return its id immediately.
                    if (currDialogId === LOGIN_DIALOG) {
                        break;
                    }
                }
            }
        }
        console.log("currDialogId is: " + currDialogId);
        return currDialogId;
    }
    // unused
    async loginDialogStatus(context, userState) {
        // Verifies if the user is currently in the LoginDialog.
        // context has information on the user.
        const activity = context._activity;
        const memoryKey = activity.channelId + "/conversations/" + activity.conversation.id + "/";
        // userState stores the users information under the 'memory' property.
        // We use the 'memoryKey' string to get the userState for the particular user.
        let memory = userState.storage.memory[memoryKey];
        // Memory is a JSON string, need to convert to object
        memory = JSON.parse(memory);
        let currDialogId = "";
        if (typeof(memory.DialogState.dialogStack[0]) !== "undefined") {
            
            for (let i=0;i<memory.DialogState.dialogStack.length;i++) {
                currDialogId = memory.DialogState.dialogStack[i].id;
                if (currDialogId === LOGIN_DIALOG) {
                    console.log("currDialogId is: " + currDialogId);
                    return true;
                }
            }
        }
        if (currDialogId == "") {currDialogId = "not found"; }
        console.log("currDialogId is: " + currDialogId);
        return false;

        //returns false if currDialogId === LOGIN_DIALOG i.e. user is still in login process
        //returns true otherwise
    }


    //abandoned function which tried to check if the _validated value was true
    // but  that doesnt check if the user was still in the LoginDialog.
    // async tokenCheck(context, onMembersAdded=false) {
    //     if (context._adapter.credentials.authenticationContext._validated) {
    //         if (onMembersAdded) {
    //             await context.sendActivity("You have signed in recently.");
    //         }
    //         // else do nothing
    //     } else {
    //         this.token = await this.loginDialog.run(context, this.dialogState);
    //     }
    // }

    // the httpRequest and ordinaryHTTP functions are to try to make the httpRequest work 
    async httpRequest(){
        //const url = "https://qnakbteams.cognitiveservices.azure.com/qnamaker/v4.0/knowledgebases/95fd11ad-0207-42e6-b68e-4ddc63eb77ec/Prod/qna"
        const url = "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch";
        const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    // The APIs require an OAuth access token in the Authorization header, formatted like this: 'Authorization: Bearer <token>'. 
                    //"Ocp-Apim-Subscription-Key" :  "de1c6a484ad54adea0e44d76b146e6a9",
                    // Needed to get the results as JSON instead of Atom XML (default behavior)
                    "Accept" : 'application/json;odata=verbose',
                }           
            });
            return response.json();
            //return await context.sendActivity('search done?');
    }
    // Unused function
    async ordinaryHTTP() {
        const https = require('https');

        https.get('https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', data)
            .then((res) => {
                console.log(res);
            })
    }

    async timeOfDay() {
        const hour = new Date().getHours() + 8;
        if (hour >= 4 && hour <= 11) {
            return 'morning';
        } else if (hour >= 12 && hour <= 17) {
            return 'afternoon';
        } else {
            return 'evening';
        }
    }

    /*
    TODO: update the help text to provide more information on functionality.
    */

    async handleMessageHelp(context) {
        const mention = {
            mentioned: context._activity.from,
            text: `<at>${new TextEncoder().encode(context._activity.from.name)}</at>`,
            type: "mention"
        };
        const replyActivity = MessageFactory.text(`# Help \
            \n\n Hi, ${mention.text}! *When ready, type anything continue the conversation.* \
            \n\n ## About \
            \n\n This chatbot aims to help you find your answers to your technical questions more quickly. \
            \n\n This chatbot was developed by GovTech GIG IPE. To view the GitHub repository, visit this [link](https://github.com/ngkc1996/teamsbot/). \

            \n\n ## Commands: \
            \n\n **_help_** Shows the list of commands. \
            \n\n **_logout_** Logout from the bot. Recommended to do before you leave. \
            \n\n \
            `);
        replyActivity.entities = [mention];
        await context.sendActivity(replyActivity);
    }
}

module.exports.QnABot = QnABot;
