# LeapBlocks Windows Installer

This folder contains NSIS customization for the LeapBlocks Windows installer.

## Build

Run from the repository root:

```powershell
bun run dist:win
```

This builds the Electron app and creates an NSIS installer in `out/`.

## Custom installer artwork (optional)

To add custom branding to the installer, place these files in this folder:

- `app-icon.ico` — App icon used for the installer and uninstaller (256x256 recommended)
- `installer-header.bmp` — NSIS wizard header image (150 x 57 px, 24-bit BMP)
- `installer-sidebar.bmp` — NSIS sidebar image (164 x 314 px, 24-bit BMP)

Then add these lines to `electron-builder.yml` under the `nsis:` section:

```yaml
  installerIcon: installer/app-icon.ico
  uninstallerIcon: installer/app-icon.ico
  installerHeader: installer/installer-header.bmp
  installerSidebar: installer/installer-sidebar.bmp
```

Without these files, the installer will use the default NSIS styling and the app icon from `public/icon.png`.
