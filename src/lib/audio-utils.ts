/**
 * WAV audio utilities for proper concatenation and pitch shifting.
 *
 * The z-ai-web-dev-sdk TTS returns WAV files with extra metadata chunks
 * (e.g., "AIGC" chunk) between the "fmt " and "data" chunks.
 *
 * To concatenate multiple WAV chunks into one playable file, we must:
 * 1. Find the "data" chunk in each WAV file (not assume a fixed header offset)
 * 2. Extract only the raw PCM data from each chunk
 * 3. Concatenate all raw PCM data
 * 4. Write a single clean WAV header (44 bytes) for the combined data
 *
 * All TTS output is: 16-bit PCM, mono, 24000 Hz
 *
 * Pitch shifting uses proper resampling (linear interpolation) instead of
 * sample rate manipulation. This always outputs at 24000 Hz for maximum
 * quality and browser compatibility.
 */

const SAMPLE_RATE = 24000;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;
const BYTE_RATE = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
const BLOCK_ALIGN = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
const STANDARD_HEADER_SIZE = 44;

/**
 * Find the offset and size of the "data" chunk in a WAV buffer.
 * WAV files can have arbitrary chunks between "fmt " and "data",
 * so we must search for the "data" marker rather than assuming a fixed offset.
 */
export function findDataChunk(wavBuffer: Buffer): { offset: number; size: number } {
  // Start searching after the RIFF header (12 bytes: "RIFF" + size + "WAVE")
  let pos = 12;

  while (pos < wavBuffer.length - 8) {
    const chunkId = wavBuffer.toString('ascii', pos, pos + 4);
    const chunkSize = wavBuffer.readUInt32LE(pos + 4);

    if (chunkId === 'data') {
      return {
        offset: pos + 8, // Skip "data" + size fields
        size: chunkSize,
      };
    }

    // Move to the next chunk (8 bytes for chunk header + chunk data)
    // Chunk data is padded to even bytes
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos++; // Padding byte for odd-sized chunks
  }

  // Fallback: assume standard 44-byte header if "data" chunk not found
  console.warn('[audio-utils] Could not find "data" chunk in WAV, assuming 44-byte header');
  return {
    offset: STANDARD_HEADER_SIZE,
    size: wavBuffer.length - STANDARD_HEADER_SIZE,
  };
}

/**
 * Strip the WAV header from a buffer, returning only raw PCM data.
 * Properly handles WAV files with extra metadata chunks.
 */
export function stripWavHeader(wavBuffer: Buffer): Buffer {
  const { offset, size } = findDataChunk(wavBuffer);
  return wavBuffer.subarray(offset, offset + size);
}

/**
 * Create a standard 44-byte WAV header for the given PCM data size.
 */
export function createWavHeader(dataSize: number): Buffer {
  const header = Buffer.alloc(STANDARD_HEADER_SIZE);
  const totalFileSize = STANDARD_HEADER_SIZE + dataSize - 8;

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(totalFileSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);            // Sub-chunk size (16 for PCM)
  header.writeUInt16LE(1, 20);             // Audio format (1 = PCM)
  header.writeUInt16LE(NUM_CHANNELS, 22);  // Number of channels
  header.writeUInt32LE(SAMPLE_RATE, 24);   // Sample rate
  header.writeUInt32LE(BYTE_RATE, 28);     // Byte rate
  header.writeUInt16LE(BLOCK_ALIGN, 32);   // Block align
  header.writeUInt16LE(BITS_PER_SAMPLE, 34); // Bits per sample

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

/**
 * Strip extra metadata chunks from a WAV file and return a clean,
 * standard-format WAV with only RIFF/WAVE/fmt/data chunks.
 * This ensures maximum browser compatibility.
 */
export function cleanWavFile(wavBuffer: Buffer): Buffer {
  const pcmData = stripWavHeader(wavBuffer);
  const header = createWavHeader(pcmData.length);
  return Buffer.concat([header, pcmData]);
}

/**
 * Concatenate multiple WAV file buffers into a single valid WAV file.
 * Properly handles WAV files with extra metadata chunks by finding
 * the actual "data" chunk offset in each file.
 */
export function concatenateWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) {
    return Buffer.alloc(0);
  }

  if (wavBuffers.length === 1) {
    // Single chunk — clean it up (strip metadata chunks) for browser compatibility
    return cleanWavFile(wavBuffers[0]);
  }

  // Strip headers and collect raw PCM data
  const pcmChunks = wavBuffers.map(stripWavHeader);
  const totalPcmSize = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);

  // Create header + concatenated PCM
  const header = createWavHeader(totalPcmSize);
  return Buffer.concat([header, ...pcmChunks]);
}

// ═══════════════════════════════════════════════════════════════════
// Pitch Shifting — Proper Resampling Approach
// ═══════════════════════════════════════════════════════════════════

/**
 * Pitch-shift a WAV buffer using proper linear interpolation resampling.
 *
 * This approach ALWAYS outputs at 24000 Hz (standard, high quality),
 * unlike the old sample-rate-manipulation method that produced muffled
 * audio at 15000-17000 Hz.
 *
 * How it works:
 * 1. The caller generates TTS at speed = (ttsSpeed * pitchShift)
 *    → Audio is pitchShift times shorter than normal, but same pitch
 * 2. This function resamples the PCM data using linear interpolation
 *    to stretch the waveform by the pitchShift factor
 * 3. Result: Same duration as speed=ttsSpeed, pitch lowered by pitchShift,
 *    output at 24000 Hz (full quality)
 *
 * The resampling works by mapping each output sample position to a
 * fractional position in the input and interpolating between neighboring
 * samples. This is much cleaner than just changing the sample rate header.
 *
 * @param wavBuffer - WAV buffer generated at speed = ttsSpeed * pitchShift
 * @param pitchShift - Pitch shift factor. 1.0 = no change, 1.15 = ~2.5 semitones down,
 *                     1.26 = ~4 semitones down. Keep ≤ 1.3 for best quality.
 * @returns A new WAV buffer at 24000 Hz with the pitch shifted
 */
export function pitchShiftWav(wavBuffer: Buffer, pitchShift: number): Buffer {
  if (pitchShift <= 0) {
    throw new Error('pitchShift must be greater than 0');
  }

  // No shift needed
  if (Math.abs(pitchShift - 1.0) < 0.01) {
    return cleanWavFile(wavBuffer);
  }

  // Extract PCM data (16-bit signed samples)
  const pcmData = stripWavHeader(wavBuffer);
  const inputSamples = pcmData.length / 2; // 16-bit = 2 bytes per sample

  // Calculate output sample count: stretch by pitchShift factor
  const outputSamples = Math.round(inputSamples * pitchShift);
  const outputPcm = Buffer.alloc(outputSamples * 2);

  // Resample using linear interpolation
  // For each output sample, find the corresponding position in the input
  // and interpolate between the two nearest input samples
  for (let i = 0; i < outputSamples; i++) {
    // Map output position to input position
    const srcPos = (i * inputSamples) / outputSamples;
    const srcIdx = Math.floor(srcPos);
    const frac = srcPos - srcIdx;

    if (srcIdx + 1 < inputSamples) {
      // Linear interpolation between two input samples
      const s0 = pcmData.readInt16LE(srcIdx * 2);
      const s1 = pcmData.readInt16LE((srcIdx + 1) * 2);
      const interpolated = Math.round(s0 + (s1 - s0) * frac);
      // Clamp to 16-bit range
      outputPcm.writeInt16LE(
        Math.max(-32768, Math.min(32767, interpolated)),
        i * 2
      );
    } else if (srcIdx < inputSamples) {
      // Last sample — just copy
      outputPcm.writeInt16LE(pcmData.readInt16LE(srcIdx * 2), i * 2);
    }
    // Samples beyond input range are left as zero (Buffer.alloc initializes to 0)
  }

  const semitones = Math.round(12 * Math.log2(pitchShift) * 10) / 10;
  console.log(
    `[audio-utils] Pitch shift (resample): factor=${pitchShift}, ` +
    `${inputSamples} → ${outputSamples} samples, ` +
    `~${semitones} semitones down, output at ${SAMPLE_RATE} Hz`
  );

  // Write clean WAV header at standard 24000 Hz
  const header = createWavHeader(outputPcm.length);
  return Buffer.concat([header, outputPcm]);
}
