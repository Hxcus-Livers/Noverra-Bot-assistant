const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

const pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
});

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription('Menghapus Member Dari Daftar Blacklist UCP')
        .addUserOption(option =>
            option.setName('akundiscord')
                .setDescription('Select the Discord account to unblacklist')
                .setRequired(true)
        ),
    options: {
        cooldown: 5000,
    },
    
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const discordUser = interaction.options.getUser('akundiscord');

        try {
            const connection = await pool.getConnection();

            const [result] = await connection.query(
                'DELETE FROM `blacklist-ucp` WHERE DiscordID = ?',
                [discordUser.id]
            );

            connection.release();

            if (result.affectedRows === 0) {
                return interaction.reply({
                    content: `User **${discordUser.tag}** is not in the blacklist.`,
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: `User **${discordUser.tag}** has been successfully removed from the blacklist.`,
                ephemeral: true
            });

            const logsChannelId = '1302412504781291573';  
            const logsChannel = client.channels.cache.get(logsChannelId);
            
            if (logsChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00) 
                    .setTitle('User Unblacklisted')
                    .setDescription(`A Discord account has been removed from the blacklist.`)
                    .addFields(
                        { name: 'Username', value: discordUser.username, inline: true },
                        { name: 'Discord Tag', value: discordUser.tag, inline: true },
                        { name: 'Discord ID', value: discordUser.id, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Unblacklisted by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                
                logsChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error removing the user from the blacklist. Please try again later.',
                ephemeral: true
            });
        }
    }
};
