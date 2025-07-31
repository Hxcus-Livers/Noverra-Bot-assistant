const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { time } = require('../../../../functions');
const config = require('../../../../config');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('reset-pass')
        .setDescription('Menampilkan Panel Reset Password'),
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
            .setTitle('Noverra Roleplay | Control Panel')
            .setThumbnail(config.icon.thumbnail)
            .setImage(config.icon.image)
            .setDescription(`**Cara Merubah Kata Sandi akun User Control Panel**\n\n:one: **__Langkah 1:__**\nTekan tombol **Change Password** di bawah ini\n\n:two: **__Langkah 2:__** Masukkan password baru Anda dan konfirmasi password baru\n\n:three: **__Langkah 3:__** Pastikan kedua password yang Anda masukkan sama\n\n**SELESAI.**`)
            .setColor('Blue')
            .setFooter({ text: interaction.guild.name, iconURL: config.icon.thumbnail });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Change Password')
                    .setStyle('1')
                    .setCustomId('button-changepassword')
                    .setEmoji("<:padlock:1117430411866419352>"),
            );

        await interaction.channel.send({ embeds: [msgEmbed], components: [buttons] });
        return interaction.reply({ content: "Sukses Membuat Embed Reset Password", ephemeral: true });
    }
};