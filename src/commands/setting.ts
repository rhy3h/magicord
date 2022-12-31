import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { SlashCommand } from "../components/SlashCommand";
import { RoleMessageModal } from "../components/RoleMessageModal";
import { RoleMessage } from "../components/RoleMessage";
import { IChannel } from "../utilities/dc-client";

class SettingCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("setting")
      .setNameLocalizations({ "zh-TW": "設定" })
      .setDescription("Just setting")
      .setDescriptionLocalizations({ "zh-TW": "就是設定" })
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommandGroup((group) =>
        group
          .setName("member")
          .setNameLocalizations({ "zh-TW": "成員" })
          .setDescription("Member")
          .setDescriptionLocalizations({ "zh-TW": "成員" })
          .addSubcommand((subcommand) =>
            subcommand
              .setName("add")
              .setNameLocalizations({ "zh-TW": "進入" })
              .setDescription("Member get in")
              .setDescriptionLocalizations({ "zh-TW": "就是成員進入" })
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setNameLocalizations({ "zh-TW": "頻道" })
                  .setDescription("Text Channel")
                  .setDescriptionLocalizations({ "zh-TW": "文字頻道" })
                  .addChannelTypes(ChannelType.GuildText)
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("remove")
              .setNameLocalizations({ "zh-TW": "離開" })
              .setDescription("Member get out")
              .setDescriptionLocalizations({ "zh-TW": "就是成員離開" })
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setNameLocalizations({ "zh-TW": "頻道" })
                  .setDescription("Text Channel")
                  .setDescriptionLocalizations({ "zh-TW": "文字頻道" })
                  .addChannelTypes(ChannelType.GuildText)
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("count")
              .setNameLocalizations({ "zh-TW": "人數" })
              .setDescription("Just member count")
              .setDescriptionLocalizations({ "zh-TW": "就是頻道人數" })
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setNameLocalizations({ "zh-TW": "頻道" })
                  .setDescription("Voice Channel")
                  .setDescriptionLocalizations({ "zh-TW": "人數更新語音頻道" })
                  .addChannelTypes(ChannelType.GuildVoice)
                  .setRequired(true)
              )
          )
      )
      .addSubcommandGroup((group) =>
        group
          .setName("stream")
          .setNameLocalizations({ "zh-TW": "實況" })
          .setDescription("Stream")
          .setDescriptionLocalizations({ "zh-TW": "實況" })
          .addSubcommand((subcommand) =>
            subcommand
              .setName("notify")
              .setNameLocalizations({ "zh-TW": "實況通知" })
              .setDescription("Just stream notify")
              .setDescriptionLocalizations({ "zh-TW": "就是實況通知" })
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setNameLocalizations({ "zh-TW": "頻道" })
                  .setDescription("Notify text channel")
                  .setDescriptionLocalizations({ "zh-TW": "實況通知頻道" })
                  .addChannelTypes(ChannelType.GuildText)
              )
              .addStringOption((option) =>
                option
                  .setName("streamname")
                  .setNameLocalizations({ "zh-TW": "實況主名稱" })
                  .setDescription("Streamer Name")
                  .setDescriptionLocalizations({ "zh-TW": "實況主名稱" })
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("portalname")
          .setNameLocalizations({ "zh-TW": "語音傳送門名稱" })
          .setDescription("Just portal")
          .setDescriptionLocalizations({ "zh-TW": "就是語音傳送門" })
          .addStringOption((option) =>
            option
              .setName("set")
              .setNameLocalizations({ "zh-TW": "設置" })
              .setDescription("Voice portal name")
              .setDescriptionLocalizations({ "zh-TW": "傳送門名稱" })
              .setRequired(true)
          )
      )
      .addSubcommandGroup((group) =>
        group
          .setName("role")
          .setNameLocalizations({ "zh-TW": "身分組" })
          .setDescription("Just role")
          .setDescriptionLocalizations({ "zh-TW": "就是身分組" })
          .addSubcommand((subcommand) =>
            subcommand
              .setName("message")
              .setNameLocalizations({ "zh-TW": "訊息" })
              .setDescription("Just role message")
              .setDescriptionLocalizations({ "zh-TW": "就是訊息" })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("send")
              .setNameLocalizations({ "zh-TW": "傳送" })
              .setDescription("Just send message")
              .setDescriptionLocalizations({ "zh-TW": "就是傳送訊息" })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("add")
              .setNameLocalizations({ "zh-TW": "新增" })
              .setDescription("Just add")
              .setDescriptionLocalizations({ "zh-TW": "就是新增" })
              .addRoleOption((option) =>
                option
                  .setName("role")
                  .setNameLocalizations({ "zh-TW": "身分組" })
                  .setDescription("Just role")
                  .setDescriptionLocalizations({ "zh-TW": "就是身分組" })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("remove")
              .setNameLocalizations({ "zh-TW": "移除" })
              .setDescription("Just remove")
              .setDescriptionLocalizations({ "zh-TW": "就是移除" })
              .addRoleOption((option) =>
                option
                  .setName("role")
                  .setNameLocalizations({ "zh-TW": "身分組" })
                  .setDescription("Just role")
                  .setDescriptionLocalizations({ "zh-TW": "就是身分組" })
                  .setRequired(true)
              )
          )
      );
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
    channelData: IChannel
  ) {
    if (interaction.commandName == "setting") {
      if (interaction.options.getSubcommandGroup() == "role") {
        switch (interaction.options.getSubcommand()) {
          case "message": {
            const modal = new RoleMessageModal();
            await interaction.showModal(modal);
            break;
          }
          case "send": {
            const roleMessage = new RoleMessage(interaction, channelData);
            await interaction.reply({
              content: roleMessage.content,
              components: roleMessage.row,
            });
            break;
          }
          case "add": {
            await interaction.deferReply({ ephemeral: true });

            const _role = interaction.options.getRole("role");
            if (!_role) {
              await interaction.editReply({
                content: `Role '${_role}' is not existed`,
              });
              return;
            }

            const role = interaction.guild?.roles.cache.find(
              (r) => r.id == _role.id
            );
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
            break;
          }
          case "remove": {
            await interaction.deferReply({ ephemeral: true });

            const _role = interaction.options.getRole("role");

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
            break;
          }
        }
      } else {
        await interaction.deferReply({ ephemeral: true });
        if (interaction.options.getSubcommandGroup() == "member") {
          switch (interaction.options.getSubcommand()) {
            case "add": {
              const memberAdd = interaction.options.getChannel("channel");
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
              break;
            }
            case "remove": {
              const memberRemove = interaction.options.getChannel("channel");
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
              break;
            }
            case "count": {
              const memberCount = interaction.options.getChannel("channel");
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
              break;
            }
          }
        } else if (interaction.options.getSubcommandGroup() == "stream") {
          let replyContent = ``;
          const streamNotify = interaction.options.getChannel("channel");
          if (streamNotify) {
            channelData.stream.channelID = streamNotify.id;

            replyContent += `Set stream notify channel "${streamNotify.name}" success\n`;
          }

          const streamname = interaction.options.getString("streamname");
          if (streamname) {
            channelData.stream.name = streamname;

            replyContent += `Set streamer name "${streamname}" success`;
          }

          await interaction.editReply({
            content: replyContent,
          });
        } else if (interaction.options.getSubcommand() == "portalname") {
          const voicePortal = interaction.options.getString("set");

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
        }
      }
    }
    return channelData;
  }
}

module.exports = new SettingCommand();
