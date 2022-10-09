import { Client, GatewayIntentBits, Partials, ChannelType } from "discord.js";
import * as fs from "fs";

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

// 機器人運行了
client.on("ready", () => {
  console.log(`機器人 "${client.user.tag}" 運行了!`);

  let portalVoiceChannelID = client.channels.cache.find(
    (r) => r.name === "語音頻道"
  )?.id;
  // 找尋傳送門底下的語音頻道
  let channels = client.channels.cache.filter(
    (c) =>
      c.name != config.Voice.Portal &&
      c.parentId == portalVoiceChannelID &&
      c.type == ChannelType.GuildVoice
  );

  channels.forEach(async (channel) => {
    // TODO: 判別語音頻道裡有沒有人
    // 刪除頻道
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
  // 機器人上線時先偵測一次
  detectStreamNotify();
  // 固定每 1 分鐘偵測開台
  setInterval(async () => {
    await detectStreamNotify();
  }, 1 * 60 * 1000);
});

// 成員進來
client.on("guildMemberAdd", (member) => {
  // 傳送訊息
  client.channels.cache
    .find((r) => r.name === config.Member.Add)
    ?.send(`<@${member.user.id}> Welcome`);
});

// 成員離開
client.on("guildMemberRemove", (member) => {
  // 傳送訊息
  client.channels.cache
    .find((r) => r.name === config.Member.Remove)
    ?.send(`<@${member.user.id}> Left`);
});

// 這個功能要額外給一個空的身份組, 不然會有權限問題, 不確定原因為何
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.id == config.Role.Message) {
    // 找到身份組
    const role = reaction.message.guild.roles.cache?.find(
      (r) => r.name === config.Role.GiveRole
    );
    // 找到成員
    const member = reaction.message.guild.members.cache?.find(
      (member) => member.id === user.id
    );
    // 給予身份組
    try {
      member.roles?.add(role);
    } catch (err) {
      // 有可能遇到權限問題
      console.error(err);
    }
  }
});

// 這個功能要額外給一個空的身份組, 不然會有權限問題, 不確定原因為何
client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.id == config.Role.Message) {
    // 找到身份組
    const role = reaction.message.guild.roles.cache?.find(
      (r) => r.name === config.Role.GiveRole
    );
    // 找到成員
    const member = reaction.message.guild.members.cache?.find(
      (member) => member.id === user.id
    );
    // 移除身份組
    try {
      member.roles?.remove(role);
    } catch (err) {
      // 有可能遇到權限問題
      console.error(err);
    }
  }
});

// 傳送門
var createdVoicePortal = {};
client.on("voiceStateUpdate", async (oldState, newState) => {
  // 離開自己的暫時頻道
  if (oldState.channel && createdVoicePortal[oldState.member.id]) {
    // 刪除頻道
    await oldState.channel?.delete();
    // 刪除記錄
    delete createdVoicePortal[oldState.member.id];
  }
  // 進到傳送門
  if (newState.channel && newState.channel.name == config.Voice.Portal) {
    // 使用者名稱
    let username = newState.member.user.username;
    // 使用者ID
    let discriminator = newState.member.user.discriminator;
    // 新的頻道名稱
    let newChannelName = `${username}#${discriminator}`;
    // 新的暫時頻道
    let tempVoiceChannel = await newState.guild.channels?.create({
      parent: newState?.channel?.parent,
      type: ChannelType.GuildVoice,
      name: newChannelName,
    });
    // 連線到新的暫時頻道
    await newState.member.voice?.setChannel(tempVoiceChannel);
    // 記錄起來
    createdVoicePortal[newState.member.user.id] = true;
  }
});

client.login(config.Discord.Token);
