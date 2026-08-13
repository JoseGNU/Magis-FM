document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. CONTROL DEL MENÚ DESPLEGABLE (OFF-CANVAS)
  // ==========================================
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const closeNavBtn = document.getElementById('closeNavBtn');
  const sideNav = document.getElementById('sideNav');
  const sideNavOverlay = document.getElementById('sideNavOverlay');

  function openNav(e) {
    if (e) e.preventDefault();
    sideNav.classList.add('active');
    sideNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNav(e) {
    if (e) e.preventDefault();
    sideNav.classList.remove('active');
    sideNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', openNav);
  }
  if (closeNavBtn) {
    closeNavBtn.addEventListener('click', closeNav);
  }
  if (sideNavOverlay) {
    sideNavOverlay.addEventListener('click', closeNav);
  }


  // ==========================================
  // 2. MOTOR DE TEXT-TO-SPEECH (LECTOR DE NOTICIAS)
  // ==========================================
  const cards = document.querySelectorAll('.news-card');
  let currentUtterance = null;
  let activeSpeechBtn = null;
  let systemVoices = [];

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

    const totalWords = (title + " " + text).split(/\s+/).length;
    const wordsPerMinute = parseInt(timeBadge.getAttribute('data-wpm')) || 200;
    const rawMinutes = totalWords / wordsPerMinute;
    
    if (rawMinutes < 0.75) {
      timeBadge.innerText = `Sec. de lectura`;
    } else {
      timeBadge.innerText = `${Math.round(rawMinutes)} min. de lectura`;
    }

    ttsBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      if (window.speechSynthesis.speaking && activeSpeechBtn === ttsBtn) {
        window.speechSynthesis.cancel();
        resetTtsState();
        return;
      }

      window.speechSynthesis.cancel();
      if (activeSpeechBtn) resetTtsState();

      if (!audio.paused) {
        playBtn.click();
      }

      const textToRead = `${title}. ${text}`;
      currentUtterance = new SpeechSynthesisUtterance(textToRead);

      if (systemVoices.length === 0) loadVoices();

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
  // 3. REPRODUCTOR DE RADIO EN VIVO
  // ==========================================
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const equalizer = document.getElementById('equalizer');
  const volumeSlider = document.getElementById('volumeSlider');
  const muteBtn = document.getElementById('muteBtn');
  const loader = document.getElementById('loader');
  const playerStateText = document.getElementById('playerStateText');

  const streamUrl = "https://paginas.moisespaulino.com/proxy/magisfm/xstream";
  let lastVolume = 1;

  audio.volume = parseFloat(volumeSlider.value);

  playBtn.addEventListener('click', () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      resetTtsState();
    }

    if (audio.paused) {
      if (loader) loader.classList.remove('hidden');
      if (playerStateText) playerStateText.classList.remove('hidden');
      
      audio.src = streamUrl;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          playIcon.classList.add('hidden');
          pauseIcon.classList.remove('hidden');
          equalizer.classList.add('active');
          if (loader) loader.classList.add('hidden');
          if (playerStateText) playerStateText.classList.add('hidden');
        }).catch(err => {
          console.error("Error al iniciar audio:", err);
          if (loader) loader.classList.add('hidden');
          if (playerStateText) playerStateText.classList.add('hidden');
        });
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      equalizer.classList.remove('active');
      if (loader) loader.classList.add('hidden');
      if (playerStateText) playerStateText.classList.add('hidden');
    }
  });

  ['playing', 'canplay', 'loadedmetadata', 'error'].forEach(evt => {
    audio.addEventListener(evt, () => {
      if (loader) loader.classList.add('hidden');
      if (playerStateText) playerStateText.classList.add('hidden');
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
