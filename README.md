# TeamsBot

To create a conversational bot in Microsoft Teams using Bot Framework.

## Current Functionality

- Authentication with DiamondSG Microsoft account using Azure Active Directory (AD).
- Able to query QnA Maker with user input and retrieve top result from the QnA Maker Database.
- Able to browse question categories and get answers to specific questions.
- Basic greeting message, dialog flow and help commands.
- Responds to user reactions (e.g. liking a message).

## Work in progress

- Additional dialog flow for ease of use and intuitiveness.

## Prerequisites

- Node.js

## To try the bot

### Try on Teams

Note: You must have a DiamondSG account.

- Navigate to Apps > Built for DiamondSG.
- Install TeamsBot Testing.
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
- Enter the Microsoft App ID and password corresponding to the .env file



More guides and instructions to be added soon.
