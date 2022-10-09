import { Client, GatewayIntentBits, Partials, ChannelType } from "discord.js";
import * as fs from "fs";
import { getStreamNotify } from "./utils/twitch/live.js";

let configJson = fs.readFileSync("./config.json");
let config = JSON.parse(configJson);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction],
});

// Discord bot on ready
client.on("ready", () => {
  console.log(`機器人 "${client.user.tag}" 運行了!`);

  // Find voice portal id
  let portalVoiceChannelID = client.channels.cache.find(
    (r) => r.name === config.Voice.Portal
  )?.id;
  // Find under teleport's voice channel
  let channels = client.channels.cache.filter(
    (c) =>
      c.name != config.Voice.Portal &&
      c.parentId == portalVoiceChannelID &&
      c.type == ChannelType.GuildVoice
  );

  channels.forEach(async (channel) => {
    // TODO: Judge voice channel have someone in
    // Delete channel
    await channel?.delete();
  });

  let detectStreamNotify = async () => {
    let streamNotify = await getStreamNotify();
    if (!streamNotify) {
      return;
    }

    client.channels.cache
      .find((r) => r.name === config.Live.Message)
      ?.send(
        `https://www.twitch.tv/${streamNotify.user_login} ${streamNotify.user_name}開台了!`
      );
  };
  // When bot is online detect once
  detectStreamNotify();
  // Then detect live every 1 mins
  setInterval(async () => {
    await detectStreamNotify();
  }, 1 * 60 * 1000);
});

// Member get in
client.on("guildMemberAdd", (member) => {
  // Send message
  client.channels.cache
    .find((r) => r.name === config.Member.Add)
    ?.send(`<@${member.user.id}> Welcome`);
});

// Member leave out
client.on("guildMemberRemove", (member) => {
  // Send message
  client.channels.cache
    .find((r) => r.name === config.Member.Remove)
    ?.send(`<@${member.user.id}> Left`);
});

// This function need to give an addictional empty role, 
// otherwise will have permission error, not sure why
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.id == config.Role.Message) {
    // Find role
    const role = reaction.message.guild.roles.cache?.find(
      (r) => r.name === config.Role.GiveRole
    );
    // Find member
    const member = reaction.message.guild.members.cache?.find(
      (member) => member.id === user.id
    );
    // Give role
    try {
      member.roles?.add(role);
    } catch (err) {
      // Might have permission error
      console.error(err);
    }
  }
});

// This function need to give an addictional empty role, 
// otherwise will have permission error, not sure why
client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.id == config.Role.Message) {
    // Find role
    const role = reaction.message.guild.roles.cache?.find(
      (r) => r.name === config.Role.GiveRole
    );
    // Find member
    const member = reaction.message.guild.members.cache?.find(
      (member) => member.id === user.id
    );
    // Remove role
    try {
      member.roles?.remove(role);
    } catch (err) {
      // Might have permission error
      console.error(err);
    }
  }
});

// Voice channl portal
var createdVoicePortal = {};
client.on("voiceStateUpdate", async (oldState, newState) => {
  // Live own temporary channel
  if (oldState.channel && createdVoicePortal[oldState.member.id]) {
    // Delete channel
    await oldState.channel?.delete();
    // Delete record
    delete createdVoicePortal[oldState.member.id];
  }
  // Get in voice channel portal
  if (newState.channel && newState.channel.name == config.Voice.Portal) {
    // User name
    let username = newState.member.user.username;
    // User ID
    let discriminator = newState.member.user.discriminator;
    // New channel name
    let newChannelName = `${username}#${discriminator}`;
    // New temporary channel
    let tempVoiceChannel = await newState.guild.channels?.create({
      parent: newState?.channel?.parent,
      type: ChannelType.GuildVoice,
      name: newChannelName,
    });
    // Move member to temporary channel
    await newState.member.voice?.setChannel(tempVoiceChannel);
    // Record it
    createdVoicePortal[newState.member.user.id] = true;
  }
});

client.login(config.Discord.Token);
