import pathlib
ROOT = pathlib.Path(__file__).parent
fixes = [
  ("src/lib/tts.ts", "import path from 'path';", "import path from 'path';\nimport { concatenateWavBuffers, pitchShiftWav } from './audio-utils';"),
  ("src/lib/tts.ts", "  outputFileName: string\n): Promise", "  outputFileName: string,\n  pitchShift: number = 1.0\n): Promise"),
  ("src/lib/tts.ts", "    const audioBuffer = await textToAudio(chunks[i], voice, speed);", "    const audioBuffer = await textToAudio(chunks[i], voice, speed * pitchShift);"),
  ("src/lib/tts.ts", "  const combinedBuffer = Buffer.concat(audioBuffers);", "  let combinedBuffer = concatenateWavBuffers(audioBuffers);\n  if (pitchShift > 1.01) { combinedBuffer = pitchShiftWav(combinedBuffer, pitchShift); }"),
  ("src/lib/tts.ts", "  const estimatedDurationSeconds = combinedBuffer.length / 48000;", "  const estimatedDurationSeconds = (combinedBuffer.length - 44) / 48000;"),
  ("src/app/api/audio/convert/route.ts", "        1.0,\n        outputFileName\n      );", "        voiceProfile.ttsSpeed,\n        outputFileName,\n        voiceProfile.pitchShift\n      );"),
  ("src/app/api/tts/convert/route.ts", "import { concatenateWavBuffers, pitchShiftWav } from '@/lib/audio-utils';", "import { concatenateWavBuffers, pitchShiftWav } from '@/lib/audio-utils';\nimport { getVoiceById } from '@/lib/voices';"),
  ("src/app/api/tts/convert/route.ts", "    const { text, voice = 'kazi', speed = 1.0, pitchShift = 1.0 } = body;", "    const { text, voiceId } = body;"),
  ("src/app/api/tts/convert/route.ts", "    if (!text || text.trim().length === 0) {\n      return NextResponse.json({ error: 'Text is required' }, { status: 400 });\n    }\n\n    // Enforce character limit", "    if (!text || text.trim().length === 0) {\n      return NextResponse.json({ error: 'Text is required' }, { status: 400 });\n    }\n\n    if (!voiceId) { return NextResponse.json({ error: 'voiceId is required' }, { status: 400 }); }\n    const voiceProfile = getVoiceById(voiceId);\n    if (!voiceProfile) { return NextResponse.json({ error: `Invalid voiceId: ${voiceId}.` }, { status: 400 }); }\n    const voice = voiceProfile.sdkVoice;\n    const speed = voiceProfile.ttsSpeed;\n    const pitchShift = voiceProfile.pitchShift;\n\n    // Enforce character limit"),
  ("src/app/api/tts/convert/route.ts", "    const validVoices = ['jam', 'kazi'];\n    if (!validVoices.includes(voice)) {\n      return NextResponse.json(\n        { error: `Invalid voice: ${voice}. Available English voices: ${validVoices.join(', ')}` },\n        { status: 400 }\n      );\n    }\n\n    // Calculate effective speed for TTS generation\n    // We generate at (speed * pitchShift) so that after resampling (stretching by pitchShift),\n    // the final playback speed is just `speed` and pitch is lowered by pitchShift\n    const effectiveSpeed = speed * pitchShift;\n\n    // Cap effective speed to ensure clean TTS output\n    // The TTS model produces garbled output above ~1.5x\n    if (effectiveSpeed < 0.5 || effectiveSpeed > 1.5) {\n      return NextResponse.json(\n        { error: `Effective speed (${effectiveSpeed.toFixed(2)}) out of range. Adjust speed or pitch shift. Must be 0.5-1.5.` },\n        { status: 400 }\n      );", "    const effectiveSpeed = speed * pitchShift;\n    if (effectiveSpeed < 0.5 || effectiveSpeed > 1.5) {\n      return NextResponse.json(\n        { error: `Voice profile \"${voiceProfile.name}\" has an invalid effective speed (${effectiveSpeed.toFixed(2)}). Must be 0.5-1.5.` },\n        { status: 500 }\n      );"),
  ("src/lib/puter-tts.ts", "        voice: voiceProfile.sdkVoice,\n        speed: voiceProfile.ttsSpeed || 1.0,\n        pitchShift: voiceProfile.pitchShift || 1.0,", "        voiceId,"),
]
changed = set()
for path, old, new in fixes:
  p = ROOT / path
  t = p.read_text()
  if old in t:
    p.write_text(t.replace(old, new, 1)); changed.add(path); print(f"OK  {path}")
  else:
    print(f"SKIP {path} (pattern not found)")
if changed:
  print("\nRun:\n  git add " + " ".join(sorted(changed)))
  print('  git commit -m "fix: restore voice differentiation"')
  print("  git push origin main")
