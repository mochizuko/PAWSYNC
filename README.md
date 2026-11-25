# PawSync

PawSync is a responsive veterinary clinic website and demo management portal for pet owners and clinic staff. It provides public information, appointment booking, pet and billing views for owners, and operational dashboards for staff.

## Features

- Public clinic, service, emergency, and contact pages
- Pet owner registration and login
- Pet registration and appointment booking
- Owner dashboard, appointment, pet, and billing views
- Staff dashboards for clients, appointments, patients, billing, inventory, reports, and users
- Browser-based demo data persistence with `localStorage`

## Getting Started

PawSync is a static HTML, CSS, and JavaScript project. No build tools or backend are required.

1. Clone or download the repository.
2. Open `PAWSYNC/html/index.html` in a browser.

For a more reliable local setup, serve the project with Python:

```bash
cd PAWSYNC
python -m http.server 8000
```

Then visit `http://localhost:8000/html/index.html`.

## Demo Accounts

Use the matching role option on the login page.

| Role | Email or mobile number | Password |
| --- | --- | --- |
| Pet owner | `trishia@example.com` | `pawsync123` |
| Clinic staff | `clinicstaff@gmail.com` | `12345678` |

Accounts and prototype records are stored in the browser. Clearing site data will reset the demo. This project is a front-end prototype and should not be used with real passwords or sensitive medical data.

## Project Structure

```text
PAWSYNC/
├── Assets/  # Images and brand assets
├── css/     # Base, component, and page styles
├── html/    # Public, owner, and staff pages
└── JS/      # Authentication and demo data logic
```

## Team

- **Lance Amwel Tumanan** — Team Leader
- **Andrea Kaye Nieves**
- **Lysa Joy Pido**
- **Trishia Anne Maralit**
- **Grace Dela Cruz**
