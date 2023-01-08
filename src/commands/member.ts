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

    this.command = i18n["en-US"].member;
    this.commandTW = i18n["zh-TW"].member;

    this.setName(this.command.name)
      .setNameLocalizations({ "zh-TW": this.commandTW.name })
      .setDescription(this.command.description)
      .setDescriptionLocalizations({ "zh-TW": this.commandTW.description })
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.add.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.add.name,
          })
          .setDescription(this.command.subCommands.add.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.add.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.add.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.add.option.name,
              })
              .setDescription(this.command.subCommands.add.option.description)
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.add.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.remove.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.remove.name,
          })
          .setDescription(this.command.subCommands.remove.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.remove.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.remove.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.remove.option.name,
              })
              .setDescription(
                this.command.subCommands.remove.option.description
              )
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.remove.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.count.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.count.name,
          })
          .setDescription(this.command.subCommands.count.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.count.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.count.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.count.option.name,
              })
              .setDescription(this.command.subCommands.count.option.description)
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.count.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      );
  }

  private async memberAdd(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const memberAdd = interaction.options.getChannel(
      this.command.subCommands.add.option.name
    );
    if (!memberAdd) {
      await interaction.editReply({
        content: `No member add channel id`,
      });
      return;
    }

    channelData.memberAdd = memberAdd.id;
    await interaction.editReply({
      content: `Set member add channel "${memberAdd.name}" success`,
    });

    return channelData;
  }

  private async memberRemove(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const memberRemove = interaction.options.getChannel(
      this.command.subCommands.remove.option.name
    );
    if (!memberRemove) {
      await interaction.editReply({
        content: `No member remove channel id`,
      });
      return;
    }

    channelData.memberRemove = memberRemove.id;
    await interaction.editReply({
      content: `Set member remove channel "${memberRemove.name}" success`,
    });

    return channelData;
  }

  private async memberCount(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const memberCount = interaction.options.getChannel(
      this.command.subCommands.count.option.name
    );
    if (!memberCount) {
      await interaction.editReply({
        content: `No member count channel id`,
      });
      return;
    }

    channelData.memberCount = memberCount.id;
    await interaction.editReply({
      content: `Set member count channel "${memberCount.name}" success`,
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
        case this.command.subCommands.add.name: {
          // Member get in command
          resolve(await this.memberAdd(interaction, channelData));
          break;
        }
        case this.command.subCommands.remove.name: {
          // Member get out command
          resolve(await this.memberRemove(interaction, channelData));
          break;
        }
        case this.command.subCommands.count.name: {
          // Member count command
          resolve(await this.memberCount(interaction, channelData));
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
