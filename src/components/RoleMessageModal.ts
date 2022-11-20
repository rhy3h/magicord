import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

class RoleMessageModal extends ModalBuilder {
  constructor() {
    super();
    this.setCustomId("roleMessageModal").setTitle("身分組訊息");

    const messageInput = new TextInputBuilder()
      .setCustomId("messageInput")
      .setLabel("你想要傳送什麼訊息")
      .setStyle(TextInputStyle.Paragraph);

    const messageInputActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);

    this.addComponents(messageInputActionRow);
  }
}

export { RoleMessageModal };
