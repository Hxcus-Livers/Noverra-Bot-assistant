const ExtendedClient = require('./src/class/ExtendedClient');
const client = new ExtendedClient();

client.start();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);