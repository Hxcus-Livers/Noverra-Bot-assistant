const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
} = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');

module.exports = {
  customId: 'button-changepassword',
  /**
   * 
   * @param {ExtendedClient} client 
   * @param {ButtonInteraction} interaction 
   */
  run: async (client, interaction) => {
      if (interaction.isButton()) {
          if (interaction.customId === "button-changepassword") {
              const modal = new ModalBuilder()
                .setCustomId("ModalChangePassword")
                .setTitle("Change Password");
            
              const newPasswordInput = new TextInputBuilder()
                .setCustomId("newPasswordInput")
                .setMinLength(8)
                .setMaxLength(24)
                .setPlaceholder('Masukkan password baru')
                .setLabel('Password Baru')
                .setStyle(1);
                
              const confirmPasswordInput = new TextInputBuilder()
                .setCustomId("confirmPasswordInput")
                .setMinLength(8)
                .setMaxLength(24)
                .setPlaceholder('Masukkan kembali password baru')
                .setLabel('Konfirmasi Password Baru')
                .setStyle(1);
                  
              const packedModal = new ActionRowBuilder().addComponents(newPasswordInput);
              const packedModal2 = new ActionRowBuilder().addComponents(confirmPasswordInput);

              // @ts-ignore
              modal.addComponents(packedModal);
              // @ts-ignore
              modal.addComponents(packedModal2);

              interaction.showModal(modal);
            }
      }
  }
}