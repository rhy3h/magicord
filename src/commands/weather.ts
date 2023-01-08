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

    this.command = i18n["en-US"].weather;
    this.commandTW = i18n["zh-TW"].weather;

    this.setName(this.command.name)
      .setNameLocalizations({ "zh-TW": this.commandTW.name })
      .setDescription(this.command.description)
      .setDescriptionLocalizations({ "zh-TW": this.commandTW.description })
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.morning.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.morning.name,
          })
          .setDescription(this.command.subCommands.morning.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.morning.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.morning.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.morning.option.name,
              })
              .setDescription(
                this.command.subCommands.morning.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.morning.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.afternoon.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.afternoon.name,
          })
          .setDescription(this.command.subCommands.afternoon.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.afternoon.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.afternoon.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.afternoon.option.name,
              })
              .setDescription(
                this.command.subCommands.afternoon.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.afternoon.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.night.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.night.name,
          })
          .setDescription(this.command.subCommands.night.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.night.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.night.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.night.option.name,
              })
              .setDescription(this.command.subCommands.night.option.description)
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.night.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      );
  }

  public async weatherChannel(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel,
    time: string
  ) {
    await interaction.deferReply({ ephemeral: true });

    const weatherChannel = interaction.options.getChannel(
      this.command.subCommands.morning.option.name
    );
    if (!weatherChannel) {
      await interaction.editReply({
        content: `No channel id`,
      });
      return;
    }
    switch (time) {
      case this.command.subCommands.morning.name: {
        channelData.weather.morning = weatherChannel.id;
        break;
      }
      case this.command.subCommands.afternoon.name: {
        channelData.weather.afternoon = weatherChannel.id;
        break;
      }
      case this.command.subCommands.night.name: {
        channelData.weather.night = weatherChannel.id;
        break;
      }
    }
    await interaction.editReply({
      content: `Set weather channel "${weatherChannel.name}" success\n`,
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
        case this.command.subCommands.morning.name:
        case this.command.subCommands.afternoon.name:
        case this.command.subCommands.night.name: {
          resolve(
            await this.weatherChannel(interaction, channelData, subCommand)
          );
          break;
        }
        default: {
          await interaction.deferReply({ ephemeral: true });
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
