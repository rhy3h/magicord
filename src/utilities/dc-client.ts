import {
  ChannelType,
  Client,
  ClientOptions,
  Collection,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  VoiceState,
} from "discord.js";
import { TwitchLive, TwitchStatus } from "../twitch/index";
import { client_id, client_secret } from "../twitch/config.json";
import * as channels from "../channel.json";
import * as history from "./history.json";
import fs from "fs/promises";

interface IChannel {
  memberAdd: string;
  memberRemove: string;
  liveMessage: string;
  voiceCategory: string;
  voicePortal: string;
  streamName: string;
}

class DcClient extends Client {
  private portals: Collection<string, boolean>;
  private channelDatas: Collection<string, IChannel>;
  private hisotryDatas: Collection<string, Array<string>>;
  private twitchLive: TwitchLive;

  constructor(options: ClientOptions) {
    super(options);

    this.portals = new Collection();
    this.channelDatas = new Collection();
    this.hisotryDatas = new Collection();
    this.twitchLive = new TwitchLive(client_id, client_secret);

    this.getChannelFromJson();
    this.getHistoryFromJson();
  }

  private getChannelFromJson() {
    Object.entries(channels).forEach(([key, data], index) => {
      if (key == "default") {
        return;
      }
      this.channelDatas.set(key, data);
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
}

export { DcClient };
