 
const { DialogSet, DialogTurnStatus, OAuthPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { LogoutDialog } = require('./logoutDialog');

const { TextEncoder } = require('util'); //for the mention name

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const OAUTH_PROMPT = 'oAuthPrompt';
const LOGIN_DIALOG = 'login-dialog';

class LoginDialog extends LogoutDialog {
    constructor() {

        super(LOGIN_DIALOG);
        this.addDialog(new OAuthPrompt(OAUTH_PROMPT, {
                connectionName: process.env.ConnectionName,
                text: 'To begin, please login using this link below.',
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
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            console.log("dialogturnstatus.empty, starting new logindialog");
            results = await dialogContext.beginDialog(this.id);
        }
        //results is of form { status: , result: }
        //status is 'complete' if continueDialog was executed successfully (note: does not mean that login was successful)
        //result is passed in through the endDialog() in the return statement
        return results;
    }

    async promptStep(step) {
        console.log("promptstep loginDialog");
        //const str = JSON.stringify(step, null, 4);
        //console.log("promptStep step:" + str);
        const result = await step.beginDialog(OAUTH_PROMPT);
        // console.log("from promptstep:");
        // console.log(result);
        return result;
    }

    async loginStep(step) {
        // Get the token from the previous step. Note that we could also have gotten the
        // token directly from the prompt itself. There is an example of this in the next method.
        const tokenResponse = step.result;
        if (tokenResponse) {
            //console.log("tokenresponse is " + tokenResponse);

            // const mention = {
            //     mentioned: step.context.activity.from,
            //     text: `<at>${new TextEncoder().encode(step.context.activity.from.name)}</at>`,
            //     type: "mention"
            // };

            //\n\n Hi, ${mention.text}! \
            await step.context.sendActivity(`## Login was successful. Welcome!`);
            
            //console.log("loginDialog end with token");
            // returns 'success' to the results variable in run()
            return await step.endDialog('successful');
        }
        //console.log("loginDialog end no token");
        await step.context.sendActivity('Login was not successful, please try again.');
        return await step.endDialog('not successful');
        //return await step.endDialog(tokenResponse);
    }
}

module.exports.LoginDialog = LoginDialog;
module.exports.LOGIN_DIALOG = LOGIN_DIALOG;
