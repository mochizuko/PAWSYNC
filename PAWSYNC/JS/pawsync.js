/* =====================================================================
   PawSync prototype script  (put this file in /JS/pawsync.js)
   ---------------------------------------------------------------------
   Basic JS only: no backend, no database. Everything is saved in the
   browser's localStorage, so data stays after a refresh or page change.

   Add this ONE line before </head> on every page in /html:
     <script src="../JS/pawsync.js" defer></script>

   Login / Create account stay in login.html (the team's own script).
   This file reads the same session (sessionStorage 'pawsyncSession')
   and owner accounts (localStorage 'pawsyncOwnerAccounts').

   Demo logins (choose the matching "Log in as" option):
     Pet owner    : trishia@example.com / pawsync123
     Clinic staff : clinicstaff@gmail.com / 12345678
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- Settings you can change ---------- */
  var KEY = 'pawsync:v3:'; // change the number to wipe old demo data (owner accounts are kept)
  var NOW = new Date();
  var YEAR = NOW.getFullYear(); // the calendar always follows the device's current year
  var TODAY = YEAR + '-' + pad(NOW.getMonth() + 1) + '-' + pad(NOW.getDate());
  var LAST_DAY = YEAR + '-12-31'; // last bookable day (end of the current year)
  var LIMIT = 15; // patients per day (from the proposal)
  var REQUIRE_LOGIN = true; // false = portal/staff pages open without logging in
  var MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  var NEWEST_FIRST = { 'invoice-list': 1, 'report-list': 1 };
  var TIMES = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM'
  ];
  var FULL_BASE = {}; // a few days start out full so the "Full" state can be demoed
  FULL_BASE[rel(2)] = 15;
  FULL_BASE[rel(3)] = 15;
  FULL_BASE[rel(9)] = 15;
  function rel(n) {
    return addDays(TODAY, n); // a date n days from today
  }
  function monthLabel(offset) {
    var d = new Date(YEAR, NOW.getMonth() + offset, 1);
    return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ---------- Sample data (dates are relative to today) ---------- */
  var SEED = {
    'appointment-list': [],
    'invoice-list': [
      ['INV-8041', 'Alex Santos / Milo', TODAY, '1,250.00', 'Paid'],
      ['INV-8040', 'Jamie Reyes / Luna', TODAY, '850.00', 'Unpaid'],
      ['INV-8039', 'Sam Cruz / Buddy', rel(-1), '2,100.00', 'Partially paid'],
      ['INV-8038', 'Alex Santos / Milo', rel(-8), '1,600.00', 'Paid'],
      ['INV-8037', 'Robin Lee / Coco', rel(-35), '3,400.00', 'Paid']
    ],
    'client-list': [],
    'confined-pet-list': [],
    'inventory-list': [
      ['I-302', 'Examination gloves', 'Medical supplies', '24', '20', '30.00', rel(240)],
      ['I-211', 'Canine vaccine', 'Vaccines', '8', '10', '450.00', rel(14)],
      ['I-148', 'Pet bandage roll', 'First aid', '6', '12', '120.00', rel(120)]
    ],
    'patient-record-list': [],
    'report-list': [
      ['Appointment summary', monthLabel(0), 'Dr. Maralit', rel(-1), 'Ready'],
      ['Inventory reorder list', monthLabel(0), 'K. Nieves', rel(-2), 'Ready'],
      ['Monthly billing overview', monthLabel(-1), 'T. Maralit', rel(-12), 'Archived']
    ],
    'staff-user-list': [
      [
        'U-001',
        'Dr. Trishia Maralit',
        'Veterinarian',
        'trishia.maralit@example.com',
        'Active'
      ],
      ['U-002', 'Kaye Nieves', 'Receptionist', 'kaye.nieves@example.com', 'Active'],
      ['U-003', 'Lysa Pido', 'Veterinary nurse', 'lysa.pido@example.com', 'Active']
    ]
  };
  var CLIENT_EMAIL = 'trishia@example.com';
  var EXTRA = {
    // Demo data: 5 clients, 5 patients, 5 appointments and 3 confined pets that all relate to each other.
    // Dagul / Trishia Maralit belongs to the demo pet-owner account.
    'patient-record-list': [
      {
        c: ['P-0042', 'Dagul', 'Trishia Maralit', 'Dog', rel(-3)],
        m: {
          owner: CLIENT_EMAIL,
          breed: 'Aspin',
          gender: 'Male',
          birthday: '2020-03-14',
          color: 'Brown/Black',
          people: [{ name: 'Trishia Maralit', rel: 'Owner', contact: '09123456789' }]
        }
      },
      {
        c: ['P-0043', 'Milo', 'Alex Santos', 'Dog', rel(-20)],
        m: {
          breed: 'Shih Tzu',
          gender: 'Male',
          birthday: '2019-08-21',
          color: 'White/Gold',
          people: [{ name: 'Alex Santos', rel: 'Owner', contact: '0917 555 0131' }]
        }
      },
      {
        c: ['P-0044', 'Luna', 'Jamie Reyes', 'Cat', TODAY],
        m: {
          breed: 'Domestic shorthair',
          gender: 'Female',
          birthday: '2022-06-01',
          color: 'White',
          people: [{ name: 'Jamie Reyes', rel: 'Owner', contact: '0918 555 0142' }]
        }
      },
      {
        c: ['P-0045', 'Buddy', 'Sam Cruz', 'Dog', rel(-1)],
        m: {
          breed: 'Golden Retriever',
          gender: 'Male',
          birthday: '2018-11-05',
          color: 'Golden',
          people: [
            { name: 'Sam Cruz', rel: 'Owner', contact: '0920 555 0164' },
            { name: 'Mia Cruz', rel: 'Caretaker', contact: '0920 555 0165' }
          ]
        }
      },
      {
        c: ['P-0046', 'Coco', 'Robin Lee', 'Dog', TODAY],
        m: {
          breed: 'Poodle',
          gender: 'Female',
          birthday: '2021-02-14',
          color: 'Brown',
          people: [{ name: 'Robin Lee', rel: 'Owner', contact: '0921 555 0177' }]
        }
      }
    ],
    'client-list': [
      { c: ['C-2040', 'Trishia Maralit', '09123456789', CLIENT_EMAIL, 'Dagul'], m: {} },
      { c: ['C-2041', 'Alex Santos', '0917 555 0131', 'alex.santos@example.com', 'Milo'], m: {} },
      { c: ['C-2042', 'Jamie Reyes', '0918 555 0142', 'jamie.reyes@example.com', 'Luna'], m: {} },
      { c: ['C-2043', 'Sam Cruz', '0920 555 0164', 'sam.cruz@example.com', 'Buddy'], m: {} },
      { c: ['C-2044', 'Robin Lee', '0921 555 0177', 'robin.lee@example.com', 'Coco'], m: {} }
    ],
    'appointment-list': [
      {
        c: ['A-5090', rel(7) + ' 10:00', 'Dagul', 'Trishia Maralit', 'Vaccination', 'Reserved'],
        m: { owner: CLIENT_EMAIL, priority: 'Normal', bookingType: 'Scheduled' }
      },
      {
        c: ['A-5101', TODAY + ' 09:00', 'Coco', 'Robin Lee', 'Urgent consultation', 'Confirmed'],
        m: { priority: 'Emergency', bookingType: 'Walk-in' }
      },
      {
        c: ['A-5102', TODAY + ' 10:00', 'Milo', 'Alex Santos', 'Wellness exam', 'Confirmed'],
        m: { priority: 'Normal', bookingType: 'Scheduled' }
      },
      {
        c: ['A-5103', TODAY + ' 11:00', 'Luna', 'Jamie Reyes', 'Confinement care', 'Confirmed'],
        m: { priority: 'Priority', bookingType: 'Scheduled' }
      },
      {
        c: ['A-5104', TODAY + ' 13:00', 'Buddy', 'Sam Cruz', 'Post-surgery check', 'Reserved'],
        m: { priority: 'Priority', bookingType: 'Scheduled' }
      }
    ],
    'confined-pet-list': [
      { c: ['W-019', 'Luna', 'Jamie Reyes', TODAY, 'Stable'], m: {} },
      { c: ['W-020', 'Buddy', 'Sam Cruz', rel(-1), 'Under observation'], m: {} },
      { c: ['W-021', 'Coco', 'Robin Lee', TODAY, 'Needs attention'], m: {} }
    ],
    'invoice-list': [
      {
        c: ['INV-9001', 'Trishia Maralit / Dagul', TODAY, '850.00', 'Paid'],
        m: {
          owner: CLIENT_EMAIL,
          pet: 'Dagul',
          service: 'Vaccination',
          items: [],
          paymentMethod: 'E-wallet'
        }
      }
    ]
  };
  var SEED_ACCOUNTS = [
    {
      name: 'Trishia Maralit',
      email: CLIENT_EMAIL,
      mobile: '09123456789',
      password: 'pawsync123',
      address: '123 Sample Street, Manila'
    }
  ];

  /* ---------- Tiny helpers ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(k, d) {
    try {
      var v = localStorage.getItem(KEY + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  }
  function save(k, v) {
    try {
      localStorage.setItem(KEY + k, JSON.stringify(v));
      return true;
    } catch (e) {
      toast('Could not save data in this browser. Check available storage and try again.', 'err');
      return false;
    }
  }
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function longDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  function shortDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
      month: 'long',
      day: 'numeric'
    });
  }
  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function to24(t) {
    var m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(t);
    if (!m) return t;
    var h = (+m[1] % 12) + (/pm/i.test(m[3]) ? 12 : 0);
    return pad(h) + ':' + m[2];
  }
  function to12(t) {
    var m = /^(\d+):(\d+)/.exec(t);
    if (!m) return t;
    var h = +m[1];
    return (h % 12 || 12) + ':' + m[2] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function badge(v) {
    var s = String(v),
      c = 'reserved';
    if (/emerg/i.test(s)) c = 'emergency';
    else if (/cancel|inactive|unpaid|void|archiv/i.test(s)) c = 'cancelled';
    else if (/wait|priority|observ|attention|progress|partial/i.test(s)) c = 'priority';
    else if (/complet|paid|done|discharge|ready|stable/i.test(s)) c = 'done';
    return '<span class="badge badge--' + c + '">' + esc(s) + '</span>';
  }

  /* ---------- Page styles, toast, dialog ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#ps-toasts{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:340px}' +
    '.ps-toast{background:rgba(27,42,65,.94);color:#fff;padding:14px 20px;border-radius:16px;box-shadow:0 12px 30px rgba(27,42,65,.3);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);animation:ps-toast-in .45s cubic-bezier(.34,1.56,.64,1) both}.ps-toast--err{background:rgba(179,38,30,.96)}@keyframes ps-toast-in{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}' +
    '.ps-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}.ps-section{margin-top:24px}' +
    '.ps-actions{white-space:nowrap}.ps-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
    '.ps-reset{margin-top:32px}.ps-hint{margin-top:24px}';
  document.head.appendChild(css);

  function toast(msg, type) {
    var box = $('#ps-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ps-toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    t.className = 'ps-toast' + (type === 'err' ? ' ps-toast--err' : '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 3500);
  }
  function dialog(title, body, okLabel, onOk) {
    var d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML =
      '<form><h2 class="modal__title">' +
      esc(title) +
      '</h2><div>' +
      body +
      '</div><div class="modal__actions">' +
      '<button type="button" class="btn btn--outline" data-x>Cancel</button><button type="submit" class="btn btn--primary">' +
      esc(okLabel) +
      '</button></div></form>';
    document.body.appendChild(d);
    $('[data-x]', d).onclick = function () {
      d.close();
    };
    d.addEventListener('close', function () {
      d.remove();
    });
    $('form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      if (onOk(d) !== false) d.close();
    });
    d.showModal();
  }
  function setErr(input, msg) {
    var e = document.getElementById(input.id + '-error');
    if (!e) return;
    e.textContent = msg;
    e.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    if (input.type !== 'checkbox' && input.type !== 'radio')
      input.classList.add('form-input--error');
  }
  function clearErr(input) {
    var e = document.getElementById(input.id + '-error');
    if (e) {
      e.textContent = '';
      e.hidden = true;
    }
    input.removeAttribute('aria-invalid');
    input.classList.remove('form-input--error');
  }

  /* ---------- Data: accounts, session, table rows ---------- */
  function accounts() {
    var a = [];
    try {
      a = JSON.parse(localStorage.getItem('pawsyncOwnerAccounts') || '[]');
    } catch (e) {
      a = [];
    }
    var added = false;
    SEED_ACCOUNTS.forEach(function (seed) {
      if (
        !a.some(function (x) {
          return x.email === seed.email;
        })
      ) {
        a.push(seed);
        added = true;
      }
    });
    if (added) saveAccounts(a);
    return a;
  }
  function saveAccounts(a) {
    try {
      localStorage.setItem('pawsyncOwnerAccounts', JSON.stringify(a));
    } catch (e) {}
  }
  function findAccount(idv) {
    idv = idv.toLowerCase().replace(/\s/g, '');
    return accounts().filter(function (a) {
      return a.email.toLowerCase() === idv || a.mobile === idv;
    })[0];
  }
  function session() {
    var s = null;
    try {
      s = JSON.parse(sessionStorage.getItem('pawsyncSession') || 'null');
    } catch (e) {
      s = null;
    }
    if (!s) return null;
    if (s.role === 'owner') {
      var acc = accounts().filter(function (a) {
        return a.name === s.name;
      })[0];
      s.email = acc ? acc.email : s.name; // owner key that links pets and appointments
    }
    return s;
  }
  function firstName(n) {
    return String(n)
      .replace(/^Dr\.\s*/, '')
      .split(' ')[0];
  }
  function rows(id) {
    var r = load('t:' + id);
    var changed = false;
    if (!r) {
      r = (SEED[id] || [])
        .map(function (c) {
          return { c: c.slice(), m: {} };
        })
        .concat(JSON.parse(JSON.stringify(EXTRA[id] || [])));
      changed = true;
    }
    (EXTRA[id] || []).forEach(function (extra) {
      if (!r.some(function (item) { return item.c[0] === extra.c[0]; })) {
        r.push(JSON.parse(JSON.stringify(extra)));
        changed = true;
      }
    });
    if (id === 'inventory-list') {
      r.forEach(function (item) {
        var defaults = {
          'examination gloves': ['30.00', rel(240)],
          'canine vaccine': ['450.00', rel(14)],
          'pet bandage roll': ['120.00', rel(120)]
        }[String(item.c[1]).toLowerCase()] || ['0.00', ''];
        if (item.c[5] == null || item.c[5] === '') {
          item.c[5] = defaults[0];
          changed = true;
        }
        if (item.c[6] == null) {
          item.c[6] = defaults[1];
          changed = true;
        }
      });
    }
    if (changed) save('t:' + id, r);
    return r;
  }
  function saveRows(id, r) {
    return save('t:' + id, r);
  }
  function nextId(id) {
    var best = null;
    rows(id).forEach(function (x) {
      var m = /^(.*?)(\d+)$/.exec(x.c[0]);
      if (m && (!best || +m[2] > best.n)) best = { p: m[1], n: +m[2], w: m[2].length };
    });
    return best ? best.p + String(best.n + 1).padStart(best.w, '0') : '';
  }
  function dayCount(d) {
    var notice = load('clinicClosure', null);
    if (notice && notice.date === d) return LIMIT;
    var n = FULL_BASE[d] || 0;
    rows('appointment-list').forEach(function (r) {
      if (r.c[1].slice(0, 10) === d && !/cancel/i.test(r.c[5])) n++;
    });
    return n;
  }
  function nextOpen(d) {
    for (var i = 0; i < 400; i++) {
      d = addDays(d, 1);
      if (d > LAST_DAY) return null;
      if (dayCount(d) < LIMIT) return d;
    }
    return null;
  }
  function myPets() {
    var s = session();
    return rows('patient-record-list').filter(function (r) {
      return r.m.owner === s.email;
    });
  }
  function myAppts() {
    var s = session();
    return rows('appointment-list').filter(function (r) {
      return r.m.owner === s.email;
    });
  }

  /* ---------- Login, logout, guard ---------- */
  function logout() {
    sessionStorage.removeItem('pawsyncSession');
    location.href = 'login.html';
  }
  function resetDemo() {
    if (
      !confirm(
        'Reset all demo data in this browser? Accounts, pets, appointments and table entries go back to the sample data.'
      )
    )
      return;
    Object.keys(localStorage).forEach(function (k) {
      if (k.indexOf(KEY) === 0) localStorage.removeItem(k);
    });
    location.href = 'login.html';
  }
  function guard() {
    var s = session(),
      staff = /^staff/.test(page) && page !== 'style-guide.html',
      portal = /^portal/.test(page);
    if (!REQUIRE_LOGIN || (!staff && !portal)) return true;
    if (!s) {
      location.replace('login.html?next=' + encodeURIComponent(page));
      return false;
    }
    if (staff && s.role !== 'staff') {
      location.replace('portal-dashboard.html');
      return false;
    }
    if (portal && s.role !== 'owner') {
      location.replace('staff.html');
      return false;
    }
    return true;
  }
  function addResetLink() {
    var main = $('main');
    if (!main) return;
    var p = document.createElement('p');
    p.className = 'ps-reset';
    p.innerHTML =
      '<button type="button" class="btn btn--link btn--small">Reset demo data</button>';
    $('button', p).onclick = resetDemo;
    main.appendChild(p);
  }

  /* ---------- Public pages ---------- */
  function publicPages() {
    var s = session(),
      login = $('.site-header a[href="login.html"]');
    if (s && login) {
      login.textContent = 'My account';
      login.setAttribute(
        'href',
        s.role === 'staff' ? 'staff.html' : 'portal-dashboard.html'
      );
    }
    $$('a.btn').forEach(function (a) {
      if (/^book (a visit|an appointment)/i.test(a.textContent.trim()))
        a.setAttribute('href', 'portal-book-appointment.html');
    });
    var msg = $('#message'),
      form = msg && msg.closest('form');
    if (form)
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var list = load('messages', []);
        list.push({
          name: $('#name').value,
          email: $('#email').value,
          message: msg.value,
          at: new Date().toISOString()
        });
        save('messages', list);
        form.reset();
        toast('Message sent. It is saved in this browser (prototype).');
      });
    if (page === 'index.html') {
      var closure = load('clinicClosure', null);
      if (closure && closure.date >= TODAY) {
        $('#main').insertAdjacentHTML(
          'afterbegin',
          '<div class="container section"><div class="notice-banner" role="status"><strong>Clinic closure notice - ' +
            esc(longDate(closure.date)) +
            ':</strong> ' +
            esc(closure.message) +
            '</div></div>'
        );
      }
    }
  }

  function loginPage() {
    var lf = $('#login-form');
    if (!lf || !$('#register-form')) return;
    lf.insertAdjacentHTML(
      'afterend',
      '<div class="alert alert--info ps-hint"><p class="alert__title">Demo accounts</p>' +
        '<p>Pet owner: <strong>trishia@example.com</strong> / pawsync123<br>' +
        'Clinic staff: <strong>clinicstaff@gmail.com</strong> / 12345678</p></div>'
    );
    accounts(); // makes sure the demo owner account exists
    var forgot = $('#panel-login a[href="#"]');
    if (forgot)
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        var acc = findAccount(
          prompt('Enter the email or mobile number of your account:') || ''
        );
        if (!acc) {
          toast('No owner account found.', 'err');
          return;
        }
        var pw = prompt('Enter a new password (at least 8 characters):') || '';
        if (pw.length < 8) {
          toast('Password was not changed. Use at least 8 characters.', 'err');
          return;
        }
        acc.password = pw;
        saveAccounts(
          accounts().map(function (a) {
            return a.email === acc.email ? acc : a;
          })
        );
        toast('Password updated. You can log in now.');
      });
  }

  /* ---------- Client portal ---------- */
  function portalCommon() {
    var s = session(),
      hi = $('.portal-header__greeting');
    if (hi) {
      hi.textContent = 'Hi, ' + firstName(s.name) + '!';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--outline btn--small';
      b.textContent = 'Log out';
      b.onclick = logout;
      hi.insertAdjacentElement('afterend', b);
    }
    $$('main > p').forEach(function (p) {
      if (/will appear/i.test(p.textContent)) p.hidden = true;
    });
    addResetLink();
  }
  function mount(html) {
    var d = document.createElement('div');
    d.className = 'ps-section';
    d.innerHTML = html;
    $('main .ps-reset')
      ? $('main').insertBefore(d, $('main .ps-reset'))
      : $('main').appendChild(d);
    return d;
  }

  function apptRow(r) {
    return {
      id: r.c[0],
      date: r.c[1].slice(0, 10),
      time: r.c[1].slice(11),
      pet: r.c[2],
      service: r.c[4],
      status: r.c[5]
    };
  }

  function dashboardPage() {
    if (page !== 'portal-dashboard.html') return;
    var up = myAppts()
      .map(apptRow)
      .filter(function (a) {
        return a.date >= TODAY && !/cancel|complet/i.test(a.status);
      })
      .sort(function (a, b) {
        return a.date + a.time < b.date + b.time ? -1 : 1;
      });
    var reminders = up.filter(function (a) {
      return a.date <= addDays(TODAY, 7) && /reserved/i.test(a.status);
    });
    var html = '',
      closure = load('clinicClosure', null);
    if (closure && closure.date >= TODAY) {
      html += '<div class="notice-banner" role="status"><strong>Clinic closure notice - ' +
        esc(longDate(closure.date)) + ':</strong> ' + esc(closure.message) + '</div>';
    }
    reminders.forEach(function (a) {
      html +=
        '<div class="alert alert--warning" role="status"><p class="alert__title">Reminder</p><p>' +
        esc(a.pet) +
        ' has a ' +
        esc(a.service) +
        ' appointment on ' +
        longDate(a.date) +
        ' at ' +
        to12(a.time) +
        '. <a href="portal-my-appointments.html">Confirm or reschedule</a></p></div>';
    });
    html +=
      '<h2>Upcoming appointments</h2>' +
      (up.length
        ? '<ul>' +
          up
            .slice(0, 5)
            .map(function (a) {
              return (
                '<li>' +
                longDate(a.date) +
                ', ' +
                to12(a.time) +
                ': ' +
                esc(a.pet) +
                ' (' +
                esc(a.service) +
                ') ' +
                badge(a.status) +
                '</li>'
              );
            })
            .join('') +
          '</ul>'
        : '<p>No upcoming appointments.</p>');
    var pets = myPets();
    html +=
      '<h2>Your pets</h2>' +
      (pets.length
        ? '<p>' +
          pets
            .map(function (r) {
              return esc(r.c[1]);
            })
            .join(', ') +
          ' &mdash; <a href="portal-my-pets.html">view all</a></p>'
        : '<p>You have not registered a pet yet.</p>');
    mount(html);
  }

  function myPetsPage() {
    if (page !== 'portal-my-pets.html') return;
    var pets = myPets();
    mount(
      pets.length
        ? '<div class="ps-grid">' +
            pets
              .map(function (r) {
                var m = r.m,
                  people = (m.people || [])
                    .map(function (p) {
                      return esc(p.name) + ' (' + esc(p.rel) + ')';
                    })
                    .join(', ');
                return (
                  '<article class="card"><h2 class="card__title">' +
                  esc(r.c[1]) +
                  '</h2><p>' +
                  esc(r.c[3]) +
                  (m.breed ? ' &middot; ' + esc(m.breed) : '') +
                  (m.gender ? ' &middot; ' + esc(m.gender) : '') +
                  '</p>' +
                  '<p>Birthday: ' +
                  esc(m.birthday || 'not set') +
                  '<br>Color: ' +
                  esc(m.color || 'not set') +
                  '<br>Pet ID: ' +
                  esc(r.c[0]) +
                  '<br>Last visit: ' +
                  esc(r.c[4]) +
                  '</p>' +
                  '<p>Linked owners / caretakers: ' +
                  (people || 'none') +
                  '</p><a class="btn btn--secondary btn--small" href="portal-book-appointment.html?pet=' +
                  encodeURIComponent(r.c[1]) +
                  '">Book a visit</a></article>'
                );
              })
              .join('') +
            '</div>'
        : '<div class="alert alert--info"><p class="alert__title">No pets yet</p><p>Register your first pet to see it here.</p></div>'
    );
  }

  function myAppointmentsPage() {
    if (page !== 'portal-my-appointments.html') return;
    var box = mount('');
    function draw() {
      var list = myAppts()
        .map(apptRow)
        .sort(function (a, b) {
          return a.date + a.time < b.date + b.time ? 1 : -1;
        });
      box.innerHTML = list.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Pet</th><th scope="col">Service</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>' +
          list
            .map(function (a) {
              var open = /reserved|confirmed|waiting/i.test(a.status),
                btn = '';
              if (/reserved/i.test(a.status))
                btn +=
                  '<button type="button" class="btn btn--secondary btn--small" data-act="confirm" data-id="' +
                  esc(a.id) +
                  '">Confirm</button> ';
              if (open)
                btn +=
                  '<button type="button" class="btn btn--outline btn--small" data-act="resched" data-id="' +
                  esc(a.id) +
                  '">Reschedule</button> <button type="button" class="btn btn--link btn--small" data-act="cancel" data-id="' +
                  esc(a.id) +
                  '">Cancel</button>';
              return (
                '<tr><td>' +
                shortDate(a.date) +
                '</td><td>' +
                to12(a.time) +
                '</td><td>' +
                esc(a.pet) +
                '</td><td>' +
                esc(a.service) +
                '</td><td>' +
                badge(a.status) +
                '</td><td class="ps-actions">' +
                (btn || '-') +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></div>'
        : '<p>You have no appointments yet.</p>';
    }
    function update(id, fn) {
      var all = rows('appointment-list');
      all.forEach(function (r) {
        if (r.c[0] === id) fn(r);
      });
      saveRows('appointment-list', all);
      draw();
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.dataset.id,
        act = b.dataset.act;
      if (act === 'confirm') {
        update(id, function (r) {
          r.c[5] = 'Confirmed';
        });
        toast('Appointment confirmed.');
      }
      if (act === 'cancel' && confirm('Cancel this appointment?')) {
        update(id, function (r) {
          r.c[5] = 'Cancelled';
        });
        toast('Appointment cancelled.');
      }
      if (act === 'resched') {
        var cur = rows('appointment-list').filter(function (r) {
            return r.c[0] === id;
          })[0],
          a = apptRow(cur),
          t12 = to12(a.time);
        var opts = (TIMES.indexOf(t12) < 0 ? [t12] : [])
          .concat(TIMES)
          .map(function (t) {
            return '<option' + (t === t12 ? ' selected' : '') + '>' + t + '</option>';
          })
          .join('');
        dialog(
          'Reschedule appointment',
          '<div class="form-group"><label class="form-group__label" for="rs-date">New date</label><input class="form-input" type="date" id="rs-date" min="' +
            TODAY +
            '" max="' +
            LAST_DAY +
            '" value="' +
            a.date +
            '"></div>' +
            '<div class="form-group"><label class="form-group__label" for="rs-time">Time slot</label><select class="form-select" id="rs-time">' +
            opts +
            '</select></div><p class="form-group__error" id="rs-date-error" hidden></p>',
          'Save new schedule',
          function (d) {
            var nd = $('#rs-date', d).value,
              err = $('#rs-date-error', d),
              bad = '';
            if (!nd || nd < TODAY || nd > LAST_DAY)
              bad =
                'Choose a date between ' +
                shortDate(TODAY) +
                ' and ' +
                shortDate(LAST_DAY) +
                '.';
            else if (nd !== a.date && dayCount(nd) >= LIMIT) {
              var n = nextOpen(nd);
              bad =
                longDate(nd) +
                ' is full.' +
                (n ? ' The next available date is ' + longDate(n) + '.' : '');
            }
            if (bad) {
              err.textContent = bad;
              err.hidden = false;
              return false;
            }
            update(id, function (r) {
              r.c[1] = nd + ' ' + to24($('#rs-time', d).value);
              r.c[5] = 'Reserved';
            });
            toast('Appointment rescheduled.');
          }
        );
      }
    });
    draw();
  }

  function myBillsFilesPage() {
    if (page !== 'portal-my-bills.html') return;
    var s = session(),
      host = $('#owner-bills'),
      bills = rows('invoice-list').filter(function (r) { return r.m.owner === s.email; });
    if (!host) return;
    if (!bills.length) {
      host.insertAdjacentHTML('beforeend', '<p>No bills are available yet.</p>');
    } else {
      host.insertAdjacentHTML(
        'beforeend',
        '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Invoice</th><th scope="col">Date</th><th scope="col">Pet / client</th><th scope="col">Service and items</th><th scope="col">Payment method</th><th scope="col">Total (PHP)</th><th scope="col">Status</th></tr></thead><tbody>' +
          bills.map(function (r) {
            var m = r.m || {},
              lineItems = (m.items || []).map(function (item) {
                return esc(item.name) + ' x' + esc(item.quantity);
              }).join(', ');
            return '<tr><td>' + esc(r.c[0]) + '</td><td>' + esc(r.c[2]) +
              '</td><td>' + esc(r.c[1]) + '</td><td>' +
              esc(m.service || 'Clinic services') + (lineItems ? '<br>' + lineItems : '') +
              '</td><td>' + esc(m.paymentMethod || 'Not listed') + '</td><td class="table__num">' +
              esc(r.c[3]) + '</td><td>' + badge(r.c[4]) + '</td></tr>';
          }).join('') +
          '</tbody></table></div>'
      );
    }
    document.addEventListener('click', function (e) {
      var button = e.target.closest('[data-sample-file]');
      if (!button) return;
      var title = button.dataset.sampleFile,
        pet = button.dataset.pet;
      dialog(
        title + ' - sample preview',
        '<div class="alert alert--info"><p class="alert__title">Prototype document</p><p>This is example content only; no real medical document is stored.</p></div>' +
          '<p><strong>Pet:</strong> ' + esc(pet) + '</p>' +
          '<p><strong>Document:</strong> ' + esc(title) + '</p>' +
          '<p><strong>Clinic:</strong> PawSync Veterinary Clinic</p>' +
          '<p><strong>Sample note:</strong> This preview demonstrates a document shared with the pet owner.</p>',
        'Close preview',
        function () { return true; }
      );
    });
  }

  function registerPetPage() {
    var form = $('#register-form');
    if (!form || !$('#pet-name')) return;
    var s = session(),
      acc =
        accounts().filter(function (a) {
          return a.email === s.email;
        })[0] || {};
    $('#owner-name').value = acc.name || s.name;
    if (acc.mobile) $('#owner-contact').value = acc.mobile;
    if (acc.address) $('#owner-address').value = acc.address;
    var addBtn = $('#add-owner'),
      extra = $('#extra-owner'),
      extraIds = ['extra-name', 'extra-relation', 'extra-contact'];
    addBtn.onclick = function () {
      extra.hidden = false;
      addBtn.hidden = true;
      addBtn.setAttribute('aria-expanded', 'true');
      $('#extra-name').focus();
    };
    $('#remove-owner').onclick = function () {
      extra.hidden = true;
      addBtn.hidden = false;
      addBtn.setAttribute('aria-expanded', 'false');
      extraIds.forEach(function (i) {
        $('#' + i).value = '';
        clearErr($('#' + i));
      });
    };
    $('#pet-name').addEventListener('input', function () {
      $('#duplicate-warning').hidden = true;
      $('#duplicate-confirm').checked = false;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true,
        f = function (id) {
          return $('#' + id);
        };
      function need(id, test, msg) {
        clearErr(f(id));
        if (!test(f(id).value.trim())) {
          setErr(f(id), msg);
          ok = false;
        }
      }
      var filled = function (v) {
          return v !== '';
        },
        phone = function (v) {
          return /^\d{11}$/.test(v.replace(/\s/g, ''));
        };
      need('pet-name', filled, 'Enter your pet\u2019s name.');
      need('pet-species', filled, 'Select a species.');
      need('pet-breed', filled, 'Enter the breed, or write Mixed or Unknown.');
      need(
        'pet-birthday',
        function (v) {
          return v !== '' && v <= new Date().toISOString().slice(0, 10);
        },
        'Enter a birthday that is not in the future.'
      );
      need('pet-color', filled, 'Enter your pet\u2019s color.');
      need('owner-name', filled, 'Enter your full name.');
      need('owner-address', filled, 'Enter your address.');
      need('owner-contact', phone, 'Enter a contact number with 11 digits.');
      var g = $('input[name="gender"]:checked', form),
        ge = f('pet-gender-error');
      ge.hidden = !!g;
      ge.textContent = g ? '' : 'Select your pet\u2019s gender.';
      if (!g) ok = false;
      var extraOn = !extra.hidden;
      if (extraOn) {
        need('extra-name', filled, 'Enter the person\u2019s full name.');
        need('extra-relation', filled, 'Select the relationship to the pet.');
        need('extra-contact', phone, 'Enter a contact number with 11 digits.');
      }
      if (!ok) {
        var bad = $('[aria-invalid="true"]', form) || ge;
        if (bad.focus) bad.focus();
        return;
      }

      var name = f('pet-name').value.trim(),
        species = f('pet-species').value,
        ownerName = f('owner-name').value.trim(),
        contact = f('owner-contact').value.replace(/\s/g, '');
      var people = [{ name: ownerName, rel: 'Owner', contact: contact }];
      if (extraOn)
        people.push({
          name: f('extra-name').value.trim(),
          rel: f('extra-relation').value,
          contact: f('extra-contact').value.replace(/\s/g, '')
        });
      var dup = rows('patient-record-list').filter(function (r) {
        return (
          r.c[1].toLowerCase() === name.toLowerCase() &&
          r.c[3].toLowerCase() === species.toLowerCase() &&
          (r.m.owner === s.email ||
            (r.m.people || []).some(function (p) {
              return people.some(function (q) {
                return q.contact === p.contact;
              });
            }))
        );
      })[0];
      if (dup && !$('#duplicate-confirm').checked) {
        $('#duplicate-text').textContent =
          'A ' +
          species.toLowerCase() +
          ' named ' +
          dup.c[1] +
          ' (Pet ID ' +
          dup.c[0] +
          ') is already linked to you or to one of the people you entered.';
        $('#duplicate-warning').hidden = false;
        $('#duplicate-error').hidden = false;
        $('#duplicate-confirm').focus();
        return;
      }
      $('#duplicate-warning').hidden = true;

      var pets = rows('patient-record-list'),
        pid = nextId('patient-record-list');
      pets.push({
        c: [pid, name, ownerName, species, '-'],
        m: {
          owner: s.email,
          breed: f('pet-breed').value.trim(),
          gender: g.value,
          birthday: f('pet-birthday').value,
          color: f('pet-color').value.trim(),
          appearance: f('pet-appearance').value.trim(),
          people: people
        }
      });
      saveRows('patient-record-list', pets);
      var cl = rows('client-list'),
        mine = cl.filter(function (r) {
          return r.c[3].toLowerCase() === s.email.toLowerCase();
        })[0];
      if (mine) mine.c[4] = (mine.c[4] ? mine.c[4] + ', ' : '') + name;
      else
        cl.push({
          c: [nextId('client-list') || 'C-2041', ownerName, contact, s.email, name],
          m: {}
        });
      saveRows('client-list', cl);
      saveAccounts(
        accounts().map(function (a) {
          if (a.email === s.email) {
            a.address = f('owner-address').value.trim();
            a.mobile = a.mobile || contact;
          }
          return a;
        })
      );

      $('#register-success').hidden = false;
      $('#register-actions').hidden = true;
      $('#register-success p:nth-of-type(2)').insertAdjacentHTML(
        'beforeend',
        ' <a href="portal-register-pet.html">Register another pet</a>.'
      );
      $$('input,select,textarea,button', form).forEach(function (x) {
        if (!x.closest('#register-success')) x.disabled = true;
      });
      $('#register-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function bookPage() {
    var form = $('#booking-form');
    if (!form) return;
    var pets = myPets(),
      saved = false;
    if (!pets.length) {
      $('#pet-choice').hidden = true;
      $('#pet-missing').hidden = true;
      $('#no-pets').hidden = false;
    } else {
      $('#pet-choice-list').innerHTML = pets
        .map(function (r) {
          return (
            '<label class="choice"><input type="radio" name="pet" value="' +
            esc(r.c[1]) +
            '" required aria-describedby="pet-error"><span class="choice__title">' +
            esc(r.c[1]) +
            '</span></label>'
          );
        })
        .join('');
      var want = new URLSearchParams(location.search).get('pet'),
        rb = $$('input[name="pet"]', form).filter(function (x) {
          return x.value === want;
        })[0];
      if (rb) rb.checked = true;
    }
    buildCalendar();
    form.addEventListener('submit', function () {
      setTimeout(function () {
        // runs after the page's own script has shown "Booking confirmed"
        if (saved || $('#booking-success').hidden) return;
        saved = true;
        var s = session(),
          all = rows('appointment-list'),
          pet = $('input[name="pet"]:checked', form).value,
          service = $('input[name="service"]:checked', form).value;
        all.push({
          c: [
            nextId('appointment-list'),
            $('#appt-date').value + ' ' + to24($('#appt-time').value),
            pet,
            s.name,
            service,
            'Reserved'
          ],
          m: { owner: s.email }
        });
        saveRows('appointment-list', all);
        toast('Appointment saved.');
      }, 0);
    });
  }

  /* Month calendar: choose any month of the current year; days fill up from stored bookings */
  function buildCalendar() {
    var cal = $('.calendar'),
      grid = cal && $('.calendar__grid', cal),
      title = $('#cal-title');
    if (!grid) return;
    var view = NOW.getMonth(),
      selected = null;
    title.insertAdjacentHTML(
      'afterend',
      '<div class="calendar__nav"><button type="button" class="btn btn--outline btn--small" id="cal-prev" aria-label="Previous month">&lsaquo;</button>' +
        '<select class="form-select" id="cal-month" aria-label="Choose a month of ' +
        YEAR +
        '">' +
        MONTHS.map(function (m, i) {
          return '<option value="' + i + '">' + m + ' ' + YEAR + '</option>';
        }).join('') +
        '</select><button type="button" class="btn btn--outline btn--small" id="cal-next" aria-label="Next month">&rsaquo;</button></div>'
    );
    var sel = $('#cal-month'),
      prev = $('#cal-prev'),
      next = $('#cal-next');
    function draw() {
      Array.prototype.slice.call(grid.children).forEach(function (c) {
        if (!c.classList.contains('calendar__dow')) c.remove();
      });
      var html = '',
        blanks = new Date(YEAR, view, 1).getDay(),
        total = new Date(YEAR, view + 1, 0).getDate(),
        i;
      for (i = 0; i < blanks; i++) html += '<span aria-hidden="true"></span>';
      for (i = 1; i <= total; i++) {
        var id = YEAR + '-' + pad(view + 1) + '-' + pad(i),
          label = MONTHS[view] + ' ' + i + ', ' + YEAR,
          num = '<span class="calendar__num">' + i + '</span>';
        if (id < TODAY)
          html +=
            '<button type="button" class="calendar__day is-past" data-date="' +
            id +
            '" aria-disabled="true" aria-label="' +
            label +
            ', past">' +
            num +
            '</button>';
        else if (dayCount(id) >= LIMIT)
          html +=
            '<button type="button" class="calendar__day is-full" data-date="' +
            id +
            '" aria-disabled="true" aria-label="' +
            label +
            ', full">' +
            num +
            '<span class="calendar__flag">Full</span></button>';
        else
          html +=
            '<button type="button" class="calendar__day' +
            (id === selected ? ' is-selected' : '') +
            '" data-date="' +
            id +
            '" aria-pressed="' +
            (id === selected) +
            '" aria-label="' +
            label +
            '">' +
            num +
            '</button>';
      }
      grid.insertAdjacentHTML('beforeend', html);
      title.textContent = MONTHS[view] + ' ' + YEAR;
      sel.value = String(view);
      prev.disabled = view === 0;
      next.disabled = view === 11;
    }
    sel.addEventListener('change', function () {
      view = +sel.value;
      draw();
    });
    prev.addEventListener('click', function () {
      if (view > 0) view--;
      draw();
    });
    next.addEventListener('click', function () {
      if (view < 11) view++;
      draw();
    });
    window.PawSyncCal = {
      isFull: function (id) {
        return dayCount(id) >= LIMIT;
      },
      isClosed: function (id) {
        var notice = load('clinicClosure', null);
        return !!(notice && notice.date === id);
      },
      sync: function (id) {
        // called by the booking page when a date is chosen, typed, or suggested
        selected = id || null;
        if (id && id.slice(0, 4) === String(YEAR)) view = +id.slice(5, 7) - 1;
        draw();
      }
    };
    draw();
  }

  /* ---------- Staff system ---------- */
  function staffCommon() {
    var s = session(),
      side = $('.sidebar');
    if (side && s) {
      // The signed-in name + Log out now live at the bottom of the sidebar
      // (they used to repeat as "Clinic Staff" at the top of every panel).
      var nm = s.label || s.name || 'Clinic Staff',
        box = document.createElement('div');
      box.className = 'sidebar__user';
      box.innerHTML =
        '<span class="sidebar__avatar" aria-hidden="true">' +
        esc(String(nm).replace(/^Dr\.\s*/, '').charAt(0).toUpperCase()) +
        '</span><div class="sidebar__user-text"><p class="sidebar__user-name">' +
        esc(nm) +
        '</p><p class="sidebar__user-role">Signed in</p></div>' +
        '<button type="button" class="sidebar__logout">Log out</button>';
      $('.sidebar__logout', box).onclick = logout;
      side.appendChild(box);
    }
    var strip = $('.sidebar__list');
    if (strip) {
      var active = $('.is-active', strip);
      if (active && strip.scrollWidth > strip.clientWidth)
        strip.scrollLeft = Math.max(0, active.offsetLeft - 16);
      strip.addEventListener(
        'wheel',
        function (e) {
          if (strip.scrollWidth <= strip.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          e.preventDefault();
          strip.scrollLeft += e.deltaY;
        },
        { passive: false }
      );
    }
    addResetLink();
  }
  function isLow(r) {
    return +r.c[3] <= +r.c[4];
  }

  function vitalReadings() {
    return load('vitals', []);
  }
  function latestVital(wardId) {
    return vitalReadings()
      .filter(function (v) { return v.wardId === wardId; })
      .sort(function (a, b) { return b.recordedAt.localeCompare(a.recordedAt); })[0] || null;
  }
  function vitalsDue(ward) {
    var latest = latestVital(ward.c[0]);
    return !latest || latest.date !== TODAY;
  }
  function recordVitals(ward) {
    dialog(
      'Record vital signs for ' + ward.c[1],
      '<p>Readings are due once each day for each confined pet.</p>' +
        '<div class="form-group"><label class="form-group__label" for="vital-temperature">Temperature (&deg;C)</label><input class="form-input" type="number" id="vital-temperature" min="0.1" step="0.1" required></div>' +
        '<div class="form-group"><label class="form-group__label" for="vital-respiratory">Respiratory rate (breaths/min)</label><input class="form-input" type="number" id="vital-respiratory" min="1" step="1" required></div>' +
        '<div class="form-group"><label class="form-group__label" for="vital-heart">Heart rate (beats/min)</label><input class="form-input" type="number" id="vital-heart" min="1" step="1" required></div>' +
        '<p class="form-group__error" id="vital-error" hidden></p>',
      'Save readings',
      function (d) {
        var temp = Number($('#vital-temperature', d).value),
          respiratory = Number($('#vital-respiratory', d).value),
          heart = Number($('#vital-heart', d).value),
          error = $('#vital-error', d);
        if (![temp, respiratory, heart].every(function (v) { return Number.isFinite(v) && v > 0; })) {
          error.textContent = 'Enter a positive value for all three readings.';
          error.hidden = false;
          return false;
        }
        var readings = vitalReadings();
        readings.push({
          wardId: ward.c[0],
          pet: ward.c[1],
          date: TODAY,
          recordedAt: new Date().toISOString(),
          temperature: temp,
          respiratoryRate: respiratory,
          heartRate: heart
        });
        if (!save('vitals', readings)) return false;
        toast('Vital signs saved for ' + ward.c[1] + '.');
        document.dispatchEvent(new Event('pawsync:refresh-table'));
      }
    );
  }

  function seedVitals() {
    if (load('vitals', null) !== null) return;
    function at(wardId, pet, date, time, t, rr, hr) {
      return {
        wardId: wardId,
        pet: pet,
        date: date,
        recordedAt: new Date(date + 'T' + time + ':00').toISOString(),
        temperature: t,
        respiratoryRate: rr,
        heartRate: hr
      };
    }
    // Buddy is up to date today, Coco has her intake reading, Luna's first reading is still due.
    save('vitals', [
      at('W-020', 'Buddy', rel(-1), '08:00', 38.7, 24, 108),
      at('W-020', 'Buddy', rel(-1), '14:00', 38.9, 26, 112),
      at('W-020', 'Buddy', rel(-1), '20:00', 38.6, 22, 104),
      at('W-020', 'Buddy', TODAY, '08:00', 38.5, 22, 100),
      at('W-021', 'Coco', TODAY, '09:00', 39.6, 36, 148)
    ]);
  }
  // Wards (confined stays) that belong to a patient: same pet name and same client.
  function wardsForPatient(p) {
    var name = String(p.c[1]).toLowerCase(),
      client = String(p.c[2]).toLowerCase();
    return rows('confined-pet-list').filter(function (w) {
      return String(w.c[1]).toLowerCase() === name && String(w.c[2]).toLowerCase() === client;
    });
  }
  function vitalsForPatient(p) {
    var ids = wardsForPatient(p).map(function (w) { return w.c[0]; });
    return vitalReadings()
      .filter(function (v) { return ids.indexOf(v.wardId) !== -1; })
      .sort(function (a, b) { return b.recordedAt.localeCompare(a.recordedAt); });
  }
  // Patients that belong to a client (matched by client name).
  function patientsForClient(client) {
    var name = String(client.c[1]).toLowerCase();
    return rows('patient-record-list').filter(function (pt) {
      return String(pt.c[2]).toLowerCase() === name;
    });
  }
  function clientPatientLinks(client) {
    var list = patientsForClient(client);
    if (!list.length) return esc(client.c[4]);
    return list.map(function (pt) {
      return '<a class="patient-link" href="staff-patient-records.html#' + encodeURIComponent(pt.c[0]) +
        '" title="Open the record of ' + esc(pt.c[1]) + '"><strong>' + esc(pt.c[0]) + '</strong> ' + esc(pt.c[1]) + '</a>';
    }).join('<br>');
  }
  function vitalStamp(iso) {
    var d = new Date(iso);
    return (
      shortDate(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())) +
      ', ' + to12(pad(d.getHours()) + ':' + pad(d.getMinutes()))
    );
  }
  function vitalsPanel(p, editKey) {
    var wards = wardsForPatient(p),
      list = vitalsForPatient(p),
      html = '<div class="vitals-panel"><div class="vitals-panel__head"><h3 class="vitals-panel__title">Vital signs: ' +
        esc(p.c[1]) + '</h3>';
    if (wards.length) {
      html += '<button type="button" class="btn btn--secondary btn--small" data-v-add="' + esc(p.c[0]) + '">+ Add vital signs</button>';
    }
    html += '</div>';
    if (!list.length) {
      html += '<p class="text-muted">' + (wards.length
        ? 'No vital signs recorded yet for this stay.'
        : 'This pet is not currently confined. Vital signs are recorded for confined pets only (see Confined Pets).') + '</p></div>';
      return html;
    }
    html += '<table class="table vitals-table"><thead><tr>' +
      '<th scope="col">Date / Time</th><th scope="col">Temperature (&deg;C)</th>' +
      '<th scope="col">Resp. rate (breaths/min)</th><th scope="col">Heart rate (beats/min)</th>' +
      '<th scope="col">Actions</th></tr></thead><tbody>';
    list.forEach(function (v) {
      var key = v.wardId + '|' + v.recordedAt,
        label = esc(p.c[1]) + ' ' + esc(vitalStamp(v.recordedAt));
      if (key === editKey) {
        html += '<tr class="vitals-edit" data-vkey="' + esc(key) + '"><td>' + esc(vitalStamp(v.recordedAt)) + '</td>' +
          '<td><label class="sr-only" for="ve-t">Temperature for ' + label + '</label><input class="form-input" id="ve-t" type="number" min="0.1" step="0.1" value="' + esc(v.temperature) + '"></td>' +
          '<td><label class="sr-only" for="ve-r">Respiratory rate for ' + label + '</label><input class="form-input" id="ve-r" type="number" min="1" step="1" value="' + esc(v.respiratoryRate) + '"></td>' +
          '<td><label class="sr-only" for="ve-h">Heart rate for ' + label + '</label><input class="form-input" id="ve-h" type="number" min="1" step="1" value="' + esc(v.heartRate) + '"></td>' +
          '<td class="ps-actions"><button type="button" class="btn btn--primary btn--small" data-v-save="' + esc(key) + '">Save</button> ' +
          '<button type="button" class="btn btn--link btn--small" data-v-cancel>Cancel</button></td></tr>' +
          '<tr class="vitals-edit-msg"><td colspan="5"><p class="form-group__error" id="ve-error" role="alert" hidden></p></td></tr>';
      } else {
        html += '<tr><td>' + esc(vitalStamp(v.recordedAt)) + (v.updatedAt ? ' <span class="text-muted">(edited)</span>' : '') + '</td>' +
          '<td class="table__num">' + esc(v.temperature) + '</td><td class="table__num">' + esc(v.respiratoryRate) +
          '</td><td class="table__num">' + esc(v.heartRate) + '</td>' +
          '<td class="ps-actions"><button type="button" class="btn btn--link btn--small" data-v-edit="' + esc(key) +
          '" aria-label="Edit vital signs for ' + label + '">Edit</button></td></tr>';
      }
    });
    return html + '</tbody></table></div>';
  }

  function staffDashboard() {
    var tb = $('#today-appointments');
    if (!tb) return;
    var today = rows('appointment-list')
      .filter(function (r) {
        return r.c[1].slice(0, 10) === TODAY && !/cancel/i.test(r.c[5]);
      })
      .sort(function (a, b) {
        var order = { Emergency: 0, Priority: 1, Normal: 2 };
        var aOrder = order[a.m.priority] == null ? 2 : order[a.m.priority];
        var bOrder = order[b.m.priority] == null ? 2 : order[b.m.priority];
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.c[1] < b.c[1] ? -1 : 1;
      });
    tb.innerHTML =
      today
        .map(function (r) {
          return (
            '<tr><td>' +
            to12(r.c[1].slice(11)) +
            '</td><td>' +
            esc(r.c[2]) +
            '</td><td>' +
            esc(r.c[3]) +
            '</td><td>' +
            esc(r.c[4]) +
            '</td><td>' +
            badge(r.c[5]) +
            '</td><td>' +
            badge(r.m.priority || 'Normal') +
            '</td><td>' +
            esc(r.m.bookingType || 'Scheduled') +
            '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="7">No appointments today.</td></tr>';

    var confined = rows('confined-pet-list'),
      due = confined.filter(vitalsDue),
      low = rows('inventory-list').filter(isLow),
      expiring = rows('inventory-list').filter(function (r) {
        var d = r.c[6];
        return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= TODAY && d <= addDays(TODAY, 30);
      }),
      urgent = today.filter(function (r) { return /^(Emergency|Priority)$/i.test(r.m.priority || ''); }),
      sales = rows('invoice-list').filter(function (r) {
        return r.c[2] === TODAY && /^paid$/i.test(r.c[4]);
      }).reduce(function (sum, r) { return sum + money(r.c[3]); }, 0);

    $('#metric-appointments').textContent = today.length;
    $('#metric-confined').textContent = confined.length;
    $('#metric-low-stock').textContent = low.length;
    $('#metric-urgent').textContent = urgent.length;
    $('#metric-vitals').textContent = due.length;
    $('#metric-sales').textContent = 'PHP ' + peso(sales);
    $('#metric-expiring').textContent = expiring.length;

    var notices = $('#dashboard-notices'),
      notice = load('clinicClosure', null),
      html = '';
    if (notice && notice.date >= TODAY) {
      html += '<div class="alert alert--warning"><p class="alert__title">Clinic closure scheduled</p><p>' +
        longDate(notice.date) + ': ' + esc(notice.message) + '</p></div>';
    }
    html += due.length
      ? '<div class="alert alert--warning"><p class="alert__title">Vitals due today</p><p>' +
        due.map(function (r) { return esc(r.c[1]); }).join(', ') +
        '</p><a href="staff-confined-pets.html">Record confined-pet vitals</a></div>'
      : '<div class="alert alert--info"><p class="alert__title">Vitals up to date</p><p>All confined pets have a reading for today.</p></div>';
    if (expiring.length) {
      html += '<div class="alert alert--warning"><p class="alert__title">Items expiring in the next 30 days</p><ul>' +
        expiring.map(function (r) {
          return '<li>' + esc(r.c[1]) + ' - ' + longDate(r.c[6]) + '</li>';
        }).join('') + '</ul></div>';
    }
    if (low.length) {
      html += '<div class="alert alert--warning"><p class="alert__title">Low-stock items</p><p>' +
        low.map(function (r) { return esc(r.c[1]); }).join(', ') + '</p></div>';
    }
    notices.innerHTML = html;
  }

  function staffTablePage() {
    var tb = $('main tbody[id]'),
      fs = $('.staff-entry');
    if (!tb || !fs || tb.id === 'today-appointments') return;
    var id = tb.id,
      table = tb.closest('table'),
      head = $('thead tr', table),
      ths = $$('th', head),
      fields = $$('input,select', fs).filter(function (f) { return !f.hasAttribute('data-meta-only'); }),
      metaFields = $$('[data-meta-only]', fs),
      editing = -1,
      openPatients = {},
      editVitalKey = null,
      expandable = id === 'patient-record-list' || id === 'confined-pet-list';
    var idCol = /id|invoice/i.test(ths[0].textContent);
    if (id === 'confined-pet-list') {
      head.insertAdjacentHTML('beforeend', '<th scope="col">Latest vital signs</th><th scope="col">Vitals due</th>');
    }
    head.insertAdjacentHTML('beforeend', '<th scope="col">Actions</th>');
    var intro = $('.text-muted');
    if (intro)
      intro.innerHTML = intro.innerHTML.replace(
        'This static demo does not submit or save entered values.',
        'Entries are saved in this browser only (prototype).'
      );
    var help = $('.form-group__help', fs);
    if (help)
      help.textContent =
        'Saved in this browser only. Edit or delete rows from the table.';
    if (id === 'appointment-list') {
      var st = $('select', fs);
      st.insertAdjacentHTML('afterbegin', '<option>Reserved</option>');
      st.selectedIndex = 1;
    }
    fields.forEach(function (f) {
      f.insertAdjacentHTML('afterend', '<p class="form-group__error" hidden></p>');
    });
    fs.insertAdjacentHTML(
      'beforeend',
      '<div class="form-actions"><button type="button" class="btn btn--primary" data-save>Save entry</button><button type="button" class="btn btn--outline" data-clear>Clear</button></div>'
    );
    // Search box (placeholder inside the bar) with the Export button on its right
    $('.table-wrap', tb.closest('section')).insertAdjacentHTML(
      'beforebegin',
      '<div class="list-toolbar">' +
        '<div class="search-field">' +
        '<svg class="search-field__icon icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<label class="sr-only" for="ps-search">Search this list</label>' +
        '<input class="form-input" type="search" id="ps-search" placeholder="Search this list" autocomplete="off">' +
        '</div>' +
        '<button type="button" class="btn btn--outline btn--small" id="ps-export">' +
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/></svg>Export CSV</button>' +
        '</div>'
    );
    var saveBtn = $('[data-save]', fs),
      search = $('#ps-search');
    $('#ps-export').onclick = function () {
      var headers = ths.map(function (th) { return th.textContent.trim(); }),
        data = rows(id).map(function (r) {
          if (id === 'appointment-list') return r.c.concat(r.m.priority || 'Normal', r.m.bookingType || 'Scheduled');
          if (id === 'confined-pet-list') {
            var vital = latestVital(r.c[0]);
            return r.c.concat(
              vital
                ? vital.temperature + ' °C / ' + vital.respiratoryRate + ' resp / ' + vital.heartRate + ' HR'
                : 'No reading today',
              vitalsDue(r) ? 'Due today' : 'Recorded today'
            );
          }
          if (id === 'client-list') {
            var owned = patientsForClient(r).map(function (pt) { return pt.c[0] + ' ' + pt.c[1]; });
            return r.c.slice(0, 4).concat(owned.length ? owned.join('; ') : r.c[4]);
          }
          return r.c;
        });
      if (id === 'confined-pet-list') headers = headers.concat('Latest vital signs', 'Vitals due');
      downloadCSV(
        'pawsync-' + id.replace(/-list$/, '') + '-' + TODAY + '.csv',
        headers,
        data
      );
    };

    function err(f, msg) {
      var e = f.nextElementSibling;
      e.textContent = msg || '';
      e.hidden = !msg;
      if (msg) f.setAttribute('aria-invalid', 'true');
      else f.removeAttribute('aria-invalid');
    }
    function draw() {
      var q = search.value.toLowerCase();
      tb.innerHTML =
        rows(id)
          .map(function (r, i) {
            if (q && r.c.join(' ').toLowerCase().indexOf(q) < 0) return '';
            var cells = r.c.slice();
            if (id === 'appointment-list') {
              cells.push(r.m.priority || 'Normal', r.m.bookingType || 'Scheduled');
            }
            if (id === 'confined-pet-list') {
              var vital = latestVital(r.c[0]);
              cells.push(
                vital
                  ? vital.temperature + ' °C / ' + vital.respiratoryRate + ' resp / ' + vital.heartRate + ' HR'
                  : 'No reading today',
                vitalsDue(r) ? 'Due today' : 'Recorded today'
              );
            }
            var isPatient = expandable,
              open = isPatient && openPatients[r.c[0]];
            return (
              '<tr' + (isPatient ? ' class="row-expandable' + (open ? ' is-open' : '') + '" data-patient="' + esc(r.c[0]) + '"' : '') + '>' +
              cells
                .map(function (v, j) {
                  var th = ths[j],
                    cell = th && /status/i.test(th.textContent) ? badge(v) : esc(v);
                  if (id === 'inventory-list' && j === 3 && isLow(r))
                    cell += ' ' + badge('Low stock');
                  if (id === 'confined-pet-list' && j === 6 && vitalsDue(r)) cell = badge('Due today');
                  if (id === 'client-list' && j === 4) cell = clientPatientLinks(r);
                  if (isPatient && j === 0)
                    cell = '<button type="button" class="row-toggle" data-toggle="' + esc(r.c[0]) +
                      '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="vitals-' + esc(r.c[0]) +
                      '" aria-label="' + (open ? 'Hide' : 'Show') + ' vital signs for ' + esc(r.c[1]) + '">' +
                      '<svg class="icon row-toggle__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>' +
                      '<span>' + cell + '</span></button>';
                  return (
                    '<td' +
                    (th && th.classList.contains('table__num') ? ' class="table__num"' : '') +
                    '>' +
                    cell +
                    '</td>'
                  );
                })
                .join('') +
              '<td class="ps-actions">' +
              (id === 'confined-pet-list'
                ? '<button type="button" class="btn btn--secondary btn--small" data-vitals="' + i + '">Record vitals</button> '
                : '') +
              '<button type="button" class="btn btn--link btn--small" data-edit="' +
              i +
              '">Edit</button> <button type="button" class="btn btn--link btn--small" data-del="' +
              i +
              '">Delete</button></td></tr>' +
              (open
                ? '<tr class="row-detail" id="vitals-' + esc(r.c[0]) + '"><td colspan="' + (ths.length + 1 + (id === 'confined-pet-list' ? 2 : 0)) + '">' + vitalsPanel(r, editVitalKey) + '</td></tr>'
                : '')
            );
          })
          .join('') ||
        '<tr><td colspan="' + (ths.length + 1 + (id === 'confined-pet-list' ? 2 : 0)) + '">No entries found.</td></tr>';
    }
    function clearForm() {
      fields.forEach(function (f) {
        if (f.tagName === 'SELECT') f.selectedIndex = id === 'appointment-list' ? 1 : 0;
        else f.value = '';
        err(f);
      });
      editing = -1;
      metaFields.forEach(function (f) { f.selectedIndex = 0; });
      saveBtn.textContent = 'Save entry';
      var n = idCol ? nextId(id) : '';
      if (n) fields[0].value = n;
    }
    saveBtn.onclick = function () {
      var vals = [],
        ok = true,
        all = rows(id);
      fields.forEach(function (f, j) {
        var v = f.value.trim(),
          msg = '';
        if (!v && !f.hasAttribute('data-optional')) msg = 'This field is required.';
        else if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v))
          msg = 'Enter a valid email, like name@example.com.';
        else if (f.type === 'tel' && !/^[0-9 +()\-]{7,}$/.test(v))
          msg = 'Enter a valid phone number.';
        else if (f.type === 'number' && (isNaN(+v) || +v < 0))
          msg = 'Enter a number that is 0 or higher.';
        else if (
          j === 0 &&
          idCol &&
          all.some(function (r, i) {
            return i !== editing && r.c[0].toLowerCase() === v.toLowerCase();
          })
        )
          msg = 'This ID is already used.';
        if (f.type === 'datetime-local') v = v.replace('T', ' ');
        if (f.type === 'number' && f.step === '0.01' && !msg)
          v = (+v).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        if (id === 'appointment-list' && j === 1 && !msg) {
          var d = v.slice(0, 10),
            old = editing >= 0 ? all[editing].c[1].slice(0, 10) : '',
            closure = load('clinicClosure', null);
          if (d < TODAY && !/cancel/i.test(fields[5].value))
            msg = 'Appointments must be scheduled for today or a future date.';
          else if (closure && closure.date === d && !/cancel/i.test(fields[5].value))
            msg = longDate(d) + ' is a clinic closure date. Choose another date or cancel the appointment.';
          else if (d !== old && dayCount(d) >= LIMIT && !/cancel/i.test(fields[5].value))
            msg =
              longDate(d) + ' has reached the ' + LIMIT + '-patient limit.' +
              ' Pick another date' +
              (nextOpen(d) ? ' (next open: ' + shortDate(nextOpen(d)) + ').' : '.');
        }
        err(f, msg);
        if (msg) ok = false;
        vals.push(v);
      });
      if (!ok) {
        var bad = $('[aria-invalid="true"]', fs);
        if (bad) bad.focus();
        return;
      }
      var metadata = {};
      if (id === 'appointment-list') {
        metadata.priority = $('#appointment-priority').value;
        metadata.bookingType = $('#appointment-source').value;
      }
      if (editing >= 0) {
        all[editing].c = vals;
        all[editing].m = Object.assign({}, all[editing].m || {}, metadata);
      }
      else {
        var row = { c: vals, m: metadata };
        if (NEWEST_FIRST[id]) all.unshift(row);
        else all.push(row);
      }
      if (!saveRows(id, all)) return;
      toast(editing >= 0 ? 'Entry updated.' : 'Entry saved.');
      clearForm();
      draw();
      document.dispatchEvent(new Event('pawsync:refresh-dashboard'));
    };
    $('[data-clear]', fs).onclick = clearForm;
    search.addEventListener('input', draw);
    if (expandable) {
      // Click a patient row (or its arrow) to show or hide that pet's vital signs.
      tb.addEventListener('click', function (e) {
        var toggle = e.target.closest('[data-toggle]'),
          row = e.target.closest('tr.row-expandable'),
          vEdit = e.target.closest('[data-v-edit]'),
          vSave = e.target.closest('[data-v-save]'),
          vCancel = e.target.closest('[data-v-cancel]'),
          vAdd = e.target.closest('[data-v-add]');
        if (vEdit) {
          editVitalKey = vEdit.dataset.vEdit;
          draw();
          var first = $('#ve-t', tb);
          if (first) first.focus();
          return;
        }
        if (vCancel) {
          editVitalKey = null;
          draw();
          return;
        }
        if (vSave) {
          var key = vSave.dataset.vSave,
            t = Number($('#ve-t', tb).value),
            rr = Number($('#ve-r', tb).value),
            hr = Number($('#ve-h', tb).value),
            msg = $('#ve-error', tb);
          if (![t, rr, hr].every(function (n) { return Number.isFinite(n) && n > 0; })) {
            msg.textContent = 'Enter a positive value for temperature, respiratory rate, and heart rate.';
            msg.hidden = false;
            return;
          }
          var all = vitalReadings(),
            hit = all.filter(function (v) { return v.wardId + '|' + v.recordedAt === key; })[0];
          if (!hit) {
            msg.textContent = 'This reading could not be found. Close and reopen the row to try again.';
            msg.hidden = false;
            return;
          }
          hit.temperature = t;
          hit.respiratoryRate = rr;
          hit.heartRate = hr;
          hit.updatedAt = new Date().toISOString();
          if (!save('vitals', all)) return;
          editVitalKey = null;
          toast('Vital signs updated.');
          draw();
          document.dispatchEvent(new Event('pawsync:refresh-dashboard'));
          return;
        }
        if (vAdd) {
          var pat = rows(id).filter(function (r) { return r.c[0] === vAdd.dataset.vAdd; })[0],
            wards = pat ? wardsForPatient(pat) : [];
          if (wards.length) recordVitals(wards[wards.length - 1]);
          return;
        }
        // Ignore clicks on other buttons, links and fields inside the row or panel
        if (e.target.closest('.row-detail')) return;
        if (!toggle && e.target.closest('button, a, input, select, label')) return;
        if (!row) return;
        var pid = row.dataset.patient;
        if (openPatients[pid]) {
          delete openPatients[pid];
          editVitalKey = null;
        } else {
          openPatients[pid] = true;
        }
        draw();
        var again = $('[data-toggle="' + pid + '"]', tb);
        if (again && toggle) again.focus();
      });
    }
    document.addEventListener('pawsync:refresh-table', draw);
    tb.addEventListener('click', function (e) {
      var vitalButton = e.target.closest('[data-vitals]'),
        ed = e.target.closest('[data-edit]'),
        del = e.target.closest('[data-del]'),
        all = rows(id);
      if (vitalButton) {
        recordVitals(all[+vitalButton.dataset.vitals]);
        return;
      }
      if (ed) {
        editing = +ed.dataset.edit;
        var r = all[editing];
        fields.forEach(function (f, j) {
          var v = r.c[j];
          if (f.type === 'datetime-local') v = v.replace(' ', 'T');
          if (f.type === 'number') v = v.replace(/,/g, '');
          if (
            f.tagName === 'SELECT' &&
            !$$('option', f).some(function (o) {
              return o.textContent === v;
            })
          )
            f.insertAdjacentHTML('beforeend', '<option>' + esc(v) + '</option>');
          f.value = v;
          err(f);
        });
        metaFields.forEach(function (f) {
          var key = f.id === 'appointment-priority' ? 'priority' : 'bookingType';
          var value = r.m[key] || f.options[0].textContent;
          f.value = value;
        });
        saveBtn.textContent = 'Update entry';
        fs.closest('details').open = true;
        fields[0].focus();
        fs.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (del && confirm('Delete this entry?')) {
        var index = +del.dataset.del,
          deleted = all[index],
          inventoryBeforeDelete = null;
        if (id === 'invoice-list' && deleted.m && deleted.m.items && deleted.m.items.length) {
          var inventoryAfterDelete = rows('inventory-list');
          inventoryBeforeDelete = JSON.parse(JSON.stringify(inventoryAfterDelete));
          deleted.m.items.forEach(function (item) {
            var stock = inventoryAfterDelete.filter(function (r) { return r.c[0] === item.id; })[0];
            if (stock) stock.c[3] = String((Number(stock.c[3]) || 0) + Number(item.quantity || 0));
          });
          if (!saveRows('inventory-list', inventoryAfterDelete)) return;
        }
        all.splice(index, 1);
        if (!saveRows(id, all)) {
          if (inventoryBeforeDelete) saveRows('inventory-list', inventoryBeforeDelete);
          return;
        }
        toast('Entry deleted.');
        draw();
        document.dispatchEvent(new Event('pawsync:refresh-dashboard'));
      }
    });
    clearForm();
    if (id === 'patient-record-list' && location.hash) {
      var want = decodeURIComponent(location.hash.slice(1));
      if (rows(id).some(function (r) { return r.c[0] === want; })) openPatients[want] = true;
    }
    draw();
    if (id === 'patient-record-list' && location.hash) {
      var target = $('tr[data-patient="' + decodeURIComponent(location.hash.slice(1)) + '"]', tb);
      if (target) {
        target.scrollIntoView({ block: 'center' });
        target.classList.add('row-flash');
      }
    }
  }

  function billBuilderPage() {
    var form = $('#bill-builder-form');
    if (!form) return;
    var clientSel = $('#bill-client'),
      petInput = $('#bill-pet'),
      serviceSel = $('#bill-service'),
      itemSel = $('#bill-item'),
      quantity = $('#bill-quantity'),
      paymentSel = $('#bill-payment'),
      note = $('#bill-stock-note'),
      totalLabel = $('#bill-total'),
      saveButton = $('button[type="submit"]', form),
      clientAccounts = accounts();

    clientAccounts.forEach(function (account) {
      var option = document.createElement('option');
      option.value = account.email;
      option.textContent = account.name + ' (' + account.email + ')';
      clientSel.appendChild(option);
    });

    function syncItems() {
      var current = itemSel.value;
      itemSel.innerHTML = '<option value="">No inventory item</option>';
      rows('inventory-list').forEach(function (r) {
        var option = document.createElement('option');
        option.value = r.c[0];
        option.dataset.price = String(money(r.c[5]));
        option.dataset.stock = String(Number(r.c[3]) || 0);
        option.textContent = r.c[1] + ' - PHP ' + peso(money(r.c[5])) +
          ' (' + (Number(r.c[3]) || 0) + ' available)';
        option.disabled = money(r.c[5]) <= 0;
        itemSel.appendChild(option);
      });
      if (current) itemSel.value = current;
    }

    function updateTotal() {
      var serviceOption = serviceSel.options[serviceSel.selectedIndex],
        servicePrice = Number(serviceOption && serviceOption.dataset.price) || 0,
        itemOption = itemSel.options[itemSel.selectedIndex],
        stock = Number(itemOption && itemOption.dataset.stock) || 0,
        price = Number(itemOption && itemOption.dataset.price) || 0,
        count = Number(quantity.value) || 0,
        hasItem = !!itemSel.value,
        validStock = !hasItem || (count > 0 && count <= stock);
      quantity.disabled = !hasItem;
      saveButton.disabled = !validStock;
      note.textContent = !hasItem
        ? 'Select an item to see its current stock and price.'
        : stock === 0
          ? 'This item is out of stock.'
          : validStock
            ? stock + ' available at PHP ' + peso(price) + ' each.'
            : 'Only ' + stock + ' item(s) are available. Reduce the quantity to continue.';
      totalLabel.textContent = validStock
        ? 'Total: PHP ' + peso(servicePrice + (hasItem ? price * count : 0))
        : 'Total: —';
    }

    syncItems();
    itemSel.addEventListener('change', updateTotal);
    quantity.addEventListener('input', updateTotal);
    serviceSel.addEventListener('change', updateTotal);
    form.addEventListener('reset', function () {
      window.setTimeout(updateTotal, 0);
    });
    updateTotal();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = clientSel.value,
        account = clientAccounts.filter(function (a) { return a.email === email; })[0],
        serviceOption = serviceSel.options[serviceSel.selectedIndex],
        service = serviceSel.value,
        servicePrice = Number(serviceOption && serviceOption.dataset.price),
        inventory = rows('inventory-list'),
        item = inventory.filter(function (r) { return r.c[0] === itemSel.value; })[0] || null,
        count = item ? Number(quantity.value) : 0,
        paymentMethod = paymentSel.value;
      if (!account || !petInput.value.trim() || !service || !paymentMethod ||
          !Number.isFinite(servicePrice) || servicePrice < 0) {
        toast('Complete the client, pet, service, and payment method fields.', 'err');
        return;
      }
      if (item && (!Number.isInteger(count) || count < 1 || count > Number(item.c[3]))) {
        toast('The selected item does not have enough stock.', 'err');
        updateTotal();
        return;
      }
      var oldInventory = JSON.parse(JSON.stringify(inventory)),
        invoices = rows('invoice-list'),
        total = servicePrice + (item ? money(item.c[5]) * count : 0),
        items = item ? [{ id: item.c[0], name: item.c[1], quantity: count, unitPrice: money(item.c[5]) }] : [],
        invoice = {
          c: [nextId('invoice-list'), account.name + ' / ' + petInput.value.trim(), TODAY, peso(total), 'Paid'],
          m: { owner: email, pet: petInput.value.trim(), service: service, items: items, paymentMethod: paymentMethod }
        };
      if (item) {
        item.c[3] = String(Number(item.c[3]) - count);
        if (!saveRows('inventory-list', inventory)) return;
      }
      invoices.unshift(invoice);
      if (!saveRows('invoice-list', invoices)) {
        if (item) saveRows('inventory-list', oldInventory);
        return;
      }
      toast('Bill ' + invoice.c[0] + ' saved. Inventory was updated if an item was included.');
      form.reset();
      syncItems();
      updateTotal();
      document.dispatchEvent(new Event('pawsync:refresh-table'));
      document.dispatchEvent(new Event('pawsync:refresh-dashboard'));
    });
  }

  function closureNoticePage() {
    var form = $('#closure-form');
    if (!form) return;
    var dateInput = $('#closure-date'),
      messageInput = $('#closure-message'),
      current = $('#closure-current'),
      clearButton = $('#clear-closure');
    dateInput.min = TODAY;

    function render() {
      var notice = load('clinicClosure', null);
      current.textContent = notice
        ? 'Current notice: ' + longDate(notice.date) + ' - ' + notice.message
        : 'No closure notice is currently posted.';
      if (notice) {
        dateInput.value = notice.date;
        messageInput.value = notice.message;
      } else {
        form.reset();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var date = dateInput.value,
        message = messageInput.value.trim();
      if (!date || date < TODAY || !message) {
        toast('Choose today or a future date and enter a notice.', 'err');
        return;
      }
      var scheduled = rows('appointment-list').filter(function (r) {
        return r.c[1].slice(0, 10) === date && !/cancel/i.test(r.c[5]);
      });
      if (scheduled.length && !confirm('There are ' + scheduled.length + ' scheduled appointment(s) on this date. Post the closure notice anyway?')) return;
      if (!save('clinicClosure', { date: date, message: message })) return;
      toast('Clinic closure notice saved and posted.');
      render();
    });
    clearButton.addEventListener('click', function () {
      if (!load('clinicClosure', null)) {
        toast('There is no closure notice to remove.', 'err');
        return;
      }
      if (!confirm('Remove the clinic closure notice?')) return;
      if (!save('clinicClosure', null)) return;
      form.reset();
      current.textContent = 'No closure notice is currently posted.';
      toast('Clinic closure notice removed.');
    });
    render();
  }

  /* ---------- Export (CSV and print) ---------- */
  function csvCell(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function downloadCSV(name, headers, data) {
    var lines = [headers].concat(data).map(function (r) {
      return r.map(csvCell).join(',');
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    }); // BOM so Excel reads it correctly
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
    toast('Downloaded ' + name);
  }
  function money(v) {
    return parseFloat(String(v).replace(/,/g, '')) || 0;
  }
  function peso(n) {
    return n.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  function buildReport(type, month) {
    // month: '' = whole year, otherwise '01'..'12'
    var ym = month ? YEAR + '-' + month : String(YEAR),
      inRange = function (d) {
        return String(d).indexOf(ym) === 0;
      },
      pick = function (id, col) {
        return rows(id).filter(function (r) {
          return !col && col !== 0 ? true : inRange(r.c[col]);
        });
      },
      r;
    if (type === 'sales') {
      r = pick('invoice-list', 2);
      var paid = 0,
        owed = 0;
      r.forEach(function (x) {
        if (/^paid$/i.test(x.c[4])) paid += money(x.c[3]);
        else owed += money(x.c[3]);
      });
      return {
        title: 'Sales summary',
        headers: ['Invoice', 'Customer / Pet', 'Date', 'Total (PHP)', 'Status'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary:
          'Invoices: ' +
          r.length +
          ' | Paid: PHP ' +
          peso(paid) +
          ' | Unpaid or partial: PHP ' +
          peso(owed) +
          ' | Grand total: PHP ' +
          peso(paid + owed)
      };
    }
    if (type === 'appointments') {
      r = pick('appointment-list', 1);
      var by = {};
      r.forEach(function (x) {
        by[x.c[5]] = (by[x.c[5]] || 0) + 1;
      });
      return {
        title: 'Appointment summary',
        headers: ['ID', 'Date and time', 'Patient', 'Client', 'Service', 'Status'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary:
          'Appointments: ' +
          r.length +
          (r.length
            ? ' | ' +
              Object.keys(by)
                .map(function (k) {
                  return k + ': ' + by[k];
                })
                .join(', ')
            : '')
      };
    }
    if (type === 'inventory') {
      r = rows('inventory-list').filter(isLow);
      return {
        title: 'Inventory reorder list',
        headers: ['Item ID', 'Item', 'Category', 'On hand', 'Reorder level', 'Unit price (PHP)', 'Expiration date'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary: 'Items at or below the reorder level: ' + r.length
      };
    }
    if (type === 'patients') {
      r = rows('patient-record-list');
      return {
        title: 'Patient list',
        headers: ['Pet ID', 'Pet', 'Client', 'Species', 'Last visit'],
        rows: r.map(function (x) {
          return x.c;
        }),
        summary: 'Patients on record: ' + r.length
      };
    }
    r = rows('client-list');
    return {
      title: 'Client list',
      headers: ['Client ID', 'Name', 'Contact', 'Email', 'Pets'],
      rows: r.map(function (x) {
        return x.c;
      }),
      summary: 'Clients on record: ' + r.length
    };
  }

  function reportExportPage() {
    var tb = $('#report-list'),
      host = tb && tb.closest('section');
    if (!host) return;
    host.insertAdjacentHTML(
      'afterend',
      '<section class="card ps-section" id="ps-report-area" aria-labelledby="ps-export-title"><h2 id="ps-export-title">Export a report (demo)</h2>' +
        '<p class="text-muted">Built from the data saved in this browser. Download it as a CSV file (opens in Excel) or print it / save it as PDF.</p>' +
        '<div class="ps-export-controls"><div class="form-group"><label class="form-group__label" for="ps-rep-type">Report</label><select class="form-select" id="ps-rep-type">' +
        '<option value="sales">Sales summary</option><option value="appointments">Appointment summary</option><option value="inventory">Inventory reorder list</option><option value="patients">Patient list</option><option value="clients">Client list</option></select></div>' +
        '<div class="form-group"><label class="form-group__label" for="ps-rep-month">Period (' +
        YEAR +
        ')</label><select class="form-select" id="ps-rep-month"><option value="">Whole year</option>' +
        MONTHS.map(function (m, i) {
          return '<option value="' + pad(i + 1) + '">' + m + '</option>';
        }).join('') +
        '</select></div></div>' +
        '<div class="ps-bar"><button type="button" class="btn btn--primary" id="ps-rep-csv">Download CSV</button><button type="button" class="btn btn--outline" id="ps-rep-print">Print / Save as PDF</button></div>' +
        '<div id="ps-rep-preview" class="ps-section" aria-live="polite"></div></section>'
    );
    var typeSel = $('#ps-rep-type'),
      monthSel = $('#ps-rep-month'),
      box = $('#ps-rep-preview');
    monthSel.value = pad(NOW.getMonth() + 1);
    function current() {
      return buildReport(
        typeSel.value,
        /^(patients|clients|inventory)$/.test(typeSel.value) ? '' : monthSel.value
      );
    }
    function draw() {
      monthSel.disabled = /^(patients|clients|inventory)$/.test(typeSel.value);
      var rep = current(),
        label =
          monthSel.disabled || !monthSel.value
            ? monthSel.disabled
              ? 'Current data'
              : 'Whole year ' + YEAR
            : MONTHS[+monthSel.value - 1] + ' ' + YEAR;
      box.innerHTML =
        '<h3>' +
        esc(rep.title) +
        ' - ' +
        esc(label) +
        '</h3><p class="text-muted">Generated ' +
        new Date().toLocaleString('en-PH') +
        '</p><p><strong>' +
        esc(rep.summary) +
        '</strong></p>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
        rep.headers
          .map(function (h) {
            return '<th scope="col">' + esc(h) + '</th>';
          })
          .join('') +
        '</tr></thead><tbody>' +
        (rep.rows.length
          ? rep.rows
              .map(function (r) {
                return (
                  '<tr>' +
                  r
                    .map(function (v) {
                      return '<td>' + esc(v) + '</td>';
                    })
                    .join('') +
                  '</tr>'
                );
              })
              .join('')
          : '<tr><td colspan="' +
            rep.headers.length +
            '">No records for this period.</td></tr>') +
        '</tbody></table></div>';
    }
    typeSel.addEventListener('change', draw);
    monthSel.addEventListener('change', draw);
    $('#ps-rep-csv').onclick = function () {
      var rep = current();
      downloadCSV(
        'pawsync-' +
          typeSel.value +
          '-' +
          (monthSel.disabled || !monthSel.value ? YEAR : YEAR + '-' + monthSel.value) +
          '.csv',
        rep.headers,
        rep.rows
      );
    };
    $('#ps-rep-print').onclick = function () {
      document.body.classList.add('ps-print-report');
      window.print();
    };
    window.addEventListener('afterprint', function () {
      document.body.classList.remove('ps-print-report');
    });
    draw();
  }

  /* ---------- Sticky header helpers ---------- */
  function stickyHelpers() {
    function measure() {
      var el =
        $('.site-header') ||
        $('.portal-header') ||
        (window.innerWidth >= 1024 ? $('.topbar') : $('.sidebar'));
      document.documentElement.style.setProperty(
        '--header-h',
        (el ? Math.ceil(el.getBoundingClientRect().height) : 0) + 'px'
      );
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    var links = $$('.nav__link[href^="#"]'),
      targets = links
        .map(function (a) {
          return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
        })
        .filter(function (x) {
          return x.el;
        });
    if (targets.length < 2) return;
    function spy() {
      var line =
          (parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
            10
          ) || 0) + 24,
        cur = targets[0];
      targets.forEach(function (x) {
        if (x.el.getBoundingClientRect().top <= line) cur = x;
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
        cur = targets[targets.length - 1];
      links.forEach(function (a) {
        a.classList.toggle('is-active', a === cur.a);
        if (a === cur.a) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------- Scroll reveal: boxes fade/rise into view ---------- */
  function revealOnScroll() {
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    var items = $$('.card, .table-wrap, .list-toolbar, .workspace-tile');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var t = e.target;
            t.classList.add('is-in');
            io.unobserve(t);
            // drop the helper classes afterwards so hover effects work normally
            setTimeout(function () {
              t.classList.remove('reveal', 'is-in');
            }, 800);
          }
        });
      },
      { threshold: 0.08 }
    );
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ---------- Start ---------- */
  function init() {
    if (!guard()) return;
    var s = session();
    stickyHelpers();
    publicPages();
    loginPage();
    if (s && /^portal/.test(page)) {
      portalCommon();
      dashboardPage();
      myPetsPage();
      myAppointmentsPage();
      myBillsFilesPage();
      registerPetPage();
      bookPage();
    }
    if (s && /^staff/.test(page)) {
      staffCommon();
      seedVitals();
      staffDashboard();
      staffTablePage();
      billBuilderPage();
      closureNoticePage();
      reportExportPage();
    }
    revealOnScroll();
  }
  window.PawSync = { reset: resetDemo, logout: logout };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();