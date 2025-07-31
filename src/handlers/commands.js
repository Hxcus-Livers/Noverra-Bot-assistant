const { readdirSync } = require('fs');
// const { log } = require('../../functions'); // ❌ Dihapus agar tidak bentrok
const ExtendedClient = require('../class/ExtendedClient');
const chalk = require('chalk');
const moment = require('moment');

/**
 * 
 * @param {ExtendedClient} client 
 */
module.exports = (client) => {
    // ✅ Deklarasi log dipindah ke atas
    const log = (message, level = 'info') => {
        const colors = {
            info: chalk.cyan,
            warn: chalk.yellow,
            error: chalk.red,
            timestamp: chalk.blue,
            command: chalk.green,
        };

        const levels = {
            info: 'INFO',
            warn: 'WARN',
            error: 'ERROR',
            command: 'COMMANDS',
        };

        const timestamp = chalk.bgBlue.bold(moment().format('dddd - DD/MM/YYYY - HH:mm:ss'));
        const formattedMessage = `[${timestamp}] [${colors[level](levels[level])}] ${colors[level](message)}`;

        console.log(formattedMessage);
    };

    for (const type of readdirSync('./src/commands/')) {
        for (const dir of readdirSync('./src/commands/' + type)) {
            for (const file of readdirSync('./src/commands/' + type + '/' + dir).filter((f) => f.endsWith('.js'))) {
                const module = require('../commands/' + type + '/' + dir + '/' + file);

                if (!module) continue;

                if (type === 'prefix') {
                    if (!module.structure?.name || !module.run) {
                        log('Unable to load the command ' + file + ' due to missing \'structure#name\' or/and \'run\' properties.', 'warn');
                        continue;
                    }

                    client.collection.prefixcommands.set(module.structure.name, module);

                    if (module.structure.aliases && Array.isArray(module.structure.aliases)) {
                        module.structure.aliases.forEach((alias) => {
                            client.collection.aliases.set(alias, module.structure.name);
                        });
                    }
                } else {
                    if (!module.structure?.name || !module.run) {
                        log('Unable to load the command ' + file + ' due to missing \'structure#name\' or/and \'run\' properties.', 'warn');
                        continue;
                    }

                    client.collection.interactioncommands.set(module.structure.name, module);
                    client.applicationcommandsArray.push(module.structure);
                }

                log(chalk.yellow.bold(`Loaded new command: ${file}`), 'command');
            }
        }
    }
};
