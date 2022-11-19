import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
} from "discord.js";
import { IChannel } from "../utilities/dc-client";

class ChannelInfo {
  public value: string;
  public label: string;

  constructor(id: string, name: string) {
    this.value = id;
    this.label = name;
  }
}

class Test {
  private channelData: IChannel;

  public row: Array<ActionRowBuilder<ButtonBuilder>>;
  public embed: Array<EmbedBuilder>;
  private textChannelList: Array<ChannelInfo>;
  private voiceChannelList: Array<ChannelInfo>;

  constructor(interaction: Interaction, channelData: IChannel) {
    this.channelData = channelData;

    this.textChannelList = [];
    this.voiceChannelList = [];
    this.initChannelList(interaction);

    this.row = this.createRow();
    this.embed = this.createEmbed();
  }

  private initChannelList(interaction: Interaction) {
    const channels = interaction.guild?.channels.cache.filter((r) => {
      return (
        r.type == ChannelType.GuildText || r.type == ChannelType.GuildVoice
      );
    });
    channels?.forEach((channel) => {
      if (channel.type == ChannelType.GuildText) {
        this.textChannelList.push(new ChannelInfo(channel.id, channel.name));
      } else if (channel.type == ChannelType.GuildVoice) {
        this.voiceChannelList.push(new ChannelInfo(channel.id, channel.name));
      }
    });
  }

  private createRow() {
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("member_add_button")
        .setLabel("進來")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("member_remove_button")
        .setLabel("離開")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stream_notify_button")
        .setLabel("開台")
        .setStyle(ButtonStyle.Primary)
    );

    return [buttonRow];
  }

  private createEmbed() {
    const memberAdd = this.textChannelList.find(
      (c) => c.value == this.channelData?.memberAdd
    );
    const memberRemove = this.textChannelList.find(
      (c) => c.value == this.channelData?.memberRemove
    );
    const notifyStream = this.textChannelList.find(
      (c) => c.value == this.channelData?.stream.channelID
    );
    const voicePortal = this.voiceChannelList.find(
      (c) => c.value == this.channelData?.voicePortal
    );
    const updateMember = this.voiceChannelList.find(
      (c) => c.value == this.channelData?.memberCount
    );

    const notifyEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("通知設定")
      .setURL("https://discord.js.org/")
      .addFields(
        {
          name: "成員進來",
          value: memberAdd?.label || "\u200B",
        },
        {
          name: "成員離開",
          value: memberRemove?.label || "\u200B",
        },
        {
          name: "開台通知",
          value: notifyStream?.label || "\u200B",
        },
        {
          name: "語音傳送門",
          value: voicePortal?.label || "\u200B",
        },
        {
          name: "更新人數",
          value: updateMember?.label || "\u200B",
        }
      );
    return [notifyEmbed];
  }

  public getReaction() {
    return {
      embeds: this.embed,
      components: this.row,
    };
  }
}

export { Test };
