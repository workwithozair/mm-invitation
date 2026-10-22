const $ = (selector, root = document) => root.querySelector(selector);
let weddingData = null;
let countdownTimer = null;

async function loadData() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('data.json could not be loaded');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function fillSite(data) {
  const { couple, wedding, design, images } = data;
  document.title = `${couple.partnerOne} & ${couple.partnerTwo} — Wedding Invitation`;
  $('#coverKicker').textContent = design.envelopeKicker;
  $('#coverNames').innerHTML = `${safeText(couple.partnerOne)} <i>&amp;</i> ${safeText(couple.partnerTwo)}`;
  $('#coverDate').textContent = wedding.displayDate.replaceAll(' ', ' · ');
  $('#coverInitials').textContent = couple.initials;
  $('#coverPrompt').textContent = design.openPrompt;
  $('#dateOrdinal').innerHTML = `${safeText(wedding.ordinalDate)}<sup>TH</sup>`;
  $('#dateMonth').textContent = wedding.month;
  $('#dateYear').textContent = wedding.year;
  $('#dateTime').textContent = wedding.time.toUpperCase();
  $('#datePlace').innerHTML = safeText(wedding.city).toUpperCase().replace(', ', ',<br>');
  $('#medallionNames').innerHTML = `${safeText(couple.partnerOne)}<br>&amp; ${safeText(couple.partnerTwo)}`;
  $('#handPhoto').src = images.hand;
  $('#locationPhoto').src = images.location;
  $('#couplePhoto').src = images.couple;
  $('#contactEmail').href = `mailto:${couple.contactEmail}`;
  $('#contactEmail').textContent = couple.contactEmail;
  $('#footerNames').textContent = `${couple.partnerOne} & ${couple.partnerTwo}`;
  document.documentElement.style.setProperty('--sage', design.colorSage || '#828b6a');
  document.documentElement.style.setProperty('--rose', design.colorRose || '#d8959d');
}

function openEnvelope() {
  const cover = $('#envelopeCover');
  const opened = $('#openedPage');
  if (cover.classList.contains('is-opening') || cover.hidden) return;

  // Reveal the collage immediately underneath the cover; both layers animate together.
  opened.hidden = false;
  opened.classList.remove('page-in');
  void opened.offsetWidth;
  opened.classList.add('page-in');
  cover.classList.add('is-opening');
  $('#coverEnvelope').classList.add('is-open');
  $('#coverEnvelope').setAttribute('aria-expanded', 'true');

  const openedUrl = new URL(window.location.href);
  openedUrl.hash = 'opened';
  window.history.replaceState({}, '', openedUrl);

  let finished = false;
  const finishOpening = () => {
    if (finished) return;
    finished = true;
    cover.hidden = true;
    cover.classList.remove('is-opening');
    $('#coverEnvelope').classList.remove('is-open');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(finishOpening);
  } else {
    // This aligns with the cover's short fade; the collage keeps revealing afterward.
    window.setTimeout(finishOpening, 1050);
  }
}

function backToEnvelope() {
  $('#contentDialog').close?.();
  $('#openedPage').classList.remove('page-in');
  $('#openedPage').hidden = true;
  const cover = $('#envelopeCover');
  cover.hidden = false;
  const coverUrl = new URL(window.location.href);
  coverUrl.search = ''; coverUrl.hash = '';
  window.history.replaceState({}, '', coverUrl);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function dialogTemplate(kind) {
  const { couple, wedding, gallery } = weddingData;
  const name1 = safeText(couple.partnerOne), name2 = safeText(couple.partnerTwo);
  if (kind === 'invitation') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">TOGETHER WITH OUR FAMILIES</p><h2 class="dialog-title" id="dialogTitle">${name1} <em>&amp;</em> ${name2}</h2><p class="dialog-copy">${safeText(couple.intro)}</p><div class="dialog-divider"></div><p class="dialog-copy"><strong>${safeText(wedding.displayDate)}</strong><br>${safeText(wedding.time)}<br>${safeText(wedding.city)}</p><button class="dialog-link" type="button" data-modal="details">VIEW WEDDING DETAILS</button></div>`;
  }
  if (kind === 'details') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">THE DAY WE SAY I DO</p><h2 class="dialog-title" id="dialogTitle">Wedding <em>details</em></h2><p class="dialog-copy">${safeText(wedding.displayDate)} · ${safeText(wedding.city)}</p><div class="modal-countdown"><p>COUNTING DOWN TO THE CELEBRATION</p><div><strong id="modalDays">000</strong><span>DAYS</span></div><div><strong id="modalHours">00</strong><span>HOURS</span></div><div><strong id="modalMinutes">00</strong><span>MINUTES</span></div><div><strong id="modalSeconds">00</strong><span>SECONDS</span></div></div><div class="detail-grid"><section class="detail-box"><h3>${safeText(wedding.ceremony.title)}</h3><p>${safeText(wedding.ceremony.time)}</p><p><strong>${safeText(wedding.ceremony.venue)}</strong></p><p>${safeText(wedding.ceremony.address)}</p></section><section class="detail-box"><h3>${safeText(wedding.reception.title)}</h3><p>${safeText(wedding.reception.time)}</p><p><strong>${safeText(wedding.reception.venue)}</strong></p><p>${safeText(wedding.reception.address)}</p></section></div><a class="dialog-link" href="${safeText(wedding.mapsUrl)}" target="_blank" rel="noreferrer">OPEN LOCATION IN MAPS ↗</a></div>`;
  }
  if (kind === 'story') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">A LITTLE ABOUT US</p><h2 class="dialog-title" id="dialogTitle">Our <em>love story</em></h2><img class="story-dialog-photo" src="${safeText(weddingData.images.couple)}" alt="${name1} and ${name2}" style="width:min(100%,330px);height:250px;object-fit:cover;margin:0 auto 22px;display:block;filter:saturate(.8)"><p class="dialog-copy">${safeText(couple.story)}</p><p class="dialog-copy" style="font-family:var(--script);font-size:35px;color:var(--sage-deep);margin-bottom:0">${name1} &amp; ${name2}</p></div>`;
  }
  if (kind === 'gallery') {
    const cards = gallery.map(item => `<figure><img src="${safeText(item.src)}" alt="${safeText(item.alt)}"><figcaption>${safeText(item.caption || '')}</figcaption></figure>`).join('');
    return `<div class="dialog-body"><p class="dialog-eyebrow">THE LITTLE MOMENTS</p><h2 class="dialog-title" id="dialogTitle">Our <em>gallery</em></h2><p class="dialog-copy">A few memories and places close to our hearts.</p><div class="dialog-gallery">${cards}</div></div>`;
  }
  if (kind === 'rsvp') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">KINDLY REPLY BY ${safeText(wedding.rsvpDeadline).toUpperCase()}</p><h2 class="dialog-title" id="dialogTitle">Will you join <em>us?</em></h2><p class="dialog-copy">Your presence would mean the world to us.</p><form class="rsvp-form" id="rsvpForm"><label>YOUR NAME<input name="name" autocomplete="name" required placeholder="Full name"></label><label>EMAIL ADDRESS (OPTIONAL)<input name="email" type="email" autocomplete="email" placeholder="you@example.com"></label><fieldset><legend>WILL YOU BE THERE?</legend><label><input type="radio" name="attendance" value="Joyfully accepts" required> Joyfully accepts</label><label><input type="radio" name="attendance" value="Regretfully declines"> Regretfully declines</label></fieldset><label>NUMBER OF GUESTS<select name="guests"><option value="1">Just me</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label><label>NOTES (OPTIONAL)<textarea name="notes" rows="2" placeholder="Anything we should know?"></textarea></label><button class="rsvp-submit" type="submit">SEND YOUR REPLY</button><p class="form-status" id="formStatus">Demo form — replies are saved in this browser only.</p></form></div>`;
  }
  return '';
}

function showDialog(kind) {
  const dialog = $('#contentDialog');
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  $('#dialogContent').innerHTML = dialogTemplate(kind);
  if (!dialog.open) dialog.showModal();
  if (kind === 'details') startModalCountdown();
}

function startModalCountdown() {
  const target = new Date(weddingData.wedding.date).getTime();
  const update = () => {
    if (!$('#modalDays')) { clearInterval(countdownTimer); countdownTimer = null; return; }
    let diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000); const seconds = Math.floor((diff % 60000) / 1000);
    $('#modalDays').textContent = String(days).padStart(3, '0');
    $('#modalHours').textContent = String(hours).padStart(2, '0');
    $('#modalMinutes').textContent = String(minutes).padStart(2, '0');
    $('#modalSeconds').textContent = String(seconds).padStart(2, '0');
  };
  update(); countdownTimer = setInterval(update, 1000);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
}

document.addEventListener('click', (event) => {
  const back = event.target.closest('[data-action="back-to-envelope"]');
  if (back) {
    event.preventDefault();
    backToEnvelope();
    return;
  }
  const location = event.target.closest('[data-action="location"]');
  if (location) {
    event.preventDefault();
    window.open(weddingData.wedding.mapsUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  const pageTrigger = event.target.closest('[data-page]');
  if (pageTrigger) {
    event.preventDefault();
    // Prefer a real anchor destination when available; this keeps links correct
    // on hosted subpaths and makes the target easy to follow without JavaScript.
    if (pageTrigger instanceof HTMLAnchorElement && pageTrigger.href) {
      window.location.assign(pageTrigger.href);
    } else {
      const basePath = new URL('./', window.location.href);
      const targetPath = pageTrigger.dataset.page.replace(/^\/+/, '');
      window.location.assign(new URL(targetPath, basePath).href);
    }
    return;
  }
  const trigger = event.target.closest('[data-modal]');
  if (trigger) {
    event.preventDefault();
    if (trigger.dataset.modal === 'details') {
      window.location.href = new URL('details/', window.location.href).href;
      return;
    }
    if (trigger.dataset.modal === 'story') {
      window.location.href = new URL('love-story/', window.location.href).href;
      return;
    }
    showDialog(trigger.dataset.modal);
  }
});

$('#coverEnvelope').addEventListener('click', openEnvelope);
$('#coverOpenText').addEventListener('click', openEnvelope);
$('#dialogClose').addEventListener('click', () => $('#contentDialog').close());
$('#contentDialog').addEventListener('click', (event) => {
  if (event.target === $('#contentDialog')) $('#contentDialog').close();
});
$('#contentDialog').addEventListener('close', () => { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } });

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'rsvpForm') return;
  event.preventDefault();
  const form = event.target;
  const response = Object.fromEntries(new FormData(form).entries());
  response.submittedAt = new Date().toISOString();
  const saved = JSON.parse(localStorage.getItem('weddingRsvps') || '[]');
  saved.push(response);
  localStorage.setItem('weddingRsvps', JSON.stringify(saved));
  const status = $('#formStatus');
  if (status) status.textContent = 'Thank you! Your demo RSVP has been saved in this browser.';
  form.reset();
});

(async function init() {
  weddingData = await loadData();
  if (!weddingData) {
    showToast('Could not load data.json. Run this folder through a local web server.');
    return;
  }
  fillSite(weddingData);
  const params = new URLSearchParams(window.location.search);
  if (window.location.hash === '#opened' || params.get('view') === 'rsvp') {
    $('#envelopeCover').hidden = true;
    const opened = $('#openedPage');
    opened.hidden = false;
    requestAnimationFrame(() => {
      opened.classList.remove('page-in');
      void opened.offsetWidth;
      opened.classList.add('page-in');
    });
  }
  if (params.get('view') === 'rsvp') showDialog('rsvp');
})();
