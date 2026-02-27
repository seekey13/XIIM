--[[
XIIM - XI Item Manager
Copyright (c) 2025 Seekey & Commandobill
https://github.com/seekey13/XIIM

This addon is designed for Ashita v4 and the CatsEyeXI private server.
]]--

addon.name      = 'XIIM'
addon.author    = 'Seekey & Commandobill'
addon.version   = '1.0'
addon.desc      = 'XI Item Manager'
addon.link      = 'https://github.com/seekey13/XIIM'

require('common')
local chat = require('chat')
local settings = require('settings')

-- Load XIIM modules
local constants = require('modules.constants')
local data = require('modules.data')
local inventory = require('modules.inventory')
local webserver = require('modules.webserver')
local MoveService = require('modules.moveit')
local sellit = require('modules.sellit')
local SortService = require('modules.sortit')

-- Server configuration
local port = 11011

-- Default settings structure
local default_settings = T{
    character_name = '',
    server_id = 0,
    last_updated = 0,
    gil = 0,
    equipment = T{},
    containers = T{},
    trash_items = T{} -- Array of item names tagged as trash
}

-- Current character info
local current_character = {
    name = '',
    server_id = 0,
    key = '', -- CharacterName_ServerID
    in_mog_house = false
}

-- Debug mode flag
local debug_mode = false

-- Move state tracking
local move_state = {
    isMoving = false,
    errors = {}
}

-- MoveService instance
local mover = nil

-- SortService instance
local sorter = nil

-- Heartbeat timer
local last_heartbeat = 0

-- Pending moves check timer
local last_pending_check = 0

-- Change tracking for incremental updates
local changed_containers = {}
local save_pending = false
local last_packet_time = 0
local all_characters_cache = nil
local all_characters_cache_time = 0
local all_characters_cache_ttl = 5

-- Forward declaration for circular dependency
local broadcast_inventory_update

-- Update only last_seen timestamp (lightweight heartbeat)
local function update_last_seen()
    if not current_character.key or current_character.key == '' then
        return
    end
    
    -- Load existing data
    local char_data = data.load_character_settings(current_character.key, debug_mode)
    if char_data then
        -- Only update last_seen timestamp
        char_data.last_seen = os.time()
        data.save_character_settings(current_character.key, char_data)
        
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Updated last_seen timestamp')))
        end
    end
end

-- Mark a container as changed
local function mark_container_changed(container_id)
    if type(container_id) ~= 'number' then
        return
    end

    -- Only track real storage containers. (Observed 17 during drop)
    if container_id < 0 or container_id > 16 then
        return
    end

    changed_containers[container_id] = true
    save_pending = true
    last_packet_time = os.time()
end

-- ───────────────────────── Pending Operations Helpers ─────────────────────────

-- Generic function to queue a pending operation for a different character
local function queue_pending_operation(operation_type, character_key, operation_data, current_key)
    local pending_path = string.format('%sconfig\\addons\\XIIM\\%s\\pending_%s.lua',
        AshitaCore:GetInstallPath(), character_key, operation_type)
    
    print(chat.header(addon.name):append(chat.message(string.format(
        'Queueing %s for %s (current: %s)', operation_type, character_key, current_key))))
    
    -- Create pending data structure
    local pending_data = {
        timestamp = os.time(),
        data = operation_data
    }
    
    -- Save pending operation file
    local success, err = pcall(function()
        local file = io.open(pending_path, 'w')
        if file then
            file:write('return ' .. data.table_to_lua(pending_data))
            file:close()
            return true
        else
            error('Failed to open file for writing')
        end
    end)
    
    if success then
        return {
            success = true,
            message = string.format('%s queued for %s', operation_type, character_key)
        }
    else
        local error_msg = string.format('Failed to queue %s: %s', operation_type, tostring(err))
        print(chat.header(addon.name):append(chat.error(error_msg)))
        return {
            success = false,
            error = error_msg
        }
    end
end

-- Generic function to check for and execute pending operations
local function check_pending_operation(operation_type, validator_fn, executor_fn)
    if not current_character.key or current_character.key == '' then
        return
    end
    
    -- Call optional validator (e.g., check if already busy)
    if validator_fn and not validator_fn() then
        return
    end
    
    local pending_path = string.format('%sconfig\\addons\\XIIM\\%s\\pending_%s.lua',
        AshitaCore:GetInstallPath(), current_character.key, operation_type)
    
    -- Check if pending file exists
    local file = io.open(pending_path, 'r')
    if not file then
        return -- No pending operation
    end
    file:close()
    
    if debug_mode then
        print(chat.header(addon.name):append(chat.message(string.format('Found pending %s file!', operation_type))))
    end
    
    -- Load pending operation data
    local success, pending_data = pcall(function()
        local loadfunc = load or loadstring
        local file_handle = io.open(pending_path, 'r')
        local content = file_handle:read('*all')
        file_handle:close()
        local func = loadfunc(content)
        return func()
    end)
    
    if not success or not pending_data or not pending_data.data then
        -- Invalid or corrupted pending file, delete it
        print(chat.header(addon.name):append(chat.error(string.format('Invalid pending %s file, deleting', operation_type))))
        os.remove(pending_path)
        return
    end
    
    print(chat.header(addon.name):append(chat.message(string.format('Executing queued %s', operation_type))))
    
    -- Delete pending file before executing
    os.remove(pending_path)
    
    -- Execute the operation
    executor_fn(pending_data.data)
end

-- Forward declaration
local save_inventory_data

-- Save only changed containers (incremental update, no full scan)
local function save_inventory_data_incremental()
    if not save_pending then
        return
    end

    -- Refresh character info before saving (preserve in_mog_house state)
    local char_info = inventory.get_current_character_info()
    if char_info then
        char_info.in_mog_house = current_character.in_mog_house
        current_character = char_info
    end

    -- Load existing data
    local char_data = data.load_character_settings(current_character.key, debug_mode)
    if not char_data then
        -- First time save, do a full save once
        save_inventory_data()
        changed_containers = {}
        save_pending = false
        return
    end

    if not char_data.containers then
        char_data.containers = {}
    end

    -- Helper: container_id -> container_name
    local function resolve_container_name(container_id)
        local c = constants.CONTAINERS[container_id]
        return c and c.name or nil
    end

    local updated = false
    local any_valid_data = false

    -- Update only the changed containers
    for container_id in pairs(changed_containers) do
        local container_name = resolve_container_name(container_id)
        if container_name then
            local container_payload = inventory.get_container_data(container_id, config, debug_mode, current_character)

            -- get_container_data should return:
            -- { id=container_id, maxSize=..., currentCount=..., items={...} }
            if container_payload and container_payload.items then
                if #container_payload.items > 0 then
                    any_valid_data = true
                end

                char_data.containers[container_name] = container_payload
                updated = true

                if debug_mode then
                    print(chat.header(addon.name):append(chat.message('Updated container: ' .. container_name)))
                end
            end
        end
    end

    -- If everything we scanned is empty, treat as invalid (usually zoning or inventory not ready)
    if updated and not any_valid_data then
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Changed containers empty, skipping save (likely zoning or inventory not ready)')))
        end
        changed_containers = {}
        save_pending = false
        return
    end

    if updated then
        -- Preserve trash_items
        if not char_data.trash_items then
            char_data.trash_items = {}
        end

        -- Metadata
        char_data.last_seen = os.time()
        char_data.is_online = true
        char_data.in_mog_house = current_character.in_mog_house

        local saved = data.save_character_settings(current_character.key, char_data)

        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Incremental save: ' .. tostring(saved))))
            print(chat.header(addon.name):append(chat.message('Is server owner: ' .. tostring(webserver.is_server_owner))))
            print(chat.header(addon.name):append(chat.message('SSE clients: ' .. tostring(#webserver.sse_clients))))
        end

        -- Broadcasting (you can later replace with container-specific SSE events)
        if webserver.is_server_owner then
            if debug_mode then
                print(chat.header(addon.name):append(chat.message('Broadcasting inventory update...')))
            end
            broadcast_inventory_update()
        else
            if debug_mode then
                print(chat.header(addon.name):append(chat.message('Notifying host of update...')))
            end
            webserver.notify_host_update(port, debug_mode, addon.name, chat)
        end
    end

    changed_containers = {}
    save_pending = false
end

-- Get all characters data for API
local function get_all_characters_data(force_refresh)
    local current_time = os.time()
    if not force_refresh and all_characters_cache and (current_time - all_characters_cache_time) < all_characters_cache_ttl then
        return all_characters_cache
    end

    if debug_mode then
        print(chat.header(addon.name):append(chat.message('=== API REQUEST: Getting all character data ===')))
    end
    local all_data = {}
    local characters = data.scan_character_folders(debug_mode)
    
    if debug_mode then
        print(chat.header(addon.name):append(chat.message('Found ' .. #characters .. ' character folders')))
    end
    
    for _, char in ipairs(characters) do
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Loading data for: ' .. char.key)))
        end
        local char_data = data.load_character_settings(char.key, debug_mode)
        if char_data then
            if debug_mode then
                print(chat.header(addon.name):append(chat.message('Successfully loaded ' .. char.key)))
            end
            -- Check if character is online (last_seen within 30 seconds)
            -- But respect explicit is_online=false if set (e.g., clean logout)
            local last_seen = char_data.last_seen or 0
            if char_data.is_online ~= false then
                -- Only calculate online status from timestamp if not explicitly offline
                char_data.is_online = (current_time - last_seen) < 30
            end
            all_data[char.key] = char_data
        else
            if debug_mode then
                print(chat.header(addon.name):append(chat.error('Failed to load ' .. char.key)))
            end
        end
    end
    
    if debug_mode then
        -- Count keys in hash table
        local count = 0
        for _ in pairs(all_data) do count = count + 1 end
        print(chat.header(addon.name):append(chat.message('Total characters in API response: ' .. count)))
        print(chat.header(addon.name):append(chat.message('=== END API REQUEST ===')))
    end

    all_characters_cache = all_data
    all_characters_cache_time = current_time
    return all_data
end

-- Broadcast wrapper function
broadcast_inventory_update = function()
    webserver.broadcast_inventory_update(
        function()
            return get_all_characters_data(true)
        end,
        data.table_to_json,
        debug_mode,
        addon.name,
        chat
    )
end

-- Handle move request from API
local function handle_move_request(character_key, moves)
    if move_state.isMoving then
        return {
            success = false,
            error = 'Move operation already in progress',
            errors = {}
        }
    end
    
    if not moves or type(moves) ~= 'table' or #moves == 0 then
        return {
            success = false,
            error = 'Invalid move request: must be a non-empty array',
            errors = {}
        }
    end
    
    -- Check if this move request is for a different character
    if character_key and character_key ~= current_character.key then
        local result = queue_pending_operation('moves', character_key, moves, current_character.key)
        -- Add errors array for consistency with move responses
        result.errors = {}
        return result
    end
    
    -- This move is for the current character - execute immediately
    
    -- Initialize MoveService if needed
    if not mover then
        mover = MoveService.new({
            moveSeq = 0x0700,
            log = function(level, msg)
                if level == 'error' then
                    print(chat.header(addon.name):append(chat.error(msg)))
                else
                    print(chat.header(addon.name):append(chat.message(msg)))
                end
            end
        })
    end
    
    -- Set moving state
    move_state.isMoving = true
    move_state.errors = {}
    
    -- Debug: log received moves
    if debug_mode then
        print(chat.header(addon.name):append(chat.message(string.format('Received %d move(s)', #moves))))
        for i, move in ipairs(moves) do
            print(chat.header(addon.name):append(chat.message(string.format(
                'Move %d: count=%s srcCont=%s dstCont=%s srcSlot=%s',
                i,
                tostring(move.count),
                tostring(move.srcCont),
                tostring(move.dstCont),
                tostring(move.srcSlot)
            ))))
        end
    end
    
    -- Process moves sequentially with 2-second delay
    ashita.tasks.once(0, function()
        for i, move in ipairs(moves) do
            -- Validate required fields
            if not move.count or not move.srcCont or not move.dstCont or not move.srcSlot then
                local err = string.format('Move %d: Missing required fields (count=%s, srcCont=%s, dstCont=%s, srcSlot=%s)', 
                    i, tostring(move.count), tostring(move.srcCont), tostring(move.dstCont), tostring(move.srcSlot))
                table.insert(move_state.errors, err)
                print(chat.header(addon.name):append(chat.error(err)))
            else
                -- Send the move
                local ok, err = mover:Send({
                    count = move.count,
                    srcCont = move.srcCont,
                    dstCont = move.dstCont,
                    srcSlot = move.srcSlot
                })
                
                if not ok then
                    local err_msg = string.format('Move %d failed: %s', i, err or 'unknown error')
                    table.insert(move_state.errors, err_msg)
                    print(chat.header(addon.name):append(chat.error(err_msg)))
                end
            end
            
            -- Wait 2 seconds before next move (except for last one)
            if i < #moves then
                coroutine.sleep(2)
            end
        end
        
        -- All moves complete
        move_state.isMoving = false
        
        -- Broadcast inventory update after moves
        ashita.tasks.once(1, function()
            if webserver.is_server_owner then
                broadcast_inventory_update()
            else
                webserver.notify_host_update(port, debug_mode, addon.name, chat)
            end
        end)
        
        if debug_mode then
            print(chat.header(addon.name):append(chat.message(string.format('Move operation complete. Errors: %d', #move_state.errors))))
        end
    end)
    
    -- Return immediately (moves are processing async)
    return {
        success = true,
        message = string.format('Processing %d move(s)', #moves),
        errors = {}
    }
end

-- Check for and execute pending moves for this character
local function check_pending_moves()
    check_pending_operation('moves', 
        function()
            -- Don't check if already moving
            return not move_state.isMoving
        end,
        function(moves)
            handle_move_request(current_character.key, moves)
        end
    )
end

-- Get current move state
local function get_move_state()
    return {
        isMoving = move_state.isMoving,
        errors = move_state.errors
    }
end

-- Handle sell request from API
local function handle_sell_request(character_key, item_names)
    -- Check if this sell request is for a different character
    if character_key and character_key ~= current_character.key then
        local result = queue_pending_operation('sells', character_key, item_names, current_character.key)
        -- Add errors array for consistency with sell responses
        result.errors = {}
        return result
    end
    
    -- This sell is for the current character - execute immediately
    return sellit.start_sell(item_names, character_key, debug_mode, addon.name, chat)
end

-- Check for and execute pending sells for this character
local function check_pending_sells()
    check_pending_operation('sells',
        function()
            -- Don't check if already selling
            return not sellit.get_state().isActive
        end,
        function(item_names)
            handle_sell_request(current_character.key, item_names)
        end
    )
end

-- Get current sell state
local function get_sell_state()
    return sellit.get_state()
end

-- Handle sort request from API
local function handle_sort_request(character_key, container_id)
    -- Validate container_id
    if not container_id or type(container_id) ~= 'number' then
        return {
            success = false,
            error = 'Invalid container_id: must be a number'
        }
    end
    
    -- Check if this sort request is for a different character
    if character_key and character_key ~= current_character.key then
        return queue_pending_operation('sorts', character_key, container_id, current_character.key)
    end
    
    -- This sort is for the current character - execute immediately
    
    -- Initialize SortService if needed
    if not sorter then
        sorter = SortService.new({
            sortSeq = 0x0500,
            log = function(level, msg)
                if level == 'error' then
                    print(chat.header(addon.name):append(chat.error(msg)))
                else
                    print(chat.header(addon.name):append(chat.message(msg)))
                end
            end
        })
    end
    
    -- Send the sort packet
    local ok, err = sorter:Send(container_id)
    
    if not ok then
        print(chat.header(addon.name):append(chat.error(string.format('Sort failed: %s', err or 'unknown error'))))
        return {
            success = false,
            error = err or 'Sort failed'
        }
    end
    
    print(chat.header(addon.name):append(chat.message(string.format('Sort container %d', container_id))))
    
    return {
        success = true,
        message = string.format('Sort container %d', container_id)
    }
end

-- Check for and execute pending sorts for this character
local function check_pending_sorts()
    check_pending_operation('sorts',
        nil, -- No validator - sorts can always execute
        function(container_id)
            handle_sort_request(current_character.key, container_id)
        end
    )
end

-- Save inventory data to settings
save_inventory_data = function()
    -- Refresh character info before saving (preserve in_mog_house state)
    local char_info = inventory.get_current_character_info()
    if char_info then
        char_info.in_mog_house = current_character.in_mog_house
        current_character = char_info
    end
    
    local inv_data = inventory.get_inventory_data(config, debug_mode, current_character)
    if inv_data then
        -- Count total items across all containers to detect empty inventory
        local total_items = 0
        for _, container in pairs(inv_data.containers) do
            total_items = total_items + #container.items
        end
        
        -- Discard updates that would clear the inventory (zoning state)
        if total_items == 0 then
            if debug_mode then
                print(chat.header(addon.name):append(chat.message('Empty inventory detected, skipping save (likely zoning)')))
            end
            return
        end
        
        -- Load existing data to preserve trash_items
        local existing_data = data.load_character_settings(current_character.key, debug_mode)
        if existing_data and existing_data.trash_items then
            inv_data.trash_items = existing_data.trash_items
        else
            inv_data.trash_items = {}
        end
        
        -- Add last_seen timestamp for online detection
        inv_data.last_seen = os.time()
        inv_data.in_mog_house = current_character.in_mog_house
        local saved = data.save_character_settings(current_character.key, inv_data)
        
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Inventory saved: ' .. tostring(saved))))
        end
        
        -- Always broadcast, even if save failed
        if webserver.is_server_owner then
            broadcast_inventory_update()
        else
            webserver.notify_host_update(port, debug_mode, addon.name, chat)
        end
    else
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('No inventory data to save')))
        end
    end
end

-- Addon load event
ashita.events.register('load', 'xiim_load', function()
    -- Try to start webserver
    webserver.init(port, addon.name, chat)
    
    -- Delay character detection
    ashita.tasks.once(3, function()
        local char_info = inventory.get_current_character_info()
        if char_info then
            current_character = char_info
            print(chat.header(addon.name):append(chat.message(string.format('Tracking character: %s (%d)', 
                current_character.name, current_character.server_id))))
            
            -- Initial save to mark character as online immediately
            save_inventory_data()
        end
        
        inventory.scan_containers(constants, port)
    end)
end)

-- Addon unload event
ashita.events.register('unload', 'xiim_unload', function()
    -- Set offline status immediately while preserving last_seen timestamp
    if current_character.key and current_character.key ~= '' then
        local char_data = data.load_character_settings(current_character.key, debug_mode)
        if char_data then
            char_data.is_online = false  -- Explicitly set offline status
            -- Keep last_seen as-is for tooltip display
            data.save_character_settings(current_character.key, char_data)
            
            -- Notify web clients of the update
            if webserver.is_server_owner then
                broadcast_inventory_update()
            else
                webserver.notify_host_update(port, debug_mode, addon.name, chat)
            end
        end
    end
    
    webserver.cleanup(addon.name, chat)
end)

-- Webserver handlers table (built once; functions are all defined above)
local webserver_handlers = {
    get_all_characters = get_all_characters_data,
    table_to_json      = data.table_to_json,
    read_html          = data.read_html_file,
    handle_move        = handle_move_request,
    get_move_state     = get_move_state,
    handle_sell        = handle_sell_request,
    get_sell_state     = get_sell_state,
    handle_sort        = handle_sort_request,
}

-- Render loop for non-blocking socket checks
ashita.events.register('d3d_present', 'xiim_present', function()
    webserver.update(webserver_handlers, port, debug_mode, addon.name, chat)
    
    local current_time = os.time()
    
    -- Process pending incremental saves (debounced by 2 seconds)
    if save_pending and (current_time - last_packet_time) >= 2 then
        save_inventory_data_incremental()
    end
    
    -- Check for pending moves, sells, and sorts every 2 seconds
    if current_time - last_pending_check >= 2 then
        last_pending_check = current_time
        check_pending_moves()
        check_pending_sells()
        check_pending_sorts()
    end
    
    -- Update sellit module
    sellit.update(debug_mode, addon.name, chat)
    
    -- Update last_seen every 10 seconds for online detection and failover check
    if current_time - last_heartbeat >= 10 then
        last_heartbeat = current_time
        if current_character and current_character.key and current_character.key ~= '' then
            update_last_seen()
        end
        
        -- Try to become server owner if we're not already (failover mechanism)
        -- Do this in the 10-second heartbeat to avoid performance impact
        if not webserver.is_server_owner and current_time - webserver.last_server_retry >= 30 then
            webserver.last_server_retry = current_time
            webserver.try_become_owner(port, addon.name, chat)
        end
    end
end)

-- Outgoing packet event (for sellit shop detection)
ashita.events.register('packet_out', 'xiim_packet_out', function(e)
    if e.id == 0x28 then
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Item Dropped - Update Inventory')))
        end
        mark_container_changed(0)
    end
    if e.id == 0x29 then
        local srcCont = string.byte(e.data, 9)
        local dstCont = string.byte(e.data, 10)
        if debug_mode then
            print(chat.header(addon.name):append(chat.message(string.format('Move packet -> srcCont=%d dstCont=%d', srcCont, dstCont))))
        end
        mark_container_changed(srcCont)
        mark_container_changed(dstCont)
    end
    if e.id == 0x33 then
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Trade Complete - Update Inventory')))
        end
        mark_container_changed(0)
    end
    if e.id == 0x85 then
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Item Sold - Update Inventory')))
        end
        mark_container_changed(0)
    end
    if e.id == 0x50 then
        if debug_mode then
            print(chat.header(addon.name):append(chat.message('Equipment Changed')))
        end
    end
    if e.id == 0x3A then
        local containerId = string.byte(e.data, 5)
        local curContainer = constants.CONTAINERS[containerId]
        local name = (curContainer and curContainer.name) or ('Unknown(' .. tostring(containerId) .. ')')
        if debug_mode then
            print(chat.header(addon.name):append(chat.message(string.format('Sort detected. Container ID: %s', name))))
        end
    end
end)

-- Inventory change event
ashita.events.register('packet_in', 'xiim_packet_in', function(e)
    -- Handle sellit packets
    sellit.handle_packet_in(e, debug_mode, addon.name, chat)
    
    -- Packet 0x0A: Zone change packet
    if e.id == 0x0A then
        if not current_character then
            if debug_mode then
                print(chat.header(addon.name):append(chat.error('current_character is nil in packet 0x0A')))
            end
            return
        end
        
        -- Check mog house flag at offset 0x80 taken from Xenonsmurf's zonename
        -- moghouse == 1 means entering a mog house
        -- moghouse ~= 1 means entering a regular zone
        local moghouse = struct.unpack('b', e.data, 0x80 + 1)
        
        if moghouse ~= 1 then
            -- Not a mog house - regular zone change
            current_character.in_mog_house = false
            
            -- Update and broadcast the mog house state change
            if current_character.key and current_character.key ~= '' then
                local char_data = data.load_character_settings(current_character.key, debug_mode)
                if char_data then
                    char_data.in_mog_house = false
                    char_data.last_seen = os.time()
                    data.save_character_settings(current_character.key, char_data)
                    
                    -- Broadcast the state change
                    if webserver.is_server_owner then
                        broadcast_inventory_update()
                    else
                        webserver.notify_host_update(port, debug_mode, addon.name, chat)
                    end
                end
            end
            
        else
            -- This is a mog house
            current_character.in_mog_house = true
            
            print(chat.header(addon.name):append(chat.message('Mog House: Safe, Storage & Locker Unlocked')))
            
            -- Update and broadcast the mog house state change immediately
            if current_character.key and current_character.key ~= '' then
                local char_data = data.load_character_settings(current_character.key, debug_mode)
                if char_data then
                    char_data.in_mog_house = true
                    char_data.last_seen = os.time()
                    data.save_character_settings(current_character.key, char_data)
                    
                    -- Broadcast the state change
                    if webserver.is_server_owner then
                        broadcast_inventory_update()
                    else
                        webserver.notify_host_update(port, debug_mode, addon.name, chat)
                    end
                end
            end
        end
    end
    
    -- Packet 0x1E: Inventory Modify     (container @ byte 9)
    -- Packet 0x1F: Inventory Finish     (container @ byte 11)
    -- Packet 0x20: Item Attr Update     (Category/container @ byte 15)
    -- Packet 0x50: Equipment Change     (container @ byte 7)
    if e.id == 0x1E then
        local container_id = string.byte(e.data, 9)
        mark_container_changed(container_id)

        if debug_mode then
            print(chat.header(addon.name):append(chat.message(
                string.format('Packet 0x1E -> container=%s', tostring(container_id)))))
        end

    elseif e.id == 0x1F then
        local container_id = string.byte(e.data, 11)
        mark_container_changed(container_id)

        if debug_mode then
            print(chat.header(addon.name):append(chat.message(
                string.format('Packet 0x1F -> container=%s', tostring(container_id)))))
        end

    elseif e.id == 0x20 then
        local container_id = string.byte(e.data, 15)
        mark_container_changed(container_id)

        if debug_mode then
            print(chat.header(addon.name):append(chat.message(
                string.format('Packet 0x20 -> container=%s', tostring(container_id)))))
        end

    elseif e.id == 0x50 then
        local container_id = string.byte(e.data, 7)
        mark_container_changed(container_id)

        if debug_mode then
            print(chat.header(addon.name):append(chat.message(
                string.format('Packet 0x50 -> container=%s (Equipment)', tostring(container_id)))))
        end
    end
end)

-- Command handler
ashita.events.register('command', 'xiim_command', function (e)
    local args = e.command:args()
    
    if #args == 0 or args[1] ~= '/xiim' then
        return
    end
    
    e.blocked = true
    
    if #args == 1 then
        print(chat.header(addon.name):append(chat.message('Available commands:')))
        print(chat.header(addon.name):append(chat.message('  /xiim scan - Scan all container IDs')))
        print(chat.header(addon.name):append(chat.message('  /xiim save - Manually save inventory data')))
        print(chat.header(addon.name):append(chat.message('  /xiim debug - Toggle debug mode')))
        print(chat.header(addon.name):append(chat.message('  /xiim open - Open web interface in browser')))
        return
    end
    
    if args[2]:lower() == 'scan' then
        inventory.scan_containers(constants, port)
    elseif args[2]:lower() == 'save' then
        save_inventory_data()
    elseif args[2]:lower() == 'debug' then
        debug_mode = not debug_mode
        print(chat.header(addon.name):append(chat.message('Debug mode: ' .. (debug_mode and 'ON' or 'OFF'))))
    elseif args[2]:lower() == 'open' then
        local url = 'http://localhost:' .. port
        os.execute('start "" "' .. url .. '"')
        print(chat.header(addon.name):append(chat.message('Opening web interface...')))
    else
        print(chat.header(addon.name):append(chat.error('Unknown command. Use /xiim for help.')))
    end
end)
