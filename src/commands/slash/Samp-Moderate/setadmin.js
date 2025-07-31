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
        .setName('setadmin')
        .setDescription('Untuk Menyetting Level Administrator Di Dalam Server')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The admin level to set (e.g., 1 for regular admin)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('ucp')
                .setDescription('The UCP name of the user to set as admin')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('discord')
                .setDescription('The Discord user to set as admin')
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
        const adminLevel = interaction.options.getInteger('level');
        
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
                content: 'You need to provide either a UCP name or a Discord user to set as admin.',
                ephemeral: true
            });
        }

        try {
            const connection = await pool.getConnection();

            let query = 'UPDATE accounts SET admin = ? WHERE';
            let queryParams = [adminLevel];

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
                    content: `Successfully set admin level ${adminLevel} for ${result.affectedRows} account(s).`,
                    ephemeral: true
                });
            } else {
                interaction.reply({
                    content: 'No matching accounts found in the database to update.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error while trying to set the admin level. Please try again later.',
                ephemeral: true
            });
        }
    }
};
