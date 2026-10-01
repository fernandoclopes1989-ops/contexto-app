/**
 * youtube.js — YouTube IFrame Player API wrapper for Contexto App
 * Handles player creation, loop functionality, and speed controls.
 */

let apiReady = false;
let apiReadyPromise = null;
let player = null;
let loopInterval = null;
let loopConfig = null; // { start, end }
let onTimeUpdateCallback = null;

let currentContainerId = null;
let currentVideoId = null;
let currentOpts = {};

/**
 * Load the YouTube IFrame API script.
 * Returns a promise that resolves when the API is ready.
 */
export function loadYouTubeAPI() {
  if (apiReady) return Promise.resolve();
  if (apiReadyPromise) return apiReadyPromise;

  apiReadyPromise = new Promise((resolve) => {
    // If script already loaded
    if (window.YT && window.YT.Player) {
      apiReady = true;
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      resolve();
    };

    // Check if script tag already exists
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return apiReadyPromise;
}

/**
 * Create or replace the YouTube player in a container element.
 * @param {string} containerId - ID of the div to put the player in
 * @param {string} videoId - YouTube video ID
 * @param {object} opts - Optional callbacks: onReady, onStateChange, captionLang, startSeconds
 */
export async function createPlayer(containerId, videoId, opts = {}) {
  await loadYouTubeAPI();

  // Destroy existing player
  destroyPlayer();

  currentContainerId = containerId;
  currentVideoId = videoId;
  currentOpts = { ...opts };

  const captionLang = opts.captionLang || 'en';
  const playerVars = {
    autoplay: opts.autoplay || 0,
    modestbranding: 1,
    rel: 0,
    enablejsapi: 1,
    controls: 1
  };

  if (opts.startSeconds && opts.startSeconds > 0) {
    playerVars.start = Math.floor(opts.startSeconds);
  }

  if (captionLang && captionLang !== 'off') {
    playerVars.cc_load_policy = 1;
    playerVars.cc_lang_pref = captionLang;
    playerVars.hl = captionLang;
  } else {
    playerVars.cc_load_policy = 0;
  }

  return new Promise((resolve) => {
    player = new window.YT.Player(containerId, {
      videoId: videoId,
      playerVars: playerVars,
      events: {
        onReady: (event) => {
          try {
            if (captionLang && captionLang !== 'off') {
              if (player.loadModule) player.loadModule('captions');
              if (player.setOption) {
                player.setOption('captions', 'track', { languageCode: captionLang });
              }
            } else {
              if (player.setOption) player.setOption('captions', 'track', {});
              if (player.unloadModule) player.unloadModule('captions');
            }
          } catch (e) {
            // Ignore if captions API is restricted
          }
          if (opts.onReady) opts.onReady(event);
          resolve(player);
        },
        onStateChange: (event) => {
          if (opts.onStateChange) opts.onStateChange(event);
          // Handle loop logic
          if (loopConfig && event.data === window.YT.PlayerState.PLAYING) {
            startLoopCheck();
          }
          if (event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED) {
            stopLoopCheck();
          }
        }
      }
    });
  });
}

/**
 * Destroy the current player instance.
 */
export function destroyPlayer() {
  stopLoop();
  if (player && typeof player.destroy === 'function') {
    try {
      player.destroy();
    } catch (e) {
      // Player might already be destroyed
    }
  }
  player = null;
}

/**
 * Get the player instance.
 */
export function getPlayer() {
  return player;
}

/**
 * Play the video.
 */
export function play() {
  if (player && player.playVideo) player.playVideo();
}

/**
 * Pause the video.
 */
export function pause() {
  if (player && player.pauseVideo) player.pauseVideo();
}

/**
 * Seek to a specific time in seconds.
 */
export function seekTo(seconds) {
  if (player && player.seekTo) player.seekTo(seconds, true);
}

/**
 * Get current playback time in seconds.
 */
export function getCurrentTime() {
  if (player && player.getCurrentTime) return player.getCurrentTime();
  return 0;
}

/**
 * Get total video duration.
 */
export function getDuration() {
  if (player && player.getDuration) return player.getDuration();
  return 0;
}

/**
 * Set playback speed.
 */
export function setPlaybackRate(rate) {
  if (player && player.setPlaybackRate) player.setPlaybackRate(rate);
}

/**
 * Get current playback speed.
 */
export function getPlaybackRate() {
  if (player && player.getPlaybackRate) return player.getPlaybackRate();
  return 1;
}

/**
 * Change captions / subtitle language.
 * @param {string} langCode - 'en', 'pt', or 'off'
 */
export async function setCaptionsLanguage(langCode) {
  if (!player) return;
  const currentTime = getCurrentTime();
  const isPlayingNow = player.getPlayerState && player.getPlayerState() === 1;

  currentOpts.captionLang = langCode;

  // 1. Try postMessage commands directly to the iframe
  try {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      if (langCode === 'off') {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setOption',
          args: ['captions', 'track', {}]
        }), '*');
      } else {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'loadModule',
          args: ['captions']
        }), '*');
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setOption',
          args: ['captions', 'track', { languageCode: langCode }]
        }), '*');
      }
    }
  } catch (e) {
    console.warn('postMessage to iframe failed:', e);
  }

  // 2. Reload player to force YouTube to display the requested language subtitles
  if (currentContainerId && currentVideoId) {
    await createPlayer(currentContainerId, currentVideoId, {
      ...currentOpts,
      captionLang: langCode,
      startSeconds: currentTime,
      autoplay: isPlayingNow ? 1 : 0
    });
    if (isPlayingNow) {
      setTimeout(() => play(), 350);
    }
  }
}

/**
 * Get available caption tracks if supported.
 */
export function getAvailableCaptionTracks() {
  if (player && player.getOption) {
    try {
      return player.getOption('captions', 'tracklist') || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Start looping between start and end timestamps (in seconds).
 */
export function startLoop(startTime, endTime) {
  loopConfig = { start: startTime, end: endTime };
  seekTo(startTime);
  play();
  startLoopCheck();
}

/**
 * Stop the current loop.
 */
export function stopLoop() {
  loopConfig = null;
  stopLoopCheck();
}

/**
 * Check if currently looping.
 */
export function isLooping() {
  return loopConfig !== null;
}

/**
 * Get current loop config.
 */
export function getLoopConfig() {
  return loopConfig;
}

/**
 * Internal: start the interval that checks playback position for looping.
 */
function startLoopCheck() {
  stopLoopCheck(); // Clear any existing interval
  loopInterval = setInterval(() => {
    if (!player || !loopConfig) {
      stopLoopCheck();
      return;
    }
    const currentTime = getCurrentTime();
    if (currentTime >= loopConfig.end) {
      seekTo(loopConfig.start);
    }
    if (onTimeUpdateCallback) {
      onTimeUpdateCallback(currentTime);
    }
  }, 100); // Check every 100ms
}

/**
 * Internal: stop the loop check interval.
 */
function stopLoopCheck() {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
}

/**
 * Set a callback for time updates during loop playback.
 */
export function onTimeUpdate(callback) {
  onTimeUpdateCallback = callback;
}
