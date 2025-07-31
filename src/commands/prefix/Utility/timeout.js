const { Message } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: {
        name: 'timeout',
        description: 'Memberikan Timeout Kepada User',
        aliases: ['mute'],
        permissions: 'ModerateMembers',
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
                content: 'Please mention a user to timeout.'
            });
        }

        if (!member.moderatable) {
            return message.reply({
                content: 'I cannot timeout this user. They might have a higher role or I lack the necessary permissions.'
            });
        }

        const duration = parseInt(args[1]);
        if (!duration || isNaN(duration) || duration <= 0) {
            return message.reply({
                content: 'Please provide a valid duration in minutes for the timeout.'
            });
        }

        const timeoutDuration = duration * 60 * 1000;
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await member.timeout(timeoutDuration, reason);
            await message.reply({
                content: `Successfully timed out ${member.user.tag} for ${duration} minutes. Reason: ${reason}`
            });
        } catch (error) {
            console.error(error);
            await message.reply({
                content: 'There was an error trying to apply the timeout to this user.'
            });
        }
    }
};
