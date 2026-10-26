# Reality Loop Frontend

Reality Loop is a web-first language practice product for turning real-life intent into Japanese missions, Language Bugs, review, and recovered capability.

## Development

Install dependencies with pnpm only:

```bash
pnpm install
```

Run the local frontend:

```bash
pnpm dev
```

Default development hosts:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5285
```

Keep `localhost` consistent across the OAuth flow. Do not mix `localhost` and `127.0.0.1` unless the backend OAuth configuration explicitly supports it.

## Environment

Create a local `.env.local` when needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5285/api/v1
```

The frontend must not contain Google client secrets, JWT signing keys, database URLs, or backend private credentials.

## Authentication Setup

The frontend uses backend-owned OAuth 2.0 / OpenID Connect flows.

The SPA routes are:

```text
/sign-in
/auth/google/callback
/auth/microsoft/callback
/auth/facebook/callback
```

For local development, configure provider redirect URIs as:

```text
Google:
http://localhost:3000/auth/google/callback

Microsoft:
http://localhost:3000/auth/microsoft/callback

Facebook:
http://localhost:3000/auth/facebook/callback
```

The exact same Google URI must be present in Google Cloud Console as an Authorized Redirect URI.

For Microsoft, set `Authentication:Microsoft:RedirectUri` to `http://localhost:3000/auth/microsoft/callback`, and configure the Microsoft Entra App Registration redirect as platform `Web`, not SPA.

For Facebook, set `Authentication:Facebook:RedirectUri` to `http://localhost:3000/auth/facebook/callback`, and configure the Meta App Dashboard Valid OAuth Redirect URI to the same URL.

Provider credentials such as Microsoft client secrets and Facebook App ID/App Secret are backend-only. Do not add provider secrets to frontend environment variables.

The browser starts sign-in by calling one of:

```text
GET http://localhost:5285/api/v1/auth/google/authorize
GET http://localhost:5285/api/v1/auth/microsoft/authorize
GET http://localhost:5285/api/v1/auth/facebook/authorize
```

The callback page exchanges the returned `code` and `state` with the matching backend callback:

```text
POST http://localhost:5285/api/v1/auth/google/callback
POST http://localhost:5285/api/v1/auth/microsoft/callback
POST http://localhost:5285/api/v1/auth/facebook/callback
```

Access tokens are kept in memory only. Refresh tokens returned during the callback are immediately moved into a same-origin HttpOnly cookie by the frontend route handlers under `/api/auth/*`.

## Manual OAuth Verification

When automated authentication tests are run, provider OAuth should be mocked. Real provider OAuth should be verified manually when OAuth configuration changes:

1. Start the backend on `http://localhost:5285`.
2. Start the frontend on `http://localhost:3000`.
3. Confirm the backend and Google Console redirect URI is exactly `http://localhost:3000/auth/google/callback`.
4. Confirm the backend Microsoft redirect URI and Entra App Registration Web redirect URI are exactly `http://localhost:3000/auth/microsoft/callback`.
5. Confirm the backend Facebook redirect URI and Meta Valid OAuth Redirect URI are exactly `http://localhost:3000/auth/facebook/callback`.
6. Open `http://localhost:3000/sign-in`.
7. Continue with Google, Microsoft, or Facebook and confirm the callback returns to the app.
8. Reload the app and confirm the session restores.
9. Open `/settings/sessions` and confirm current-session logout returns to sign-in.

## AI Settings

Open **Settings → AI** (`/settings/ai`) to connect a provider: enter your API key, explicitly load models, select one model, and create the connection. A display name is optional.

Each connection uses exactly one model. Multiple connections for the same provider are supported. You can rename, enable/disable, replace a key, change a model, verify, or delete a connection later.

API keys stay in temporary form memory and are never stored in browser storage. Close the form to discard the entered key. If a create result cannot be confirmed, retry from the same open form to reuse its pending request. Deleting a Reality Loop connection does not revoke the key at the provider.

## Learning Profiles

After sign-in, users without a current learning profile are guided to `/onboarding` to create or select one. Manage profiles under **Settings → Learning** (`/settings/learning`).

You can keep one profile per target language and select one current profile. Creation and selection are separate: onboarding explicitly selects the newly created profile using `PUT /learning-profiles/current`; adding a language in Settings leaves your current selection unchanged. Target language is immutable after creation; other preferences remain editable.

Deleting the current profile leaves no current selection. Choose an existing profile or create a new one to continue. If profile creation has an unknown network result, refresh the profile list before trying again.

## Language Foundations

Open **Language Foundations** from the sidebar, user menu, or command palette (`/learn`). Browse the API-backed language catalog, or open **Writing systems** for your current Learning Profile (`/learn/writing-systems`). Catalog browsing doesn't change your profile.

The current profile's target language and exact explanation-language tag drive catalog requests and translated metadata. Select a writing system to explore its character chart, open a character for all available readings, and move between characters with Previous/Next or the left/right arrow keys. Links can preserve the language and system using `?language=<code>&system=<code>`.

Charts use backend coordinates, preserve gaps, and support additional pages. Target-language suggestions during profile creation also come from the catalog; native and explanation languages remain unrestricted by published content.

**Pronunciation** sits beside Writing Systems (`/learn/pronunciation`). It lists API-provided rules and loads the selected rule's explanation, usage note, and examples in parallel. Direct links use `?rule=<code>` with an optional catalog `language=<code>`. Rules use the current LearningProfile's target language and exact explanation locale; example text and transcription are displayed exactly as returned.

Kana chart cells and character readings share the same Play/Stop audio control as pronunciation examples. Playback uses only the exact public HTTPS URL returned by the backend, starts on demand, and stops the previous clip. Kana audio availability depends on backend initialization; environments returning null remain usable without audio. Pronunciation examples initially have no audio and never borrow a Kana clip to represent a word or sentence.

All educational content comes from backend APIs. Pronunciation scoring, exercises, progress, handwriting, stroke order, recording, and AI/TTS are not part of this experience.

## Default Validation

For normal development tasks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Automated unit/integration/E2E tests are run only when explicitly requested or during dedicated QA/release work.

