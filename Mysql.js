const MySQL = require("mysql2");
const config = require('./config');
const chalk = require('chalk');
const moment = require('moment');

let MysqlMortal = MySQL.createPool(config.mysql)
MysqlMortal.getConnection((err, connect) => {
    const log = (message, level = 'info') => {
        const colors = {
            info: chalk.cyan,
            warn: chalk.yellow,
            error: chalk.red,
            ready: chalk.green,
            event: chalk.blue,
        };
    
        const levels = {
            info: 'INFO',
            warn: 'WARN',
            error: 'ERROR',
            ready: 'READY',
            event: 'EVENTS',
        };
    
        if (!colors[level]) {
            console.error(`Invalid log level: ${level}`);
            return;
        }
    
        const timestamp = chalk.bgBlue.bold(moment().format('dddd - DD/MM/YYYY - HH:mm:ss'));
        const formattedMessage = `[${timestamp}] [${colors[level](levels[level])}] ${colors[level](message)}`;
        console.log(formattedMessage);
    }

    if (err) {
        log("Error connecting to MySQL: " + err.message, 'error');
        return;
    }
    
    log("Connected to MySQL!", 'warn');
})

module.exports = MysqlMortal;