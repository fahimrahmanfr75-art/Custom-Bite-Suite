# Mandatory Manifest

Upload these paths to GitHub. They are the source of truth for rebuilding the project on another device.

## Keep In Git

- `.github/`
- `artifacts/`
- `assets/`
- `scripts/`
- `src/`
- `__tests__/`
- `.gitattributes`
- `.gitignore`
- `app.json`
- `App.tsx`
- `babel.config.js`
- `build_release_apk.bat`
- `eslint.config.js`
- `index.ts`
- `jest.config.js`
- `package.json`
- `package-lock.json`
- `run_emulator.bat`
- `tsconfig.json`

## Conditionally Keep

- `QWEN.md`
  Keep only if it is intentional project documentation. It is currently empty and can be removed.

## Notes

- `node_modules/` is not mandatory because it is recreated by `npm install`.
- `android/` is currently treated as generated because the repository already ignores it and this project can regenerate it from Expo prebuild.
- If you later introduce manual native Android edits that are not reproducible from Expo config/plugins, you must stop ignoring `android/` and move it into the mandatory set.
