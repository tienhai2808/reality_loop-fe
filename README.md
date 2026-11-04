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

All educational content comes from backend APIs. Pronunciation scoring, recording, and AI/TTS are not part of this experience.

### Writing System Learning Progress

Writing Systems shows backend totals and a small per-character progress indicator for the current LearningProfile. Progress is separate for each profile; browsing another catalog language does not change your profile or record progress against it.

`NotStarted` means no saved progress, `Learning` means studying has started, and `Completed` means the learner explicitly marked the character as learned through—not memorized or mastered. Open a character to explicitly Study, Complete, or Restart learning. Studying a completed character keeps it completed; Restart is a separate action. Viewing characters and playing audio never record progress automatically.

Actions use the progress DTO's server version, independently of the profile version. Conflicts and unknown network results reload the affected character before another explicit action; they never blindly repeat a mutation. Overview totals are refreshed from the backend, and catalog/progress pagination remain independent.

### Writing System Practice

Choose **Practice** in a writing-system header to recognize characters and select their readings. Sessions support 1–20 questions (default 10); the backend generates questions, keeps unanswered readings hidden, grades submissions, and completes sessions automatically.

Saved sessions have stable URLs at `/learn/practice/{profileId}/{sessionId}`. Reloading restores the server snapshot and resumes at the first unanswered question. **Practice history** (`/learn/practice/history`) supports status/writing-system filters, multiple unfinished sessions, and opaque `before` cursor pagination. Completed and ended sessions retain submitted-answer review; unanswered questions never reveal their correct readings.

Answers and explicit **End practice** actions share one session-level lock and use the latest server session version. Conflicts and uncertain outcomes reconcile through GET, without resubmitting mutations. Creation has no idempotency key: an uncertain start checks history before another explicit start. Simply leaving never abandons a session.

Practice is independent of manually tracked Writing System Learning Progress and never updates it. No AI, audio clues, or client-side grading are used.

### Handwriting Practice

Choose **Handwriting** in a writing-system header (`/learn/handwriting?system=<code>`). Only published templates are selectable; the current backend seed includes Hiragana あ, お, ぬ, and め. Systems without templates show an unavailable-content state.

Select up to the server policy's character limit, including repeated characters. Each position has a square mouse/touch/stylus canvas, optional ordered reference guide, Undo, and Clear. Pointer Events capture ordered normalized `{ x, y }` points in `[0,1]`; canvas resizing and display pixel density do not change saved coordinates. Drawing requires a pointer-capable input method. Input limits come from the published policy; oversized strokes are visibly rejected rather than silently truncated.

**Check handwriting** submits only template IDs and stroke arrays for synchronous server evaluation. Results use the returned pass/fail, geometry match score, general issues, and stroke-level feedback. Editing invalidates the displayed result. Uncertain submissions check recent history without automatically repeating POST; template conflicts preserve drawings and require explicit template confirmation/reselection.

History (`/learn/handwriting/{profileId}/history`) filters by writing system/result and uses opaque `before` cursors. Saved attempts (`/learn/handwriting/{profileId}/attempts/{attemptId}`) retain their original profile scope, points, feedback, and algorithm version. Replay shows the exact saved stroke points; unpublished references do not block saved drawings. Template catalogs use `after` cursors.

Stroke-source attribution, revision, and license links come from the backend and remain visible in practice and review. Handwriting has no AI/OCR, image uploads, browser-side grading, or automatic Learning Progress changes.

## Vocabulary

Open **Learn → Vocabulary** (`/learn/vocabulary`) to browse the current LearningProfile's target language. Requests use the exact explanation-language tag for meanings, without stripping region or script subtags. Part-of-speech filters run on the backend and are preserved in the URL; lists use opaque `after` cursors and a Load more action.

Open a word at `/learn/vocabulary/{entryCode}` for its stored reading, all published senses, and usage notes. Entry metadata and senses load in parallel. Each sense keeps the backend's translation and fallback locale independently; missing translations remain visible without invented meanings. Changing the explanation language reloads meanings while retaining the word metadata.

Audio uses the shared on-demand pronunciation player only when the backend supplies a valid HTTPS URL. Initial vocabulary content has no audio. Vocabulary is read-only: there is no vocabulary progress, saving/favorites, review, exercises, search, or AI dependency.

## Default Validation

For normal development tasks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Automated unit/integration/E2E tests are run only when explicitly requested or during dedicated QA/release work.

