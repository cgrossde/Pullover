To build this project for Windows on a Mac/Linux, some prequesites are required:

Wine and xquartz is needed for the Windows Icon and Pullover installer (makensis).
Mono MDK is needed for code signing (codesign).

```
brew install Caskroom/cask/xquartz
brew install wine makensis
brew install Caskroom/cask/mono-mdk

```