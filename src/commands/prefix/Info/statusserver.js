const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const gamedig = require('gamedig');
const AsciiTable = require('ascii-table'); // Assuming this library is used for formatting tables

module.exports = {
    structure: {
        name: 'status-server',
        description: 'Get information about server samp. **(Only Admin)**',
        aliases: ['s'],
        permissions: PermissionsBitField.Flags.Administrator
    },
    
    run: async (client, message, args) => {
        const serverIp = '104.234.180.199';
        const serverPort = 7003;

        let statusMessage = null;
        let response = null;

        async function updateServerStatus() {
            try {
                response = await gamedig.query({
                    type: 'samp',
                    host: serverIp,
                    port: serverPort
                });

                const isOnline = response && response.raw;

                let embed;

                // Existing code...

                // Inside the try block, after querying the server
                if (response.players.length > 0) {
                    if (response.players.length > 100) {
                        embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle(`**${response.name}**`)
                            .addFields({ name: 'PLAYERS LIST', value: '*Number of players is greater than 100. I cannot list them!*' });
                    } else {
                        const playerTable = new AsciiTable()
                            .setHeading('Name', 'Score', 'Ping')
                            .setAlign(0, AsciiTable.CENTER)
                            .setAlign(1, AsciiTable.LEFT)
                            .setAlign(2, AsciiTable.CENTER)
                            .setBorder('|', '-', '+', '+');

                        response.players.slice(0, 5).forEach(player => {
                            playerTable.addRow(player.name, player.raw.score, player.raw.ping);
                        });

                        const playerTableString = '```\n' + playerTable + '```';

                        const { name, players, maxplayers, raw } = response;
                        const isOnline = players && players.length > 0;

                        console.log('Is server online?', isOnline);

                        embed = new EmbedBuilder()
                            .setTitle(`${name}`)
                            .setColor(isOnline ? '#00ff00' : '#ff0000')
                            .addFields(
                                { name: 'IP:PORT', value: `\`\`\`${serverIp || 'Unknown'}:${serverPort || 'Unknown'}\`\`\``, inline: false },
                                { name: 'Status', value: isOnline ? '\`\`\`✅ Online\`\`\`' : '\`\`\`❎ Offline\`\`\`', inline: true },
                                { name: 'Players', value: `\`\`\`${players.length}/${maxplayers}\`\`\``, inline: true },
                                { name: 'Version', value: `\`\`\`${raw.rules.version}\`\`\``, inline: true },
                                { name: 'Current Players', value: playerTableString, inline: true },
                            )
                            .setTimestamp(new Date)

                        // Add the current players to the embed
                       /* if (isOnline) {
                            embed.addFields({ name: 'Current Players', value: playerTableString });
                        }*/
                    }
                } else {

                    const emptyPlayerTableString = '```\n|       Player is Empty         |\n+-------------------------------+```';

                    embed = new EmbedBuilder()
                    .setTitle(`${response.name}`)
                    .setColor(isOnline ? '#00ff00' : '#ff0000')
                    .addFields(
                        { name: 'IP:PORT', value: `\`\`\`${serverIp || 'Unknown'}:${serverPort || 'Unknown'}\`\`\``, inline: false },
                        { name: 'Status', value: isOnline ? '\`\`\`✅ Online\`\`\`' : '\`\`\`❎ Offline\`\`\`', inline: true },
                        { name: 'Players', value: `\`\`\`${response.players.length}/${response.maxplayers}\`\`\``, inline: true },
                        { name: 'Version', value: `\`\`\`${response.raw.rules.version}\`\`\``, inline: true },
                        { name: 'Current Players', value: isOnline ? emptyPlayerTableString : 'N/A', inline: true },
                    )
                    .setTimestamp(new Date)                

                }

                if (!statusMessage) {
                    statusMessage = await message.channel.send({ embeds: [embed] });
                } else {
                    await statusMessage.edit({ embeds: [embed] });
                }

                setTimeout(updateServerStatus, 1000);
            } catch (error) {
                console.error(error);

                const offlineEmbed = new EmbedBuilder()
                .setTitle('Paradox Server Status')
                .setDescription(`${response ? response.name : 'Server'}`)
                .setColor('#ff0000')
                .addFields(
                    { name: 'IP:PORT', value: `\`\`\`${serverIp || 'Unknown'}:${serverPort || 'Unknown'}\`\`\``, inline: false },
                    { name: 'Status', value: '\`\`\`❎ Offline\`\`\`', inline: true },
                    { name: 'Players', value: '\`\`\`Unknown\`\`\`', inline: true },
                    { name: 'Version', value: `\`\`\`Unknown\`\`\``, inline: true },
                    { name: 'Current Players', value: 'N/A', inline: true },
                )
                .setTimestamp(new Date)

                if (!statusMessage) {
                    statusMessage = await message.channel.send({ embeds: [offlineEmbed] });
                } else {
                    await statusMessage.edit({ embeds: [offlineEmbed] });
                }

                setTimeout(updateServerStatus, 1000);
            }
        }

        updateServerStatus();
    }
};
