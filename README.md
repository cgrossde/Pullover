# Pullover - DEV
*The unofficial multi-platform Pushover desktop client.*

![Pullover Demo](https://raw.githubusercontent.com/cgrossde/Pullover/master/res/Demo.gif)

## Features

* Native Pushover Client for Windows, Mac and Linux
* Show icon of the notifying app
* Make notification with URLs clickable
* Limit the max amount of notifications shown at once
* Run on startup

## Installation / Download

Goto [Pushover.net](https://pushover.net/licensing) and get a desktop license (there is a trial period if you want to try it out first). **Without this license Pullover will not work.**

**ALPHA RELEASE (complete rewrite)** - Please report all bugs you encounter


* **Linux x64 (v1.0.0-alpha.1):** [Pullover_1.0.0-alpha.1_linux64.zip](https://sourceforge.net/projects/pullover/files/1.0.0-alpha.1/Pullover_1.0.0-alpha.1_linux64.zip/download)
* **Linux x32 (v1.0.0-alpha.1):** [Pullover_1.0.0-alpha.1_linux32.zip](https://sourceforge.net/projects/pullover/files/1.0.0-alpha.1/Pullover_1.0.0-alpha.1_linux32.zip/download)
* **Windows x32 (v1.0.0-alpha.1):** [Pullover_1.0.0-alpha.1_Installer.exe](https://sourceforge.net/projects/pullover/files/1.0.0-alpha.1/Pullover_1.0.0-alpha.1_Installer.exe/download)
* **Mac OS 10.8+ x64 (v1.0.0-alpha.1):** [Pullover_1.0.0-alpha.1.dmg](https://sourceforge.net/projects/pullover/files/1.0.0-alpha.1/Pullover_1.0.0-alpha.1.dmg/download)

**Please note:** If the app doesn't work for you, don't hesitate to open an issue [here](https://github.com/cgrossde/Pullover/issues). I usually test Pullover on Mac and Windows before publishing a new version, however if I miss something just contact me. Please add the log file (see section *Bugs* bellow).

**Donate for code signing:**
I did sign the Windows installer in the past but my certificate expired. I would also like to sign the Mac version but that requires a (paid) Apple Developer Account.
Both costs money, if you would like to support this project, consider making a donation: [![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=U3RY7599D8G2J)

## Build your own
You can create builds for all platforms with Mac OS, take a look at [CROSSPLATFORM.md](CROSSPLATFORM.md) to find out about necessary dependencies.

1. Install build dependencies: `npm install`
2. Install dependencies of Pullover: `cd src && npm install`
3. Rename `config/buildConf.json.sample` to `config/buildConf.json`
4. Open `config/buildConf.json` and adapt `platforms:` to your preference
5. Return to root dir and build binaries with: `./builder build`
6. If the build process was successful, you can find the binaries in `bin/pullover/[platform]`
7. If you want to package them (`.zip`/`.dmg`/`.exe`), execute `./builder createDist`
8. The distributables will be placed in `bin/deploy`

### Development

There is no need to always build packaged binaries if you want to dive into the source of Pullover and try out some changes. Instead install the node dependencies in the root folder and in source with `npm install` and run the `builder` script. Make sure to copy `config/buildConf.json.sample` to `config/buildConf.json` first

```Shell
    cp `config/buildConf.json.sample` `config/buildConf.json`
    npm install
    cd src && npm install
    ./node_modules/webpack/bin/webpack.js --watch
    # In another shell go back to Pullovers root folder and run the app
    cd ..
    ./builder run
```

### Bugs

If you encounter a bug or Pullover crashes, please go to the following directory and send me the `pullover.1.log` file by opening an issue:

* OS X - '$HOME/Library/Application Support/Pullover'
* Windows 8 - 'C:\Users\YOURUSERNAME\AppData\Roaming\Pullover'
* Windows XP - 'C:\Documents and Settings\YOURUSERNAME\Application Data\Pullover'
* Linux - '$XDG_DATA_HOME/Pullover or $HOME/.local/share/Pullover'

## Contributing

If you miss a feature or fixed a bug, don't hesitate to create a pull-request. I open-sourced this App with the hope that others contribute to it. Especially for Windows and Linux since I rarely use those systems.

## Changelog

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