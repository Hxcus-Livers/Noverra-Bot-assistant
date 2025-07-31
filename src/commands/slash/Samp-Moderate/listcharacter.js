const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        .setName('listcharacter')
        .setDescription('Menampilkan List Character')   
        .addStringOption((option) =>
            option
              .setName("ucp")
              .setDescription("Masukkan UCP target.")
              .setRequired(true)  // Make the option required
        ),    
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            // Check for Administrator permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true 
                });
            }

            // Fetch character list from the database
            const UCPName = interaction.options.getString("ucp");
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM `characters` WHERE `Username` = ? LIMIT 3', [UCPName]);

            if (rows.length === 0) {
                return interaction.reply({
                    content: 'No characters found in the database.',
                    ephemeral: true
                });
            }

            // Pagination setup
            const pageSize = 5; // Characters per page
            let page = 0;

            // Function to create the embed with character list for a given page
            const createEmbed = (page) => {
                const start = page * pageSize;
                const end = start + pageSize;
                const characterList = rows.slice(start, end)
                    .map((row, index) => `${start + index + 1}. ${row.Character}`)
                    .join('\n');

                return new EmbedBuilder()
                    .setTitle(`CHARACTER LIST OF ${UCPName}`)
                    .setDescription(characterList)
                    .setColor(0x00AE86)
                    .setTimestamp();
            };

            // Send the initial message
            const message = await interaction.reply({
                embeds: [createEmbed(page)],
                components: [row],
                ephemeral: true,
                fetchReply: true
            });

            // Collector for button interactions
            const collector = message.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ content: 'You cannot control this pagination.', ephemeral: true });
                }

                // Update page based on button click
                if (buttonInteraction.customId === 'previous' && page > 0) {
                    page--;
                } else if (buttonInteraction.customId === 'next' && page < Math.ceil(rows.length / pageSize) - 1) {
                    page++;
                }

                // Update the embed and buttons based on new page
                await buttonInteraction.update({
                    embeds: [createEmbed(page)],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('previous')
                                    .setLabel('⬅️ Previous')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(page === 0),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('➡️ Next')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(page === Math.ceil(rows.length / pageSize) - 1)
                            )
                    ]
                });
            });

            // End collector after 60 seconds
            collector.on('end', () => {
                interaction.editReply({ components: [] });
            });
        } catch (error) {
            console.error('Database Error:', error);
            interaction.reply({
                content: 'There was an error fetching the character list. Please try again later.',
                ephemeral: true
            });
        }
    }
};
