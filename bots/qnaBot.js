// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, TeamsActivityHandler, MessageFactory } = require('botbuilder');

const { TextEncoder } = require('util');

/**
 * A simple bot that responds to utterances with answers from QnA Maker.
 * If an answer is not found for an utterance, the bot responds with help.
 */
class QnABot extends TeamsActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[QnABot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[QnABot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[QnABot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            const botMessageText = context.activity.text.trim().toLowerCase();
            //await context.sendActivity('you sent a message'); //debug
            //Start command        
            if (botMessageText === "start") {
                  await this.handleMessageStart(context);
            } else {                
                // console.log('Running dialog with Message Activity. User message: ' + botMessageText); //debug
                // Run the Dialog with the new message Activity.
                await this.dialog.run(context, this.dialogState);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // If a new user is added to the conversation, send them a greeting message
        // TO ADD IN AFTER DIALOG FUNCTIONALITY IS DONE

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to the AskGIG chatbot test! Ask me a question and I will try to answer it.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
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

    // Start function
    async handleMessageStart(context) {
        const mention = {
            mentioned: context.activity.from,
            text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
            type: "mention"
        };

        const replyActivity = MessageFactory.text(`Hi ${mention.text}!. Ask me a question and I will try my best to answer it.`);
        replyActivity.entities = [mention];
        await context.sendActivity(replyActivity);
    }

}

module.exports.QnABot = QnABot;
