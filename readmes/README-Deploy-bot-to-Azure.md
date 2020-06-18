# Deploying your bot to Azure

This guide provides a walkthough for deploying/publishing changes to an Azure Web App Bot.

## Prerequisites

- A current version of a Web App bot on Azure. If you do not, refer to the Azure Setup readme.
- A new version of the bot you have developed.

## Deploying your bot

Note: This guide is based on the offical documentation [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0&tabs=javascript).

### Preparing your bot

- Your bot should have been tested for bugs and functionality locally on Bot Framework Emulator.

### Login to Azure

- Login to Azure and set the default subscription to use.

	```bash
	az login
	```

	```bash
    az account set --subscription "<azure-subscription>"
    ```

### Prepare code for deployment

- Generate the `web.config` file in your project folder. If you already have a `web.config` file, make sure to delete it before running the command.

	```bash
	az bot prepare-deploy --code-dir "." --lang Javascript
	```

- Zip up the code directory manually. All required dependencies have to be in the zip file as well. Label the zip file `deployment.zip`.

### Deploy code to Azure

- Deploy your code. A succesful uploading process will return with `status code 202` and will take a few minutes to complete.

	```bash
	az webapp deployment source config-zip --resource-group "<resource-group-name>" --name "<name-of-web-app>" --src <deployment-zip-path>
	```

## Troubleshooting

- A useful guide for troubleshooting can be found [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-troubleshoot-bot-configuration?view=azure-bot-service-4.0).
