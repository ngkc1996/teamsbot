// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const { GraphClient } = require('./graph-client');

// When creating a Sharepoint list, the columns can be named.
// These variables must match the column names.
const QUESTION_FIELD = 'Title';
const ANSWER_FIELD = 'Answer';
const CATEGORY_FIELD = 'ldsi';


class GraphHelpers {
    
    static async getAllCategories(context, token) {
        if (!context) {
            throw new Error('getAllCategories(): `context` cannot be undefined.');
        }
        if (!token) {
            throw new Error('getAllCategories(): `token` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(token);
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

    static async getCategory(context, token, category) {
        if (!context) {
            throw new Error('getCategory(): `context` cannot be undefined.');
        }
        if (!token) {
            throw new Error('getCategory(): `token` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(token);
        const response = await client.getEntireDatabase(SITE_ID, LIST_NAME);
        
        if (response) {
            const results = response.value;
            const questions = new Array();
            for (let cnt = 0; cnt < results.length; cnt++) {
                const result = results[cnt];
                const qnapair = new Array();
                if (result.fields[CATEGORY_FIELD] === category) {
                    qnapair.push(result.fields[QUESTION_FIELD], result.fields[ANSWER_FIELD]);
                    questions.push(qnapair);
                }
                
            }
            return questions;
        } 
        return "Something didn't work right in graph-helpers.";
    }

    static async getQuestions(context, token, category) {
        if (!context) {
            throw new Error('getQuestions(): `context` cannot be undefined.');
        }
        if (!token) {
            throw new Error('getQuestions(): `token` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(token);
        const response = await client.getEntireDatabase(SITE_ID, LIST_NAME);
        if (response) {
            const results = response.value;
            let questions = new Array();
            for (let cnt = 0; cnt < Math.min(results.length, 5); cnt++) {
                const answer = results[cnt];
                if (answer.fields[CATEGORY_FIELD] === category) {
                    questions.push(answer.fields[QUESTION_FIELD]);
                }
                
            }
            return questions;
        } 
        return "Something didn't work right in graph-helpers.";
    }

    static async getAnswer(context, token, questionChoice) {
        if (!context) {
            throw new Error('getAnswer(): `context` cannot be undefined.');
        }
        if (!token) {
            throw new Error('getAnswer(): `token` cannot be undefined.');
        }

        const SITE_ID = process.env.SharepointSiteId;
        const LIST_NAME = process.env.SharepointListName;
        const client = new GraphClient(token);
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
        return "Something didn't work right in graph-helpers.";
    }
}

exports.GraphHelpers = GraphHelpers;
