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
        .setName('resetplayinghours')
        .setDescription('Reset playing hours untuk karakter dengan jam main lebih dari 15 jam'),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
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
                content: 'Anda tidak memiliki izin untuk menggunakan perintah ini.',
                ephemeral: true
            });
        }

        try {
            // Defer reply karena query database bisa memakan waktu
            await interaction.deferReply({ ephemeral: true });
            
            const connection = await pool.getConnection();

            // Query untuk menghitung berapa karakter yang akan di-reset
            const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM characters WHERE PlayingHours > 15');
            const affectedCount = countResult[0].count;
            
            // Query untuk reset playing hours
            const [result] = await connection.execute('UPDATE characters SET PlayingHours = 10 WHERE PlayingHours > 15');
            connection.release();

            if (result.affectedRows > 0) {
                interaction.editReply({
                    content: `Berhasil mereset playing hours untuk ${result.affectedRows} karakter dari > 15 jam menjadi 10 jam.`,
                });
            } else {
                interaction.editReply({
                    content: 'Tidak ada karakter yang memiliki playing hours lebih dari 15 jam.',
                });
            }

        } catch (error) {
            console.error('Database Error:', error);
            interaction.editReply({
                content: 'Terjadi kesalahan saat mencoba mereset playing hours. Silakan coba lagi nanti.',
            });
        }
    }
};