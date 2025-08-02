const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

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

        // Get server address from config
        const serverAddress = config.server?.fullAddress || `${config.server?.ip}:${config.server?.port}`;
        const serverName = config.servers?.name || 'Noverra Roleplay';

        const ipEmbed = new EmbedBuilder()
            .setTitle('📡 IP Server')
            .setDescription(`**IP Server:** \n\n\`\`\`${serverAddress}\`\`\`\n\nGunakan IP di atas untuk masuk ke dalam server.`)
            .setColor('Blue')
            .setFooter({ text: serverName, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [ipEmbed],
            // content: member ? `<@${member.id}>` : serverName,
            content: serverName,
            ephemeral: false 
        });
    }
};