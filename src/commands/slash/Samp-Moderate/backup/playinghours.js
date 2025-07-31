const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql');
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
        .setName('playinghours')
        .setDescription('Displays the top 10 characters with the most playing hours.'),
    options: {
        cooldown: 10
    },

    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: false });

            const query = 'SELECT `Username`, `Character` AS CharacterName, `PlayingHours`, `Minutes` FROM `characters` ORDER BY `PlayingHours` DESC, `Minutes` DESC LIMIT 10';

            pool.query(query, async (error, results) => {
                if (error) {
                    console.error('Error fetching playing hours:', error);
                    return interaction.editReply({
                        content: 'An error occurred while fetching playing hours. Please try again later.',
                        ephemeral: true
                    });
                }

                if (results.length === 0) {
                    return interaction.editReply({
                        content: 'No playing hours data found in the database.',
                        ephemeral: true
                    });
                }

                const formatPlayingTime = (hours, minutes) => `${hours} hours ${minutes} minutes`;

                const description = results.map((row, index) => (
                    `**${index + 1}.** ${row.CharacterName} (${row.Username})\n` +
                    `   » Playing Hours: ${formatPlayingTime(row.PlayingHours, row.Minutes)}\n`
                )).join('\n');

                const formatTimestamp = () => {
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const year = now.getFullYear();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    return `${day}/${month}/${year} - ${hours}:${minutes}`;
                };

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Top 10 Playing Hours')
                    .setDescription(description)
                    .setColor('Gold')
                    .setFooter({ text: `Noverra Roleplay • ${formatTimestamp()}`, iconURL: client.user.displayAvatarURL() });

                await interaction.editReply({ embeds: [embed] });
            });
        } catch (error) {
            console.error('Error handling command:', error);
            await interaction.editReply({
                content: 'An unexpected error occurred while executing the command. Please try again later.',
                ephemeral: true
            });
        }
    }
};