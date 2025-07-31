module.exports = {
    client: {
        token: 'MTMwMzUzNTMyMDQxMDc1NTE4Mw.GJd7p-.WxejLR-Pz8MmCzMIWJXuwQMUWQ_6QjqEnJwuOQ',
        id: '1303535320410755183',
        guild: "1222520440946294784", // ID Server Discord
        version: "4.9.0", // JANGAN DIUBAH NTAR ERROR
    },
    server: {
        ip: "51.79.136.184", // IP Server Game
        port: "7016", // Port Server Game
        fullAddress: "51.79.136.184:7016" // IP + Port (optional, bisa dihitung otomatis)
    },
    icon: {
        thumbnail: "https://cdn.discordapp.com/icons/824365726419779655/ef29b6d10d199512eded117de805e3e4.webp?size=512", // LOGO SERVER KALIAN
        image: "https://cdn.discordapp.com/attachments/1396418545205645333/1397090239725436959/Noverra_Banner_-_Background.png?ex=6880752d&is=687f23ad&hm=0d37a5582d0810951900e2e415e50c6a9565b3dc2e02a2c70108f9888a3e0349&", // LOGO BANNER SERVER KALIAN
    },
    mysql: {
        connectionLimit: 5, // SETTING MYSQL
        host: "208.84.103.75",
        user: "u1039_9L01jqpgTc",
        password: "9nf^EnGRN+@RI!afIw@iXRes",
        database: "s1039_alaska-rp",
    },
    verifrole: {
        warga: '' // ID ROLE PADA SAAT BARU MASUK KE DALAM SERVER
    },
    bot: {
    lisensi: 'gyudev42323' // MASUKKAN PASSWORD YANG DIBERIKAN OLEH OWNER BOT
    },
    idrole: {
        ucp: "1396418354771787840", // ID ROLE SETELAH BERHASIL REGISTRASI AKUN UCP
    },
    channel: {
        registerLogs: "1396418739280543804", // ID CHANNEL LOGS REGISTRASI UCP
        allowedChannelslink: ['1396418698117513236', '1396418730786947102', '1396418731910889593', '', '', '', ''], // CHANNEL YANG DIPERBOLEHKAN MENGIRIM LINK
        gallery: "1396418725527425165", // ID CHANNEL AUTO THREADS UNTUK GALLERY
    },
    backup: {
        specific_times: ['05:00', '17:00'],  // Backup pada jam 5 pagi dan 5 sore WIB
        delete_old_days: 7  // Atau sesuai kebutuhan Anda
    },
    // Konfigurasi Discord untuk notifikasi backup
    discord: {
        webhook: "https://discord.com/api/webhooks/1349783505865019402/D0ZZKR12Wt1Modv5MqknMqdhyHO-NpwJ5hFGWWOF4xRch_JGwwIerjpr70WFZl2WrTdY", // URL webhook Discord untuk notifikasi backup
        backupChannelId: "1349777220205416480", // ID channel untuk mengirim file backup
        color: "#23FFB2", // Warna embed
        footer: "Alaska Roleplay Database Backup System"
    },
    // Konfigurasi Google Drive (opsional)
    googleDrive: {
        enable: true, // Aktifkan/nonaktifkan fitur upload ke Google Drive
        folder_id: "1__H4E-8nPI_RB4rbbBSWrMhaAfVw54mX" // ID folder Google Drive untuk menyimpan backup
    },
    // Konfigurasi Telegram (opsional)
    telegram: {
        enable: true, // Aktifkan/nonaktifkan notifikasi Telegram
        bot_token: "7366584376:AAGod7Quk7wEzmKWblyl7Xm_9Ry7vFSOLI4", // Token bot Telegram
        chat_id: "6762030082" // ID chat Telegram (bisa ID grup atau chat pribadi)
    },
    handler: {
        prefix: "nt# ", // PREFIX UNTUK COMMAND
        deploy: true,
        commands: {
            prefix: true,
            slash: true,
            user: true,
            message: true,
        }   
    }, 
    users: { // MASUKKAN ID USER PROFILE OWNER ATAU ID USER PROFILE KALIAN SENDIRI
        developers: ["700751641736904755", "1342417906197069845", "778624706185134130", "742699674732855298"],
        ownerId: "700751641736904755"// SAMAKAN YANG INI JUGA
    },
    development: { // MASUKKAN ID GUILD
        enabled: false,
        guild: "",
    },
    servers: { // NAMA SERVER KALIAN
        name: "Noverra Roleplay",
    },
    messageSettings: { // PESAN PESAN
        ownerMessage: "Pengembang bot memiliki satu-satunya izin untuk menggunakan perintah ini.",
        developerMessage: "Anda tidak berwenang untuk menggunakan perintah ini.",
        cooldownMessage: "Pelan-pelan sobat! Anda terlalu cepat untuk menggunakan perintah ini ({cooldown}s).",
        globalCooldownMessage: "Pelan-pelan sobat! Perintah ini berada pada cooldown global ({cooldown}s).",
        notHasPermissionMessage: "Anda tidak memiliki izin untuk menggunakan perintah ini.",
        notHasPermissionComponent: "Anda tidak memiliki izin untuk menggunakan komponen ini.",
        missingDevIDsMessage: "Ini adalah perintah khusus pengembang, tetapi tidak dapat dijalankan karena ID pengguna tidak ada di file konfigurasi."
    },
    takeRoleSystem: {
        emoji: '👤',
        embedTitle: '**🎭 TAKE ROLE**',
        embedDescription: 'Klik emoji di bawah untuk mendapatkan role!\n\n👤 **Civilian** - Role untuk melakukan verifikasi\n',
        embedColor: '#00FF99',
        role: "1307035215851688048",
    },
};
