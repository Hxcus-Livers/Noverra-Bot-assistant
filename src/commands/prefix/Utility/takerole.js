const { Message, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: {
        name: 'role-setup',
        description: 'Setup role reaction system. **(Only Admin)**',
        aliases: ['rs', 'role'],
        permissions: PermissionsBitField.Flags.Administrator
    },
    
    run: async (client, message, args) => {
        // Konfigurasi roles dan emoji
        const roleConfig = [
            {
                roleId: '1307035215851688048', // ID role Civilian
                roleName: 'Civilian',
                emoji: '👤',
                description: 'Role untuk melakukan verifikasi'
            }
        ];

        try {
            // Membuat embed untuk role selection
            const embed = new EmbedBuilder()
                .setTitle('🎭 **TAKE ROLE**')
                .setDescription('Klik emoji di bawah untuk mendapatkan role!\n\n' +
                    roleConfig.map(role => `${role.emoji} **${role.roleName}** - ${role.description}`).join('\n'))
                .setColor('#00ff00')
                .setFooter({ text: 'Klik emoji untuk mengambil/melepas role' })
                .setTimestamp();

            // Kirim pesan embed
            const roleMessage = await message.channel.send({ embeds: [embed] });

            // Tambahkan reaction untuk setiap role
            for (const role of roleConfig) {
                await roleMessage.react(role.emoji);
            }

            // Hapus pesan command dari user
            if (message.deletable) {
                await message.delete();
            }

            // Event listener untuk reaction
            const filter = (reaction, user) => {
                return roleConfig.some(role => role.emoji === reaction.emoji.name) && !user.bot;
            };

            const collector = roleMessage.createReactionCollector({ 
                filter, 
                dispose: true 
            });

            collector.on('collect', async (reaction, user) => {
                await handleRoleReaction(reaction, user, roleConfig, 'add');
            });

            collector.on('remove', async (reaction, user) => {
                await handleRoleReaction(reaction, user, roleConfig, 'remove');
            });

            console.log('Role reaction system has been set up successfully!');

        } catch (error) {
            console.error('Error setting up role system:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Terjadi kesalahan saat setup role system!')
                .setColor('#ff0000')
                .setTimestamp();

            await message.channel.send({ embeds: [errorEmbed] });
        }
    }
};

// Fungsi untuk handle reaction role
async function handleRoleReaction(reaction, user, roleConfig, action) {
    try {
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        
        // Cari role yang sesuai dengan emoji
        const roleData = roleConfig.find(role => role.emoji === reaction.emoji.name);
        
        if (!roleData) return;

        const role = guild.roles.cache.get(roleData.roleId);
        
        if (!role) {
            console.error(`Role with ID ${roleData.roleId} not found!`);
            return;
        }

        if (action === 'add') {
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                console.log(`Added role ${role.name} to ${user.username}`);
                
                // Kirim DM ke user dengan embed
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('✅ Role Berhasil Ditambahkan!')
                        .setDescription(`Selamat! Kamu telah mendapatkan role **${role.name}**`)
                        .addFields([
                            { name: '🏷️ Role', value: role.name, inline: true },
                            { name: '🏠 Server', value: guild.name, inline: true },
                            { name: '📅 Waktu', value: new Date().toLocaleString('id-ID'), inline: true }
                        ])
                        .setColor('#00ff00')
                        .setThumbnail(user.displayAvatarURL())
                        .setFooter({ text: `${guild.name} • Role System` })
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.log(`Could not send DM to ${user.username}: ${error.message}`);
                }
            }
        } else if (action === 'remove') {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                console.log(`Removed role ${role.name} from ${user.username}`);
                
                // Kirim DM ke user dengan embed
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('❌ Role Berhasil Dihapus!')
                        .setDescription(`Role **${role.name}** telah dihapus dari akun kamu`)
                        .addFields([
                            { name: '🏷️ Role', value: role.name, inline: true },
                            { name: '🏠 Server', value: guild.name, inline: true },
                            { name: '📅 Waktu', value: new Date().toLocaleString('id-ID'), inline: true }
                        ])
                        .setColor('#ff6600')
                        .setThumbnail(user.displayAvatarURL())
                        .setFooter({ text: `${guild.name} • Role System` })
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.log(`Could not send DM to ${user.username}: ${error.message}`);
                }
            }
        }

    } catch (error) {
        console.error('Error handling role reaction:', error);
    }
}