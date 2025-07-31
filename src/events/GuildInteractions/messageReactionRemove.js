const { Events } = require('discord.js');
const config = require('../../../config'); // Path dari src/events/GuildInteractions/ ke root

module.exports = {
    event: "messageReactionRemove", // Nama event sebagai string
    
    run: async (client, reaction, user) => {
        // Ignore bot reactions
        if (user.bot) return;

        // Pastikan reaction sudah di-fetch
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        // Cek apakah reaction sesuai dengan emoji yang dikonfigurasi
        if (reaction.emoji.name !== config.takeRoleSystem.emoji) return;

        // Cek apakah pesan adalah embed take role (berdasarkan embed title)
        const message = reaction.message;
        if (!message.embeds.length) return;
        
        const embed = message.embeds[0];
        if (embed.title !== config.takeRoleSystem.embedTitle) return;

        try {
            // Dapatkan member dan role
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = await reaction.message.guild.roles.fetch(config.takeRoleSystem.role);

            if (!role) {
                console.error('Role tidak ditemukan!');
                return;
            }

            // Cek apakah member memiliki role
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                return;
            }

        } catch (error) {
            console.error('Error menghapus role:', error);
        }
    },
};