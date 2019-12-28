'use strict';
process.title = 'discord-bot-stats';

require('dotenv').config(); // Loads the '.env' config file
const fs = require('fs');
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();

const serverId = process.env.SERVERID;
const channelId = process.env.CHANNELID;
const botId = process.env.BOTID;
const iconUrl = process.env.ICONURL;

let guild;
let channel;
let roles = {};

/**
 * Reads the specified roles file
 */
function readRolesFile() {
    fs.readFile('./roles.json', (err, data) => {
        if (err) { // File doesn't exist.
            throw new Error('Roles file does not exist. Check out the \'roles.example.json\' file!');
        }

        try {
            roles = JSON.parse(data);
        } catch (err) {
            throw new Error("Failed to parse list-file: " + err)
        }     

        console.info('SUCCESS!');

        setupChannel();
    });  
}

/**
 * Calls when the bot has started
 */
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}`);
    console.info('Trying to access server...');

    guild = bot.guilds.get(serverId);

    if (!guild) {
        console.error('Could not find specified guild!');
        return;
    }

    console.info('Trying to find statistics channel...');

    channel = guild.channels.get(channelId);

    if (!channel) {
        console.error('Could not find specified channel!');
        return;
    }

    console.info('Checking if bot has Administrator privileges...');
    
    if (!guild.members.get(botId) || !guild.members.get(botId).hasPermission('ADMINISTRATOR')) {
        console.error('Bot is not an admin!');
        return;
    }

    console.info('Loading roles...');

    try{
        readRolesFile();
    } catch (err) {
        console.error(err);
        return;
    }
});

bot.on('guildMemberAdd', setupChannel);
bot.on('guildMemberRemove', setupChannel);
bot.on('guildMemberUpdate', setupChannel);

/**
 * Clears the specified channel of its content, sets the member's count as the channel's title and posts the stats embed
 */
function setupChannel() {
    // First of all, delete all messages in the channel
    channel.bulkDelete(100);

    const membersCount = Array.from(guild.members.filter(m => !m.user.bot)).length; // Members count excluding bots.

    // Get all class roles
    let classFields = "**Classes**\n\n";

    for (let i = 0; i < roles.classes.length; i++) {
        const c = roles.classes[i];
        const count = Array.from(guild.members.filter(m => !m.user.bot && m.roles.has(c.id))).length;
        const emoji = guild.emojis.find(e => e.name === c.emoji);

        classFields += `${emoji} <@&${c.id}>: **${count}**\u200b\n\n`;
    }

    let rolesFields = "**Roles**\n\n";

    // Get all ingame roles
    for (let i = 0; i < roles.roles.length; i++) {
        const c = roles.roles[i];
        const count = Array.from(guild.members.filter(m => !m.user.bot && m.roles.has(c.id))).length;

        rolesFields += `<@&${c.id}>: **${count}**\u200b\n\n`;
    }

    let profFields = "**Professions**\n\n";

    // Get all profession roles
    for (let i = 0; i < roles.professions.length; i++) {
        const c = roles.professions[i];
        const count = Array.from(guild.members.filter(m => !m.user.bot && m.roles.has(c.id))).length;
        const emoji = guild.emojis.find(e => e.name === c.emoji);

        profFields += `${emoji} <@&${c.id}>: **${count}**\u200b\n\n`;
    }

    const content = {
        embed: {
            timestamp: new Date(),
            title: `<${guild.name}> SERVER STATS`,
            description: `Guild Members: ${membersCount}`,
            color: 8462170,
            thumbnail: {
                url: iconUrl
            },
            fields: [
                {
                    name: '\u200b',
                    value: classFields,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: rolesFields,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: profFields,
                    inline: true
                }
            ],
            footer: {
                icon_url: iconUrl,
                text: `© <${guild.name}>`
            }
        }
    };
    
    channel.send(content);
}

// The program starts here
bot.login(process.env.TOKEN);