#!/usr/bin/env python3
"""Собирает звуки предметов приглашения: разлом сургуча, шорох и выдвижение бумаги, стирание серебра.

Все звуки синтезированы из шума этим скриптом — чужие записи и библиотеки сэмплов не используются.

Запуск:  python3 scripts/make-sfx.py
Нужны:   numpy, scipy, ffmpeg (libmp3lame)
Итог:    public/media/audio/sfx/*.mp3
"""

import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = Path(__file__).resolve().parent.parent / 'public' / 'media' / 'audio' / 'sfx'
rng = np.random.default_rng(231024)


def band(signal, low, high, order=2):
    high = min(high, SR / 2 - 200)
    return sosfilt(butter(order, [low, high], btype='bandpass', fs=SR, output='sos'), signal)


def grain(seconds, low, high, decay):
    """Короткий щелчок: полосовой шум с экспоненциальным затуханием."""
    n = max(int(seconds * SR), 8)
    t = np.arange(n) / SR
    return band(rng.normal(0, 1, n), low, high) * np.exp(-t / decay)


def place(buffer, at, signal, level=1.0):
    start = int(at * SR)
    end = min(start + len(signal), len(buffer))
    if end > start:
        buffer[start:end] += signal[: end - start] * level


def smooth_noise(n, cutoff):
    """Медленно меняющаяся случайная огибающая 0..1."""
    raw = sosfilt(butter(2, cutoff, btype='lowpass', fs=SR, output='sos'), rng.normal(0, 1, n))
    raw = np.abs(raw)
    return raw / (raw.max() + 1e-9)


def room(signal, decay=0.07, wet=0.12):
    n = int(decay * 5 * SR)
    t = np.arange(n) / SR
    impulse = band(rng.normal(0, 1, n), 300, 7000) * np.exp(-t / decay)
    impulse /= np.sqrt(np.sum(impulse**2))
    return signal + wet * fftconvolve(signal, impulse)[: len(signal)]


def finish(signal, fade_in=0.002, fade_out=0.04, peak_db=-3.0):
    a = int(fade_in * SR)
    b = int(fade_out * SR)
    signal = signal.copy()
    signal[:a] *= np.linspace(0, 1, a)
    signal[-b:] *= np.linspace(1, 0, b)
    return signal / np.max(np.abs(signal)) * 10 ** (peak_db / 20)


def seal_crack():
    """Хрупкий сургуч: резкий щелчок, второй надлом, глухой толчок и осыпающиеся крошки."""
    out = np.zeros(int(0.62 * SR))
    t = np.arange(int(0.12 * SR)) / SR

    place(out, 0.004, grain(0.05, 1200, 9500, 0.006), 1.0)
    place(out, 0.004, np.sin(2 * np.pi * 2150 * t) * np.exp(-t / 0.011), 0.42)
    place(out, 0.004, np.sin(2 * np.pi * 3480 * t) * np.exp(-t / 0.007), 0.28)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(175, 85, len(t))) / SR) * np.exp(-t / 0.04)
    place(out, 0.002, thump, 0.55)

    place(out, 0.041, grain(0.04, 2000, 10500, 0.0045), 0.6)
    place(out, 0.041, np.sin(2 * np.pi * 2760 * t) * np.exp(-t / 0.008), 0.2)
    place(out, 0.074, grain(0.03, 2600, 11000, 0.0035), 0.36)

    for _ in range(16):
        at = rng.uniform(0.1, 0.42)
        place(out, at, grain(0.02, 3200, 11500, rng.uniform(0.0015, 0.004)), 0.2 * (0.46 - at) / 0.36 * rng.uniform(0.4, 1))
    return finish(room(out, 0.06, 0.14), fade_out=0.08)


def paper_rustle():
    """Створки конверта: сотни мелких хрустов плотной бумаги поверх мягкого шороха."""
    seconds = 1.05
    n = int(seconds * SR)
    out = np.zeros(n)
    time = np.arange(n) / SR
    density = np.clip(time / 0.1, 0, 1) * np.clip((seconds - time) / 0.5, 0, 1) ** 1.3

    for _ in range(300):
        at = rng.beta(1.7, 2.6) * (seconds - 0.08)
        center = np.exp(rng.uniform(np.log(1700), np.log(8200)))
        level = rng.lognormal(-1.1, 0.7) * density[int(at * SR)]
        place(out, at, grain(0.03, center * 0.7, center * 1.45, rng.uniform(0.002, 0.013)), level)

    bed = band(rng.normal(0, 1, n), 700, 5200) * (0.35 + 0.65 * smooth_noise(n, 22)) * density
    out += 0.16 * bed / np.max(np.abs(bed))
    return finish(room(out, 0.05, 0.1), fade_in=0.01, fade_out=0.2)


def paper_slide():
    """Лист выходит из конверта: трение бумаги о бумагу, тон поднимается, в конце лист ложится."""
    seconds = 1.0
    n = int(seconds * SR)
    time = np.arange(n) / SR
    progress = time / seconds

    def bump(center, width):
        return np.exp(-((progress - center) ** 2) / (2 * width**2))

    low = band(rng.normal(0, 1, n), 380, 1300) * bump(0.22, 0.2)
    mid = band(rng.normal(0, 1, n), 1300, 3600) * bump(0.45, 0.24)
    high = band(rng.normal(0, 1, n), 3600, 8500) * bump(0.62, 0.22)
    out = 0.9 * low / np.max(np.abs(low)) + 1.0 * mid / np.max(np.abs(mid)) + 0.55 * high / np.max(np.abs(high))

    fibre = 0.72 + 0.28 * smooth_noise(n, 95)
    out *= fibre * np.clip(time / 0.14, 0, 1) * np.clip((seconds - time) / 0.34, 0, 1)

    for _ in range(26):
        at = rng.uniform(0.62, 0.92)
        center = np.exp(rng.uniform(np.log(2200), np.log(7500)))
        place(out, at, grain(0.02, center * 0.7, center * 1.4, rng.uniform(0.002, 0.008)), 0.1 * rng.uniform(0.3, 1))
    return finish(room(out, 0.05, 0.08), fade_in=0.02, fade_out=0.12)


def foil_scratch():
    """Монета по серебряному слою: зернистое прерывистое трение. Звук зацикливается в коде."""
    seconds = 1.7
    n = int(seconds * SR)
    out = np.zeros(n)

    stick_slip = smooth_noise(n, 140) ** 1.6
    out += band(rng.normal(0, 1, n), 1500, 6500) * (0.25 + 0.75 * stick_slip)

    for _ in range(int(520 * seconds)):
        at = rng.uniform(0, seconds - 0.02)
        center = np.exp(rng.uniform(np.log(3000), np.log(9000)))
        place(out, at, grain(0.008, center * 0.75, center * 1.35, rng.uniform(0.0008, 0.0028)), rng.lognormal(-1.6, 0.6))
    out *= 0.8 + 0.2 * smooth_noise(n, 9)
    return finish(out, fade_in=0.02, fade_out=0.02, peak_db=-4.0)


SOUNDS = {
    'seal-crack': seal_crack,
    'paper-rustle': paper_rustle,
    'paper-slide': paper_slide,
    'foil-scratch': foil_scratch,
}

OUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as folder:
    for name, build in SOUNDS.items():
        signal = build()
        wav_path = Path(folder) / f'{name}.wav'
        with wave.open(str(wav_path), 'wb') as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(SR)
            handle.writeframes((np.clip(signal, -1, 1) * 32767).astype('<i2').tobytes())
        target = OUT / f'{name}.mp3'
        subprocess.run(
            ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav_path),
             '-codec:a', 'libmp3lame', '-b:a', '80k', '-ar', '44100', '-ac', '1', '-map_metadata', '-1',
             '-metadata', 'comment=Synthesized by scripts/make-sfx.py', str(target)],
            check=True,
        )
        print(f'{target.name}: {len(signal) / SR:.2f} с, {target.stat().st_size / 1024:.1f} КБ')
