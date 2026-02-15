
# Wanderlust — Travel Listing & Booking Platform 🛏️

Comprehensive, production-ready Node.js + Express application for listing, booking, and managing travel properties. Built with MongoDB (Atlas), Cloudinary for media, and a simple SMTP mailer for account and booking communications.

**Table of Contents**
- **Overview**: What this app does
- **Features**: User & admin capabilities
- **Tech Stack**: Libraries and services used
- **Folder Structure**: Quick project map
- **Setup**: Local environment and running the app
- **Environment Variables**: Required values and examples
- **Screenshots**: Where to add and how to reference screenshots
- **Deployment**: Deployment notes
- **Contributing**: How to help
- **License & Contact**

**Overview**

Wanderlust is a full-stack travel listing and booking system that supports:
- Public listing discovery and search
- Authenticated user sign-up, profile management, and bookings
- Admin dashboard for managing listings, bookings, users, feedback and reviews
- Image uploads (Cloudinary) and email notifications (SMTP)

The app is designed to be simple to run locally and to be deployed to common Node hosting providers.

**Features**

- **Public**: Browse, search, and view listing details, blog pages, contact form.
- **Users**: Signup/login, update profile, create/manage bookings, leave feedback and reviews.
- **Admins**: Create/update/delete listings, manage users, view bookings, moderate feedback.
- **Media**: Images stored on Cloudinary.
- **Notifications**: SMTP email support for password reset and contact responses.
- **Error handling**: Centralized error utilities and user-friendly error pages.

**Tech Stack**

- Node.js + Express
- MongoDB Atlas (Mongoose models in `/models`)
- Cloudinary (image hosting)
- EJS templating (views)
- Nodemailer (mailSender)
- Frontend assets in `/public` (CSS and client JS)

**Folder Structure (important files)**

- `app.js` — main Express application entry
- `admin.js` — top-level admin routes
- `controllers/` — request handlers for listings, users, bookings, etc.
- `models/` — Mongoose schemas
- `views/` — EJS templates and layouts
- `public/` — static assets (CSS, JS, images)
- `utils/` and `middlewares/` — helpers and middleware
- `.env.example` — environment variables reference

**Setup / Run Locally**

1. Clone the repo:

```bash
git clone <repo-url> wanderlust
cd wanderlust
```

2. Install dependencies:

```bash
npm install
```

3. Create an environment file by copying the example:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in the values (see Environment Variables below).

4. Start the application:

- If the project has a `dev` script (recommended for development):

```bash
npm run dev
```

- Or start the production entry:

```bash
node app.js
```

5. Open your browser to `http://localhost:8080` (or the `PORT` you configured).

**Environment Variables**

Create `.env` (do not commit this file). Required variables:

- `ATLAS_DB_TOKEN` — MongoDB connection string (MongoDB Atlas recommended)
- `SECRET` — session / cookie secret
- `CLOUD_NAME` — Cloudinary cloud name
- `CLOUD_API_KEY` — Cloudinary API key
- `CLOUD_API_SECRET` — Cloudinary API secret
- `PORT` — server port (default 8080)
- `MAIL_HOST` — SMTP host (e.g., smtp.gmail.com)
- `MAIL_USER` — SMTP user/email
- `MAIL_PASS` — SMTP password or app password
- `ADMIN_EMAIL` — administrator notification email

Use the `.env.example` file as a reference. Keep secrets out of version control.

**Screenshots**

Include screenshots to help reviewers and maintainers. Recommended images directory:

`public/assets/screenshots/`

Place images with clear names, then reference them in this README. Example markdown to add where you want the screenshot shown:

```markdown
![Homepage]
<img width="1910" height="865" alt="image" src="https://github.com/user-attachments/assets/2aca1d6c-b473-4322-9f95-35b880fa409d" />

![Listing Details](/public/assets/screenshots/listing-details.png)
```

Recommended screenshots to capture and commit (suggested filenames):

- `homepage.png` — site listing/search page
- `listing-details.png` — single listing page with images
- `booking.png` — booking form / confirmation
- `admin-dashboard.png` — admin management view
- `profile.png` — user profile / bookings list

Add an optional short caption below each image when embedding them.

**Development Notes**

- The app uses EJS views located in `views/` with partials in `views/includes/` and layouts in `views/layouts/`.
- Controllers are organized per feature in `controllers/` and follow a common pattern of loading models from `models/`.
- Error handling utilities are in `utils/` and `expressError.js`.

**Deployment**

General steps for deployment:

1. Provision a Node-compatible host (Heroku, Render, Railway, DigitalOcean App Platform, etc.).
2. Set environment variables on the host (do not push `.env`).
3. Ensure MongoDB Atlas connection string allows your host IP / network or uses SRV.
4. Configure any build/start commands the host requires (e.g., `npm start` or `node app.js`).
5. If using Cloudinary, confirm production credentials and set `CLOUD_*` env vars.

Optional: configure HTTPS/SSL at the platform, and consider using process manager (PM2) for self-hosting.

**Testing**

This repository does not include automated tests by default. To add tests, consider using Jest or Mocha + Supertest for route and controller tests.

**Contributing**

- Fork the repo, create feature branches, and open pull requests with focused changes.
- Follow existing code style for controllers, models and view templates.
- For UI changes, include before/after screenshots in `public/assets/screenshots/` and reference them in this README.

**Security & Privacy**

- Never commit `.env` or secrets. Use `.env.example` as a template.
- Rotate SMTP and Cloudinary keys if they are ever exposed.

**Contact & Maintainers**

For bugs or support, open an issue in the repository. For urgent matters, contact the admin email configured in the `.env`.

**License**

See the `LICENSE` file in the repository for license details.

**Future Roadmap**

- [ ] Payment Integration: Adding Stripe for actual booking transactions.

- [ ] Real-time Chat: Implementing Socket.io for guest-to-host communication.

- [ ] Geospatial Search: Using $near queries to find listings based on user's current location.


---

If you'd like, I can:
- Add example screenshots into `public/assets/screenshots/` with placeholders,
- Add `npm run dev` script and a small `Procfile` for deployment,
- Or generate a quick Postman collection or API docs for the controllers.

Tell me which follow-up you'd like next.
