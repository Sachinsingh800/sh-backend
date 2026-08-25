# Story Hub backend

Standalone Node.js/Express API for Story Hub. MongoDB is the source of truth for
story documents, and ImageKit stores every cover, illustration, narration track,
and ambient-audio file. The backend does not serve media from local disk.

## Setup

1. Copy `.env.example` to `.env`.
2. Add the MongoDB Atlas connection string to `MONGODB_URI`.
3. Add a long random `ADMIN_API_KEY`.
4. Add the ImageKit public and private keys from the ImageKit dashboard.
5. Install and start the API:

   ```powershell
   npm install
   npm run dev
   ```

The API listens on `http://0.0.0.0:4000` by default. Verify it locally with:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4000/api/stories
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

New media is uploaded directly to ImageKit through `POST /api/media/upload`.
Story filters are available with `search`, `featured`, `category`, `genre`, and
`language` query parameters.

## Expo connection

Set `EXPO_PUBLIC_STORY_API_URL` in the Expo project's `.env`:

- Web or iOS simulator: `http://localhost:4000/api`
- Android emulator: `http://10.0.2.2:4000/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:4000/api`

For a physical phone, run Expo with `npx expo start --clear --lan` and keep the
phone and computer on the same network. Expo's `--tunnel` option exposes Metro
only; it does not expose this backend's port 4000. To test through the internet,
deploy the backend or create a separate HTTPS tunnel for port 4000 and use that
public `/api` URL.
