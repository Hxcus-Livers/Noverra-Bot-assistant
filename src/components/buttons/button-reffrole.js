const { ButtonInteraction } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const config = require('../../../config');
const { IntSucces, IntError } = require('../../../functions');
const MysqlMortal = require('../../../Mysql');

module.exports = {
    customId: 'button-reffrole',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        const userid = interaction.user.id;

        MysqlMortal.query(`SELECT * FROM accounts WHERE DiscordID = '${userid}'`, async (err, row) => {
            if (err) {
                console.error(err);
                return IntError(interaction, `**REFFUND ROLE**\n\nTerjadi kesalahan saat mengambil data dari database.`);
            }

            if (row[0]) {
                const rUCP = interaction.guild.roles.cache.get(config.idrole.ucp);

                if (!rUCP) {
                    return IntError(interaction, `**REFFUND ROLE**\n\nRole tidak ditemukan. Pastikan role dengan ID yang diberikan ada di server.`);
                }

                try {
                    await interaction.member.roles.add(rUCP); // Add role
                    await interaction.member.setNickname(`#NOV | ${row[0].Username}`); // Set nickname

                    IntSucces(interaction, `**REFFUND ROLE**\n\nAkun Discord Anda berhasil kami verifikasi sebagai pemain di ${config.servers.name}.`);
                } catch (roleError) {
                    console.error('Error adding role:', roleError);
                    IntError(interaction, `**REFFUND ROLE**\n\nTerjadi kesalahan saat menambahkan role. Pastikan bot memiliki izin untuk mengelola role.`);
                }
            } else {
                IntError(interaction, `**REFFUND ROLE**\n\nAnda belum pernah mendaftar di ${config.servers.name}. Silahkan daftarkan akun terlebih dahulu dengan menekan tombol **Registration Account**`);
            }
        });
    }
};
