const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const ExtendedClient = require('../../../class/ExtendedClient');
const mysql = require('mysql2');
const config = require('../../../../config');

const MysqlMortal = mysql.createPool({
	host: config.mysql.host,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database,
}).promise();

module.exports = {
	structure: new SlashCommandBuilder()
		.setName("character-information")
		.setDescription("Mendapatkan informasi dari karakter.")
		.addStringOption((option) =>
			option
				.setName("charactername")
				.setDescription("Masukkan nama karakter.")
				.setRequired(true)  // Make the option required
		),
	options: {
		adminRole: true
	},

	run: async (client, interaction) => {
		const characterName = interaction.options.getString("charactername");

		await interaction.deferReply();
		
		try {
			// Execute the SQL query to get the character information
			const [rows] = await MysqlMortal.query('SELECT * FROM `characters` WHERE `Character` = ? LIMIT 1', [characterName]);

			// Check if character information was found
			if (rows && rows.length > 0) {
				const characterInfo = rows[0];
				
				const factionName = await getFactionName(characterInfo.Faction);

				// Calculate playing hours and minutes
				const totalMinutes = characterInfo.Minutes || 0;
				const hours = characterInfo.PlayingHours || 0;
				const minutes = totalMinutes % 60;
				const playingTime = `${hours}h ${minutes}m`;

				const embed = new EmbedBuilder()
					.setTitle(`Character Information of **${characterName}**`)
					.setColor(0x00ff2f)
					.setThumbnail(getSkinImageUrl(characterInfo.Skin))
					.addFields(
						{ name: "ID", value: `\`\`\`${characterInfo.ID}\`\`\``, inline: true },
						{ name: "Username", value: `\`\`\`${characterInfo.Username}\`\`\``, inline: true },
						{ name: "Playing Time", value: `\`\`\`${playingTime}\`\`\``, inline: true },
						{ name: "Birthdate", value: `\`\`\`${characterInfo.Birthdate}\`\`\``, inline: true },
						{ name: "Gender", value: `\`\`\`${characterInfo.Gender === 1 ? "Male" : "Female"}\`\`\``, inline: true },
						{ name: "Money", value: `\`\`\`$ ${characterInfo.Money.toLocaleString('en-US')}\`\`\``, inline: true },
						{ name: "Bank Money", value: `\`\`\`$ ${characterInfo.BankMoney.toLocaleString('en-US')}\`\`\``, inline: true },
						{ name: "Phone", value: `\`\`\`${characterInfo.Phone}\`\`\``, inline: true },
						{ name: "Faction", value: `\`\`\`${factionName}\`\`\``, inline: true },
						{ name: "Faction Rank", value: `\`\`\`${characterInfo.FactionRank}\`\`\``, inline: true },
						{ name: "Mask ID", value: `\`\`\`${characterInfo.MaskID}\`\`\``, inline: true },
						{ name: "Skin", value: `\`\`\`${characterInfo.Skin}\`\`\``, inline: true }
					)
					.setFooter({ text: `Requested by ${interaction.user.tag}.` });

				return await interaction.editReply({ embeds: [embed] });
			} else {
				// Reply with a message indicating no character information was found
				return await interaction.editReply({
					embeds: [
						new EmbedBuilder().setDescription(
							`Oops! No information found for the character ${characterName}.`
						).setColor("#e74c3c"),
					],
					ephemeral: true,
				});
			}
		} catch (error) {
			console.error('Error executing SQL query:', error);
			return await interaction.editReply({
				content: 'An error occurred while fetching the character information.',
				ephemeral: true,
			});
		} finally {
			// No need to close the connection since we're using a pool
		}
	},
};

// Function to map faction ID to faction name from database
async function getFactionName(factionId) {
	try {
		const [rows, fields] = await MysqlMortal.execute('SELECT factionName FROM factions WHERE factionID = ?', [factionId]);
		if (rows.length > 0) {
			return rows[0].factionName;
		} else {
			return "None";
		}
	} catch (error) {
		console.error('Error fetching faction name:', error);
		return "Error";
	}
}

// Function to get the URL of a skin image based on the skin ID
function getSkinImageUrl(skinId) {
	return `https://assets.open.mp/assets/images/skins/${skinId}.png`;
}