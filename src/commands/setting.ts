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
              .addStringOption((option) =>
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
              .addStringOption((option) =>
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

            const roleName = interaction.options.getString("role");
            if (!roleName) {
              await interaction.editReply({ content: `No role name` });
              return;
            }

            const role = interaction.guild?.roles.cache.find(
              (r) => r.name == roleName
            );
            if (!role) {
              await interaction.editReply({
                content: `Cannot find role '${roleName}'`,
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
                content: `'${role}' permission not authorized`,
              });
              return;
            }

            if (channelData.role.roleID.indexOf(role.id) == -1) {
              channelData.role.roleID.push(role.id);
            }

            await interaction.editReply({
              content: `Success`,
            });
            break;
          }
          case "remove": {
            await interaction.deferReply();

            const roleName = interaction.options.getString("role");
            if (!roleName) {
              await interaction.editReply({ content: `No role name` });
              return;
            }

            const role = interaction.guild?.roles.cache.find(
              (r) => r.name == roleName
            );

            if (!role) {
              await interaction.editReply({
                content: `Cannot find role '${roleName}'`,
              });
              return;
            }

            const index = channelData.role.roleID.indexOf(role.id);
            if (index > -1) {
              channelData.role.roleID.splice(index, 1);
            }

            await interaction.deleteReply();
            break;
          }
        }
      } else {
        await interaction.deferReply();
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
          const channelID = interaction.options.getChannel("channel")?.id;
          if (channelID) {
            channelData.stream.channelID = channelID;
          }

          const streamname = interaction.options.getString("streamname");
          if (streamname) {
            channelData.stream.name = streamname;
          }
        } else if (interaction.options.getSubcommand() == "portalname") {
          const voicePortal = interaction.options.getString("set");
          if (voicePortal) {
            channelData.voicePortal = voicePortal;
          }
        }
        await interaction.deleteReply();
      }
    }
    return channelData;
  }
}

module.exports = new SettingCommand();
