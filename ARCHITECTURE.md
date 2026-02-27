# XIIM Architecture

This document provides a technical overview of the XIIM (XI Item Manager) addon architecture.

## Design Philosophy

XIIM follows these core principles:

1. **Multi-Character Support**: Manage inventory across multiple characters with automatic synchronization
2. **Web-First Interface**: Browser-based UI for enhanced usability and cross-device access
3. **Real-Time Updates**: Server-Sent Events (SSE) for instant inventory synchronization
4. **Modular Architecture**: Clear separation between backend (Lua), frontend (JavaScript), and data layers
5. **Data Persistence**: Character-specific settings with JSON/Lua serialization
6. **Safety First**: Multiple validation layers for item movement and inventory operations

## Component Architecture

```
┌─────────────────────────────────────────────┐
│  XIIM.lua                                   │
│  (Main Addon File)                          │
│  - Character Detection                      │
│  - Event Loop (d3d_present, packet_in)      │
│  - Inventory Change Tracking                │
│  - Settings Management                      │
│  - Webserver Lifecycle                      │
└──────────┬───────────────────────┬──────────┘
           │                       │
           ▼                       ▼
┌──────────────────────┐ ┌──────────────────────┐
│  modules/            │ │  web/                │
│  ├─ augments.lua     │ │  ├─ index.html       │
│  ├─ constants.lua    │ │  ├─ app.js           │
│  ├─ data.lua         │ │  └─ styles.css       │
│  ├─ inventory.lua    │ └──────────────────────┘
│  ├─ moveit.lua       │           │
│  ├─ sellit.lua       │           │
│  ├─ sortit.lua       │           │
│  └─ webserver.lua    │           │
└──────────┬───────────┘           │
           │                       │
           └───────────┬───────────┘
                       ▼
              ┌───────────────────┐
              │  HTTP/SSE         │
              │  localhost:11011  │
              └───────────────────┘
```

## Data Flow

### Inventory Synchronization Flow

```
1. Game Event (Item moved/acquired/deleted)
   ↓
2. packet_in event fires (0x01E, 0x01F, 0x020)
   ↓
3. mark_container_changed(container_id)
   ↓
4. save_pending = true, last_packet_time = now
   ↓
5. d3d_present event (every frame)
   ↓
6. Check: 2 seconds elapsed? save_pending?
   ↓
7. save_inventory_data_incremental()
   a. Load existing character data
   b. Get current inventory state
   c. Merge only changed containers
   d. Update equipment and gil
   e. Save to settings file
   ↓
8. broadcast_inventory_update()
   a. Scan all character folders
   b. Generate JSON for all characters
   c. Send SSE: "data: {json}\n\n"
   ↓
9. Browser EventSource receives update
   ↓
10. app.js updates UI with new data
```

### Item Movement Flow

```
1. User drags item in browser UI
   ↓
2. app.js sends POST /api/move
   {moves: [{count, srcCont, dstCont, srcSlot}]}
   ↓
3. webserver.lua receives request
   ↓
4. Calls handle_move_fn(moves)
   ↓
5. MoveService:Validate(req)
   a. Check count (1-255)
   b. Check containers exist
   c. Check source slot valid
   d. Check item exists
   e. Check item not locked/bazaar
   f. Check destination has space
   g. Check wardrobe equipment rules
   ↓
6. If valid: MoveService:Send(req)
   a. Build packet 0x029
   b. Inject via AddOutgoingPacket
   ↓
7. Game processes move
   ↓
8. packet_in fires (container update)
   ↓
9. Inventory sync flow (steps 3-8 above)
```

## Module Details

### Core Module (XIIM.lua)

Main addon orchestrator with character and inventory management.

**Key State:**
- `current_character`: Active character info (name, server_id, key)
- `changed_containers`: Set of modified container IDs
- `save_pending`: Flag for pending save operation
- `last_packet_time`: Timestamp of last inventory change

**Event Handlers:**
- `load`: Initialize webserver
- `unload`: Cleanup and save
- `d3d_present`: Main loop (save, heartbeat, webserver update)
- `packet_in`: Track inventory changes (0x01E, 0x01F, 0x020)
- `command`: Handle /xiim commands

**Inventory Change Tracking:**
- Packet 0x01E: Item count/bazaar update
- Packet 0x01F: Item deletion
- Packet 0x020: Item addition/update
- Incremental saves: Only changed containers + equipment/gil
- Zone detection: Skips save if containers empty (zoning)

**Heartbeat System:**
- Updates last_seen timestamp when AFK (>10 minutes)
- Prevents stale character status in multi-character view
- Lightweight update (no full inventory scan)

**Pending Operations System:**
- Queues operations (moves, sells, sorts) for offline characters
- When an operation targets a different character, creates a pending file
- File path: `config/addons/XIIM/{CharacterKey}/pending_{operation}.lua`
- When character logs in, checks for pending files and executes them
- Operations: `pending_moves.lua`, `pending_sells.lua`, `pending_sorts.lua`
- Prevents errors when managing inventory of logged-off characters

**Mog House Detection:**
- Tracks if current character is in mog house
- Blocks Safe container access when not in mog house
- State saved with character data (`in_mog_house` flag)
- Detects by zone name check

**Trash Items System:**
- Each character has a `trash_items` array in settings
- Tags items for bulk selling via "Sell Trash" button
- Preserved across saves with inventory data
- Managed via `/api/trash` endpoint

### Backend Modules

#### modules/constants.lua
Centralized constants and lookup tables.

**Container Definitions:**
- Maps container IDs (0-16) to names
- Verified container list for CatsEyeXI
- Includes all wardrobes (1-8), storage, locker, etc.

**Equipment Slots:**
- Maps slot IDs (0-15) to names
- Main/Sub/Range/Ammo/Armor slots

**Augment Paths:**
- Maps path bits (1-4) to letters (A/B/C/D)
- For Delve/Dynamis augment display

**Augment Lookup Tables:**
- `BASIC_AUGMENTS`: Oseem/Magian style (2048 entries)
- `DELVE_AUGMENTS`: Delve/Dynamis style
- Maps augment ID to stat definitions with offset/multiplier
- Supports multi-stat augments (HP+MP, etc.)

#### modules/augments.lua
Decodes binary augment data into human-readable strings.

**Augment Types:**
- **Type 2/3**: Augmented items (checks byte 1 of Extra data)
- **Delve** (flag 0x20): Path/Rank system with 5 slots
- **Dynamis** (flag 131): Same as Delve structure
- **Magian** (flag 0x40): 4 augment slots
- **Oseem** (default): 5 augment slots
- **Skipped**: Shield extdata (0x08), Evolith (0x80)

**Decode Process:**
1. Check Extra field (24 bytes minimum)
2. Identify augment type from flag byte (offset 2)
3. Parse path/rank (Delve) or slots (Oseem/Magian)
4. Extract augment ID (11 bits) and value (5 bits)
5. Lookup in constants table
6. Calculate final stat: `offset + (value * multiplier)`
7. Format with +/- signs and % suffixes

**Multi-Stat Example:**
```lua
[17] = { Multi=true, 
    [1] = { Stat='HP', Offset=1}, 
    [2] = { Stat='MP', Offset=1}
}
-- Value 5 → HP:+6, MP:+6
```

#### modules/data.lua
Handles all data serialization, file I/O, and format conversion.

**JSON Serialization:**
- `table_to_json()`: Lua table → JSON string
- Array detection logic (forces equipment/items as arrays)
- Escape sequences for special characters
- Recursive serialization with type detection

**JSON Deserialization:**
- `json_to_table()`: JSON string → Lua table
- Simple parser for arrays, objects, strings, numbers, booleans
- Handles nested structures
- Error handling with pcall

**Lua Serialization:**
- `table_to_lua()`: Lua table → Lua code string
- Deterministic key sorting (numbers before strings)
- Proper escaping and indentation
- For human-readable config export

**File Operations:**
- `load_character_settings()`: Load from `config/addons/XIIM/{key}/settings.lua`
- `save_character_settings()`: Save to settings file
- Auto-creates directory structure
- HTML file reading for webserver

**Character Discovery:**
- `scan_character_folders()`: Enumerate all character directories
- Returns array of {name, server_id, key}
- Validates settings files exist
- Debug logging support

#### modules/inventory.lua
Inventory scanning and item data extraction.

**Character Info:**
- `get_current_character_info()`: Name, server_id, key
- Zone check: Returns nil when zoning
- Validation: Non-empty name and valid server_id

**Inventory Scanning:**
- `get_inventory_data()`: Full inventory snapshot
- Equipment extraction (16 slots)
- Container iteration (all unlocked containers)
- Item data enrichment from resource manager

**Item Data Structure:**
```lua
{
    id = item.Id,
    name = itemData.Name[1],
    count = item.Count,
    flags = item.Flags,
    slot = slot,
    containerSlot = containerSlot,
    bazaar = item.Bazaar,
    
    -- Equipment only
    damage = itemData.Damage,
    delay = itemData.Delay,
    dps = (damage / delay) * 60,
    defense = itemData.Defense,
    
    -- Augments (if present)
    augments = {
        type = 'Delve',
        path = 'A',
        rank = 5,
        augments = {'HP:+50', 'Attack:+25'}
    }
}
```

**Gil Tracking:**
- Gil stored as special item (ID 65535)
- Separate field in data structure
- Not counted in currentCount

**Container Summary:**
- `scan_containers()`: Print container status
- Shows occupied/max for each container
- API endpoint display

#### modules/moveit.lua
Validated item movement via packet injection.

**MoveService Class:**
Object-oriented design with validation and packet building.

**Container Validation:**
- Verifies source and destination containers exist
- Checks containers are different
- Validates slot ranges (1 to GetContainerCountMax)

**Item Validation:**
- Item exists in source slot
- Item not locked/flagged/in bazaar
- Count within stack size (1-255)
- Destination has free slots

**Wardrobe Rules:**
- Wardrobes (8,10-16) only accept equipable items
- Checks resource Slots bitmask (≠0 = equipable)
- Rejects non-equipable items to wardrobes

**Packet Format (0x029):**
```
Bytes: 29 06 [seqLo seqHi] [count] 00 00 00 [srcCont] [dstCont] [srcSlot]
Size: 10 bytes total
```

**Sequence Number:**
- Starts at 0x0700
- Increments on each move
- Wraps at 0xFFFF → 0x0001

**Usage:**
```lua
local mover = MoveService.new({
    moveSeq = 0x0700,
    log = function(level, msg) print(msg) end
})

local ok, err = mover:Validate(request)
if ok then
    mover:Send(request)
end
```

#### modules/sellit.lua
Automated item selling to NPCs via packet injection.

**Purpose:**
- Sell multiple items to NPCs automatically
- Queue-based system processes one item at a time
- Rate-limited with 2-second delay between sales

**Key Functions:**
- `sellit.start_sell(item_names, character_key)` - Start sell operation
- `sellit.get_state()` - Get current sell progress
- `sellit.cancel()` - Cancel active sell operation
- `sellit.update()` - Process sell queue (called from main loop)

**Sell Process:**
1. Search inventory for item by name
2. Check if item is not Rare (flag 0x1000)
3. Send appraise packet (0x84) with item details
4. Send confirm sale packet (0x85)
5. Wait 2 seconds before next item
6. Remove sold item from queue

**Safety:**
- Only sells from Inventory container (ID 0)
- Blocks Rare items automatically
- Case-insensitive item name matching
- Tracks errors for items not found

**State Tracking:**
```lua
{
    isActive = true/false,
    itemsRemaining = number,
    errors = {array of error messages}
}
```

#### modules/sortit.lua
Container sorting via packet injection.

**Purpose:**
- Send sort packet (0x03A) to organize container contents
- Uses game's built-in sorting logic

**Packet Format (8 bytes):**
```
3A 04 [seqLo seqHi] [containerId] 00 00 00
```

**Key Functions:**
- `SortService.new(opts)` - Create sorter instance
- `sorter:Validate(containerId)` - Check if container ID is valid (0-255)
- `sorter:BuildPacket(containerId)` - Build sort packet
- `sorter:Send(containerId)` - Send sort command

**Sequence Number:**
- Starts at 0x0500
- Increments on each sort
- Wraps at 0xFFFF → 0x0001

**Usage:**
```lua
local sorter = SortService.new({
    sortSeq = 0x0500,
    log = function(level, msg) print(msg) end
})

sorter:Send(0) -- Sort Inventory container
```

#### modules/webserver.lua
HTTP server with SSE support for real-time updates.

**Server Ownership:**
- Single server instance per port (localhost:11011)
- First client to bind becomes owner
- Other clients act as guests (share data)

**Server States:**
- `is_server_owner=true`: Host server, handles requests
- `is_server_owner=false`: Guest client, notifies host of updates

**SSE (Server-Sent Events):**
- Long-lived HTTP connections for push notifications
- Format: `"data: {json}\n\n"`
- Auto-reconnect on disconnect
- Multiple clients supported

**API Endpoints:**

**GET /api/inventory**
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

**GET /api/events** (SSE)
- EventSource connection
- Sends updates on inventory changes
- Heartbeat every 30 seconds

**POST /api/move**
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

**GET /api/move/state**
```json
{
    "isMoving": true,
    "movesRemaining": 5
}
```

**POST /api/sell**
```json
{
    "character_key": "PlayerOne_123",
    "item_names": ["Copper Ore", "Bat Wing"]
}
```

**GET /api/sell/state**
```json
{
    "isActive": true,
    "itemsRemaining": 3,
    "errors": []
}
```

**POST /api/sort**
```json
{
    "character_key": "PlayerOne_123",
    "container_id": 0
}
```

**POST /api/trash**
```json
{
    "character_key": "PlayerOne_123",
    "trash_items": ["Old item", "Junk"]
}
```

**GET /** (Root)
- Serves index.html

**GET /app.js, /styles.css, /XIIM.png**
- Serves static assets from web/ and assets/

**Broadcast Flow:**
1. Guest saves inventory → notifies host via HTTP
2. Host detects change → calls broadcast_inventory_update()
3. Generates JSON for all characters
4. Sends to all connected SSE clients

**Failover:**
- Periodic check for server availability
- Guest can promote to owner if host disconnects
- Retry logic with timeout

### Frontend (Web UI)

#### web/index.html
Single-page application structure.

**Layout:**
- Header: Menu, title, character buttons, search/filter
- Content: Dynamic container rendering
- Tooltip: Hover item details
- Drag ghost: Visual feedback during drag
- Progress bar: Move operation status
- Context menu: Right-click actions

**Character Buttons:**
- Dynamically generated for each character
- Shows last online time
- Click to switch active character view

**Filter Panel:**
- Item level range (slider)
- Job flags (WAR, MNK, WHM, etc.)
- Race flags (Hume, Elvaan, Tarutaru, etc.)
- Skill types (Sword, Axe, Magic, etc.)
- Equipment slots (Head, Body, Hands, etc.)
- Duplicates toggle

**Context Menu:**
- Move to... (container selection)
- Consolidate (stack items)
- Set Bazaar Price
- Tag as Trash
- Wiki this... (bg-wiki.com lookup)
- Expand/Collapse All

#### web/app.js (2426 lines)
Frontend logic and UI interactions.

**State Management:**
```javascript
let allCharactersData = {};      // All character inventory
let activeCharacter = null;      // Currently displayed character
let selectedItems = [];          // Multi-select state
let bazaarItems = [];            // Bazaar price tracking
let trashItems = [];             // Trash tag list
let collapsedSections = new Set(); // UI collapse state
```

**SSE Connection:**
```javascript
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    allCharactersData = data;
    renderCharacterButtons();
    if (activeCharacter) renderInventory();
};
```

**Item Filtering:**
- Text search (name matching)
- Level range filtering
- Job/Race/Skill bitflag matching
- Equipment slot filtering
- Duplicate detection (multiple stacks)
- Combinable filter logic (AND/OR)

**Drag & Drop:**
- Drag threshold (5px) to distinguish from clicks
- Visual drag ghost with item icon/name
- Container drop zones
- Validation before move
- Progress bar during operation

**Item Rendering:**
- Dynamic grid layout
- Color-coded rarity borders
- Stack count badges
- Augment display
- HQ/Ex/Rare flags
- Equipment stats (damage, delay, DPS, defense)

**Tooltip System:**
- Rich item details
- Augment information
- Equipment stats
- Bazaar price display
- Screen edge detection (prevents off-screen)
- Mouse tracking

**Search & Filter:**
- Debounced search (instant feedback)
- Multiple filter criteria
- Clear all filters button
- Active filter badges
- Range sliders for level

**Context Menu:**
- Right-click detection
- Header vs item context
- Dynamic menu items
- Wiki integration (bg-wiki.com)
- Venture item detection (special wiki page)

**Progress Bar:**
- Move operation tracking
- Estimated time remaining
- Visual feedback (animated)
- Auto-hides on completion/error

#### web/styles.css (1164 lines)
Modern UI styling with CSS custom properties.

**Design System:**
```css
:root {
    --bg-primary: #0f172a;       /* Dark blue background */
    --bg-secondary: #1e293b99;   /* Translucent panels */
    --border-primary: #3b82f633; /* Subtle blue borders */
    --text-primary: #e2e8f0;     /* Light text */
    --blue: #3b82f6;             /* Accent color */
    --grid-gap: 6px;               /* Consistent spacing */
}
```

**Layout:**
- Flexbox for header
- CSS Grid for item containers
- Responsive design (dynamic columns)
- Fixed header with scrollable content

**Components:**
- Item cards with hover effects
- Rarity-based border colors
- Badge overlays (stack count, flags)
- Smooth transitions (0.2s ease)
- Glassmorphism effects (translucent panels)

**Animations:**
- Fade-in for content
- Slide-in for panels
- Progress bar fill animation
- Hover scale effects

**Accessibility:**
- High contrast text
- Clear focus states
- Readable font sizes
- Icon + text labels

## Event System

### load Event
Fires when addon loads.

**Tasks:**
1. Initialize webserver on port 11011
2. Set is_server_owner flag
3. Log server status

### unload Event
Fires when addon unloads.

**Tasks:**
1. Save final incremental update
2. Close webserver and SSE clients
3. Log shutdown

### d3d_present Event
Fires every frame (~60 FPS).

**Tasks:**
1. Check character info every 60 frames (~1 second)
2. Heartbeat update (last_seen) every 600 frames (~10 minutes)
3. Incremental save (2 second debounce after packet)
4. Webserver update (check for connections)

**Performance:**
- Early returns for invalid states
- Debounced saves (not every frame)
- Efficient packet checking

### packet_in Event
Fires on incoming game packets.

**Tracked Packets:**
- **0x01E** (Item Count/Bazaar Update): Container item modified
- **0x01F** (Item Delete): Item removed from container
- **0x020** (Item Update): Item added or modified

**Container ID Extraction:**
- Packet ID 0x01E: bytes 5-6 (index), calculate container
- Packet ID 0x01F: byte 5 (container ID directly)
- Packet ID 0x020: bytes 5-6 (index), calculate container

**Change Tracking:**
1. Extract container ID from packet
2. Mark container as changed
3. Set save_pending flag
4. Update last_packet_time
5. Wait for 2-second quiet period
6. Trigger incremental save

### command Event
Fires on chat commands.

**Commands:**
- `/xiim scan`   - Display container summary
- `/xiim debug`  - Toggle debug mode
- `/xiim reload` - Reload addon

## Settings System

Uses Ashita's settings module for Lua-based persistence.

**File Structure:**
```
config/addons/XIIM/{CharacterName}_{ServerID}/settings.lua
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
        ["Inventory"] = {
            ["id"] = 0,
            ["maxSize"] = 80,
            ["currentCount"] = 45,
            ["items"] = {...}
        }
    }
}
```

**Loading:**
1. Detect character (name + server_id)
2. Build key: `{name}_{server_id}`
3. Load settings file
4. Merge with defaults
5. Return character data

**Saving:**
1. Generate Lua table string
2. Write to settings file
3. Create directories if needed
4. Atomic write (open, write, close)

**Incremental Saves:**
- Only modified containers are updated
- Equipment and gil always updated
- Timestamp refreshed
- Zone detection prevents empty saves

## Data Structures

### Character Data
```lua
{
    character_name = "PlayerOne",
    server_id = 123,
    last_updated = 1706000000,  -- Unix timestamp
    last_seen = 1706000000,     -- Unix timestamp (for activity tracking)
    is_online = true,           -- Boolean (currently logged in)
    in_mog_house = false,       -- Boolean (in mog house)
    gil = 1500000,
    trash_items = {             -- Array of item names tagged as trash
        "Copper Ore",
        "Bat Wing"
    },
    equipment = {
        {
            id = 16769,
            name = "Hume RSE",
            slot = "Body",
            containerSlot = 5,
            -- ... stats, augments
        }
    },
    containers = {
        Inventory = {
            id = 0,
            maxSize = 80,
            currentCount = 45,
            items = [...]
        }
    }
}
```

### Item Data
```lua
{
    id = 4096,
    name = "Cure IV",
    count = 12,
    flags = 0,
    slot = 9,
    containerSlot = "9",
    bazaar = 0,
    
    -- Optional: Equipment stats
    damage = 50,
    delay = 240,
    dps = 12.5,
    defense = 25,
    
    -- Optional: Augments
    augments = {
        type = "Delve",
        path = "A",
        rank = 5,
        augments = {"HP:+50", "Attack:+25"}
    },
    
    -- Optional: Description
    Description = "Restores 500 HP."
}
```

### Augment Data
```lua
{
    type = "Delve",        -- or "Oseem", "Magian", "Dynamis"
    path = "A",            -- A/B/C/D (Delve only)
    rank = 5,              -- 0-15 (Delve only)
    augments = {
        "HP:+50",
        "Attack:+25",
        "Accuracy:+10"
    }
}
```

## Performance Considerations

### Frame Budget
- Main loop runs every frame (60 FPS)
- Early returns for idle states
- Debounced saves (2 second delay)
- Async webserver checks (non-blocking)

### Memory Management
- Character data cached in memory
- Incremental updates (not full scans)
- SSE clients stored in array
- Cleanup on disconnect

### Network Optimization
- SSE for push updates (no polling)
- JSON compression via minification
- Single broadcast to all clients
- Heartbeat to detect stale connections

### Storage Efficiency
- Per-character settings files
- Lua format for readability
- JSON for API responses
- Only modified data saved

## Error Handling

### Validation Layers
1. **Lua Module**: Type checking, nil safety
2. **MoveService**: Item movement rules
3. **Webserver**: Request validation
4. **Frontend**: UI validation

### Error Recovery
- Graceful degradation on invalid data
- Fallback to default settings
- Error logging with context
- User-friendly error messages

### Nil Safety
All functions check for nil values:
```lua
if not item or not item.Extra then return nil end
if not char_data or not char_data.containers then return end
```

## Security Considerations

### Local Only
- Server binds to localhost (127.0.0.1)
- No external network access
- Port 11011 not exposed

### Input Validation
- Packet size limits
- JSON parsing error handling
- Container ID whitelist
- Slot range validation

### Safe File I/O
- Directory creation checks
- File existence validation
- Atomic writes
- Error handling on read/write

## Extensibility

### Adding New Container Types
1. Add to `constants.CONTAINERS`
2. No code changes needed (dynamic)

### Adding New Augment Types
1. Add entries to `constants.BASIC_AUGMENTS` or `DELVE_AUGMENTS`
2. Update `augments.lua` decode logic if structure differs
3. Test with sample items

### Adding New API Endpoints
1. Add route handler in `webserver.lua`
2. Update `web/app.js` to call endpoint
3. Document response format

### Adding New UI Features
1. Update `web/index.html` structure
2. Add logic to `web/app.js`
3. Style in `web/styles.css`
4. Connect to API if needed

## Testing Strategies

### Manual Testing
- Multiple characters (verify isolation)
- All container types (inventory, wardrobes, storage)
- Item movement (normal, wardrobe, locked)
- Augmented items (all types)
- Zone transitions (no corrupt saves)
- Multiple clients (SSE sync)

### Edge Cases
- Empty containers
- Full containers
- Locked/bazaar items
- Augmented items without Extra field
- Zone during save
- Server disconnect
- Malformed packets

## Known Limitations

- **Single Server**: Only one Ashita instance can host (first to bind)
- **Localhost Only**: No remote access (by design)
- **CatsEyeXI Specific**: Container IDs may differ on other servers
- **No Transaction Safety**: Concurrent moves not queued
- **Limited Augment Support**: Only Delve, Oseem, Magian styles
