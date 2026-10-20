const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function makeTransparent(buffer, width, height, channels) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = buffer[i * channels];
    const g = buffer[i * channels + 1];
    const b = buffer[i * channels + 2];
    const maxC = Math.max(r, g, b);

    let alpha = 255;
    if (maxC < 14) {
      alpha = 0;
    } else if (maxC < 55) {
      alpha = Math.round(((maxC - 14) / 41) * 255);
    }

    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = alpha;
  }
  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function generateAll() {
  console.log('--- Generating High-Res Dark Theme Icons and Splash Screens ---');

  // Background color: #0A0F1D
  const BG_COLOR = { r: 10, g: 15, b: 29, alpha: 1 };

  // 1. Transparent Emblem from dark-icon-512.png
  const emblemRaw = await sharp('apps/web/public/dark-icon-512.png')
    .extract({ left: 56, top: 107, width: 400, height: 297 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparentEmblem = await makeTransparent(
    emblemRaw.data,
    emblemRaw.info.width,
    emblemRaw.info.height,
    emblemRaw.info.channels
  );

  // 2. Base App Icon (512x512)
  // Adaptive icon safe zone diameter is 338px. Emblem at 330x245 fits perfectly inside safe zone.
  const targetEmblemW = 330;
  const targetEmblemH = Math.round((297 * targetEmblemW) / 400);

  const resizedEmblem = await sharp(transparentEmblem)
    .resize(targetEmblemW, targetEmblemH, { fit: 'contain' })
    .toBuffer();

  const baseIcon512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: resizedEmblem,
        top: Math.round((512 - targetEmblemH) / 2),
        left: Math.round((512 - targetEmblemW) / 2),
      },
    ])
    .png()
    .toBuffer();

  // Save Web icons
  await sharp(baseIcon512).toFile('apps/web/public/icon-512.png');
  await sharp(baseIcon512).toFile('apps/web/public/icon-maskable-512.png');
  await sharp(baseIcon512).resize(192, 192).toFile('apps/web/public/icon-192.png');
  await sharp(baseIcon512).resize(192, 192).toFile('apps/web/public/icon-maskable-192.png');
  await sharp(baseIcon512).resize(180, 180).toFile('apps/web/public/apple-touch-icon.png');
  console.log('✓ Web icons updated (icon-512, icon-192, apple-touch-icon)');

  // Save Play Store icon (512x512 RGB no alpha)
  await sharp(baseIcon512).flatten({ background: BG_COLOR }).toFile('android/store_icon.png');
  console.log('✓ Play Store icon updated (android/store_icon.png)');

  // Save Android Mipmap Icons
  const mipmapSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(baseIcon512).resize(size, size).toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(baseIcon512).resize(size, size).toFile(path.join(dir, 'ic_maskable.png'));
    console.log(`✓ ${folder} (${size}x${size}) generated`);
  }

  // 3. Prepare Seamless Splash Screens
  // Extract full logo (emblem + HotelFlexi text) from dark-logo.png
  const fullLogoRaw = await sharp('apps/web/public/dark-logo.png')
    .extract({ left: 336, top: 165, width: 1002, height: 600 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparentFullLogo = await makeTransparent(
    fullLogoRaw.data,
    fullLogoRaw.info.width,
    fullLogoRaw.info.height,
    fullLogoRaw.info.channels
  );

  const splashSizes = {
    'drawable-mdpi': 360,
    'drawable-hdpi': 540,
    'drawable-xhdpi': 720,
    'drawable-xxhdpi': 1080,
    'drawable-xxxhdpi': 1440,
  };

  for (const [folder, S] of Object.entries(splashSizes)) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Logo width should be ~75% of splash screen width
    const targetW = Math.round(S * 0.75);
    const targetH = Math.round((600 * targetW) / 1002);

    const resizedLogo = await sharp(transparentFullLogo)
      .resize(targetW, targetH, { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: S,
        height: S,
        channels: 4,
        background: BG_COLOR,
      },
    })
      .composite([
        {
          input: resizedLogo,
          top: Math.round((S - targetH) / 2),
          left: Math.round((S - targetW) / 2),
        },
      ])
      .png()
      .toFile(path.join(dir, 'splash.png'));

    console.log(`✓ ${folder}/splash.png (${S}x${S}) generated seamlessly`);
  }

  console.log('--- All Mobile Assets Successfully Generated! ---');
}

generateAll().catch(console.error);
