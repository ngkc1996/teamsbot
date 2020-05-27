// Not using ActivityHandler
const { TeamsActivityHandler, MessageFactory } = require('botbuilder');

const { TextEncoder } = require('util');

class ConvoBot extends TeamsActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.ConvoBot = ConvoBot;
