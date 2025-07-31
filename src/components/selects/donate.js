const { StringSelectMenuInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const config = require('../../../config');

module.exports = {
    customId: 'donate-menu',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {StringSelectMenuInteraction} interaction 
     */
    run: async (client, interaction) => {

        const value1 = interaction.values[0] == 'AboutDonate';
        const value2 = interaction.values[0] == 'PacketDonate';
        const value3 = interaction.values[0] == 'HouseDonate';
        const value4 = interaction.values[0] == 'VehicleDonate';
        const value5 = interaction.values[0] == 'OtherDonate';

        const msgEmbedAccountDiscord = new EmbedBuilder()
            .setTitle(`${config.servers.name} | Community `)
            .setDescription(`Apa itu donasi di Community!\n\n Donasi adalah memberikan dukungan kepada komunitas untuk mengembangkan permainan/server yang dibuat. Donasi bersifat sukarela atau tanpa paksaan dari pihak manapun.`)
            .setColor("#5CDFA1")
            .setFooter({ text: `${config.servers.name} Community` });

        const msgEmbedServerBooster = new EmbedBuilder()
            .setTitle(`${config.servers.name} | Community `)
            .setDescription(`COMMING SOON`)
            .setColor("#5CDFA1")
            .setFooter({ text: `${config.servers.name} Community` });

        const msgEmbedNitroDiscord = new EmbedBuilder()
            .setTitle(`${config.servers.name} | Community `)
            .setDescription(`# 🏠 Donasi Rumah
                \nDonasi Rumah adalah donasi yang digunakan untuk membeli rumah di dalam permainan. Rumah adalah tempat tinggal dan menyimpan barang di dalam permainan.
                \n\n## 💰 Daftar Harga Donasi Rumah
                \n- 🛖 Rumah Kecil \t\t  : ~~Rp. 35.000~~ => **Rp. 20.000**
                \n- 🏡 Rumah Sedang \t : ~~Rp. 50.000~~ => **Rp. 30.000**
                \n- 🏠 Rumah Besar \t\t  : ~~Rp. 75.000~~ => **Rp. 55.000**
                \n- 🏢 Mansion Kecil \t: ~~Rp. 100.000~~ => **Rp. 75.000**
                \n- 🏛️ Mansion Besar \t: ~~Rp. 150.000~~ => **Rp. 120.000**`)
            .setColor("#5CDFA1")
            .setFooter({ text: `${config.servers.name} Community` });

        const vehicles = [
            {
                name: "NRG-500",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_522.jpg",
                originalPrice: "Rp. 90.000",
                discountPrice: "Rp. 80.000"
            },
            {
                name: "Quard Bike",
                availability: "(0/3)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_471.jpg",
                originalPrice: "Rp. 90.000",
                discountPrice: "Rp. 75.000"
            },
            {
                name: "Patriot",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_470.jpg",
                originalPrice: "Rp. 90.000",
                discountPrice: "Rp. 70.000"
            },
            {
                name: "Infernus",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_411.jpg",
                originalPrice: "Rp. 85.000",
                discountPrice: "Rp. 65.000"
            },
            {
                name: "Bullet",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_541.jpg",
                originalPrice: "Rp. 85.000",
                discountPrice: "Rp. 65.000"
            },
            {
                name: "HOTRING A",
                availability: "(0/3)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_502.jpg",
                originalPrice: "Rp. 85.000",
                discountPrice: "Rp. 75.000"
            },
            {
                name: "HOTRING B",
                availability: "(0/3)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_503.jpg",
                originalPrice: "Rp. 85.000",
                discountPrice: "Rp. 75.000"
            },
            {
                name: "HOTRING C",
                availability: "(0/3)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_494.jpg",
                originalPrice: "Rp. 85.000",
                discountPrice: "Rp. 75.000"
            },
            {
                name: "Cheetah",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_415.jpg",
                originalPrice: "Rp. 80.000",
                discountPrice: "Rp. 70.000"
            },
            {
                name: "Banshee",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_429.jpg",
                originalPrice: "Rp. 80.000",
                discountPrice: "Rp. 70.000"
            },
            {
                name: "Kart",
                availability: "(0/3)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_571.jpg",
                originalPrice: "Rp. 80.000",
                discountPrice: "Rp. 70.000"
            },
            {
                name: "Turismo",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_451.jpg",
                originalPrice: "Rp. 75.000",
                discountPrice: "Rp. 50.000"
            },
            {
                name: "ZR-350",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_477.jpg",
                originalPrice: "Rp. 75.000",
                discountPrice: "Rp. 50.000"
            },
            {
                name: "Buffalo",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_402.jpg",
                originalPrice: "Rp. 65.000",
                discountPrice: "Rp. 65.000"
            },
            {
                name: "BF Injection",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_424.jpg",
                originalPrice: "Rp. 60.000",
                discountPrice: "Rp. 60.000"
            },
            {
                name: "Super GT",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_506.jpg",
                originalPrice: "Rp. 60.000",
                discountPrice: "Rp. 50.000"
            },
            {
                name: "Mesa",
                availability: "",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_500.jpg",
                originalPrice: "Rp. 50.000",
                discountPrice: "Rp. 35.000"
            },
            {
                name: "Caddy",
                availability: "(0/5)",
                imageUrl: "https://assets.open.mp/assets/images/vehiclePictures/Vehicle_457.jpg",
                originalPrice: "Rp. 40.000",
                discountPrice: "Rp. 40.000"
            }
        ];

        // Function to create vehicle embed
        const createVehicleEmbed = (index) => {
            const vehicle = vehicles[index];
            return new EmbedBuilder()
                .setTitle(`${config.servers.name} | Donasi Kendaraan`)
              .setDescription(`# ${vehicle.name} ${vehicle.availability}`)
                .setImage(vehicle.imageUrl)
                .addFields(
                    { name: "Price", value: vehicle.originalPrice === vehicle.discountPrice ? `**${vehicle.originalPrice}**` : `~~${vehicle.originalPrice}~~ ➜ **${vehicle.discountPrice}**` }
                )
                .setColor("#5CDFA1")
                .setFooter({ text: `${config.servers.name} Community • Vehicle ${index + 1}/${vehicles.length}` });
        };

        // Function to create navigation buttons
        const createNavigationButtons = (currentIndex) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`prev_vehicle_${currentIndex}`)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === 0),
                    new ButtonBuilder()
                        .setCustomId(`next_vehicle_${currentIndex}`)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentIndex === vehicles.length - 1),
                    new ButtonBuilder()
                        .setCustomId(`all_vehicles`)
                        .setLabel('Show All Vehicles')
                        .setStyle(ButtonStyle.Secondary)
                );
        };

        // List view of all vehicles
        const msgEmbedBuildBotjs = new EmbedBuilder()
            .setTitle(`${config.servers.name} | Community `)
            .setDescription(`# 🚗 Donasi Kendaraan
                \nDonasi Kendaraan adalah donasi yang digunakan untuk membeli kendaraan dalam permainan. Kendaraan digunakan untuk bepergian dari satu tempat ke tempat lain dalam permainan..
                \n\n## 💰 Daftar Harga Kendaraan Donasi
                \n- NRG-500 (0/5) \t: ~~Rp. 90.000~~ => **Rp. 80.000**
                \n- Quard Bike (0/3) \t: ~~Rp. 90.000~~ => **Rp. 75.000**
                \n- Patriot \t: ~~Rp. 90.000~~ => **Rp. 70.000**
                \n- Infernus (0/5) \t: ~~Rp. 85.000~~ => **Rp. 65.000**
                \n- Bullet (0/5) \t: ~~Rp. 85.000~~ => **Rp. 65.000**
                \n- HOTRING A (0/3) \t: ~~Rp. 85.000~~ => **Rp. 75.000**
                \n- HOTRING B (0/3) \t: ~~Rp. 85.000~~ => **Rp. 75.000**
                \n- HOTRING C (0/3) \t: ~~Rp. 85.000~~ => **Rp. 75.000**
                \n- Cheetah \t: ~~Rp. 80.000~~ => **Rp. 65.000**
                \n- Banshee \t: ~~Rp. 80.000~~ => **Rp. 60.000**
                \n- Kart (0/3) \t: ~~Rp. 80.000~~ => **Rp. 70.000**
                \n- Turismo (0/5) \t: ~~Rp. 75.000~~ => **Rp. 50.000**
                \n- ZR - 350 (0/5) \t: ~~Rp. 75.000~~ => **Rp. 50.000**
                \n- Buffalo \t: **Rp. 65.000**
                \n- BF Injection (0/5) \t: **Rp. 60.000**
                \n- Super GT \t: ~~Rp. 60.000~~ => **Rp. 50.000**
                \n- Mesa \t: ~~Rp. 50.000~~ => **Rp. 35.000**
                \n- Caddy (0/5) \t: **Rp. 40.000**
                `)
            .setColor("#5CDFA1")
            .setFooter({ text: `${config.servers.name} Community` });

        // Create navigation row for the list view
        const listViewNavigationRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('view_individual_vehicles')
                    .setLabel('Browse Vehicles')
                    .setStyle(ButtonStyle.Primary)
            );

        const msgEmbedOtherDonate = new EmbedBuilder()
            .setTitle(`${config.servers.name} | Community `)
            .setDescription(`# 🎁 Donasi Lainnya
                \nDonasi Lainnya adalah donasi yang digunakan untuk membeli item di dalam permainan. Item yang dapat dibeli adalah sebagai berikut:
                \n\n## 💰 Daftar Harga Donasi Lainnya
                \n- Custom Plat Kendaraan : ~~Rp. 30.000~~ => **Rp. 15.000**
                \n- Gate \t : ~~Rp. 50.000~~ => **Rp. 30.000**
                \n- ATM \t : ~~Rp. 40.000~~ => **Rp. 20.000**
                \n### Daftar Slot
                \n- Slot Rumah \t : **Rp. 25.000**
                \n- Slot Kendaraan \t: **Rp. 20.000**
                \n### Mapping
                \n- Per Object \t : **Rp. 500**
                \n### Custom Phone Number 
                \n- Custom Phone Number 4 Digit : **Rp. 20.000**
                \n- Custom Phone Number 5 Digit : **Rp. 10.000**
                \n- Custom Phone Number 5 Digit : **Rp. 5.000**`)
            .setColor("#5CDFA1")
            .setFooter({ text: `${config.servers.name} Community` });

        if (value1) {
            await interaction.reply({ embeds: [msgEmbedAccountDiscord], ephemeral: true });
        }
        else if (value2) {
            await interaction.reply({ embeds: [msgEmbedServerBooster], ephemeral: true });
        }
        else if (value3) {
            await interaction.reply({ embeds: [msgEmbedNitroDiscord], ephemeral: true });
        }
        else if (value4) {
             // First show the list view with all vehicles
            const message = await interaction.reply({ 
                embeds: [msgEmbedBuildBotjs], 
                components: [listViewNavigationRow],
                ephemeral: true,
                fetchReply: true
            });
            
            // Create collector for button interactions
            const collector = message.createMessageComponentCollector({ 
                time: 300000 // Collector active for 5 minutes
            });
            
            let vehicleIndex = 0;
            
            collector.on('collect', async i => {
                if (i.customId === 'view_individual_vehicles') {
                    // Switch to individual vehicle view
                    const vehicleEmbed = createVehicleEmbed(vehicleIndex);
                    const navigationButtons = createNavigationButtons(vehicleIndex);
                    await i.update({ embeds: [vehicleEmbed], components: [navigationButtons] });
                }
                else if (i.customId.startsWith('prev_vehicle_')) {
                    vehicleIndex = Math.max(0, vehicleIndex - 1);
                    const vehicleEmbed = createVehicleEmbed(vehicleIndex);
                    const navigationButtons = createNavigationButtons(vehicleIndex);
                    await i.update({ embeds: [vehicleEmbed], components: [navigationButtons] });
                } 
                else if (i.customId.startsWith('next_vehicle_')) {
                    vehicleIndex = Math.min(vehicles.length - 1, vehicleIndex + 1);
                    const vehicleEmbed = createVehicleEmbed(vehicleIndex);
                    const navigationButtons = createNavigationButtons(vehicleIndex);
                    await i.update({ embeds: [vehicleEmbed], components: [navigationButtons] });
                } 
                else if (i.customId === 'all_vehicles') {
                    // Return to list view
                    await i.update({ 
                        embeds: [msgEmbedBuildBotjs], 
                        components: [listViewNavigationRow] 
                    });
                }
            });
            
            collector.on('end', () => {
                // Remove buttons after timeout
                interaction.editReply({ components: [] }).catch(console.error);
            });
        }
        else if (value5) {
            await interaction.reply({ embeds: [msgEmbedOtherDonate], ephemeral: true })
        }
        else {
            // Default handler if no option matches
            await interaction.reply({ 
                content: "Pilihan tidak valid. Silakan pilih opsi dari menu.", 
                ephemeral: true 
            });
        }
    }
};