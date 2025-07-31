const { EmbedBuilder } = require('discord.js');
const chalk = require("chalk");

/**
 *
 * @param {string} string - The message to log.
 * @param {'info' | 'err' | 'warn' | 'done' | undefined} style - The style of the log.
 */
const log = (string, style) => {
  const styles = {
    info: { prefix: chalk.blue("[INFORMASI]"), logFunction: console.log },
    err: { prefix: chalk.red("[ERROR]"), logFunction: console.error },
    warn: { prefix: chalk.yellow("[WARNING]"), logFunction: console.warn },
    done: { prefix: chalk.green("[BERHASIL]"), logFunction: console.log },
  };
  
  const selectedStyle = styles[style] || { logFunction: console.log };
  selectedStyle.logFunction(`${selectedStyle.prefix || ""} ${string}`);
};

/**
 *
 * @param {number} time - The timestamp in milliseconds.
 * @param {import('discord.js').TimestampStylesString} style - The timestamp style.
 * @returns {string} - The formatted timestamp.
 */
const time = (time, style) => {
  return `<t:${Math.floor(time / 1000)}${style ? `:${style}` : ""}>`;
};

/**
 * @param {string} id 
 * @returns {boolean}
 */
const isSnowflake = (id) => {
  return /^\d+$/.test(id);
};

/**
 * @param {string} id 
 * @returns {boolean}
 */
 const IntSucces = async(interaction, args) => {
    const msgEmbed = new EmbedBuilder()
    .setDescription(args)
    .setColor('Green')
    .setFooter({ text: interaction.guild.name })
    .setTimestamp();
    
    if (interaction.replied || interaction.deferred) 
    {
      return interaction.editReply({ embeds: [msgEmbed], ephemeral: true })
    }
    else 
    {
      return interaction.reply({ embeds: [msgEmbed], ephemeral: true })
    }
}

/**
 * @param {string} id 
 * @returns {boolean}
 */
const IntError = async(interaction, args) => {
    const msgEmbed = new EmbedBuilder()
    .setDescription(args)
    .setColor('Red')
    
    if (interaction.replied || interaction.deferred) 
    {
      return interaction.editReply({ embeds: [msgEmbed], ephemeral: true })
    }
    else 
    {
      return interaction.reply({ embeds: [msgEmbed], ephemeral: true })
    }
    
}

/**
 * @param {string} id 
 * @returns {boolean}
 */
const IntUsage = async(interaction, args) => {
    const msgEmbed = new EmbedBuilder() 
    .setDescription(args)
    .setColor('Yellow')
    return interaction.reply({ embeds: [msgEmbed], ephemeral: true })
}

module.exports = {
  log,
  time,
  isSnowflake,
  IntSucces,
  IntError,
  IntUsage
};
