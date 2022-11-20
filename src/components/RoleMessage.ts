import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  RoleManager,
} from "discord.js";
import { IChannel } from "../utilities/dc-client";

class RoleMessage {
  private channelData: IChannel;

  public row: Array<ActionRowBuilder<ButtonBuilder>>;
  public content: string;

  constructor(interaction: Interaction, channelData: IChannel) {
    this.channelData = channelData;

    this.content = channelData.role.message;
    this.row = this.createRow(interaction.guild?.roles);
  }

  private createRow(role: RoleManager | undefined) {
    if (this.channelData.role.roleID.length == 0) {
      return [];
    }

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    this.channelData.role.roleID.forEach((roleID) => {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`role_${roleID}`)
          .setLabel(role?.cache.get(roleID)?.name || "")
          .setStyle(ButtonStyle.Primary)
      );
    });

    return [buttonRow];
  }
}

export { RoleMessage };
