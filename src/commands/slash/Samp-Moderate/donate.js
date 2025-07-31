const { ChatInputCommandInteraction, ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('donation')
        .setDescription('Menampilkan Daftar Harga Donasi Dan Benefitnya'),
    options: {
        // ownerOnly: true,
        developers: true
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const msgEmbed = new EmbedBuilder()
            .setTitle('Noverra Roleplay | Donate Menu')
            .setImage(config.icon.image)
            .setDescription(`🟢 **Support our community!** \nClick the dropdown menu below to see the available donation packages and benefits.`)
            .setColor("#5CDFA1")
            .setFooter({ text: interaction.guild.name, iconURL: config.icon.thumbnail });

        const select = new StringSelectMenuBuilder()
			.setCustomId('donate-menu')
			.setPlaceholder('Select Donate')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('About Donate')
					.setDescription('About Donate Community')
					.setValue('AboutDonate')
                    .setEmoji('<:info:1345054495888900126>'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Packet Donate')
					.setDescription('Price Packet Donate')
					.setValue('PacketDonate')
                    .setEmoji('<:deliverybox:1345158943114002443>'),
                new StringSelectMenuOptionBuilder()
					.setLabel('House Donate')
					.setDescription('Price House Donate')
					.setValue('HouseDonate')
                    .setEmoji('<:house:1345054490436440124>'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Vehicle Donate')
					.setDescription('Price Vehicle Donate')
					.setValue('VehicleDonate')
                    .setEmoji('<:transport:1345054503157764270>'),
                new StringSelectMenuOptionBuilder()
					.setLabel('Other Donate')
					.setDescription('Price Other Donate')
					.setValue('OtherDonate')
                    .setEmoji('<:moreinformation:1345055793397104692>'),
            );
            const row = new ActionRowBuilder()
			.addComponents(select);

        await interaction.channel.send({ embeds: [msgEmbed], components: [row] });
        return interaction.reply({ content: "Sukses Membuat Embed List Donate", ephemeral: true });
    }
};
