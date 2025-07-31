const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const mysql = require('mysql2/promise');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');
const { table } = require('table');


const MysqlMortal = mysql.createPool({
    connectionLimit: config.mysql.connectionLimit,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
});

module.exports = {
  structure: new SlashCommandBuilder()
      .setName("inventory-inspect")
      .setDescription("Untuk melihat inventory dari character. [NEW]")
      .addStringOption((option) =>
          option
              .setName("firstname_lastname")
              .setDescription("Masukkan nama karakter.")
              .setRequired(true)  // Make the option required
      ),

    /**
    * @param {ExtendedClient} client
    * @param {ChatInputCommandInteraction} interaction
    */
   
  run: async (client, interaction) => {
      // Check if interaction is valid and has options
      if (!interaction || !interaction.options) {
          console.error('Invalid interaction object:', interaction);
          return await interaction.reply({ content: 'Invalid interaction.', ephemeral: true });
      }

      const characterName = interaction.options.getString("firstname_lastname");

      // Defer the reply only if it hasn't been deferred yet
      if (!interaction.replied) {
          await interaction.deferReply();
      }

      try {
          // Execute the SQL query to get the character information
          const [charRows] = await MysqlMortal.query('SELECT * FROM `characters` WHERE `Character` = ? LIMIT 1', [characterName]);

          // Check if character information was found
          if (charRows && charRows.length > 0) {
              const characterInfo = charRows[0];
              const characterId = characterInfo.ID;

              // Execute the SQL query to get the inventory information
              const [invRows] = await MysqlMortal.query('SELECT * FROM `inventory` WHERE `ID` = ?', [characterId]);

              // Check if inventory information was found
              if (invRows && invRows.length > 0) {
                  // Build an ASCII table
                  const inventoryItems = invRows.map(item => [item.invItem, item.invQuantity]);
                  const tableData = [['Nama Item', 'Jumlah'], ...inventoryItems];
                  const asciiTable = table(tableData, { columns: { 0: { alignment: 'left' }, 1: { alignment: 'right' } } });
                  
                  const embed = new EmbedBuilder()
                      .setColor('#00ff00')
                      .setTitle(`Inventory of ${characterName}`)
                      .setDescription(`\`\`\`${asciiTable}\`\`\``)

                  // Reply with the inventory information
                  await interaction.editReply({ embeds: [embed] });
              } else {
                  // No inventory information found
                  const errorEmbed = new EmbedBuilder()
                      .setColor('#ff0000')
                      .setTitle('Error')
                      .setDescription(`No inventory information found for ${characterName}.`);

                  await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
              }
          } else {
              // No character information found
              const errorEmbed = new EmbedBuilder()
                  .setColor('#ff0000')
                  .setTitle('Error')
                  .setDescription(`No character found with the name ${characterName}.`);

              await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
          }
      } catch (error) {
          console.error('Error executing SQL query:', error);
          const errorEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('Error')
              .setDescription('An error occurred while fetching the inventory information.');

          await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
      }
  }
};