--[[
XIIM Inventory Module
Handles inventory scanning, item data extraction, and character info
]]--

local inventory = {}
local augments = require('modules.augments')
local constants = require('modules.constants')

-- Replace elemental control characters with HTML image tags
-- FFXI uses 0xEF followed by element-specific byte (0x1F-0x26)
local function replace_elemental_icons(desc)
    if not desc then return desc end
    
    -- Helper to escape Lua pattern magic characters
    local function escape_pattern(str)
        return str:gsub('[%^%$%(%)%%%.%[%]%*%+%-%?]', '%%%1')
    end
    
    -- Replace byte sequences with image tags or special characters
    -- Must escape patterns since some bytes (like 0x24=$, 0x25=%) are Lua magic characters
    local replacements = {
        {char = string.char(0xEF, 0x1F), icon = '<img src="/assets/Fire-Icon.png" alt="Fire" class="element-icon">'},
        {char = string.char(0xEF, 0x20), icon = '<img src="/assets/Ice-Icon.png" alt="Ice" class="element-icon">'},
        {char = string.char(0xEF, 0x21), icon = '<img src="/assets/Wind-Icon.png" alt="Wind" class="element-icon">'},
        {char = string.char(0xEF, 0x22), icon = '<img src="/assets/Earth-Icon.png" alt="Earth" class="element-icon">'},
        {char = string.char(0xEF, 0x23), icon = '<img src="/assets/Lightning-Icon.png" alt="Lightning" class="element-icon">'},
        {char = string.char(0xEF, 0x24), icon = '<img src="/assets/Water-Icon.png" alt="Water" class="element-icon">'},
        {char = string.char(0xEF, 0x25), icon = '<img src="/assets/Light-Icon.png" alt="Light" class="element-icon">'},
        {char = string.char(0xEF, 0x26), icon = '<img src="/assets/Dark-Icon.png" alt="Dark" class="element-icon">'},
        -- Special characters
        {char = string.char(0xEF, 0x60), icon = '~'}  -- Tilde for ranges (e.g., "2~5")
    }
    
    for _, replacement in ipairs(replacements) do
        desc = desc:gsub(escape_pattern(replacement.char), replacement.icon)
    end
    
    return desc
end

-- Get current character info
function inventory.get_current_character_info()
    local player = AshitaCore:GetMemoryManager():GetPlayer()
    local party = AshitaCore:GetMemoryManager():GetParty()
    
    if player:GetIsZoning() ~= 0 then
        return nil
    end
    
    local name = party:GetMemberName(0)
    local server_id = party:GetMemberServerId(0)
    
    if name ~= nil and name ~= '' and server_id ~= nil and server_id ~= 0 then
        return {
            name = name,
            server_id = server_id,
            key = string.format('%s_%d', name, server_id)
        }
    end
    
    return nil
end

-- Gather all player inventory data
function inventory.get_inventory_data(config, debug_mode, current_character)
    -- Don't save while zoning as inventory data will be empty/invalid
    local player = AshitaCore:GetMemoryManager():GetPlayer()
    if player:GetIsZoning() ~= 0 then
        if debug_mode then
            print('Skipping save - character is zoning')
        end
        return nil
    end
    
    -- Ensure we have valid character data
    if not current_character.name or current_character.name == '' then
        if debug_mode then
            print('No valid character info')
        end
        return nil
    end
    
    local invManager = AshitaCore:GetMemoryManager():GetInventory()
    local resourceManager = AshitaCore:GetResourceManager()
    
    local data = {
        character_name = current_character.name,
        server_id = current_character.server_id,
        last_updated = os.time(),
        gil = 0,
        equipment = {},
        containers = {}
    }
    
    -- Get equipped items (need to get actual item from container using Index)
    for slot = 0, 15 do
        local eitem = invManager:GetEquippedItem(slot)
        if eitem and eitem.Index ~= 0 then
            -- Get the actual item from its container
            local containerId = bit.band(eitem.Index, 0xFF00) / 0x0100
            local itemIndex = eitem.Index % 0x0100
            local item = invManager:GetContainerItem(containerId, itemIndex)
            
            if item and item.Id ~= 0 and item.Id ~= 65535 then
                local itemData = resourceManager:GetItemById(item.Id)
                if itemData then
                    local equipData = {
                        slot = slot,
                        slotName = constants.EQUIPMENT_SLOTS[slot],
                        id = item.Id,
                        name = itemData.Name[1] or 'Unknown',
                        count = item.Count,
                        -- Store container info to uniquely identify this item instance
                        containerId = containerId,
                        containerSlot = itemIndex,
                        -- Item restrictions from resource data
                        jobs = itemData.Jobs,
                        races = itemData.Races,
                        level = itemData.Level,
                        skill = itemData.Skill,
                        type = itemData.Type,
                        slotMask = itemData.Slots,
                        slots = itemData.Slots,
                        stackSize = itemData.StackSize,
                        -- Parse flags for rare/exclusive
                        flags = itemData.Flags,
                        rare = bit.band(itemData.Flags, 0x8000) ~= 0,
                        exclusive = bit.band(itemData.Flags, 0x4000) ~= 0,
                        -- Additional item properties
                        shieldSize = itemData.ShieldSize,
                        itemLevel = itemData.ItemLevel,
                        castTime = itemData.CastTime,
                        recastDelay = itemData.RecastDelay,
                        activationTime = itemData.ActivationTime,
                        animation = itemData.Animation
                    }
                    
                    -- Add Description
                    if itemData.Description then
                        local desc = itemData.Description[1]
                        -- Remove newlines to prevent multi-line issues
                        desc = desc:gsub('[\r\n]+', ' ')
                        -- Replace elemental control characters with image tags
                        desc = replace_elemental_icons(desc)
                        equipData.Description = desc
                    end
                    
                    -- Add weapon stats (if available on itemData)
                    if itemData.Damage then
                        equipData.damage = itemData.Damage
                    end
                    if itemData.Delay then
                        equipData.delay = itemData.Delay
                    end
                    -- Calculate DPS if we have both Damage and Delay
                    if itemData.Damage and itemData.Delay and itemData.Delay > 0 then
                        equipData.dps = (itemData.Damage / itemData.Delay) * 60
                    end
                    
                    -- Add armor stats (if available on itemData)
                    if itemData.Defense then
                        equipData.defense = itemData.Defense
                    end
                    
                    -- Decode augments if present
                    local decoded_augments = augments.decode(item, constants)
                    if decoded_augments then
                        equipData.augments = decoded_augments
                    end
                    
                    table.insert(data.equipment, equipData)
                end
            end
        end
    end
    
    -- Get all container data
    for _, container in pairs(constants.CONTAINERS) do
        local maxSize = invManager:GetContainerCountMax(container.id)
        
        -- Skip containers that aren't unlocked (maxSize = 0)
        if maxSize > 0 then
            local itemsArray = {}
            local occupiedSlots = 0
            
            -- Get items in container (iterate to maxSize instead of maxSize-1 to include Gil slot)
            for slot = 0, maxSize do
                local item = invManager:GetContainerItem(container.id, slot)
                if item and item.Id ~= 0 then
                    -- Count all non-empty slots (including Gil)
                    occupiedSlots = occupiedSlots + 1
                    
                    -- Extract Gil from Inventory container
                    if item.Id == 65535 and container.id == 0 then
                        data.gil = item.Count
                    end
                    
                    -- Skip Gil items from all containers (Gil doesn't take up visible slots)
                    if item.Id ~= 65535 then
                        local itemData = resourceManager:GetItemById(item.Id)
                        local containerItemData = {
                            slot = slot,
                            containerSlot = slot,
                            containerId = container.id,
                            id = item.Id,
                            name = itemData and itemData.Name[1] or 'Unknown',
                            count = item.Count,
                            flags = item.Flags,
                            price = item.Price,
                            stackSize = itemData and itemData.StackSize or 1,
                            -- Item restrictions from resource data
                            jobs = itemData and itemData.Jobs or 0,
                            races = itemData and itemData.Races or 0,
                            level = itemData and itemData.Level or 0,
                            slotMask = itemData and itemData.Slots or 0,
                            slots = itemData and itemData.Slots or 0,
                            type = itemData and itemData.Type or 0,
                            skill = itemData and itemData.Skill or 0,
                            -- Parse flags for rare/exclusive
                            flags = itemData and itemData.Flags or 0,
                            rare = itemData and bit.band(itemData.Flags, 0x8000) ~= 0 or false,
                            exclusive = itemData and bit.band(itemData.Flags, 0x4000) ~= 0 or false,
                            noSale = itemData and bit.band(itemData.Flags, 0x1000) ~= 0 or false,
                            -- Additional item properties
                            shieldSize = itemData and itemData.ShieldSize or nil,
                            itemLevel = itemData and itemData.ItemLevel or nil,
                            castTime = itemData and itemData.CastTime or nil,
                            recastDelay = itemData and itemData.RecastDelay or nil,
                            activationTime = itemData and itemData.ActivationTime or nil,
                            animation = itemData and itemData.Animation or nil
                        }
                        
                        -- Add Description
                        if itemData and itemData.Description then
                            local desc = itemData.Description[1] or ''
                            -- Remove newlines to prevent multi-line issues
                            desc = desc:gsub('[\r\n]+', ' ')
                            -- Replace elemental control characters with image tags
                            desc = replace_elemental_icons(desc)
                            containerItemData.Description = desc
                        end
                        
                        -- Add weapon stats (if available on itemData)
                        if itemData and itemData.Damage then
                            containerItemData.damage = itemData.Damage
                        end
                        if itemData and itemData.Delay then
                            containerItemData.delay = itemData.Delay
                        end
                        -- Calculate DPS if we have both Damage and Delay
                        if itemData and itemData.Damage and itemData.Delay and itemData.Delay > 0 then
                            containerItemData.dps = (itemData.Damage / itemData.Delay) * 60
                        end
                        
                        -- Add armor stats (if available on itemData)
                        if itemData and itemData.Defense then
                            containerItemData.defense = itemData.Defense
                        end
                        
                        -- Decode augments if present
                        local decoded_augments = augments.decode(item, constants)
                        if decoded_augments then
                            containerItemData.augments = decoded_augments
                        end
                        
                        table.insert(itemsArray, containerItemData)
                    end
                end
            end
            
            -- Store container data
            -- currentCount = count of displayable items (excludes Gil)
            -- items = array of displayable items (excludes Gil)
            data.containers[container.name] = {
                id = container.id,
                maxSize = maxSize,
                currentCount = #itemsArray,
                items = itemsArray
            }
        end
    end
    
    return data
end

-- Display inventory summary
function inventory.scan_containers(config, port)
    local invManager = AshitaCore:GetMemoryManager():GetInventory()
    
    -- Check if inventory is actually loaded (valid data will have at least Inventory container > 0)
    local invMaxSize = invManager:GetContainerCountMax(0) -- Inventory container
    if invMaxSize == 0 then
        return
    end
    
    print('Container Status:')
    
    for i = 0, 16 do
        local container = constants.CONTAINERS[i]
        if container then
            local maxSize = invManager:GetContainerCountMax(container.id)
            local currentCount = invManager:GetContainerCount(container.id)

            if maxSize > 0 then
                print(string.format('%s: %d/%d items',
                    container.name, currentCount, maxSize))
            end
        end
    end
    
    print('API: http://localhost:' .. port .. '/api/inventory')
end

-- Gather data for a single container (used for incremental updates)
function inventory.get_container_data(container_id, config, debug_mode, current_character)
    -- Don't read while zoning (inventory data can be empty/invalid)
    local player = AshitaCore:GetMemoryManager():GetPlayer()
    if player:GetIsZoning() ~= 0 then
        if debug_mode then
            print('Skipping container scan - character is zoning')
        end
        return nil
    end

    local invManager = AshitaCore:GetMemoryManager():GetInventory()
    local resourceManager = AshitaCore:GetResourceManager()

    local maxSize = invManager:GetContainerCountMax(container_id)

    -- Container not unlocked or not ready yet
    if not maxSize or maxSize <= 0 then
        return nil
    end

    local itemsArray = {}

    -- Iterate to maxSize to match your current behavior (includes gil slot)
    for slot = 0, maxSize do
        local item = invManager:GetContainerItem(container_id, slot)
        if item and item.Id ~= 0 then
            -- Skip Gil item (65535) from item arrays, consistent with your full scan
            if item.Id ~= 65535 then
                local itemData = resourceManager:GetItemById(item.Id)

                local containerItemData = {
                    slot = slot,
                    containerSlot = slot,
                    containerId = container_id,
                    id = item.Id,
                    name = itemData and itemData.Name[1] or 'Unknown',
                    count = item.Count,
                    flags = item.Flags,
                    price = item.Price,
                    stackSize = itemData and itemData.StackSize or 1,
                    jobs = itemData and itemData.Jobs or 0,
                    races = itemData and itemData.Races or 0,
                    level = itemData and itemData.Level or 0,
                    slotMask = itemData and itemData.Slots or 0,
                    slots = itemData and itemData.Slots or 0,
                    type = itemData and itemData.Type or 0,
                    skill = itemData and itemData.Skill or 0,
                    flags = itemData and itemData.Flags or 0,
                    rare = itemData and bit.band(itemData.Flags, 0x8000) ~= 0 or false,
                    exclusive = itemData and bit.band(itemData.Flags, 0x4000) ~= 0 or false,
                    noSale = itemData and bit.band(itemData.Flags, 0x1000) ~= 0 or false,
                    shieldSize = itemData and itemData.ShieldSize or nil,
                    itemLevel = itemData and itemData.ItemLevel or nil,
                    castTime = itemData and itemData.CastTime or nil,
                    recastDelay = itemData and itemData.RecastDelay or nil,
                    activationTime = itemData and itemData.ActivationTime or nil,
                    animation = itemData and itemData.Animation or nil
                }

                if itemData and itemData.Description then
                    local desc = itemData.Description[1] or ''
                    desc = desc:gsub('[\r\n]+', ' ')
                    -- Replace elemental control characters with image tags
                    desc = replace_elemental_icons(desc)
                    containerItemData.Description = desc
                end

                if itemData and itemData.Damage then
                    containerItemData.damage = itemData.Damage
                end
                if itemData and itemData.Delay then
                    containerItemData.delay = itemData.Delay
                end
                if itemData and itemData.Damage and itemData.Delay and itemData.Delay > 0 then
                    containerItemData.dps = (itemData.Damage / itemData.Delay) * 60
                end

                if itemData and itemData.Defense then
                    containerItemData.defense = itemData.Defense
                end

                local decoded_augments = augments.decode(item, constants)
                if decoded_augments then
                    containerItemData.augments = decoded_augments
                end

                table.insert(itemsArray, containerItemData)
            end
        end
    end

    return {
        id = container_id,
        maxSize = maxSize,
        currentCount = #itemsArray,
        items = itemsArray
    }
end

return inventory
