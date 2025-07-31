const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../../config');

module.exports = {
    structure: {
        name: 'takerole',
        aliases: ['tr', 'role-panel'],
        description: 'Membuat panel take role dengan reaction',
        usage: 'takerole',
        category: 'admin',
        permissions: [PermissionFlagsBits.ManageRoles],
        cooldown: 5,
    },
    
    run: async (client, message, args) => {
        try {
            // Cek apakah user adalah developer/owner
            if (!config.users.developers.includes(message.author.id)) {
                return message.reply({
                    content: config.messageSettings.developerMessage
                });
            }

            // Cek permissions bot
            if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return message.reply({
                    content: '❌ Bot tidak memiliki permission `Manage Roles`!'
                });
            }

            // Membuat embed untuk take role
            const embed = new EmbedBuilder()
                .setTitle(config.takeRoleSystem.embedTitle)
                .setDescription(config.takeRoleSystem.embedDescription)
                .setColor(config.takeRoleSystem.embedColor)
                .setThumbnail(config.icon.thumbnail)
                .setFooter({ 
                    text: `${config.servers.name} • Civillian Take Role`
                })
                .setTimestamp();

            // Kirim embed
            const sentMessage = await message.channel.send({
                embeds: [embed]
            });

            // Tambahkan reaction
            await sentMessage.react(config.takeRoleSystem.emoji);

            // Hapus command message (optional)
            if (message.deletable) {
                await message.delete().catch(() => {});
            }

            console.log(`Take role panel telah dibuat di channel: ${message.channel.name} oleh ${message.author.tag}`);

        } catch (error) {
            console.error('Error dalam prefix command takerole:', error);
            message.reply({
                content: '❌ Terjadi kesalahan saat membuat panel take role!'
            });
        }
    },
};