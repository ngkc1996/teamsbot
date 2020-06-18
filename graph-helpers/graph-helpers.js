// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const { GraphClient } = require('./graph-client');

const QUESTION_FIELD = 'Title';
const ANSWER_FIELD = 'qnya';
const CATEGORY_FIELD = 'ldsi';


class GraphHelpers {
    
    static async getCategories(context, tokenResponse) {
        if (!context) {
            throw new Error('OAuthHelpers.sendMail(): `context` cannot be undefined.');
        }
        if (!tokenResponse) {
            throw new Error('OAuthHelpers.sendMail(): `tokenResponse` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(tokenResponse.token);
        const response = await client.getEntireDatabase(SITE_ID, LIST_NAME);
        if (response) {
            const results = response.value;
            // Get a set of all categories
            let categories = new Set();
            for (let cnt = 0; cnt < results.length; cnt++) {
                const answer = results[cnt];
                categories.add(answer.fields[CATEGORY_FIELD]);
            }
            // Return as an Array
            return Array.from(categories);
        } 
        return "Something didn't work about in graph-helpers";
    }

    static async getQuestions(context, tokenResponse, category) {
        if (!context) {
            throw new Error('OAuthHelpers.sendMail(): `context` cannot be undefined.');
        }
        if (!tokenResponse) {
            throw new Error('OAuthHelpers.sendMail(): `tokenResponse` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(tokenResponse.token);
        const response = await client.getEntireDatabase(SITE_ID, LIST_NAME);
        if (response) {
            const results = response.value;
            let questions = new Array();
            for (let cnt = 0; cnt < results.length; cnt++) {
                const answer = results[cnt];
                if (answer.fields[CATEGORY_FIELD] === category) {
                    questions.push(answer.fields[QUESTION_FIELD]);
                }
                
            }
            return questions;
        } 
        return "Something didn't work about in graph-helpers";
    }

    static async getAnswer(context, tokenResponse, questionChoice) {
        if (!context) {
            throw new Error('OAuthHelpers.sendMail(): `context` cannot be undefined.');
        }
        if (!tokenResponse) {
            throw new Error('OAuthHelpers.sendMail(): `tokenResponse` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(tokenResponse.token);
        const response = await client.getEntireDatabase(SITE_ID, LIST_NAME);
        if (response) {
            const results = response.value;
            let questions = new Array();
            for (let cnt = 0; cnt < results.length; cnt++) {
                const answer = results[cnt];
                if (answer.fields[QUESTION_FIELD] === questionChoice) {
                    return answer.fields[ANSWER_FIELD];
                }
                
            }
            return "Did not find an answer to that question.";
        } 
        return "Something didn't work about in graph-helpers.";
    }
        






        // const reply = { attachments: [], attachmentLayout: AttachmentLayoutTypes.List };
        // const card = CardFactory.heroCard(
        //     'BotFramework Hero Card',
        //     CardFactory.images(['https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg']),
        //     CardFactory.actions([
        //         {
        //             type: 'openUrl',
        //             title: 'Get started',
        //             value: 'google.com'
        //         }
        //     ])
        // );

        // reply.attachments.push(card);

        // await context.sendActivity(reply);

        // await context.sendActivity({
        //         text: 'Here is an Adaptive Card:',
        //         attachments: [CardFactory.adaptiveCard(card)]
        //     });


        // if (Array.isArray(results)) {
            
        //     const reply = { attachments: [], attachmentLayout: AttachmentLayoutTypes.List };

        //     let categories = new Set();

        //     for (let cnt = 0; cnt < results.length; cnt++) {

        //         const answer = results[cnt];
        //         if (!categories.has(answer.fields.ldsi)) {
        //             // if categories doesn't already have the value, then do something with it
        //         }
        //         categories.add(answer.fields.ldsi);
        //         const card = CardFactory.heroCard(
        //             answer.fields.Title,
        //             answer.fields.qnya,
        //             //answer.fields.Category,
        //             CardFactory.actions([{title: "Button",
        //                    value: "button"
        //         }])
                   
        //         );
        //         reply.attachments.push(card);
                
        //     }
        //     await context.sendActivity(`Here is the entire sharepoint list.`);
        //     await context.sendActivity(reply);


        // } else {
        //     await context.sendActivity(`Error: The list you searched is empty.`);
        // }
    
}

exports.GraphHelpers = GraphHelpers;
