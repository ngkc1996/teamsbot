# TeamsBot

This project involved creating a conversational chatbot using Microsoft Bot Framework. The bot was deployed on Azure Bot Service and distributed on Microsoft Teams. This project was completed during the author's internship at GovTech, from May to July 2020.

## Key Functionalities

- Users are able to browse  


- Authentication with DiamondSG Microsoft account using Azure Active Directory.
- Able to query QnA Maker with user input and retrieve top result from the QnA Maker Database.
- Basic greeting message, dialog flow and help commands.
- Responds to user reactions (e.g. liking a message).


<p align="center">Demo</p>
<p align="center">
    <img width=700 src="./media/demo.gif...."/>
</p>

## Work in progress

- Allowing users to logout.
- Developing the "browse" dialog flow which will allow users to browse from a list of FAQs instead of asking their own query.
- Additional dialog flow for ease of use and intuitiveness.

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
- Enter the Microsoft App ID and password corresponding to the .env file



More guides and instructions to be added soon.


## Disclaimers

- This code uses Microsoft Bot Framework SDK which can be found [here](https://github.com/microsoft/BotBuilder-Samples).