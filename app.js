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

function isPlaceholder(value) {
  return typeof value !== 'string' || !value.trim() || /^\s*\[.*\]\s*$/.test(value.trim());
}

function imageOrFallback(value, fallback) {
  return isPlaceholder(value) ? fallback : value.trim();
}

function setImageCssVariable(name, value) {
  const clean = imageOrFallback(value, '');
  document.documentElement.style.setProperty(name, clean ? `url("${clean.replace(/["\\\n\r]/g, '')}")` : 'none');
}

function fillSite(data) {
  const { couple, wedding, design, images } = data;
  const displayNames = couple.displayNames || `${couple.partnerOne} & ${couple.partnerTwo}`;
  document.title = `${displayNames} — Wedding Invitation`;
  $('#coverKicker').textContent = design.envelopeKicker || 'A LITTLE NOTE FOR YOU';
  $('#coverNames').innerHTML = safeText(displayNames).replace(/ &amp; /, ' <i>&amp;</i> ');
  $('#coverDate').textContent = String(wedding.displayDate || '').replaceAll(' ', ' · ');
  $('#coverInitials').textContent = couple.initials || 'M · M';
  $('#coverPrompt').textContent = design.openPrompt || 'CLICK TO OPEN';

  const dateParts = String(wedding.date || '').split('T')[0].split('-');
  if (dateParts.length === 3) $('#coverDateTop').textContent = `${dateParts[2]}.${dateParts[1]}.${dateParts[0].slice(-2)}`;
  const ordinal = String(wedding.ordinalDate || `${dateParts[2] || '12'}th`).match(/^(\d+)(.*)$/);
  $('#dateOrdinal').innerHTML = `${safeText(ordinal ? ordinal[1] : wedding.ordinalDate)}<sup>${safeText((ordinal && ordinal[2]) || 'TH').toUpperCase()}</sup>`;
  $('#dateMonth').textContent = wedding.month || '';
  $('#dateYear').textContent = wedding.year || '';
  $('#dateTime').textContent = String(wedding.time || '').toUpperCase();
  $('#datePlace').innerHTML = safeText(wedding.city || '').toUpperCase().replace(', ', ',<br>');
  $('#medallionNames').innerHTML = safeText(displayNames).replace(/ &amp; /, '<br>&amp; ');
  $('#handPhoto').src = imageOrFallback(images.hand, 'assets/hand-detail.jpg');
  $('#locationPhoto').src = imageOrFallback(images.location, 'assets/water-lilies-envelope.jpeg');
  $('#couplePhoto').src = imageOrFallback(images.couple, 'assets/wedding-couple.jpg');
  $('#footerNames').textContent = displayNames;
  document.querySelectorAll('[data-display-names]').forEach(el => { el.textContent = displayNames; });

  const root = document.documentElement;
  root.style.setProperty('--sage', design.colorSage || '#A5AD96');
  root.style.setProperty('--sage-deep', '#69745A');
  root.style.setProperty('--sage-shadow', '#45523B');
  root.style.setProperty('--sage-light', '#E5E8DD');
  root.style.setProperty('--rose', design.colorRose || '#DFA6B0');
  root.style.setProperty('--rose-dark', '#bd7c85');
  root.style.setProperty('--paper', design.colorPaper || '#FFF9F5');
  root.style.setProperty('--ivory', design.colorIvory || '#FFFFF0');
  root.style.setProperty('--champagne', design.colorChampagne || '#F7E7CE');

  const backgrounds = design.backgrounds || {};
  const coverBg = backgrounds.envelope || {};
  const openedBg = backgrounds.opened || {};
  setImageCssVariable('--cover-bg-image', images.envelopeBackground || coverBg.image);
  setImageCssVariable('--opened-bg-image', images.openedBackground || openedBg.image);
  setImageCssVariable('--liner-image', imageOrFallback(images.envelopeLiner, 'assets/envelope-liner.jpg'));
  root.style.setProperty('--cover-bg-blur', `${Math.max(0, Number(coverBg.blurPx ?? 6))}px`);
  root.style.setProperty('--cover-bg-opacity', String(Math.min(1, Math.max(0, Number(coverBg.opacity ?? .34)))));
  root.style.setProperty('--cover-bg-wash', String(Math.min(1, Math.max(0, Number(coverBg.washOpacity ?? .56)))));
  root.style.setProperty('--opened-bg-blur', `${Math.max(0, Number(openedBg.blurPx ?? 8))}px`);
  root.style.setProperty('--opened-bg-opacity', String(Math.min(1, Math.max(0, Number(openedBg.opacity ?? .36)))));
  root.style.setProperty('--opened-bg-wash', String(Math.min(1, Math.max(0, Number(openedBg.washOpacity ?? .58)))));

  const contactLinks = $('#contactLinks');
  if (contactLinks) {
    const contactFeature = data.features?.whatsappContact;
    const featureContacts = contactFeature?.contacts || [];
    const contacts = contactFeature?.enabled && featureContacts.length ? featureContacts : (couple.contacts || []);
    if (contacts.length) {
      contactLinks.innerHTML = contacts.map(contact => {
        const matching = (couple.contacts || []).find(item => item.name === contact.name);
        const href = contact.whatsappUrl || contact.url || matching?.whatsappUrl || '';
        if (!/^https:\/\/wa\.me\//i.test(href)) return '';
        const phone = contact.phone || matching?.phone;
        const label = phone ? `${contact.name} · ${phone}` : `${contact.name} on WhatsApp`;
        return `<a class="contact-email contact-link" href="${safeText(href)}" target="_blank" rel="noreferrer">${safeText(label)}</a>`;
      }).join('');
    } else if (couple.contactEmail && !isPlaceholder(couple.contactEmail)) {
      contactLinks.innerHTML = `<a class="contact-email" href="mailto:${safeText(couple.contactEmail)}">${safeText(couple.contactEmail)}</a>`;
    }
  }
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
  const displayNames = safeText(couple.displayNames || `${couple.partnerOne} & ${couple.partnerTwo}`);
  const name1 = safeText(couple.partnerOne), name2 = safeText(couple.partnerTwo);
  if (kind === 'invitation') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">TOGETHER WITH OUR FAMILIES</p><h2 class="dialog-title" id="dialogTitle">${displayNames}</h2><p class="dialog-copy dialog-intro">${safeText(couple.intro)}</p><div class="dialog-divider"></div><p class="dialog-copy"><strong>${safeText(wedding.displayDate)}</strong><br>${safeText(wedding.time)}<br>${safeText(wedding.city)}</p><button class="dialog-link" type="button" data-modal="details">VIEW WEDDING DETAILS</button></div>`;
  }
  if (kind === 'details') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">THE DAY WE SAY I DO</p><h2 class="dialog-title" id="dialogTitle">Wedding <em>details</em></h2><p class="dialog-copy">${safeText(wedding.displayDate)} · ${safeText(wedding.city)}</p><div class="modal-countdown"><p>COUNTING DOWN TO THE CELEBRATION</p><div><strong id="modalDays">000</strong><span>DAYS</span></div><div><strong id="modalHours">00</strong><span>HOURS</span></div><div><strong id="modalMinutes">00</strong><span>MINUTES</span></div><div><strong id="modalSeconds">00</strong><span>SECONDS</span></div></div><div class="detail-grid"><section class="detail-box"><h3>${safeText(wedding.ceremony.title)}</h3><p>${safeText(wedding.ceremony.time)}</p><p><strong>${safeText(wedding.ceremony.venue)}</strong></p><p>${safeText(wedding.ceremony.address)}</p></section><section class="detail-box"><h3>${safeText(wedding.reception.title)}</h3><p>${safeText(wedding.reception.time)}</p><p><strong>${safeText(wedding.reception.venue)}</strong></p><p>${safeText(wedding.reception.address)}</p></section></div><div class="detail-grid"><a class="dialog-link" href="${safeText(wedding.ceremony.mapsUrl || wedding.mapsUrl)}" target="_blank" rel="noreferrer">AKAD NIKAH MAP ↗</a><a class="dialog-link" href="${safeText(wedding.reception.mapsUrl || wedding.mapsUrl)}" target="_blank" rel="noreferrer">RECEPTION MAP ↗</a></div></div>`;
  }
  if (kind === 'story') {
    return `<div class="dialog-body"><p class="dialog-eyebrow">A LITTLE ABOUT US</p><h2 class="dialog-title" id="dialogTitle">Our <em>love story</em></h2><img class="story-dialog-photo" src="${safeText(imageOrFallback(weddingData.images.couple, 'assets/wedding-couple.jpg'))}" alt="${name1} and ${name2}" style="width:min(100%,330px);height:250px;object-fit:cover;margin:0 auto 22px;display:block;filter:saturate(.8)"><p class="dialog-copy">${safeText(couple.story || couple.intro)}</p><p class="dialog-copy" style="font-family:var(--script);font-size:35px;color:var(--sage-deep);margin-bottom:0">${name1} &amp; ${name2}</p></div>`;
  }
  if (kind === 'gallery') {
    const galleryFallbacks = ['assets/hand-detail.jpg', 'assets/water-lilies-envelope.jpeg', 'assets/wedding-couple.jpg'];
    const cards = gallery.map((item, index) => `<figure><img src="${safeText(imageOrFallback(item.src, galleryFallbacks[index % galleryFallbacks.length]))}" alt="${safeText(item.alt)}"><figcaption>${safeText(isPlaceholder(item.caption) ? '' : (item.caption || ''))}</figcaption></figure>`).join('');
    return `<div class="dialog-body"><p class="dialog-eyebrow">THE LITTLE MOMENTS</p><h2 class="dialog-title" id="dialogTitle">Our <em>gallery</em></h2><p class="dialog-copy">A few memories and places close to our hearts.</p><div class="dialog-gallery">${cards}</div></div>`;
  }
  if (kind === 'rsvp') {
    const rsvp = weddingData.rsvp || {};
    if (rsvp.enabled === false) return `<div class="dialog-body"><h2 class="dialog-title" id="dialogTitle">RSVP</h2><p class="dialog-copy">RSVP details will be shared soon.</p></div>`;
    const deadline = isPlaceholder(rsvp.deadline || wedding.rsvpDeadline) ? 'RSVP DEADLINE TO BE CONFIRMED' : `KINDLY REPLY BY ${safeText(rsvp.deadline || wedding.rsvpDeadline).toUpperCase()}`;
    const events = (rsvp.events || []).map(event => {
      const dateLabel = event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';
      const timeLabel = event.time ? event.time : '';
      const tentative = event.timeTentative ? ' · time to be confirmed' : '';
      const opts = ['Please choose', ...(rsvp.attendanceOptions || ['Attending', 'Unable to attend'])];
      return `<fieldset class="rsvp-event-field"><legend>${safeText(event.title)}${dateLabel ? ` · ${safeText(dateLabel)}` : ''}${timeLabel ? ` · ${safeText(timeLabel)}` : ''}${tentative ? safeText(tentative) : ''}</legend><label class="rsvp-select-label">Attendance<select name="event_${safeText(event.id)}" required>${opts.map((option,index) => `<option value="${index ? safeText(option) : ''}" ${index === 0 ? 'selected' : ''} ${index === 0 ? 'disabled' : ''}>${safeText(option)}</option>`).join('')}</select></label></fieldset>`;
    }).join('');
    const guestOptions = Array.from({ length: Math.max(1, Number(rsvp.allocatedGuestCount) || 2) }, (_, i) => `<option value="${i + 1}">${i + 1} ${i === 0 ? 'guest' : 'guests'}</option>`).join('');
    const contactField = rsvp.contactNumberRequired ? '<label>CONTACT NUMBER<input name="contactNumber" type="tel" autocomplete="tel" required placeholder="Your phone number"></label>' : '';
    const guestNote = rsvp.allocatedGuestCount ? `<p class="rsvp-config-note">Please use your allocated guest count of ${safeText(rsvp.allocatedGuestCount)}. Extra guests require prior approval.${rsvp.childrenAllowed ? ' Children are welcome.' : ''}</p>` : '';
    const confirmation = safeText(rsvp.confirmationMessage || 'Thank you for your reply.');
    const messageField = rsvp.guestMessageEnabled ? `<label>WISHES &amp; DU’A (OPTIONAL)<textarea name="notes" rows="3" placeholder="${safeText(rsvp.guestMessagePlaceholder || 'Leave a message for the couple')}"></textarea></label>` : '';
    const appsScriptUrl = isPlaceholder(rsvp.appsScriptUrl) ? '' : rsvp.appsScriptUrl;
    const whatsappContacts = (couple.contacts || []).filter(contact => contact.whatsappUrl);
    const whatsappButtons = whatsappContacts.map(contact => `<a class="dialog-link rsvp-whatsapp-link" data-wa-contact="${safeText(contact.name)}" href="${safeText(contact.whatsappUrl)}" target="_blank" rel="noreferrer">SEND RSVP ON WHATSAPP · ${safeText(contact.name).toUpperCase()} ↗</a>`).join('');
    return `<div class="dialog-body"><p class="dialog-eyebrow">${deadline}</p><h2 class="dialog-title" id="dialogTitle">Will you join <em>us?</em></h2><p class="dialog-copy">Your presence and prayers mean the world to us.</p><form class="rsvp-form" id="rsvpForm" data-endpoint="${safeText(appsScriptUrl)}"><label>GUEST FULL NAME<input name="name" autocomplete="name" required placeholder="Full name"></label>${contactField}${events}<label>NUMBER OF GUESTS<select name="guests">${guestOptions}</select></label>${messageField}${guestNote}<p class="rsvp-config-note rsvp-confirmation" id="rsvpConfirmation" hidden>${confirmation}</p><button class="rsvp-submit" type="submit">SUBMIT RSVP</button><p class="form-status" id="formStatus">Your reply will be saved to the couple’s RSVP spreadsheet. After submitting, you can optionally send a WhatsApp confirmation.</p><div class="rsvp-whatsapp-actions" id="rsvpWhatsappActions" hidden><p class="rsvp-config-note">Your form has been submitted. You may also send the details directly on WhatsApp:</p>${whatsappButtons}</div></form></div>`;
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

// Make the visible swan artwork and its label reliably open the Details page.
const swanDetailsLink = document.querySelector('.swan-details');
if (swanDetailsLink) {
  const openDetailsFromSwan = (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.location.assign(new URL(swanDetailsLink.getAttribute('href') || 'details/', document.baseURI).href);
  };
  swanDetailsLink.querySelectorAll('.swan-svg path, .swan-copy, .swan-copy *').forEach((part) => {
    part.addEventListener('click', openDetailsFromSwan);
    part.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') openDetailsFromSwan(event);
    });
  });
}

$('#coverEnvelope').addEventListener('click', openEnvelope);
$('#coverOpenText').addEventListener('click', openEnvelope);
$('#dialogClose').addEventListener('click', () => $('#contentDialog').close());
$('#contentDialog').addEventListener('click', (event) => {
  if (event.target === $('#contentDialog')) $('#contentDialog').close();
});
$('#contentDialog').addEventListener('close', () => { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } });

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'rsvpForm') return;
  event.preventDefault();
  const form = event.target;
  const endpoint = form.dataset.endpoint;
  const status = $('#formStatus');
  const submitButton = form.querySelector('[type="submit"]');
  const whatsappActions = $('#rsvpWhatsappActions');
  const confirmation = $('#rsvpConfirmation');

  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(endpoint)) {
    if (status) status.textContent = 'Setup required: add your deployed Google Apps Script web app URL to rsvp.appsScriptUrl in data.json before accepting real RSVPs.';
    return;
  }

  const response = Object.fromEntries(new FormData(form).entries());
  response.submittedAt = new Date().toISOString();
  response.couple = (weddingData.couple?.displayNames || 'Masoom & Miza');
  if (status) status.textContent = 'Submitting your RSVP…';
  if (submitButton) submitButton.disabled = true;

  try {
    // Apps Script does not expose ordinary cross-origin JSON responses to static sites.
    // no-cors allows a simple form-encoded POST without requiring a paid proxy/backend.
    const payload = new URLSearchParams();
    Object.entries(response).forEach(([key, value]) => payload.append(key, String(value ?? '')));
    await fetch(endpoint, { method: 'POST', mode: 'no-cors', body: payload });
    if (status) status.textContent = 'Your RSVP request has been sent. You can optionally send the same details directly to the couple on WhatsApp below.';
    if (confirmation) confirmation.hidden = false;
    if (whatsappActions) whatsappActions.hidden = false;
    form.querySelectorAll('.rsvp-whatsapp-link').forEach(link => {
      const contact = (weddingData.couple?.contacts || []).find(item => item.name === link.dataset.waContact);
      const message = [
        `Assalamu’alaikum! My RSVP for ${response.couple}’s wedding:`,
        `Name: ${response.name || '—'}`,
        ...((weddingData.rsvp?.events || []).map(item => `${item.title}: ${response[`event_${item.id}`] || 'Not specified'}`)),
        `Number of guests: ${response.guests || '—'}`,
        response.contactNumber ? `Contact number: ${response.contactNumber}` : '',
        response.notes ? `Wishes / du’a: ${response.notes}` : '',
      ].filter(Boolean).join('\n');
      if (contact?.whatsappUrl) link.href = `${contact.whatsappUrl}?text=${encodeURIComponent(message)}`;
    });
    form.querySelectorAll('input,select,textarea,button[type="submit"]').forEach(control => { control.disabled = true; });
  } catch (error) {
    console.error('RSVP submission failed', error);
    if (status) status.textContent = 'Could not send your RSVP. Please check your internet connection and try again, or contact the couple on WhatsApp.';
    if (submitButton) submitButton.disabled = false;
  }
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
