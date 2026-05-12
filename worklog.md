---
Task ID: 1
Agent: Main
Task: Fix TTS speed and file upload issues in Hydravoice

Work Log:
- Identified two issues from user report: voices too slow + upload failing
- Fixed TTS speed: updated all 20 voice profiles in voices.ts - raised ttsSpeed from 0.8-0.95 range to 1.0-1.2 range so voices speak at natural pace after pitch shift compensation
- Fixed upload: created missing /api/documents/upload route
- Fixed PDF text extraction: pdf-parse v2 has worker issues in Next.js dev server (Cannot find module pdf.worker.mjs). Switched to using pdfjs-dist/legacy directly via eval('require') to bypass Next.js bundler
- Made upload work for unauthenticated users: server extracts text without saving to DB for guest users
- Updated client-side processFile to always use server upload endpoint (works for both auth and guest)
- Updated info message from "Sign in to upload" to "Sign in for longer conversions"

Stage Summary:
- TTS voices now speak at natural pace (ttsSpeed 1.0-1.2)
- PDF/TXT/DOCX uploads work for both authenticated and guest users
- PDF text extraction bypasses Next.js bundler using eval('require')
- Guest uploads return extracted text without DB save
---
Task ID: 1
Agent: Main Agent
Task: Fix voice quality - eliminate muffled/sluggish sound from crude pitch shifting

Work Log:
- Analyzed current pitch shifting approach: was using sample rate manipulation (changing WAV header from 24000Hz down to 15000-16000Hz)
- Identified root cause: low sample rates caused muffled sound, high effectiveSpeed (up to 1.84) caused garbled TTS
- Implemented proper linear interpolation resampling in audio-utils.ts - always outputs at 24000Hz
- Updated all 20 voice profiles with moderate parameters: pitchShift 1.0-1.20 (was 1.15-1.60), speed 0.9-1.15 (was 1.0-1.2)
- Updated TTS convert and preview routes to use new resampling approach
- Fixed client-side duration calculation (always 24000Hz now)
- Tested all voice types: previews and full conversion working correctly

Stage Summary:
- Old approach: effectiveSpeed up to 1.84, output at 15000-16000 Hz → muffled, sluggish, unnatural
- New approach: effectiveSpeed max 1.20, output always at 24000 Hz → clean, natural quality
- Key improvement: linear interpolation resampling stretches the waveform properly instead of just changing sample rate header
- Voice differentiation now relies on: speed variations (0.9-1.15) + subtle pitch shifts (1.0-1.20) + base voice choice (jam vs kazi)
