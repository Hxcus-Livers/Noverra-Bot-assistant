const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Memberikan Timeout Kepada Member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout in minutes')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)),
    options: {
        permissions: 'ModerateMembers',
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member) {
            return interaction.reply({
                content: 'Please specify a valid user to timeout.',
                ephemeral: true
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                content: 'I cannot timeout this user. They might have a higher role or I lack the necessary permissions.',
                ephemeral: true
            });
        }

        if (duration <= 0) {
            return interaction.reply({
                content: 'Please provide a valid duration in minutes for the timeout.',
                ephemeral: true
            });
        }

        const timeoutDuration = duration * 60 * 1000;

        try {
            await member.timeout(timeoutDuration, reason);
            await interaction.reply({
                content: `Successfully timed out ${member.user.tag} for ${duration} minutes. Reason: ${reason}`
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to apply the timeout to this user.',
                ephemeral: true
            });
        }
    }
};
