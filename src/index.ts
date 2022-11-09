import { Events, GatewayIntentBits } from "discord.js";
import { token } from "./config.json";
import { DcClient } from "./utilities/dc-client";

const client = new DcClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Discord bot on ready
client.once(Events.ClientReady, async () => {
  console.log(`Discord Bot "${client.user?.tag}" is ready!`);
  client.clearPortal();
  await client.notifyStream();
  setInterval(async () => {
    // Every 1 minutes detect once
    await client.notifyStream();
  }, 1 * 60 * 1000);
});

// Member get in
client.on(Events.GuildMemberAdd, (member) => {
  client.guildMemberAdd(member);
});

// Member get out
client.on(Events.GuildMemberRemove, (member) => {
  client.guildMemberRemove(member);
});

// Voice portal
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  await client.portVoiceChannel(oldState, newState);
});

client.login(token);
