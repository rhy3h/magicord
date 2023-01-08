import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { IChannel } from "../utilities/dc-client";
import * as i18n from "./commandsList.json";

class SettingCommand extends SlashCommand {
  private command;
  private commandTW;

  constructor() {
    super();

    this.command = i18n["en-US"].voice;
    this.commandTW = i18n["zh-TW"].voice;

    this.setName(this.command.name)
      .setNameLocalizations({ "zh-TW": this.commandTW.name })
      .setDescription(this.command.description)
      .setDescriptionLocalizations({ "zh-TW": this.commandTW.description })
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.portal.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.portal.name,
          })
          .setDescription(this.command.subCommands.portal.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.portal.description,
          })
          .addStringOption((option) =>
            option
              .setName(this.command.subCommands.portal.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.portal.option.name,
              })
              .setDescription(
                this.command.subCommands.portal.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.portal.option.description,
              })
              .setRequired(true)
          )
      );
  }

  private async voicePortal(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const voicePortal = interaction.options.getString(
      this.command.subCommands.portal.option.name
    );

    if (!voicePortal) {
      await interaction.editReply({
        content: `No portal name`,
      });
      return;
    }

    channelData.voicePortal = voicePortal;
    await interaction.editReply({
      content: `Set portal "${voicePortal}" success`,
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
        case this.command.subCommands.portal.name: {
          // Voice portal command
          resolve(await this.voicePortal(interaction, channelData));
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
