const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("poll")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDescription("Melakukan Vooting Atau Pooling Kepada Member")
        .addStringOption(option =>
            option.setName("question")
                .setDescription("*Provide the question of the poll.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("choice-1")
                .setDescription("*First choice.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("choice-2")
                .setDescription("*Second choice.")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel to send the poll to.")
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDMPermission(false) 
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    run: async (client, interaction) => {
        const { options, channel } = interaction;

        const question = options.getString("question");
        const choiceOne = options.getString("choice-1");
        const choiceTwo = options.getString("choice-2");
        const Channel = options.getChannel("channel") || channel; 

        try {
            const message = await Channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("\`📊\` Voting Server!")
                        .setDescription(`**Question:** ${question}`)
                        .addFields(
                            { name: `> ✅ ${choiceOne}`, value: '  ', inline: false },
                            { name: `> ❌ ${choiceTwo}`, value: '  ', inline: false }
                        )
                        .setFooter({
                            text: `Requested by: ${interaction.member.user.tag}`,
                            iconURL: interaction.member.displayAvatarURL({ dynamic: true })
                        })
                        .setImage('https://api.sundacloud.store/teravibes-banner.png')
                        .setTimestamp()
                        .setColor("Blue")
                ]
            })

            await message.react("✅");
            await message.react("❌");

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Green")
                        .setDescription(
                            `:white_check_mark: | Successfully sent the poll embed in the channel: <#${channel.id}>`
                        )
                        .addFields(
                            { name: "\`❓\` Question", value: `${question}`, inline: true },
                            { name: "\`✅\` Choice 1", value: `${choiceOne}`, inline: true },
                            { name: "\`❌\` Choice 2", value: `${choiceTwo}`, inline: true },
                        )
                ],
                ephemeral: true
            })
        } catch (err) {
            console.log(err);
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Yellow")
                        .setDescription(
                            `:warning: | Something went wrong. Please try again later.`
                        )
                ],
                ephemeral: true
            })
        }
    }
}