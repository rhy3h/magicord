import {
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  Collection,
  GuildMember,
  ModalSubmitInteraction,
  PartialGuildMember,
  SlashCommandBuilder,
  TextChannel,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import fs from "fs/promises";
import path from "path";

import { SlashCommand } from "../components/SlashCommand";
import { TwitchLive, TwitchStatus } from "../twitch/index";
import { TwitchNotifyEmbed } from "../components/TwitchNotifyEmbed";

import { client_id, client_secret } from "../twitch/config.json";
import * as channels from "../channel.json";
import * as history from "./history.json";

interface IChannel {
  memberAdd: string;
  memberRemove: string;
  memberCount: string;
  voicePortal: string;
  stream: {
    channelID: string;
    name: string;
  };
  role: {
    roleID: Array<string>;
    message: string;
  };
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
        voicePortal: "",
        memberCount: "",
        stream: {
          channelID: "",
          name: "",
        },
        role: {
          roleID: [],
          message: "",
        },
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
      if (channelData?.memberCount) {
        const channel = guild.channels.cache.get(channelData?.memberCount);
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
      this.hisotryDatas.set(key, <string[]>data);
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

  public async clearPortal() {
    const promises: Promise<VoiceChannel>[] = [];

    this.channelDatas.forEach((channelData, guildId) => {
      const guild = this.guilds.cache.get(guildId);
      const voicePortal = guild?.channels.cache.get(channelData.voicePortal);

      const portalChannels = guild?.channels.cache.filter((c) => {
        return (
          c.type == ChannelType.GuildVoice &&
          c.parentId == voicePortal?.parentId &&
          c.id != channelData.voicePortal
        );
      });
      portalChannels?.forEach(async (portalChannel) => {
        promises.push((<VoiceChannel>portalChannel).delete());
      });
    });

    await Promise.all(promises);
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
      const voicePortal = await newState.guild.channels
        ?.create({
          parent: newState?.channel?.parent,
          type: ChannelType.GuildVoice,
          name: portalName,
        })
        .catch(() => {});
      if (!voicePortal) {
        return;
      }
      // Move member to temporary channel
      await newState.member.voice?.setChannel(voicePortal).catch(() => {});
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
            await this.twitchLive.getStreamNotify(channel.stream.name)
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
          const channelID = channel.stream.channelID;
          const streamNotifyChannel = <TextChannel>(
            server?.channels.cache.get(channelID)
          );
          const twitchNotifyMessage = new TwitchNotifyEmbed(streamStatus);
          streamNotifyChannel
            ?.send({
              embeds: [twitchNotifyMessage.embed],
              components: [twitchNotifyMessage.row],
            })
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

  public async executeChatInputCommand(
    interaction: ChatInputCommandInteraction
  ) {
    if (!interaction.guildId) {
      return;
    }
    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);
    const slashCommand = <SlashCommand>(
      this.commands.get(interaction.commandName)
    );
    switch (interaction.commandName) {
      case "setting": {
        await slashCommand?.execute(interaction, channelData);

        this.channelDatas.set(interaction.guildId, channelData);
        const channelJson = JSON.stringify(
          Object.fromEntries(this.channelDatas)
        );
        fs.writeFile("./src/channel.json", channelJson);
        break;
      }
      case "test": {
        slashCommand?.execute(interaction, channelData);
        break;
      }
    }
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
          interaction.client.channels.cache.get(channelData.stream.channelID)
        );
        await streamNotifyChannel?.send(`Stream notify test`).catch(() => {});
        break;
      }
      case "update_member_button": {
        const updateMemberChannel = <VoiceChannel>(
          interaction.client.channels.cache.get(channelData.memberCount)
        );
        await updateMemberChannel?.send(`Update Member test`).catch(() => {});
        break;
      }
      default: {
        if (interaction.customId.split("_")[0] == "role") {
          const roleID = interaction.customId.split("_")[1];
          const channelData = <IChannel>(
            this.channelDatas.get(interaction.guildId)
          );
          if (channelData.role.roleID.indexOf(roleID) > -1) {
            if (!this.channelDatas.get(interaction.guildId)?.role) {
              break;
            }
            const member = await interaction.guild?.members.fetch(
              interaction.user.id
            );
            await member?.roles.add(roleID).catch((err) => {
              console.log(`[ERROR]: ${err.message}`);
            });
          }
        } else {
          console.log(`[WARNING]: Unknow button id '${interaction.customId}'`);
        }
        break;
      }
    }

    await interaction.deleteReply();
  }
  public async executeModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply();

    if (!interaction.guildId) {
      return;
    }

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);

    const messageInput = interaction.fields.getTextInputValue("messageInput");
    channelData.role.message = messageInput;

    this.channelDatas.set(interaction.guildId, channelData);
    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);

    await interaction.deleteReply();
  }
}

export { DcClient, IChannel };
