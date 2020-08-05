
const { AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const { GraphClient } = require('./graph-client');

// When creating a Sharepoint list, the columns can be named.
// These variables must match the column names.
const QUESTION_FIELD = 'Title';
const ANSWER_FIELD = 'Answer';
const CATEGORY_FIELD = 'ldsi';

/*
All the functions use client.getEntireDatabase to fetch the entire Sharepoint list (as specified)
in the env variables. They then format the data to return the requested data.
*/

class GraphHelpers {
    // Returns an array of all categories.
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

    // Returns all questions and answers corresponding to a specified category.
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
}

exports.GraphHelpers = GraphHelpers;
