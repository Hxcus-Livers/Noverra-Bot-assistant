const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const mysql = require('mysql2/promise');
const config = require('../../config');
const commands = require("../handlers/commands");
const events = require("../handlers/events");
const deploy = require("../handlers/deploy");
const components = require("../handlers/components");

module.exports = class extends Client {
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    };
    applicationcommandsArray = [];
    
    linkViolations = new Map();
    lastAttemptTime = null;
    
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions, // PENTING: Untuk reaction role
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildBans,
                GatewayIntentBits.GuildScheduledEvents
            ],
            partials: [
                Partials.Message,     // PENTING: Untuk reaction pada pesan lama
                Partials.Channel,
                Partials.Reaction,    // PENTING: Untuk reaction role
                Partials.User,
                Partials.GuildMember
            ],
        });
    };
    
    start = async () => {
        // Load commands, events, and components
        commands(this);
        events(this);
        components(this);

        await this.login(config.client.token);

        if (config.handler.deploy) deploy(this, config);
    };
};