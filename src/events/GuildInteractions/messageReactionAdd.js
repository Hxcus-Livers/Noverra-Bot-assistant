const config = require("../../../config");

module.exports = {
    event: "messageReactionAdd",
    run: async (client, reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
            await reaction.fetch();
            } catch (err) {
            console.error('Error fetching reaction:', err);
            return;
            }
        }

        if (reaction.emoji.name !== config.takeRoleSystem.emoji) return;

        const message = reaction.message;
        if (!message.embeds.length) return;

        const embed = message.embeds[0];
        if (embed.title !== config.takeRoleSystem.embedTitle) return;

        try {
            const member = await message.guild.members.fetch(user.id);
            const role = await message.guild.roles.fetch(config.takeRoleSystem.role);

            if (!role) return console.error('Role tidak ditemukan!');
            if (member.roles.cache.has(role.id)) return;

            await member.roles.add(role);
        } catch (error) {
            console.error('Error saat memberi role:', error);
        }
    }
};
