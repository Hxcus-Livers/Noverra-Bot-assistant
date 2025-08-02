const { ButtonInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2');
const config = require('../../../config');
const { IntSucces, IntError } = require('../../../functions');
const crypto = require('crypto');

const MysqlMortal = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
}).promise();

module.exports = {
    customId: 'modal-register',
    /**
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            // await interaction.deferReply({ ephemeral: true });
            const userid = interaction.user.id;
            const inputName = interaction.fields.getTextInputValue('reg-name');
            const password = interaction.fields.getTextInputValue('reg-password');

            // Input validations
            if (inputName.includes("_")) return IntError(interaction, 'The User Control Panel account name cannot contain the "_" symbol.');
            if (inputName.includes(" ")) return IntError(interaction, 'The User Control Panel account name cannot contain spaces.');
            if (!/^[a-zA-Z]+$/.test(inputName)) return IntError(interaction, 'The User Control Panel account name can only contain letters!');

            // Check if the username already exists
            const [existingUser] = await MysqlMortal.query('SELECT * FROM accounts WHERE Username = ?', [inputName]);
            if (existingUser.length > 0) {
                return IntError(interaction, 'Sorry, the account name you entered is already registered. Please try a different account name.');
            }

            // Hash the password
            const hashedPassword = SHA256_PassHash(password, '78sdjs86d2h');

            // Register the user - directly set regucp to 1 (verified)
            await MysqlMortal.query(
                `INSERT INTO accounts SET Username = ?, DiscordID = ?, Password = ?, salt = '78sdjs86d2h', verifycode = '', regucp = ?, RegisterDate = NOW()`,
                [inputName, interaction.user.id, hashedPassword, 1]
            );

            // Get server address from config - dengan fallback jika tidak ada
            const serverAddress = config.server?.fullAddress || `${config.server?.ip || '208.84.103.75'}:${config.server?.port || '7116'}`;

            // Send confirmation message to user
            const member = interaction.member;
            const dmEmbed = new EmbedBuilder()
            .setColor('Green')
            .setAuthor({
              name: config.servers?.name || 'Noverra Roleplay',
              iconURL: config.icon.thumbnail
            })  
            .setDescription(`Hallo **${member}**!! Selamat akun **User Control Panel SA-MP** Anda telah berhasil terdaftar di ${config.servers?.name || 'Noverra Roleplay'}. Anda dapat langsung login ke dalam game. Selamat Bermain!\n
            **💠 Data Akun User Control Panel -**
        
            - \`Nama Akun\`: ${inputName}
            - \`IP Address\`: ${serverAddress}
            - \`Waktu Pendaftaran\`: <t:${Math.floor(new Date().getTime() / 1000)}:R>`)
            .setFooter({ text: `©️ ${config.servers?.name || 'Noverra Roleplay'}` })
            .setTimestamp();
            
            if (interaction.replied || interaction.deferred) 
            {
              interaction.editReply({ embeds: [dmEmbed], ephemeral: true })
            }
            else 
            {
              interaction.reply({ embeds: [dmEmbed], ephemeral: true })
            }

            // Assign role and update nickname
            try {
              const role = interaction.guild.roles.cache.get(config.idrole.ucp);
              const guildMember = await interaction.guild.members.fetch(interaction.member.id);
              await guildMember.roles.add(role);
              await guildMember.setNickname(`${config.servers?.nickname_prefix || '#NOV'} | ${inputName}`);
            } catch (error) {
              console.error('Error assigning role or updating nickname:', error);
            }

            // Log the registration in the specified channel
            const logChannelId = config.channel.registerLogs;
            const logChannel = client.channels.cache.get(logChannelId);

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("New UCP Registration")
                    .setColor('Blue')
                    .addFields(
                        { name: "UCP Name", value: inputName, inline: true },
                        { name: "Discord", value: interaction.user.tag, inline: true },
                        { name: "Discord ID", value: userid, inline: true },
                        { name: "Register Date", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        { name: "Server Address", value: serverAddress, inline: true }
                    )
                    .setFooter({ text: interaction.guild.name })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await IntError(interaction, 'An unexpected error occurred.');
            }
        }
    }
};

// Helper functions
function SHA256_PassHash(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex').toUpperCase();
}