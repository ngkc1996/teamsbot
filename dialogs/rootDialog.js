// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog,
    ConfirmPrompt, //new
    ChoicePrompt, 
    ChoiceFactory,
    TextPrompt,
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

// Child dialogs
const { BrowseDialog, BROWSE_DIALOG } = require('./browseDialog');

const INITIAL_DIALOG = 'initial-dialog';
const ROOT_DIALOG = 'root-dialog';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'; //new
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

class RootDialog extends ComponentDialog {
    /**
     * Root dialog for this bot.
     * @param {QnAMaker} qnaService A QnAMaker service object.
     */
    constructor(qnaService) {
        super(ROOT_DIALOG);

        this._qnaMakerService = qnaService;

        // Initial waterfall dialog.
        this.addDialog(new WaterfallDialog(INITIAL_DIALOG, [
            //this.guidedConversationChoiceStep.bind(this),
            //this.browseStep.bind(this), //browse
            //this.categoriesStep.bind(this),
            this.qnaQuestionStep.bind(this),
            this.startInitialDialog.bind(this),
            this.askStep.bind(this),
            this.confirmStep.bind(this) // new
        ]));

        //this.addDialog(new QnAMakerBaseDialog(qnaService));
        this.addDialog(new BrowseDialog()); //browse
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT)); //new
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.initialDialogId = INITIAL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(context, accessor, botMessageText) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
        	// If no existing dialog, user must type "query" in order to start the dialog.
        	if (botMessageText !== "query") {
        		await context.sendActivity("I did not recognise that command. Try typing **_help_**.");
        	} else {
				console.log("new dialog made!"); //debug
        		await dialogContext.beginDialog(this.id);
        	}
        }
    }

    // Ask user if they wants a free query or guided conversation
    async guidedConversationChoiceStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'You . Please choose: ',
            choices: ChoiceFactory.toChoices(['Write my own query.', 'Give me some categories to choose from.'])
        });
    }
    //browse
    async browseStep(step) { 
    	return await step.beginDialog(BROWSE_DIALOG);
    }

    async categoriesStep(step){
        await step.context.sendActivity(step.result);
        if (step.result === 'end') {
        	return await step.endDialog();
        }
        
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'You chose Guided Query. Please select from the following categories.',
            choices: ChoiceFactory.toChoices(['Write my own query.', 'Give me some categories to choose from.'])
        });
    }


    async qnaQuestionStep(step) {
    	const promptOptions = { prompt: 'Please type your query.' };
        return await step.prompt(TEXT_PROMPT, promptOptions);
    }

    // This is the first step of the WaterfallDialog.
    // It kicks off the dialog with the QnA Maker with provided options.
    async startInitialDialog(step) {
        // Set values for generate answer options.
        var qnaMakerOptions = {
            scoreThreshold: DefaultThreshold,
            top: DefaultTopN,
            context: {}
        };


        // try to put the whole QnA response here instead:
        step.context.activity.text = step.result;
        var responses = await this._qnaMakerService.getAnswersRaw(step.context, qnaMakerOptions);
        console.log(responses);
        step.values.result = responses;

        if (responses != null) {
            if (responses.answers.length > 0) {
                await step.context.sendActivity(responses.answers[0].answer);
                return await step.next();
            } else {
                await step.context.sendActivity("No suitable answer found. Post your answer on AskGIG, or rephrase your question.");
                return await step.endDialog();
            }
        } else {
            await step.context.sendActivity("Also no answer.");
            return await step.next();
        }

        // if (responses != null) {
        //     if (responses.answers.length > 0) {
        //         await step.context.sendActivity(responses.answers[0]);
        //     } else {
        //         await step.context.sendActivity("No suitable answer found.");
        //     }
        // }

        

        // Set values for dialog responses.
        // var qnaDialogResponseOptions = {
        //     noAnswer: DefaultNoAnswer,
        //     activeLearningCardTitle: DefaultCardTitle,
        //     cardNoMatchText: DefaultCardNoMatchText,
        //     cardNoMatchResponse: DefaultCardNoMatchResponse
        // };

        // var dialogOptions = {};
        // dialogOptions[QnAOptions] = qnamakerOptions;
        // dialogOptions[QnADialogResponseOptions] = qnaDialogResponseOptions;

        //return await step.beginDialog(QNAMAKER_BASE_DIALOG, dialogOptions);
        
        
    }

    async askStep(step) {
        // maybe??
        //step.values.transport = step.result.value;

        //console.log(step.result.value);

        return await step.prompt(CONFIRM_PROMPT, 'Was this answer satisfactory?', ['Yes', 'No']);
    }

    async confirmStep(step) {
        if (step.result) {
            await step.context.sendActivity('Great, happy to help. Type **_query_** to start a new query.');
        } else {
            console.log(`this is the result:  ${step.values.result}`);
            const category = step.values.result.answers[0].metadata[0].value;
            console.log(category);
            await step.context.sendActivity(`Sorry to hear that. Post your answer on AskGIG, under the category: '${category}'. \
            	\n\n Try asking more questions using **_query_**.`);
        }

        return await step.endDialog();
    }
}

module.exports.RootDialog = RootDialog;
