const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
        .setName('listucp')
        .setDescription('Menampilkan daftar UCP dari database dengan navigasi.'),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            // Fetch usernames from the database
            pool.query('SELECT Username FROM accounts', async (error, results) => {
                if (error) {
                    console.error('Error fetching UCP list:', error);
                    return interaction.reply({
                        content: 'Terjadi kesalahan saat mengambil daftar UCP. Silakan coba lagi nanti.',
                        ephemeral: true
                    });
                }

                const usernames = results.map(row => row.Username);
                const pageSize = 8; // Number of usernames per page
                let page = 0;

                // Function to create an embed based on the current page
                const createEmbed = (page) => {
                    const start = page * pageSize;
                    const end = start + pageSize;
                    const paginatedUsernames = usernames.slice(start, end).join('\n');

                    return new EmbedBuilder()
                        .setTitle('📋 Daftar UCP')
                        .setDescription(paginatedUsernames ? `**UCP Usernames:**\n\n\`\`\`${paginatedUsernames}\`\`\`` : 'Tidak ada UCP yang ditemukan di database.')
                        .setColor('Blue')
                        .setFooter({ text: `Noverra Roleplay - Halaman ${page + 1} dari ${Math.ceil(usernames.length / pageSize)}`, iconURL: client.user.displayAvatarURL() })
                        .setTimestamp();
                };

                // Create buttons for navigation
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('⬅️ Sebelumnya')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('➡️ Selanjutnya')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(usernames.length <= pageSize)
                    );

                // Send initial message with first page and navigation buttons
                const message = await interaction.reply({
                    embeds: [createEmbed(page)],
                    components: [row],
                    ephemeral: false,
                    fetchReply: true
                });

                // Button interaction collector
                const collector = message.createMessageComponentCollector({ time: 60000 });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return buttonInteraction.reply({ content: 'Anda tidak dapat mengontrol pagination ini.', ephemeral: true });
                    }

                    // Handle button presses
                    if (buttonInteraction.customId === 'previous' && page > 0) {
                        page--;
                    } else if (buttonInteraction.customId === 'next' && page < Math.ceil(usernames.length / pageSize) - 1) {
                        page++;
                    }

                    // Update the embed and buttons based on the new page
                    await buttonInteraction.update({
                        embeds: [createEmbed(page)],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('previous')
                                        .setLabel('⬅️ Sebelumnya')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(page === 0),
                                    new ButtonBuilder()
                                        .setCustomId('next')
                                        .setLabel('➡️ Selanjutnya')
                                        .setStyle(ButtonStyle.Primary)
                                        .setDisabled(page === Math.ceil(usernames.length / pageSize) - 1)
                                )
                        ]
                    });
                });

                // End collector after 60 seconds
                collector.on('end', () => {
                    interaction.editReply({ components: [] });
                });
            });
        } catch (error) {
            console.error('Error handling command:', error);
            await interaction.reply({
                content: 'Terjadi kesalahan tak terduga saat menjalankan perintah. Silakan coba lagi nanti.',
                ephemeral: true
            });
        }
    }
};
