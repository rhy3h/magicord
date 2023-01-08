import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { IChannel } from "../utilities/dc-client";
import * as i18n from "./commandsList.json";
import { RoleMessageModal } from "../components/RoleMessageModal";
import { RoleMessage } from "../components/RoleMessage";

class SettingCommand extends SlashCommand {
  private command;
  private commandTW;

  constructor() {
    super();

    this.command = i18n["en-US"].role;
    this.commandTW = i18n["zh-TW"].role;

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
          .addRoleOption((option) =>
            option
              .setName(this.command.subCommands.add.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.add.option.name,
              })
              .setDescription(this.command.subCommands.add.option.description)
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.add.option.description,
              })
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
          .addRoleOption((option) =>
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
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.message.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.message.name,
          })
          .setDescription(this.command.subCommands.message.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.message.description,
          })
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(this.command.subCommands.send.name)
          .setNameLocalizations({
            "zh-TW": this.commandTW.subCommands.send.name,
          })
          .setDescription(this.command.subCommands.send.description)
          .setDescriptionLocalizations({
            "zh-TW": this.commandTW.subCommands.send.description,
          })
          .addChannelOption((option) =>
            option
              .setName(this.command.subCommands.send.option.name)
              .setNameLocalizations({
                "zh-TW": this.commandTW.subCommands.send.option.name,
              })
              .setDescription(this.command.subCommands.send.option.description)
              .setDescriptionLocalizations({
                "zh-TW": this.commandTW.subCommands.send.option.description,
              })
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      );
  }

  private async roleAdd(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const _role = interaction.options.getRole(
      this.command.subCommands.add.option.name
    );
    if (!_role) {
      await interaction.editReply({
        content: `Role '${_role}' is not existed`,
      });
      return;
    }

    const role = interaction.guild?.roles.cache.find((r) => r.id == _role.id);
    if (!role) {
      await interaction.editReply({
        content: `Cannot find role '${_role}'`,
      });
      return;
    }

    if (
      role.permissions.has([
        PermissionsBitField.Flags.Administrator,
        PermissionsBitField.Flags.BanMembers,
        PermissionsBitField.Flags.KickMembers,
        PermissionsBitField.Flags.MoveMembers,
        PermissionsBitField.Flags.MuteMembers,
        PermissionsBitField.Flags.DeafenMembers,
        PermissionsBitField.Flags.ModerateMembers,
        PermissionsBitField.Flags.ManageMessages,
      ])
    ) {
      await interaction.editReply({
        content: `'${role.name}''s permission is not authorized`,
      });
      return;
    }

    if (channelData.role.roleID.indexOf(role.id) != -1) {
      await interaction.editReply({
        content: `Role '${role.name}' is already added`,
      });
      return;
    }

    channelData.role.roleID.push(role.id);
    await interaction.editReply({
      content: `Add role '${role.name}' success`,
    });

    return channelData;
  }

  private async roleRemove(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const _role = interaction.options.getRole(
      this.command.subCommands.remove.option.name
    );
    if (!_role) {
      await interaction.editReply({
        content: `Role '${_role}' is not existed`,
      });
      return;
    }

    const index = channelData.role.roleID.indexOf(_role.id);
    if (index == -1) {
      await interaction.editReply({
        content: `Role '${_role.name}' is not added`,
      });
      return;
    }

    channelData.role.roleID.splice(index, 1);
    await interaction.editReply({
      content: `Remove role '${_role.name}' success`,
    });

    return channelData;
  }

  private async roleMesssage(interaction: ChatInputCommandInteraction) {
    const modal = new RoleMessageModal();
    await interaction.showModal(modal);
  }

  private async roleSendMessage(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    await interaction.deferReply({ ephemeral: true });

    const sendChannel = <TextChannel>(
      interaction.options.getChannel(this.command.subCommands.send.option.name)
    );
    if (!sendChannel) {
      await interaction.editReply({
        content: `No messsage send channel`,
      });
      return;
    }

    const roleMessage = new RoleMessage(interaction, channelData);
    sendChannel
      .send({
        content: roleMessage.content,
        components: roleMessage.row,
      })
      .then(async () => {
        await interaction.editReply({
          content: `Send role message success`,
        });
      })
      .catch(async () => {
        await interaction.editReply({
          content: `Send role message fail`,
        });
      });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    return new Promise<IChannel | undefined>(async (resolve) => {
      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case this.command.subCommands.add.name: {
          // Role add command
          resolve(await this.roleAdd(interaction, channelData));
          break;
        }
        case this.command.subCommands.remove.name: {
          // Role remove command
          await interaction.deferReply({ ephemeral: true });
          resolve(await this.roleRemove(interaction, channelData));
          break;
        }
        case this.command.subCommands.message.name: {
          // Role message command
          await this.roleMesssage(interaction);
          break;
        }
        case this.command.subCommands.send.name: {
          // Role send message command
          await this.roleSendMessage(interaction, channelData);
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
