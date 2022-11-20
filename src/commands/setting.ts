import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
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
          .setName("portal")
          .setNameLocalizations({ "zh-TW": "語音傳送門" })
          .setDescription("Just portal")
          .setDescriptionLocalizations({ "zh-TW": "就是語音傳送門" })
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setNameLocalizations({ "zh-TW": "頻道" })
              .setDescription("Voice Channel")
              .setDescriptionLocalizations({ "zh-TW": "語音頻道" })
              .addChannelTypes(ChannelType.GuildVoice)
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
            await interaction.deferReply();

            const role = interaction.options.getRole("role")?.id || "";
            if (!role) {
              return;
            }

            if (channelData.role.roleID.indexOf(role) == -1) {
              channelData.role.roleID.push(role);
            }

            await interaction.deleteReply();
            break;
          }
          case "remove": {
            await interaction.deferReply();

            const role = interaction.options.getRole("role")?.id || "";
            if (!role) {
              return;
            }

            const index = channelData.role.roleID.indexOf(role);
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
          channelData.stream.channelID =
            interaction.options.getChannel("channel")?.id || "";
          channelData.stream.name =
            interaction.options.getString("streamname") || "";
        } else if (interaction.options.getSubcommand() == "portal") {
          channelData.voicePortal =
            interaction.options.getChannel("channel")?.id || "";
        }
        await interaction.deleteReply();
      }
    }
    return channelData;
  }
}

module.exports = new SettingCommand();
