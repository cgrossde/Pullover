To build this project for Windows on a Mac/Linux, some prequesites are required:

Wine and xquartz is needed for the Windows Icon and Pullover installer (makensis).
Mono MDK is needed for code signing (codesign).

```
brew install Caskroom/cask/xquartz
brew install wine winetricks makensis 
brew install Caskroom/cask/mono-mdk
```

**Important:** Make sure to init wine in x32 mode. Otherwise it will hang! 
We also need .NET or we will get an Anubis resource bundler error.
```
rm -Rf ~/.wine
WINEARCH=win32 WINEPREFIX=~/.wine wine wineboot
winetricks dotnet20
```