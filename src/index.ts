import {
  Events,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} from "discord.js";
import { DcClient } from "./utilities/dc-client";
import { config } from "dotenv";

config();

const client = new DcClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
});

// Discord bot on ready
client.once(Events.ClientReady, async () => {
  await client.fetchDatabase();
  await client.initHistoryDatabase();
  await client.updateGuildsMemberCount();
  await client.clearPortal();
  setInterval(async () => {
    // Every 1 minutes detect once
    await client.notifyStream();
  }, 1 * 60 * 1000);

  console.log(`Discord Bot "${client.user?.tag}" is ready!`);
});

// Member get in
client.on(Events.GuildMemberAdd, (member) => {
  client.guildMemberAdd(member);
});

// Member get out
client.on(Events.GuildMemberRemove, (member) => {
  client.guildMemberRemove(member);
});

// Message Reaction Add
client.on(Events.MessageReactionAdd, (emoji, user) => {
  client.messageReactionAdd(emoji, user);
});

// Message Reaction Remove
client.on(Events.MessageReactionRemove, (emoji, user) => {
  client.messageReactionRemove(emoji, user);
});

// Voice portal
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  await client.portVoiceChannel(oldState, newState);
});

// Commands
client.on(Events.InteractionCreate, async (interaction) => {
  const memberPermision = interaction.memberPermissions?.has(
    PermissionsBitField.Flags.Administrator
  );
  if (!memberPermision) {
    return;
  }
});

client.login(process.env.MAGICORD_ACCESS_TOKEN);
