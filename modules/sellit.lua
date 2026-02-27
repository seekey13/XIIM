--[[
XIIM Sellit Module
Handles automatic selling of items to NPCs
Based on Sellit by Thorny
]]--

local sellit = {}

-- Module state
sellit.active = false
sellit.items_to_sell = {} -- Array of item names to sell
sellit.active_delay = 0
sellit.base_delay = 2 -- 2 seconds between sales
sellit.errors = {}
sellit.current_character_key = nil

-- Locate item in inventory by name
local function LocateItem(itemName)
    local invMgr = AshitaCore:GetMemoryManager():GetInventory()
    local resourceMgr = AshitaCore:GetResourceManager()
    
    -- Normalize item name for comparison
    local normalizedSearchName = string.lower(itemName)
    
    -- Search inventory container (ID 0)
    for i = 1, 80 do
        local item = invMgr:GetContainerItem(0, i)
        if item and item.Id > 0 then
            local resource = resourceMgr:GetItemById(item.Id)
            if resource then
                local itemResourceName = string.lower(resource.Name[1] or '')
                -- Check if names match and item is not rare (bit flag 0x1000)
                if itemResourceName == normalizedSearchName and bit.band(resource.Flags, 0x1000) == 0 then
                    return item
                end
            end
        end
    end
    
    return nil
end

-- Process the sell queue
local function ProcessSellQueue(debug_mode, addon_name, chat)
    if not sellit.active then
        return
    end
    
    -- Check rate limit
    if os.clock() < sellit.active_delay then
        return
    end
    
    -- Check if we have items to sell
    if #sellit.items_to_sell == 0 then
        sellit.active = false
        if debug_mode then
            print(chat.header(addon_name):append(chat.message('Sell queue empty, deactivating')))
        end
        return
    end
    
    -- Get next item from queue
    local itemName = sellit.items_to_sell[1]
    local item = LocateItem(itemName)
    
    if item then
        -- Send appraise packet (0x84)
        local appraise = struct.pack('LLHBB', 0, item.Count, item.Id, item.Index, 0)
        AshitaCore:GetPacketManager():AddOutgoingPacket(0x84, appraise:totable())
        
        -- Send confirm sale packet (0x85)
        local confirm = struct.pack('LL', 0, 1)
        AshitaCore:GetPacketManager():AddOutgoingPacket(0x85, confirm:totable())
        
        if debug_mode then
            print(chat.header(addon_name):append(chat.message(string.format('Selling: %s (x%d)', itemName, item.Count))))
        end
        
        -- Update delay timer
        sellit.active_delay = os.clock() + sellit.base_delay
    else
        -- Item not found, remove from queue
        table.remove(sellit.items_to_sell, 1)
        table.insert(sellit.errors, string.format('Item not found in inventory: %s', itemName))
        
        if debug_mode then
            print(chat.header(addon_name):append(chat.error(string.format('Item not found: %s', itemName))))
        end
    end
end

-- Initialize sell request
function sellit.start_sell(item_names, character_key, debug_mode, addon_name, chat)
    if sellit.active then
        return {
            success = false,
            error = 'Sell operation already in progress',
            errors = sellit.errors
        }
    end
    
    if not item_names or type(item_names) ~= 'table' or #item_names == 0 then
        return {
            success = false,
            error = 'Invalid sell request: must be a non-empty array of item names',
            errors = {}
        }
    end
    
    -- Set up sell queue
    sellit.items_to_sell = {}
    for _, name in ipairs(item_names) do
        table.insert(sellit.items_to_sell, name)
    end
    
    sellit.active = true
    sellit.errors = {}
    sellit.current_character_key = character_key
    
    if debug_mode then
        print(chat.header(addon_name):append(chat.message(string.format('Selling %d item type(s)...', #item_names))))
    end
    
    return {
        success = true,
        message = string.format('Selling %d item type(s)', #item_names),
        errors = {}
    }
end

-- Get current sell state
function sellit.get_state()
    return {
        isActive = sellit.active,
        itemsRemaining = #sellit.items_to_sell,
        errors = sellit.errors
    }
end

-- Cancel active sell operation
function sellit.cancel()
    sellit.active = false
    sellit.items_to_sell = {}
    sellit.errors = {}
    return {
        success = true,
        message = 'Sell operation cancelled'
    }
end

-- Handle outgoing packet (not needed but kept for future use)
function sellit.handle_packet_out(e, debug_mode, addon_name, chat)
    -- Packet handling can be added here if needed
end

-- Handle incoming packet (not needed but kept for future use)
function sellit.handle_packet_in(e, debug_mode, addon_name, chat)
    -- Packet handling can be added here if needed
end

-- Update function called from main render loop
function sellit.update(debug_mode, addon_name, chat)
    if sellit.active then
        ProcessSellQueue(debug_mode, addon_name, chat)
    end
end

return sellit
