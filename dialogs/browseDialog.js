
const {
    ComponentDialog,
    TextPrompt,
    WaterfallDialog,
    DialogSet,
    DialogTurnStatus,
    OAuthPrompt,
    ChoicePrompt,
    ChoiceFactory,

} = require('botbuilder-dialogs');


const { CardFactory } = require('botbuilder');

const { LogoutDialog } = require('./logoutDialog');
const { GraphHelpers } = require('../graph-helpers/graph-helpers');


const TEXT_PROMPT = 'TEXT_PROMPT';
const BROWSE_DIALOG = 'BROWSE_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const OAUTH_PROMPT = 'oAuthPrompt';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

/*
Note: every time we need a response from Sharepoint, we will check for a valid login on the backend.
The reasons for this are:
1. If the user is already logged in we do not need to store the token locally in the bot and worry
about refreshing it. We can always just call the prompt again to get the token.
2. We never know how long it will take a user to respond. By the time the
user responds the token may have expired. The user would then be prompted to login again.

There is no reason to store the token locally in the bot because we can always just call
the OAuth prompt to get the token or get a new token if needed.
*/


class BrowseDialog extends LogoutDialog {
	constructor() {
        super(BROWSE_DIALOG);
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
                connectionName: process.env.ConnectionName,
                text: 'To continue, please login again below.',
                title: 'Login to your Microsoft account',
                timeout: 300000
            }));
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.checkLogin1Step.bind(this),
            this.categoriesPromptStep.bind(this),
            this.checkLogin2Step.bind(this),
            this.handleCategoriesChoiceStep.bind(this),
            this.checkLogin3Step.bind(this),
            this.handleAnswerChoiceStep.bind(this),
            
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async checkLogin1Step(step) {
        console.log(step.values);
        return step.beginDialog(OAUTH_PROMPT);
    }

    async categoriesPromptStep(step) {
        const tokenResponse = step.result;
        if (!(tokenResponse && tokenResponse.token)) {
            await step.context.sendActivity('Login was not successful please try again.');
            return await step.replaceDialog(BROWSE_DIALOG);
        }
        await step.context.sendActivity('As this action requires access to a Sharepoint site, your login was confirmed. ');
        const categories = await GraphHelpers.getCategories(step.context, tokenResponse);
        // decide if I should save categories into step.values.categories
        return await step.prompt(CHOICE_PROMPT, {
            prompt: `Here are a list of categories, please type in a number:`,
            choices: ChoiceFactory.toChoices(categories)
        });
    }

    async checkLogin2Step(step) {
        step.values.categoryChoice = step.result.value;
        return step.beginDialog(OAUTH_PROMPT);
    }

    async handleCategoriesChoiceStep(step) {
        const tokenResponse = step.result;
        if (!(tokenResponse && tokenResponse.token)) {
            await step.context.sendActivity('Login was not successful please try again.');
            return await step.replaceDialog(BROWSE_DIALOG);
        }
        
        const categoryChoice = step.values.categoryChoice;

        //await step.context.sendActivity("Your choice was: " + categoryChoice);
        const questions = await GraphHelpers.getQuestions(step.context, tokenResponse, categoryChoice);
        return await step.prompt(CHOICE_PROMPT, {
            prompt: `# Here are the questions in the *${categoryChoice}* category. \
            \n\n ## To see an answer, please type in a number.`,
            choices: ChoiceFactory.toChoices(questions)
        });
    }



    async checkLogin3Step(step) {
        step.values.questionChoice = step.result.value;
        return step.beginDialog(OAUTH_PROMPT);
    }

    async handleAnswerChoiceStep(step) {
        const tokenResponse = step.result;
        if (!(tokenResponse && tokenResponse.token)) {
            await step.context.sendActivity('Login was not successful please try again.');
            return await step.replaceDialog(BROWSE_DIALOG);
        }


        const questionChoice = step.values.questionChoice;

        //await step.context.sendActivity("Your choice was: " + answerChoice);
        const answer = await GraphHelpers.getAnswer(step.context, tokenResponse, questionChoice);
        await step.context.sendActivity(`# Question: ${questionChoice}. \
            \n\n Answer: ${answer}.`);

        return await step.endDialog();
    }

}

module.exports.BrowseDialog = BrowseDialog;
module.exports.BROWSE_DIALOG = BROWSE_DIALOG;

