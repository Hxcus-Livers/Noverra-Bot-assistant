const { log } = require("../../functions");
const ExtendedClient = require('../../class/ExtendedClient');
const { ActivityType } = require("discord.js");
const samp = require('samp-query');
const winston = require('winston');
const figlet = require('figlet');
const moment = require('moment');
const chalk = require('chalk');
const Table = require('cli-table3');
const af = require('../../../package.json');
const config = require('../../../config');

module.exports = {
    event: 'ready',
    once: true,
    /**
     * 
     * @param {ExtendedClient} _ 
     * @param {import('discord.js').Client<true>} client 
     * @returns 
     */
    run: (_, client) => {
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
          
        const logTable = (data) => {
            const table = new Table({
                head: ['Name', 'Values'],
                colWidths: [15, 25],
            });
        
            Object.entries(data).forEach(([name, value]) => {
                table.push([name, value]);
            });
        
            console.log(table.toString());
        };
          
        // Penggunaan
        log('Logging into Discord...', 'info');
        const discordJSVersion = af.dependencies["discord.js"];
        const botInfo = {
            'Name': client.user.tag,
            'Author': `${af.author}`,
            'Discord.js': discordJSVersion,
            'Node.js': `${process.version}`,
            'Guilds': `${client.guilds.cache.size}`,
            'Users': `${client.users.cache.size}`,
            'Channels': `${client.channels.cache.size}`,
        };
        // Penggunaan
        log(client.user.tag + ' is online!', 'ready');
        logTable(botInfo);

        UpdateStatus();setInterval(UpdateStatus,10000)

        // Tambahkan aktivitas ke bot
        function UpdateStatus() {
            // Get server config
            const serverIp = config.server?.ip;
            const serverPort = parseInt(config.server?.port);
            const serverName = config.servers?.name || 'Noverra Roleplay';
            const serverPrefix = config.servers?.nickname_prefix || 'NOV-RP';

            const Options = {
                host: serverIp,
                port: serverPort
            }
            let status;
            samp(Options, function(error, response) {
                if(error)
                {
                    // console.error("Error querying SAMP server:", error); // Menambahkan log error
                    status = `${serverName}: Offline`;
                    client.user.setActivity(status, { type: ActivityType.Custom });
                } else {
                    status = `${serverPrefix} (${response['online']}/${response['maxplayers']} Players)`;
                    client.user.setActivity(status, {type: ActivityType.Custom });
                }
            })
    
        }
}
}