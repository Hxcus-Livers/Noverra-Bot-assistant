const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('Mengosongkan Semua Histori Chat Di Channel Discord'), 
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({
                content: 'You do not have permission to clear messages.',
                ephemeral: true 
            });
        }

        try {
            const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });

            await interaction.channel.bulkDelete(fetchedMessages, true)
                .catch(error => {
                    console.error('Failed to bulk delete messages:', error);
                    interaction.reply({
                        content: 'Failed to clear the chat. Please try again later.',
                        ephemeral: true
                    });
                });

            await interaction.reply({
                content: `Successfully cleared ${fetchedMessages.size} messages in this channel.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error while fetching or deleting messages:', error);
            interaction.reply({
                content: 'An error occurred while trying to clear the chat.',
                ephemeral: true
            });
        }
    }
};
