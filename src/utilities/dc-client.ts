import {
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  Collection,
  Guild,
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

import { IWeather, WeatherAPI } from "../weather";

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
  weather: {
    morning: IWeather;
    afternoon: IWeather;
    night: IWeather;
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
        weather: {
          morning: {
            temperature: "",
            pop: "",
          },
          afternoon: {
            temperature: "",
            pop: "",
          },
          night: { temperature: "", pop: "" },
        },
      };
      this.channelDatas.set(id, channelData);
    });

    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);
  }

  public initHistoryData() {
    this.guilds.cache.forEach((guild) => {
      const { id } = guild;
      if (this.hisotryDatas.get(id)) {
        return;
      }
      this.hisotryDatas.set(id, []);
    });

    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);
  }

  public async updateMemberCount(guild: Guild) {
    return new Promise<boolean>(async (resolve) => {
      const memberCountChnnelID = this.channelDatas.get(guild.id)?.memberCount;
      if (!memberCountChnnelID) {
        console.log(`"${guild.name}": Please set update member count channel`);
        resolve(false);
        return;
      }

      const memberCountChannel = <TextChannel>(
        guild.channels.cache.get(memberCountChnnelID)
      );
      if (!memberCountChannel) {
        console.log(`"${guild.name}": Cannot find member count channel`);
        resolve(false);
        return;
      }

      await memberCountChannel.setName(`｜總人數：${guild.memberCount}｜`);
      resolve(true);
      return;
    });
  }

  public async updateMember() {
    const promises: Promise<boolean>[] = [];

    this.guilds.cache.forEach((guild) => {
      promises.push(this.updateMemberCount(guild));
    });

    let result = await Promise.all(promises);
    if (result.findIndex((r) => r == false) > -1) {
      console.log();
    }
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

    this.updateMemberCount(member.guild);
  }

  public guildMemberRemove(member: GuildMember | PartialGuildMember) {
    const channelID =
      this.channelDatas.get(member.guild.id)?.memberRemove || "";
    const memberRemoveChannel = <TextChannel>(
      member.client.channels.cache.get(channelID)
    );
    memberRemoveChannel?.send(`<@${member.user.id}> Left`).catch(() => {});

    this.updateMemberCount(member.guild);
  }

  private async updateWeaterPrediction(guild: Guild, weather: Array<IWeather>) {
    const timeStamp = ["早", "中", "晚"];
    const temperatureChannelID: Array<string> = [];
    const morningTemperatureChannelID =
      this.channelDatas.get(guild.id)?.weather.morning.temperature || "";
    const afternoonTemperatureChannelID =
      this.channelDatas.get(guild.id)?.weather.afternoon.temperature || "";
    const nightTemperatureChannelID =
      this.channelDatas.get(guild.id)?.weather.night.temperature || "";
    temperatureChannelID.push(
      morningTemperatureChannelID,
      afternoonTemperatureChannelID,
      nightTemperatureChannelID
    );

    const rainChannelID: Array<string> = [];
    const morningRainChannelID =
      this.channelDatas.get(guild.id)?.weather.morning.pop || "";
    const afternoonRainChannelID =
      this.channelDatas.get(guild.id)?.weather.afternoon.pop || "";
    const nightRainChannelID =
      this.channelDatas.get(guild.id)?.weather.night.pop || "";
    rainChannelID.push(
      morningRainChannelID,
      afternoonRainChannelID,
      nightRainChannelID
    );

    const promises: Promise<boolean>[] = [];
    for (let i = 0; i < timeStamp.length; i++) {
      const promise = new Promise<boolean>(async (resolve) => {
        const temperatureChannel = <TextChannel>(
          guild.channels.cache.get(temperatureChannelID[i])
        );
        const rainChannel = <TextChannel>(
          guild.channels.cache.get(rainChannelID[i])
        );

        if (!temperatureChannel || !rainChannel) {
          console.log(
            `"${guild.name}": Cannot find "${timeStamp[i]}" temperature or rain channel`
          );
          resolve(false);
          return;
        }

        await temperatureChannel.setName(
          `${timeStamp[i]}：${weather[i].temperature}`
        );
        await rainChannel.setName(`${weather[i].pop}`);
      });
      promises.push(promise);
    }

    return Promise.all(promises);
  }

  public async updateWeather() {
    // let weather = await new WeatherAPI(weatherApiKey).getTaipeiWeather();
    // if (!weather) {
    //   return;
    // }
    // const promises: Promise<boolean[]>[] = [];
    // this.guilds.cache.forEach((guild) => {
    //   promises.push(this.updateWeaterPrediction(guild, weather));
    // });
    // let result = await Promise.all(promises);
    // console.log();
  }

  public async clearPortal() {
    const promises: Promise<VoiceChannel>[] = [];

    this.channelDatas.forEach((channelData, guildId) => {
      const guild = this.guilds.cache.get(guildId);

      const portalChannels = guild?.channels.cache.filter((c) => {
        return (
          c.type == ChannelType.GuildVoice &&
          c.name != channelData.voicePortal &&
          c.name.split("-")[0] == channelData.voicePortal
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
    const name = newState?.channel?.name;
    if (this.channelDatas.get(guildId)?.voicePortal == name) {
      // No member
      if (!newState.member) {
        return;
      }
      // Name, ID
      const { username, discriminator } = newState?.member?.user;
      // New voice channel name
      const portalName = `${name}-${username}#${discriminator}`;
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
    const newChannelData = await slashCommand?.execute(
      interaction,
      channelData
    );

    if (newChannelData) {
      this.channelDatas.set(interaction.guildId, channelData);
      const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
      fs.writeFile("./src/channel.json", channelJson);
    }
  }

  public async executeButton(interaction: ButtonInteraction) {
    if (!interaction.guildId) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);
    switch (interaction.customId) {
      case "member_add_button": {
        const memberAddChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.memberAdd)
        );
        if (!memberAddChannel) {
          await interaction.editReply({
            content: `Please set member add channel first`,
          });
          return;
        }
        await memberAddChannel
          .send(`Member add test`)
          .then(async () => {
            await interaction.editReply({ content: `Member add test success` });
          })
          .catch(async (err) => {
            await interaction.editReply({ content: `${err.message}` });
          });

        break;
      }
      case "member_remove_button": {
        const memberRemoveChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.memberRemove)
        );
        if (!memberRemoveChannel) {
          await interaction.editReply({
            content: `Please set member remove channel first`,
          });
          return;
        }
        await memberRemoveChannel
          .send(`Member remove test`)
          .then(async () => {
            await interaction.editReply({
              content: `Member remove test success`,
            });
          })
          .catch(async (err) => {
            await interaction.editReply({ content: `${err.message}` });
          });
        break;
      }
      case "stream_notify_button": {
        const streamNotifyChannel = <TextChannel>(
          interaction.client.channels.cache.get(channelData.stream.channelID)
        );
        if (!streamNotifyChannel) {
          await interaction.editReply({
            content: `Please set stream notify channel first`,
          });
          return;
        }
        await streamNotifyChannel
          .send(`Stream notify test`)
          .then(async () => {
            await interaction.editReply({
              content: `Stream notify test success`,
            });
          })
          .catch(async (err) => {
            await interaction.editReply({ content: `${err.message}` });
          });
        break;
      }
      case "update_member_button": {
        const updateMemberChannel = <VoiceChannel>(
          interaction.client.channels.cache.get(channelData.memberCount)
        );
        if (!updateMemberChannel) {
          await interaction.editReply({
            content: `Please set update member channel first`,
          });
          return;
        }
        await updateMemberChannel
          .send(`Update Member test`)
          .then(async () => {
            await interaction.editReply({
              content: `Update Member test success`,
            });
          })
          .catch(async (err) => {
            await interaction.editReply({ content: `${err.message}` });
          });
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
            await member?.roles
              .add(roleID)
              .then(async () => {
                await interaction.editReply({
                  content: `Form add role success`,
                });
              })
              .catch(async (err) => {
                await interaction.editReply({ content: `${err.message}` });
              });
          }
        } else {
          console.log(`[WARNING]: Unknow button id '${interaction.customId}'`);
          await interaction.deleteReply();
        }
        break;
      }
    }
  }
  public async executeModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guildId) {
      return;
    }

    const channelData = <IChannel>this.channelDatas.get(interaction.guildId);

    const messageInput = interaction.fields.getTextInputValue("messageInput");
    channelData.role.message = messageInput;

    this.channelDatas.set(interaction.guildId, channelData);
    const channelJson = JSON.stringify(Object.fromEntries(this.channelDatas));
    fs.writeFile("./src/channel.json", channelJson);

    await interaction.editReply({
      content: `Set role message success`,
    });
  }
}

export { DcClient, IChannel };
