require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

// ============================
// CONFIG
// ============================

// Usa una variable de entorno para el token.
// En Railway pondrás DISCORD_TOKEN con el token de ESTE bot.
const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,            // info del servidor
    GatewayIntentBits.GuildMessages,     // mensajes
    GatewayIntentBits.MessageContent,    // ver contenido
    GatewayIntentBits.GuildMembers       // miembros
  ]
});

// ============================
// RESPUESTAS BASE
// ============================

function respuestaAgentes() {
  return new EmbedBuilder()
    .setColor(0x0ea5e9)
    .setTitle("🤝 Agentes recomendados y cómo usarlos")
    .setDescription(
      "Aquí tienes una guía rápida de los agentes más usados:\n\n" +
      "🇺🇸 **USFANS** (recomendado):\n" +
      "• Buen soporte, QC claro, pensado para compradores internacionales.\n" +
      "• Ideal si quieres algo más guiado y estable.\n\n" +
      "🇨🇳 **CNFANS**:\n" +
      "• Más flexible, bueno para quien ya controla plataformas chinas.\n" +
      "• Permite optimizar más, pero exige experiencia.\n\n" +
      "🛒 **Kakobuy**:\n" +
      "• Muy usado en la comunidad.\n" +
      "• Siempre revisa bien el QC y no tengas prisa al shippear.\n\n" +
      "✨ Otros (Joyagoo, Litbuy...):\n" +
      "• Úsalos como alternativa, siempre comparando fees, rutas y soporte."
    )
    .setFooter({ text: "Consejo general: empieza con pedidos pequeños y prueba el soporte antes de ir a lo grande." });
}

function respuestaTallas() {
  return new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle("📏 Guía rápida de tallas (especial Zapatillas)")
    .setDescription(
      "Algunas pautas para elegir talla en reps:\n\n" +
      "1️⃣ **Nunca te fíes solo de la talla EU/US**, mira los CM.\n" +
      "2️⃣ Mide tu pie descalzo, de talón a punta, en cm.\n" +
      "3️⃣ Compara con la tabla del vendedor o del agente.\n" +
      "4️⃣ Si estás entre dos tallas, muchas veces compensa subir medio número.\n\n" +
      "💡 Consejo extra:\n" +
      "• Si ya tienes unas zapatillas del mismo modelo que te quedan perfectas, usa esa talla como referencia.\n" +
      "• En Jordan 1 y 4, mucha gente va **TTS o +0.5** dependiendo del ancho del pie."
    );
}

function respuestaQC() {
  return new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle("🔍 QC (Quality Check) – Cómo revisar un producto")
    .setDescription(
      "Antes de aprobar un pedido, revisa bien el QC:\n\n" +
      "✅ Comprueba:\n" +
      "• Simetría entre zapatillas\n" +
      "• Colores, formas y proporciones\n" +
      "• Cosidos, pegamento, arrugas raras\n" +
      "• Logos y texto (alineación, grosor, posición)\n\n" +
      "❌ Red flags típicas:\n" +
      "• Fotos muy oscuras o borrosas\n" +
      "• QC incompleto (pocas fotos, ángulos dudosos)\n" +
      "• El agente se niega a mandar fotos extra\n\n" +
      "Si dudas, sube las fotos al canal de QC del servidor y pide opinión antes de aprobar."
    );
}

function respuestaSeguridad() {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("🛡️ Seguridad y estafas – Reglas básicas")
    .setDescription(
      "Para evitar problemas y estafas:\n\n" +
      "• No pagues directamente a vendedores desconocidos.\n" +
      "• Usa siempre agentes y métodos de pago seguros.\n" +
      "• Desconfía de precios **demasiado buenos para ser verdad**.\n" +
      "• No compartas datos personales en canales públicos.\n" +
      "• Guarda capturas de chat, QC y pagos.\n\n" +
      "Si algo te huele raro, pregunta en el servidor antes de pagar."
    );
}

function respuestaGenerica() {
  return new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle("🤖 Chinabuy Helper")
    .setDescription(
      "Me has mencionado, así que intento ayudarte con dudas de compras, agentes, QC, tallas y seguridad.\n\n" +
      "Puedes preguntarme cosas como:\n" +
      "• `@Chinabuybot ¿qué agente me recomiendas para empezar?`\n" +
      "• `@Chinabuybot cómo elegir talla en Jordan 1?`\n" +
      "• `@Chinabuybot qué debo mirar en el QC?`\n\n" +
      "También puedes usar comandos:\n" +
      "• `!agentes`\n" +
      "• `!tallas`\n" +
      "• `!qc`\n" +
      "• `!seguridad`\n" +
      "• `!ayuda`"
    );
}

// ============================
// LÓGICA AL MENCIONAR AL BOT
// ============================

function escogerRespuestaPorTexto(textoPlano) {
  const t = textoPlano.toLowerCase();

  if (t.includes("agente") || t.includes("usfans") || t.includes("cnfans") || t.includes("kakobuy")) {
    return respuestaAgentes();
  }

  if (t.includes("talla") || t.includes("size") || t.includes("numero") || t.includes("número")) {
    return respuestaTallas();
  }

  if (t.includes("qc") || t.includes("quality") || t.includes("calidad") || t.includes("legit")) {
    return respuestaQC();
  }

  if (t.includes("estafa") || t.includes("scam") || t.includes("seguridad") || t.includes("seguro")) {
    return respuestaSeguridad();
  }

  return respuestaGenerica();
}

// ============================
// EVENTO READY
// ============================

client.once("ready", () => {
  console.log(`🔥 Helper bot online como: ${client.user.tag}`);
});

// ============================
// MENSAJES
// ============================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 1) ACTIVACIÓN POR MENCIÓN (lo que tú querías)
  if (message.mentions.has(client.user)) {
    const texto = message.content.replace(/<@!?\d+>/g, "").trim();
    const embed = escogerRespuestaPorTexto(texto);
    return message.reply({ embeds: [embed] });
  }

  // 2) COMANDOS OPCIONALES (por si quieres usarlos)
  if (!message.content.startsWith("!")) return;

  const [cmdRaw, ...args] = message.content.slice(1).split(/\s+/);
  const cmd = cmdRaw.toLowerCase();

  if (cmd === "ping") {
    return message.reply("🏓 Estoy vivo y listo para ayudarte.");
  }

  if (cmd === "ayuda") {
    const embed = respuestaGenerica();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "agentes") {
    const embed = respuestaAgentes();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "tallas") {
    const embed = respuestaTallas();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "qc") {
    const embed = respuestaQC();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "seguridad") {
    const embed = respuestaSeguridad();
    return message.reply({ embeds: [embed] });
  }
});

// ============================
// LOGIN
// ============================

client.login(TOKEN);
