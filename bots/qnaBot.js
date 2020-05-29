// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TeamsActivityHandler, MessageFactory } = require('botbuilder');

const { TextEncoder } = require('util');

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
                    await context.sendActivity(`Good ${timeGreeting}! Welcome to the GovTech AskGIG chatbot.`);
                }
            }
            // Starts the LoginDialog.
            await this.loginDialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onTokenResponseEvent(async (context, next) => {
            //A Token Response Event is emitted when the user successfully logs in through the Login card displayed.
            console.log('Running dialog with Token Response Event Activity.');
            // Run the LoginDialog. The dialog was first started in onMembersAdded. 
            // Since LoginDialog only consists of 2 step, it will end after this run.
            // Currently there is no way for the user to summon LoginDialog again.
            await this.loginDialog.run(context, this.dialogState);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            // Checks if the user has finished the LoginDialog.
            const completedLogin = await this.loginDialogStatus(context,this.userState);
            const botMessageText = context.activity.text.trim().toLowerCase();
            if (completedLogin) {
                // Proceed to handle user inputs.
                if (botMessageText === "help") {
                    await this.handleMessageHelp(context);
                } else  {
                    // Runs RootDialog.
                    await this.dialog.run(context, this.dialogState, botMessageText);
                }
            // If user has not completed the LoginDialog.
            } else {
                if (/\d{6}$/.test(botMessageText)) {
                    await this.loginDialog.run(context, this.dialogState, botMessageText);
                } else {
                    await context.sendActivity("Please login using the link above. This bot requires user authentication.");
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
            currDialogId = memory.DialogState.dialogStack[0].id;
        } else {
            currDialogId = "not found";
        }
        console.log("currDialogId is: " + currDialogId); //debug
        // userState shows that user is still in the LoginDialog.
        if (currDialogId === "LoginDialog") {
            return false;
        } else {
            return true;
        }
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
        const hour = new Date().getHours();
        if (hour >= 4 && hour <= 11) {
            return 'morning';
        } else if (hour >= 12 && hour <= 17) {
            return 'afternoon';
        } else {
            return 'evening';
        }
    }

    async handleMessageHelp(context) {
        const mention = {
            mentioned: context.activity.from,
            text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
            type: "mention"
        };
        const replyActivity = MessageFactory.text(`Hi ${mention.text}!. Commands: \
            \n\n **_help_** Shows the list of commands. \
            \n\n **_query_** Ask the bot a query or browse FAQs. \
            \n\n \
            \n\n This is a chatbot developed by GovTech GIG IPE. For more information, visit this [link](https://github.com/ngkc1996/teamsbot/). 
            `);
        replyActivity.entities = [mention];
        await context.sendActivity(replyActivity);
    }
}

module.exports.QnABot = QnABot;
