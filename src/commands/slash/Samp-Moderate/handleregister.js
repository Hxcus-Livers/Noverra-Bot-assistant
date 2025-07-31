const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { time } = require('../../../../functions');
const config = require('../../../../config');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('handleregister')
        .setDescription('Menampilkan Panel Registrasi UCP'),
    options: {
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
            .setDescription(`:information_source: Channel ini adalah Panel untuk mengatur Akun Pribadi. Berikut beberapa fitur yang tersedia:\n\n**<:register:1396839792401973248>  __Registration Account__**\n Tombol ini digunakan untuk membuat akun User Control Panel. Setelah mendaftar, Anda akan langsung dapat login dan bermain di Noverra Roleplay.\n\n**<:check:1396839735653171332>  __Check Account__**\n Tombol ini digunakan untuk melihat status atau Statistik akun User Control Panel Anda.\n\n**<:reffund:1396839700081279097> __Reffund Role__**\n Jika sudah memiliki akun User Control Panel tetapi tidak mendapatkan role <@&1396418354771787840>, gunakan tombol ini. Juga gunakan ini jika kamu keluar dari Discord Noverra Roleplay dan ingin kembali bermain, untuk mengambil kembali role <@&1396418354771787840>!`)
            .setColor('Blue')
            .setFooter({ text: interaction.guild.name, iconURL: config.icon.thumbnail });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Registration Account')
                    .setStyle('Success')
                    .setCustomId('button-register')
                    .setEmoji("<:register:1396839792401973248>")
            );
        
        const buttons2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Check Account')
                .setStyle('2')
                .setCustomId('button-checkcode')
                .setEmoji("<:check:1396839735653171332>"),

            new ButtonBuilder()
                .setLabel('Reffund Role')
                .setStyle('2')
                .setCustomId('button-reffrole')
                .setEmoji("<:reffund:1396839700081279097>")
        );

        await interaction.channel.send({ embeds: [msgEmbed], components: [buttons, buttons2] });
        return interaction.reply({ content: "Sukses Membuat Embed HandleRegister", ephemeral: true });
    }
};