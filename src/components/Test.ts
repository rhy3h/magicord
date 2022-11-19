import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

class Test {
  public row: Array<ActionRowBuilder<ButtonBuilder>>;

  constructor() {
    this.row = this.createRow();
  }

  private createRow() {
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("member_add_button")
        .setLabel("進來")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("member_remove_button")
        .setLabel("離開")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stream_notify_button")
        .setLabel("開台")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("update_member_button")
        .setLabel("更新人數")
        .setStyle(ButtonStyle.Primary)
    );

    return [buttonRow];
  }

  public getReaction() {
    return {
      components: this.row,
    };
  }
}

export { Test };
