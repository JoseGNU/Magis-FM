document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. MOTOR DE TEXT-TO-SPEECH PARA MÓVILES
  // ==========================================
  const cards = document.querySelectorAll('.news-card');
  let currentUtterance = null;
  let activeSpeechBtn = null;
  let systemVoices = [];

  // Forzar la carga de voces en navegadores móviles (iOS / Android)
  function loadVoices() {
    if (typeof speechSynthesis !== 'undefined') {
      systemVoices = window.speechSynthesis.getVoices();
    }
  }

  loadVoices();
  if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  cards.forEach(card => {
    const title = card.querySelector('.article-title').innerText;
    const text = card.querySelector('.article-text').innerText;
    const timeBadge = card.querySelector('.reading-time');
    const ttsBtn = card.querySelector('.tts-btn');
    const ttsLabel = ttsBtn.querySelector('.tts-text');

    // Tiempo estimado de lectura
    const totalWords = (title + " " + text).split(/\s+/).length;
    const wordsPerMinute = parseInt(timeBadge.getAttribute('data-wpm')) || 200;
    const rawMinutes = totalWords / wordsPerMinute;
    
    if (rawMinutes < 0.75) {
      timeBadge.innerText = `Sec. de lectura`;
    } else {
      timeBadge.innerText = `${Math.round(rawMinutes)} min. de lectura`;
    }

    // Evento de lectura optimizado para táctil
    ttsBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (window.speechSynthesis.speaking && activeSpeechBtn === ttsBtn) {
        window.speechSynthesis.cancel();
        resetTtsState();
        return;
      }

      window.speechSynthesis.cancel();
      if (activeSpeechBtn) resetTtsState();

      // Pausar la radio en vivo si está activa
      if (!audio.paused) {
        playBtn.click();
      }

      const textToRead = `${title}. ${text}`;
      currentUtterance = new SpeechSynthesisUtterance(textToRead);

      // Recargar voces por si el móvil no las había inicializado
      if (systemVoices.length === 0) loadVoices();

      // Búsqueda flexible de voz en español latino/general
      let selectedVoice = systemVoices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-US') || v.lang.includes('es-419'));
      if (!selectedVoice) {
        selectedVoice = systemVoices.find(v => v.lang.startsWith('es'));
      }

      if (selectedVoice) currentUtterance.voice = selectedVoice;
      currentUtterance.rate = 0.95;

      activeSpeechBtn = ttsBtn;
      ttsBtn.classList.add('playing-tts');
      ttsLabel.innerText = "Detener audio";

      currentUtterance.onend = () => resetTtsState();
      currentUtterance.onerror = () => resetTtsState();

      window.speechSynthesis.speak(currentUtterance);
    });
  });

  function resetTtsState() {
    if (activeSpeechBtn) {
      activeSpeechBtn.classList.remove('playing-tts');
      activeSpeechBtn.querySelector('.tts-text').innerText = "Escuchar nota";
      activeSpeechBtn = null;
      currentUtterance = null;
    }
  }


  // ==========================================
  // 2. REPRODUCTOR DE RADIO OPTIMIZADO
  // ==========================================
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const equalizer = document.getElementById('equalizer');
  const volumeSlider = document.getElementById('volumeSlider');
  const muteBtn = document.getElementById('muteBtn');
  const loader = document.getElementById('loader');

  const streamUrl = "https://paginas.moisespaulino.com/proxy/magisfm/xstream";
  let lastVolume = 1;

  audio.volume = parseFloat(volumeSlider.value);

  playBtn.addEventListener('click', () => {
    // Detener síntesis de voz al reproducir la radio
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      resetTtsState();
    }

    if (audio.paused) {
      if (loader) loader.classList.remove('hidden');
      
      // Asignar el origen e iniciar reproducción inmediatamente en la misma acción del toque
      audio.src = streamUrl;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          playIcon.classList.add('hidden');
          pauseIcon.classList.remove('hidden');
          equalizer.classList.add('active');
        }).catch(err => {
          console.error("Error al iniciar audio en móvil:", err);
          if (loader) loader.classList.add('hidden');
        });
      }
    } else {
      audio.pause();
      audio.removeAttribute('src'); // Liberar memoria de datos móviles
      
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      equalizer.classList.remove('active');
      if (loader) loader.classList.add('hidden');
    }
  });

  ['playing', 'canplay', 'loadedmetadata', 'error'].forEach(evt => {
    audio.addEventListener(evt, () => {
      if (loader) loader.classList.add('hidden');
    });
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.volume = val;
    audio.muted = (val === 0);
    if (val > 0) lastVolume = val;
  });

  muteBtn.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = lastVolume > 0 ? lastVolume : 1;
      volumeSlider.value = audio.volume;
    } else {
      lastVolume = audio.volume;
      audio.muted = true;
      audio.volume = 0;
      volumeSlider.value = 0;
    }
  });
});
