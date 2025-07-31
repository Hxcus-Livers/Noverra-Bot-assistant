const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('auditlogs')
        .setDescription('Membaca Semua Aktivitas Di Server Discord'),
    options: {
        cooldown: 15000
    },

    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const { guild } = interaction;

        if (!guild) {
            return interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
        }

        if (!member.permissions.has('Administrator')) {
            return interaction.reply({
                content: 'You need Administrator permissions to use this command.',
                ephemeral: true,
            });
        }

        let currentPage = 0;
        const pageSize = 5;
        let lastLogId = null; 

        const fetchAuditLogs = async (beforeId = null) => {
            try {
                const auditLogs = await guild.fetchAuditLogs({
                    limit: pageSize,
                    before: beforeId || undefined, 
                });

                const logEntries = auditLogs.entries.map((entry) => {
                    const { executor, target, action, reason } = entry;
                    return {
                        name: `Action: ${action}`,
                        value: `**Executor**: ${executor.tag}\n**Target**: ${target?.tag || target?.id || 'Unknown'}\n**Reason**: ${reason || 'No reason provided'}`,
                    };
                });

                lastLogId = auditLogs.entries.last()?.id; 

                const hasMoreLogs = auditLogs.entries.size === pageSize;

                const auditEmbed = new EmbedBuilder()
                    .setTitle('Server Audit Logs')
                    .setDescription('Here are the recent audit logs.')
                    .addFields(logEntries.length > 0 ? logEntries : [{ name: 'No Logs Found', value: 'No recent audit logs found.' }])
                    .setColor('Blue')
                    .setFooter({ text: `Page ${currentPage + 1}`, iconURL: guild.iconURL() })
                    .setTimestamp();

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!hasMoreLogs)
                    );

                await interaction.editReply({
                    embeds: [auditEmbed],
                    components: [buttons],
                    ephemeral: true,
                });
            } catch (error) {
                console.error(error);
                await interaction.editReply({
                    content: 'There was an error fetching the audit logs.',
                    ephemeral: true,
                });
            }
        };

        await interaction.reply({
            content: 'Fetching audit logs...',
            ephemeral: true,
        });
        await fetchAuditLogs();

        const filter = (i) => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'previous') {
                currentPage--;
                await fetchAuditLogs(); 
            } else if (i.customId === 'next') {
                currentPage++;
                await fetchAuditLogs(lastLogId); 
            }

            await i.deferUpdate();
        });

        collector.on('end', async () => {
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );

            await interaction.editReply({
                components: [buttons],
            });
        });
    },
};
