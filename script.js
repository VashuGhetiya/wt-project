// script.js — shared by all pages
(() => {
  const KEY_WISHLIST = 'bikehub_wishlist_v1';
  const KEY_COMPARE = 'bikehub_compare_v1';
  const KEY_BOOKINGS = 'bikehub_bookings_v1';
  const KEY_EVENTS = 'bikehub_events_v1';
  const KEY_BIKES = 'bikehub_bikes_v1';
  const KEY_DARK = 'bikehub_dark_v1';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Default bike data (if none in localStorage)
  const DEFAULT_BIKES = [
    { id:'re-classic-350', name:'Royal Enfield Classic 350', brand:'Royal Enfield', engine:'349 cc', mileage:'35 kmpl', price:'₹1,94,000', img:'classic.jpg', desc:'Classic-styled roadster with reliable single-cylinder engine.' },
    { id:'re-meteor-350', name:'Royal Enfield Meteor 350', brand:'Royal Enfield', engine:'349 cc', mileage:'37 kmpl', price:'₹1,90,000', img:'meteor.jpg', desc:'Comfort-focused cruiser with modern features.' },
    { id:'re-himalayan', name:'Royal Enfield Himalayan', brand:'Royal Enfield', engine:'411 cc', mileage:'30 kmpl', price:'₹2,15,000', img:'himaliyan.jpg', desc:'Adventure tourer built for rugged terrain.' },
    { id:'re-interceptor-650', name:'Royal Enfield Interceptor 650', brand:'Royal Enfield', engine:'648 cc', mileage:'25 kmpl', price:'₹3,03,000', img:'interceptor.webp', desc:'Twin-cylinder classic roadster.' },
    { id:'re-bullet-350', name:'Royal Enfield Bullet 350', brand:'Royal Enfield', engine:'346 cc', mileage:'37 kmpl', price:'₹1,73,562', img:'bullet-350.webp', desc:'Timeless design and unmatched thump that defines the Royal Enfield legacy.'},
    { id:'re-continental-gt-650', name:'Royal Enfield Continental GT 650', brand:'Royal Enfield', engine:'648 cc', mileage:'25 kmpl', price:'₹3,19,000', img:'gt.jpg', desc:'A café racer that blends retro style with thrilling twin-cylinder performance.' },
    { id:'re-classic-500', name:'Royal Enfield Classic 650', brand:'Royal Enfield', engine:'499 cc', mileage:'30 kmpl', price:'₹2,02,000', img:'classic6.jpg', desc:'Iconic retro motorcycle offering pure riding pleasure with a powerful 500cc engine.' },
    { id:'re-shotgun-650', name:'Royal Enfield Shotgun 650', brand:'Royal Enfield', engine:'648 cc', mileage:'24 kmpl', price:'₹3,59,000', img:'sg.jpg', desc:'A bold custom-inspired cruiser built on the 650 twin platform, designed for street attitude and comfort.' },
    { id:'re-bear-350', name:'Royal Enfield Bear 350', brand:'Royal Enfield', engine:'349 cc', mileage:'36 kmpl', price:'₹1,84,000', img:'bear.webp', desc:'Compact, agile and fun to ride — the Bear 350 is built for modern city riders seeking adventure in every corner.' },

  ];

  // localStorage helpers
  function read(key, fallback){ try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // initialize bikes if not present
  if (!localStorage.getItem(KEY_BIKES)) save(KEY_BIKES, DEFAULT_BIKES);

  // year in footer
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // dark mode toggle
  $$('button#darkToggle, #darkToggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.body.classList.toggle('dark');
      localStorage.setItem(KEY_DARK, document.body.classList.contains('dark') ? '1' : '0');
    });
  });
  if (localStorage.getItem(KEY_DARK) === '1') document.body.classList.add('dark');

  // --- MODELS PAGE ---
  const modelsList = $('#modelsList');
  if (modelsList) {
    const bikes = read(KEY_BIKES, DEFAULT_BIKES);
    const template = null;

    function renderList(list) {
      modelsList.innerHTML = '';
      if (!list.length) { modelsList.innerHTML = '<p class="muted">No bikes match your filters.</p>'; return; }
      list.forEach(bike => {
        const el = document.createElement('article'); el.className='model-card';
        el.innerHTML = `
          <img class="bike-img" src="${bike.img}" alt="${bike.name}">
          <div class="card-body">
            <h4 class="bike-name">${bike.name}</h4>
            <p class="bike-desc">${bike.desc}</p>
            <p class="specs"><strong>Engine:</strong> ${bike.engine} | <strong>Mileage:</strong> ${bike.mileage} | <strong>Price:</strong> ${bike.price}</p>
            <div class="card-actions">
              <a class="btn enquire-btn" href="booking.html#${bike.id}">Enquire</a>
              <button class="btn small wishlist-btn">♡ Save</button>
              <button class="btn small compare-btn">Compare</button>
            </div>
          </div>
        `;
        // bind after insertion
        modelsList.appendChild(el);
      });
      syncButtons();
    }

    // initial render & filters
    const searchInput = $('#searchInput');
    const brandFilter = $('#brandFilter');
    const sortSelect = $('#sortSelect');
    const clearFilters = $('#clearFilters');

    function applyFilters(){
      const q = (searchInput.value || '').toLowerCase().trim();
      const brand = brandFilter.value;
      let list = read(KEY_BIKES, DEFAULT_BIKES).filter(b=>{
        if (brand !== 'all' && b.brand !== brand) return false;
        if (!q) return true;
        return b.name.toLowerCase().includes(q) || (b.desc||'').toLowerCase().includes(q);
      });
      const sort = sortSelect.value;
      if (sort === 'price-asc') list.sort((a,b)=>extractPrice(a.price)-extractPrice(b.price));
      if (sort === 'price-desc') list.sort((a,b)=>extractPrice(b.price)-extractPrice(a.price));
      renderList(list);
    }
    function extractPrice(str){ const digits = (str||'').replace(/[^\d]/g,''); return Number(digits)||0; }

    [searchInput, brandFilter, sortSelect].forEach(el => el && el.addEventListener('input', applyFilters));
    clearFilters && clearFilters.addEventListener('click', ()=>{ if (searchInput) searchInput.value=''; if (brandFilter) brandFilter.value='all'; if (sortSelect) sortSelect.value='popular'; applyFilters(); });

    // wishlist & compare logic
    function getWishlist(){ return read(KEY_WISHLIST, []); }
    function saveWishlist(list){ save(KEY_WISHLIST, list); updateCounts(); }
    function getCompare(){ return read(KEY_COMPARE, []); }
    function saveCompare(list){ save(KEY_COMPARE, list); updateCounts(); }
    function updateCounts(){ const wc = $('#wishCount'); if (wc) wc.textContent=getWishlist().length; const cc = $('#compareCount'); if(cc) cc.textContent=getCompare().length; }
    updateCounts();

    function syncButtons(){
      const wish = getWishlist(); const comp = getCompare();
      $$('.model-card').forEach(card=>{
        const name = card.querySelector('.bike-name').textContent;
        const bike = read(KEY_BIKES, DEFAULT_BIKES).find(b=>b.name===name);
        if (!bike) return;
        const wb = card.querySelector('.wishlist-btn');
        const cb = card.querySelector('.compare-btn');
        wb.textContent = wish.includes(bike.id) ? '♥ Saved' : '♡ Save';
        cb.textContent = comp.includes(bike.id) ? 'Selected' : 'Compare';
        // handlers
        wb.onclick = () => {
          const list = getWishlist();
          if (list.includes(bike.id)) { list.splice(list.indexOf(bike.id),1); } else { list.push(bike.id); }
          saveWishlist(list); syncButtons();
        };
        cb.onclick = () => {
          const list = getCompare();
          if (list.includes(bike.id)) { list.splice(list.indexOf(bike.id),1); } else {
            if (list.length>=2){ alert('You can compare up to 2 bikes only.'); return; }
            list.push(bike.id);
          }
          saveCompare(list); syncButtons();
        };
      });
    }

    // wishlist & compare modal rendering
    const wishlistModal = $('#wishlistModal'), compareModal = $('#compareModal');
    const wishlistArea = $('#wishlistArea'), compareArea = $('#compareArea');
    $('#viewWishlist') && $('#viewWishlist').addEventListener('click', ()=>{
      renderWishlist(); wishlistModal.classList.remove('hidden');
    });
    $('#viewCompare') && $('#viewCompare').addEventListener('click', ()=>{
      renderCompare(); compareModal.classList.remove('hidden');
    });

    function renderWishlist(){
      const ids = getWishlist(); wishlistArea.innerHTML='';
      if (!ids.length) { wishlistArea.innerHTML='<p class="muted">No items in wishlist.</p>'; return; }
      ids.forEach(id=>{
        const bike = read(KEY_BIKES, DEFAULT_BIKES).find(b=>b.id===id);
        if (!bike) return;
        const div = document.createElement('div'); div.className='compare-card';
        div.innerHTML = `<h4>${bike.name}</h4><p>${bike.price}</p><div style="margin-top:.6rem"><a href="booking.html#${bike.id}" class="btn small">Enquire</a> <button class="btn small ghost" data-id="${bike.id}">Remove</button></div>`;
        wishlistArea.appendChild(div);
      });
      wishlistArea.querySelectorAll('[data-id]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.getAttribute('data-id');
          const list = getWishlist(); const i=list.indexOf(id); if(i>-1) list.splice(i,1); saveWishlist(list); renderWishlist(); applyFilters();
        });
      });
    }

    function renderCompare(){
      const ids = getCompare(); compareArea.innerHTML='';
      if (!ids.length) { compareArea.innerHTML='<p class="muted">Pick up to 2 bikes to compare.</p>'; return; }
      ids.forEach(id=>{
        const bike = read(KEY_BIKES, DEFAULT_BIKES).find(b=>b.id===id);
        if(!bike) return;
        const div=document.createElement('div'); div.className='compare-card';
        div.innerHTML = `<h4>${bike.name}</h4><img src="${bike.img}" style="width:100%;height:140px;object-fit:contain;border-radius:6px"/><p><strong>Price:</strong> ${bike.price}</p><p><strong>Engine:</strong> ${bike.engine}</p><div style="margin-top:.6rem"><a class="btn small" href="booking.html#${bike.id}">Enquire</a> <button class="btn small ghost" data-id="${bike.id}">Remove</button></div>`;
        compareArea.appendChild(div);
      });
      compareArea.querySelectorAll('[data-id]').forEach(btn=>{
        btn.addEventListener('click', ()=>{ const id=btn.getAttribute('data-id'); const list=getCompare(); const i=list.indexOf(id); if(i>-1) list.splice(i,1); saveCompare(list); renderCompare(); applyFilters(); });
      });
    }

    // close modals
    $$('.modal-close').forEach(b=>b.addEventListener('click', ()=>{ wishlistModal && wishlistModal.classList.add('hidden'); compareModal && compareModal.classList.add('hidden'); }));
    window.addEventListener('click', e=>{ if (e.target.classList && e.target.classList.contains('modal')) { wishlistModal && wishlistModal.classList.add('hidden'); compareModal && compareModal.classList.add('hidden'); }});
    // initial render
    applyFilters();
  } // end models page

  // --- BOOKING PAGE (booking.html) ---
  const bookingForm = $('#bookingForm');
  if (bookingForm) {
    const select = bookingForm.querySelector('select[name=bike]');
    const bikes = read(KEY_BIKES, DEFAULT_BIKES);
    bikes.forEach(b => {
      const opt = document.createElement('option'); opt.value=b.id; opt.textContent = b.name + ' • ' + b.price; select.appendChild(opt);
    });
    const pick = location.hash.replace('#',''); if (pick) select.value = pick;
    bookingForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(bookingForm).entries());
      const bookings = read(KEY_BOOKINGS, []);
      bookings.push({...data, createdAt: new Date().toISOString()});
      save(KEY_BOOKINGS, bookings);
      alert('Your test ride request was submitted (demo).');
      bookingForm.reset();
    });
  }

  // --- CONTACT FORM ---
  const contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      const msgs = read('bikehub_contacts_v1', []);
      msgs.push({...data, createdAt:new Date().toISOString()});
      save('bikehub_contacts_v1', msgs);
      alert('Message sent (demo).');
      contactForm.reset();
    });
  }

// --- GALLERY PAGE LOGIC ---
// --- GALLERY PAGE LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const galleryGrid = document.querySelector("#galleryGrid");
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImage");
  const lbCap = document.getElementById("lbCaption");
  const lbClose = document.getElementById("lbClose");

  if (!galleryGrid) return; // Exit if not on gallery page

  const images = [
    { src: "himaliyan.jpg", cap: "Himalayan — Adventure" },
    { src: "classic.jpg", cap: "Classic 350 — Roadster" },
    { src: "meteor.jpg", cap: "Meteor 350 — Cruiser" },
    { src: "interceptor.webp", cap: "Interceptor 650 — Twin Cylinder" },
    { src: "bullet-350.webp", cap: "Bullet 350 — Legacy" },
    { src: "gt.jpg", cap: "Continental GT 650 — Café Racer" },
    { src: "sg.jpg", cap: "Shotgun 650 — Custom Cruiser" },
    { src: "bear.webp", cap: "Bear 350 — Urban Explorer" }
  ];

  // Build gallery dynamically
  galleryGrid.innerHTML = images.map(img => `
    <div class="gallery-item">
      <img src="${img.src}" alt="${img.cap}" loading="lazy">
      <div class="gallery-overlay">${img.cap}</div>
    </div>
  `).join("");

  // Click image → show in lightbox
  galleryGrid.querySelectorAll(".gallery-item img").forEach((imgEl, i) => {
    imgEl.addEventListener("click", () => {
      lbImg.src = images[i].src;
      lbCap.textContent = images[i].cap;
      lightbox.classList.remove("hidden");
    });
  });

  // Close lightbox (button or outside click)
  lbClose.addEventListener("click", () => lightbox.classList.add("hidden"));
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
  });
});



  // --- ADMIN DASHBOARD (bookings + events + bikes) ---
  const adminBookings = $('#adminBookings');
  if (adminBookings) {
    function renderAdminBookings(){
      const bookings = read(KEY_BOOKINGS, []);
      adminBookings.innerHTML = bookings.length ? bookings.map((b,i)=>`
        <div class="compare-card" style="margin-bottom:.8rem">
          <h4>${i+1}. ${b.name} — ${b.bike || '(no bike selected)'}</h4>
          <p><strong>Email:</strong> ${b.email || '(none)'}</p>
          <p><strong>Phone:</strong> ${b.phone || '(none)'}</p>
          <p><strong>Date:</strong> ${b.date || '(none)'}</p>
          <p><strong>Message:</strong> ${b.message || '(none)'}</p>
          <p><em>Submitted on: ${new Date(b.createdAt).toLocaleString()}</em></p>
        </div>
      `).join('') : '<p class="muted">No bookings yet.</p>';
    }
    $('#clearBookings') && $('#clearBookings').addEventListener('click', ()=>{
      if (confirm('Clear all bookings?')){ localStorage.removeItem(KEY_BOOKINGS); renderAdminBookings(); alert('Bookings cleared.'); }
    });
    renderAdminBookings();
  }

  // events manager
  const eventForm = $('#eventForm');
  const eventsList = $('#eventsList');
  if (eventForm && eventsList) {
    function renderEvents(){
      const ev = read(KEY_EVENTS, []);
      eventsList.innerHTML = ev.length ? ev.map((e, i)=>`<div class="compare-card" style="margin-bottom:.6rem"><h4>${e.title} — ${e.date}</h4><p><strong>Venue:</strong> ${e.venue}</p><div style="margin-top:.4rem"><button class="btn ghost" data-index="${i}" data-delete>Delete</button></div></div>`).join('') : '<p class="muted">No events.</p>';
      eventsList.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => {
        const idx = Number(b.getAttribute('data-index')); const list = read(KEY_EVENTS, []); list.splice(idx,1); save(KEY_EVENTS, list); renderEvents();
      }));
    }
    eventForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(eventForm).entries());
      const list = read(KEY_EVENTS, []); list.push(data); save(KEY_EVENTS, list); eventForm.reset(); renderEvents();
    });
    renderEvents();
  }

  // bikes manager in admin
  const bikeForm = $('#bikeForm');
  const bikesAdminList = $('#bikesAdminList');
  if (bikeForm && bikesAdminList) {
    function renderBikesAdmin(){
      const bikes = read(KEY_BIKES, []);
      bikesAdminList.innerHTML = bikes.length ? bikes.map((b, i)=>`<div class="compare-card" style="margin-bottom:.6rem"><h4>${b.name}</h4><p>${b.brand} • ${b.price}</p><div style="margin-top:.4rem"><button class="btn ghost" data-index="${i}" data-delete>Delete</button></div></div>`).join('') : '<p class="muted">No bikes available.</p>';
      bikesAdminList.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click', ()=>{
        const i = Number(btn.getAttribute('data-index')); const bikes = read(KEY_BIKES, []); bikes.splice(i,1); save(KEY_BIKES, bikes); renderBikesAdmin();
      }));
    }
    bikeForm.addEventListener('submit', e=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(bikeForm).entries());
      const bikes = read(KEY_BIKES, []);
      bikes.push({ id: data.name.toLowerCase().replace(/\s+/g,'-'), name: data.name, brand: data.brand, price: data.price, img: data.img, desc: data.desc || '', engine: data.engine || '', mileage: data.mileage || '' });
      save(KEY_BIKES, bikes);
      bikeForm.reset(); renderBikesAdmin();
      alert('Bike added to list (demo).');
    });
    renderBikesAdmin();
  }

  // If models exist on other pages (index featured), we don't need to duplicate code; they are static there.

  // listen for storage changes (update counts across tabs)
  window.addEventListener('storage', ()=>{ const wc = $('#wishCount'); if (wc) wc.textContent = read(KEY_WISHLIST,[]).length; const cc = $('#compareCount'); if (cc) cc.textContent = read(KEY_COMPARE,[]).length; });

})(); // end IIFE
