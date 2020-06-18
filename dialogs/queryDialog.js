
const {
    ComponentDialog,
    TextPrompt,
    ConfirmPrompt,
    WaterfallDialog,

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

const TEXT_PROMPT = 'TEXT_PROMPT';
const QUERY_DIALOG = 'query-dialog';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT'; //new

class QueryDialog extends ComponentDialog {
	constructor(qnaService) {
        super(QUERY_DIALOG);

        this._qnaMakerService = qnaService;

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT)); //new

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.qnaQuestionStep.bind(this),
            this.startInitialDialog.bind(this),
            this.askStep.bind(this),
            this.confirmStep.bind(this) // new
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
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
            await step.context.sendActivity('Great, happy to help.');
        } else {
            console.log(`this is the result:  ${step.values.result}`);
            const category = step.values.result.answers[0].metadata[0].value;
            console.log(category);
            await step.context.sendActivity(`Sorry to hear that. Post your answer on AskGIG, under the category: '${category}'.`);
        }

        return await step.endDialog();
    }

}

module.exports.QueryDialog = QueryDialog;
module.exports.QUERY_DIALOG = QUERY_DIALOG;
