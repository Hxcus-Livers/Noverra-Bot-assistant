const { ButtonInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const ms = require("ms");
const bcrypt = require('bcryptjs');
const config = require('../../../config');
const mysql = require('mysql2/promise');
const { IntSucces, IntError } = require('../../../functions');

const timeAccount = ms("0 days");

// Database connection pool
const pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
});

module.exports = {
    customId: 'button-register',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        const userid = interaction.user.id;
        const createdAt = new Date(interaction.user.createdAt).getTime();
        const detectDays = Date.now() - createdAt;

        if (detectDays < timeAccount) {
            return IntError(interaction, "Umur akun anda tidak mencukupi untuk mendaftar Akun UCP di server Local Pride Roleplay!");
        }

        try {
            // Check if user already registered
            const [row] = await pool.query('SELECT * FROM accounts WHERE DiscordID = ?', [userid]);

            if (row.length < 1) {
                const modal = new ModalBuilder()
                    .setTitle('Pendaftaran User Control Panel')
                    .setCustomId('modal-register')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setLabel('Isi Nama UCP Anda Di Bawah Ini')
                                .setCustomId('reg-name')
                                .setPlaceholder('Nama User Control Panel Anda')
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(4)
                                .setMaxLength(15)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setLabel('Isi Password Anda Di Bawah Ini')
                                .setCustomId('reg-password')
                                .setPlaceholder('Password Anda')
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(8)
                                .setMaxLength(24)
                                .setRequired(true)
                        )
                    );
                interaction.showModal(modal);
            } else {
                return IntError(interaction, `**REGISTRATION ACCOUNT**\n\nAnda sudah pernah mendaftar dengan nama **${row[0].Username}** dan tidak bisa lagi membuat akun ucp lagi.`);
            }
        } catch (error) {
            console.error('Error executing query:', error);
        }
    }
};