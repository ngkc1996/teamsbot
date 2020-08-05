
const {
    DialogSet,
    DialogTurnStatus,
    WaterfallDialog,
    TextPrompt
} = require('botbuilder-dialogs');

// Child dialogs
const { BrowseDialog, BROWSE_DIALOG } = require('./browseDialog');
const { QueryDialog, QUERY_DIALOG } = require('./queryDialog');
const { LogoutDialog } = require('./logoutDialog');

// Adaptive Cards
const { CardFactory } = require('botbuilder');
const AdaptiveCards = require("adaptivecards");
const ACData = require("adaptivecards-templating");
const MainScreenCardTemplate = require('../resources/cards/MainScreenCard.json');

const INITIAL_DIALOG = 'initial-dialog';
const ROOT_DIALOG = 'root-dialog';
const TEXT_PROMPT = 'TEXT_PROMPT';

class RootDialog extends LogoutDialog {
    /**
     * Root dialog for this bot.
     * @param {QnAMaker} qnaService A QnAMaker service object.
     */
    constructor(qnaService) {
        super(ROOT_DIALOG);
        this._qnaMakerService = qnaService;
        // Waterfall dialog.
        this.addDialog(new WaterfallDialog(INITIAL_DIALOG, [
            this.conversationChoiceStep.bind(this),
            this.handleConversationChoiceStep.bind(this),
            this.lastStep.bind(this)
        ]));

        this.addDialog(new BrowseDialog());
        this.addDialog(new QueryDialog(this._qnaMakerService));
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
    		await dialogContext.beginDialog(this.id);
        }
    }
    /*
    Displays "Main Screen" Card.
    This card allows users to choose which conversation they want to start.
    */
    async conversationChoiceStep(step) {
        // Create the Card
        const mainScreenCard = new ACData.Template(MainScreenCardTemplate);
        // Create empty data object.
        let data = {}
        data['$root'] = {}
        const card = mainScreenCard.expand(data);
        
        await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(card)]
            });
        // Adaptive Cards do not work well in a Waterfall dialog, the text prompt is to make sure 
        // the context returns to this dialog.
        return await step.prompt(TEXT_PROMPT, "");
    }

    /*
    When user presses a button to start a particular conversation, the bot will call the Dialog for that conversation option.
    Note: Bot only responds to user interactions within the Card interface. Any other action such as typing a message
    will not be accepted, and the dialog will restart.
    */
    async handleConversationChoiceStep(step) {
        try {
            const result = JSON.parse(step.result);
            const choice = result.dialogChoice;
            if (choice === 'browse') {
                return await step.beginDialog(BROWSE_DIALOG);
            }
            if (choice === 'query') {
                return await step.beginDialog(QUERY_DIALOG);
            } else {
                return await step.replaceDialog(ROOT_DIALOG);
            }
        } catch {
            return await step.replaceDialog(ROOT_DIALOG);
        }
    }

    // Bot restarts this dialog whenever it ends.
    async lastStep(step) {
        return await step.replaceDialog(ROOT_DIALOG);
    }
}

module.exports.RootDialog = RootDialog;
