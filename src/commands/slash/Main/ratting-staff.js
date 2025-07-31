const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('rating')
        .setDescription('Memberikan Rating Kepada Staff Noverra Roleplay')
        .addUserOption(option =>
            option.setName('staff')
                .setDescription('Nama Staff')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('rating')
                .setDescription('Rating Staff')
                .setRequired(true)
                .addChoices(
                    { name: '⭐', value: '⭐' },
                    { name: '⭐⭐', value: '⭐⭐' },
                    { name: '⭐⭐⭐', value: '⭐⭐⭐' },
                    { name: '⭐⭐⭐⭐', value: '⭐⭐⭐⭐' },
                    { name: '⭐⭐⭐⭐⭐', value: '⭐⭐⭐⭐⭐' },
                )
        )
        .addStringOption(option =>
            option.setName('comment')
                .setDescription('Komentar untuk Staff')
                .setRequired(true)
        ),
    options: {
        cooldown: 5000 
    },
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const buyer = interaction.user;
        const staff = interaction.options.getUser('staff');
        const rating = interaction.options.getString('rating');
        const comment = interaction.options.getString('comment');

        // Periksa apakah pengguna yang dipilih memiliki role staff
        const staffMember = interaction.guild.members.cache.get(staff.id);
        
        if (!staffMember || !staffMember.roles.cache.has('1396418332667805697')) {
            return interaction.reply({
                content: 'Pengguna yang dipilih bukan staff. Silakan pilih pengguna dengan role staff.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Rating staff')
            .addFields(
                { name: 'Nama Warga', value: buyer.toString(), inline: true },
                { name: 'Nama Staff', value: staff.toString(), inline: true },
                { name: 'Rating', value: rating, inline: true },
                { name: 'Komentar Warga', value: comment, inline: false }
            )
            .setColor(0x00CDFF)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};