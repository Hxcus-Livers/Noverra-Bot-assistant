const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mysql = require('mysql2/promise');
const ExtendedClient = require('../../../class/ExtendedClient');
const config = require('../../../../config');

const pool = mysql.createPool({
    connectionLimit: config.mysql.connectionLimit,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
});

// Card values and suits
const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game states
const games = new Map();

// Player statistics tracking
const playerStats = new Map();

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Bermain blackjack dengan Donation Point')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Mulai permainan blackjack')
                .addIntegerOption(option =>
                    option
                        .setName('bet')
                        .setDescription('Jumlah Donation Point untuk bermain')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Melihat statistik blackjack Anda')
        ),
    options: {
        cooldown: 5000
    },
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'stats') {
            await handleStats(interaction);
            return;
        }
        
        // Main blackjack game logic
        await interaction.deferReply();
        
        const userId = interaction.user.id;
        const bet = interaction.options.getInteger('bet');
        
        try {
            // Check if the player has an active game
            if (games.has(userId)) {
                return interaction.editReply({
                    content: 'Anda sudah memiliki permainan blackjack yang aktif. Selesaikan permainan tersebut terlebih dahulu.',
                });
            }
            
            // Check if player has enough points to bet
            const connection = await pool.getConnection();
            
            // First, create the player_stats table if it doesn't exist
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS player_stats (
                    discord_id VARCHAR(20) PRIMARY KEY,
                    total_bets INT NOT NULL DEFAULT 0,
                    total_wins INT NOT NULL DEFAULT 0,
                    total_losses INT NOT NULL DEFAULT 0,
                    total_ties INT NOT NULL DEFAULT 0,
                    total_blackjacks INT NOT NULL DEFAULT 0,
                    points_won INT NOT NULL DEFAULT 0,
                    points_lost INT NOT NULL DEFAULT 0,
                    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            const [rows] = await connection.execute('SELECT DonatePoint FROM accounts WHERE DiscordID = ?', [userId]);
            
            if (rows.length === 0) {
                connection.release();
                return interaction.editReply({
                    content: 'Anda tidak memiliki akun yang terdaftar dengan Discord ID ini.',
                });
            }
            
            const playerPoints = rows[0].DonatePoint;
            
            if (playerPoints < bet) {
                connection.release();
                // Improved error message with more details
                const embed = new EmbedBuilder()
                    .setTitle('❌\Donation Point Tidak Cukup')
                    .setColor(0xFF0000)
                    .setDescription(`Anda tidak memiliki cukup __Donation Point__ untuk bermain ${bet}.`)
                    .addFields(
                        { name: 'Point Anda', value: `${playerPoints} DP`, inline: true },
                        { name: 'Bet Anda', value: `${bet} DP`, inline: true },
                        { name: 'Kekurangan', value: `${bet - playerPoints} DP`, inline: true }
                    )
                    .setFooter({
                        text: 'Silakan masukkan jumlah Donation Point yang lebih kecil atau isi ulang Donation Point Anda.'
                    });
                
                return interaction.editReply({
                    embeds: [embed]
                });
            }
            
            // Get player stats or create entry if not exists
            const [statsRows] = await connection.execute(
                'SELECT * FROM player_stats WHERE discord_id = ?',
                [userId]
            );
            
            if (statsRows.length === 0) {
                await connection.execute(
                    'INSERT INTO player_stats (discord_id, total_bets) VALUES (?, ?)',
                    [userId, bet]
                );
            } else {
                await connection.execute(
                    'UPDATE player_stats SET total_bets = total_bets + ?, last_played = CURRENT_TIMESTAMP WHERE discord_id = ?',
                    [bet, userId]
                );
            }
            
            // Get updated stats
            const [updatedStats] = await connection.execute(
                'SELECT total_bets FROM player_stats WHERE discord_id = ?',
                [userId]
            );
            
            const totalBets = updatedStats[0].total_bets;
            
            connection.release();
            
            // Initialize a new game
            const gameState = {
                playerHand: [],
                dealerHand: [],
                deck: createShuffledDeck(),
                bet: bet,
                totalBets: totalBets,
                status: 'playing', // playing, stand, bust, blackjack, dealer-bust, tie, win, lose
            };
            
            games.set(userId, gameState);
            
            // Deal initial cards
            dealCard(gameState.playerHand, gameState.deck);
            dealCard(gameState.dealerHand, gameState.deck);
            dealCard(gameState.playerHand, gameState.deck);
            dealCard(gameState.dealerHand, gameState.deck);
            
            // Check for blackjack
            const playerValue = calculateHandValue(gameState.playerHand);
            const dealerValue = calculateHandValue(gameState.dealerHand);
            
            if (playerValue === 21) {
                gameState.status = 'blackjack';
                await handleGameEnd(interaction, gameState);
                return;
            }
            
            // Create the game embed
            const embed = createGameEmbed(interaction.user, gameState);
            const actionRow = createActionRow();
            
            // Send the initial game state
            const message = await interaction.editReply({
                embeds: [embed],
                components: [actionRow],
            });
            
            // Set up a collector for button interactions
            const filter = i => {
                return i.user.id === userId && i.message.id === message.id;
            };
            
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 60000, // 60 seconds timeout
            });
            
            collector.on('collect', async i => {
                const gameState = games.get(userId);
                
                if (!gameState || gameState.status !== 'playing') {
                    collector.stop();
                    return;
                }
                
                if (i.customId === 'hit') {
                    dealCard(gameState.playerHand, gameState.deck);
                    const playerValue = calculateHandValue(gameState.playerHand);
                    
                    if (playerValue > 21) {
                        gameState.status = 'bust';
                        await handleGameEnd(interaction, gameState);
                        collector.stop();
                        return;
                    }
                    
                    const embed = createGameEmbed(interaction.user, gameState);
                    await i.update({ embeds: [embed], components: [createActionRow()] });
                    
                } else if (i.customId === 'stand') {
                    gameState.status = 'stand';
                    
                    // Dealer plays
                    let dealerValue = calculateHandValue(gameState.dealerHand);
                    
                    while (dealerValue < 17) {
                        dealCard(gameState.dealerHand, gameState.deck);
                        dealerValue = calculateHandValue(gameState.dealerHand);
                    }
                    
                    // Determine winner
                    const playerValue = calculateHandValue(gameState.playerHand);
                    
                    if (dealerValue > 21) {
                        gameState.status = 'dealer-bust';
                    } else if (playerValue === dealerValue) {
                        gameState.status = 'tie';
                    } else if (playerValue > dealerValue) {
                        gameState.status = 'win';
                    } else {
                        gameState.status = 'lose';
                    }
                    
                    await handleGameEnd(interaction, gameState);
                    collector.stop();
                }
            });
            
            collector.on('end', async (collected, reason) => {
                const gameState = games.get(userId);
                
                if (gameState && gameState.status === 'playing') {
                    gameState.status = 'timeout';
                    await handleGameEnd(interaction, gameState);
                }
                
                games.delete(userId);
            });
            
        } catch (error) {
            console.error('Error in blackjack command:', error);
            return interaction.editReply({
                content: 'Terjadi kesalahan saat memproses permainan blackjack. Silakan coba lagi nanti.',
            });
        }
    }
};

/**
 * Handles the stats subcommand
 * @param {ChatInputCommandInteraction} interaction 
 */
async function handleStats(interaction) {
    const userId = interaction.user.id;
    
    try {
        const connection = await pool.getConnection();
        
        // Get player stats
        const [statsRows] = await connection.execute(
            'SELECT * FROM player_stats WHERE discord_id = ?',
            [userId]
        );
        
        connection.release();
        
        if (statsRows.length === 0) {
            return interaction.reply({
                content: 'Anda belum pernah bermain blackjack.',
                ephemeral: true
            });
        }
        
        const stats = statsRows[0];
        const totalGames = stats.total_wins + stats.total_losses + stats.total_ties;
        const winRate = totalGames > 0 ? Math.round((stats.total_wins / totalGames) * 100) : 0;
        
        const embed = new EmbedBuilder()
            .setTitle('🃏 Statistik Blackjack')
            .setColor(0x2F3136)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .addFields(
                { name: 'Total Point', value: `${stats.total_bets} Donation Point`, inline: true },
                { name: 'Total Permainan', value: `${totalGames}`, inline: true },
                { name: 'Win Rate', value: `${winRate}%`, inline: true },
                { name: 'Kemenangan', value: `${stats.total_wins}`, inline: true },
                { name: 'Kekalahan', value: `${stats.total_losses}`, inline: true },
                { name: 'Seri', value: `${stats.total_ties}`, inline: true },
                { name: 'Blackjack', value: `${stats.total_blackjacks}`, inline: true },
                { name: 'Points Dimenangkan', value: `${stats.points_won}`, inline: true },
                { name: 'Points Hilang', value: `${stats.points_lost}`, inline: true }
            )
            .setFooter({
                text: `Terakhir dimainkan: ${new Date(stats.last_played).toLocaleString()}`
            });
        
        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in blackjack stats:', error);
        return interaction.reply({
            content: 'Terjadi kesalahan saat mengambil statistik blackjack. Silakan coba lagi nanti.',
            ephemeral: true
        });
    }
}

/**
 * Creates a new shuffled deck of cards
 * @returns {Array} Shuffled deck of cards
 */
function createShuffledDeck() {
    const deck = [];
    
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

/**
 * Deals a card from the deck to a hand
 * @param {Array} hand The hand to deal to
 * @param {Array} deck The deck to deal from
 */
function dealCard(hand, deck) {
    if (deck.length > 0) {
        hand.push(deck.pop());
    }
}

/**
 * Calculates the value of a hand
 * @param {Array} hand The hand to calculate
 * @returns {Number} The value of the hand
 */
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    
    for (const card of hand) {
        if (card.value === 'A') {
            aceCount++;
            value += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }
    
    // Adjust for aces
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    
    return value;
}

/**
 * Creates an embed for the game state
 * @param {User} user The user playing the game
 * @param {Object} gameState The current game state
 * @returns {EmbedBuilder} The game embed
 */
function createGameEmbed(user, gameState) {
    const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .setColor(0x2F3136)
        .setAuthor({
            name: user.username,
            iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setFooter({
            text: `Bet: ${gameState.bet} DP | Total Point: ${gameState.totalBets} DP`
        })
        .setTimestamp();
    
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    // Format player's hand
    const playerCards = gameState.playerHand.map(card => `${card.value}${card.suit}`).join(' ');
    embed.addFields({
        name: `Kartu Anda (${playerValue})`,
        value: playerCards || 'Tidak ada kartu',
        inline: false
    });
    
    // Format dealer's hand
    let dealerCards;
    if (gameState.status === 'playing') {
        // Hide dealer's second card
        dealerCards = `${gameState.dealerHand[0].value}${gameState.dealerHand[0].suit} ?️`;
        embed.addFields({
            name: `Kartu Dealer (?)`,
            value: dealerCards,
            inline: false
        });
    } else {
        dealerCards = gameState.dealerHand.map(card => `${card.value}${card.suit}`).join(' ');
        embed.addFields({
            name: `Kartu Dealer (${dealerValue})`,
            value: dealerCards,
            inline: false
        });
    }
    
    // Add game status message
    if (gameState.status !== 'playing') {
        let statusMessage = '';
        let color = 0x2F3136;
        
        switch (gameState.status) {
            case 'blackjack':
                statusMessage = '🎉 BLACKJACK! Anda menang 1.5x bet!';
                color = 0x00FF00;
                break;
            case 'bust':
                statusMessage = '💥 BUST! Anda melebihi 21 dan kalah.';
                color = 0xFF0000;
                break;
            case 'dealer-bust':
                statusMessage = '🎉 Dealer BUST! Anda menang!';
                color = 0x00FF00;
                break;
            case 'tie':
                statusMessage = '🤝 TIE! Bet Anda dikembalikan.';
                color = 0xFFFF00;
                break;
            case 'win':
                statusMessage = '🎉 Anda MENANG!';
                color = 0x00FF00;
                break;
            case 'lose':
                statusMessage = '😔 Anda KALAH.';
                color = 0xFF0000;
                break;
            case 'timeout':
                statusMessage = '⏱️ Waktu habis! Bet Anda dikembalikan.';
                color = 0xFFFF00;
                break;
        }
        
        embed.setDescription(statusMessage);
        embed.setColor(color);
    } else {
        embed.setDescription('Hit untuk ambil kartu, Stand untuk berhenti.');
    }
    
    return embed;
}

/**
 * Creates the action row with game buttons
 * @returns {ActionRowBuilder} The action row
 */
function createActionRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('hit')
                .setLabel('Hit')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('stand')
                .setLabel('Stand')
                .setStyle(ButtonStyle.Secondary)
        );
}

/**
 * Handles the end of a game
 * @param {ChatInputCommandInteraction} interaction The original interaction
 * @param {Object} gameState The current game state
 */
async function handleGameEnd(interaction, gameState) {
    const userId = interaction.user.id;
    
    try {
        const connection = await pool.getConnection();
        
        // Calculate winnings
        let pointsChange = 0;
        let isWin = false;
        let isLoss = false;
        let isTie = false;
        let isBlackjack = false;
        
        switch (gameState.status) {
            case 'blackjack':
                // Blackjack pays 3:2
                pointsChange = Math.floor(gameState.bet * 1.5);
                isWin = true;
                isBlackjack = true;
                break;
            case 'win':
            case 'dealer-bust':
                // Regular win pays 1:1
                pointsChange = gameState.bet;
                isWin = true;
                break;
            case 'tie':
            case 'timeout':
                // Tie or timeout returns the bet
                pointsChange = 0;
                isTie = true;
                break;
            case 'bust':
            case 'lose':
                // Loss, player loses bet
                pointsChange = -gameState.bet;
                isLoss = true;
                break;
        }
        
        // Update player's points in database
        if (pointsChange !== 0) {
            await connection.execute(
                'UPDATE accounts SET DonatePoint = DonatePoint + ? WHERE DiscordID = ?',
                [pointsChange, userId]
            );
        }
        
        // Update player stats
        const statsUpdate = [
            isWin ? 1 : 0,                 // total_wins
            isLoss ? 1 : 0,                // total_losses
            isTie ? 1 : 0,                 // total_ties
            isBlackjack ? 1 : 0,           // total_blackjacks
            Math.max(0, pointsChange),     // points_won
            Math.abs(Math.min(0, pointsChange)),  // points_lost
            userId
        ];
        
        await connection.execute(`
            UPDATE player_stats 
            SET 
                total_wins = total_wins + ?,
                total_losses = total_losses + ?,
                total_ties = total_ties + ?,
                total_blackjacks = total_blackjacks + ?,
                points_won = points_won + ?,
                points_lost = points_lost + ?,
                last_played = CURRENT_TIMESTAMP
            WHERE discord_id = ?
        `, statsUpdate);
        
        // Get updated point balance
        const [rows] = await connection.execute(
            'SELECT DonatePoint FROM accounts WHERE DiscordID = ?',
            [userId]
        );
        
        // Get updated total bets
        const [statsRows] = await connection.execute(
            'SELECT total_bets FROM player_stats WHERE discord_id = ?',
            [userId]
        );
        
        connection.release();
        
        const newBalance = rows[0]?.DonatePoint || 0;
        const totalBets = statsRows[0]?.total_bets || 0;
        
        // Update the gameState with the latest total bets
        gameState.totalBets = totalBets;
        
        // Create the final game embed
        const embed = createGameEmbed(interaction.user, gameState);
        
        // Add point change information
        if (pointsChange > 0) {
            embed.addFields({
                name: 'Hasil',
                value: `**+${pointsChange}** Donation Point\nSaldo baru: **${newBalance}** Donation Point`,
                inline: false
            });
        } else if (pointsChange < 0) {
            embed.addFields({
                name: 'Hasil',
                value: `**${pointsChange}** Donation Point\nSaldo baru: **${newBalance}** Donation Point`,
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Hasil',
                value: `Bet dikembalikan\nSaldo: **${newBalance}** Donation Point`,
                inline: false
            });
        }
        
        // Update the message with the final state
        await interaction.editReply({
            embeds: [embed],
            components: [] // Remove buttons
        });
        
    } catch (error) {
        console.error('Error handling game end:', error);
        await interaction.editReply({
            content: 'Terjadi kesalahan saat memproses hasil permainan. Silakan hubungi admin.',
            components: [] // Remove buttons
        });
    } finally {
        // Clean up the game state
        games.delete(userId);
    }
}