# Story Hub backend

Standalone Node.js/Express API for Story Hub. MongoDB stores the complete story
documents; ImageKit stores cover images, page artwork, narration, and ambient audio.

## Setup

1. Copy `.env.example` to `.env`.
2. Add a newly rotated MongoDB Atlas connection string to `MONGODB_URI`.
3. Add a long random `ADMIN_API_KEY`.
4. From the ImageKit dashboard, add both `IMAGEKIT_PUBLIC_KEY` and
   `IMAGEKIT_PRIVATE_KEY`. Never put the private key in the Expo app.
5. Install and prepare the data:

   ```powershell
   npm install
   npm run migrate:frontend
   npm run seed
   npm run dev
   ```

The API listens on `http://0.0.0.0:4000` by default.

## Media migration

The first seed uses local `/media/...` URLs and the backend serves the existing
`assets` folder during development. Confirm every referenced file exists:

```powershell
npm run media:upload -- --dry-run
```

After adding the ImageKit private key, upload every cover/image/audio file and
replace the MongoDB URLs automatically:

```powershell
npm run media:upload
```

## API

- `GET /api/health`
- `GET /api/stories`
- `GET /api/stories/:id`
- `POST /api/stories` (requires `x-admin-key`)
- `PUT /api/stories/:id` (requires `x-admin-key`)
- `DELETE /api/stories/:id` (requires `x-admin-key`)
- `POST /api/media/upload` (multipart `file`, requires `x-admin-key`)
- `GET /api/media/imagekit-auth` (requires `x-admin-key`)

Filtering is available with `search`, `featured`, `category`, `genre`, and
`language` query parameters.

## Expo connection

Set `EXPO_PUBLIC_STORY_API_URL` in the frontend environment. Examples:

- Android emulator: `http://10.0.2.2:4000/api`
- iOS simulator/web: `http://localhost:4000/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:4000/api`

The app keeps its bundled stories as an offline fallback if the API is unavailable.
