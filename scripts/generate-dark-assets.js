const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAll() {
  console.log('--- Generating Dark Theme Icons and Splash Screens ---');

  // 1. Prepare Base Icon (512x512)
  // Emblem safe zone: 320x238 centered on 512x512 jet dark background
  const emblemBuf = await sharp('apps/web/public/dark-icon-512.png')
    .extract({ left: 56, top: 107, width: 400, height: 297 })
    .resize(320, 238, { fit: 'contain' })
    .toBuffer();

  const baseIcon512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 15, b: 29, alpha: 1 }, // Luxury Deep Navy/Black
    },
  })
    .composite([
      {
        input: emblemBuf,
        top: Math.round((512 - 238) / 2),
        left: Math.round((512 - 320) / 2),
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
  await sharp(baseIcon512).flatten({ background: { r: 10, g: 15, b: 29 } }).toFile('android/store_icon.png');
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

  // 2. Prepare Splash Screens
  // Extract full logo (emblem + HotelFlexi text) from dark-logo.png
  const fullLogoBuf = await sharp('apps/web/public/dark-logo.png')
    .extract({ left: 336, top: 165, width: 1000, height: 600 })
    .toBuffer();

  const splashSizes = {
    'drawable-mdpi': 300,
    'drawable-hdpi': 450,
    'drawable-xhdpi': 600,
    'drawable-xxhdpi': 900,
    'drawable-xxxhdpi': 1200,
  };

  for (const [folder, S] of Object.entries(splashSizes)) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const targetW = Math.round(S * 0.65);
    const targetH = Math.round((600 * targetW) / 1000);

    const resizedLogo = await sharp(fullLogoBuf).resize(targetW, targetH).toBuffer();

    await sharp({
      create: {
        width: S,
        height: S,
        channels: 4,
        background: { r: 10, g: 15, b: 29, alpha: 1 }, // Same deep navy/black
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

    console.log(`✓ ${folder} splash.png (${S}x${S}) generated`);
  }

  // 3. Crop light-logo.png to remove huge excess whitespace for web display
  const croppedLightLogo = await sharp('apps/web/public/light-logo.png')
    .extract({ left: 277, top: 149, width: 1117, height: 646 })
    .toBuffer();
  await sharp(croppedLightLogo).toFile('apps/web/public/light-logo.png');
  console.log('✓ light-logo.png cropped to exact content bounds (1117x646)');

  console.log('--- All Dark Theme Assets Generated Successfully! ---');
}

generateAll().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
