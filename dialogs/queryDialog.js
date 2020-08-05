const path = require('path');
const fs = require('fs');

const {
    ComponentDialog,
    TextPrompt,
    ConfirmPrompt,
    WaterfallDialog,
    ChoicePrompt,
    ChoiceFactory
} = require('botbuilder-dialogs');

const {
    QnAMakerBaseDialog,
    QNAMAKER_BASE_DIALOG,
    DefaultCardNoMatchResponse,
    DefaultCardNoMatchText,
    DefaultCardTitle,
    DefaultNoAnswer,
    DefaultThreshold,
    DefaultTopN,
    QnAOptions,
    QnADialogResponseOptions
} = require('./qnamakerBaseDialog');

// Adaptive Cards
const { ActivityTypes, CardFactory } = require('botbuilder');
const AdaptiveCards = require("adaptivecards");
const ACData = require("adaptivecards-templating");
const QueryCardTemplate = require('../resources/cards/QueryCard.json');
const ResponseCardTemplate = require('../resources/cards/QueryResponseCard.json');

const TEXT_PROMPT = 'TEXT_PROMPT';
const QUERY_DIALOG = 'query-dialog';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';

// Images
const AskGigScreenshot = '../resources/images/askgig-ss.png';

class QueryDialog extends ComponentDialog {
	constructor(qnaService) {
        super(QUERY_DIALOG);
        this._qnaMakerService = qnaService;

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.qnaQuestionStep.bind(this),
            this.startInitialDialog.bind(this),
            this.confirmStep.bind(this),
            this.lastStep.bind(this)
        ]));

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async qnaQuestionStep(step) {
        
        const template = new ACData.Template(QueryCardTemplate);
        // Creating the data object to bind to template
        let data = {}
        data['$root'] = {}

        // Generate the Adaptive Card which is render-ready
        const card = template.expand(data);

        await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(card)]
            });

        return await step.prompt(TEXT_PROMPT, "");
    }

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the QnA Maker with provided options.
    async startInitialDialog(step) {
        
        try {
            step.context.activity.text = JSON.parse(step.result).query;
        } catch {
            console.log("Something was not quite right. Restarting conversation...");
            await step.context.sendActivity("Please type your input within the Card displayed.");
            return await step.replaceDialog(QUERY_DIALOG);
        }

        // Set values for generate answer options.
        var qnaMakerOptions = {
            scoreThreshold: DefaultThreshold,
            top: DefaultTopN,
            context: {}
        };        
        // Fetches response from QnA Maker API
        var responses = await this._qnaMakerService.getAnswersRaw(step.context, qnaMakerOptions);
        // Debug purposes
        console.log(responses);
        // Store response temporarily
        step.values.result = responses;

        if (responses != null) {
            if (responses.answers.length > 0) {
                const template = new ACData.Template(ResponseCardTemplate);
                // Creating the data object to bind to template
                let data = {}
                data['$root'] = {}
                data.$root.query = step.context.activity.text;
                data.$root.qnaMakerAnswer = responses.answers[0].answer;
                // Generate the Adaptive Card which is render-ready
                const card = template.expand(data);

                await step.context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(card)]
                    });
                return await step.prompt(CONFIRM_PROMPT, 'Was this answer satisfactory?', ['Yes', 'No']);
            } else {
                await step.context.sendActivity("No suitable answer found. Post your answer on AskGIG, or rephrase your question.");
                // Restarts dialog.
                return await step.replaceDialog(QUERY_DIALOG);
            }
        } else {
            await step.context.sendActivity("There was no answer from QnA Maker.");
            // Restarts dialog.
            return await step.replaceDialog(QUERY_DIALOG);
        }
    }

    // Provides additional info to user if they are not satisfied with the result.
    async confirmStep(step) {
        if (step.result) {
            await step.context.sendActivity('Great, happy to help.');
        } else {
            console.log(`this is the result:  ${step.values.result}`);
            // Gets the suggested category, which is the category which the best answer is tagged to.
            // Can also be changed to reveal the categories of the top x answers.
            const category = step.values.result.answers[0].metadata[0].value;

            const imageData = fs.readFileSync(path.join(__dirname, AskGigScreenshot));
            const base64Image = Buffer.from(imageData).toString('base64');
            const image = {
                name: 'AskGIG Screenshot',
                contentType: 'image/png',
                contentUrl: `data:image/png;base64,${ base64Image }`
            }

            await step.context.sendActivity(`Sorry to hear that. You can post your answer on AskGIG, under the category:  **${category}**. \
                \n\n Please see the attached screenshot of the AskGIG portal. \
                \n\n You can visit the portal [using this link](https://itsm.sgnet.gov.sg/sp?id=askgig).`);
            const reply = { type: ActivityTypes.Message };
            reply.attachments = [image];
            await step.context.sendActivity(reply);
        }

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'You have reached the end of this conversation.',
            choices: ChoiceFactory.toChoices(['Write another query', 'Stop querying'])
        });
    }

    async lastStep(step) {
        const choice = step.result.value;
        if (choice === 'Write another query') {
            return await step.replaceDialog(QUERY_DIALOG);
        } else {
            return await step.endDialog();
        }
    }
}

module.exports.QueryDialog = QueryDialog;
module.exports.QUERY_DIALOG = QUERY_DIALOG;
