# Pullover
*The unofficial multi-platform Pushover desktop client.*

![Pullover Demo](https://raw.githubusercontent.com/cgrossde/Pullover/master/res/Demo.gif)

## Why was this App created?

I discovered Pushover in mid November 2014 and was really excited. The only thing missing was a decent desktop client. At the time there was only a rudimentary Notification Center integration for Mac. But I was missing the following features:

* Show the icon of the notifying app (it always showed the pushover icon)
* Make the notification clickable to open URLs attached to notifications
* Support for Windows or Linux

## Installation / Download

Goto [Pushover.net](https://pushover.net/licensing) and get a desktop license (there is a trial period if you want to try it out first). **Without this license Pullover will not work.**

{% for download in downloads %}
* **{{download.platformName}} (v{{version}}):** [{{download.fileName}}]({{download.url}}){% endfor %}

**Installation on Linux:** Please refer to this wiki article [wiki/Installing-on-Linux](https://github.com/cgrossde/Pullover/wiki/Installing-on-Linux)

**Please note:** If the app doesn't work for you, don't hesitate to open an issue [here](https://github.com/cgrossde/Pullover/issues). I usually test Pullover on Mac and Windows before publishing a new version, however if I miss something just contact me. Please add the log file (see section *Bugs* bellow).

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

    cp `config/buildConf.json.sample` `config/buildConf.json`
    npm install
    cd src && npm install
    cd ..
    ./builder run

### Bugs

If you encounter a bug or Pullover crashes, please go to the following directory and send me the `pullover.1.log` file by opening an issue:

* OS X - '/Users/user/Library/Application Support/pullover'
* Windows - 'C:\Users\User\AppData\Roaming\Pullover'
* Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover'
* Linux - '~/.local/share/Pullover'

## Contributing

If you miss a feature or fixed a bug, don't hesitate to create a pull-request. I open-sourced this App with the hope that others contribute to it. Especially for Windows and Linux since I rarely use those systems.

## Planned features

I am currently rewriting Pullover and a list of planned features is in the [wiki](https://github.com/cgrossde/Pullover/wiki). If you have any feature wishes not listed there then open an issue and I will take a look at it.

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
