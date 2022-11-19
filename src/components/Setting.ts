import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  SelectMenuBuilder,
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

class Setting {
  private channelData: IChannel;

  public row: Array<ActionRowBuilder<SelectMenuBuilder | ButtonBuilder>>;
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
    const memberAddRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("member_add")
          .setPlaceholder("進來通知")
          .addOptions(this.textChannelList)
      );

    const memberRemoveRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("member_remove")
          .setPlaceholder("離開通知")
          .addOptions(this.textChannelList)
      );

    const streamNotifyRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("stream_notify")
          .setPlaceholder("開台通知")
          .addOptions(this.textChannelList)
      );

    const portalVoiceRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("portal_voice")
          .setPlaceholder("語音傳送門")
          .addOptions(this.voiceChannelList)
      );

    const updateMemberRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("update_memeber")
          .setPlaceholder("更新人數")
          .addOptions(this.voiceChannelList)
      );

    return [
      memberAddRow,
      memberRemoveRow,
      streamNotifyRow,
      portalVoiceRow,
      updateMemberRow,
    ];
  }

  private createEmbed() {
    const memberAdd = this.textChannelList.find(
      (c) => c.value == this.channelData?.memberAdd
    );
    const memberRemove = this.textChannelList.find(
      (c) => c.value == this.channelData?.memberRemove
    );
    const notifyStream = this.textChannelList.find(
      (c) => c.value == this.channelData?.liveMessage
    );
    const voicePortal = this.voiceChannelList.find(
      (c) => c.value == this.channelData?.voicePortal
    );
    const updateMember = this.voiceChannelList.find(
      (c) => c.value == this.channelData?.updateMember
    );

    const notifyEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("通知設定")
      .setURL("https://discord.js.org/")
      .addFields(
        {
          name: "成員進來",
          value: memberAdd?.label || "\u200B",
          inline: true,
        },
        {
          name: "成員離開",
          value: memberRemove?.label || "\u200B",
          inline: true,
        },
        {
          name: "開台通知",
          value: notifyStream?.label || "\u200B",
          inline: true,
        },
        {
          name: "語音傳送門",
          value: voicePortal?.label || "\u200B",
          inline: true,
        },
        {
          name: "更新人數",
          value: updateMember?.label || "\u200B",
          inline: true,
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

export { Setting };
