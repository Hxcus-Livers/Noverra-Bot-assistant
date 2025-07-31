const { readdirSync } = require('fs');
const { log } = require('../../functions');
const chalk = require('chalk');
const ExtendedClient = require('../class/ExtendedClient');
const moment = require('moment');
/**
 * 
 * @param {ExtendedClient} client 
 */
module.exports = (client) => {
    for (const dir of readdirSync('./src/components/')) {
        for (const file of readdirSync('./src/components/' + dir).filter((f) => f.endsWith('.js'))) {
            const module = require('../components/' + dir + '/' + file);

            if (!module) continue;

            if (dir === 'buttons') {
                if (!module.customId || !module.run) {
                    log('Unable to load the component ' + file + ' due to missing \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.buttons.set(module.customId, module);
            } else if (dir === 'selects') {
                if (!module.customId || !module.run) {
                    log('Unable to load the select menu ' + file + ' due to missing \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.selects.set(module.customId, module);
            } else if (dir === 'modals') {
                if (!module.customId || !module.run) {
                    log('Unable to load the modal ' + file + ' due to missing \'structure#customId\' or/and \'run\' properties.', 'warn');

                    continue;
                };

                client.collection.components.modals.set(module.customId, module);
            } else if (dir === 'autocomplete') {
                if (!module.commandName || !module.run) {
                    log(`Unable to load the autocomplete component ${file} due to missing 'commandName' or 'run' properties.`, 'warn');
                    continue;
                }
                
                client.collection.components.autocomplete.set(module.commandName, module);
            } else {
                log(`Invalid component type: ${file}`, 'warn');

                continue;
            }

            const log = (message, level = 'info') => {
                const colors = {
                  info: chalk.cyan,
                  warn: chalk.yellow,
                  error: chalk.red,
                  timestamp: chalk.blue,
                  ready: chalk.green,
                  components: chalk.green,
                };
              
                const levels = {
                  info: 'INFO',
                  warn: 'WARN',
                  error: 'ERROR',
                  ready: 'READY',
                  components: 'COMPONENTS',
                };
              
                const timestamp = chalk.bgBlue.bold(moment().format('dddd - DD/MM/YYYY - HH:mm:ss'));
                const formattedMessage = `[${timestamp}] [${colors[level](levels[level])}] ${colors[level](message)}`;
              
                console.log(formattedMessage);
              };

            log(chalk.blueBright('Loaded new component: ' + file), 'components');
        }
    }
};
