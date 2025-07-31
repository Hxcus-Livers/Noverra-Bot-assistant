const {
    ButtonInteraction,
    EmbedBuilder,
} = require('discord.js');

const ExtendedClient = require('../../class/ExtendedClient');
const crypto = require('crypto');
const mysql = require('mysql2');
const { IntSucces, IntError } = require('../../../functions');
const config = require('../../../config');

const MysqlMortal = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
}).promise();

module.exports = {
    customId: 'ModalChangePassword',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        if (interaction.customId === 'ModalChangePassword') {
            const newPasswordInput = interaction.fields.getTextInputValue('newPasswordInput');
            const confirmPasswordInput = interaction.fields.getTextInputValue('confirmPasswordInput');

            // Validasi password baru
            if (!newPasswordInput || !confirmPasswordInput) {
                return IntError(interaction, 'Password Baru Tidak Valid\nMohon masukkan password baru yang valid.');
            }

            // Validasi kecocokan password
            if (newPasswordInput !== confirmPasswordInput) {
                return IntError(interaction, 'Password baru dan konfirmasi password tidak cocok. Silakan coba lagi.');
            }

            // Mendapatkan data akun user berdasarkan Discord ID
            const [rows, fields] = await MysqlMortal.execute(
                'SELECT * FROM accounts WHERE DiscordID = ? LIMIT 1',
                [interaction.user.id]
            );

            if (rows.length === 0) {
                return IntError(interaction, 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
            }

            // Generate a random salt
            const salt = '78sdjs86d2h';
            const hashedNewPassword = SHA256_PassHash(newPasswordInput, salt);
            
            const [updateRows, updateFields] = await MysqlMortal.execute(
                `UPDATE accounts SET Password = ?, salt = ?, regucp = 1 WHERE DiscordID = ?`,
                [hashedNewPassword, salt, interaction.user.id]
            );

            if (updateRows.affectedRows === 0) {
                return IntError(interaction, 'Terjadi kesalahan saat mengubah password.');
            } else {
                // Berhasil mengubah password
                return IntSucces(interaction, ':white_check_mark: Password Anda berhasil diubah.');
            }

            function SHA256_PassHash(password, salt) {
                const hash = crypto.createHash('sha256');
                hash.update(password + salt);
                return hash.digest('hex').toUpperCase();
            }
        }
    }
};