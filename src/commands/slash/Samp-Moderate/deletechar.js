const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
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
        .setName('deletechar')
        .setDescription('Menghapus Character Dari Game')
        .addStringOption(option =>
            option.setName('namakarakter')
                .setDescription('The name of the character to delete')
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
        const characterName = interaction.options.getString('namakarakter');

        // Check if the user has Administrator permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        try {
            const connection = await pool.getConnection();

            // Check if the character exists
            const [rows] = await connection.query('SELECT Username FROM users WHERE Username = ?', [characterName]);
            if (rows.length === 0) {
                connection.release();
                return interaction.reply({
                    content: `Character **${characterName}** not found in the database.`,
                    ephemeral: true
                });
            }

            // Delete the character
            await connection.query('DELETE FROM users WHERE Username = ?', [characterName]);
            connection.release();

            interaction.reply({
                content: `Character **${characterName}** has been successfully deleted.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error deleting the character. Please try again later.',
                ephemeral: true
            });
        }
    }
};
