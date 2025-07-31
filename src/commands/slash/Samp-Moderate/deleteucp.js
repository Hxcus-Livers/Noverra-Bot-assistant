const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

const pool = mysql.createPool({
    connectionLimit: config.mysql.connectionLimit,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
});

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('deleteucp')
        .setDescription('Menghapus UCP Member')
        .addStringOption(option =>
            option.setName('ucp')
                .setDescription('The UCP name to delete')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('discord')
                .setDescription('The Discord user to delete (uses their Discord ID)')
                .setRequired(false)
        ),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const ucpName = interaction.options.getString('ucp');
        const discordUser = interaction.options.getUser('discord');
        
        const allowedRoleIds = [
            '1297104626616897578',
            '1292799486455844911',
            '1292799486455844910',
            '1292799486455844909'
        ];

        const memberRoles = interaction.member.roles.cache;
        const hasPermission = allowedRoleIds.some(roleId => memberRoles.has(roleId));

        if (!hasPermission) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        if (!ucpName && !discordUser) {
            return interaction.reply({
                content: 'You need to provide either a UCP name or a Discord user to delete.',
                ephemeral: true
            });
        }

        try {
            const connection = await pool.getConnection();

            let query = 'DELETE FROM accounts WHERE';
            let queryParams = [];

            if (ucpName) {
                query += ' Username = ?';
                queryParams.push(ucpName);
            }

            if (discordUser) {
                if (ucpName) {
                    query += ' OR';
                }
                query += ' DiscordID = ?';
                queryParams.push(discordUser.id);
            }

            const [result] = await connection.execute(query, queryParams);
            connection.release();

            if (result.affectedRows > 0) {
                interaction.reply({
                    content: `Successfully deleted ${result.affectedRows} account(s) from the database.`,
                    ephemeral: true
                });
            } else {
                interaction.reply({
                    content: 'No matching accounts found in the database to delete.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error while trying to delete the account. Please try again later.',
                ephemeral: true
            });
        }
    }
};
