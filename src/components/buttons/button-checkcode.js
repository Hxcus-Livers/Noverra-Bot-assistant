const { ButtonInteraction, EmbedBuilder, ChatInputCommandInteraction, SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const MysqlMortal = require('../../../Mysql');
const config = require('../../../config');
const { IntSucces, IntError }= require('../../../functions');

module.exports = {
    customId: 'button-checkcode',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        const userid = interaction.user.id;
        MysqlMortal.query(`SELECT * FROM accounts WHERE DiscordID = '${userid}'`, async (error, row) => {
            if (row[0]) {
                const msgEmbed = new EmbedBuilder()
                    .setAuthor({ name: `CHECK ACCOUNT` })
                    .setDescription(`Berikut adalah detail dari akun UCP Anda:\n\n> **Nama UCP:**\n> ${row[0].Username}\n\n> **Status:**\n> ${row[0].regucp === '0' ? 'Belum Terverifikasi' : 'Sudah Terverifikasi'}\n\n> **Pemilik Akun:**\n> User ID: **${userid}**\n> Username Discord: **${interaction.user.tag}**\n\n**Catatan**\nJangan beritahu informasi ini kepada orang lain!`)
                    .setColor('Green')
                    .setFooter({ text: interaction.guild.name })
                    .setTimestamp();

                await interaction.reply({ embeds: [msgEmbed], ephemeral: true}).catch(error => {
                    return interaction.reply({ content: "Tidak dapat mengirimkan detail akun UCP Anda. Silakan menekan ulang tombol **Check Account**.", ephemeral: true });
                });

                // IntSucces(interaction, `**CHECK ACCOUNT**\n:white_check_mark: Berhasil!\nKami telah mengirimkan DM kepada Anda. Silakan cek pesan tersebut.`);
            } else {
                return IntError(interaction, `**CHECK ACCOUNT**\n\nAnda belum pernah mendaftar di ${config.servers.name}. Silahkan daftarkan akun terlebih dahulu dengan menekan tombol **Registration Account**`);
            }
        });
    }
};
