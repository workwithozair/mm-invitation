(async function () {
  const page = document.body.dataset.page;
  let data;
  try {
    const response = await fetch('../data.json');
    if (!response.ok) throw new Error('Could not load data.json');
    data = await response.json();
  } catch (error) {
    console.error(error);
    return;
  }
  const $ = (selector) => document.querySelector(selector);
  const couple = data.couple, wedding = data.wedding;
  const displayNames = couple.displayNames || `${couple.partnerOne} & ${couple.partnerTwo}`;
  const isPlaceholder = value => typeof value !== 'string' || !value.trim() || /^\s*\[.*\]\s*$/.test(value.trim());
  const imageOrFallback = (value, fallback) => isPlaceholder(value) ? fallback : value.trim();
  const set = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
  const setOptional = (selector, value) => { const el = $(selector); if (!el) return; if (isPlaceholder(value)) { el.hidden = true; return; } el.hidden = false; el.textContent = value; };
  document.title = page === 'details' ? `Wedding Details — ${displayNames}` : `Our Love Story — ${displayNames}`;
  document.querySelectorAll('[data-couple]').forEach(el => el.textContent = displayNames);
  if (page === 'details') {
    set('[data-date-city]', `${wedding.displayDate} · ${wedding.city}`);
    set('[data-date-day]', wedding.ordinalDate.replace(/\D/g, '') || new Date(wedding.date).getDate());
    set('[data-date-month]', wedding.month);
    set('[data-date-year]', wedding.year);
    set('[data-date-place]', wedding.city.toUpperCase());
    set('[data-ceremony-title]', wedding.ceremony.title);
    set('[data-ceremony-time]', wedding.ceremony.time);
    set('[data-ceremony-venue]', wedding.ceremony.venue);
    set('[data-ceremony-address]', wedding.ceremony.address);
    setOptional('[data-ceremony-arrival]', wedding.ceremony.guestArrivalTime ? `Guest arrival: ${wedding.ceremony.guestArrivalTime}${wedding.ceremony.guestArrivalTimeTentative ? ' (tentative)' : ''}` : '');
    setOptional('[data-ceremony-dress]', wedding.ceremony.dressCode ? `Dress code: ${wedding.ceremony.dressCode}` : '');
    setOptional('[data-ceremony-instructions]', wedding.ceremony.instructions);
    set('[data-reception-title]', wedding.reception.title);
    set('[data-reception-time]', `${wedding.reception.time || ''}${wedding.reception.timeTentative ? ' (tentative)' : ''}`);
    set('[data-reception-venue]', wedding.reception.venue);
    set('[data-reception-address]', wedding.reception.address);
    setOptional('[data-reception-dress]', wedding.reception.dressCode ? `Dress code: ${wedding.reception.dressCode}` : '');
    setOptional('[data-reception-color]', wedding.reception.guestColorTheme ? `Guest colour theme: ${wedding.reception.guestColorTheme}` : '');
    setOptional('[data-reception-parking]', wedding.reception.parkingInstructions);
    setOptional('[data-reception-instructions]', wedding.reception.instructions);
    document.querySelectorAll('[data-map]').forEach(a => {
      if (data.features?.googleMapsDirections?.enabled === false) { a.hidden = true; return; }
      const event = a.dataset.map === 'reception' ? wedding.reception : wedding.ceremony;
      const url = event.mapsUrl || wedding.mapsUrl;
      if (url && /^https:\/\//i.test(url)) a.href = url;
      else a.hidden = true;
    });
    const target = new Date(wedding.date).getTime(); let timer;
    if (data.features?.countdownDisplay === false || data.design?.countdown?.enabled === false) {
      const countdown = $('.sub-countdown'); if (countdown) countdown.hidden = true;
    }
    const update = () => {
      let diff = target - Date.now();
      if (!Number.isFinite(target) || diff <= 0) diff = 0;
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000); diff %= 3600000;
      const minutes = Math.floor(diff / 60000); const seconds = Math.floor((diff % 60000) / 1000);
      set('#days', String(days).padStart(3, '0')); set('#hours', String(hours).padStart(2, '0'));
      set('#minutes', String(minutes).padStart(2, '0')); set('#seconds', String(seconds).padStart(2, '0'));
      if (target <= Date.now() && timer) clearInterval(timer);
    };
    update(); timer = setInterval(update, 1000);
  } else if (page === 'our-story') {
    set('[data-story-intro]', couple.intro); set('[data-story-copy]', couple.story || couple.intro);
    const assetUrl = (src) => /^(?:https?:|data:|\/)/i.test(String(src)) ? src : `../${src}`;
    const photo = $('[data-couple-photo]'); if (photo) photo.src = assetUrl(imageOrFallback(data.images.couple, 'assets/wedding-couple.jpg'));
    const memory = $('#memoryGrid');
    const galleryFallbacks = ['assets/hand-detail.jpg', 'assets/water-lilies-envelope.jpeg', 'assets/wedding-couple.jpg'];
    if (memory) memory.innerHTML = data.gallery.map((item, index) => `<figure class="memory-card"><img src="${escapeHtml(assetUrl(imageOrFallback(item.src, galleryFallbacks[index % galleryFallbacks.length])))}" alt="${escapeHtml(item.alt)}" loading="lazy"><figcaption>${escapeHtml(isPlaceholder(item.caption) ? '' : (item.caption || ''))}</figcaption></figure>`).join('');
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }
})();
