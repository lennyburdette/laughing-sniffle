import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Read the 512x512 SVG as the source
  const svg512 = readFileSync(join(publicDir, 'pwa-512x512.svg'));
  const svg192 = readFileSync(join(publicDir, 'pwa-192x192.svg'));

  // Generate 512x512 PNG
  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate 192x192 PNG
  await sharp(svg192)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate apple-touch-icon (180x180)
  await sharp(svg512)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon (32x32)
  await sharp(svg512)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  // Generate favicon.ico alternative (16x16)
  await sharp(svg512)
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('Created favicon-16x16.png');

  // Generate maskable icon (with padding for safe area)
  // Create a slightly zoomed out version for maskable
  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
