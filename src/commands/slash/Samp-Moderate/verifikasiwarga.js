const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('verifikasiwarga')
        .setDescription('Menampilkan Panel Verifikasi Member Baru'),
    options: {
        ownerOnly: true,
        developers: true
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        
        const msgEmbed = new EmbedBuilder()
            .setTitle('Noverra Roleplay Verifikasi Warga')
            .setThumbnail(config.icon.thumbnail)
            .setImage(config.icon.image)
            .setDescription(`:information_source: **Selamat datang di Noverra Roleplay!**\n\nUntuk memastikan bahwa Anda bukan robot dan mendapatkan akses penuh sebagai warga di server ini, silakan klik tombol di bawah ini.\n\nDengan memverifikasi, Anda akan mendapatkan role **Warga** yang memberikan Anda akses ke berbagai channel dan fitur di server ini.\n\nJika Anda mengalami masalah, silakan hubungi salah satu staf kami untuk bantuan lebih lanjut.\n\nKlik tombol **Verifikasi Warga** di bawah ini untuk melanjutkan.`)
            .setColor('Blue')
            .setFooter({ text: interaction.guild.name, iconURL: config.icon.thumbnail });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Verifikasi Warga')
                    .setStyle('Success')
                    .setCustomId('button-verif')
                    .setEmoji("✅")
            );

        await interaction.channel.send({ embeds: [msgEmbed], components: [buttons] });
        return interaction.reply({ content: "Sukses Membuat Embed Verifikasi Warga", ephemeral: true });
    }
};
