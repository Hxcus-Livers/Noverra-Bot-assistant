const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Memberikan Banned Kepada Member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),
    options: {
        permissions: 'BanMembers',
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
                content: 'Please specify a valid user to ban.',
                ephemeral: true
            });
        }

        if (!member.bannable) {
            return interaction.reply({
                content: 'I cannot ban this user. They might have a higher role or I lack the necessary permissions.',
                ephemeral: true
            });
        }

        try {
            await member.ban({ reason });
            await interaction.reply({
                content: `Successfully banned ${member.user.tag} for: ${reason}`
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to ban this user.',
                ephemeral: true
            });
        }
    }
};
