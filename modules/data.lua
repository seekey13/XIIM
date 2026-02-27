--[[
XIIM Data Module
Handles data serialization and deserialization (JSON, Lua tables, file I/O)
]]--

local data = {}

-- Convert table to Lua format
function data.table_to_lua(tbl, indent)
    indent = indent or 0
    local indent_str = string.rep('    ', indent)
    local result = {}
    
    table.insert(result, '{\n')
    
    -- Collect and sort keys for deterministic output
    local keys = {}
    for k in pairs(tbl) do
        table.insert(keys, k)
    end
    table.sort(keys, function(a, b)
        -- Sort numbers before strings, then by value
        local ta, tb = type(a), type(b)
        if ta == tb then
            return tostring(a) < tostring(b)
        else
            return ta == 'number'
        end
    end)
    
    for _, k in ipairs(keys) do
        local v = tbl[k]
        local key = type(k) == 'string' and string.format('["%s"]', k) or string.format('[%d]', k)
        table.insert(result, indent_str .. '    ' .. key .. ' = ')
        
        if type(v) == 'table' then
            table.insert(result, data.table_to_lua(v, indent + 1))
        elseif type(v) == 'string' then
            table.insert(result, string.format('"%s"', v:gsub('"', '\\"')))
        elseif type(v) == 'number' or type(v) == 'boolean' then
            table.insert(result, tostring(v))
        else
            table.insert(result, 'nil')
        end
        
        table.insert(result, ',\n')
    end
    
    table.insert(result, indent_str .. '}')
    
    return table.concat(result)
end

-- Convert table to JSON
function data.table_to_json(tbl)
    -- Escape a raw string value for use inside a JSON double-quoted string.
    -- Handles backslash, quote, and all control characters consistently.
    local function escape_json_string(s)
        local result = s:gsub('["\\]', '\\%1')
                        :gsub('\n', '\\n')
                        :gsub('\r', '\\r')
                        :gsub('\t', '\\t')
                        :gsub('\b', '\\b')
                        :gsub('\f', '\\f')
        -- Escape any remaining control characters (0x00-0x1F not already escaped above) as \uXXXX
        return result:gsub('[%z\1-\31]', function(c) return string.format('\\u%04X', string.byte(c)) end)
    end

    local function is_array(t, key_name)
        if type(t) ~= 'table' then return false end
        
        -- Force these fields to always be arrays
        if key_name == 'equipment' or key_name == 'items' or key_name == 'trash_items' then
            return true
        end
        
        -- Check if table has sequential numeric keys starting from 1
        local count = 0
        local max_index = 0
        for k, _ in pairs(t) do
            if type(k) == 'number' and k >= 1 then
                max_index = math.max(max_index, k)
                count = count + 1
            elseif type(k) ~= 'number' then
                -- Has non-numeric key, not an array
                return false
            end
        end
        
        -- If all keys are sequential numbers starting from 1, it's an array
        return count > 0 and count == max_index
    end
    
    local function serialize(val, key_name)
        local val_type = type(val)
        if val_type == 'table' then
            local parts = {}
            
            if is_array(val, key_name) then
                -- Array serialization
                for i = 1, #val do
                    table.insert(parts, serialize(val[i], nil))
                end
                return '[' .. table.concat(parts, ',') .. ']'
            else
                -- Object serialization
                for k, v in pairs(val) do
                    local key_text = '"' .. escape_json_string(tostring(k)) .. '"'
                    table.insert(parts, key_text .. ':' .. serialize(v, k))
                end
                return '{' .. table.concat(parts, ',') .. '}'
            end
        elseif val_type == 'string' then
            return '"' .. escape_json_string(val) .. '"'
        elseif val_type == 'number' or val_type == 'boolean' then
            return tostring(val)
        else
            return 'null'
        end
    end
    
    return serialize(tbl, nil)
end

-- Simple JSON to table parser (handles arrays and objects with simple values)
function data.json_to_table(json_str)
    if not json_str or json_str == '' then
        return nil
    end
    
    -- Remove whitespace
    json_str = json_str:gsub('^%s*(.-)%s*$', '%1')
    
    local pos = 1
    
    local function skip_whitespace()
        while pos <= #json_str and json_str:sub(pos, pos):match('%s') do
            pos = pos + 1
        end
    end
    
    local function parse_value()
        skip_whitespace()
        local char = json_str:sub(pos, pos)
        
        -- Parse string
        if char == '"' then
            pos = pos + 1
            local start = pos
            while pos <= #json_str do
                char = json_str:sub(pos, pos)
                if char == '"' and json_str:sub(pos - 1, pos - 1) ~= '\\' then
                    local str = json_str:sub(start, pos - 1)
                    -- Unescape
                    str = str:gsub('\\n', '\n'):gsub('\\r', '\r'):gsub('\\t', '\t')
                    str = str:gsub('\\(.)', '%1')
                    pos = pos + 1
                    return str
                end
                pos = pos + 1
            end
            error('Unterminated string')
        end
        
        -- Parse number
        if char:match('[%-0-9]') then
            local start = pos
            while pos <= #json_str and json_str:sub(pos, pos):match('[0-9%.eE+%-]') do
                pos = pos + 1
            end
            return tonumber(json_str:sub(start, pos - 1))
        end
        
        -- Parse true
        if json_str:sub(pos, pos + 3) == 'true' then
            pos = pos + 4
            return true
        end
        
        -- Parse false
        if json_str:sub(pos, pos + 4) == 'false' then
            pos = pos + 5
            return false
        end
        
        -- Parse null
        if json_str:sub(pos, pos + 3) == 'null' then
            pos = pos + 4
            return nil
        end
        
        -- Parse array
        if char == '[' then
            local arr = {}
            pos = pos + 1
            skip_whitespace()
            
            if json_str:sub(pos, pos) == ']' then
                pos = pos + 1
                return arr
            end
            
            while true do
                table.insert(arr, parse_value())
                skip_whitespace()
                char = json_str:sub(pos, pos)
                
                if char == ']' then
                    pos = pos + 1
                    return arr
                elseif char == ',' then
                    pos = pos + 1
                else
                    error('Expected , or ] in array')
                end
            end
        end
        
        -- Parse object
        if char == '{' then
            local obj = {}
            pos = pos + 1
            skip_whitespace()
            
            if json_str:sub(pos, pos) == '}' then
                pos = pos + 1
                return obj
            end
            
            while true do
                skip_whitespace()
                
                -- Parse key
                if json_str:sub(pos, pos) ~= '"' then
                    error('Expected string key in object')
                end
                local key = parse_value()
                
                skip_whitespace()
                if json_str:sub(pos, pos) ~= ':' then
                    error('Expected : after key')
                end
                pos = pos + 1
                
                -- Parse value
                local value = parse_value()
                obj[key] = value
                
                skip_whitespace()
                char = json_str:sub(pos, pos)
                
                if char == '}' then
                    pos = pos + 1
                    return obj
                elseif char == ',' then
                    pos = pos + 1
                else
                    error('Expected , or } in object')
                end
            end
        end
        
        error('Unexpected character: ' .. char)
    end
    
    local success, result = pcall(parse_value)
    if success then
        return result
    else
        return nil, result
    end
end

-- Load character settings from file
function data.load_character_settings(character_key, debug_mode)
    local settings_path = string.format('%sconfig\\addons\\XIIM\\%s\\settings.lua', 
        AshitaCore:GetInstallPath(), character_key)
    
    if debug_mode then
        print('Loading settings: ' .. settings_path)
    end
    
    local file = io.open(settings_path, 'r')
    if file then
        local content = file:read('*all')
        file:close()
        
        if debug_mode then
            print('Content length: ' .. #content)
        end
        
        -- Load Lua table (use load instead of loadstring for Lua 5.2+)
        local loadfunc = load or loadstring
        local success, loaded_data = pcall(function()
            -- Don't add 'return' if the content already starts with it
            local code = content
            if not content:match('^%s*return%s') then
                code = 'return ' .. content
            end
            local func, err = loadfunc(code)
            if not func then
                error('Load error: ' .. tostring(err))
            end
            return func()
        end)
        
        if success and loaded_data then
            if debug_mode then
                print('Data loaded successfully')
            end
            return loaded_data
        else
            if debug_mode then
                print('Failed to parse data: ' .. tostring(loaded_data))
            end
        end
    else
        if debug_mode then
            print('Failed to open file')
        end
    end
    
    return nil
end

-- Save character settings to file
function data.save_character_settings(character_key, save_data)
    local settings_path = string.format('%sconfig\\addons\\XIIM\\%s\\', 
        AshitaCore:GetInstallPath(), character_key)
    
    -- Create directory if it doesn't exist
    ashita.fs.create_dir(settings_path)
    
    local file = io.open(settings_path .. 'settings.lua', 'w')
    if file then
        file:write('return ')
        file:write(data.table_to_lua(save_data))
        file:close()
        return true
    end
    
    return false
end

-- Scan all character folders in settings directory
function data.scan_character_folders(debug_mode)
    local characters = {}
    local settings_path = string.format('%sconfig\\addons\\XIIM\\', AshitaCore:GetInstallPath())
    
    if debug_mode then
        print('Scanning path: ' .. settings_path)
    end
    
    -- Create directory if it doesn't exist
    ashita.fs.create_dir(settings_path)
    
    -- Get all directories
    local dirs = ashita.fs.get_dir(settings_path, '.*', true)
    
    if debug_mode then
        print('Dirs found: ' .. tostring(dirs ~= nil))
    end
    
    if dirs then
        for _, dir in pairs(dirs) do
            if debug_mode then
                print('Found dir: ' .. dir)
            end
            -- Match pattern: CharacterName_ServerID
            -- Use non-underscore pattern to avoid matching underscores in character names
            local char_name, server_id = dir:match('^([^_]+)_(%d+)$')
            if char_name and server_id then
                if debug_mode then
                    print('Matched: ' .. char_name .. ' / ' .. server_id)
                end
                table.insert(characters, {
                    name = char_name,
                    server_id = tonumber(server_id),
                    key = dir
                })
            end
        end
    end
    
    if debug_mode then
        print('Total characters: ' .. #characters)
    end
    
    return characters
end

-- Read HTML file
function data.read_html_file(filepath)
    local file = io.open(filepath, 'r')
    if file then
        local content = file:read('*all')
        file:close()
        return content
    end
    return nil
end

-- Save pending move request for a character
function data.save_pending_move(character_key, moves)
    local move_path = string.format('%sconfig\\addons\\XIIM\\%s\\', 
        AshitaCore:GetInstallPath(), character_key)
    
    -- Create directory if it doesn't exist
    ashita.fs.create_dir(move_path)
    
    local file = io.open(move_path .. 'pending_move.lua', 'w')
    if file then
        file:write('return ')
        file:write(data.table_to_lua(moves))
        file:close()
        return true
    end
    
    return false
end

-- Load and clear pending move request for a character
function data.load_and_clear_pending_move(character_key)
    local move_path = string.format('%sconfig\\addons\\XIIM\\%s\\pending_move.lua', 
        AshitaCore:GetInstallPath(), character_key)
    
    local file = io.open(move_path, 'r')
    if file then
        local content = file:read('*all')
        file:close()
        
        -- Delete the file immediately after reading
        os.remove(move_path)
        
        -- Load Lua table
        local loadfunc = load or loadstring
        local success, loaded_data = pcall(function()
            local code = content
            if not content:match('^%s*return%s') then
                code = 'return ' .. content
            end
            local func, err = loadfunc(code)
            if not func then
                error('Load error: ' .. tostring(err))
            end
            return func()
        end)
        
        if success and loaded_data then
            return loaded_data
        end
    end
    
    return nil
end

return data
