import {
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  Collection,
  GuildMember,
  PartialGuildMember,
  SelectMenuInteraction,
  SlashCommandBuilder,
  TextChannel,
  VoiceState,
} from "discord.js";
import fs from "fs/promises";
import path from "path";

import { SlashCommand } from "../components/SlashCommand";
import { Setting } from "../components/Setting";
import { TwitchLive, TwitchStatus } from "../twitch/index";

import { client_id, client_secret } from "../twitch/config.json";
import * as channels from "../channel.json";
import * as history from "./history.json";

interface IChannel {
  memberAdd: string;
  memberRemove: string;
  liveMessage: string;
  voiceCategory: string;
  voicePortal: string;
  updateMember: string;
  streamName: string;
}

class DcClient extends Client {
  public commands: Collection<string, SlashCommandBuilder>;
  private portals: Collection<string, boolean>;
  private channelDatas: Collection<string, IChannel>;
  private hisotryDatas: Collection<string, Array<string>>;
  private twitchLive: TwitchLive;

  constructor(options: ClientOptions) {
    super(options);

    this.commands = new Collection();
    this.portals = new Collection();
    this.channelDatas = new Collection();
    this.hisotryDatas = new Collection();
    this.twitchLive = new TwitchLive(client_id, client_secret);

    this.initCommands();

    this.getChannelFromJson();
    this.getHistoryFromJson();
  }

  private async initCommands() {
    const commandsPath = path.join(__dirname, "../commands");
    const commandFiles = (await fs.readdir(commandsPath)).filter((file) =>
      file.endsWith(".ts")
    );

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("name" in command && "execute" in command) {
        this.commands.set(command.name, command);
        console.log(`[SUCCESS] The command '${command.name}' registered`);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
    console.log("");
  }

  public initChannelData() {
    this.guilds.cache.forEach((guild) => {
      const { id } = guild;
      if (this.channelDatas.get(id)) {
        return;
      }
      const channelData: IChannel = {
        memberAdd: "",
        memberRemove: "",
        liveMessage: "",
        voiceCategory: "",
        voicePortal: "",
        updateMember: "",
        streamName: "",
      };
      this.channelDatas.set(id, channelData);
    });

    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);
  }

  public updateMember() {
    this.guilds.cache.forEach((guild) => {
      const { id } = guild;
      if (!this.channelDatas.get(id)) {
        return;
      }
      const channelData = this.channelDatas.get(id);
      if (channelData?.updateMember) {
        const channel = guild.channels.cache.get(channelData?.updateMember);
        channel?.setName(`人數: ${guild.memberCount}`);
      }
    });
  }

  private getChannelFromJson() {
    Object.entries(channels).forEach(([key, data], index) => {
      if (key == "default") {
        return;
      }
      this.channelDatas.set(key, <IChannel>data);
    });
  }

  private getHistoryFromJson() {
    Object.entries(history).forEach(([key, data], index) => {
      if (key == "default") {
        return;
      }
      this.hisotryDatas.set(key, data);
    });
  }

  public guildMemberAdd(member: GuildMember) {
    const channelID = this.channelDatas.get(member.guild.id)?.memberAdd || "";
    const memberAddChannel = <TextChannel>(
      member.client.channels.cache.get(channelID)
    );
    memberAddChannel?.send(`<@${member.user.id}> Welcome`).catch(() => {});
  }

  public guildMemberRemove(member: GuildMember | PartialGuildMember) {
    const channelID =
      this.channelDatas.get(member.guild.id)?.memberRemove || "";
    const memberRemoveChannel = <TextChannel>(
      member.client.channels.cache.get(channelID)
    );
    memberRemoveChannel?.send(`<@${member.user.id}> Left`).catch(() => {});
  }

  public clearPortal() {
    this.channelDatas.forEach((channelData, guildId) => {
      const guild = this.guilds.cache.get(guildId);
      const category = guild?.channels.cache.get(channelData.voiceCategory);
      const portalChannels = guild?.channels.cache.filter((c) => {
        return (
          c.type == ChannelType.GuildVoice &&
          c.parentId == category?.id &&
          c.id != channelData.voicePortal
        );
      });
      // TODO: Promise all
      portalChannels?.forEach(async (portalChannel) => {
        await portalChannel.delete();
      });
    });
  }

  public async portVoiceChannel(oldState: VoiceState, newState: VoiceState) {
    if (oldState.member && this.portals.get(oldState.member.id)) {
      // Delete channel
      await oldState.channel?.delete();
      // Delete record
      this.portals.delete(oldState.member.id);
    }

    if (!newState?.channel?.guildId) {
      // No guildId
      return;
    }

    const guildId = newState?.channel?.guildId;
    const id = newState?.channel?.id;
    if (this.channelDatas.get(guildId)?.voicePortal == id) {
      // No member
      if (!newState.member) {
        return;
      }
      // Name, ID
      const { username, discriminator } = newState?.member?.user;
      // New voice channel name
      const portalName = `${username}#${discriminator}`;
      // Create portal voice channel
      const voicePoral = await newState.guild.channels
        ?.create({
          parent: newState?.channel?.parent,
          type: ChannelType.GuildVoice,
          name: portalName,
        })
        .catch(() => {});
      if (!voicePoral) {
        return;
      }
      // Move member to temporary channel
      await newState.member.voice?.setChannel(voicePoral).catch(() => {});
      // Record it
      this.portals.set(newState.member.user.id, true);
    }
  }

  public async notifyStream() {
    const promises: Array<Promise<boolean>> = [];
    this.channelDatas.forEach(async (channel, guild) => {
      promises.push(
        new Promise(async (resolve, reject) => {
          let streamStatus = <TwitchStatus>(
            await this.twitchLive.getStreamNotify(channel.streamName)
          );
          if (!streamStatus) {
            reject(false);
            return;
          }
          const notifyHistory = this.hisotryDatas
            .get(guild)
            ?.find((date) => date == streamStatus?.started_at);
          if (notifyHistory) {
            return;
          }
          this.hisotryDatas.get(guild)?.push(streamStatus?.started_at);
          const server = this.guilds.cache.get(guild);
          const channelID = channel.liveMessage;
          const liveMessageChannel = <TextChannel>(
            server?.channels.cache.get(channelID)
          );
          // TODO: Embed text, and custom content
          liveMessageChannel
            ?.send(
              `https://www.twitch.tv/${streamStatus.user_login} ${streamStatus.user_name} 開台了!`
            )
            .catch(() => {});
          resolve(true);
        })
      );
    });
    Promise.all(promises)
      .catch(() => {})
      .finally(() => {
        // TODO: Write to firebase, or dbsqlite
        const historyJson = JSON.stringify(
          Object.fromEntries(this.hisotryDatas)
        );
        fs.writeFile("./src/utilities/history.json", historyJson);
      });
  }

  public executeChatInputCommand(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return;
    }

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);
    const slashCommand = <SlashCommand>(
      this.commands.get(interaction.commandName)
    );
    slashCommand?.execute(interaction, channelData);
  }

  public async executeSelectMenu(interaction: SelectMenuInteraction) {
    if (!interaction.guildId) {
      return;
    }

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);
    const value = interaction.values[0];
    switch (interaction.customId) {
      case "member_add": {
        channelData.memberAdd = value;
        break;
      }
      case "member_remove": {
        channelData.memberRemove = value;
        break;
      }
      case "stream_notify": {
        channelData.liveMessage = value;
        break;
      }
    }
    this.channelDatas.set(interaction.guildId, channelData);

    const component = new Setting(interaction, channelData);
    await interaction.update({
      embeds: component.embed,
    });

    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);
  }

  public async executeButton(interaction: ButtonInteraction) {
    if (!interaction.guildId) {
      return;
    }

    await interaction.deferReply();

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);
    switch (interaction.customId) {
      case "member_add_button": {
        const memberAddChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.memberAdd)
        );
        await memberAddChannel?.send(`Member add test`).catch(() => {});
        break;
      }
      case "member_remove_button": {
        const memberRemoveChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.memberRemove)
        );
        await memberRemoveChannel?.send(`Member remove test`).catch(() => {});
        break;
      }
      case "stream_notify_button": {
        const streamNotifyChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.liveMessage)
        );
        await streamNotifyChannel?.send(`Member remove test`).catch(() => {});
        break;
      }
    }

    await interaction.deleteReply();
  }
}

export { DcClient, IChannel };
