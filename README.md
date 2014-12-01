# Pullover
*The unofficial multi-platform Pushover desktop client.*

## Why was this App created?

I discovered Pushover in mid November 2014 and was really excited. The only thing missing was a decent desktop client. At the time there was only a rudimentary Notification Center integration for Mac. But I was missing the following features:

* Show the icon of the notifying app (it always showed the pushover icon)
* Make the notification clickable to open URLs attached to notifications
* Support for Windows or Linux

## Installation - prebuilt binaries

Goto [Pushover.net](https://pushover.net/licensing) and get a desktop license (there is a demo period if you want to try it out first). Without this license Pullover will not work.

Then download the precompiled binarys:

- **Windows (v0.1.0):** []
- **Mac 10.8+ (v0.1.0):** []
- **Linux x32 (v0.1.0):** []
- **Linux x64 (v0.1.0):** []

**Please note:** This App is an alpha version. For now only the Mac version is tested since that's my main operating system. However it should also run under Windows / Linux. If you find bugs or the app crashes under Win/Linux please create an issue and I will look into it.

## Build your own

1. Install dependencies of the build process: `npm install`
2. Install dependencies of Pullover: `cd src && npm install`
3. Open `build.js` and adapt `platforms:` to your preference
4. Return to root dir and build binaries with: `node build.js`
5. If the build process was successful, you can find the binaries in `bin`

### Development

There is no need to always build packaged binaries if you want to dive into the source of Pullover and try out some changes. Instead install `node-webkit-builder` and run Pullover directy:

    npm install -g node-webkit-builder
    nwbuild -r src

You might need to run `sudo nwbuild -r src` once, because the cache directory where `nwbuild` stores it's copy of `node-webkit` is not writable to your user.

## Contributing

If you miss a feature or fixed a bug, don't hesitate to create a pull-request. I open-sourced this App with the hope that others contribute to it. Especially for Windows and Linux since I rarely use those systems.

## Todo

* Add option to start Pullover on system start
* Resize icon size for OS X
* Allow to pause notifications
* Create better looking notifications for Windows
* Create a history for Windows and Linux
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