// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Client } = require('@microsoft/microsoft-graph-client');

/**
 * This class is a wrapper for the Microsoft Graph API.
 * See: https://developer.microsoft.com/en-us/graph for more information.
 */
class GraphClient {
    constructor(token) {
        if (!token || !token.trim()) {
            throw new Error('GraphClient: Invalid token received.');
        }

        this._token = token;

        // Get an Authenticated Microsoft Graph client using the token issued to the user.
        this.graphClient = Client.init({
            authProvider: (done) => {
                done(null, this._token); // First parameter takes an error if you can't get an access token.
            }
        });
    }

    async getEntireDatabase(siteId, listName){
        return await this.graphClient
            .api(`/sites/${siteId}/lists/${listName}/items?expand=fields`)
            .get().then((res) => {
                return res;
            });
    }
}

exports.GraphClient = GraphClient;
