# Pullover
*The unofficial multi-platform Pushover desktop client.*

![Pullover Demo](https://raw.githubusercontent.com/cgrossde/Pullover/master/res/Demo.gif)

## Features

* Native Pushover Client for Windows, Mac and Linux
* Show icon of the notifying app
* Limit the max amount of notifications shown at once
* Notification history
* Run on startup

## Installation / Download

Goto [Pushover.net](https://pushover.net/licensing) and get a desktop license (there is a trial period if you want to try it out first). **Without this license Pullover will not work.**


* **Windows x32 (v1.3.0):** [Pullover_1.3.0_Installer.exe](https://sourceforge.net/projects/pullover/files/1.3.0/Pullover_1.3.0_Installer.exe/download)
* **Mac OS 10.8+ x64 (v1.3.0):** [Pullover_1.3.0.dmg](https://sourceforge.net/projects/pullover/files/1.3.0/Pullover_1.3.0.dmg/download)
* **Linux x64 (v1.3.0):** [Pullover_1.3.0_linux64.zip](https://sourceforge.net/projects/pullover/files/1.3.0/Pullover_1.3.0_linux64.zip/download)
* **Linux x32 (v1.3.0):** [Pullover_1.3.0_linux32.zip](https://sourceforge.net/projects/pullover/files/1.3.0/Pullover_1.3.0_linux32.zip/download)

**Please note:** If the app doesn't work for you, don't hesitate to open an issue [here](https://github.com/cgrossde/Pullover/issues). I usually test Pullover on Mac and Windows before publishing a new version, however if I miss something just contact me. Please add the log file (see section *Bugs* bellow).

## Build your own
You can create builds for all platforms with Mac OS, take a look at [CROSSPLATFORM.md](CROSSPLATFORM.md) to find out about necessary dependencies.

1. Install build dependencies: `npm install`
2. Install dependencies of Pullover: `cd src && npm install`
3. Compile src with webpack: `npm run compile`
4. Return to root dir: `cd ..`
5. Rename `config/buildConf.json.sample` to `config/buildConf.json`
6. Open `config/buildConf.json` and adapt `platforms:` to your preference
7. Build binaries with: `./builder build`
8. If the build process was successful, you can find the binaries in `bin/pullover/[platform]`
9. If you want to package them (`.zip`/`.dmg`/`.exe`), execute `./builder createDist`
10. The distributables will be placed in `bin/deploy`

### Development

There is no need to always build packaged binaries if you want to dive into the source of Pullover and try out some changes. Instead install the node dependencies in the root folder and in source with `npm install` and run the `builder` script. Make sure to copy `config/buildConf.json.sample` to `config/buildConf.json` first

```Shell
cp config/buildConf.json.sample config/buildConf.json
    npm install
    cd src && npm install
npm run watch
    # In another shell go back to Pullovers root folder and run the app
    cd ..
    ./builder run
```

### Bugs

If you encounter a bug or Pullover crashes, please go to the following directory and send me the `pullover.1.log` file by opening an issue:

* OS X - `$HOME/Library/Application Support/Pullover`
* Windows 8 - `C:\Users\YOURUSERNAME\AppData\Roaming\Pullover`
* Windows XP - `C:\Documents and Settings\YOURUSERNAME\Application Data\Pullover`
* Linux - `$XDG_DATA_HOME/Pullover or $HOME/.local/share/Pullover`

## Contributing

If you miss a feature or fixed a bug, don't hesitate to create a pull-request. I open-sourced this App with the hope that others contribute to it. Especially for Windows and Linux since I rarely use those systems.

## Changelog

**1.3.0 (1.3.0-alpha.1)**:

* Updated from NW.js 0.12 to v0.28.2 (#65)
* Updated dependencies
* Reimplemented notification list (broken because of updated dependencies)
* Enhancement #86, refresh notification list when new notifications arrive
* Removed nw-notify (broken because of updated dependencies)
* NW.js/Chrome notifications are now used always
* Fixes #110, notifications on Win10 after the creators update
* Add analytics to get a feel for the frequency of bugs and usage of the app (can be disabled in settings)
* Fixes #96, #106, #107, more resilient to network errors
* Added option to disable sounds

**1.2.0 (1.2.0-alpha.1):**

* Implements #11, finally implemented a notification history
* Upgraded dependencies to their latest version and adapted to API changes
* Added windows code signing again, thanks to joeyrs, Kevin Riggle and TheReiner
* Give feedback to user after update check

**1.1.0-alpha.1:**

* Implements #59, disable/change default notification sound

**1.0.0 (1.0.0-beta.3):**

* Fixes #52, catch JSON parse errors

**1.0.0-beta.2:**

* Fixes #48, #49, if title is empty use app name instead
* Mitigate #47, surpress non fatal exception related to visionmedia/superagent#714
* Fixes #46, sound throtteling and add sounds for native notifications (functional processing of notifications with RxJS)

**1.0.0-beta.1:**

* Fixes #45, strip HTML from native notifications (HTML is not supported)
* Enhancement #44, switch internal DB and show received notification count
* Fixes #43, click on native notification lead to crash
* Fixes #42, added upgrade logic to keep settings when upgrading
* Fixes #32, typo in data path for linux
* Fixes #21, respect notification priority (no sound for -1 and no show for -2)

**1.0.0-alpha.1:**

* Complete rewrite, UI is now based on React
* Connection handling was improved and should be very stable now
* Max notification queue: Limit the amount of notifications shown at once (helpful for rarely used computers)
* Notification sounds
* All received notifications are stored in an internal database. This will be used in the future to show a history of received notifications

**0.0.1** - **0.3.2** Initial app, based on jQuery but kind of messy

## Why was this App created?

I discovered Pushover in mid November 2014 and was really excited. The only thing missing was a decent desktop client. At the time there was only a rudimentary Notification Center integration for Mac. But I was missing the following features:

* Show the icon of the notifying app (it always showed the pushover icon)
* Make the notification clickable to open URLs attached to notifications
* Support for Windows or Linux

Since then a lot has changed. The initial app was written because I wanted to try `nwjs` and fix the problems mentioned before. I used jQuery at the time and it got kind of messy and unpredictable. In 2015 I wanted to do something with React and did a complete rewrite (with a lot of breaks in between). The first beta after the rewrite was released in Feb. 2016. The code is a lot better to maintain now and new features should be easy to implement.

## License

    Pullover - The unofficial Pushover desktop client
    Copyright (C) 2014  Christoph Groß <gross@blubyte.de> (http://chris-labs.de/)
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.