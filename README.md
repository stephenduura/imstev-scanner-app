# Imstev Hair & Skin Scanner App

An advanced, AI-powered mobile-responsive web application designed for hair care specialists and skincare businesses. The application allows clients to scan their hair or skin using their device's camera, receive professional dermatological insights using **OpenAI's Vision AI (`gpt-4o-mini`)**, and provides salon specialists with a dedicated dashboard to override recommendations and prescribe customized routines.

---

## 🚀 Key Features

### 👤 Member Portal (Authentication)
*   **Secure Auth Gate:** Fully operational signup, signin, and password recovery screens powered by **Supabase**.
*   **State Protection:** Unauthorized access is automatically intercepted and redirected to the login gate.
*   **Cloud Synchronization:** Scan histories and profile details are automatically synced to the user's Supabase cloud metadata, merging local guest history seamlessly upon login.

### 📸 Diagnostic Scanner
*   **Live Camera Context:** Dual-mode face mask guides for dermal skin and scalp scans.
*   **Local Image Upload:** Support for uploading high-resolution JPG/PNG diagnostic files.

### 🧠 OpenAI Vision AI Integration
*   **Dermatological Estimation:** Estimates hydration, pores, wrinkles, redness, pigmentation, hair curl pattern (1A–4C), porosity, and density directly from photo pixels using OpenAI.
*   **Automatic Fallback:** In the absence of an API key or network connection, the scanner triggers a fallback local simulation engine so the app never crashes.

### 💼 Specialist Dashboard
*   **Client Management Directory:** Searchable list of clients showing activity histories.
*   **Custom Prescriptions:** Specialists can write diagnostic advice and check off custom product recommendations.
*   **UI Alert Widget:** Clients see a customized specialist recommendation box on their welcome screen.

### 📈 Sparklines & Reminders
*   **Progress Visualization:** Weekly health metrics are plotted on beautiful dynamic SVG sparkline charts.
*   **Check-in Scheduler:** Exports a standard `.ics` file so clients can import weekly check-in reminders into Google, Apple, or Outlook Calendars.

---

## 🛠️ Tech Stack
*   **Frontend:** HTML5, Vanilla CSS3 (Custom Glassmorphism, animations, responsive grid), Vanilla JavaScript (ES Modules).
*   **Backend & DB:** Supabase Auth & Metadata Sync.
*   **AI Engine:** OpenAI Chat Completions Vision API (`gpt-4o-mini`).

---

## ⚙️ Setup & Configuration

1.  **Clone or Copy this Folder:**
    Ensure you copy this directory (`imstev hair and skin scan app/`) containing `index.html`, `app.js`, and its assets to your new repository location.
    
2.  **Configure Environment Variables:**
    Copy the template [.env.example](.env.example) to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file and insert your active API credentials:
    ```env
    # OpenAI API Key for Vision Scan Diagnostics
    OPENAI_API_KEY=sk-proj-yourActualOpenAIKey
    
    # Supabase Credentials
    SUPABASE_URL=https://your-project-id.supabase.co
    SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```

3.  **Run Locally:**
    Start a local static server inside this directory:
    *   **Python:** `python -m http.server 8085`
    *   **Node (http-server):** `npx http-server -p 8085`
    *   **IDE Extension:** Use VS Code's "Live Server" extension.

4.  **Open the App:**
    Navigate to `http://localhost:8085` in your browser.

---

## 🔒 Security & Best Practices
*   **Ignored Keys:** The [.gitignore](.gitignore) file is configured to ignore `.env` so that your private credentials are never pushed to GitHub.
*   **Exposed Example:** The template [.env.example](.env.example) is safely committed to show the configuration schema.
*   **Dynamic Loading:** Secrets are fetched asynchronously at browser runtime and never hardcoded in files.
