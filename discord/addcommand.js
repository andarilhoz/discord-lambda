require('dotenv').config()
const axios = require('axios').default;

let url = `https://discord.com/api/v8/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`

const headers = {
  "Authorization": `Bot ${process.env.BOT_TOKEN}`,
  "Content-Type": "application/json"
}

let commands = [
  {
    "name": "foo",
    "type": 1,
    "description": "returns bar",
  },
  {
    "name": "startserver",
    "type": 1,
    "description": "Initialize the server",
  },
  {
    "name": "stopserver",
    "type": 1,
    "description": "Stop the server",
  },
  {
    "name": "status",
    "type": 1,
    "description": "Gets the status of Server",
  }
];

async function callDiscordAPIWithCommand(command){
  try{
    let discordRequest = await axios.post(url, JSON.stringify(command), {
      headers: headers,
    })
    console.log("success")
    console.log(discordRequest.status)
  }catch(error){
    console.log(error.message)
  }
}

Promise.all(commands.map(command => callDiscordAPIWithCommand(command)))
  .then(() => console.log('All commands sent'))
  .catch(error => console.log('Error sending commands: ', error.message));
