const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');
const fetch = require('node-fetch');
const mysqldump = require('mysqldump');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

// Konfigurasikan logging dengan chalk
chalk.level = 3;
const separator = chalk.green('='.repeat(50));
const scriptInfo = chalk.green.bold('[ Database-Backup ]') + chalk.cyan(' 🚀 Script Database Backup telah dimulai...');

// Pool koneksi database dengan timeout yang lebih panjang
const pool = mysql.createPool({
    connectionLimit: config.mysql.connectionLimit,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    connectTimeout: 60000, // Meningkatkan timeout koneksi menjadi 60 detik
    waitForConnections: true
    // Dihapus: acquireTimeout karena tidak valid dalam MySQL2
});

// Test koneksi database
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(chalk.green("✅ Koneksi database berhasil!"));
        connection.release();
        return true;
    } catch (err) {
        console.error(chalk.red(`❌ Gagal terhubung ke database: ${err.message}`));
        console.log(chalk.yellow("📝 Detail koneksi:"));
        console.log(chalk.yellow(`   Host: ${config.mysql.host}`));
        console.log(chalk.yellow(`   User: ${config.mysql.user}`));
        console.log(chalk.yellow(`   Database: ${config.mysql.database}`));
        return false;
    }
}

// Inisialisasi Google Drive API jika diaktifkan
let drive = null;
if (config.googleDrive?.enable) {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../../../../google-drive.json'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    drive = google.drive({ version: 'v3', auth });
}

// Fungsi untuk delay
function Delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

// Fungsi untuk split file besar menjadi beberapa bagian kecil dengan pendekatan stream
async function splitSqlFile(filePath, maxSizeMB = 7) {
    try {
        const maxSize = maxSizeMB * 1024 * 1024; // Konversi MB ke bytes
        const fileBaseName = path.basename(filePath, '.sql');
        const dirPath = path.dirname(filePath);
        const splitFiles = [];
        
        // Gunakan pendekatan streaming untuk mengurangi penggunaan memori
        const fileStats = await fs.stat(filePath);
        const fileSize = fileStats.size;
        const numParts = Math.ceil(fileSize / maxSize);
        
        console.log(chalk.blue(`🔍 File ukuran ${(fileSize / (1024 * 1024)).toFixed(2)}MB akan dibagi menjadi ${numParts} bagian`));
        
        // Jika file terlalu besar, gunakan pendekatan chunking yang lebih efisien
        if (fileSize > 100 * 1024 * 1024) { // Jika file lebih dari 100MB
            console.log(chalk.yellow("⚠️ File sangat besar, menggunakan metode streaming langsung tanpa membaca seluruh isi"));
            
            // Bagi file secara langsung dengan pendekatan byte range
            for (let i = 0; i < numParts; i++) {
                const partFile = path.join(dirPath, `${fileBaseName}_part${i+1}_of_${numParts}.sql`);
                const start = i * maxSize;
                const end = Math.min((i + 1) * maxSize, fileSize) - 1;
                
                // Buat stream baca dengan range byte tertentu
                const readStream = fs.createReadStream(filePath, { start, end });
                const writeStream = fs.createWriteStream(partFile);
                
                // Pipe stream langsung tanpa buffer in-memory
                await new Promise((resolve, reject) => {
                    readStream.pipe(writeStream)
                        .on('finish', resolve)
                        .on('error', reject);
                });
                
                splitFiles.push(partFile);
                console.log(chalk.green(`✅ Bagian ${i+1}/${numParts} selesai: ${partFile}`));
            }
            
            return splitFiles;
        }
        
        // Untuk file yang tidak terlalu besar, gunakan pendekatan line-by-line
        // untuk memastikan SQL statement tidak terpotong di tengah-tengah
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const readline = require('readline');
        const rl = readline.createInterface({
            input: readStream,
            crlfDelay: Infinity
        });
        
        let currentPart = 1;
        let currentSize = 0;
        let writeStream = fs.createWriteStream(path.join(dirPath, `${fileBaseName}_part${currentPart}_of_${numParts}.sql`));
        splitFiles.push(path.join(dirPath, `${fileBaseName}_part${currentPart}_of_${numParts}.sql`));
        
        for await (const line of rl) {
            // Tambahkan line break yang dihapus oleh readline
            const lineWithBreak = line + '\n';
            const lineSize = Buffer.byteLength(lineWithBreak);
            
            // Jika menambahkan baris ini akan membuat bagian melebihi ukuran maksimum,
            // mulai bagian baru, kecuali jika baris ini sendiri sudah lebih besar dari ukuran maks
            if ((currentSize + lineSize > maxSize) && currentSize > 0 && lineSize < maxSize) {
                writeStream.end();
                currentPart++;
                currentSize = 0;
                writeStream = fs.createWriteStream(path.join(dirPath, `${fileBaseName}_part${currentPart}_of_${numParts}.sql`));
                splitFiles.push(path.join(dirPath, `${fileBaseName}_part${currentPart}_of_${numParts}.sql`));
                console.log(chalk.green(`✅ Bagian ${currentPart-1}/${numParts} selesai`));
            }
            
            writeStream.write(lineWithBreak);
            currentSize += lineSize;
        }
        
        writeStream.end();
        console.log(chalk.green(`✅ Bagian ${currentPart}/${numParts} selesai`));
        console.log(chalk.green(`✅ File dibagi menjadi ${splitFiles.length} bagian`));
        
        return splitFiles;
    } catch (err) {
        console.error(chalk.red(`❌ Gagal membagi file: ${err.message}`));
        return null;
    }
}

// Fungsi utama untuk melakukan backup database
async function backupDatabase(client) {
    try {
        // Test koneksi terlebih dahulu
        const connectionOk = await testDatabaseConnection();
        if (!connectionOk) {
            throw new Error("Tidak dapat terhubung ke database. Periksa konfigurasi koneksi.");
        }

        const now = dayjs();
        // Buat file backup di direktori temporari sistem
        const tempDir = path.join(require('os').tmpdir(), 'db_backup_temp');
        await fs.ensureDir(tempDir);
        const filename = path.join(tempDir, `backup_${config.mysql.database}_${now.format('YYYY-MM-DD_HH-mm-ss')}.sql`);
        
        console.log(chalk.green(`🔄 Menyimpan backup sementara ke: ${filename}`));

        // Meningkatkan batas memori Node.js jika diperlukan
        try {
            // Cek ukuran database sebelum backup
            const [rows] = await pool.query(`
                SELECT 
                    SUM(data_length + index_length) / 1024 / 1024 AS size_mb 
                FROM 
                    information_schema.TABLES 
                WHERE 
                    table_schema = ?
            `, [config.mysql.database]);
            
            let dbSizeMB = rows[0].size_mb ?? 0;

            // Paksa konversi ke number jika tipe bukan number
            if (typeof dbSizeMB !== 'number') {
                dbSizeMB = Number(dbSizeMB);
            }

            console.log(chalk.blue(`📊 Perkiraan ukuran database: ${dbSizeMB.toFixed(2)} MB`));
            
            // Jika database besar, berikan peringatan
            if (dbSizeMB > 100) {
                console.log(chalk.yellow(`⚠️ Database cukup besar (${dbSizeMB.toFixed(2)} MB). Proses backup mungkin membutuhkan waktu lebih lama.`));
            }
        } catch (dbSizeError) {
            console.log(chalk.yellow(`⚠️ Tidak dapat memeriksa ukuran database: ${dbSizeError.message}`));
        }

        // Membuat backup dengan mysqldump dengan konfigurasi timeout yang lebih panjang
        await mysqldump({
            connection: {
                host: config.mysql.host,
                user: config.mysql.user,
                password: config.mysql.password,
                database: config.mysql.database,
                connectTimeout: 60000 // 60 detik timeout
                // Hapus: acquireTimeout karena tidak valid dalam MySQL2
            },
            dumpToFile: filename,
            compressFile: false // Nonaktifkan kompresi jika ada masalah
        });

        console.log(chalk.green("✅ Backup database selesai!"));

        // Cek ukuran file
        const stats = await fs.stat(filename);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        // Jika file lebih besar dari 7MB, split untuk Discord
        let splitFiles = [];
        if (fileSizeMB > 7) {
            console.log(chalk.yellow(`⚠️ File backup terlalu besar (${fileSizeMB.toFixed(2)}MB), membagi file...`));
            splitFiles = await splitSqlFile(filename, 7); // Membagi menjadi bagian maks 7MB
        }

        // Kirim ke Discord webhook jika dikonfigurasi
        if (config.discord?.webhook) {
            console.log(chalk.blue("📤 Mengirim backup ke Discord webhook..."));
            if (splitFiles.length > 0) {
                await sendToDiscord(filename, splitFiles); // Kirim notifikasi dan file yang sudah dibagi
            } else {
                await sendToDiscord(filename); // Kirim notifikasi dan file
            }
        }

        // Upload ke Google Drive jika diaktifkan
        if (config.googleDrive?.enable && drive) {
            console.log(chalk.blue("📤 Mengupload backup ke Google Drive..."));
            await uploadToGoogleDrive(filename);
        }

        // Kirim notifikasi ke Telegram jika diaktifkan
        if (config.telegram?.enable) {
            console.log(chalk.blue("📤 Mengirim notifikasi ke Telegram..."));
            await sendToTelegram(filename);
        }

        // Hapus file sementara setelah selesai
        try {
            await fs.remove(filename);
            console.log(chalk.green("🧹 File backup sementara dihapus"));
            
            // Hapus file split jika ada
            if (splitFiles.length > 0) {
                for (const splitFile of splitFiles) {
                    await fs.remove(splitFile);
                }
                console.log(chalk.green("🧹 File split sementara dihapus"));
            }
            
            // Hapus direktori temporari jika kosong
            const remainingFiles = await fs.readdir(tempDir);
            if (remainingFiles.length === 0) {
                await fs.remove(tempDir);
            }
        } catch (err) {
            console.error(chalk.yellow(`⚠️ Gagal menghapus file sementara: ${err.message}`));
        }

        console.log(chalk.green("✅ Proses backup selesai!"));
        return filename;
    } catch (err) {
        console.error(chalk.red(`❌ Terjadi kesalahan saat backup: ${err.message}`));
        
        // Log informasi database untuk debugging (tanpa password)
        console.log(chalk.yellow("📝 Detail koneksi database:"));
        console.log(chalk.yellow(`   Host: ${config.mysql.host}`));
        console.log(chalk.yellow(`   User: ${config.mysql.user}`));
        console.log(chalk.yellow(`   Database: ${config.mysql.database}`));
        
        throw err;
    }
}

// Fungsi untuk mengirim backup menggunakan webhook Discord
async function sendToDiscord(filename, splitFiles = []) {
    try {
        let webhook = config.discord.webhook;
        if (!webhook) return;

        // Cek ukuran file
        const stats = await fs.stat(filename);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        const hook = new Webhook(webhook);

        let embed = new MessageBuilder()
            .setAuthor("📂 Database Backup", "", "https://cdn-icons-png.flaticon.com/512/2991/2991114.png")
            .setColor(config.discord.color || "#23FFB2")
            .setThumbnail("https://cdn-icons-png.flaticon.com/512/2991/2991106.png")
            .setDescription("✅ **Backup database berhasil!**\n\n📌 **File:**\n||`" + path.basename(filename) + "`||\n\n")
            .addField("🗄️ **Database**", `\`${config.mysql.database}\``, true)
            .addField("📅 **Waktu**", `<t:${Math.floor(Date.now() / 1000)}:F>`, true)
            .addField("📊 **Ukuran File**", `${fileSizeMB.toFixed(2)} MB`, true)
            .setFooter(config.discord.footer || "Database Backup System", "https://cdn-icons-png.flaticon.com/512/2991/2991108.png")
            .setTimestamp();

        await hook.send(embed);
        
        // Jika ada file yang dibagi, kirim file-file tersebut
        if (splitFiles.length > 0) {
            console.log(chalk.blue(`📤 Mengirim ${splitFiles.length} bagian file ke Discord webhook...`));
            
            // Kirim file secara berurutan dengan delay untuk menghindari rate limiting
            for (let i = 0; i < splitFiles.length; i++) {
                const splitFile = splitFiles[i];
                try {
                    // Tambahkan informasi progress di log
                    console.log(chalk.blue(`📤 Mengirim bagian ${i+1}/${splitFiles.length}: ${path.basename(splitFile)}`));
                    
                    await hook.sendFile(splitFile);
                    console.log(chalk.green(`✅ Bagian ${i+1}/${splitFiles.length} berhasil dikirim ke webhook!`));
                    
                    // Delay antara pengiriman untuk menghindari error
                    if (i < splitFiles.length - 1) {
                        console.log(chalk.blue(`⏳ Menunggu 3 detik sebelum mengirim bagian berikutnya...`));
                        await Delay(3000); // tunggu 3 detik antara pengiriman
                    }
                } catch (err) {
                    console.error(chalk.red(`❌ Gagal mengirim bagian ${i+1}/${splitFiles.length} ke webhook: ${err.message}`));
                    
                    // Coba lagi dengan delay lebih lama jika gagal
                    try {
                        console.log(chalk.yellow(`🔄 Mencoba mengirim ulang bagian ${i+1} setelah menunggu 5 detik...`));
                        await Delay(5000);
                        await hook.sendFile(splitFile);
                        console.log(chalk.green(`✅ Pengiriman ulang bagian ${i+1}/${splitFiles.length} berhasil!`));
                    } catch (retryErr) {
                        console.error(chalk.red(`❌ Gagal mengirim ulang bagian ${i+1}/${splitFiles.length}: ${retryErr.message}`));
                    }
                }
            }
            
            console.log(chalk.green("✅ Semua bagian backup berhasil dikirim ke Discord webhook!"));
        } else if (fileSizeMB <= 8) {
            // File cukup kecil, coba kirim langsung
            try {
                console.log(chalk.blue(`📤 Mengirim file backup (${fileSizeMB.toFixed(2)} MB) ke Discord webhook...`));
                await hook.sendFile(filename);
                console.log(chalk.green("✅ Backup berhasil dikirim ke Discord webhook!"));
            } catch (err) {
                console.error(chalk.red(`❌ Gagal mengirim file ke webhook: ${err.message}`));
                if (err.message.includes('413') || err.message.includes('too large')) {
                    console.error(chalk.yellow("   💡 File terlalu besar untuk dikirim melalui Discord webhook (batas 8MB)"));
                    
                    // Coba bagi file dan kirim
                    console.log(chalk.yellow("🔄 Mencoba membagi file dan mengirim ulang..."));
                    const splitOnError = await splitSqlFile(filename, 7);
                    if (splitOnError && splitOnError.length > 0) {
                        await sendToDiscord(filename, splitOnError);
                        
                        // Hapus file split setelah selesai
                        for (const splitFile of splitOnError) {
                            await fs.remove(splitFile).catch(() => {});
                        }
                    }
                }
            }
        } else {
            console.log(chalk.yellow(`⚠️ File backup terlalu besar (${fileSizeMB.toFixed(2)}MB) untuk dikirim ke Discord webhook.`));
        }
    } catch (err) {
        console.error(chalk.red(`❌ Gagal mengirim backup ke Discord webhook: ${err.message}`));
    }
}

// Fungsi untuk mengirim notifikasi ke Telegram
async function sendToTelegram(filename) {
    try {
        let botToken = config.telegram.bot_token;
        let chatId = config.telegram.chat_id;
        
        if (!botToken || !chatId) return console.error("❌ Bot Token atau Chat ID Telegram belum dikonfigurasi!");

        // First send message notification
        const message = `📂 *Database Backup Berhasil!*\n\n🗄️ *Database:* \`${config.mysql.database}\`\n📅 *Waktu:* ${dayjs().format("YYYY-MM-DD HH:mm:ss")}\n📁 *File:* \`${path.basename(filename)}\``;

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown"
            }),
        });

        const result = await response.json(); 
        if (result.ok) {
            console.log("✅ Notifikasi berhasil dikirim ke Telegram!");
        } else {
            console.error("❌ Gagal mengirim notifikasi ke Telegram:", result);
        }

        // Then send the backup file
        console.log("📤 Mengirim file backup ke Telegram...");
        
        // Cek ukuran file
        const stats = await fs.stat(filename);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        // Telegram memiliki batas 50MB
        if (fileSizeMB > 50) {
            console.error(chalk.yellow("⚠️ File backup terlalu besar untuk Telegram (>50MB). Hanya notifikasi yang dikirim."));
            return;
        }
        
        try {
            const form = new FormData();
            form.append('chat_id', chatId);
            form.append('document', createReadStream(filename));
            
            const fileApiUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
            const fileResponse = await fetch(fileApiUrl, {
                method: 'POST',
                body: form,
                headers: form.getHeaders(),
                timeout: 60000, // Tambah timeout 60 detik
            });
            
            const fileResult = await fileResponse.json();
            if (fileResult.ok) {
                console.log("✅ File backup berhasil dikirim ke Telegram!");
            } else {
                console.error("❌ Gagal mengirim file backup ke Telegram:", fileResult);
            }
        } catch (err) {
            console.error(chalk.red(`❌ Error mengirim file ke Telegram: ${err.message}`));
            
            // Jika gagal, kirim pesan bahwa file terlalu besar
            if (err.message.includes('EFATAL') || err.message.includes('timeout')) {
                const errorMsg = `⚠️ *File backup terlalu besar atau timeout!*\nUkuran file: ${fileSizeMB.toFixed(2)}MB`;
                
                await fetch(telegramApiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: errorMsg,
                        parse_mode: "Markdown"
                    }),
                });
            }
        }
    } catch (err) {
        console.error("❌ Error mengirim ke Telegram:", err.message);
    }
}

// Fungsi untuk mengupload ke Google Drive
async function uploadToGoogleDrive(filename) {
    try {
        if (!drive) return console.error("❌ Google Drive API belum diinisialisasi!");
        
        const fileMetadata = {
            name: path.basename(filename),
            parents: [config.googleDrive.folder_id],
        };

        const media = {
            mimeType: 'application/sql',
            body: fs.createReadStream(filename),
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log(`✅ Berhasil upload ke Google Drive: ${response.data.id}`);
    } catch (err) {
        console.error('❌ Gagal upload ke Google Drive:', err.message);
    }
}

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('backupdatabase')
        .setDescription('Melakukan backup database secara manual'),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const allowedRoleIds = [
            '1222520440979849242',  // Owner
            '1222520440979849241',  // CEO Owner
            '1222855436181442610',  // Founder
            '1246454442497151038'   // Developer
        ];
        
        const bypassUserIds = ['742699674732855298', '778624706185134130']; // ID user yang dikecualikan dari pengecekan
        
        // Cek apakah user termasuk dalam pengecualian
        const isBypassedUser = bypassUserIds.includes(interaction.user.id);
        
        if (!isBypassedUser) {
            const memberRoles = interaction.member.roles.cache;
            const hasPermission = allowedRoleIds.some(roleId => memberRoles.has(roleId));
        
            if (!hasPermission) {
                return interaction.reply({
                    content: 'Anda tidak memiliki izin untuk menggunakan perintah ini.',
                    ephemeral: true
                });
            }
        }

        try {
            // Defer reply karena backup database bisa memakan waktu
            await interaction.deferReply({ ephemeral: true });
            
            // Test koneksi database terlebih dahulu
            const connectionOk = await testDatabaseConnection();
            if (!connectionOk) {
                return interaction.editReply({
                    content: '❌ Tidak dapat terhubung ke database. Silakan periksa konfigurasi database di server.',
                });
            }
            
            // Jalankan backup secara manual
            const backupPath = await backupDatabase(client);
            
            interaction.editReply({
                content: `✅ Backup database berhasil dilakukan!\n📂 File: \`${path.basename(backupPath)}\`\n\nBackup telah dikirim ke Discord/Telegram/Google Drive sesuai konfigurasi.`,
            });

        } catch (error) {
            console.error('Backup Error:', error);
            interaction.editReply({
                content: `❌ Terjadi kesalahan saat mencoba melakukan backup database: ${error.message}\nSilakan periksa log untuk informasi lebih lanjut.`,
            });
        }
    },

    // Inisialisasi saat bot dimulai
    init: async (client) => {
        console.log(separator);
        console.log(scriptInfo);
        
        // Test koneksi database saat pertama kali dimulai
        await testDatabaseConnection();
        
        console.log(chalk.green.bold('[ Database-Backup ]') + chalk.cyan(' 📢 Mode backup diubah: backup dikirim langsung ke eksternal tanpa menyimpan di folder lokal'));
        console.log(separator);
        
        console.log(chalk.yellow('⚠️ Untuk melakukan backup, gunakan perintah "/backupdatabase" di Discord'));
    }
};