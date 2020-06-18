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



// Child dialogs
const { BrowseDialog, BROWSE_DIALOG } = require('./browseDialog');
const { QueryDialog, QUERY_DIALOG } = require('./queryDialog');
const { LogoutDialog } = require('./logoutDialog');


const INITIAL_DIALOG = 'initial-dialog';
const ROOT_DIALOG = 'root-dialog';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'; //new
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';

class RootDialog extends LogoutDialog {
    /**
     * Root dialog for this bot.
     * @param {QnAMaker} qnaService A QnAMaker service object.
     */
    constructor(qnaService) {
        super(ROOT_DIALOG);

        this._qnaMakerService = qnaService;

        // Initial waterfall dialog.
        this.addDialog(new WaterfallDialog(INITIAL_DIALOG, [
            this.conversationChoiceStep.bind(this),
            this.handleConversationChoiceStep.bind(this),
            //this.browseStep.bind(this), //browse
            //this.categoriesStep.bind(this),
            // this.qnaQuestionStep.bind(this),
            // this.startInitialDialog.bind(this),
            // this.askStep.bind(this),
            // this.confirmStep.bind(this) // new
            this.lastPromptStep.bind(this),
            this.lastStep.bind(this),
        ]));

        //this.addDialog(new QnAMakerBaseDialog(qnaService));
        this.addDialog(new BrowseDialog()); //browse
        this.addDialog(new QueryDialog(this._qnaMakerService));
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
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        
        if (results.status === DialogTurnStatus.empty) {

        	// If no existing dialog, user must type "query" in order to start the dialog.
    //     	if (botMessageText !== "query") {
    //     		await context.sendActivity("I did not recognise that command. Try typing **_help_**.");
    //     	} else {
				// console.log("new dialog made!"); //debug
    //     		await dialogContext.beginDialog(this.id);
    //     	}
    		await dialogContext.beginDialog(this.id);
        }
    }

    // Ask user if they wants a free query or guided conversation
    async conversationChoiceStep(step) {
        await step.context.sendActivity(`# Main Screen \
            \n\n ## I have two options for you: \
            \n\n 1. **Browse** categories and FAQs for each category.\
            \n\n 2. Type a **query** and I\'ll see if I have your answer.\
            \n\n  \
            \n\n *More commands:* \
            \n\n *Please **_logout_** before you leave.* \
            \n\n *Type **_help_** to get more info.*`);
        return await step.prompt(CHOICE_PROMPT, {
            prompt: '',
            choices: ChoiceFactory.toChoices(['Browse', 'Query'])
        });
    }

    async handleConversationChoiceStep(step) {
    	const choice = step.result.value;
    	if (choice === 'Browse') {
    		return await step.beginDialog(BROWSE_DIALOG);
    	}
    	if (choice === 'Query') {
    		return await step.beginDialog(QUERY_DIALOG);
    	}

    	return await step.endDialog();
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
            choices: ChoiceFactory.toChoices(['Write my own query.', 'Give me some categories to choose from.']),
            listStyle: 3
        });
    }


    


    /*
	Ends the conversation.
	Can also consider initialising the next conversation immediately.
    */

    async lastPromptStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'You have reached the end of this conversation.',
            choices: ChoiceFactory.toChoices(['Return to Main', 'Logout'])
        });
    }

    async lastStep(step) {
    	const choice = step.result.value;
        if (choice === 'Return to Main') {
            return await step.replaceDialog(ROOT_DIALOG);
        }
    }

}

module.exports.RootDialog = RootDialog;
