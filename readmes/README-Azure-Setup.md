# Azure Setup Guide

This guide will walk through the steps needed to create the following Azure Apps and Services:
- QnA Maker
- Web App Bot

## QnA Maker

### Creating a Knowledge Base

- Go to the QnA Maker Portal [here](https://www.qnamaker.ai/).
- Go to Create a Knowledge Base > Create a QnA Service
	- For 'Azure Search location' and 'Website location', select (Asia Pacific) Southeast Asia.
- Upon creation, to change the pricing plan, go to the newly created App Service.
	- App Service Plan > Change App Service Plan
	- Select an existing plan or create a new one.
	- Delete the default App Service Plan, whcih has the same name as your App Service.
- Return to https://www.qnamaker.ai/Create to finish creating your KB.

### Importing

- In the Settings tab under Manage knowledge base, you can import QnA pairs by attaching files.
- Save using "Save and train".

### Editing

- In the Edit tab you can view the QnA pairs, categorised by source.
- You can manually add questions, alternative phrasing, follow-up prompts, etc.
- Save using "Save and train".

### Testing

- The Test tab allows you to test queries and inspect the confidence scores.

### Publish

- When ready, the Publish tab allows you to publish the Knowledge Base to your QnA Maker Service to use in Azure Apps and Bots.
- These changes take place immediately.

## Connecting the QnA Maker Knowledge Base to your bot

### Create a new bot

- Go to the QnA Maker Portal [here](https://www.qnamaker.ai/).
- In the Publish tab, publish your knowledge base.
- Select Create Bot.

### Connect to existing bot

- Go to the QnA Maker Portal [here](https://www.qnamaker.ai/).
- In the Publish tab, you should see the text box at the bottom with sample HTTP request to call your Knowledgebase.
- If you cannot see it, you have to publish your knowledge base first.
- Copy the following values to your notes:
	- `QnAKnowledgebaseId`: On the POST line, the string between `/knowledgebases` and `/generateAnswer`
	- `QnAEndpointHostName`: On the Host line, the URL `<your-kb-name>.azurewebsites.net`
	- `QnAAuthKey`: On the Authorization line, the string after `EndpointKey`
- Go to the Web App Bot page in the Azure portal.
- Under App Service Settings > Configuration, fill in the 3 values.

If you are planning to use Bot Framework Emulator locally, you need to update your .env file as well.
