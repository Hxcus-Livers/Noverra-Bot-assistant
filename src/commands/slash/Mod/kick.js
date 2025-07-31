const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Mengeluarkan Member Dari Server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),
    options: {
        permissions: 'KickMembers',
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member) {
            return interaction.reply({
                content: 'Please specify a valid user to kick.',
                ephemeral: true
            });
        }

        if (!member.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user. They might have a higher role or I lack the necessary permissions.',
                ephemeral: true
            });
        }

        try {
            await member.kick(reason);
            await interaction.reply({
                content: `Successfully kicked ${member.user.tag} for: ${reason}`
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to kick this user.',
                ephemeral: true
            });
        }
    }
};
