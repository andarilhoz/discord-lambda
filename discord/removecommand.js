require('dotenv').config()
const axios = require('axios').default;

let url = `https://discord.com/api/v8/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands/`

const headers = {
  "Authorization": `Bot ${process.env.BOT_TOKEN}`,
  "Content-Type": "application/json"
}


async function deleteCommand(command_id){
  try{
    let discordRequest = await axios.delete(url + command_id, {
      headers: headers,
    })
    console.log("success")
    console.log(discordRequest.status)
  }catch(error){
    console.log(error.message)
  }
}

deleteCommand("")