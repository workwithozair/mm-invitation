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
  const set = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
  document.title = page === 'details' ? `Wedding Details — ${couple.partnerOne} & ${couple.partnerTwo}` : `Our Love Story — ${couple.partnerOne} & ${couple.partnerTwo}`;
  document.querySelectorAll('[data-couple]').forEach(el => el.textContent = `${couple.partnerOne} & ${couple.partnerTwo}`);
  if (page === 'details') {
    set('[data-date-city]', `${wedding.displayDate} · ${wedding.city}`);
    set('[data-date-day]', wedding.ordinalDate.replace(/\D/g, '') || new Date(wedding.date).getDate());
    set('[data-date-month]', wedding.month);
    set('[data-date-year]', wedding.year);
    set('[data-date-place]', wedding.city.toUpperCase());
    set('[data-ceremony-title]', wedding.ceremony.title); set('[data-ceremony-time]', wedding.ceremony.time);
    set('[data-ceremony-venue]', wedding.ceremony.venue); set('[data-ceremony-address]', wedding.ceremony.address);
    set('[data-reception-title]', wedding.reception.title); set('[data-reception-time]', wedding.reception.time);
    set('[data-reception-venue]', wedding.reception.venue); set('[data-reception-address]', wedding.reception.address);
    document.querySelectorAll('[data-map]').forEach(a => a.href = wedding.mapsUrl);
    const target = new Date(wedding.date).getTime(); let timer;
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
  } else if (page === 'love-story') {
    set('[data-story-intro]', couple.intro); set('[data-story-copy]', couple.story);
    const assetUrl = (src) => /^(?:https?:|data:|\/)/i.test(String(src)) ? src : `../${src}`;
    const photo = $('[data-couple-photo]'); if (photo) photo.src = assetUrl(data.images.couple);
    const memory = $('#memoryGrid');
    if (memory) memory.innerHTML = data.gallery.map(item => `<figure class="memory-card"><img src="${escapeHtml(assetUrl(item.src))}" alt="${escapeHtml(item.alt)}" loading="lazy"><figcaption>${escapeHtml(item.caption || '')}</figcaption></figure>`).join('');
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }
})();
