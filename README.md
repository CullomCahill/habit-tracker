# Habit Tracker

A lightweight PWA for tracking daily habits. No account required — just open it and start logging.

## Features

- Add one or more habits on first launch, with the ability to add more any time via settings
- Log each habit as done or skipped, once per day
- Navigate back up to 7 days to fill in missed entries
- Weekly log view showing a full 7-day grid across all habits
- Daily push notification reminder at 7 pm (optional)
- Installable as a PWA on iOS and Android

## Stack

- Vanilla HTML/CSS/JS — no framework, no build step
- Netlify for hosting and serverless functions
- Web Push API for daily reminders (requires VAPID keys configured in Netlify environment variables)
- `localStorage` for data persistence on device

## Local development

```bash
npx serve .
```

Open `http://localhost:3000` in your browser.

## Deployment

Deploy to Netlify by connecting the repo. Set the following environment variables in the Netlify dashboard:

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_SUBJECT` | Contact email, e.g. `mailto:you@example.com` |

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

The scheduled function (`push-notify`) runs daily at 11 pm UTC (7 pm EDT) and sends a push notification to subscribed users who have unlogged habits.

## Data & privacy

All habit and log data is stored in `localStorage` on the user's device. Nothing is sent to a server except push notification subscriptions (endpoint + keys only). On iOS, Safari may clear localStorage after 7 days of inactivity — a backend sync option is on the roadmap to address this.
