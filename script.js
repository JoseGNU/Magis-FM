document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. MOTOR DE TEXT-TO-SPEECH (LECTURA DE NOTAS)
  // ==========================================
  const cards = document.querySelectorAll('.news-card');
  let currentUtterance = null;
  let activeSpeechBtn = null;

  cards.forEach(card => {
    const title = card.querySelector('.article-title').innerText;
    const text = card.querySelector('.article-text').innerText;
    const timeBadge = card.querySelector('.reading-time');
    const ttsBtn = card.querySelector('.tts-btn');
    const ttsLabel = ttsBtn.querySelector('.tts-text');

    // Cálculo automático del tiempo estimado de lectura (Promedio: 200 Palabras por minuto)
    const totalWords = (title + " " + text).split(/\s+/).length;
    const wordsPerMinute = parseInt(timeBadge.getAttribute('data-wpm')) || 200;
    const rawMinutes = totalWords / wordsPerMinute;
    
    if (rawMinutes < 0.75) {
      timeBadge.innerText = `Sec. de lectura`;
    } else {
      const roundedMinutes = Math.round(rawMinutes);
      timeBadge.innerText = `${roundedMinutes} min. de lectura`;
    }

    // Configuración del click para escuchar la nota
    ttsBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Si se hace click en el botón que ya está sonando, se pausa/detiene por completo
      if (window.speechSynthesis.speaking && activeSpeechBtn === ttsBtn) {
        window.speechSynthesis.cancel();
        resetTtsState();
        return;
      }

      // Detener cualquier otra lectura activa previa
      window.speechSynthesis.cancel();
      if (activeSpeechBtn) resetTtsState();

      // Si la radio en vivo está sonando, pausarla para no sobreponer audios
      if (!audio.paused) {
        playBtn.click();
      }

      // Configurar el texto unificado a reproducir
      const textToRead = `Leyendo artículo informativo: ${title}. Detalle: ${text}`;
      currentUtterance = new SpeechSynthesisUtterance(textToRead);

      // Algoritmo de filtrado de voces: Busca una voz femenina en español Latinoamericano
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.lang.includes('es-MX') || v.lang.includes('es-US') || v.lang.includes('es-419'));
      
      // Respaldo secundario por si no encuentra la localización exacta
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('es'));
      }

      if (selectedVoice) currentUtterance.voice = selectedVoice;
      currentUtterance.rate = 0.95; // Velocidad de lectura óptima natural

      // Cambiar estado visual del botón activo
      activeSpeechBtn = ttsBtn;
      ttsBtn.classList.add('playing-tts');
      ttsLabel.innerText = "Detener audio";

      currentUtterance.onend = () => {
        resetTtsState();
      };

      currentUtterance.onerror = () => {
        resetTtsState();
      };

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

  // Carga asíncrona preventiva de las voces del sistema operativo
  if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
  }


  // ==========================================
  // 2. CONTROL DEL REPRODUCTOR DE RADIO EN VIVO
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
    // Si la lectura de un artículo está activa, detenerla antes de abrir la radio
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      resetTtsState();
    }

    if (audio.paused) {
      if (loader) loader.classList.remove('hidden');
      audio.src = streamUrl;
      
      audio.play().then(() => {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        equalizer.classList.add('active');
      }).catch(err => {
        console.error("Error al conectar el streaming:", err);
        if (loader) loader.classList.add('hidden');
      });
    } else {
      audio.pause();
      audio.removeAttribute('src'); // Destruir el buffer de descarga continua
      
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      equalizer.classList.remove('active');
      if (loader) loader.classList.add('hidden');
    }
  });

  // Eventos de estado de red para remover el spinner de carga
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