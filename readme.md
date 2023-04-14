# Software Automatic Mouth Bot (SAM)  
  
SAM (Software Automatic Mouth) is a Telegram bot built using JavaScript and Telegraf that can convert any text sent to it into an audio file.  
  
## Commands  
  
The bot supports the following commands:  
  
- `/start`: Sends a greeting message along with an audio introduction about the bot.  
- `/help`: Provides instructions on how to get the audio output and change the current voice profile.  
- `/show_current_profile`: Displays the current voice profile along with the Modern CMU and Sing mode settings.  
- `/show_all_profiles`: Lists all available voice profiles.  
- `/show_faith_profiles`: Sends an image of voice profiles from the game Faith.  
- `/set_profile_by_id ID`: Sets the current voice profile by ID (a number from 0 to 18) and responds with a confirmation message.  
- `/voice long (or not) text`: Converts the given text into an audio file and sends it back to the user.  
- `/ping`: Checks if the bot is alive and responds accordingly.  
  
By default, the bot uses The Carnegie Mellon University Pronouncing Dictionary to ensure better pronunciation.  
  
## Usage  
  
To use the bot, simply send one of the above commands in a chat with the bot. For example, to get an audio file for the text "Hello, world!", type `/voice Hello, world!` in the chat with the bot.  
  
## Installation  
  
To install and run the bot on your local machine, follow these steps:  
  
1) Clone the repository:  
`git clone https://github.com/StasRomanov/tg-bot-sam.git`
  
2) Install the dependencies:  
`cd ./tg-bot-sam && npm i`

3) Create a `token.txt` file in the root directory and add your Telegram bot token to it.
  
4) Start the bot:`npm start`  
  
  
Make sure you have Node.js and npm installed on your machine before following the above steps.  
  
## Special thanks

1) [Christian Schiffler](https://github.com/discordier) for porting sam to js.
2) [Telegraf Framework Contributors](https://github.com/telegraf/telegraf/graphs/contributors) for creating [Telegraf](https://github.com/telegraf).
3) [reticivis](https://github.com/HexCodeFFF) for adding modern CMU to SAM.

## License  
  
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.