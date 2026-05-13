# Meet

[Root Ventures](https://root.vc) video conferencing app built on [Daily.co](https://daily.co). Fork and customize for your own use.

**Live:** [daily.root.vc](https://daily.root.vc)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Setup

1. Create an account on [Daily.co](https://daily.co) and pick a subdomain
2. Create rooms in the [Daily.co Dashboard](https://dashboard.daily.co), each prefixed with `meet-` (e.g., `meet-lee`, `meet-kane`)
3. Copy `.env.example` to `.env` and set your Daily subdomain:
   ```
   VITE_DAILY_SUBDOMAIN=your-subdomain
   ```
4. Visit `http://localhost:3000/lee` to join the `meet-lee` room

## Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_DAILY_SUBDOMAIN`
   - `VITE_COMPANY_NAME`
   - `VITE_COMPANY_URL`
4. (Optional) Add custom domain in Settings → Domains

Vercel auto-detects Vite and deploys on every push.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DAILY_SUBDOMAIN` | Your Daily.co subdomain | (required) |
| `VITE_COMPANY_NAME` | Company name for title/meta | `Daily.co` |
| `VITE_COMPANY_URL` | Link target for logo | `https://daily.co` |
| `VITE_ASSET_PATH` | Path to custom assets | `.` |

### Room-Specific Config

Customize individual rooms with environment variables:

```
VITE_ROOM_WINE_TITLE=Wine Wednesday
VITE_ROOM_WINE_BACKGROUND=wine-bg.png
VITE_ROOM_WINE_HEADER=wine-header.png
```

This configures the room at `/wine` (which joins `meet-wine` on Daily).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

## Customization

### Styles

Edit `src/brand.css` for colors and theming. The app uses a CLI-inspired design with terminal prompt styling.

### Assets

Replace files in `public/`:
- `favicon.ico`
- `logo.png` (loading background)
- `logo-header.png` (header logo)
- `logo192.png`, `logo512.png` (PWA icons)

Or set `VITE_ASSET_PATH` to a URL hosting these files.

## Tech Stack

- [Vite](https://vite.dev) + [React 18](https://react.dev)
- [Daily.co](https://daily.co) for video
- [Vercel](https://vercel.com) for hosting

## References

- [Daily.co API Docs](https://docs.daily.co/reference)
- [Vite Documentation](https://vite.dev/guide/)
- [Vercel Documentation](https://vercel.com/docs)
