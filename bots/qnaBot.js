/*
TeamsActivityHandler is used instead of the default ActivityHandler to enable some
Teams-only functionalities. These functionalities will not be supported if bot is connected to
other channels.
*/
const { TeamsActivityHandler, MessageFactory } = require('botbuilder');

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
        if (!loginDialog) throw new Error('[QnABot]: Missing parameter. loginDialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.loginDialog = loginDialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.token = {};
        /*
        Sends a welcome message to new users.
        Note: When hosted on Azure, timeOfDay() is GMT +0.
        */
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const timeGreeting = await this.timeOfDay() + 8;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`# AskGIG Chatbot \
                        \n\n Good ${timeGreeting}! Welcome to the GovTech AskGIG Chatbot. \
                        \n\n Type anything to start.`);
                }
            }
            // This statement ensures the bot handles future activities.
            await next();
        });
        /*
        Handles incoming message activities, either a user message text, or a user interaction via Card.
        */
        this.onMessage(async (context, next) => {
            let botMessageText = '';
            // Normal messages will have text.
            if (context.activity.text) {
                botMessageText = context.activity.text.trim().toLowerCase() || '';
            // This handles for responses to Card interactions, which by default do not have text.
            } else if (!context.activity.text && context.activity.value) {
                context.activity.text = JSON.stringify(context.activity.value);
                botMessageText = '*Card response detected*';
            }
            // Debug purposes
            console.log("User input: " + botMessageText);
            
            // Handle user inputs.
            // If user types "help" at any time, the handleMessageHelp function is called.
            if (botMessageText === "help") {
                await this.handleMessageHelp(context);
            } else  {
                // Runs RootDialog.
                await this.dialog.run(context, this.dialogState);
            }

            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
        /*
        Handles user reactions to messages, e.g. "liking" a message by the bot.
        */
        this.onReactionsAdded(async (context, next) => {
            if (context.activity.reactionsAdded) {
                context.activity.reactionsAdded.forEach(async (reaction) => {
                    if (reaction.type === "like") {
                        await context.sendActivity("Thank you!");
                    }
                });
            }
            await next();
        });
    }

    // When user presses "Help" button or types "help".
    async handleMessageHelp(context) {
        // Fetches the user's name.
        // Demonstrates that user information can be accessed.
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
            \n\n **_help_** Shows the list of commands.`);
        replyActivity.entities = [mention];
        await context.sendActivity(replyActivity);
    }
}

module.exports.QnABot = QnABot;
