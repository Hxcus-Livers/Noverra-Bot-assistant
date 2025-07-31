const { readdirSync } = require('fs');
const chalk = require('chalk'); // Perubahan di sini
const ExtendedClient = require('../class/ExtendedClient');
const moment = require('moment');

/**
 * @param {ExtendedClient} client 
 */
module.exports = (client) => {
    const logSeparator = '=======================================< LIMIT >=======================================';
    
    const log = (message, level = 'info') => {
        const colors = {
          info: chalk.cyan,
          warn: chalk.yellow,
          error: chalk.red,
          timestamp: chalk.blue,
          event: chalk.green,
        };
      
        const levels = {
          info: 'INFO',
          warn: 'WARN',
          error: 'ERROR',
          ready: 'READY',
          event: 'EVENTS',
        };
      
        const timestamp = chalk.bgBlue.bold(moment().format('dddd - DD/MM/YYYY - HH:mm:ss'));
        const formattedMessage = `[${timestamp}] [${colors[level](levels[level])}] ${colors[level](message)}`;
      
        console.log(formattedMessage);
      };

    console.log(logSeparator); // Output logSeparator di awal

    for (const dir of readdirSync('./src/events/')) {
        for (const file of readdirSync('./src/events/' + dir).filter((f) => f.endsWith('.js'))) {
            const module = require('../events/' + dir + '/' + file);

            if (!module) continue;

            if (!module.event || !module.run) {
                log(`Unable to load the event ${file} due to missing 'name' or/and 'run' properties.`, 'warn');
                continue;
            }

            // Menggunakan warna 'magenta' untuk pesan 'Loaded new event'
            log(chalk.magenta(`Loaded new event: ${file}`), 'event'); // Perubahan di sini

            if (module.once) {
                client.once(module.event, (...args) => module.run(client, ...args));
            } else {
                client.on(module.event, (...args) => module.run(client, ...args));
            }
        }
    }

    console.log(logSeparator); // Output logSeparator di akhir
};
