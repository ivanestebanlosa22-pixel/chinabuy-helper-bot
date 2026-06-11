require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

const CANAL_BUSCAR_PRODUCTO_ID = process.env.CANAL_BUSCAR_PRODUCTO_ID || "1513307409517645934";
const CANAL_CONVERTIR_LINK_ID = process.env.CANAL_CONVERTIR_LINK_ID || "1513307457110282400";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SPREADSHEET_PUBLISH_ID = process.env.SPREADSHEET_PUBLISH_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "MAIN!A:R";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1QtZjzS2QKycTxLdJIbldisLxP9lmBNo8NlIzcXaWeZk/edit?gid=1553707851#gid=1553707851";

const SHEET_NAME = SHEET_RANGE.split("!")[0];
const SPREADSHEET_PUBLIC_URL = SPREADSHEET_PUBLISH_ID
  ? `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_PUBLISH_ID}/pub?output=csv`
  : `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

let products = [];

function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      inQuotes = !inQuotes;
    } else if (row[i] === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += row[i];
    }
  }
  result.push(current);
  return result;
}

async function loadProducts() {
  try {
    const res = await fetch(SPREADSHEET_PUBLIC_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const rows = csv.split("\n").map(r => parseCSVRow(r));
    if (rows.length < 2) throw new Error("No data");

    products = rows.slice(1)
      .filter(r => r[0] && r[1])
      .map((r, idx) => ({
        id: r[0] || String(idx + 1),
        nombre: r[1] || "",
        marca: r[2] || "",
        categoria: r[3] || "",
        precio: r[4] || "N/A",
        ranking: r[5] || "N/A",
        weidianId: r[7] || "",
        descripcionEs: r[16] || "",
        descripcionEn: r[17] || ""
      }));

    console.log(`Products loaded: ${products.length}`);
  } catch (e) {
    console.log("Failed to load products:", e.message);
  }
}

function extractWeidianId(text) {
  const match = text.match(/item\.html\?itemID=(\d+)/);
  return match ? match[1] : null;
}

function getAgentLinks(weidianId) {
  if (!weidianId) return null;
  return {
    usfans: `https://www.usfans.com/product/3/${weidianId}?ref=RCGD5Y`,
    litbuy: `https://litbuy.com/product/2/${weidianId}?inviteCode=YBMHFG55L`,
    kakobuy: `https://www.kakobuy.com/item/details?url=${encodeURIComponent(`https://weidian.com/item.html?itemID=${weidianId}`)}&affcode=hc9hzs`
  };
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

function respuestaAgentes() {
  return new EmbedBuilder()
    .setColor(0x0ea5e9)
    .setTitle("📦 Agentes recomendados | Recommended agents")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇺🇸 **USFANS**\n" +
      "🎁 [Regístrate aquí](https://www.usfans.com/register?ref=RCGD5Y) — hasta 800¥ de bono\n" +
      "✅ Soporte en español, QC rápido\n" +
      "✅ Ideal para compradores internacionales\n\n" +
      "🛒 **KAKOBUY**\n" +
      "🎁 [Regístrate aquí](https://ikako.vip/r/hc9hz)\n" +
      "✅ Muy usado en la comunidad\n" +
      "✅ Buenos precios y rutas de envío\n\n" +
      "✨ **LITBUY**\n" +
      "🎁 [Regístrate aquí](https://litbuy.com/register?inviteCode=YBMHFG55L)\n" +
      "✅ Alternativa sólida con buen soporte\n\n" +
      "🔹 **Más agentes**\n" +
      "[Joyagoo](https://joyagoo.com/register?ref=300768147) · [OopBuy](https://oopbuy.com/register?inviteCode=GH40R4J0O) · [Mulebuy](https://mulebuy.com/register?ref=200642502) · [AllChinaBuy](https://www.allchinabuy.com/en/page/login?partnercode=ELEwZR&type=register) · [Hipobuy](https://hipobuy.com/register?inviteCode=YZKOGE9NE) · [ACBuy](https://www.acbuy.com/login?loginStatus=register&code=UD3WIU) · [Superbuy](https://www.superbuy.com/en/page/login?partnercode=Ey3NrI&type=register)\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "💡 Compara fees, rutas y soporte antes de elegir.\n" +
      "Consejo: empieza con pedidos pequeños y prueba el soporte antes de ir a lo grande."
    );
}

function respuestaLinks() {
  return new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle("🔄 Conversión de links | Link conversion")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇪🇸 Pega tu link de Weidian y lo convertimos\n" +
      "a USFans, Litbuy y KakoBuy automáticamente.\n\n" +
      "📌 **Formato:** `!convertir [link de weidian]`\n\n" +
      "🇬🇧 Paste your Weidian link and we'll convert it\n" +
      "to USFans, Litbuy and KakoBuy automatically.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "💡 Usa este comando en el canal #convertir-link"
    );
}

function respuestaBuscar() {
  return new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle("🔍 Buscar productos | Search products")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇪🇸 Busca productos en nuestro catálogo\n" +
      "con `!buscar [nombre del producto]`\n\n" +
      "Ejemplos:\n" +
      "• `!buscar air force 1`\n" +
      "• `!buscar nike`\n" +
      "• `!buscar travis scott`\n\n" +
      "🇬🇧 Search products in our catalog\n" +
      "with `!buscar [product name]`\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "💡 También puedes buscar en: https://chinabuyhub.com\n" +
      "❓ ¿Necesitas ayuda? Pregunta en #dudas-principiantes"
    );
}

function respuestaTallas() {
  return new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle("📏 Guía de tallas China → Europa | Size guide China → EU")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "👟 **ZAPATILLAS | SNEAKERS**\n" +
      "CN 38 → EU 38 | UK 5 | US 6\n" +
      "CN 39 → EU 39 | UK 6 | US 7\n" +
      "CN 40 → EU 40 | UK 6.5 | US 7.5\n" +
      "CN 41 → EU 41 | UK 7 | US 8\n" +
      "CN 42 → EU 42 | UK 8 | US 9\n" +
      "CN 43 → EU 43 | UK 9 | US 10\n" +
      "CN 44 → EU 44 | UK 9.5 | US 10.5\n" +
      "CN 45 → EU 45 | UK 10.5 | US 11.5\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "👕 **ROPA | CLOTHING**\n" +
      "CN S → EU XS/S\n" +
      "CN M → EU S/M\n" +
      "CN L → EU M/L\n" +
      "CN XL → EU L/XL\n" +
      "CN XXL → EU XL/XXL\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "⚠️ Las tallas pueden variar según la marca y el vendedor.\n" +
      "Pide siempre las medidas exactas en cm antes de comprar.\n" +
      "⚠️ Sizes may vary by brand and seller.\n" +
      "Always ask for exact measurements in cm before buying."
    );
}

function respuestaQC() {
  return new EmbedBuilder()
    .setColor(0xf97316)
    .setTitle("📸 ¿Qué es el QC? | What is QC?")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇪🇸 **ESPAÑOL**\n" +
      "QC significa Quality Control — Control de Calidad.\n" +
      "Cuando tu producto llega al almacén del agente, te mandan fotos reales antes de enviarlo.\n\n" +
      "**Qué revisar en las fotos QC:**\n" +
      "✅ Costuras y acabados limpios\n" +
      "✅ Logo centrado y bien impreso\n" +
      "✅ Suela sin defectos ni burbujas\n" +
      "✅ Color igual al de la foto del vendedor\n" +
      "✅ Talla correcta en la etiqueta\n" +
      "❌ Manchas, hilos sueltos o deformaciones = rechazar\n\n" +
      "**¿Aceptar o rechazar?**\n" +
      "→ Si hay defectos graves: rechaza y pide reenvío o reembolso\n" +
      "→ Si es menor: acepta y negocia compensación\n" +
      "→ Dudas: comparte en #qc-fotos\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇬🇧 **ENGLISH**\n" +
      "QC = Quality Control. When your item arrives at the agent's warehouse, they send you real photos before shipping.\n\n" +
      "Check: clean stitching, centered logo, no sole defects, correct color and size tag.\n" +
      "Reject if: major defects, stains, or deformations.\n" +
      "Not sure? Share in #qc-fotos"
    );
}

function respuestaSeguridad() {
  return new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle("🔒 Cómo comprar seguro desde China | How to buy safely from China")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇪🇸 **ESPAÑOL**\n\n" +
      "✅ **USA SIEMPRE UN AGENTE**\n" +
      "Nunca compres directo en Taobao o Weidian sin agente.\n" +
      "El agente actúa como intermediario y te protege.\n\n" +
      "✅ **PAGA CON TARJETA O PAYPAL**\n" +
      "Nunca hagas transferencias directas a desconocidos.\n\n" +
      "✅ **REVISA EL QC SIEMPRE**\n" +
      "No des enviar sin revisar las fotos QC del agente.\n\n" +
      "✅ **EMPIEZA CON PEDIDOS PEQUEÑOS**\n" +
      "Primer pedido: 1-2 productos para probar el agente y la ruta.\n\n" +
      "✅ **GUARDA TODOS LOS CHATS Y RECIBOS**\n" +
      "Por si hay reclamación necesitas pruebas.\n\n" +
      "❌ **EVITA:**\n" +
      "- Compras P2P (persona a persona)\n" +
      "- Vendedores sin valoraciones\n" +
      "- Precios demasiado buenos para ser verdad\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇬🇧 **ENGLISH**\n" +
      "Always use an agent · Pay by card · Check QC photos · Start small · Keep receipts · Avoid P2P deals"
    );
}

function respuestaAyuda() {
  return new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle("📋 Comandos disponibles | Available commands")
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇪🇸 **ESPAÑOL**\n" +
      "`!agentes` — Lista de agentes recomendados con links\n" +
      "`!tallas` — Guía de conversión de tallas China → España\n" +
      "`!qc` — Qué es el QC y cómo interpretarlo\n" +
      "`!seguridad` — Cómo comprar seguro desde China\n" +
      "`!buscar [producto]` — Busca un producto en el catálogo\n" +
      "`!convertir [enlace]` — Convierte un link de Weidian a agentes\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "🇬🇧 **ENGLISH**\n" +
      "`!agentes` — Recommended agents list with links\n" +
      "`!tallas` — Size conversion guide China → Spain/EU\n" +
      "`!qc` — What is QC and how to read it\n" +
      "`!seguridad` — How to buy safely from China\n" +
      "`!buscar [product]` — Search a product in the catalog\n" +
      "`!convertir [link]` — Convert a Weidian link to agents\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n" +
      "💬 También puedes mencionarme con @HelperBot [tu pregunta]\n" +
      "💬 You can also mention me with @HelperBot [your question]"
    );
}

function respuestaMencion() {
  const popularProducts = products.slice(0, 3).map((p, i) => {
    const links = getAgentLinks(p.weidianId);
    return `**${i + 1}. ${p.nombre}**\n💰 $${p.precio} | 🏷️ ${p.marca}\n🔥 [USFans](${links.usfans}) • ⚡ [Litbuy](${links.litbuy}) • 🚀 [KakoBuy](${links.kakobuy})\n`;
  }).join("\n");

  return new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle("🤖 Helper Bot FindsES")
    .setDescription(
      "¡Hola! Soy el Helper Bot de FindsES.\n\n" +
      "Puedo ayudarte con:\n" +
      "🔍 **Buscar productos** - `!buscar [producto]`\n" +
      "🔄 **Convertir links** - `!convertir [link de weidian]`\n" +
      "🛍️ **Ver agentes recomendados** - `!agentes`\n" +
      "📏 **Guía de tallas** - `!tallas`\n" +
      "📸 **Qué es el QC** - `!qc`\n" +
      "🔒 **Cómo comprar seguro** - `!seguridad`\n\n" +
      "**Productos populares:**\n" +
      `${popularProducts}\n` +
      "💡 Usa los comandos o pregunta directamente: `!buscar [tu producto]`"
    );
}

function respuestaNoResultados(query) {
  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(`🔍 No encontré "${query}" en el catálogo`)
    .setDescription(
      "Prueba con:\n" +
      "- Nombre en inglés\n" +
      "- Solo la marca: `!buscar nike`\n" +
      "- Modelo exacto: `!buscar air force 1 low`\n\n" +
      "💡 También puedes buscar en: https://chinabuyhub.com\n" +
      "❓ ¿Necesitas ayuda? Pregunta en #dudas-principiantes"
    );
}

function respuestaLinkNoReconocido() {
  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle("🔄 No reconozco ese enlace")
    .setDescription(
      "Formatos soportados:\n" +
      "- Links de Weidian: weidian.com/item...\n" +
      "- Links de Taobao: item.taobao.com...\n" +
      "- Links de 1688: detail.1688.com...\n\n" +
      "Pega el link completo e intentaré convertirlo a todos los agentes."
    );
}

function escogerRespuestaPorTexto(textoPlano) {
  const t = textoPlano.toLowerCase();
  if (t.includes("agente") || t.includes("usfans") || t.includes("litbuy") || t.includes("kakobuy")) {
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
  return respuestaMencion();
}

client.once("ready", async () => {
  console.log(`🔥 Helper bot online como: ${client.user.tag}`);
  await loadProducts();
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const texto = message.content.replace(/<@!?\d+>/g, "").trim();
    if (!texto) {
      return message.reply({ embeds: [respuestaMencion()] });
    }
    const embed = escogerRespuestaPorTexto(texto);
    return message.reply({ embeds: [embed] });
  }

  if (!message.content.startsWith("!")) return;

  const [cmdRaw, ...args] = message.content.slice(1).split(/\s+/);
  const cmd = cmdRaw.toLowerCase();

  if (cmd === "ping") {
    return message.reply("🏓 Pong! | Estoy vivo y listo para ayudarte.");
  }

  if (cmd === "buscar") {
    if (message.channel.id !== CANAL_BUSCAR_PRODUCTO_ID) {
      return message.reply("⚠️ 🇪🇸 Usa este comando solo en #buscar-producto / 🇺🇸 Use this command only in #buscar-producto");
    }
    const query = args.join(" ").toLowerCase();
    if (!query) {
      return message.reply({ embeds: [respuestaBuscar()] });
    }

    if (!products.length) {
      return message.reply("📦 Los productos aún se están cargando, espera un momento...");
    }

    const results = products
      .filter(p => p.nombre.toLowerCase().includes(query) || p.marca.toLowerCase().includes(query))
      .slice(0, 5);

    if (results.length === 0) {
      return message.reply({ embeds: [respuestaNoResultados(query)] });
    }

    const lines = results.map((p, i) => {
      const links = getAgentLinks(p.weidianId);
      let line = `**${i + 1}. ${p.nombre}**\n💰 $${p.precio}`;
      if (p.marca) line += ` | 🏷️ ${p.marca}`;
      if (links) {
        line += `\n🔥 [USFans](${links.usfans}) • ⚡ [Litbuy](${links.litbuy}) • 🚀 [KakoBuy](${links.kakobuy})`;
      }
      return line;
    });

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle(`🔍 Resultados para "${query}"`)
      .setDescription(lines.join("\n\n") + `\n\n📊 [Ver todos los productos](${SHEET_URL})`)
      .setFooter({ text: "ChinaBuyHub" });

    return message.reply({ embeds: [embed] });
  }

  if (cmd === "convertir") {
    if (message.channel.id !== CANAL_CONVERTIR_LINK_ID) {
      return message.reply("⚠️ 🇪🇸 Usa este comando solo en #convertir-link / 🇺🇸 Use this command only in #convertir-link");
    }
    const link = args.join(" ");
    if (!link) {
      return message.reply({ embeds: [respuestaLinkNoReconocido()] });
    }

    const weidianId = extractWeidianId(link);
    if (!weidianId) {
      return message.reply({ embeds: [respuestaLinkNoReconocido()] });
    }

    const links = getAgentLinks(weidianId);
    const embed = new EmbedBuilder()
      .setColor(0xf97316)
      .setTitle("🔄 Links convertidos")
      .setDescription(
        `🔹 **Weidian ID:** ${weidianId}\n\n` +
        `🔥 [Comprar en USFans](${links.usfans})\n` +
        `⚡ [Comprar en Litbuy](${links.litbuy})\n` +
        `🚀 [Comprar en KakoBuy](${links.kakobuy})`
      )
      .setFooter({ text: "ChinaBuyHub" });

    return message.reply({ embeds: [embed] });
  }

  if (cmd === "ayuda" || cmd === "help") {
    return message.reply({ embeds: [respuestaAyuda()] });
  }

  if (cmd === "agentes") {
    return message.reply({ embeds: [respuestaAgentes()] });
  }

  if (cmd === "tallas") {
    return message.reply({ embeds: [respuestaTallas()] });
  }

  if (cmd === "qc") {
    return message.reply({ embeds: [respuestaQC()] });
  }

  if (cmd === "seguridad") {
    return message.reply({ embeds: [respuestaSeguridad()] });
  }

  if (cmd === "links") {
    return message.reply({ embeds: [respuestaLinks()] });
  }
});

client.login(TOKEN);
