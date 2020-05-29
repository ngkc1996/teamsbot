
const { DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { LogoutDialog } = require('./logoutDialog');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const OAUTH_PROMPT = 'oAuthPrompt';

class LoginDialog extends LogoutDialog {
    constructor() {

        super('LoginDialog');
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
                connectionName: process.env.ConnectionName,
                text: 'Please login using this link below.',
                title: 'Login to your Microsoft account',
                timeout: 300000
            }))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.promptStep.bind(this),
                this.loginStep.bind(this),
            ]));
        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    async run(context, accessor) {
        console.log("entered loginDialog");
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            console.log("dialogturnstatus.empty, starting new logindialog");
            await dialogContext.beginDialog(this.id);
        }
    }

    async promptStep(step) {
        console.log("promptstep loginDialog");
        //const str = JSON.stringify(step, null, 4);
        //console.log("promptStep step:" + str);
        return step.beginDialog(OAUTH_PROMPT);
    }

    async loginStep(step) {
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = step.result;
        if (tokenResponse) {
            await step.context.sendActivity(`You are now logged in.\
                Ask me a question and I will try to answer it. \
                \n\n **_help_** Shows the list of commands. \
                \n\n **_query_** Ask the bot a query or browse FAQs. \
                `);
            //console.log("tokenresponse is " + tokenResponse);
            //console.log("loginDialog end with token");
            return await step.endDialog();
        }
        //console.log("loginDialog end no token");
        await step.context.sendActivity('Login was not successful, please try again.');
        return await step.endDialog(tokenResponse);
    }
}

module.exports.LoginDialog = LoginDialog;
