import 'dotenv/config';
import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from 'discord.js';
import { RnldClient, RnldApiError } from '@ronaldmiranda/api-sdk';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const RNLD_API_KEY = process.env.RNLD_API_KEY;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !RNLD_API_KEY || !GUILD_ID) {
  console.error('Defina DISCORD_TOKEN, RNLD_API_KEY e GUILD_ID no .env');
  process.exit(1);
}

// ---------- SDK ----------

const rnld = new RnldClient({
  apiKey: RNLD_API_KEY,
  guildId: GUILD_ID,
});

// ---------- Comandos ----------

const commands = [
  new SlashCommandBuilder()
    .setName('wl-status')
    .setDescription('Consulta o status de whitelist de um jogador')
    .addStringOption(opt =>
      opt.setName('discord_id')
        .setDescription('Discord ID do jogador')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('wl_id')
        .setDescription('Token do jogador (wl_id)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('wl-liberar')
    .setDescription('Libera a whitelist de um jogador')
    .addStringOption(opt =>
      opt.setName('wl_id')
        .setDescription('Token do jogador (wl_id)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('discord_id')
        .setDescription('Discord ID do jogador') // Para testar o input com discord_id que nao pertence ao WL_ID informado
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('wl-remover')
    .setDescription('Remove a whitelist de um jogador')
    .addStringOption(opt =>
      opt.setName('wl_id')
        .setDescription('Token do jogador (wl_id)')
        .setRequired(true)),
].map(c => c.toJSON());

// ---------- Registra comandos na guild ----------

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registrarComandos(clientId) {
  await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commands });
  console.log(`[BOT] Comandos registrados na guild ${GUILD_ID}`);
}

// ---------- Bot ----------

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`[BOT] Online como ${client.user.tag}`);
  await registrarComandos(client.user.id);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  await interaction.deferReply({ ephemeral: true });

  try {
    if (commandName === 'wl-status') {
      const discordId = interaction.options.getString('discord_id');
      const wlId = interaction.options.getString('wl_id');

      if (!discordId && !wlId) {
        return interaction.editReply('Informe ao menos `discord_id` ou `wl_id`.');
      }

      const player = await rnld.whitelist.query({ discordId, wl_id: wlId });

      console.log(JSON.stringify(player, null, 2));
      if (!player) {
        return interaction.editReply('Jogador não encontrado.');
      }

      const status = player.isBanned
        ? `Banido — ${player.banReason}${player.banExpiresAt ? ` (até ${player.banExpiresAt})` : ''}`
        : player.identities.whitelisted
          ? 'Whitelisted'
          : 'Sem whitelist';

      return interaction.editReply(
        `**Status:** ${status}\n` +
        `**Staff:** ${player.isStaff ? 'Sim' : 'Não'}\n` +
        `**Token:** \`${player.identities.wl_id || 'N/A'}\`\n` +
        `**Discord:** ${player.identities.discord_id || 'N/A'}`
      );
    }

    if (commandName === 'wl-liberar') {
      const wlId = interaction.options.getString('wl_id');
      const discordId = interaction.options.getString('discord_id');

      if (discordId) {
        const player = await rnld.whitelist.liberar({ wl_id: wlId, discordId });
        if (player.status) {
          return interaction.editReply(
            `Whitelist liberada com sucesso.\n` +
            `**Token:** \`${player.data.identities.wl_id}\``
          );
        } else {
          return interaction.editReply(`Falha: ${player.mensagem}`);
        }
      }

      const resultado = await rnld.whitelist.liberar({ wl_id: wlId });

      return interaction.editReply(
        resultado.status
          ? `Whitelist liberada com sucesso.`
          : `Falha: ${resultado.mensagem}`
      );
    }

    if (commandName === 'wl-remover') {
      const wlId = interaction.options.getString('wl_id');
      const resultado = await rnld.whitelist.remover({ wl_id: wlId });

      return interaction.editReply(
        resultado.status
          ? `Whitelist removida com sucesso.`
          : `Falha: ${resultado.mensagem}`
      );
    }

  } catch (err) {
    if (err instanceof RnldApiError) {
      return interaction.editReply(`Erro ${err.statusCode}: ${err.message}`);
    }
    console.error(err);
    return interaction.editReply('Erro interno.');
  }
});

client.login(DISCORD_TOKEN);
