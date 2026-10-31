# Makes קמתי's alarm sounds (synthesised here, no recordings, so they are ours to ship).
# Each is a short loop: the Android side plays it over and over until the task is done.
# Run: python3 tools/make-sounds.py   (needs numpy and ffmpeg; outputs are committed to android-res/raw)
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'android-res', 'raw')


def t(sec):
    return np.arange(int(SR * sec)) / SR


def tone(freq, sec, harmonics=(1.0,), attack=0.005, release=0.02):
    x = t(sec)
    s = sum(a * np.sin(2 * np.pi * freq * (i + 1) * x) for i, a in enumerate(harmonics))
    env = np.ones_like(x)
    a, r = int(SR * attack), int(SR * release)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r:
        env[-r:] = np.linspace(1, 0, r)
    return s * env


def silence(sec):
    return np.zeros(int(SR * sec))


def bell(freq, sec, decay=2.2):
    x = t(sec)
    partials = [(1.0, 1.0), (2.0, 0.6), (2.76, 0.45), (5.4, 0.25), (8.93, 0.12)]
    s = sum(a * np.sin(2 * np.pi * freq * p * x) * np.exp(-x * decay * p ** 0.5) for p, a in partials)
    s[: int(SR * 0.003)] *= np.linspace(0, 1, int(SR * 0.003))
    return s


def classic():
    beep = tone(2048, 0.11, (1.0, 0.0, 0.3, 0.0, 0.12))
    gap = silence(0.07)
    return np.concatenate([beep, gap] * 4 + [silence(0.55)])


def rise():
    notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
    parts = [tone(f, 0.17, (1.0, 0.35, 0.15), release=0.06) * (0.7 + 0.06 * i) for i, f in enumerate(notes)]
    return np.concatenate(parts + [silence(0.35)])


def bells():
    a = bell(880, 1.0)
    b = bell(659.25, 1.2)
    return np.concatenate([a[: int(SR * 0.45)] + 0, b])


def siren():
    x = t(1.4)
    f = 650 + 650 * (0.5 - 0.5 * np.cos(2 * np.pi * x / 1.4))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)


def digital():
    b = tone(4096, 0.065, (1.0, 0.0, 0.2))
    return np.concatenate([b, silence(0.065), b, silence(0.065), b, silence(0.065), b, silence(0.5)])


def check():
    a = bell(1318.5, 0.5, decay=4)
    b = bell(1046.5, 0.9, decay=3.5)
    return np.concatenate([a, b, silence(0.9)]) * 0.75


def write(name, sig, peak=0.93):
    sig = sig / max(1e-9, np.max(np.abs(sig))) * peak
    pcm = (sig * 32767).astype(np.int16)
    os.makedirs(OUT, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        path = f.name
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    out = os.path.join(OUT, 'kamti_' + name + '.ogg')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-c:a', 'libvorbis', '-q:a', '4', out], check=True)
    os.unlink(path)
    print(name, os.path.getsize(out), 'bytes', round(len(sig) / SR, 2), 's')


write('classic', classic())
write('rise', rise())
write('bell', bells())
write('siren', siren())
write('digital', digital())
write('check', check(), peak=0.8)
