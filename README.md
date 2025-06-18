# Modelverse

**Chat with all your favorite AI models in one place.**

---



Modelverse is an **open‑source, multi‑model chat application** powered by [Convex](https://convex.dev), [TanStack Start](https://tanstack.com/start), open router and better-auth.  

Bring your own [OpenRouter](https://openrouter.ai) API key and instantly switch between GPT‑4o, Claude, Gemini 2.5, Grok 3, DeepSeek and many more. All from a single chat UI.


---

## ✨ Features

* 🔌 **Plug‑and‑play model picker** 
* 🌐 **Web search toggle** 
* 🧑‍💻 **GitHub OAuth** via `@convex-dev/better-auth`
* 🔒 **API‑key encryption** 
* 📡 **Real‑time streaming** with `@convex-dev/persistent-text-streaming`
* 🔄 **SSR** 
* 🛠 **TypeScript everywhere** – strict types from DB → server → client


## Local Dev

```bash
# 1. Clone
$ git clone https://github.com/zwgnr/modelverse.git
$ cd modelverse

# 2. Install
$ pnpm i # 

# 3. Configure environment variables (see table below)

# 4. Dev servers (frontend + Convex)
$ pnpm dev
```

http://localhost:3000 will open automatically and sign in with GitHub.  The first time you run a chat, the app will ask for your **personal OpenRouter API key** and store it encrypted in Convex.

### Required Environment Variables

| Name                   | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `VITE_CONVEX_URL`      | Convex deployment URL (e.g. `https://happy‑yorkie‑123.convex.cloud`)                  |
| `VITE_CONVEX_SITE_URL` | The public origin that hosts your frontend (used by Better Auth redirects)            |
| `OPEN_ROUTER_API_KEY`  | OpenRouter key for your own account
| `BETTER_AUTH_SECRET`   | 32+‑byte secret for `better-auth` JWT signing                                         |
| `ENCRYPTION_KEY`       | 32‑byte **hex‑encoded** master key used for AES‑256‑GCM encryption of user secrets    |
| `ENCRYPTION_ID`        | This can be anything and is in place for easier future key roations                   |
| `GITHUB_CLIENT_ID`     | OAuth app/client ID from GitHub                                                       |
| `GITHUB_CLIENT_SECRET` | Corresponding client secret                                                           |


## 🔐 Security & Key Management

Modelverse follows the **principle of least privilege**.  The server alone can decrypt user API keys;
no plaintext secrets ever touch the client.

1. **Client → Server** – the user types or pastes their OpenRouter key in the settings modal.  The key is sent over HTTPS to a Convex **action**.
2. **AES‑256‑GCM Encryption** – the action calls `encrypt(plaintext, ENCRYPTION_KEY)` (see `/convex/lib/encryption.ts`).  The IV is prepended, ciphertext is base64‑encoded.
3. **Convex Database** – encrypted blob + keyId are stored.
4. **Runtime Usage** – when the user makes a chat request, the server **decrypts** the key on‑the‑fly and forwards it to OpenRouter.  The plaintext is *never* returned to the browser.

### Why not Local Storage?

Storing provider keys unencrypted in `localStorage` (or `sessionStorage`, `IndexedDB`, etc.) leaves them
vulnerable to:

* **XSS** – any successful script injection instantly exfiltrates a user’s key.
* **Multi‑device use** – your key is locked to one browser; you have to paste it again on each device.
* **Data loss** – clearing cache or using private tabs wipes the key.

By contrast, **server‑side encryption** means:

* Only authenticated requests can access the ciphertext.
* The master key lives exclusively in your Convex deployment’s environment; it is not bundled with the client.
* Rotating keys is straightforward: bump `keyId`, re‑encrypt in a migration script, restart.

## 🧑‍🤝‍🧑 Contributing

Contributions are welcome!

## 📝 License

Distributed under the **MIT License**.  See [`LICENSE`](LICENSE) for more information.

---

> ❤️ built with love and coffee!
