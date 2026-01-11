# my-tripmate-wepapp

Trip planning & voting web application

---

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js / API
- State & UI: Custom components
- Tooling: Vite, Git, npm

---

## Project Structure
```
my-tripmate-wepapp
├─ frontend
│  - App.tsx
│  - assets
│    - login-bg.jpg
│  - components
│    - Header.tsx
│    - MemberProgressList.tsx
│    - TripAnalytics.tsx
│    - TripProgress.tsx
│  - config
│    - app.config.ts
│  - constants
│    - provinces.ts
│  - data
│    - mockData.ts
│  - index.css
│  - index.tsx
│  - pages
│    - Dashboard.tsx
│    - HomePage.tsx
│    - LoginPage.tsx
│    - scripts
│    - SummaryPage.tsx
│    - VotePage
│    - VotePage.tsx
│  - services
│    - api.ts
│  - types
│    - analytics.ts
│    - app.types.ts
│  - utils
│    - analytics.ts
│    - helpers.ts
│    - safeStorage.ts
│  - vite-env.d.ts

├─ backend
│  - node_modules
│    - @apidevtools
│    - @cspotcode
│    - @isaacs
│    - @jridgewell
│    - @jsdevtools
│    - @pkgjs
│    - @scarf
│    - @tsconfig
│    - @types
│    - accepts
│    - acorn
│    - acorn-walk
│    - agent-base
│    - ansi-regex
│    - ansi-styles
│    - arg
│    - argparse
│    - aws-ssl-profiles
│    - balanced-match
│    - base64-js
│    - base64url
│    - bignumber.js
│    - body-parser
│    - brace-expansion
│    - buffer-equal-constant-time
│    - bytes
│    - call-bind-apply-helpers
│    - call-bound
│    - call-me-maybe
│    - color-convert
│    - color-name
│    - commander
│    - concat-map
│    - content-disposition
│    - content-type
│    - cookie
│    - cookie-signature
│    - create-require
│    - cross-spawn
│    - data-uri-to-buffer
│    - debug
│    - denque
│    - depd
│    - diff
│    - doctrine
│    - dotenv
│    - dunder-proto
│    - eastasianwidth
│    - ecdsa-sig-formatter
│    - ee-first
│    - emoji-regex
│    - encodeurl
│    - es-define-property
│    - es-errors
│    - es-object-atoms
│    - escape-html
│    - esutils
│    - etag
│    - express
│    - express-session
│    - extend
│    - fetch-blob
│    - finalhandler
│    - foreground-child
│    - formdata-polyfill
│    - forwarded
│    - fresh
│    - fs.realpath
│    - function-bind
│    - gaxios
│    - gcp-metadata
│    - generate-function
│    - get-intrinsic
│    - get-proto
│    - glob
│    - google-auth-library
│    - google-logging-utils
│    - gopd
│    - gtoken
│    - has-symbols
│    - hasown
│    - http-errors
│    - https-proxy-agent
│    - iconv-lite
│    - inflight
│    - inherits
│    - ipaddr.js
│    - is-fullwidth-code-point
│    - is-promise
│    - is-property
│    - isexe
│    - jackspeak
│    - js-yaml
│    - json-bigint
│    - jwa
│    - jws
│    - lodash.get
│    - lodash.isequal
│    - lodash.mergewith
│    - long
│    - lru-cache
│    - lru.min
│    - make-error
│    - math-intrinsics
│    - media-typer
│    - merge-descriptors
│    - mime-db
│    - mime-types
│    - minimatch
│    - minipass
│    - ms
│    - mysql2
│    - named-placeholders
│    - negotiator
│    - node-domexception
│    - node-fetch
│    - oauth
│    - object-inspect
│    - on-finished
│    - on-headers
│    - once
│    - openapi-types
│    - package-json-from-dist
│    - parseurl
│    - passport
│    - passport-google-oauth20
│    - passport-oauth2
│    - passport-strategy
│    - path-is-absolute
│    - path-key
│    - path-scurry
│    - path-to-regexp
│    - pause
│    - proxy-addr
│    - qs
│    - random-bytes
│    - range-parser
│    - raw-body
│    - rimraf
│    - router
│    - safe-buffer
│    - safer-buffer
│    - send
│    - seq-queue
│    - serve-static
│    - setprototypeof
│    - shebang-command
│    - shebang-regex
│    - side-channel
│    - side-channel-list
│    - side-channel-map
│    - side-channel-weakmap
│    - signal-exit
│    - sqlstring
│    - statuses
│    - string-width
│    - string-width-cjs
│    - strip-ansi
│    - strip-ansi-cjs
│    - swagger-jsdoc
│    - swagger-parser
│    - swagger-ui-dist
│    - swagger-ui-express
│    - toidentifier
│    - ts-node
│    - type-is
│    - typescript
│    - uid-safe
│    - uid2
│    - undici-types
│    - unpipe
│    - utils-merge
│    - uuid
│    - v8-compile-cache-lib
│    - validator
│    - vary
│    - web-streams-polyfill
│    - which
│    - wrap-ansi
│    - wrap-ansi-cjs
│    - wrappy
│    - yaml
│    - yn
│    - z-schema
│  - package-lock.json
│  - package.json
│  - src
│    - app.ts
│    - config
│    - controllers
│    - express.d.ts
│    - middleware
│    - models
│    - routes
│    - server.ts
│    - services
│    - test
│  - tsconfig.json

```

---

## Frontend Scripts
```bash
npm run dev # vite
npm run build # vite build
npm run preview # vite preview
```

---

## Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

---

## Main Features
- Trip voting system
- Member progress tracking
- Budget & place selection
- Summary & analytics
- Owner / member role separation

---

## Author
My TripMate Team