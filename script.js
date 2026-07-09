let audioCtx = null;
let masterGainNode = null;
let analyserNode = null;
let activeSounds = {};
let currentVolume = 0.8;
let animationId = null;

const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");
const stopAllButton = document.getElementById("stop-all");
const soundCards = document.querySelectorAll(".sound-card");
const canvas = document.getElementById("spectrum");
const ctx = canvas.getContext("2d");

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioCtx.createGain();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 64;
        masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
        masterGainNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        startSpectrum();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

volumeSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    currentVolume = val / 100;
    volumeValue.textContent = `${val}%`;

    if (masterGainNode) {
        masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
    }
});

stopAllButton.addEventListener("click", () => {
    Object.keys(activeSounds).forEach(id => {
        stopSoundSource(id);
    });
});

soundCards.forEach(card => {
    card.addEventListener("click", () => {
        initAudio();
        const soundId = card.dataset.sound;
        playSound(soundId, card);
    });
});

function playSound(id, card) {
    if (activeSounds[id]) {
        stopSoundSource(id);
    }

    card.classList.add("playing");
    const activeNodes = [];
    const now = audioCtx.currentTime;

    switch (id) {
        case "1": // XP Orb
            playXPOrb(now, activeNodes);
            break;
        case "2": // Door Open
            playDoorOpen(now, activeNodes);
            break;
        case "3": // Death
            playDeath(now, activeNodes);
            break;
        case "4": // Block Break
            playBlockBreak(now, activeNodes);
            break;
        case "5": // Pig Oink
            playPigOink(now, activeNodes);
            break;
        case "6": // Zombie Groan
            playZombieGroan(now, activeNodes);
            break;
        case "7": // Villager
            playVillager(now, activeNodes);
            break;
        case "8": // Sheep Baa
            playSheepBaa(now, activeNodes);
            break;
        case "9": // Creeper Hiss
            playCreeperHiss(now, activeNodes);
            break;
        case "10": // Level Up
            playLevelUp(now, activeNodes);
            break;
        case "11": // Note Pling
            playNotePling(now, activeNodes);
            break;
        case "12": // Water Splash
            playWaterSplash(now, activeNodes);
            break;
    }

    activeSounds[id] = {
        nodes: activeNodes,
        card: card,
        timeout: setTimeout(() => {
            card.classList.remove("playing");
            delete activeSounds[id];
        }, getSoundDuration(id) * 1000)
    };
}

function stopSoundSource(id) {
    const sound = activeSounds[id];
    if (sound) {
        clearTimeout(sound.timeout);
        sound.nodes.forEach(node => {
            try {
                node.stop();
            } catch (e) {}
            try {
                node.disconnect();
            } catch (e) {}
        });
        sound.card.classList.remove("playing");
        delete activeSounds[id];
    }
}

function getSoundDuration(id) {
    switch (id) {
        case "9": return 1.0; // Creeper Hiss
        case "10": return 1.5; // Level Up
        case "3": return 1.0; // Death
        default: return 0.5;
    }
}

function createOscillator(type, freq, now, nodesList) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    gain.connect(masterGainNode);
    nodesList.push(osc);
    return { osc, gain };
}

function createNoiseBuffer(duration) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function startSpectrum() {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        animationId = requestAnimationFrame(draw);
        analyserNode.getByteFrequencyData(dataArray);
        
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, width, height);
        
        const barWidth = width / bufferLength * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, "#55FF55");
            gradient.addColorStop(1, "#3CB371");
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    draw();
}

// Minecraft-style sounds
function playXPOrb(now, nodes) {
    const notes = [880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
        const time = now + idx * 0.1;
        const { osc, gain } = createOscillator("sine", freq, time, nodes);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
    });
}

function playDoorOpen(now, nodes) {
    const { osc, gain } = createOscillator("square", 200, now, nodes);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
}

function playDeath(now, nodes) {
    const notes = [392, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((freq, idx) => {
        const time = now + idx * 0.15;
        const { osc, gain } = createOscillator("sine", freq, time, nodes);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time);
        osc.stop(time + 0.3);
    });
}

function playBlockBreak(now, nodes) {
    const buffer = createNoiseBuffer(0.15);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainNode);

    nodes.push(noise);
    noise.start(now);
    noise.stop(now + 0.15);
}

function playPigOink(now, nodes) {
    // Replace with fun retro laser (original sound 1)
    const { osc, gain } = createOscillator("sawtooth", 1600, now, nodes);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
}

function playZombieGroan(now, nodes) {
    // Replace with retro jump (original sound 2)
    const { osc, gain } = createOscillator("triangle", 150, now, nodes);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.35);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
}

function playVillager(now, nodes) {
    // Replace with retro coin pickup (original sound 4)
    const { osc, gain } = createOscillator("sine", 987.77, now, nodes); // B5
    gain.gain.setValueAtTime(0.2, now);

    setTimeout(() => {
        if (activeSounds["7"]) {
            osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime); // E6
        }
    }, 80);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
}

function playSheepBaa(now, nodes) {
    // Replace with retro power-up (original sound 5)
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
        const time = now + idx * 0.1;
        const { osc, gain } = createOscillator("triangle", freq, time, nodes);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
    });
}

function playCreeperHiss(now, nodes) {
    const buffer = createNoiseBuffer(1.0);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainNode);

    nodes.push(noise);
    noise.start(now);
    noise.stop(now + 1.0);
}

function playLevelUp(now, nodes) {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
        const time = now + idx * 0.2;
        const { osc, gain } = createOscillator("square", freq, time, nodes);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time);
        osc.stop(time + 0.3);
    });
}

function playNotePling(now, nodes) {
    // Replace with retro bell (original sound 8)
    const { osc: carrier, gain: carrierGain } = createOscillator("sine", 880, now, nodes);
    const { osc: modulator, gain: modGain } = createOscillator("sine", 440, now, nodes);

    const modNodeGain = audioCtx.createGain();
    modNodeGain.gain.setValueAtTime(300, now);
    modNodeGain.gain.exponentialRampToValueAtTime(1, now + 2.0);

    modulator.connect(modNodeGain);
    modNodeGain.connect(carrier.frequency);

    carrierGain.gain.setValueAtTime(0.2, now);
    carrierGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 2.0);
    carrier.stop(now + 2.0);
}

function playWaterSplash(now, nodes) {
    // Replace with retro zap spark (original sound 6)
    const { osc, gain } = createOscillator("sawtooth", 2000, now, nodes);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
}
