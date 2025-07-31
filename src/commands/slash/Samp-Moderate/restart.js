const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const moment = require('moment-timezone');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Menampilkan Status Server Sedang Maintenance')
        .addStringOption(option =>
            option.setName('jam')
                .setDescription('Masukkan jam restart (format 24 jam, contoh: 13:00)')
                .setRequired(true)
        ),
    options: {
        cooldown: 5000,
        developers: true
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const restartTimeInput = interaction.options.getString('jam'); // Ambil input jam restart
        const now = moment().tz('Asia/Jakarta'); // Waktu saat ini dalam zona WIB
        const restartTime = moment(restartTimeInput, 'HH:mm').tz('Asia/Jakarta');

        // Hitung selisih waktu dalam menit
        let timeDiff = restartTime.diff(now, 'minutes');
        if (timeDiff < 0) timeDiff += 1440; // Jika waktu sudah lewat hari ini, tambahkan 24 jam

        const embed = new EmbedBuilder()
            .setTitle('**INFO SERVER**')
            .setColor(0xFFA500) // Warna orange
            .setDescription(`Server akan mengalami restart pada pukul ${restartTime.format('HH:mm')} WIB,\nWarga diharap tidak melakukan RP berat dalam ${timeDiff} menit ke depan.\nMohon maaf dan sekian terima kasih.\n\n@everyone`)
            .setFooter({ text: "Status: Restart Server", iconURL: 'https://cdn.discordapp.com/icons/1222520440946294784/d29b93e4b656ee04bc5fd2f2dc5bd706.png' })
            .setTimestamp();

        await interaction.reply({
            content: '@everyone',
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] },
            ephemeral: false
        });
    }
};
