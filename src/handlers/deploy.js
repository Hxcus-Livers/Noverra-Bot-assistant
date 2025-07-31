const { REST, Routes } = require("discord.js");
const { log, isSnowflake } = require("../../functions");
const config = require("../../config");
const ExtendedClient = require("../class/ExtendedClient");
const chalk = require('chalk'); // Perubahan di sini
const moment = require('moment');

/**
 *
 * @param {ExtendedClient} client
 */
module.exports = async (client) => {
    const rest = new REST({ version: "10" }).setToken(
        config.client.token
    );

    try {
        const log = (message, level = 'info') => {
            const colors = {
                info: chalk.cyan,
                warn: chalk.yellow,
                error: chalk.red,
                ready: chalk.green,
                event: chalk.blue, // Menambahkan warna biru untuk level 'event'
            };
        
            const levels = {
                info: 'INFO',
                warn: 'WARN',
                error: 'ERROR',
                ready: 'READY',
                event: 'EVENTS',
            };
        
            // Memeriksa apakah level valid
            if (!colors[level]) {
                console.error(`Invalid log level: ${level}`);
                return;
            }
        
            const timestamp = chalk.bgBlue.bold(moment().format('dddd - DD/MM/YYYY - HH:mm:ss'));
            const formattedMessage = `[${timestamp}] [${colors[level](levels[level])}] ${colors[level](message)}`;
        
            console.log(formattedMessage);
        };

        log("Started loading application commands... (this might take minutes!)", "warn");

        const guildId = config.client.guild;

        if (config.development && config.development.enabled && guildId) {
            if (!isSnowflake(guildId)) {
                log("Guild ID is missing. Please set it in .env or config file or disable development in the config", "error");
                return;
            };

            await rest.put(
                Routes.applicationGuildCommands(config.client.id, guildId), {
                    body: client.applicationcommandsArray,
                }
            );

            log(`Successfully loaded application commands to guild ${guildId}.`, "ready");
        } else {
            await rest.put(
                Routes.applicationCommands(config.client.id), {
                    body: client.applicationcommandsArray,
                }
            );

            log("Successfully loaded application commands globally to Discord API.", "ready");
        }
    } catch (e) {
        log(`Unable to load application commands to Discord API: ${e.message}`, "error");
    }
};
