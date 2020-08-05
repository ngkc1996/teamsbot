# TeamsBot

This project involved creating a conversational chatbot using Microsoft Bot Framework. The bot was deployed on Azure Bot Service and distributed on Microsoft Teams. This project was completed during the author's internship at GovTech Government Infrastructure Group, from May to July 2020.

## Key Functionalities

- The aim of the bot is to provide a platform for users to search for and view information.
- Users are able to browse through categories to view FAQs.
- Users are able to use natural language queries to search for answers.
- Responds to user reactions (e.g. liking a message).


<p align="center">Demo of bot functionalities</p>
<p align="center">
    <img width=700 src="./media/demo.gif"/>
</p>

## Prerequisites

- Node.js

## To try the bot

### Try on Azure

Note: You must have a DiamondSG account.

- Navigate to Home > Resource Groups > Teamsbot.
- Select bottestkb-bot (type: Web App Bot).
- Navigate to Bot Management > Test in Web Chat.
- The chatbot is live and can be tested there.

### Try on Bot Framework Emulator (local)

#### Clone and run

Note: You need to ask the author for the necessary credentials in the .env file.

- Clone the repository

    ```bash
    git clone https://github.com/ngkc1996/teamsbot.git
    ```

- Navigate to root of the folder

- Install npm modules

    ```bash
    npm install
    ```

- Run the sample. The sample should be running on `http://localhost:3978`.

    ```bash
    npm start
    ```

#### Download, install and use Bot Framework Emulator

- Install the Bot Framework Emulator version 4.3.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

- Launch Bot Framework Emulator
- Create a new bot configuration
- Enter a Bot URL of `http://localhost:3978/api/messages`
- Enter the Microsoft App ID and password corresponding to the .env file.

## More guides

More guides can be found in the `readmes` folder.

## Disclaimers

- This code uses Microsoft Bot Framework SDK which can be found [here](https://github.com/microsoft/BotBuilder-Samples).