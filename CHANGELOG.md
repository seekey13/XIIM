# Changelog

All notable changes to XIIM (XI Item Manager) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0] - 2026-02-22

### Added
- **Modular Architecture**: Reorganized codebase with logical directory structure
  - `modules/` directory for all backend Lua modules
  - `web/` directory for all frontend files (HTML, CSS, JS)
  - `assets/` directory for images and resources
  - Cleaner separation between backend, frontend, and assets
- **Updated Module Paths**: All `require()` statements now use `modules.` prefix for better organization
- **Cleaned Project Structure**: Removed unused `lib/` folder
- **Multi-Character Support**: View and manage inventory across multiple characters
  - Automatic character detection via name and server ID
  - Per-character settings persistence in `config/addons/XIIM/{CharacterName}_{ServerID}/`
  - Character switching buttons in web UI
  - Last online timestamp tracking
- **Real-Time Updates**: Server-Sent Events (SSE) for instant inventory synchronization
  - EventSource connection to `/api/events` endpoint
  - Automatic updates when any character's inventory changes
  - Heartbeat system to detect stale connections
- **Incremental Saves**: Optimized inventory saving with change tracking
  - Only modified containers are saved (not full inventory)
  - 2-second debounce to batch rapid changes
  - Zone detection to prevent corrupt saves during zoning
- **Item Movement Validation**: MoveService module with comprehensive validation
  - Container existence checks
  - Slot range validation
  - Item lock/bazaar detection
  - Wardrobe equipment rules (only equipable items)
  - Stack count validation (1-255)
  - Destination capacity checks
- **Web-Based UI**: Modern browser interface for inventory management
  - Dynamic character buttons with last online time
  - Container-based view with collapsible sections
  - Item tooltips with full details (stats, augments, description)
  - Drag & drop item movement
  - Context menu for item actions
  - Progress bar for move operations
- **Core Inventory Scanning**: Read all container and equipment data
  - Supports all containers: Inventory, Safe, Storage, Locker, Satchel, Sack, Case, Wardrobes 1-8
  - Equipment slot scanning (Main/Sub/Range/Ammo/Head/Body/Hands/Legs/Feet/Neck/Waist/Ears/Rings/Back)
  - Gil tracking via special item ID (65535)
  - Item data enrichment from resource manager (name, description, stats)
- **Augment Decoding**: Read and decode augmented item data
  - **Delve/Dynamis Style**: Path (A/B/C/D), Rank (0-15), 5 augment slots
  - **Oseem Style**: 5 augment slots with 11-bit ID and 5-bit value
  - **Magian Style**: 4 augment slots (trial weapons)
  - Multi-stat augment support (HP+MP combinations)
  - Offset and multiplier calculations for final stat values
- **Data Serialization**: Lua and JSON format support
  - `table_to_lua()`: Human-readable Lua config files
  - `table_to_json()`: API responses for web UI
  - `json_to_table()`: Parse move requests from frontend
  - Array detection logic for proper JSON structure
  - Recursive serialization with type safety
- **Settings Persistence**: Per-character configuration files
  - Automatic directory creation: `config/addons/XIIM/{CharacterName}_{ServerID}/`
  - Lua-based settings for readability and hand-editing
  - Character folder scanning for multi-character discovery
  - Load/save with merge logic for defaults
- **HTTP Webserver**: Embedded HTTP server on localhost:11011
  - LuaSocket-based implementation
  - Non-blocking socket operations (settimeout 0)
  - Static file serving (HTML, CSS, JS, PNG)
  - RESTful API endpoints
- **API Endpoints**: 
  - `GET /` - Serve main UI (index.html)
  - `GET /api/inventory` - JSON inventory data for all characters
  - `POST /api/move` - Item movement requests
  - `GET /api/events` - Server-Sent Events for real-time updates
  - `GET /app.js` - JavaScript application
  - `GET /styles.css` - Stylesheet
  - `GET /XIIM.png` - Application icon
- **Frontend Application**: Single-page web interface
  - Item grid layout with container sections
  - Search and filter functionality (name, level, job, race, skill, slot)
  - Tooltips with item details
  - Drag & drop item movement
  - Context menu for actions
- **Constants and Lookups**: Centralized configuration
  - Container definitions (IDs and names)
  - Equipment slot mappings
  - Augment path definitions (A/B/C/D)
  - Basic augments lookup table (2048 entries)
  - Delve augments lookup table
- **Character Detection**: Identify current player
  - Party manager integration for name and server ID
  - Zone check to prevent reading during transitions
  - Character key generation: `{name}_{server_id}`
- **Sellit Module**: Automated item selling to NPCs
  - Queue-based system with 2-second delay between sales
  - Searches inventory by item name (case-insensitive)
  - Blocks NoSale Flag items automatically
  - Sends appraise (0x84) and confirm (0x85) packets
  - `/api/sell` endpoint for bulk selling
  - `/api/sell/state` endpoint for progress tracking
- **Sortit Module**: Container sorting via packet injection
  - Sends sort packet (0x03A) to organize container contents
  - Uses game's built-in sorting logic
  - `/api/sort` endpoint for sorting containers
  - Works with all container types
- **Mog House Detection**: Track character location
  - Detects when character enters/exits mog house
  - Blocks Safe container access when not in mog house
  - State saved with character data (`in_mog_house` flag)
- **Trash Items System**: Tag items for bulk selling
  - Each character has `trash_items` array in settings
  - "Sell Trash" button in UI to sell all tagged items
  - `/api/trash` endpoint to update trash item list
  - Preserved across sessions
- **Item Locking During Operations**: Visual feedback for busy items
  - Items being moved show as locked in UI
  - Items being sold show as locked in UI
  - Prevents double-operations on same item
  - Automatic unlock when operation completes
- **Enhanced Progress Tracking**: Better user feedback
  - Progress bars show move and sell operations
  - Estimated time remaining display
  - Error reporting for failed operations
  - Blocks new operations while one is running
- **Custom Item Images**: Support for venture items
  - Maps venture items to special images
  - Custom wiki links for venture content
  - Image paths documented in comments
- **Webserver Asset Paths**: Updated all static file serving paths to use new directory structure
- **Packet-Based Change Tracking**: Monitor inventory changes via game packets
  - Packet 0x01E: Item count/bazaar update
  - Packet 0x01F: Item deletion
  - Packet 0x020: Item addition/update
  - Automatic container ID extraction and tracking
- **Server Architecture**: Single-instance webserver with guest client support
  - First client to bind port becomes owner
  - Additional clients act as guests (share data)
  - Automatic failover if owner disconnects
  - Guest notification system via HTTP requests

### Technical
- All module require paths updated from `require('module')` to `require('modules.module')`
- Webserver file paths updated: `addons\\XIIM\\web\\*` and `addons\\XIIM\\assets\\*`
- Maintained backward compatibility with existing settings files
- Introduced `changed_containers` set for tracking modified containers
- Added `save_pending` flag and `last_packet_time` for debounced saves
- Implemented `mark_container_changed()` for packet-based tracking
- Created `save_inventory_data_incremental()` for optimized saves
- Added `broadcast_inventory_update()` for SSE push notifications
- Server ownership flag `is_server_owner` for multi-client coordination
- Ashita v4 compatibility
- LuaSocket for HTTP server
- Event-driven architecture (load, unload, d3d_present, packet_in, command)
- Modular design with separate files for each concern
- Generic pending operation system with `queue_pending_operation()` and `check_pending_operation()`
- Character routing for all API requests via `character_key` parameter
- CORS support with OPTIONS method handling
- Debounce protection for UI button states during operations
- Item locking mechanism prevents concurrent operations on same item

## Version History Summary

**1.0** (2026-02-22): First official release with complete inventory management

---

## Contributing

Please read [ARCHITECTURE.md](ARCHITECTURE.md) for details on the codebase structure and design decisions.

## License

See [LICENSE](LICENSE) file for details.
