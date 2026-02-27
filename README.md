# **XIIM** - XI Item Manager

A web-based multi-character inventory management addon for Ashita v4 that provides real-time inventory tracking, item organization, and augment decoding for Final Fantasy XI. Tuned specifically for [CatsEyeXI private server](https://www.catseyexi.com/).

### Interactive Demo https://seekey13.github.io/XIIM/

<img alt="image" src="https://github.com/user-attachments/assets/45692b95-e57b-43ed-902a-4f65d4e78224" />
<img alt="image" src="https://github.com/user-attachments/assets/c0d8ca46-52bd-45ea-a348-1f21f0031e82" />

## Features

### Multi-Character Inventory Management
- **Centralized View**: Access all your characters' inventories from a single web interface
- **Real-Time Sync**: Automatic updates via Server-Sent Events when inventory changes
- **Character Switching**: Quick character selection with last online timestamps
- **Automatic Detection**: Characters are detected and tracked automatically when logged in

### Web-Based Interface
- **Modern Browser UI**: Rich, responsive interface accessible from any device on your network
- **Item Grid Layout**: Visual representation of all containers with icons and details
- **Advanced Search**: Filter by name, level, job, race, skill type, and equipment slot
- **Collapsible Containers**: Organize your view by hiding/showing specific containers
- **Tooltips**: Rich hover details showing stats, augments, and descriptions

### Item Management
- **Drag & Drop**: Move items between containers with visual feedback
- **Item Movement Validation**: 
  - Wardrobe restrictions (only equipable items)
  - Stack count validation
  - Lock/Bazaar detection
  - Destination capacity checks
- **Progress Tracking**: Visual progress bar during move operations
- **Context Menu**: Right-click for quick actions
  - Move to container
  - Tag as trash
  - Wiki lookup

### Item Selling
- **Automated Selling**: Queue multiple items to sell to NPCs
- **Trash System**: Tag items as trash for easy bulk selling
- **"Sell Trash" Button**: Sell all trash-tagged items at once
- **Safe Selling**: Blocks NoSale Flag items automatically
- **Progress Tracking**: Visual feedback during sell operations
- **Rate Limited**: 2-second delay between sales to prevent errors

### Container Sorting
- **One-Click Sort**: Sort any container using game's built-in sorting
- **Works Everywhere**: Sort Inventory, Storage, Wardrobes, and all containers (if you have access)

### Cross-Character Operations
- **Pending Operations**: Queue moves/sells/sorts for client characters
- **No Errors**: Smooth multi-character management without switching
- **Mog House Detection**: Blocks Safe access when not in mog house

### Container Support
All FFXI containers supported:
- **Inventory**
- **Safe**
- **Storage**
- **Locker**
- **Satchel**
- **Sack**
- **Case**
- **Wardrobes 1-8**

### Equipment Tracking
- **All Slots**: Main, Sub, Range, Ammo, Head, Body, Hands, Legs, Feet, Neck, Waist, Ear1, Ear2, Ring1, Ring2, Back
- **Weapon Stats**: Damage, Delay, DPS calculation
- **Armor Stats**: Defense values
- **Augments**: Full augment display on equipped items

### Data Management
- **Per-Character Settings**: Isolated data storage for each character
- **Automatic Saves**: Incremental saves with 2-second debounce
- **Zone Safety**: Prevents corrupt saves during zone transitions
- **JSON Export**: API for external tools and integrations
- **Lua Format**: Human-readable settings files

## Latest Release

### [1.0] - 2026-02-22
First official release with complete inventory management features:
- **Modular Architecture**: Clean code organization with modules/, web/, and assets/ directories
- **Multi-Character Support**: Manage all your characters from a single interface
- **Real-Time Updates**: Instant synchronization via Server-Sent Events
- **Item Movement**: Drag & drop with full validation
- **Item Selling**: Automated selling to NPCs with trash tagging system
- **Container Sorting**: One-click sorting for any container
- **Augment Decoding**: Support for Delve, Oseem, and Magian augments
- **Web Interface**: Modern browser-based UI with advanced search and filtering

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## Installation

1. **Download XIIM**
   - Clone or download this repository
   - Ensure you have all files in the `XIIM` folder

2. **Place in Ashita addons directory**
   ```
   <Ashita Install Path>/addons/XIIM/
   ```

3. **Load the addon in-game**
   ```
   /addon load XIIM
   ```

## Commands

### Basic Commands
- `/xiim open` - Open your browser to: `http://localhost:11011`
- `/xiim scan` - Display container summary in chat
- `/xiim debug` - Toggle debug mode (verbose logging)
- `/xiim reload` - Reload the addon

### Shortcuts
- Most interaction happens through the web UI
- Commands are primarily for troubleshooting

## Usage

### Getting Started

1. **Load the addon**
   ```
   /addon load XIIM
   ```
   You should see: `Webserver started on http://localhost:11011`

2. **Open the web interface**
   ```
   /XIIM open
   ```
   - This will open `http://localhost:11011` in your browser
   - You can access this from the same PC or any device on your local network

3. **View your inventory**
   - Your current character's inventory will load automatically
   - Click on container headers to expand/collapse sections
   - Hover over items to see detailed tooltips

### Multi-Character Usage

1. **Switch characters in-game**
   - Log out and log in with a different character
   - XIIM will automatically detect the character change

2. **View in web UI**
   - Character buttons appear at the top of the web page
   - Click any character button to view their inventory
   - Last online time is displayed for each character

3. **Real-time updates**
   - Changes to any character's inventory update automatically
   - No need to refresh the page

### Searching & Filtering

**Text Search:**
- Type in the search bar to filter items by name
- Search is case-insensitive
- Instant results as you type

**Advanced Filters:**
1. Click the filter icon in the header
2. Select filter criteria:
   - **Level Range**: Slider to set min/max level
   - **Jobs**: Click job badges (WAR, MNK, WHM, etc.)
   - **Races**: Click race badges (Hume, Elvaan, Tarutaru, etc.)
   - **Skills**: Click skill type badges (Sword, Axe, Magic, etc.)
   - **Slots**: Click equipment slot badges (Head, Body, Hands, etc.)
   - **Duplicates**: Toggle to show only items with multiple stacks
3. Click filter icon again to close panel
4. Click clear icon to reset all filters

### Item Details

**Tooltip Information:**
- Item name with rarity color
- Level requirement and jobs
- Races that can equip
- Equipment slot (if equipable)
- Stack size (if stackable)
- Weapon stats (damage, delay, DPS)
- Armor stats (defense)
- Augments (if present)
- Item description
- Bazaar price (if set)

**Augment Display:**
- Type (Delve, Oseem, Magian, Dynamis)
- Path (A/B/C/D for Delve)
- Rank (0-15 for Delve)
- All augment stats with proper formatting

### Moving Items

**Drag & Drop:**
1. Click and hold on an item
2. Drag to target container header
3. Release to drop
4. Watch progress bar for completion

**Context Menu:**
1. Right-click on an item
2. Select "Move to..."
3. Choose destination container
4. Execute move

**Validation:**
- Cannot move locked items
- Cannot move bazaar items
- Wardrobes only accept equipable items
- Destination must have free space
- Stack count must be 1-255

### Context Menu Actions

**Move to...**: Select destination container for item

**Wiki this...**: Open bg-wiki.com page for the item
- Regular items → Standard search
- Venture items → Special Venture content page

**Expand/Collapse All**: Toggle all container sections (header right-click only)

## Architecture

### Components

**Backend (Lua Modules):**
- `XIIM.lua` - Main addon orchestrator
- `modules/augments.lua` - Augment decoding engine
- `modules/constants.lua` - Container and augment lookup tables
- `modules/data.lua` - JSON/Lua serialization
- `modules/inventory.lua` - Inventory scanning
- `modules/moveit.lua` - Item movement validation and packet injection
- `modules/webserver.lua` - HTTP server and SSE support

**Frontend (Web Files):**
- `web/index.html` - UI structure
- `web/app.js` - JavaScript application logic (2426 lines)
- `web/styles.css` - Modern styling (1164 lines)

**Assets:**
- `assets/XIIM.png` - Application icon

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

### How It Works

1. **Inventory Scanning**
   - XIIM monitors inventory packets (0x01E, 0x01F, 0x020)
   - Detects changes to containers in real-time
   - Saves incremental updates (only modified data)

2. **Web Interface**
   - HTTP server runs on localhost:11011
   - Serves static files (HTML, CSS, JS)
   - Provides RESTful API for inventory data

3. **Real-Time Sync**
   - Server-Sent Events (SSE) push updates to browser
   - No polling required
   - Automatic reconnection on disconnect

4. **Multi-Character Support**
   - Each character has isolated settings file
   - Character detection via name + server ID
   - Data persists across sessions

## API Reference

### GET /api/inventory
Returns inventory data for all characters in JSON format.

**Response:**
```json
[
  {
    "character_name": "PlayerOne",
    "server_id": 123,
    "last_updated": 1706000000,
    "gil": 1500000,
    "equipment": [...],
    "containers": {
      "Inventory": {
        "id": 0,
        "maxSize": 80,
        "currentCount": 45,
        "items": [...]
      }
    }
  }
]
```

### GET /api/events
Server-Sent Events endpoint for real-time updates.

**Event Format:**
```
data: [{"character_name": "PlayerOne", ...}]

```

### POST /api/move
Submit item movement request (requires validation).

**Request:**
```json
{
  "character_key": "PlayerOne_123",
  "moves": [
    {
      "count": 1,
      "srcCont": 0,
      "dstCont": 7,
      "srcSlot": 9
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "errors": []
}
```

### GET /api/move/state
Get current move operation status.

**Response:**
```json
{
  "isMoving": true,
  "movesRemaining": 5
}
```

### POST /api/sell
Sell items to NPC.

**Request:**
```json
{
  "character_key": "PlayerOne_123",
  "item_names": ["Copper Ore", "Bat Wing"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Selling 2 item type(s)",
  "errors": []
}
```

### GET /api/sell/state
Get current sell operation status.

**Response:**
```json
{
  "isActive": true,
  "itemsRemaining": 3,
  "errors": []
}
```

### POST /api/sort
Sort a container.

**Request:**
```json
{
  "character_key": "PlayerOne_123",
  "container_id": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sort container 0"
}
```

### POST /api/trash
Update trash items list.

**Request:**
```json
{
  "character_key": "PlayerOne_123",
  "trash_items": ["Old Item", "Junk"]
}
```

**Response:**
```json
{
  "success": true
}
```

## Configuration

### Settings Files

Settings are stored per character in Lua format:
```
<Ashita Install Path>/config/addons/XIIM/<CharacterName>_<ServerID>/settings.lua
```

**Example:**
```lua
return {
    ["character_name"] = "PlayerOne",
    ["server_id"] = 123,
    ["last_updated"] = 1706000000,
    ["gil"] = 1500000,
    ["equipment"] = {...},
    ["containers"] = {
        ["Inventory"] = {...}
    }
}
```

### Network Configuration

By default, XIIM binds to `localhost` (127.0.0.1) on port `11011`.

**To access from other devices on your network:**
- Edit `modules/webserver.lua`
- Change bind address from `'127.0.0.1'` to `'0.0.0.0'`
- Access from other devices via `http://<your-pc-ip>:11011`

**Security Note:** Only expose to trusted local networks.

## Performance

### Optimizations
- **Incremental Saves**: Only modified containers are saved
- **Debounced Updates**: 2-second delay batches rapid changes
- **Efficient Scanning**: Only reads unlocked containers
- **Smart Caching**: Character data cached in memory
- **Non-Blocking I/O**: Webserver uses async socket operations

### Resource Usage
- **CPU**: Minimal (event-driven, not polling)
- **Memory**: ~2-5 MB per character (depends on inventory size)
- **Disk**: ~100-500 KB per character settings file
- **Network**: Local only, minimal bandwidth

## Troubleshooting

### Webserver won't start
**Symptom:** `Port 11011 already in use`

**Solution:**
- Another instance of XIIM is already running
- Only one Ashita client can host the server
- Other clients will automatically become guests (sharing data)
- Or, change the port in `XIIM.lua` (line ~27)

### Inventory not updating
**Symptom:** Changes in-game don't appear in web UI

**Solution:**
1. Check if addon is loaded: `/addon list`
2. Toggle debug mode: `/xiim debug`
3. Look for errors in Ashita log
4. Try reloading: `/xiim reload`
5. Refresh browser page

### Items not moving
**Symptom:** Drag & drop doesn't work

**Solution:**
- Check if item is locked (cannot move)
- Check if item is in bazaar (cannot move)
- Wardrobe destinations require equipable items
- Destination container must have free space
- Check browser console for errors (F12)

### Augments not showing
**Symptom:** Augmented items show no augment data

**Solution:**
- Only Delve, Oseem, and Magian styles are supported
- Evolith and Shield extdata not yet implemented
- Check if item has Extra field (24 bytes minimum)
- Some augments may not be in lookup tables

### Multiple characters not appearing
**Symptom:** Only one character shows in web UI

**Solution:**
- Log in to each character at least once with XIIM loaded
- Settings files are created on first inventory scan
- Check `config/addons/XIIM/` for character folders
- Character key format: `{name}_{server_id}`

## Known Limitations

### Current Restrictions
- **Single Server Host**: Only one Ashita instance can host webserver (first to bind)
- **Localhost Only**: Default configuration binds to 127.0.0.1 (change bind address for network access)
- **CatsEyeXI Specific**: Container IDs may differ on other private servers
- **No Transaction Safety**: Concurrent item moves are not queued
- **Limited Augment Support**: Only Delve, Oseem, and Magian styles decoded

## Contributing

Contributions are welcome! Please:

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the codebase
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## Support

### Getting Help
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Review [CHANGELOG.md](CHANGELOG.md) for recent changes
- Enable debug mode: `/xiim debug`
- Check Ashita log for errors

### Reporting Issues
When reporting bugs, please include:
- XIIM version (`/addon list`)
- Ashita version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Debug log output (if applicable)

## Credits

**Authors:**
- Seekey
- Commandobill

**Special Thanks:**
- Ashita v4 development team
- CatsEyeXI server team
- LuaSocket library authors
- Community contributors

## License

MIT License

Copyright (c) 2025 Seekey & Commandobill

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

See [LICENSE](LICENSE) file for full details.

## Links

- **GitHub Repository**: https://github.com/seekey13/XIIM
- **CatsEyeXI Server**: https://www.catseyexi.com/
- **Ashita v4**: https://www.ashitaxi.com/

