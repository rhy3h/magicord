import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Interaction,
  SelectMenuBuilder,
  TextChannel,
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
  private channelList: Array<ChannelInfo>;

  constructor(interaction: Interaction, channelData: IChannel) {
    this.channelData = channelData;

    this.channelList = [];
    this.initChannelList(interaction);

    this.row = this.createRow();
    this.embed = this.createEmbed();
  }

  private initChannelList(interaction: Interaction) {
    let channels = interaction.client.guilds.client.channels.cache.filter(
      (r) => r.type == ChannelType.GuildText
    );
    channels.forEach((channel) => {
      const channelNode = <TextChannel>channel;
      this.channelList.push(new ChannelInfo(channelNode.id, channelNode.name));
    });
  }

  private createRow() {
    const memberAddRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("member_add")
          .setPlaceholder("進來通知")
          .addOptions(this.channelList)
      );

    const memberRemoveRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("member_remove")
          .setPlaceholder("離開通知")
          .addOptions(this.channelList)
      );

    const streamNotifyRow =
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId("stream_notify")
          .setPlaceholder("開台通知")
          .addOptions(this.channelList)
      );

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

    return [memberAddRow, memberRemoveRow, streamNotifyRow, buttonRow];
  }

  private createEmbed() {
    const memberAdd = this.channelList.find(
      (c) => c.value == this.channelData.memberAdd
    );
    const memberRemove = this.channelList.find(
      (c) => c.value == this.channelData.memberRemove
    );
    const notifyStream = this.channelList.find(
      (c) => c.value == this.channelData.liveMessage
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
