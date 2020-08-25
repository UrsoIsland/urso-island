# Urso Island

## Usage
### Getting started
To run the game server, you need to have Node.js preinstalled, a PlayFab Title, a Discord WebHook URL and a Discord Bot Token. You will also need to install the Node.js modules via `npm`:
```bash
npm install
```

### Configuration
You will need to setup the following environment variables:
```bash
URL= # The game URL, ignored when testing.
TOKEN= # The Discord Bot Token.
GAME_ID= # The PlayFab Title ID. You can also pass this as argv[2].
API_KEY= # The PlayFab Title API Key. You can also pass this as argv[3].
WEBHOOK= # The Discord WebHook URL.
```

### Coins
To manage coins you will need to create a PlayFab Virtual Currency with `"UR"` as 2-letter code.

### Items
To manage the in-game items, you will need to create a PlayFab Catalog and set it as the default one. You should set a price in `"UR"` currency in order to make the item purchaseable. The `/media/items/` folder contains all the item spritesheets and its respective JSON data.

### Badges
To manage badges, you should modify/create a `badges` key in the PlayFab Player Title Data and assign a JSON-compatible array to it. All the badges sprites and JSON data is contained in the `/media/ui/` folder.

### Moderation tools
_ToDo_.

### Rooms, Emojis and other features
All the other features are hardcoded in JavaScript or contained in the `/media/` folder and its subfolders.

## ToDo
 + Repo: Better documentaion.
 + Game: Gear items.
 + Security: Penetration testing.

**WARNING: This game is potentially insecure, since there were no security tests.**

## Licensing
The Urso Island client source code is licensed under the [Apache License version 2.0](https://github.com/UrsoIsland/urso-island/blob/master/LICENSE.apache) (Apache-2.0).

The Urso Island server source code is licensed under the [GNU General Public License 2.0](https://github.com/UrsoIsland/urso-island/blob/master/LICENSE.gpl) (GPL-2.0).

The Urso Island visual assets and documentation are licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/) (CC BY-NC 4.0).
