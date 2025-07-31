const { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MysqlMortal = require('../../../Mysql');
const { IntError } = require('../../../functions');
const config = require('../../../config');

module.exports = {
    customId: 'button-resendcode',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            const userId = interaction.user.id;
            const randCode = Math.floor(100000 + Math.random() * 900000);

            const query = `UPDATE accounts SET password = '', regucp = 0, verifycode = '${randCode}' WHERE DiscordID = '${userId}'`;

            MysqlMortal.query(query, async (error, results) => {
                if (error) {
                    console.error('Error executing query:', error);
                    return IntError(interaction, ":x: **ERROR** \nGagal mereset password akun UCP. Silakan coba lagi.");
                }

                if (results.affectedRows > 0) {
                    const resetEmbed = new EmbedBuilder()
                        .setAuthor({ name: `Change Password | ${config.servers.name}` })
                        .setDescription(`\n:warning: Anda telah meminta layanan reset password.\n\nPassword akun User Control Panel anda telah dihapus. Silakan cek Direct Message Anda untuk Kode Verifikasi baru yang dapat digunakan untuk mengatur ulang kata sandi.`)
                        .setColor('Green')
                        .setFooter({ text: interaction.guild.name })
                        .setTimestamp();

                    await interaction.reply({ embeds: [resetEmbed], ephemeral: true });

                    const dmEmbed = new EmbedBuilder()
                        .setAuthor({ name: `Change Password | ${config.servers.name}` })
                        .setDescription(`\n:lock: Kode Verifikasi: \`${randCode}\`\n\nGunakan kode verifikasi ini untuk mengatur ulang kata sandi Anda.`)
                        .setColor('Blue')
                        .setFooter({ text: interaction.guild.name })
                        .setTimestamp();

                    try {
                        await interaction.user.send({ embeds: [dmEmbed] });
                    } catch (dmError) {
                        console.error('Error sending DM:', dmError);
                        await interaction.followUp({ content: "Tidak dapat mengirimkan ke Direct Message. Pastikan Direct Message Anda terbuka dan coba lagi.", ephemeral: true });
                    }

                } else {
                    return IntError(interaction, ":x: **ERROR** \nAkun Anda tidak ditemukan di database. Silakan daftar terlebih dahulu.");
                }
            });
        } catch (error) {
            console.error('Error in reset password interaction:', error);
            return IntError(interaction, ":x: **ERROR** \nTerjadi kesalahan dalam menangani permintaan.");
        }
    }
};
