// Generate simple WAV sound files for the app
// WAV format works reliably on iOS PWA and bypasses silent mode when properly configured

const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, '..', 'src', 'assets', 'sounds');

// Ensure directory exists
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// WAV file generator
function generateWav(samples, sampleRate = 44100) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * 2;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write samples
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(sample * 32767), offset);
    offset += 2;
  }

  return buffer;
}

// Generate a sine wave tone with envelope
function generateTone(frequency, duration, sampleRate = 44100, volume = 0.5) {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Sine wave
    let sample = Math.sin(2 * Math.PI * frequency * t);

    // Apply envelope (attack/decay)
    const attackTime = 0.01;
    const decayStart = duration * 0.3;

    if (t < attackTime) {
      sample *= t / attackTime;
    } else if (t > decayStart) {
      const decayProgress = (t - decayStart) / (duration - decayStart);
      sample *= 1 - decayProgress;
    }

    samples[i] = sample * volume;
  }

  return samples;
}

// Concatenate sample arrays with optional gap
function concatenateSamples(...arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Generate silence
function generateSilence(duration, sampleRate = 44100) {
  return new Float32Array(Math.floor(sampleRate * duration));
}

// Timer complete sound - 3 ascending beeps (C5, E5, G5)
function generateTimerComplete() {
  const sampleRate = 44100;
  const beepDuration = 0.15;
  const gap = 0.05;

  const c5 = generateTone(523.25, beepDuration, sampleRate, 0.5);
  const silence1 = generateSilence(gap, sampleRate);
  const e5 = generateTone(659.25, beepDuration, sampleRate, 0.5);
  const silence2 = generateSilence(gap, sampleRate);
  const g5 = generateTone(783.99, beepDuration, sampleRate, 0.5);

  return concatenateSamples(c5, silence1, e5, silence2, g5);
}

// Side transition sound - 2 beeps (C5, G5) - different from timer complete
function generateSideTransition() {
  const sampleRate = 44100;
  const beepDuration = 0.12;
  const gap = 0.08;

  const c5 = generateTone(523.25, beepDuration, sampleRate, 0.4);
  const silence = generateSilence(gap, sampleRate);
  const g5 = generateTone(783.99, beepDuration, sampleRate, 0.4);

  return concatenateSamples(c5, silence, g5);
}

// Set complete sound - same as timer complete for consistency
function generateSetComplete() {
  return generateTimerComplete();
}

// Click sound - short, subtle beep
function generateClick() {
  const sampleRate = 44100;
  return generateTone(440, 0.08, sampleRate, 0.3);
}

// Generate and save all sounds
const sounds = {
  'timer-complete.wav': generateTimerComplete(),
  'side-transition.wav': generateSideTransition(),
  'set-complete.wav': generateSetComplete(),
  'click.wav': generateClick()
};

for (const [filename, samples] of Object.entries(sounds)) {
  const wavBuffer = generateWav(samples);
  const filepath = path.join(soundsDir, filename);
  fs.writeFileSync(filepath, wavBuffer);
  console.log(`Generated: ${filename} (${wavBuffer.length} bytes)`);
}

// Remove .gitkeep if it exists
const gitkeepPath = path.join(soundsDir, '.gitkeep');
if (fs.existsSync(gitkeepPath)) {
  fs.unlinkSync(gitkeepPath);
  console.log('Removed .gitkeep');
}

console.log('\nAll sound files generated successfully!');
