!macro customHeader
  !define MUI_FINISHPAGE_NOAUTOCLOSE
  !define MUI_WELCOMEPAGE_TITLE "LeapLab"
  !define MUI_WELCOMEPAGE_TEXT "Welcome to LeapLab Setup.$\\r$\\n$\\r$\\nThis wizard will guide you through the installation of LeapLab."
  !define MUI_FINISHPAGE_TITLE "LeapLab Installation Complete"
  !define MUI_FINISHPAGE_TEXT "LeapLab has been installed on your computer.$\\r$\\n$\\r$\\nClick Finish to close this wizard."
!macroend

!macro customInit
  SetShellVarContext current
!macroend

!macro customInstall
  WriteRegStr HKCU "Software\\Creoleap\\LeapBlocks" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\\Creoleap\\LeapBlocks" "Version" "${VERSION}"
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\\Creoleap\\LeapBlocks"
!macroend
