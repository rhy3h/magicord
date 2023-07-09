import {
  ChannelType,
  Client,
  ClientOptions,
  Collection,
  Guild,
  GuildMember,
  MessageReaction,
  PartialGuildMember,
  PartialMessageReaction,
  PartialUser,
  Snowflake,
  TextChannel,
  User,
  VoiceChannel,
  VoiceState,
} from "discord.js";

import { TwitchLive, TwitchStatus } from "../twitch/index";
import { TwitchNotifyEmbed } from "../components/TwitchNotifyEmbed";

import { DataBase } from "../database.ts";
import axios from "axios";

const portalNameRegex = /^.+-#.+$/;

class DcClient extends Client {
  private database: Collection<string, Guilds>;
  private hisotryDatas: Collection<string, HistoryDB>;
  private twitchLive: TwitchLive;

  constructor(options: ClientOptions) {
    super(options);

    this.database = new Collection();
    this.hisotryDatas = new Collection();
    this.twitchLive = new TwitchLive(
      process.env.TWITCH_CLIENT_ID as string,
      process.env.TWITCH_CLIENT_SECRET as string
    );
  }

  public async fetchDatabase() {
    console.log(`Fetching data from Mongodb...`);

    const promises: Array<Promise<boolean>> = [];

    this.guilds.cache.forEach((guild) => {
      promises.push(
        new Promise(async (resolve) => {
          await axios
            .get(
              `${process.env.NEXT_PUBLIC_MAGICORD_URL}/api/database/${guild.id}`
            )
            .then((result) => {
              this.database.set(guild.id, result.data);
            })
            .catch((error) => {
              console.log(error);
            });
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
              `${process.env.APPDATA}/magicord/history`
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

      if (!data.member_count.channel_id) {
        resolve(false);
        return;
      }

      const memberCountChannel = <TextChannel>(
        guild.channels.cache.get(data.member_count.channel_id)
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

  public async updateGuildsMemberCount() {
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
      data.guild_member_add.channel_id
    ) as TextChannel;
    if (!channel) {
      return;
    }

    channel
      .send(`<@${member.user.id}> ${data.guild_member_add.message}`)
      .catch((error) => {
        console.log(error);
      });
  }

  public guildMemberRemove(member: GuildMember | PartialGuildMember) {
    const guildId = member.guild.id;

    const data = this.database.get(guildId);
    if (!data) {
      return;
    }

    const channel = member.client.channels.cache.get(
      data.guild_member_remove.channel_id
    ) as TextChannel;
    if (!channel) {
      return;
    }

    channel
      .send(`<@${member.user.id}> ${data.guild_member_remove.message}`)
      .catch((error) => {
        console.log(error);
      });
  }

  public async messageReactionAdd(
    emoji: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    const data = this.database.get(emoji.message.guildId as string);
    if (!data) {
      return;
    }

    const reationRoles = data.reaction_roles.find(
      (f) => f.message_id == emoji.message.id
    );
    if (!reationRoles) {
      return;
    }

    const reationRole = reationRoles.reactions.find(
      (f) => f.emoji_id == emoji.emoji.id
    );
    if (!reationRole) {
      return;
    }

    const guild = this.guilds.cache.get(emoji.message.guildId as string);
    if (!guild) {
      return;
    }

    const member = guild.members.cache.get(user.id);
    if (!member) {
      return;
    }

    const role = guild.roles.cache.get(reationRole.role_id);
    if (!role) {
      return;
    }

    member.roles
      .add(role.id)
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });
  }

  public messageReactionRemove(
    emoji: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    const data = this.database.get(emoji.message.guildId as string);
    if (!data) {
      return;
    }

    const reationRoles = data.reaction_roles.find(
      (f) => f.message_id == emoji.message.id
    );
    if (!reationRoles) {
      return;
    }

    const reationRole = reationRoles.reactions.find(
      (f) => f.emoji_id == emoji.emoji.id
    );
    if (!reationRole) {
      return;
    }

    const guild = this.guilds.cache.get(emoji.message.guildId as string);
    if (!guild) {
      return;
    }

    const member = guild.members.cache.get(user.id);
    if (!member) {
      return;
    }

    const role = guild.roles.cache.get(reationRole.role_id);
    if (!role) {
      return;
    }

    member.roles
      .remove(role.id)
      .then(() => {})
      .catch(() => {});
  }

  public async clearPortal() {
    const promises: Promise<VoiceChannel>[] = [];
    this.guilds.cache.forEach(async (guild) => {
      const portalChannels = guild.channels.cache.filter((f) => {
        return f.name.match(portalNameRegex);
      });

      portalChannels.forEach(async (portalChannel) => {
        promises.push(
          new Promise(async (resolve) => {
            await (<VoiceChannel>portalChannel).delete().catch((error) => {
              console.log(error);
            });
            resolve(<VoiceChannel>portalChannel);
          })
        );
      });
    });

    await Promise.all(promises);
  }

  public async portVoiceChannel(oldState: VoiceState, newState: VoiceState) {
    if (oldState.channelId) {
      const guild = this.guilds.cache.get(oldState.guild.id);
      const voiceChannel = guild?.channels.cache.get(oldState.channelId);
      const isChannelEmpty =
        (<Collection<Snowflake, GuildMember>>voiceChannel?.members).size == 0;
      if (
        oldState.member &&
        oldState.channel?.name.match(portalNameRegex) &&
        isChannelEmpty
      ) {
        await oldState.channel.delete().catch(() => {});
      }
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
    const portalName = `${channelName}-#${user.username}`;
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
          if (!data.twitch_alert.twitch_id) {
            resolve(true);
            return;
          }

          let streamStatus = <TwitchStatus>(
            await this.twitchLive.getStreamNotify(data.twitch_alert.twitch_id)
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
            guild.channels.cache.get(data.twitch_alert.channel_id)
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
          new DataBase(`${process.env.APPDATA}/magicord/history`).update(
            key,
            historyData
          );
        });
      });
  }
}

export { DcClient };
