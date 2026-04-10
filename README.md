# Trip frontend (React + TypeScript + Vite)

## Environment variables

1. Copy the example file and edit locally (never commit real `.env` secrets):

   ```sh
   cp .env.example .env
   ```

2. Set **`VITE_BACKEND_API`** in `.env` to the base URL of your backend API **including the `/api` segment** (same value the app uses in `src/api/client.ts`).

   | Example value | When to use |
   |---------------|-------------|
   | `http://127.0.0.1:8000/api` | Local Django (or other backend) on your machine |
   | `https://your-ngrok-host.example/api` | Temporary tunnel (use your own host, not a shared secret) |
   | `/api` | Browser calls same-origin `/api/...` (e.g. Vite dev proxy per `.env.development`, or production nginx) |

   `.env.example` sets `VITE_BACKEND_API` to a **non-URL placeholder** (`your-backend-base-url-including-/api`); replace it with a real URL or path for your setup.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


## Deploy to Cloud Run

```sh
gcloud builds submit \
  --tag gcr.io/gogotrip-senior-project/tripbot-frontend

gcloud run deploy tripbot-frontend \
  --image gcr.io/gogotrip-senior-project/tripbot-frontend \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 80
```

After deploy, open the **Service URL** that `gcloud` prints (example: `https://tripbot-frontend-294086862024.asia-southeast1.run.app` in the browser). Do not run that URL as a shell command.

The production image sets `VITE_BACKEND_API=/api` and **nginx** proxies `/api/` to `tripbot-backend` on Cloud Run. If your backend URL changes, update `proxy_pass` and `Host` in `nginx.conf` and rebuild.
