const { ChannelType, Message } = require("discord.js");
const config = require("../../../config");
const { log } = require("../../../functions");
const ExtendedClient = require("../../class/ExtendedClient");

const cooldown = new Map();

module.exports = {
    event: "messageCreate",
    /** 
     *
     * @param {ExtendedClient} client
     * @param {Message<true>} message
     * @returns
     */
    run: async (client, message) => {
        // Cek apakah pengirim adalah bot atau pesan di DM
        if (message.author.bot || message.channel.type === ChannelType.DM) return;

        // ID channel yang diizinkan untuk membuat thread
        const allowedChannelIdgallery = config.channel.gallery; 
        // console.log(`Pesan diterima di channel ID: ${message.channel.id}`); // Debug log

        // Cek apakah pesan dikirim di channel yang diizinkan
        if (message.channel.id === allowedChannelIdgallery) {
            try {
                if (message.attachments.size === 0) {
                    await message.delete();
                return;
            }

                // Mengambil isi pesan untuk nama thread, jika tidak ada pesan maka menggunakan nickname user
                const threadName = message.content.trim() ? message.content.slice(0, 100) : `${message.author.username}`;

                // console.log(`Mencoba membuat thread dengan nama: ${threadName}`); // Debug log

                // Membuat thread baru
                const thread = await message.startThread({
                    name: threadName,
                    autoArchiveDuration: 1440, // Gunakan nilai yang valid (60, 1440, 4320, 10080)
                    type: ChannelType.PublicThread
                });

                // Mengirim pesan ke thread baru
                await thread.send('GUNAKAN THREADS INI UNTUK BERDISKUSI, JANGAN DI LUAR THREADS.');
                // console.log(`[BOT]: Thread berhasil dibuat dengan nama: ${threadName} oleh ${message.author.tag}`);
            } catch (error) {
                console.error('Gagal membuat thread:', error);
            }
        }

        // Cek apakah ada prefix yang ditentukan
        if (!config.handler.commands.prefix) return;

        let prefix = config.handler.prefix;

        // Cek apakah pesan dimulai dengan prefix
        if (!message.content.startsWith(prefix)) return;

        // Memecah pesan menjadi argumen
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandInput = args.shift().toLowerCase();

        // Cek apakah ada input command
        if (!commandInput.length) return;

        // Mengambil command dari koleksi
        let command =
            client.collection.prefixcommands.get(commandInput) ||
            client.collection.prefixcommands.get(
                client.collection.aliases.get(commandInput)
            );

        // Cek apakah command ada
        if (command) {
            try {
                // Cek jika command hanya untuk owner
                if (command.structure?.ownerOnly) {
                    if (message.author.id !== config.users.ownerId) {
                        await message.reply({
                            content:
                                config.messageSettings.ownerMessage !== undefined &&
                                    config.messageSettings.ownerMessage !== null &&
                                    config.messageSettings.ownerMessage !== ""
                                    ? config.messageSettings.ownerMessage
                                    : "The bot developer has the only permissions to use this command.",
                            ephemeral: true
                        });
                        return;
                    }
                }

                // Cek izin command
                if (
                    command.structure?.permissions &&
                    !message.member.permissions.has(command.structure?.permissions)
                ) {
                    await message.reply({
                        content:
                            config.messageSettings.notHasPermissionMessage !== undefined &&
                                config.messageSettings.notHasPermissionMessage !== null &&
                                config.messageSettings.notHasPermissionMessage !== ""
                                ? config.messageSettings.notHasPermissionMessage
                                : "You do not have the permission to use this command.",
                        ephemeral: true
                    });
                    return;
                }

                // Cek jika command hanya untuk developer
                if (command.structure?.developers) {
                    if (!config.users.developers.includes(message.author.id)) {
                        await message.reply({
                            content:
                                config.messageSettings.developerMessage !== undefined &&
                                    config.messageSettings.developerMessage !== null &&
                                    config.messageSettings.developerMessage !== ""
                                    ? config.messageSettings.developerMessage
                                    : "You are not authorized to use this command",
                            ephemeral: true
                        });
                        return;
                    }
                }

                // Cek jika channel bukan NSFW untuk command NSFW
                if (command.structure?.nsfw && !message.channel.nsfw) {
                    await message.reply({
                        content:
                            config.messageSettings.nsfwMessage !== undefined &&
                                config.messageSettings.nsfwMessage !== null &&
                                config.messageSettings.nsfwMessage !== ""
                                ? config.messageSettings.nsfwMessage
                                : "The current channel is not a NSFW channel.",
                        ephemeral: true
                    });
                    return;
                }

                // Cek cooldown untuk command
                if (command.structure?.cooldown) {
                    const cooldownFunction = () => {
                        let data = cooldown.get(message.author.id);
                        data.push(commandInput);
                        cooldown.set(message.author.id, data);

                        setTimeout(() => {
                            let data = cooldown.get(message.author.id);
                            data = data.filter((v) => v !== commandInput);

                            if (data.length <= 0) {
                                cooldown.delete(message.author.id);
                            } else {
                                cooldown.set(message.author.id, data);
                            }
                        }, command.structure?.cooldown);
                    };

                    if (cooldown.has(message.author.id)) {
                        let data = cooldown.get(message.author.id);

                        if (data.some((v) => v === commandInput)) {
                            await message.reply({
                                content:
                                    (config.messageSettings.cooldownMessage !== undefined &&
                                        config.messageSettings.cooldownMessage !== null &&
                                        config.messageSettings.cooldownMessage !== ""
                                        ? config.messageSettings.cooldownMessage
                                        : "Slow down buddy! You're too fast to use this command ({cooldown}s).").replace(/{cooldown}/g, command.structure.cooldown / 1000),
                                ephemeral: true
                            });
                            return;
                        } else {
                            cooldownFunction();
                        }
                    } else {
                        cooldown.set(message.author.id, [commandInput]);
                        cooldownFunction();
                    }
                }

                // Menjalankan command
                command.run(client, message, args);
            } catch (error) {
                log(error, "err");
            }
        }
    },
};
