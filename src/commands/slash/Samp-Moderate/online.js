const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');


module.exports = {
    structure: new SlashCommandBuilder()
        .setName('online')
        .setDescription('Menampilkan Status Server Telah Online'),
    options: {
        cooldown: 5000
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

        const embed = new EmbedBuilder()
            .setTitle('STATUS SERVER')
            .setDescription('**- Status: Online**\nServer sudah kembali mengudara.\nSilahkan warga memasuki kota.\nSekian Terima Kasih.\n\n')
            .setColor(0x00FF00) 
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            content: '@everyone',
            allowedMentions: { parse: ['everyone'] }, 
            ephemeral: false 
        });
    }
};
