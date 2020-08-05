const {
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');

// Adaptive Cards
const { CardFactory } = require('botbuilder');
const AdaptiveCards = require("adaptivecards");
const ACData = require("adaptivecards-templating");

// Adaptive Card templates
const BrowseCardTemplate = require('../resources/cards/BrowseCard.json');
const CategoryCardTemplate = require('../resources/cards/CategoryCard.json');

const { LoginDialog } = require('../dialogs/loginDialog');
const { LogoutDialog } = require('./logoutDialog');

// GraphHelpers contains functions which implement backend logic to call Microsoft Graph APIs.
const { GraphHelpers } = require('../graph-helpers/graph-helpers');

const TEXT_PROMPT = 'TEXT_PROMPT';
const BROWSE_DIALOG = 'BROWSE_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

/*
Note regarding logins:
Every time we need a response from Sharepoint, we will check for a valid login on the backend.
The reasons for this are:
1. For security reasons, the authentication token is not stored locally in the bot.
2. We never know how long it will take a user to respond. By the time the
user responds the token may have expired.

Hence LoginDialog.getToken() is called whenever access is required.
*/

class BrowseDialog extends LogoutDialog {
	constructor() {
        super(BROWSE_DIALOG);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.mainBrowseStep.bind(this),
            this.categoryStep.bind(this),
            this.handleLastPromptStep.bind(this),  
        ]));

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async mainBrowseStep(step) {
        // Check login status.
        const token = await LoginDialog.getToken();
        if (!token) {
            await step.context.sendActivity('Login was not successful please try again.');
            return await step.replaceDialog(BROWSE_DIALOG);
        }
        // Fetch categories from Graph.
        const categories = await GraphHelpers.getAllCategories(step.context, token);
        // Create a template instance
        const template = new ACData.Template(BrowseCardTemplate);
        // Create the data object to bind to template.
        let data = {}
        data['$root'] = {}
        data.$root.category = []
        for (let i=0; i<categories.length; i++) {
            let inner = {}
            inner['name'] = categories[i];
            data.$root.category.push(inner);
        }
        // Generate the Adaptive Card which is render-ready.
        const card = template.expand(data);

        await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(card)]
            });
        
        return await step.prompt(TEXT_PROMPT, "");
    }

    async categoryStep(step) {
        try {
            step.values.categoryChoice = JSON.parse(step.result).categoryChoice;
        } catch {
            console.log("Something was not quite right. Restarting conversation...");
            return await step.replaceDialog(BROWSE_DIALOG);
        }
        const categoryChoice = step.values.categoryChoice;
        console.log(categoryChoice);

        const token = await LoginDialog.getToken();
        if (!token) {
            await step.context.sendActivity('Login was not successful please try again.');
            return await step.replaceDialog(BROWSE_DIALOG);
        }
        
        const allCategories = await GraphHelpers.getAllCategories(step.context, token);
        if (allCategories.includes(categoryChoice)) {

            const categoryQnaPairs = await GraphHelpers.getCategory(step.context, token, categoryChoice);

            const template = new ACData.Template(CategoryCardTemplate);

            let data = {}
            data['$root'] = {}
            data.$root.category = categoryChoice;
            data.$root.qnaPairs = []
            // Show a maximum of 5 Questions and Answers.
            const noOfPairs = Math.min(categoryQnaPairs.length, 5);
            for (let i=0; i<noOfPairs; i++) {
                let inner = {}
                inner['question'] = categoryQnaPairs[i][0];
                inner['answer'] = categoryQnaPairs[i][1];
                inner['index'] = i;
                data.$root.qnaPairs.push(inner);
            }
            
            const card = template.expand(data);

            await step.context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(card)]
                });

            return await step.prompt(TEXT_PROMPT, "");
        }
    }

    async handleLastPromptStep(step) {
        try {
            const response = JSON.parse(step.result).response;
            if (response === "restart") {
                return await step.replaceDialog(BROWSE_DIALOG);
            } else if (response === "end") {
                return await step.endDialog();
            }
        } catch {
            return await step.context.sendActivity("Didn't catch that, ending conversation...");
        }
    }
}

module.exports.BrowseDialog = BrowseDialog;
module.exports.BROWSE_DIALOG = BROWSE_DIALOG;
