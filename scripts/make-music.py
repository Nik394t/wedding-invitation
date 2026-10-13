#!/usr/bin/env python3
"""Собирает фоновую мелодию приглашения.

Мелодия — гимновый напев HYFRYDOL (Роуленд Причард, 1830, общественное достояние),
на который поют «Love Divine, All Loves Excelling» Чарльза Уэсли. Аранжировка и звук
синтезированы этим скриптом: чужие записи и сэмплы не используются.

Запуск:  python3 scripts/make-music.py
Нужны:   numpy, scipy, ffmpeg (libmp3lame)
Итог:    public/media/audio/love-divine.mp3
"""

import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfiltfilt

SR = 44100
BPM = 63  # спокойный темп колыбельной, четверть = 63
OUT = Path(__file__).resolve().parent.parent / 'public' / 'media' / 'audio' / 'love-divine.mp3'
TARGET_LUFS = -24.0  # тихий фон; iOS игнорирует громкость из JS, поэтому уровень задаётся здесь

rng = np.random.default_rng(20261024)


def hz(midi_note: float) -> float:
    return 440.0 * 2 ** ((midi_note - 69) / 12)


# ── Ноты (F-dur, 3/4). Буквы как в ABC: B = си-бемоль, строчные — вторая октава.
PITCH = {'F': 65, 'G': 67, 'A': 69, 'B': 70, 'c': 72, 'd': 74}

PHRASE_A = ['F2 G', 'F G A', 'B2 A', 'G F G', 'c2 B', 'A2 A', 'G F G', 'F3']
PHRASE_B = ['c2 c', 'c B A', 'B2 B', 'B A G', 'A2 A', 'A B c', 'c B A', 'G3']
PHRASE_C = ['c A c', 'B G B', 'A F A', 'G A G', 'c2 c', 'd c B', 'A2 G', 'F3']

# Аккорды: (бас, тоны арпеджио по возрастанию)
CH = {
    'F': (41, [53, 57, 60]),
    'F/A': (45, [53, 57, 60]),
    'F/C': (48, [53, 57, 60]),
    'Bb': (46, [53, 58, 62]),
    'C': (48, [55, 60, 64]),
    'C7': (48, [55, 58, 64]),
    'Gm': (43, [55, 58, 62]),
    'Dm': (50, [57, 62, 65]),
}

HARMONY_A = [['F'], ['F'], ['Bb'], ['C7'], ['F/A'], ['Dm'], ['C7'], ['F']]
HARMONY_B = [['F'], ['F/A'], ['Gm'], ['C7'], ['Dm'], ['F'], ['Bb'], ['C']]
HARMONY_C = [['F'], ['Gm'], ['F/A'], ['C'], ['F'], ['Bb'], ['F/C', 'F/C', 'C7'], ['F']]


def parse(bar: str):
    notes = []
    for token in bar.split():
        notes.append((PITCH[token[0]], float(token[1:] or 1)))
    return notes


# ── Форма: вступление → A A B C → B C (тише, с подкладом) → кода.
sections = []  # (мелодия, гармония, октава мелодии, сила, подклад)
sections += [(None, [['F'], ['F']], 0, 0.8, False)]
sections += [(PHRASE_A, HARMONY_A, 12, 0.9, False)]
sections += [(PHRASE_A, HARMONY_A, 12, 1.0, False)]
sections += [(PHRASE_B, HARMONY_B, 12, 1.0, True)]
sections += [(PHRASE_C, HARMONY_C, 12, 1.0, True)]
sections += [(PHRASE_B, HARMONY_B, 0, 0.82, True)]
sections += [(PHRASE_C, HARMONY_C, 12, 0.9, True)]
sections += [(None, [['F'], ['F']], 0, 0.6, True)]

beat = 60.0 / BPM
total_bars = sum(len(harmony) for _, harmony, *_ in sections)
length = int((total_bars * 3 * beat + 9.0) * SR)
dry = np.zeros((length, 2), dtype=np.float64)


def add(buffer, start_time, signal, pan):
    start = int(start_time * SR)
    end = min(start + len(signal), len(buffer))
    if end <= start:
        return
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    buffer[start:end, 0] += signal[: end - start] * left
    buffer[start:end, 1] += signal[: end - start] * right


def celesta(midi_note, ring, level):
    """Музыкальная шкатулка: чистый тон, мягкая атака, стеклянный призвук."""
    n = int(ring * SR)
    t = np.arange(n) / SR
    f = hz(midi_note)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.25)
    body += 0.34 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.85)
    body += 0.1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / 0.4)
    chime = 0.12 * np.sin(2 * np.pi * 5.42 * f * t) * np.exp(-t / 0.09)
    attack = np.minimum(t / 0.005, 1.0)
    return (body + chime) * attack * level


def harp(midi_note, ring, level):
    """Арфа / фетровое фортепиано для арпеджио."""
    n = int(ring * SR)
    t = np.arange(n) / SR
    f = hz(midi_note)
    tone = np.zeros(n)
    for k in range(1, 8):
        tone += np.sin(2 * np.pi * k * f * 1.0004**k * t) * (1 / k**1.75) * np.exp(-t * (0.9 + 0.55 * k))
    attack = np.minimum(t / 0.009, 1.0)
    return tone * attack * level


def pad(midi_notes, duration, level):
    """Тёплый подклад: медленно входящие синусы с лёгкой расстройкой."""
    n = int((duration + 1.6) * SR)
    t = np.arange(n) / SR
    tone = np.zeros(n)
    for note in midi_notes:
        f = hz(note)
        tone += np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.004 * t + 1.0)
        tone += 0.18 * np.sin(2 * np.pi * 2 * f * t)
    envelope = np.minimum(t / 1.1, 1.0) * np.minimum((t[-1] - t) / 1.5, 1.0)
    return tone * envelope * level / len(midi_notes)


# ── Сведение по тактам.
time = 0.6
for melody, harmony, octave, power, with_pad in sections:
    for index, chords in enumerate(harmony):
        last_bar = index == len(harmony) - 1
        stretch = 1.09 if last_bar else (1.03 if index == len(harmony) - 2 else 1.0)
        b = beat * stretch

        # Арпеджио восьмыми: бас — терция/квинта — вершина — обратно.
        steps = chords if len(chords) == 3 else [chords[0]] * 3
        for quarter, name in enumerate(steps):
            bass, tones = CH[name]
            pattern = [(bass, 0.95), (tones[1], 0.5)] if quarter == 0 else (
                [(tones[0], 0.55), (tones[2], 0.6)] if quarter == 1 else [(tones[1], 0.5), (tones[0], 0.45)]
            )
            if len(chords) == 3 and quarter == 2:
                pattern = [(bass, 0.8), (tones[1], 0.5)]
            for eighth, (note, velocity) in enumerate(pattern):
                at = time + (quarter + eighth * 0.5) * b + rng.normal(0, 0.006)
                loud = 0.2 * velocity * power * (1 + rng.normal(0, 0.05))
                add(dry, at, harp(note, 3.2, loud), -0.28 if eighth == 0 else 0.22)

        if with_pad:
            bass, tones = CH[steps[0]]
            add(dry, time, pad([bass + 12, tones[0], tones[2]], 3 * b, 0.05 * power), 0.0)

        if melody:
            at = time
            for note, beats in parse(melody[index]):
                loud = 0.3 * power * (1 + rng.normal(0, 0.04))
                add(dry, at + rng.normal(0, 0.004), celesta(note + octave, 3.4, loud), 0.1)
                # Тихое удвоение октавой ниже придаёт мелодии тело.
                add(dry, at + 0.012, harp(note + octave - 12, 2.6, loud * 0.42), -0.08)
                at += beats * b
        time += 3 * b

# Заключительный аккорд.
for note, delay in ((41, 0.0), (53, 0.09), (60, 0.18), (65, 0.27), (69, 0.36), (77, 0.47)):
    add(dry, time + delay, harp(note, 4.5, 0.2), 0.0)
add(dry, time + 0.47, celesta(77, 4.5, 0.2), 0.1)
end_time = time + 5.5

# ── Реверберация: свёртка с синтетическим «залом».
ir_len = int(2.6 * SR)
ir_t = np.arange(ir_len) / SR
wet = np.zeros_like(dry)
soft = butter(2, [180, 5200], btype='bandpass', fs=SR, output='sos')
for channel in range(2):
    impulse = rng.normal(0, 1, ir_len) * np.exp(-ir_t / 0.62)
    impulse[: int(0.012 * SR)] = 0
    impulse = sosfiltfilt(soft, impulse)
    impulse /= np.sqrt(np.sum(impulse**2))
    wet[:, channel] = fftconvolve(dry[:, channel], impulse)[: len(dry)]

mix = dry + 0.33 * wet
mix = mix[: int(end_time * SR)]
mix = sosfiltfilt(butter(2, 60, btype='highpass', fs=SR, output='sos'), mix, axis=0)
mix = sosfiltfilt(butter(2, 9000, btype='lowpass', fs=SR, output='sos'), mix, axis=0)

fade_in = int(1.2 * SR)
fade_out = int(4.0 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None] ** 2
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 2
mix /= np.max(np.abs(mix))
mix *= 10 ** (-3 / 20)

# ── Запись WAV и кодирование с выравниванием громкости.
OUT.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as folder:
    wav_path = Path(folder) / 'love-divine.wav'
    with wave.open(str(wav_path), 'wb') as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())

    probe = subprocess.run(
        ['ffmpeg', '-hide_banner', '-nostats', '-i', str(wav_path), '-af', 'ebur128', '-f', 'null', '-'],
        capture_output=True,
        text=True,
    )
    loudness = None
    for line in probe.stderr.splitlines():
        if line.strip().startswith('I:') and 'LUFS' in line:
            loudness = float(line.split('I:')[1].split('LUFS')[0])
    if loudness is None:
        sys.exit('Не удалось измерить громкость через ffmpeg ebur128')
    gain = TARGET_LUFS - loudness

    subprocess.run(
        [
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav_path),
            '-af', f'volume={gain:.2f}dB',
            '-codec:a', 'libmp3lame', '-b:a', '96k', '-ar', '44100', '-ac', '2',
            '-map_metadata', '-1',
            '-metadata', 'title=Love Divine (Hyfrydol)',
            '-metadata', 'composer=Rowland H. Prichard, 1830',
            '-metadata', 'comment=Public domain tune; arrangement synthesized by scripts/make-music.py',
            str(OUT),
        ],
        check=True,
    )

print(f'{OUT}  длительность {end_time:.1f} с, исходная громкость {loudness:.1f} LUFS, усиление {gain:+.1f} дБ')
