const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    structure: {
        name: 'blackjack',
        description: 'Bermain blackjack dengan Donation Point',
        aliases: ['bj'],
        cooldown: 5
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message<true>} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        const userId = message.author.id;
        
        // Check for subcommands or direct play
        if (!args.length) {
            // Direct play with 1 point if no arguments
            args = ['play', '1'];
        } else if (args[0] === 'all') {
            // Bet all points
            const connection = await pool.getConnection();
            
            try {
                const [rows] = await connection.execute('SELECT DonatePoint FROM accounts WHERE DiscordID = ?', [userId]);
                
                if (rows.length === 0 || rows[0].DonatePoint < 1) {
                    connection.release();
                    return message.reply({
                        content: 'Anda tidak memiliki cukup Donation Point untuk bermain.'
                    });
                }
                
                const allPoints = rows[0].DonatePoint;
                connection.release();
                
                args = ['play', allPoints.toString()];
            } catch (error) {
                if (connection) connection.release();
                console.error('Error checking player points:', error);
                return message.reply({
                    content: 'Terjadi kesalahan saat memeriksa point Anda. Silakan coba lagi nanti.'
                });
            }
        } else if (args[0] !== 'play' && args[0] !== 'stats' && !isNaN(parseInt(args[0]))) {
            // Direct bet amount specified
            const betAmount = parseInt(args[0]);
            args = ['play', betAmount.toString()];
        }
        
        // Now process with normalized arguments
        if (args[0] !== 'play' && args[0] !== 'stats') {
            return message.reply({
                content: 'Perintah yang valid: `blackjack/bj [jumlah bet]`, `blackjack/bj all`, `blackjack/bj stats`'
            });
        }
        
        const subcommand = args[0];
        
        if (subcommand === 'stats') {
            await handleStats(message);
            return;
        }
        
        if (subcommand === 'play') {
            if (args.length < 2) {
                return message.reply({
                    content: 'Silakan tentukan jumlah Donation Point untuk bermain. Contoh: `blackjack play 10`'
                });
            }
            
            const bet = parseInt(args[1]);
            
            if (isNaN(bet) || bet < 1) {
                return message.reply({
                    content: 'Jumlah bet harus berupa angka positif. Contoh: `blackjack play 10`'
                });
            }
            
            // Main blackjack game logic
            const replyMessage = await message.reply('Memulai permainan blackjack...');
            
            try {
                // Check if the player has an active game
                if (games.has(userId)) {
                    return replyMessage.edit({
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
                    return replyMessage.edit({
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
                    
                    return replyMessage.edit({
                        content: null,
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
                    await handleGameEnd(message, replyMessage, gameState);
                    return;
                }
                
                // Create the game embed
                const embed = createGameEmbed(message.author, gameState);
                const actionRow = createActionRow();
                
                // Send the initial game state
                await replyMessage.edit({
                    content: null,
                    embeds: [embed],
                    components: [actionRow],
                });
                
                // Set up a collector for button interactions
                const filter = i => {
                    return i.message.id === replyMessage.id;
                };
                
                const collector = message.channel.createMessageComponentCollector({
                    filter,
                    time: 60000, // 60 seconds timeout
                });
                
                collector.on('collect', async i => {
                    // Check if the user who clicked is the game owner
                    if (i.user.id !== userId) {
                        // Send ephemeral message to the user who clicked but isn't the game owner
                        await i.reply({
                            content: `Ini adalah permainan blackjack milik <@${userId}>. Anda tidak dapat menggunakan tombol ini.`,
                            ephemeral: true
                        });
                        return;
                    }
                    
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
                            await handleGameEnd(message, replyMessage, gameState);
                            collector.stop();
                            return;
                        }
                        
                        const embed = createGameEmbed(message.author, gameState);
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
                        
                        await handleGameEnd(message, replyMessage, gameState);
                        collector.stop();
                    }
                });
                
                collector.on('end', async (collected, reason) => {
                    const gameState = games.get(userId);
                    
                    if (gameState && gameState.status === 'playing') {
                        gameState.status = 'timeout';
                        await handleGameEnd(message, replyMessage, gameState);
                    }
                    
                    games.delete(userId);
                });
                
            } catch (error) {
                console.error('Error in blackjack command:', error);
                return replyMessage.edit({
                    content: 'Terjadi kesalahan saat memproses permainan blackjack. Silakan coba lagi nanti.',
                    embeds: [],
                    components: []
                });
            }
        }
    }
};

/**
 * Handles the stats subcommand
 * @param {Message<true>} message 
 */
async function handleStats(message) {
    const userId = message.author.id;
    
    try {
        const connection = await pool.getConnection();
        
        // Get player stats
        const [statsRows] = await connection.execute(
            'SELECT * FROM player_stats WHERE discord_id = ?',
            [userId]
        );
        
        connection.release();
        
        if (statsRows.length === 0) {
            return message.reply({
                content: 'Anda belum pernah bermain blackjack.'
            });
        }
        
        const stats = statsRows[0];
        const totalGames = stats.total_wins + stats.total_losses + stats.total_ties;
        const winRate = totalGames > 0 ? Math.round((stats.total_wins / totalGames) * 100) : 0;
        
        const embed = new EmbedBuilder()
            .setTitle('🃏 Statistik Blackjack')
            .setColor(0x2F3136)
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
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
        
        return message.reply({
            embeds: [embed]
        });
    } catch (error) {
        console.error('Error in blackjack stats:', error);
        return message.reply({
            content: 'Terjadi kesalahan saat mengambil statistik blackjack. Silakan coba lagi nanti.'
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
        .setColor(0x2F3136)
        .setAuthor({
            name: `${user.username}, your bet ${gameState.bet} DP to play blackjack`,
            iconURL: user.displayAvatarURL({ dynamic: true })
        })
    
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    // Format dealer's hand
    let dealerCards;
    if (gameState.status === 'playing') {
        // Hide dealer's second card during play
        dealerCards = `${gameState.dealerHand[0].value}${gameState.dealerHand[0].suit} ?️`;
        embed.addFields({
            name: `Dealer [?]`,
            value: dealerCards,
            inline: true
        });
    } else {
        dealerCards = gameState.dealerHand.map(card => `${card.value}${card.suit}`).join(' ');
        embed.addFields({
            name: `Dealer [${dealerValue}]`,
            value: dealerCards,
            inline: true
        });
    }
    
    // Format player's hand
    const playerCards = gameState.playerHand.map(card => `${card.value}${card.suit}`).join(' ');
    embed.addFields({
        name: `${user.username} [${playerValue}]`,
        value: playerCards || 'No cards',
        inline: true
    });
    
    // Add game status message
    let statusMessage = '~ in progress';
    let color = 0x3498DB; // Blue color for in-progress state
    
    switch (gameState.status) {
        case 'blackjack':
            statusMessage = `~ you won ${Math.floor(gameState.bet * 1.5)} donationpoint!`;
            color = 0x00FF00;
            break;
        case 'bust':
            if (calculateHandValue(gameState.dealerHand) > 21) {
                statusMessage = '<:dice:1345676634279120917> ~ **you both bust**';
            } else {
                statusMessage = `~ you lost ${gameState.bet} donationpoint!`;
            }
            color = 0xFF0000;
            break;
        case 'dealer-bust':
            statusMessage = `~ you won ${gameState.bet} donationpoint!`;
            color = 0x00FF00;
            break;
        case 'tie':
            statusMessage = '~ push (tie)';
            color = 0xFFFF00;
            break;
        case 'win':
            statusMessage = `~ you won ${gameState.bet} donationpoint!`;
            color = 0x00FF00;
            break;
        case 'lose':
            statusMessage = `~ you lost ${gameState.bet} donationpoint!`;
            color = 0xFF0000;
            break;
        case 'timeout':
            statusMessage = '~ timeout - bet returned';
            color = 0xFFFF00;
            break;
    }
    
    embed.setColor(color);
    
    // Add the dice icon to the footer
    embed.setFooter({
        text: ` ${statusMessage}`,
        iconURL: 'https://cdn.discordapp.com/attachments/1232964397455118419/1345682617210769489/dice.png?ex=67c57019&is=67c41e99&hm=3674ca251beaa156700f37ea51e76d281b9fb2ce24bdbdcf951e949cc4271a9e&'
    });
    
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
 * @param {Message<true>} message The original message
 * @param {Message<true>} replyMessage The reply message to update
 * @param {Object} gameState The current game state
 */
async function handleGameEnd(message, replyMessage, gameState) {
    const userId = message.author.id;
    
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
                // Special case: check if dealer also busted
                if (calculateHandValue(gameState.dealerHand) > 21) {
                    pointsChange = 0;
                    isTie = true;
                    // Override status for the "both bust" message
                    gameState.bothBust = true;
                } else {
                    pointsChange = -gameState.bet;
                    isLoss = true;
                }
                break;
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
        
        connection.release();
        
        const newBalance = rows[0]?.DonatePoint || 0;
        
        // Update the gameState with the latest balance for display
        gameState.totalBets = newBalance;
        
        // Create the final game embed
        const embed = createGameEmbed(message.author, gameState);
        
        // Update the message with the final state
        await replyMessage.edit({
            embeds: [embed],
            components: [] // Remove buttons
        });
        
    } catch (error) {
        console.error('Error handling game end:', error);
        await replyMessage.edit({
            content: 'Terjadi kesalahan saat memproses hasil permainan. Silakan hubungi admin.',
            embeds: [],
            components: [] // Remove buttons                        
        });
    } finally {
        // Clean up the game state
        games.delete(userId);
    }
}