const { Message, EmbedBuilder } = require('discord.js');
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
    structure: {
        name: 'dpoint',
        description: 'Melihat jumlah Donation Point yang Anda miliki',
        aliases: ['dp'],
        cooldown: 15
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        try {
            const userId = message.author.id;
            const targetUser = message.mentions.users.first() || message.author;

            const connection = await pool.getConnection();

            const [rows] = await connection.execute(
                'SELECT DonatePoint FROM accounts WHERE DiscordID = ?',
                [targetUser.id]
            );

            connection.release();

            if (rows.length === 0) {
                return message.reply({
                    content: `${targetUser.id === message.author.id ? 'Anda' : 'User tersebut'} tidak memiliki akun yang terdaftar dengan Discord ID ini.`,
                });
            }

            const donationPoints = rows[0].DonatePoint;

            const displayName = message.guild?.members.cache.get(targetUser.id)?.nickname || targetUser.username;

            const formattedMessage = `**<:donationpoint:1345157489599189117> | ${displayName}**, you currently have **${donationPoints.toLocaleString()} DonatePoint!**`;

            return message.reply({
                content: formattedMessage
            });

        } catch (error) {
            console.error('Error in donationpoint command:', error);
            return message.reply({
                content: 'Terjadi kesalahan saat mengambil data Donation Point. Silakan coba lagi nanti.',
            });
        }
    }
};
