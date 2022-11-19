import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { IChannel } from "../utilities/dc-client";

class SettingCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("setting")
      .setDescription("Just setting")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommandGroup((group) =>
        group
          .setName("member")
          .setDescription("Member")
          .addSubcommand((subcommand) =>
            subcommand
              .setName("add")
              .setDescription("Member get in")
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("Text Channel")
                  .addChannelTypes(ChannelType.GuildText)
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("remove")
              .setDescription("Member get out")
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("Text Channel")
                  .addChannelTypes(ChannelType.GuildText)
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("count")
              .setDescription("Just member count")
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("Voice Channel")
                  .addChannelTypes(ChannelType.GuildVoice)
                  .setRequired(true)
              )
          )
      )
      .addSubcommandGroup((group) =>
        group
          .setName("stream")
          .setDescription("Stream")
          .addSubcommand((subcommand) =>
            subcommand
              .setName("notify")
              .setDescription("Just stream notify")
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("Notify text channel")
                  .addChannelTypes(ChannelType.GuildText)
              )
              .addStringOption((option) =>
                option.setName("streamname").setDescription("Streamer Name")
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("portal")
          .setDescription("Just portal")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("Voice Channel")
              .addChannelTypes(ChannelType.GuildVoice)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("role")
          .setDescription("Just Role")
          .addIntegerOption((option) =>
            option
              .setName("message")
              .setDescription("Message ID")
              .setRequired(true)
          )
          .addRoleOption((option) =>
            option.setName("role").setDescription("Just role").setRequired(true)
          )
      );
  }

  public execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    if (interaction.commandName == "setting") {
      if (interaction.options.getSubcommandGroup() == "member") {
        switch (interaction.options.getSubcommand()) {
          case "add": {
            channelData.memberAdd =
              interaction.options.getChannel("channel")?.id || "";
            break;
          }
          case "remove": {
            channelData.memberRemove =
              interaction.options.getChannel("channel")?.id || "";
            break;
          }
          case "count": {
            channelData.memberCount =
              interaction.options.getChannel("channel")?.id || "";
            break;
          }
        }
      } else if (interaction.options.getSubcommandGroup() == "stream") {
        channelData.stream.channelID =
          interaction.options.getChannel("channel")?.id || "";
        channelData.stream.name =
          interaction.options.getString("streamname") || "";
      } else if (interaction.options.getSubcommand() == "portal") {
        channelData.voicePortal =
          interaction.options.getChannel("channel")?.id || "";
      } else if (interaction.options.getSubcommand() == "role") {
        channelData.role.roleID = interaction.options.getRole("role")?.id || "";
        channelData.role.messageID =
          interaction.options.getInteger("message")?.toString() || "";
      }
    }
    return channelData;
  }
}

module.exports = new SettingCommand();
