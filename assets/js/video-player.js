/**
 * video-player.js - Premium Local MP4 Video Player Controller
 * Handles custom video controls, keyboard shortcuts, subtitle loading, and local file processing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('video-file');
  const playerContainer = document.getElementById('player-container');
  const video = document.getElementById('player-video');
  
  // Controls
  const playPauseBtn = document.getElementById('btn-play-pause');
  const playPauseIcon = playPauseBtn.querySelector('i');
  const muteBtn = document.getElementById('btn-mute');
  const muteIcon = muteBtn.querySelector('i');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeSliderContainer = volumeSlider.closest('.volume-slider-container');
  const timeDisplay = document.getElementById('time-display');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const fullscreenIcon = fullscreenBtn.querySelector('i');
  
  // Timeline
  const timelineContainer = document.getElementById('timeline-container');
  const timelineProgress = document.getElementById('timeline-progress');
  const timelineBuffer = document.getElementById('timeline-buffer');
  const timelineHandle = document.getElementById('timeline-handle');
  const timelineTooltip = document.getElementById('timeline-tooltip');
  
  // Sub-controls / Secondary actions
  const speedBtn = document.getElementById('btn-speed');
  const speedText = speedBtn.querySelector('span');
  const speedOptions = document.getElementById('speed-options');
  const pipBtn = document.getElementById('btn-pip');
  const loopBtn = document.getElementById('btn-loop');
  const loopIcon = loopBtn.querySelector('i');
  
  // Panels and Overlays
  const playStateOverlay = document.getElementById('play-state-overlay');
  const playStateIcon = playStateOverlay.querySelector('i');
  
  // Metadata & Settings
  const metaName = document.getElementById('meta-name');
  const metaSize = document.getElementById('meta-size');
  const metaType = document.getElementById('meta-type');
  const metaDuration = document.getElementById('meta-duration');
  const aspectBtns = document.querySelectorAll('.aspect-btn');
  const subtitleInput = document.getElementById('subtitle-file');
  const recentList = document.getElementById('recent-list');
  const btnClearRecent = document.getElementById('btn-clear-recent');
  
  // --- State Variables ---
  let currentVideoURL = null;
  let isDraggingTimeline = false;
  let controlsTimeout = null;
  let recentVideos = JSON.parse(sessionStorage.getItem('recentVideos') || '[]');

  // --- Initialize recent videos list ---
  updateRecentList();

  // ==========================================
  // 1. File Handling & Drag 'n' Drop
  // ==========================================

  // Drop zone events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleVideoFile(files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleVideoFile(e.target.files[0]);
    }
  });

  // Load video file
  function handleVideoFile(file) {
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido.');
      return;
    }

    // Prevent memory leaks by revoking old URL
    if (currentVideoURL) {
      URL.revokeObjectURL(currentVideoURL);
    }

    // Remove existing subtitle tracks if any
    const oldTracks = video.querySelectorAll('track');
    oldTracks.forEach(track => track.remove());
    subtitleInput.value = ''; // Reset subtitle input

    // Create object URL (Local streaming)
    currentVideoURL = URL.createObjectURL(file);
    video.src = currentVideoURL;

    // Display player and hide dropzone
    dropZone.style.display = 'none';
    playerContainer.style.display = 'block';

    // Show metadata
    metaName.textContent = file.name;
    metaSize.textContent = formatBytes(file.size);
    metaType.textContent = file.type || 'video/mp4';
    metaDuration.textContent = '--:--';

    // Save to session history
    saveToRecent(file.name, file.size);

    // Auto-play the video
    video.play()
      .then(() => {
        triggerPlayStateOverlay('play');
      })
      .catch(error => {
        console.log('Autoplay blocked, waiting for user click:', error);
      });

    // Reset controls visibility
    resetControlsTimer();
  }

  // Helper: Format Bytes to human readable
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Recent videos management
  function saveToRecent(name, size) {
    // Check if already in list
    recentVideos = recentVideos.filter(item => item.name !== name);
    recentVideos.unshift({ name, size, time: Date.now() });
    
    // Limit to 5 items
    if (recentVideos.length > 5) {
      recentVideos.pop();
    }
    
    sessionStorage.setItem('recentVideos', JSON.stringify(recentVideos));
    updateRecentList();
  }

  function updateRecentList() {
    if (!recentList) return;
    
    if (recentVideos.length === 0) {
      recentList.innerHTML = '<li class="recent-empty">No hay videos abiertos en esta sesión</li>';
      return;
    }

    recentList.innerHTML = recentVideos.map(item => `
      <li class="recent-item" data-name="${item.name}">
        <span class="recent-name"><i class="bi bi-play-circle-fill me-2"></i>${item.name}</span>
        <span class="badge bg-secondary">${formatBytes(item.size)}</span>
      </li>
    `).join('');

    // Attach click events (remind them to choose file due to browser security)
    recentList.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.getAttribute('data-name');
        alert(`Por seguridad del navegador, no podemos acceder a tus archivos locales directamente. Por favor arrastra el archivo "${name}" o haz clic en el selector de video.`);
        fileInput.click();
      });
    });
  }

  if (btnClearRecent) {
    btnClearRecent.addEventListener('click', () => {
      recentVideos = [];
      sessionStorage.removeItem('recentVideos');
      updateRecentList();
    });
  }

  // ==========================================
  // 2. Custom Video Control Lógica
  // ==========================================

  // Play/Pause
  function togglePlay() {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  video.addEventListener('play', () => {
    playPauseIcon.className = 'bi bi-pause-fill';
    triggerPlayStateOverlay('play');
    resetControlsTimer();
  });

  video.addEventListener('pause', () => {
    playPauseIcon.className = 'bi bi-play-fill';
    triggerPlayStateOverlay('pause');
    showControlsDirect();
  });

  playPauseBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  // Play/Pause indicator overlay animation
  function triggerPlayStateOverlay(state) {
    playStateOverlay.classList.remove('animate');
    void playStateOverlay.offsetWidth; // Trigger reflow to restart animation
    
    if (state === 'play') {
      playStateIcon.className = 'bi bi-play-fill';
    } else {
      playStateIcon.className = 'bi bi-pause-fill';
    }
    
    playStateOverlay.classList.add('animate');
  }

  // Volume controls
  function updateVolume(val) {
    video.volume = val;
    video.muted = (val === 0);
    volumeSlider.value = val;
    
    // Update icon
    if (video.muted || val === 0) {
      muteIcon.className = 'bi bi-volume-mute-fill';
    } else if (val < 0.5) {
      muteIcon.className = 'bi bi-volume-down-fill';
    } else {
      muteIcon.className = 'bi bi-volume-up-fill';
    }
  }

  volumeSlider.addEventListener('input', (e) => {
    updateVolume(parseFloat(e.target.value));
  });

  // Mute / Unmute
  let lastVolume = 1.0;
  muteBtn.addEventListener('click', () => {
    if (video.muted) {
      video.muted = false;
      updateVolume(lastVolume > 0 ? lastVolume : 1.0);
    } else {
      lastVolume = video.volume;
      video.muted = true;
      updateVolume(0);
    }
  });

  // Timeline / Seekbar
  function formatTime(timeInSeconds) {
    if (isNaN(timeInSeconds)) return '00:00';
    const result = new Date(timeInSeconds * 1000).toISOString().substring(11, 19);
    const hours = result.substring(0, 2);
    const minsSecs = result.substring(3);
    return hours !== '00' ? result : minsSecs;
  }

  // Loaded metadata event to display total duration
  video.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `00:00 / ${formatTime(video.duration)}`;
    metaDuration.textContent = formatTime(video.duration);
  });

  // Time update progress bar
  video.addEventListener('timeupdate', () => {
    if (isDraggingTimeline) return;
    const progress = (video.currentTime / video.duration) * 100;
    timelineProgress.style.width = `${progress}%`;
    timelineHandle.style.left = `${progress}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  // Buffer progress
  video.addEventListener('progress', () => {
    if (video.duration > 0 && video.buffered.length > 0) {
      const bufferEnd = video.buffered.end(video.buffered.length - 1);
      const bufferPercent = (bufferEnd / video.duration) * 100;
      timelineBuffer.style.width = `${bufferPercent}%`;
    }
  });

  // Timeline scrubbing (Seek)
  function seekToPosition(clientX) {
    const rect = timelineContainer.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos)); // Clamp between 0 and 1
    
    video.currentTime = pos * video.duration;
    timelineProgress.style.width = `${pos * 100}%`;
    timelineHandle.style.left = `${pos * 100}%`;
  }

  timelineContainer.addEventListener('mousedown', (e) => {
    isDraggingTimeline = true;
    seekToPosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingTimeline) {
      seekToPosition(e.clientX);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingTimeline) {
      isDraggingTimeline = false;
    }
  });

  // Timeline tooltip on hover
  timelineContainer.addEventListener('mousemove', (e) => {
    const rect = timelineContainer.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos));
    
    const hoverTime = pos * video.duration;
    timelineTooltip.textContent = formatTime(hoverTime);
    timelineTooltip.style.left = `${pos * 100}%`;
  });

  // Playback Rate / Speed
  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speedOptions.classList.toggle('show');
  });

  document.querySelectorAll('.speed-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const speed = parseFloat(e.target.dataset.speed);
      video.playbackRate = speed;
      
      // Update active state
      document.querySelectorAll('.speed-option').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update display label
      speedText.textContent = speed === 1 ? '1.0x' : `${speed}x`;
      speedOptions.classList.remove('show');
    });
  });

  // Hide speed menu when clicking outside
  window.addEventListener('click', () => {
    speedOptions.classList.remove('show');
  });

  // Picture in Picture
  if ('pictureInPictureEnabled' in document) {
    pipBtn.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Error with Picture in Picture:', error);
      }
    });
  } else {
    pipBtn.style.display = 'none'; // Hide if not supported
  }

  // Loop toggle
  loopBtn.addEventListener('click', () => {
    video.loop = !video.loop;
    if (video.loop) {
      loopBtn.style.color = 'var(--color-primary)';
      loopIcon.className = 'bi bi-arrow-repeat';
    } else {
      loopBtn.style.color = '';
      loopIcon.className = 'bi bi-arrow-right-short'; // Indicates normal continuous play
    }
  });

  // Fullscreen toggle (using the whole player container so controls stay visible!)
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen()
        .then(() => {
          fullscreenIcon.className = 'bi bi-fullscreen-exit';
        })
        .catch(err => {
          alert(`Error al intentar pantalla completa: ${err.message}`);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          fullscreenIcon.className = 'bi bi-fullscreen';
        });
    }
  }

  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Monitor screen exit via escape key
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      fullscreenIcon.className = 'bi bi-fullscreen';
    }
  });

  // Aspect ratio adjustment
  aspectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.target.dataset.aspect;
      
      // Remove other aspect ratio classes
      playerContainer.classList.remove('fit-video', 'cover-video', 'stretch-video');
      
      // Add matching class
      if (mode === 'fit') playerContainer.classList.add('fit-video');
      if (mode === 'cover') playerContainer.classList.add('cover-video');
      if (mode === 'stretch') playerContainer.classList.add('stretch-video');
      
      // Toggle button active state
      aspectBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    });
  });

  // ==========================================
  // 3. Subtitles Support (.vtt & .srt)
  // ==========================================
  subtitleInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      let text = evt.target.result;

      // Handle SRT to VTT translation client-side
      if (file.name.endsWith('.srt')) {
        text = convertSrtToVtt(text);
      }

      // Remove existing tracks
      const oldTracks = video.querySelectorAll('track');
      oldTracks.forEach(track => track.remove());

      // Create new track from VTT content blob
      const vttBlob = new Blob([text], { type: 'text/vtt' });
      const trackUrl = URL.createObjectURL(vttBlob);

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = file.name.replace(/\.[^/.]+$/, ""); // strip extension for label
      track.srclang = 'es';
      track.src = trackUrl;
      track.default = true;

      video.appendChild(track);
      
      // Force display
      video.textTracks[0].mode = 'showing';
      alert(`Subtítulos "${file.name}" cargados exitosamente.`);
    };

    reader.readAsText(file);
  });

  // Client-side SRT to VTT parser
  function convertSrtToVtt(srtText) {
    // 1. Ensure the file starts with WEBVTT
    let vttText = "WEBVTT\n\n";

    // 2. Normalize line endings
    let normalized = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 3. Convert commas in timestamps to dots
    // SRT format is 00:00:00,000 --> 00:00:00,000
    // VTT format is 00:00:00.000 --> 00:00:00.000
    let timestampRegex = /(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/g;
    normalized = normalized.replace(timestampRegex, '$1.$2 --> $3.$4');

    vttText += normalized;
    return vttText;
  }

  // ==========================================
  // 4. Hover Controls Visibility Panel
  // ==========================================
  function showControlsDirect() {
    playerContainer.classList.add('show-controls');
    document.body.style.cursor = 'default';
  }

  function resetControlsTimer() {
    showControlsDirect();
    clearTimeout(controlsTimeout);
    
    // Hide controls only if video is playing
    if (!video.paused) {
      controlsTimeout = setTimeout(() => {
        playerContainer.classList.remove('show-controls');
        // Hide cursor when controls are hidden
        document.body.style.cursor = 'none';
      }, 2500);
    }
  }

  playerContainer.addEventListener('mousemove', resetControlsTimer);
  playerContainer.addEventListener('mouseleave', () => {
    if (!video.paused) {
      playerContainer.classList.remove('show-controls');
    }
  });

  // Maintain visibility when volume slider is active
  volumeSlider.addEventListener('mousedown', () => {
    volumeSliderContainer.classList.add('active');
  });

  window.addEventListener('mouseup', () => {
    volumeSliderContainer.classList.remove('active');
  });

  // ==========================================
  // 5. Keyboard Shortcuts
  // ==========================================
  window.addEventListener('keydown', (e) => {
    // Check if player is loaded and user is not typing in a text field or file input
    if (playerContainer.style.display !== 'block') return;
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'arrowleft':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        resetControlsTimer();
        break;
      case 'arrowright':
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        resetControlsTimer();
        break;
      case 'arrowup':
        e.preventDefault();
        updateVolume(Math.min(1.0, video.volume + 0.05));
        resetControlsTimer();
        break;
      case 'arrowdown':
        e.preventDefault();
        updateVolume(Math.max(0.0, video.volume - 0.05));
        resetControlsTimer();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
        e.preventDefault();
        muteBtn.click();
        break;
      case 'p':
        e.preventDefault();
        pipBtn.click();
        break;
      case 'l':
        e.preventDefault();
        loopBtn.click();
        break;
    }
  });
});
