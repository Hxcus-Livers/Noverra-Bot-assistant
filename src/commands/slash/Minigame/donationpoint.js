const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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

// Role IDs yang diizinkan menggunakan perintah ini
const ALLOWED_ROLE_IDS = [
    '1222520440979849242',  // Owner
    '1222520440979849241',  // CEO Owner
    '1222855436181442610',  // Founder
    '1246454442497151038'   // Developer
];

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('donationpoint')
        .setDescription('Melihat jumlah Donation Point yang dimiliki user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Pilih user yang ingin dilihat Donation Point-nya')
                .setRequired(false)
        ),
    options: {
        cooldown: 3000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        // Periksa apakah pengguna memiliki role yang diizinkan
        const memberRoles = interaction.member.roles.cache;
        const hasPermission = memberRoles.some(role => ALLOWED_ROLE_IDS.includes(role.id));

        // Tentukan user target
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetUserId = targetUser.id;
        
        // Get the GuildMember object to access nickname
        const targetMember = interaction.options.getMember('user') || interaction.member;
        
        // Use nickname if available, otherwise fall back to username
        const displayName = targetMember.nickname || targetUser.username;

        // Jika target user bukan diri sendiri, periksa izin
        if (targetUser.id !== interaction.user.id && !hasPermission) {
            return interaction.editReply({
                content: 'Anda tidak memiliki izin untuk melihat Donation Point milik user lain.',
            });
        }

        try {
            const connection = await pool.getConnection();

            const [rows] = await connection.execute(
                'SELECT DonatePoint FROM accounts WHERE DiscordID = ?',
                [targetUserId]
            );

            connection.release();

            if (rows.length === 0) {
                return interaction.editReply({
                    content: `${targetUser.id === interaction.user.id ? 'Anda' : 'User tersebut'} tidak memiliki akun yang terdaftar dengan Discord ID ini.`,
                });
            }

            const donationPoints = rows[0].DonatePoint;
            
            // Format pesan menggunakan nickname
            const formattedMessage = `**<:donationpoint:1345157489599189117> | ${displayName}**, you currently have **${donationPoints.toLocaleString()} DonatePoint!**`;

            return interaction.editReply({
                content: formattedMessage,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in donationpoint command:', error);
            return interaction.editReply({
                content: 'Terjadi kesalahan saat mengambil data Donation Point. Silakan coba lagi nanti.',
            });
        }
    }
};