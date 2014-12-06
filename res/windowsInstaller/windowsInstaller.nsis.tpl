; NSIS packaging/install script
; Docs: http://nsis.sourceforge.net/Docs/Contents.html

!include MUI2.nsh
!addplugindir "./Plugin"

; --------------------------------
; Variables
; --------------------------------

!define dest "{{dest}}"
!define src "{{src}}"
!define name "{{name}}"
!define prettyName "{{prettyName}}"
!define version "{{version}}"
!define icon "{{icon}}"
!define setupIcon "{{setupIcon}}"
!define banner "{{banner}}"

!define exec "pullover.exe"

!define regkey "Software\${name}"
!define uninstkey "Software\Microsoft\Windows\CurrentVersion\Uninstall\${name}"

!define uninstaller "uninstall.exe"

; --------------------------------
; Interface settings
; --------------------------------

!define MUI_HEADERIMAGE
;150x57
!define MUI_HEADERIMAGE_BITMAP "${banner}"
!define MUI_ICON "${setupIcon}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Run Pullover now"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchLink"
; Used to ask for autostart
!define MUI_FINISHPAGE_SHOWREADME
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Start Pullover with windows"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION AutostartOnStartup

;!define MUI_UNFINISHPAGE_NOAUTOCLOSE

; --------------------------------
; Installation
; --------------------------------

Name "${prettyName}"
OutFile "${dest}"
InstallDir "$PROGRAMFILES\${name}"
InstallDirRegKey HKLM "${regkey}" ""

; --------------------------------
; Pages
; --------------------------------

; Pages installer
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Pages uninstaller
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"


; --------------------------------
; Installation
; --------------------------------

Function .oninit
    App_Running_Check:
    ; is pullover.exe process running? result is stored in $R0
    Processes::FindProcess "pullover.exe"

    ${If} $R0 == 1
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Please stop Pullover.exe before continuing" /SD IDCANCEL IDRETRY App_Running_Check
        Quit
    ${EndIf}
FunctionEnd

Section "Install" install

    WriteRegStr HKLM "${regkey}" "Install_Dir" "$INSTDIR"
    WriteRegStr HKLM "${uninstkey}" "DisplayName" "${prettyName}"
    WriteRegStr HKLM "${uninstkey}" "DisplayIcon" '"$INSTDIR\icon.ico"'
    WriteRegStr HKLM "${uninstkey}" "UninstallString" '"$INSTDIR\${uninstaller}"'

    ; Remove all application files copied by previous installation
    RMDir /r "$INSTDIR"

    SetOutPath $INSTDIR

    ; Include all files from /build directory
    File /r "${src}\*"

    ; Create start menu shortcut
    CreateShortCut "$SMPROGRAMS\${prettyName}.lnk" "$INSTDIR\${exec}" "" "$INSTDIR\icon.ico"

    WriteUninstaller "${uninstaller}"
SectionEnd

; --------------------------------
; Uninstaller
; --------------------------------

; Uninstall declarations
Section "Uninstall"
    App_Running_Check:
    ; is pullover.exe process running? result is stored in $R0
    Processes::FindProcess "pullover.exe"

    ${If} $R0 == 1
        MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Please stop Pullover.exe before continuing" /SD IDCANCEL IDRETRY App_Running_Check
        Quit
    ${EndIf}

    DeleteRegKey HKLM "${uninstkey}"
    DeleteRegKey HKLM "${regkey}"

    Delete "$SMPROGRAMS\${prettyName}.lnk"

    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${prettyName}"

    ; Remove whole directory from Program Files
    RMDir /r "$INSTDIR"

SectionEnd

Function LaunchLink
  Exec '"$WINDIR\explorer.exe" "$SMPROGRAMS\${prettyName}.lnk"'
FunctionEnd

Function AutostartOnStartup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${prettyName}" "$INSTDIR\${exec}"
FunctionEnd