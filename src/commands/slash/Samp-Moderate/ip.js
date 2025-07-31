const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Menampilkan IP server')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('Pilih member yang ingin ditag')
                .setRequired(false)),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        // const member = interaction.options.getUser('member');

        const ipEmbed = new EmbedBuilder()
            .setTitle('📡 IP Server')
            .setDescription('**IP Server:** \n\n```51.79.136.184:7130```\n\nGunakan IP di atas untuk masuk ke dalam server.')
            .setColor('Blue')
            .setFooter({ text: 'Noverra Roleplay', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [ipEmbed],
            // content: member ? `<@${member.id}>` : 'Noverra Roleplay',
            content: 'Noverra Roleplay',
            ephemeral: false 
        });
    }
};
