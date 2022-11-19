import { Events, GatewayIntentBits, PermissionsBitField } from "discord.js";
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
  client.initChannelData();
  client.updateMember();
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

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    client.executeChatInputCommand(interaction);
  }
  // Select
  if (interaction.isSelectMenu()) {
    client.executeSelectMenu(interaction);
  }
  // Button
  if (interaction.isButton()) {
    await client.executeButton(interaction);
  }
});

client.login(token);
