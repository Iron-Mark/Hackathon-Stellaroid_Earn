# Promotional voice-over

Neural narration mixed onto `../stellaroid-promotional-demo.mp4`.

- Voice: `en-US-AndrewNeural` (warm, first person)
- Rate: 8 percent slower than default, so the cut can breathe
- Loudness: -16 LUFS, -1.5 dB true peak
- Copy rules: first person, "graduate" not "student", Stellar testnet with no real funds, no em dashes

Script lives in [`script.json`](script.json). To rebuild after a new picture cut:

```bash
pip install edge-tts
python3 assets/campaign/voiceover/mix.py
```

That overwrites `assets/campaign/stellaroid-promotional-demo.mp4`. Keep a copy of the silent picture cut if you still need it.
