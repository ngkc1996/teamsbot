// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


// NOTE: currently unused.


const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { ActivityTypes } = require('botbuilder');
const { ComponentDialog } = require('botbuilder-dialogs');

const END_CONVERSATION_DIALOG = 'end-conversation-dialog';

class EndConversationDialog extends ComponentDialog {
    
    constructor() {
        super(END_CONVERSATION_DIALOG);
    }

    async run(context, accessor) {
        console.log("entered EndConversationDialog");
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

    async onBeginDialog(innerDc, options) {
        await this.endConversation(innerDc);
    }

    async onContinueDialog(innerDc, options) {
        await this.endConversation(innerDc);
    }

    async endConversation(innerDc) {
        // console.log("endConversation test message: " + String(ActivityTypes.Message));
        // console.log("endConversation test ConversationUpdate: " + String(ActivityTypes.ConversationUpdate));
        // console.log("endConversation test context.activity.type : " + String(innerDc.context.activity.type));
        


        if (innerDc.context.activity.type === ActivityTypes.ConversationUpdate) {
            console.log("endConversation, activity type detected as ConversationUpdate (aka onMembersAdded)");
            const botAdapter = innerDc.context.adapter;
            await botAdapter.signOutUser(innerDc.context, process.env.ConnectionName);
            await innerDc.cancelAllDialogs();
        }
    }
}

module.exports.EndConversationDialog = EndConversationDialog;
