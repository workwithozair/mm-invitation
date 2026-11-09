(() => {
  const icon = playing => playing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';

  fetch(new URL('data.json', document.baseURI), { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`data.json request failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const music = data.design?.backgroundMusic || {};
      const source = music.audioUrl || (music.track && `assets/${music.track}`);
      if (!music.enabled || !source || source.startsWith('[')) return;

      const audio = document.createElement('audio');
      audio.src = new URL(source.replace(/^\//, ''), document.baseURI).href;
      audio.loop = true;
      audio.preload = 'metadata';
      audio.autoplay = music.autoplay === true;
      audio.volume = 0.75;
      document.body.append(audio);

      let button;
      let playPrompt;
      const setPlaying = playing => {
        if (!button) return;
        button.innerHTML = icon(playing);
        button.classList.toggle('is-playing', playing);
        button.setAttribute('aria-pressed', String(playing));
        button.setAttribute('aria-label', playing ? 'Turn wedding music off' : 'Turn wedding music on');
        button.title = playing ? 'Turn music off' : 'Turn music on';
      };

      const hidePlayPrompt = () => {
        if (!playPrompt) return;
        playPrompt.remove();
        playPrompt = undefined;
      };

      const showPlayPrompt = () => {
        if (playPrompt || !invitationIsOpen()) return;
        playPrompt = document.createElement('button');
        playPrompt.type = 'button';
        playPrompt.className = 'sage-music-play-prompt';
        playPrompt.textContent = '♪  Play music';
        playPrompt.setAttribute('aria-label', 'Play wedding music');
        playPrompt.style.cssText = 'position:fixed;right:22px;bottom:24px;z-index:10030;border:1px solid #929d85;border-radius:28px;padding:12px 18px;background:#fffaf5;color:#3d463d;font:13px Arial,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 5px 18px #28312626;';
        playPrompt.addEventListener('click', async () => {
          try {
            await audio.play();
            hidePlayPrompt();
            setPlaying(true);
          } catch (error) {
            console.warn('Wedding music could not be played. Check browser audio permissions.', error);
          }
        });
        document.body.append(playPrompt);
      };

      if (music.showMusicToggle !== false) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'sage-music-toggle';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Turn wedding music on');
        button.title = 'Turn music on';
        button.innerHTML = icon(false);
        button.style.cssText = 'position:fixed;right:28px;bottom:28px;z-index:10030;width:56px;height:56px;border:1.5px solid #929d85;border-radius:50%;background:#fffaf5;color:#3d463d;display:grid;place-items:center;cursor:pointer;box-shadow:0 5px 18px #28312626;';
        const style = document.createElement('style');
        style.textContent = '.sage-music-toggle svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.sage-music-toggle.is-playing{background:#8f9a80;color:#fffaf5}';
        document.head.append(style);
        document.body.append(button);
        button.addEventListener('click', async () => {
          if (!audio.paused) {
            audio.pause();
            setPlaying(false);
            return;
          }
          try {
            await audio.play();
            setPlaying(true);
          } catch (error) {
            console.warn('Wedding music could not be played. Check the configured audio file.', error);
            setPlaying(false);
          }
        });
        audio.addEventListener('play', () => setPlaying(true));
        audio.addEventListener('pause', () => setPlaying(false));
      }

      const invitationIsOpen = () => {
        const path = window.location.pathname.replace(/\/+$/, '');
        return path.endsWith('/envelope') || location.hash === '#opened' || location.hash === '#page-1';
      };
      const resumeIfStarted = () => {
        let musicWasStarted = false;
        try { musicWasStarted = sessionStorage.getItem('sage-wedding-music-started') === '1'; } catch {}
        if ((!musicWasStarted && music.autoplay !== true) || !invitationIsOpen() || !audio.paused) return;
        audio.play().then(() => {
          hidePlayPrompt();
          setPlaying(true);
        }).catch(error => {
          showPlayPrompt();
          console.info('Browser did not resume wedding music automatically.', error);
        });
      };
      resumeIfStarted();
      audio.addEventListener('canplay', resumeIfStarted);
      audio.addEventListener('playing', hidePlayPrompt);
      window.addEventListener('pageshow', resumeIfStarted);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') resumeIfStarted();
      });
    })
    .catch(error => console.error('Could not load configured wedding music', error));
})();
