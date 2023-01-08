import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { IChannel } from "../utilities/dc-client";
import * as i18n from "./commandsList.json";

class SettingCommand extends SlashCommand {
  private command;
  private commandTW;

  constructor() {
    super();

    this.command = i18n["en-US"].stream;
    this.commandTW = i18n["zh-TW"].stream;

    this.setName(this.command.name)
      .setNameLocalizations({ "zh-TW": this.commandTW.name })
      .setDescription(this.command.description)
      .setDescriptionLocalizations({ "zh-TW": this.commandTW.description })
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.notify.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.notify.name,
          })
          .setDescription(this.command.subCommands.notify.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.notify.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.notify.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.notify.option.name,
              })
              .setDescription(
                this.command.subCommands.notify.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.notify.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.streamer.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.streamer.name,
          })
          .setDescription(this.command.subCommands.streamer.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.streamer.description,
          })
          .addStringOption((option) =>
            option
              .setName(this.command.subCommands.streamer.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.streamer.option.name,
              })
              .setDescription(
                this.command.subCommands.streamer.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.streamer.option.description,
              })
              .setRequired(true)
          )
      );
  }

  private async notifyChannel(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const streamNotify = interaction.options.getChannel(
      this.command.subCommands.notify.option.name
    );
    if (!streamNotify) {
      await interaction.editReply({
        content: `No notify channel id`,
      });
      return;
    }

    channelData.stream.channelID = streamNotify.id;
    await interaction.editReply({
      content: `Set stream notify channel "${streamNotify.name}" success\n`,
    });

    return channelData;
  }

  private async notifyStreamer(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const streamname = interaction.options.getString(
      this.command.subCommands.streamer.option.name
    );
    if (!streamname) {
      await interaction.editReply({
        content: `No streamer name`,
      });
      return;
    }

    channelData.stream.name = streamname;
    await interaction.editReply({
      content: `Set streamer name "${streamname}" success`,
    });

    return channelData;
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    return new Promise<IChannel | undefined>(async (resolve) => {
      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case this.command.subCommands.notify.name: {
          // Stream notify channel command
          resolve(await this.notifyChannel(interaction, channelData));
          break;
        }
        case this.command.subCommands.streamer.name: {
          // Stream notify streamer command
          resolve(await this.notifyStreamer(interaction, channelData));
          break;
        }
        default: {
          await interaction.editReply({
            content: `"${this.command.name}" command cannot find sub command "${subCommand}"`,
          });
          break;
        }
      }
    });
  }
}

module.exports = new SettingCommand();
