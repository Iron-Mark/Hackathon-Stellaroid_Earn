#!/usr/bin/env python3
"""Generate a neural voice-over and mix it onto the promotional demo.

Requires: pip install edge-tts, and ffmpeg on PATH.

Usage (from repo root):
  python3 assets/campaign/voiceover/mix.py
"""
from __future__ import annotations

import asyncio
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = Path(__file__).with_name("script.json")
VIDEO = ROOT / "assets/campaign/stellaroid-promotional-demo.mp4"


async def synth(text: str, voice: str, rate: str, pitch: str, dest: Path) -> None:
    import edge_tts

    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(str(dest))


def ff(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", *args], check=True, capture_output=True)


def duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(path),
        ],
        text=True,
    )
    return float(out.strip())


async def main() -> None:
    cfg = json.loads(SCRIPT.read_text())
    video_dur = duration(VIDEO)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        wavs = []
        for seg in cfg["segments"]:
            mp3 = tmp_path / f"{seg['id']}.mp3"
            wav = tmp_path / f"{seg['id']}.wav"
            await synth(seg["text"], cfg["voice"], cfg["rate"], cfg["pitch"], mp3)
            ff("-i", str(mp3), "-ar", "48000", "-ac", "2", str(wav))
            wavs.append((seg, wav, duration(wav)))

        filters = []
        labels = []
        for i, (seg, wav, dur) in enumerate(wavs, start=1):
            fade_out_start = max(dur - 0.08, 0.05)
            filters.append(
                f"[{i}:a]adelay={seg['start_ms']}|{seg['start_ms']},"
                f"afade=t=in:d=0.04,afade=t=out:st={fade_out_start:.2f}:d=0.08,"
                f"volume=1.05[a{i}]"
            )
            labels.append(f"[a{i}]")
        n = len(wavs)
        filters.append(
            "".join(labels)
            + f"amix=inputs={n}:duration=longest:dropout_transition=0:normalize=0[mix]"
        )
        filters.append("[mix]loudnorm=I=-16:TP=-1.5:LRA=11,apad=whole_dur=" f"{video_dur:.3f}[a]")

        cmd = ["-i", str(VIDEO)]
        for _, wav, _ in wavs:
            cmd += ["-i", str(wav)]
        mixed = tmp_path / "mixed.mp4"
        ff(
            *cmd,
            "-filter_complex",
            ";".join(filters),
            "-map",
            "0:v",
            "-map",
            "[a]",
            "-c:v",
            "libx264",
            "-crf",
            "22",
            "-preset",
            "medium",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(mixed),
        )
        shutil.copy2(mixed, VIDEO)
        print(f"mixed voice-over onto {VIDEO}")


if __name__ == "__main__":
    asyncio.run(main())
