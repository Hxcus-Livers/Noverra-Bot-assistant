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
        .setName('setmoney')
        .setDescription('Menyetting Jumlah Uang Di Dalam Server')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('The character name to set money for')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of money to set')
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
        const characterName = interaction.options.getString('character');
        const amount = interaction.options.getInteger('amount');

        const allowedRoleIds = [
            '1222520440979849242',  // Owner
            '1222520440979849241',  // CEO Owner
            '1222855436181442610',  // Founder
            '1246454442497151038'   // Developer
        ];

        const memberRoles = interaction.member.roles.cache;
        const hasPermission = allowedRoleIds.some(roleId => memberRoles.has(roleId));

        if (!hasPermission) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        try {
            const connection = await pool.getConnection();

            const query = 'UPDATE characters SET Money = ? WHERE `Character` = ?';
            const queryParams = [amount, characterName];

            const [result] = await connection.execute(query, queryParams);
            connection.release();

            if (result.affectedRows > 0) {
                interaction.reply({
                    content: `Successfully updated money for ${characterName} to ${amount}.`,
                    ephemeral: true
                });
            } else {
                interaction.reply({
                    content: 'No matching character found in the database to update.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error while trying to set the money. Please try again later.',
                ephemeral: true
            });
        }
    }
};
