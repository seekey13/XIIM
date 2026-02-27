--[[
XIIM Augments Module
Decodes item augment data into readable strings using lookup tables from constants
]]--

local augments = {}

-- Decode augment ID and value into readable stat description
-- @param augmentId: The augment identifier
-- @param augmentValue: The value/magnitude of the augment
-- @param augmentTable: The lookup table (BASIC_AUGMENTS or DELVE_AUGMENTS)
-- @return: Table of augment stat strings
local function decode_augment(augmentId, augmentValue, augmentTable)
    local augDef = augmentTable[augmentId]
    if not augDef then
        return nil
    end
    
    local results = {}
    
    -- Handle multi-stat augments
    if augDef.Multi then
        for i = 1, 10 do  -- Max 10 sub-stats
            local subAug = augDef[i]
            if not subAug then break end
            
            local offset = subAug.Offset or 0
            local multiplier = subAug.Multiplier or 1
            local value = offset + (augmentValue * multiplier)
            
            local statStr = subAug.Stat .. ':'
            if subAug.Percent then
                statStr = statStr .. value .. '%'
            else
                if value >= 0 then
                    statStr = statStr .. '+' .. value
                else
                    statStr = statStr .. value
                end
            end
            
            table.insert(results, statStr)
        end
    else
        -- Single stat augment
        local offset = augDef.Offset or 0
        local multiplier = augDef.Multiplier or 1
        local value = offset + (augmentValue * multiplier)
        
        local statStr = augDef.Stat .. ':'
        if augDef.Percent then
            statStr = statStr .. value .. '%'
        else
            if value >= 0 then
                statStr = statStr .. '+' .. value
            else
                statStr = statStr .. value
            end
        end
        
        table.insert(results, statStr)
    end
    
    return results
end

-- Extract augment path from bits
-- @param pathBits: 2-bit value representing augment path
-- @return: Path letter (A, B, C, D) or nil
local function get_augment_path(pathBits, constants)
    return constants.AUGMENT_PATHS[pathBits]
end

-- Parse Delve/Dynamis style augments
-- @param extra: Item extra data (24-byte string)
-- @param constants: Constants table with lookup data
-- @return: Table with decoded augment info
local function parse_delve_augments(extra, constants)
    if #extra < 24 then return nil end
    
    local result = {
        type = 'Delve',
        augments = {}
    }
    
    -- Extract path (bits 16-17 of byte array)
    local byte3 = string.byte(extra, 3)
    local pathBits = bit.rshift(bit.band(byte3, 0xC0), 6)  -- Top 2 bits
    result.path = get_augment_path(pathBits + 1, constants)
    
    -- Extract rank (bits 18-21)
    local byte3_low = bit.band(byte3, 0x3C)  -- Bits 2-5
    result.rank = bit.rshift(byte3_low, 2)
    
    -- Parse augment slots (up to 5 slots, starting at byte 6)
    for i = 0, 4 do
        local byteOffset = 6 + (i * 2)
        if byteOffset + 1 <= #extra then
            local byte1 = string.byte(extra, byteOffset)
            local byte2 = string.byte(extra, byteOffset + 1)
            
            if byte1 ~= 0 or byte2 ~= 0 then
                -- augmentId is byte1, augmentValue is byte2
                local augmentId = byte1
                local augmentValue = byte2
                
                local decoded = decode_augment(augmentId, augmentValue, constants.DELVE_AUGMENTS)
                if decoded then
                    for _, augStr in ipairs(decoded) do
                        table.insert(result.augments, augStr)
                    end
                end
            end
        end
    end
    
    return #result.augments > 0 and result or nil
end

-- Parse Oseem/Magian style augments
-- @param extra: Item extra data (24-byte string)
-- @param isMagian: Whether this is a Magian trial weapon
-- @param constants: Constants table with lookup data
-- @return: Table with decoded augment info
local function parse_basic_augments(extra, isMagian, constants)
    if #extra < 24 then return nil end
    
    local result = {
        type = isMagian and 'Magian' or 'Oseem',
        augments = {}
    }
    
    -- Magian has 4 slots, Oseem has 5 slots
    local maxSlots = isMagian and 4 or 5
    
    -- Parse augment slots (starting at byte 3)
    for i = 0, maxSlots - 1 do
        local byteOffset = 3 + (i * 2)
        if byteOffset + 1 <= #extra then
            local byte1 = string.byte(extra, byteOffset)
            local byte2 = string.byte(extra, byteOffset + 1)
            
            -- Combine bytes: 11 bits for augment ID, 5 bits for value
            -- Format: [byte2:byte1] = [VVVVV III IIIIIIII]
            -- Where V = value bits, I = ID bits
            local combined = byte1 + (byte2 * 256)
            
            if combined ~= 0 then
                local augmentId = bit.band(combined, 0x7FF)  -- Lower 11 bits
                local augmentValue = bit.rshift(combined, 11)  -- Upper 5 bits
                
                local decoded = decode_augment(augmentId, augmentValue, constants.BASIC_AUGMENTS)
                if decoded then
                    for _, augStr in ipairs(decoded) do
                        table.insert(result.augments, augStr)
                    end
                end
            end
        end
    end
    
    return #result.augments > 0 and result or nil
end

-- Main decode function
-- @param item: Item object from inventory manager (with Extra field)
-- @param constants: Constants module
-- @return: Decoded augment data or nil
function augments.decode(item, constants)
    if not item or not item.Extra or #item.Extra < 24 then
        return nil
    end
    
    local extra = item.Extra
    local augType = string.byte(extra, 1)
    
    -- Only process augmented items (type 2 or 3)
    if augType ~= 2 and augType ~= 3 then
        return nil
    end
    
    local augFlag = string.byte(extra, 2)
    
    -- Delve style augments (0x20 bit set)
    if bit.band(augFlag, 0x20) ~= 0 then
        return parse_delve_augments(extra, constants)
    
    -- Dynamis style (same as Delve structure)
    elseif augFlag == 131 then
        return parse_delve_augments(extra, constants)
    
    -- Shield extdata (0x08 bit set) - skip
    elseif bit.band(augFlag, 0x08) ~= 0 then
        return nil
    
    -- Evolith style (0x80 bit set) - skip
    elseif bit.band(augFlag, 0x80) ~= 0 then
        return nil
    
    -- Magian trial (0x40 bit set)
    elseif bit.band(augFlag, 0x40) ~= 0 then
        return parse_basic_augments(extra, true, constants)
    
    -- Standard Oseem style
    else
        return parse_basic_augments(extra, false, constants)
    end
end

return augments
