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
        .setName('blacklistucp')
        .setDescription('Memasukkan User Kedalam Daftar Blacklist UCP')
        .addUserOption(option =>
            option.setName('akundiscord')
                .setDescription('Select the Discord account to ban')
                .setRequired(true)
        ),
    options: {
        cooldown: 5000
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

        const accountName = `${discordUser.username}`;
        const emailDiscord = `${discordUser.username}@discord.com`;

        try {
            const connection = await pool.getConnection();

            await connection.query(
                'INSERT INTO `blacklist-ucp` (Username, DiscordID, AccountName, EmailDiscord) VALUES (?, ?, ?, ?)',
                [discordUser.username, discordUser.id, accountName, emailDiscord]
            );

            const [result] = await connection.query(
                'DELETE FROM `accounts` WHERE DiscordID = ?',
                [discordUser.id]
            );

            connection.release();

            if (result.affectedRows === 0) {
                await interaction.reply({
                    content: `User **${discordUser.tag}** has been added to the blacklist, but no account was found in the database.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `User **${discordUser.tag}** has been successfully added to the blacklist and their account has been deleted.`,
                    ephemeral: true
                });
            }

            const logsChannelId = '1302412504781291573'; 
            const logsChannel = client.channels.cache.get(logsChannelId);
            
            if (logsChannel) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) 
                    .setTitle('User Blacklisted')
                    .setDescription(`A Discord account has been added to the blacklist.`)
                    .addFields(
                        { name: 'Username', value: discordUser.username, inline: true },
                        { name: 'Discord Tag', value: discordUser.tag, inline: true },
                        { name: 'Discord ID', value: discordUser.id, inline: true },
                        { name: 'Account', value: accountName, inline: true },
                        { name: 'Email', value: emailDiscord, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Banned by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
                
                logsChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error processing your request. Please try again later.',
                ephemeral: true
            });
        }
    }
};
