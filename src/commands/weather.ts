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
              .setName(this.command.subCommands.morning.option.temperature.name)
              .setNameLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.morning.option.temperature.name,
              })
              .setDescription(
                this.command.subCommands.morning.option.temperature.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.morning.option.temperature
                    .description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.morning.option.rain.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.morning.option.rain.name,
              })
              .setDescription(
                this.command.subCommands.morning.option.rain.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.morning.option.rain.description,
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
              .setName(
                this.command.subCommands.afternoon.option.temperature.name
              )
              .setNameLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.afternoon.option.temperature.name,
              })
              .setDescription(
                this.command.subCommands.afternoon.option.temperature
                  .description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.afternoon.option.temperature
                    .description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.afternoon.option.rain.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.afternoon.option.rain.name,
              })
              .setDescription(
                this.command.subCommands.afternoon.option.rain.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.afternoon.option.rain.description,
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
              .setName(this.command.subCommands.night.option.temperature.name)
              .setNameLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.night.option.temperature.name,
              })
              .setDescription(
                this.command.subCommands.night.option.temperature.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.night.option.temperature
                    .description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.night.option.rain.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.night.option.rain.name,
              })
              .setDescription(
                this.command.subCommands.night.option.rain.description
              )
              .setDescriptionLocalizations({
                "zh-TW":
                  this.commandTW.subCommands.night.option.rain.description,
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

    const temperatureChannel = interaction.options.getChannel(
      this.command.subCommands.morning.option.temperature.name
    );
    if (!temperatureChannel) {
      await interaction.editReply({
        content: `No temperature channel id`,
      });
      return;
    }

    const rainChannel = interaction.options.getChannel(
      this.command.subCommands.morning.option.rain.name
    );
    if (!rainChannel) {
      await interaction.editReply({
        content: `No rain channel id`,
      });
      return;
    }

    switch (time) {
      case this.command.subCommands.morning.name: {
        channelData.weather.morning.temperature = temperatureChannel.id;
        channelData.weather.morning.pop = rainChannel.id;
        break;
      }
      case this.command.subCommands.afternoon.name: {
        channelData.weather.afternoon.temperature = temperatureChannel.id;
        channelData.weather.afternoon.pop = rainChannel.id;
        break;
      }
      case this.command.subCommands.night.name: {
        channelData.weather.night.temperature = temperatureChannel.id;
        channelData.weather.night.pop = rainChannel.id;
        break;
      }
    }
    await interaction.editReply({
      content: `Set weather temperature channel "${temperatureChannel.name}" success\nSet weather rain channel "${rainChannel.name}" success\n`,
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
