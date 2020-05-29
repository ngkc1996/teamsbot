
const {
    ComponentDialog,
    TextPrompt,
    WaterfallDialog,

} = require('botbuilder-dialogs');

const TEXT_PROMPT = 'TEXT_PROMPT';
const BROWSE_DIALOG = 'BROWSE_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class BrowseDialog extends ComponentDialog {
	constructor() {
        super(BROWSE_DIALOG);
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.confirmStep.bind(this),
            
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(step) {
    	const promptOptions = { prompt: 'Please enter your name.' };

        // Ask the user to enter their name.
        return await step.prompt(TEXT_PROMPT, promptOptions);
    }

    async confirmStep(step) {
    	const name = step.result;
    	return await step.endDialog(name);
    }


}

module.exports.BrowseDialog = BrowseDialog;
module.exports.BROWSE_DIALOG = BROWSE_DIALOG;

