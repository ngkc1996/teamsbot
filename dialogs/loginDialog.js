
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const { LogoutDialog } = require('./logoutDialog');
const LOGIN_DIALOG = 'login-dialog';

class LoginDialog extends LogoutDialog {
    constructor() {
        super(LOGIN_DIALOG);
    }

    static async getToken() {
        const fetch = require('node-fetch');
        const { URLSearchParams } = require('url');
        try {
            const response = await fetch(`https://login.microsoftonline.com/${process.env.TenantId}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },

                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: `${process.env.ClientId}`,
                    client_secret: `${process.env.ClientSecret}`,
                    scope: 'https://graph.microsoft.com/.default',
                })
            });
            const json = await response.json();

            return json.access_token;
        } catch (err) {
            throw err;
        }
    }
}

module.exports.LoginDialog = LoginDialog;
module.exports.LOGIN_DIALOG = LOGIN_DIALOG;
