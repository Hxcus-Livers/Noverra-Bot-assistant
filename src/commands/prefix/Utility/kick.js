const { Message } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: {
        name: 'kick',
        description: 'Mengeluarkan Member Dari Server',
        aliases: ['k'],
        permissions: 'KickMembers',
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        const member = message.mentions.members.first();

        if (!member) {
            return message.reply({
                content: 'Please mention a user to kick.'
            });
        }

        if (!member.kickable) {
            return message.reply({
                content: 'I cannot kick this user. They might have a higher role or I lack the necessary permissions.'
            });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);
            await message.reply({
                content: `Successfully kicked ${member.user.tag} for: ${reason}`
            });
        } catch (error) {
            console.error(error);
            await message.reply({
                content: 'There was an error trying to kick this user.'
            });
        }
    }
};
