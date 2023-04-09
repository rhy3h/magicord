import {
  ChannelType,
  Client,
  ClientOptions,
  Collection,
  Guild,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import fs from "fs/promises";

import { TwitchLive, TwitchStatus } from "../twitch/index";
import { TwitchNotifyEmbed } from "../components/TwitchNotifyEmbed";

import { DataBase } from "../database.ts";
import { client_id, client_secret } from "../twitch/config.json";

const portalNameRegex = /^.+-.+#[0-9]+$/;

class DcClient extends Client {
  private database: Collection<string, DB>;
  private hisotryDatas: Collection<string, HistoryDB>;
  private twitchLive: TwitchLive;

  constructor(options: ClientOptions) {
    super(options);

    this.database = new Collection();
    this.hisotryDatas = new Collection();
    this.twitchLive = new TwitchLive(client_id, client_secret);
  }

  public async initDatabase() {
    console.log(`Loading database...`);

    const promises: Array<Promise<boolean>> = [];

    this.guilds.cache.forEach((guild) => {
      promises.push(
        new Promise(async (resolve) => {
          const db = await new DataBase(
            `${process.env.APPDATA}/magicord-db`
          ).select(guild.id);
          this.database.set(guild.id, db);
          resolve(true);
        })
      );
    });

    await Promise.all(promises);

    console.log(`Finished...`);
  }

  public async initHistoryDatabase() {
    console.log(`Loading history database...`);

    const promises: Array<Promise<boolean>> = [];

    this.guilds.cache.forEach((guild) => {
      promises.push(
        new Promise(async (resolve) => {
          try {
            const historyDataBase = await new DataBase(
              `${process.env.APPDATA}/magicord-db/history`
            ).select(guild.id);
            this.hisotryDatas.set(guild.id, historyDataBase);
          } catch (error) {
            this.hisotryDatas.set(guild.id, {
              twitch: [],
            });
          }
          resolve(true);
        })
      );
    });

    await Promise.all(promises);

    console.log(`Finished...`);
  }

  public async updateMemberCount(guild: Guild) {
    return new Promise<boolean>(async (resolve) => {
      const data = this.database.get(guild.id);
      if (!data) {
        resolve(false);
        return;
      }

      if (!data.member_count) {
        resolve(false);
        return;
      }

      const memberCountChannel = <TextChannel>(
        guild.channels.cache.get(data.member_count)
      );
      if (!memberCountChannel) {
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

    await Promise.all(promises);
  }

  public guildMemberAdd(member: GuildMember) {
    const guildId = member.guild.id;

    const data = this.database.get(guildId);
    if (!data) {
      return;
    }

    const channel = member.client.channels.cache.get(
      data.guild_member_add.id
    ) as TextChannel;
    if (!channel) {
      return;
    }

    channel
      .send(`<@${member.user.id}> ${data.guild_member_add.message}`)
      .catch(() => {});
  }

  public guildMemberRemove(member: GuildMember | PartialGuildMember) {
    const guildId = member.guild.id;

    const data = this.database.get(guildId);
    if (!data) {
      return;
    }

    const channel = member.client.channels.cache.get(
      data.guild_member_remove.id
    ) as TextChannel;
    if (!channel) {
      return;
    }

    channel
      .send(`<@${member.user.id}> ${data.guild_member_remove.message}`)
      .catch(() => {});
  }

  public async clearPortal() {
    const promises: Promise<VoiceChannel>[] = [];
    this.guilds.cache.forEach(async (guild) => {
      const portalChannels = guild.channels.cache.filter((f) => {
        return f.name.match(portalNameRegex);
      });

      portalChannels.forEach(async (portalChannel) => {
        promises.push((<VoiceChannel>portalChannel).delete());
      });
    });

    await Promise.all(promises);
  }

  public async portVoiceChannel(oldState: VoiceState, newState: VoiceState) {
    if (oldState.member && oldState.channel?.name.match(portalNameRegex)) {
      await oldState.channel?.delete();
    }

    if (!newState.channel) {
      return;
    }

    if (!newState.member) {
      return;
    }

    const guildId = newState.channel.guildId;
    if (!guildId) {
      return;
    }

    const data = this.database.get(guildId);
    if (!data) {
      return;
    }

    const channelName = newState.channel.name;
    if (channelName != data.temporary_channels.name) {
      return;
    }

    const user = newState.member.user;
    if (!user) {
      return;
    }

    // New voice channel name
    const portalName = `${channelName}-${user.username}#${user.discriminator}`;
    const voicePortal = await newState.guild.channels
      .create({
        parent: newState?.channel?.parent,
        type: ChannelType.GuildVoice,
        name: portalName,
      })
      .catch(() => {});
    if (!voicePortal) {
      return;
    }

    // Move member to temporary channel
    await newState.member.voice.setChannel(voicePortal).catch(() => {});
  }

  public async notifyStream() {
    const promises: Array<Promise<boolean>> = [];

    this.guilds.cache.forEach(async (guild) => {
      promises.push(
        new Promise(async (resolve) => {
          const data = this.database.get(guild.id);
          if (!data) {
            resolve(true);
            return;
          }
          if (!data.social_alert.twitch.name) {
            resolve(true);
            return;
          }

          let streamStatus = <TwitchStatus>(
            await this.twitchLive.getStreamNotify(data.social_alert.twitch.name)
          );
          if (!streamStatus) {
            resolve(true);
            return;
          }

          const hisotryData = this.hisotryDatas.get(guild.id);
          if (!hisotryData) {
            resolve(true);
            return;
          }
          const notifyHistory = hisotryData.twitch.find(
            (f) => f == streamStatus.started_at
          );
          if (notifyHistory) {
            resolve(true);
            return;
          }
          hisotryData.twitch.push(streamStatus.started_at);

          const streamNotifyChannel = <TextChannel>(
            guild.channels.cache.get(data.social_alert.twitch.id)
          );
          if (!streamNotifyChannel) {
            resolve(true);
            return;
          }

          const twitchNotifyMessage = new TwitchNotifyEmbed(streamStatus);
          streamNotifyChannel
            .send({
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
        this.hisotryDatas.each((historyData, key) => {
          new DataBase(`${process.env.APPDATA}/magicord-db/history`).update(
            key,
            historyData
          );
        });
      });
  }
}

export { DcClient };
