const { StringSelectMenuInteraction, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    customId: 'cmd_select',

    /**
     * @param {ExtendedClient} client 
     * @param {StringSelectMenuInteraction} interaction 
     */
    run: async (client, interaction) => {
        const category = interaction.values[0];

        const dataMap = {
            account: {
                title: '📘 Account Commands',
                commands: [
                    ['**/lastlogged**', '`untuk melihat terakhir kali sebuah akun online`'],
                    ['**/username**', '`untuk melihat username dari karakter lain`']
                ]
            },
            general1: {
                title: '📙 General Commands (Page 1)',
                commands: [
                    ['**/stats**', '`untuk melihat statistikmu`'],
                    ['**/saveme**', '`untuk memperbarui data karakter anda`'],
                    ['**/properties**', '`untuk melihat properti yang dimiliki`'],
                    ['**/report**', '`untuk melaporkan masalah`'],
                    ['**/toys**', '`untuk mengatur toys`'],
                    ['**/me**', '`untuk menjelaskan aksi yang kamu lakukan`'],
                    ['**/do**', '`untuk menjelaskan situasi sekitar`'],
                    ['**/b**', '`untuk bicara OOC`'],
                    ['**/health**', '`untuk melihat kesehatanmu`'],
                    ['**/accept**', '`untuk menerima tawaran`']
                ]
            },
            general2: {
                title: '📙 General Commands (Page 2)',
                commands: [
                    ['**/faq**', '`untuk melihat FAQ`'],
                    ['**/sell**', '`untuk menjual properti`'],
                    ['**/paint**', '`untuk menggambar`'],
                    ['**/bank**', '`untuk akses bank`'],
                    ['**/vest**', '`untuk pakai rompi`'],
                    ['**/usemag**', '`untuk isi peluru`'],
                    ['**/call**', '`untuk menelpon`'],
                    ['**/hangup**', '`untuk mengakhiri telpon`'],
                    ['**/id**', '`untuk lihat ID player`'],
                    ['**/gps**', '`untuk buka GPS`']
                ]
            },
            house: {
                title: '🏠 House Commands',
                commands: [
                    ['**/buy**', '`untuk membeli rumah`'],
                    ['**/abandon**', '`untuk menjual/membuang rumah`'],
                    ['**/lock**', '`untuk kunci/buka rumah`'],
                    ['**/doorbell**', '`untuk mengetuk pintu`'],
                    ['**/housemenu**', '`untuk buka menu rumah`']
                ]
            },
            vehicle: {
                title: '🚗 Vehicle Commands',
                commands: [
                    ['**/lock**', '`untuk kunci kendaraan`'],
                    ['**/hood**', '`untuk buka kap mesin`'],
                    ['**/trunk**', '`untuk buka bagasi`'],
                    ['**/rentvehicle**', '`untuk sewa kendaraan`'],
                    ['**/unrentvehicle**', '`untuk balikin kendaraan`'],
                    ['**/en**', '`untuk nyalakan/matikan mesin`']
                ]
            },
            faction: {
                title: '🛡️ Faction Commands',
                commands: [
                    ['**/online**', '`lihat anggota faction`'],
                    ['**/finvite**', '`undang ke faction`'],
                    ['**/fremove**', '`keluarkan anggota`'],
                    ['**/frank**', '`ubah peringkat`']
                ]
            },
            shortcuts: {
                title: '🔗 Shortcut Keys',
                commands: [
                    ['**Key X**', '`angkat tangan`'],
                    ['**Key P**', '`ubah jarak voice`'],
                    ['**Key M**', '`buka ponsel`'],
                    ['**Key L**', '`kunci rumah/kendaraan`'],
                    ['**Key =**', '`menu rumah pribadi`'],
                    ['**Key 1-5**', '`pakai item dari slot`']
                ]
            }
        };

        const selected = dataMap[category];

        if (!selected) {
            return interaction.reply({ content: 'Kategori tidak ditemukan!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(selected.title)
            .setColor(0x00FF00);

        selected.commands.forEach(([name, desc]) => {
            embed.addFields({ name, value: desc });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
