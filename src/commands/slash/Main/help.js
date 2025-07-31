const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan Daftar Command Yang Tersedia'),
    options: {
        cooldown: 15000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {

        let prefix = config.handler.prefix;

        const mapIntCmds = client.applicationcommandsArray.map((v) =>
            `\`${(v.type === 2 || v.type === 3) ? '' : '/'}${v.name}\`: ${v.description || '(No description)'}`);

        const mapPreCmds = client.collection.prefixcommands.map((v) =>
            `\`${prefix}${v.structure.name}\` (${v.structure.aliases.length > 0 ? v.structure.aliases.map((a) => `**${a}**`).join(', ') : 'None'}): ${v.structure.description || '(No description)'}`);

        const generateEmbed = (category) => {
            const fields = [];

            if (category === 'slash') {
                const chunkedSlashCommands = chunkArray(mapIntCmds, 1024 / 100); 
                chunkedSlashCommands.forEach((chunk, index) => {
                    fields.push({
                        name: `Slash Commands (Page ${index + 1})`,
                        value: chunk || 'No slash commands available.',
                    });
                });
            } else if (category === 'prefix') {
                const chunkedPrefixCommands = chunkArray(mapPreCmds, 1024 / 100);
                chunkedPrefixCommands.forEach((chunk, index) => {
                    fields.push({
                        name: `Prefix Commands (Page ${index + 1})`,
                        value: chunk || 'No prefix commands available.',
                    });
                });
            }

            return new EmbedBuilder()
                .setTitle('Help Command')
                .addFields(fields)
                .setColor('Blue')
                .setFooter({ text: `${config.servers.name}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
        };

        await interaction.reply({
            content: 'Please select a command category:',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('slash_commands')
                        .setLabel('Slash Commands')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('prefix_commands')
                        .setLabel('Prefix Commands')
                        .setStyle(ButtonStyle.Secondary)
                )
            ],
            ephemeral: true
        });

        const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'You cannot interact with this button.', ephemeral: true });
            }

            let embed;
            let row;

            if (i.customId === 'slash_commands') {
                embed = generateEmbed('slash');
                row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prefix_commands')
                            .setLabel('Switch to Prefix Commands')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await i.update({ content: null, embeds: [embed], components: [row], ephemeral: true });
            } else if (i.customId === 'prefix_commands') {
                embed = generateEmbed('prefix');
                row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('slash_commands')
                            .setLabel('Switch to Slash Commands')
                            .setStyle(ButtonStyle.Primary)
                    );

                await i.update({ content: null, embeds: [embed], components: [row], ephemeral: true });
            }
        });

        collector.on('end', async collected => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('slash_commands')
                        .setLabel('Slash Commands')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('prefix_commands')
                        .setLabel('Prefix Commands')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            await interaction.editReply({ components: [disabledRow] }).catch(console.error);
        });
    }
};

/**
 * Utility function to chunk an array into smaller arrays of a specific size.
 * @param {Array} arr - The array to chunk.
 * @param {number} size - The size of each chunk.
 * @returns {Array} - An array containing the chunks.
 */
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size).join('\n'));
    }
    return result;
}
