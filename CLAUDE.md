# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (web preview)
npm run build        # Production build → dist/
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type-check without emitting

# After any code change, deploy to Android:
npm run build && npx cap sync android
# Then open Android Studio: npx cap open android
```

There are no tests. TypeScript (`npx tsc --noEmit`) is the primary correctness check.

## Architecture

React 18 + TypeScript + Vite, packaged as an Android app via Capacitor 8. UI is shadcn/ui (Radix primitives) with Tailwind CSS. The app runs entirely offline on-device — no backend.

### Page flow

```
App.tsx
└── Index.tsx          ← sole page; orchestrates all state
    ├── Header.tsx     ← top bar with Reckon logo + nav (always visible)
    ├── WelcomeScreen  ← SerialInput form + pending-drafts dropdown
    └── InspectionForm ← full inspection UI (replaces WelcomeScreen)
```

`Index.tsx` holds the top-level state: `serialNumber`, `cabinetType`, `showInspectionForm`, draft-loading state, and the pending-drafts list. It passes `handleFormReset` as `onReset` to `InspectionForm`, and passes `onLogoClick` to `Header` (only active while the form is open) so the logo triggers the exit confirmation.

### InspectionForm sections

The form has five `InspectionItem[]` states driven by `cabinetType`:

| State | Section | Shown when |
|---|---|---|
| `cabinetItems` | 1. Armário | always |
| `shelfItems` | 2. Prateleiras | always |
| `controlModuleItems` | 3. Control Module | `cabinet-with-cm` only |
| `generalItems` | 4. Geral | always |
| `packagingItems` | 5. Embalagem | always (5.1/5.2 are Fase 2) |

Items with IDs `PK_F1` / `PK_F2` belong to a second inspection phase and are excluded from draft restoration and machine-report validation.

### Camera

`Camera.tsx` uses `navigator.mediaDevices.getUserMedia` (Web Camera API — **not** `@capacitor/camera`). Capture is 1920×1080 with a three-level fallback. Photos are JPEG with a 2 MB ceiling enforced via max 3 sequential `toDataURL` calls (quality 0.92 → 0.85 → 0.75). **Never call `canvas.toDataURL` more than 3 times on the same canvas, and never increase quality after a reduction** — both crash or blank-image on Android WebView.

### Output pipeline

`pdfUtils.ts` generates a ZIP per inspection containing:
- A main PDF (jsPDF + jspdf-autotable) with the checklist table
- One `.jpg` file per photo (raw blob, not wrapped in PDF)
- Machine report PDF if generated

On native Android, `nativeFileUtils.ts` saves the ZIP via `@capacitor/filesystem` with a four-directory fallback: `ExternalStorage → Documents → External → Data`.

### Draft system

Drafts are stored on-device as a folder `rascunho_SN_<sanitized>/` containing:
- `formulario.json` — written **last** as the atomic completion marker
- `<itemId>.jpg` / `<itemId>.mp4` for captured media
- `machineReport.pdf` if generated

`sanitizeForPath()` replaces non-alphanumeric chars with `_`, so the folder name may differ from the original serial number. `listAllDrafts()` scans all four directories to build the pending-drafts list shown on the welcome screen.

### Toast positioning (Android)

Sonner toasts are positioned above the Android nav bar via CSS in `index.css` targeting `[data-sonner-toaster]` and `[data-sonner-toast]` with `!important`. Do not add an `offset` prop to `<Sonner>` in `sonner.tsx` — it conflicts with the CSS approach.

### Android-specific constraints

- `env(safe-area-inset-bottom)` requires `viewport-fit=cover` in `index.html` (already set).
- The Capacitor app ID is `com.lovable.snapstore`; the Android project lives in `android/`.
- `isNativePlatform()` guards all filesystem and draft operations — they silently no-op in the browser.
