# Pullover
*The unofficial multi-platform Pushover desktop client.*

![Pullover Demo](https://raw.githubusercontent.com/cgrossde/Pullover/master/res/Demo.gif)

## Why was this App created?

I discovered Pushover in mid November 2014 and was really excited. The only thing missing was a decent desktop client. At the time there was only a rudimentary Notification Center integration for Mac. But I was missing the following features:

* Show the icon of the notifying app (it always showed the pushover icon)
* Make the notification clickable to open URLs attached to notifications
* Support for Windows or Linux

## Installation - prebuilt binaries

Goto [Pushover.net](https://pushover.net/licensing) and get a desktop license (there is a trial period if you want to try it out first). **Without this license Pullover will not work.**

Then download the precompiled binarys:

* **Windows (v0.3.1):** [Pullover_0.3.1_Installer.exe](https://sourceforge.net/projects/pullover/files/0.3.1/Pullover_0.3.1_Installer.exe/download)
* **Mac OS 10.8+ (v0.3.1):** [Pullover_0.3.1.dmg](https://sourceforge.net/projects/pullover/files/0.3.1/Pullover_0.3.1.dmg/download)
* **Linux x32 (v0.3.1):** [Pullover_0.3.1_linux32.zip](https://sourceforge.net/projects/pullover/files/0.3.1/Pullover_0.3.1_linux32.zip/download)

**Please note:** This App is in an **early alpha** state. For now only the Mac version is tested since that's my main operating system. However it should also run under Windows / Linux. If you find bugs or the app crashes under Win/Linux please create an issue and I will look into it.

## Notifications

**Mac OS X:** Pullover will use the native OS X notification center. Don't activate the *Use new notifications* option.
**Windwos:** Since windows has no notification center I created the [nw-notify](https://github.com/cgrossde/nw-notify) package which displays nice notifications in the lower right corner. If you install Pullover on windows it will automatically enable *Use new notifications*.

## Build your own
You can create all builds with Mac OS if you have `wine` installed.

1. Install dependencies of the build process: `npm install`
2. Install dependencies of Pullover: `cd src && npm install`
3. Open `config/buildConf.json.sample` and adapt `platforms:` to your preference
4. Rename `config/buildConf.json.sample` to `config/buildConf.json`
5. Return to root dir and build binaries with: `node build build`
6. If the build process was successful, you can find the binaries in `bin/pullover/[platform]`
7. If you want to package them (`.zip`/`.dmg`), execute `node build createDist`
8. The distributables will be placed in `bin/deploy`

### Development

There is no need to always build packaged binaries if you want to dive into the source of Pullover and try out some changes. Instead install `node-webkit-builder` and run the `build` script:

    npm install -g node-webkit-builder
    node build run

### Bugs

If you encounter a bug or Pullover crashes, please go to the following directory and send me the `pullover.1.log` file by opening an issue:

* OS X - '/Users/user/Library/Application Support/pullover'
* Windows 8 - 'C:\Users\User\AppData\Roaming\Pullover'
* Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover'
* Linux - '/var/local/Pullover'

## Contributing

If you miss a feature or fixed a bug, don't hesitate to create a pull-request. I open-sourced this App with the hope that others contribute to it. Especially for Windows and Linux since I rarely use those systems.

## Todo

* Add option to start Pullover on system start [DONE]
* Resize icon size for OS X
* Allow to pause notifications
* Create better looking notifications for Windows [DONE]
* Create a history for Windows and Linux [INPROGRESS]
* Improve codebase [INPROGRESS]
* Create an installer for Windows
* Create a launcher for Ubuntu
* Test App under Ubuntu and Windows

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
