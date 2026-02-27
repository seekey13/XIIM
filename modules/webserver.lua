--[[
XIIM Webserver Module
Handles HTTP server initialization, request handling, and SSE client management
]]--

local socket = require('socket')
local ffi = require('ffi')

local webserver = {}

local function is_socket_timeout(err)
    return tostring(err) == 'timeout'
end

-- Module state
webserver.server = nil
webserver.is_server_owner = false
webserver.last_server_retry = 0
webserver.sse_clients = {}
webserver.last_notify_time = 0
webserver.last_sse_heartbeat = 0


-- Initialize webserver
function webserver.init(port, addon_name, chat)
    webserver.server = socket.tcp()
    -- Reset heartbeat timer on init so the first heartbeat fires after the normal interval
    webserver.last_sse_heartbeat = os.time()
    
    -- Try binding to localhost specifically instead of all interfaces
    -- This should fail if another instance already has the port
    webserver.server:settimeout(0) -- Non-blocking
    local success, err = webserver.server:bind('127.0.0.1', port)
    
    if success then
        local listen_success, listen_err = webserver.server:listen(5)
        if listen_success == nil and listen_err then
            print(chat.header(addon_name):append(chat.error(string.format('Failed to listen on port %d: %s', port, tostring(listen_err)))))
            webserver.server:close()
            webserver.server = nil
            webserver.is_server_owner = false
            return false
        end
        webserver.is_server_owner = true
        print(chat.header(addon_name):append(chat.message(string.format('Webserver started on http://localhost:%d', port))))
        return true
    else
        print(chat.header(addon_name):append(chat.message(string.format('Port %d already in use (bind error: %s)', port, tostring(err)))))
        print(chat.header(addon_name):append(chat.message('Sharing data with existing server instance')))
        webserver.server:close()
        webserver.server = nil
        webserver.is_server_owner = false
        return false
    end
end

-- Notify host server of inventory update (for guest clients)
function webserver.notify_host_update(port, debug_mode, addon_name, chat)
    if webserver.is_server_owner then
        -- We are the host, broadcast directly
        return
    end

    -- Throttle guest notifications to avoid flooding the host.
    local now = socket.gettime and socket.gettime() or os.time()
    if (now - webserver.last_notify_time) < 0.5 then
        return
    end
    webserver.last_notify_time = now
    
    -- Guest client: notify host via HTTP request
    local success, err = pcall(function()
        local client = socket.tcp()
        client:settimeout(0.1)
        local connect_success = client:connect('127.0.0.1', port)
        if connect_success then
            local request = string.format("GET /api/notify HTTP/1.1\r\nHost: localhost:%d\r\n\r\n", port)
            client:send(request)
            client:close()
            -- if debug_mode then
            --     print(chat.header(addon_name):append(chat.message('Notified host of inventory update')))
            -- end
        else
            client:close()
        end
    end)
    
    if not success and debug_mode then
        print(chat.header(addon_name):append(chat.error('Failed to notify host: ' .. tostring(err))))
    end
end

-- Send SSE keepalive comment to all clients to prevent proxy/browser timeouts
function webserver.send_sse_heartbeat(debug_mode, addon_name, chat)
    if not webserver.is_server_owner or #webserver.sse_clients == 0 then
        webserver.last_sse_heartbeat = os.time()
        return
    end
    
    local ping = ": keepalive\n\n"
    for i = #webserver.sse_clients, 1, -1 do
        local client = webserver.sse_clients[i]
        local send_success, err = client:send(ping)
        if not send_success then
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('SSE client dropped on heartbeat: ' .. tostring(err))))
            end
            pcall(function() client:close() end)
            table.remove(webserver.sse_clients, i)
        end
    end
    webserver.last_sse_heartbeat = os.time()
end

-- Broadcast update to all SSE clients
function webserver.broadcast_inventory_update(get_all_characters_fn, table_to_json_fn, debug_mode, addon_name, chat)
    if not webserver.is_server_owner then
        -- This shouldn't be called on guest clients
        return
    end
    
    if #webserver.sse_clients == 0 then
        if debug_mode then
            print(chat.header(addon_name):append(chat.message('No SSE clients connected')))
        end
        return
    end
    
    if debug_mode then
        print(chat.header(addon_name):append(chat.message('Generating JSON data for broadcast...')))
    end
    
    local success, json_data = pcall(function()
        local all_data = get_all_characters_fn()
        return table_to_json_fn(all_data)
    end)
    
    if not success then
        if debug_mode then
            print(chat.header(addon_name):append(chat.error('Failed to generate JSON for SSE: ' .. tostring(json_data))))
        end
        return
    end
    
    -- if debug_mode then
    --     print(chat.header(addon_name):append(chat.message('JSON generated, size: ' .. tostring(#json_data) .. ' bytes')))
    -- end
    
    local message = string.format("data: %s\n\n", json_data)
    
    -- Send to all connected SSE clients
    for i = #webserver.sse_clients, 1, -1 do
        local client = webserver.sse_clients[i]
        local send_success, err = client:send(message)
        if not send_success then
            if is_socket_timeout(err) then
                -- Non-fatal for non-blocking sockets; keep connection alive.
                if debug_mode then
                    print(chat.header(addon_name):append(chat.message('SSE send timeout; keeping client connected')))
                end
            else
                if debug_mode then
                    print(chat.header(addon_name):append(chat.message('SSE client disconnected: ' .. tostring(err))))
                end
                pcall(function() client:close() end)
                table.remove(webserver.sse_clients, i)
            end
        else
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Successfully sent update to SSE client')))
            end
        end
    end
end

-- Handle HTTP requests
-- handlers table fields: get_all_characters, table_to_json, read_html,
--   handle_move, get_move_state, handle_sell, get_sell_state, handle_sort
function webserver.handle_request(client, handlers, port, debug_mode, addon_name, chat)
    local request = client:receive()
    
    if not request then
        pcall(function() client:close() end)
        return
    end
    
    -- Parse request path
    local method, path = request:match('(%S+) (%S+)')
    
    -- Consume remaining headers and save them for POST body detection
    local content_length = 0
    local header_count = 0
    local max_headers = 100
    repeat
        local header = client:receive()
        header_count = header_count + 1
        if header_count > max_headers then
            if debug_mode then
                print(chat.header(addon_name):append(chat.error('Too many headers in request')))
            end
            return
        end
        -- Check for Content-Length header
        if header and header:match('^Content%-Length:') then
            content_length = tonumber(header:match('Content%-Length:%s*(%d+)'))
        end
    until not header or header == ''
    
    if path then
        
        -- Handle CORS preflight requests (OPTIONS)
        if method == 'OPTIONS' then
            local response = "HTTP/1.1 204 No Content\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" ..
                           "Access-Control-Allow-Headers: Content-Type\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n"
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for moving items
        if path == '/api/move' and method == 'POST' then
            -- Read POST body
            local body = ''
            if content_length > 0 then
                body = client:receive(content_length)
            end
            
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Move request body: ' .. tostring(body))))
            end
            
            -- Parse JSON body
            local payload, parse_err = require('modules.data').json_to_table(body)
            
            if not payload then
                local error_msg = parse_err or 'Invalid JSON in request body'
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('JSON parse error: ' .. error_msg)))
                end
                local error_response = "HTTP/1.1 400 Bad Request\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"' .. error_msg:gsub('"', '\\"') .. '"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Extract character_key and moves from payload (frontend sends {character_key, moves})
            local character_key = payload.character_key
            local moves = payload.moves or payload
            
            -- Handle the move request with character routing
            local result = handlers.handle_move(character_key, moves)
            local result_json = handlers.table_to_json(result)
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: application/json\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           result_json
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for move state
        if path == '/api/move/state' then
            local state = handlers.get_move_state()
            local state_json = handlers.table_to_json(state)
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: application/json\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           state_json
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for selling items
        if path == '/api/sell' and method == 'POST' then
            -- Read POST body
            local body = ''
            if content_length > 0 then
                body = client:receive(content_length)
            end
            
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Sell request body: ' .. tostring(body))))
            end
            
            -- Parse JSON body
            local payload, parse_err = require('modules.data').json_to_table(body)
            
            if not payload then
                local error_msg = parse_err or 'Invalid JSON in request body'
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('JSON parse error: ' .. error_msg)))
                end
                local error_response = "HTTP/1.1 400 Bad Request\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"' .. error_msg:gsub('"', '\\"') .. '"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Extract character_key and item_names from payload
            local character_key = payload.character_key
            local item_names = payload.item_names or payload
            
            -- Handle the sell request with character routing
            local result = handlers.handle_sell(character_key, item_names)
            local result_json = handlers.table_to_json(result)
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: application/json\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           result_json
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for sell state
        if path == '/api/sell/state' then
            local state = handlers.get_sell_state()
            local state_json = handlers.table_to_json(state)
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: application/json\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           state_json
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for sorting containers
        if path == '/api/sort' and method == 'POST' then
            -- Read POST body
            local body = ''
            if content_length > 0 then
                body = client:receive(content_length)
            end
            
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Sort request body: ' .. tostring(body))))
            end
            
            -- Parse JSON body
            local payload, parse_err = require('modules.data').json_to_table(body)
            
            if not payload then
                local error_msg = parse_err or 'Invalid JSON in request body'
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('JSON parse error: ' .. error_msg)))
                end
                local error_response = "HTTP/1.1 400 Bad Request\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"' .. error_msg:gsub('"', '\\"') .. '"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Extract character_key and container_id from payload
            local character_key = payload.character_key
            local container_id = payload.container_id
            
            -- Handle the sort request with character routing
            local success, result = pcall(function()
                return handlers.handle_sort(character_key, container_id)
            end)
            
            if not success then
                local error_msg = tostring(result)
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('Sort handler error: ' .. error_msg)))
                end
                local error_response = "HTTP/1.1 500 Internal Server Error\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"' .. error_msg:gsub('"', '\\"') .. '"}'
                client:send(error_response)
                client:close()
                return
            end
            
            local result_json = handlers.table_to_json(result)
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: application/json\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           result_json
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for updating trash items
        if path == '/api/trash' and method == 'POST' then
            -- Read POST body
            local body = ''
            if content_length > 0 then
                body = client:receive(content_length)
            end
            
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Trash update request body: ' .. tostring(body))))
            end
            
            -- Parse JSON body
            local payload, parse_err = require('modules.data').json_to_table(body)
            
            if not payload then
                local error_msg = parse_err or 'Invalid JSON in request body'
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('JSON parse error: ' .. error_msg)))
                end
                local error_response = "HTTP/1.1 400 Bad Request\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"' .. error_msg:gsub('"', '\\"') .. '"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Extract character_key and trash_items from payload
            local character_key = payload.character_key
            local trash_items = payload.trash_items
            
            if not character_key or not trash_items then
                local error_response = "HTTP/1.1 400 Bad Request\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"Missing character_key or trash_items"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Load character data
            local char_data = require('modules.data').load_character_settings(character_key, debug_mode)
            if not char_data then
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"Character not found"}'
                client:send(error_response)
                client:close()
                return
            end
            
            -- Update trash items
            char_data.trash_items = trash_items
            
            -- Save updated character data
            local success = require('modules.data').save_character_settings(character_key, char_data)
            
            if success then
                local response = "HTTP/1.1 200 OK\r\n" ..
                               "Content-Type: application/json\r\n" ..
                               "Access-Control-Allow-Origin: *\r\n" ..
                               "Connection: close\r\n" ..
                               "\r\n" ..
                               '{"success":true,"message":"Trash items updated"}'
                client:send(response)
            else
                local error_response = "HTTP/1.1 500 Internal Server Error\r\n" ..
                                     "Content-Type: application/json\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     '{"success":false,"error":"Failed to save character data"}'
                client:send(error_response)
            end
            client:close()
            return
        end
        
        -- SSE endpoint for real-time updates
        if path == '/api/events' then
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: text/event-stream\r\n" ..
                           "Cache-Control: no-cache\r\n" ..
                           "Connection: keep-alive\r\n" ..
                           "Access-Control-Allow-Origin: *\r\n" ..
                           "\r\n"
            client:send(response)
            
            -- Use a small timeout to reduce false disconnects on larger payloads.
            client:settimeout(0.1)
            
            -- Send initial data
            local success, json_data = pcall(function()
                local all_data = handlers.get_all_characters()
                return handlers.table_to_json(all_data)
            end)
            
            if success then
                local send_success = client:send(string.format("data: %s\n\n", json_data))
                if send_success then
                    -- Add to SSE clients list only after successful send
                    table.insert(webserver.sse_clients, client)
                    
                    if debug_mode then
                        print(chat.header(addon_name):append(chat.message('SSE client connected. Total: ' .. #webserver.sse_clients)))
                    end
                    
                    return -- Don't close the connection
                else
                    -- Initial send failed, close and return
                    pcall(function() client:close() end)
                    return
                end
            else
                -- Failed to generate initial data, close and return
                pcall(function() client:close() end)
                return
            end
            
            return -- Don't close the connection
        end
        
        -- Notification endpoint from guest clients
        if path == '/api/notify' then
            if debug_mode then
                print(chat.header(addon_name):append(chat.message('Received update notification from guest')))
            end
            
            -- Broadcast to all SSE clients
            if #webserver.sse_clients > 0 then
                local success, json_data = pcall(function()
                    local all_data = handlers.get_all_characters()
                    return handlers.table_to_json(all_data)
                end)
                
                if success then
                    local message = string.format("data: %s\n\n", json_data)
                    for i = #webserver.sse_clients, 1, -1 do
                        local sse_client = webserver.sse_clients[i]
                        local send_success, err = sse_client:send(message)
                        if not send_success then
                            if not is_socket_timeout(err) then
                                pcall(function() sse_client:close() end)
                                table.remove(webserver.sse_clients, i)
                            end
                        end
                    end
                end
            end
            
            local response = "HTTP/1.1 200 OK\r\n" ..
                           "Content-Type: text/plain\r\n" ..
                           "Connection: close\r\n" ..
                           "\r\n" ..
                           "OK"
            client:send(response)
            client:close()
            return
        end
        
        -- API endpoint for all characters inventory data
        if path == '/api/inventory' then
            local success, result = pcall(function()
                local all_data = handlers.get_all_characters()
                return handlers.table_to_json(all_data)
            end)
            
            if success then
                local response = "HTTP/1.1 200 OK\r\n" ..
                               "Content-Type: application/json\r\n" ..
                               "Access-Control-Allow-Origin: *\r\n" ..
                               "Connection: close\r\n" ..
                               "\r\n" ..
                               result
                client:send(response)
            else
                print(chat.header(addon_name):append(chat.error('JSON serialization error: ' .. tostring(result))))
                local error_response = "HTTP/1.1 500 Internal Server Error\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "Error: " .. tostring(result)
                client:send(error_response)
            end
        -- API endpoint for item icons
        elseif path:match('^/api/icon/(%d+)') then
            local itemId = tonumber(path:match('^/api/icon/(%d+)'))
            local resourceManager = AshitaCore:GetResourceManager()
            local itemData = resourceManager:GetItemById(itemId)
            
            if itemData and itemData.Bitmap and itemData.ImageSize > 0 then
                -- Send bitmap data as image
                local header = string.format("HTTP/1.1 200 OK\r\n" ..
                                           "Content-Type: image/bmp\r\n" ..
                                           "Content-Length: %d\r\n" ..
                                           "Access-Control-Allow-Origin: *\r\n" ..
                                           "Connection: close\r\n" ..
                                           "\r\n", itemData.ImageSize)
                client:send(header)
                client:send(ffi.string(itemData.Bitmap, itemData.ImageSize))
            else
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "Icon not found"
                client:send(error_response)
            end
        -- Serve XIIM.png favicon
        elseif path == '/XIIM.png' then
            local addon_path = AshitaCore:GetInstallPath() .. 'addons\\XIIM\\assets\\XIIM.png'
            local file = io.open(addon_path, 'rb')
            if file then
                local content = file:read('*all')
                file:close()
                local header = string.format("HTTP/1.1 200 OK\r\n" ..
                                           "Content-Type: image/png\r\n" ..
                                           "Content-Length: %d\r\n" ..
                                           "Cache-Control: no-store\r\n" ..
                                           "Connection: close\r\n" ..
                                           "\r\n", #content)
                client:send(header)
                client:send(content)
            else
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "Favicon not found"
                client:send(error_response)
            end
        -- Serve elemental icon images
        elseif path:match('^/assets/.*%-Icon%.png$') then
            local filename = path:match('/assets/(.+)$')
            
            -- Whitelist of allowed elemental icon filenames
            local allowed_icons = {
                ['Fire-Icon.png'] = true,
                ['Ice-Icon.png'] = true,
                ['Wind-Icon.png'] = true,
                ['Earth-Icon.png'] = true,
                ['Lightning-Icon.png'] = true,
                ['Water-Icon.png'] = true,
                ['Light-Icon.png'] = true,
                ['Dark-Icon.png'] = true
            }
            
            if not allowed_icons[filename] then
                local error_response = "HTTP/1.1 403 Forbidden\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "Access denied"
                client:send(error_response)
            else
                local addon_path = AshitaCore:GetInstallPath() .. 'addons\\XIIM\\assets\\' .. filename
                local file = io.open(addon_path, 'rb')
                if file then
                    local content = file:read('*all')
                    file:close()
                    local header = string.format("HTTP/1.1 200 OK\r\n" ..
                                               "Content-Type: image/png\r\n" ..
                                               "Content-Length: %d\r\n" ..
                                               "Cache-Control: public, max-age=3600\r\n" ..
                                               "Connection: close\r\n" ..
                                               "\r\n", #content)
                    client:send(header)
                    client:send(content)
                else
                    local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                         "Content-Type: text/plain\r\n" ..
                                         "Connection: close\r\n" ..
                                         "\r\n" ..
                                         "Icon not found: " .. filename
                    client:send(error_response)
                end
            end
        -- Serve app.js
        elseif path == '/app.js' then
            local addon_path = AshitaCore:GetInstallPath() .. 'addons\\XIIM\\web\\app.js'
            local file = io.open(addon_path, 'rb')
            if file then
                local content = file:read('*all')
                file:close()
                local header = string.format("HTTP/1.1 200 OK\r\n" ..
                                           "Content-Type: application/javascript\r\n" ..
                                           "Content-Length: %d\r\n" ..
                                           "Cache-Control: no-store\r\n" ..
                                           "Connection: close\r\n" ..
                                           "\r\n", #content)
                client:send(header)
                client:send(content)
            else
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "app.js not found"
                client:send(error_response)
            end
        -- Serve styles.css
        elseif path == '/styles.css' then
            local addon_path = AshitaCore:GetInstallPath() .. 'addons\\XIIM\\web\\styles.css'
            local file = io.open(addon_path, 'rb')
            if file then
                local content = file:read('*all')
                file:close()
                local header = string.format("HTTP/1.1 200 OK\r\n" ..
                                           "Content-Type: text/css\r\n" ..
                                           "Content-Length: %d\r\n" ..
                                           "Cache-Control: no-store\r\n" ..
                                           "Connection: close\r\n" ..
                                           "\r\n", #content)
                client:send(header)
                client:send(content)
            else
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: text/plain\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "styles.css not found"
                client:send(error_response)
            end
        -- Serve HTML page
        else
            local addon_path = AshitaCore:GetInstallPath() .. 'addons\\XIIM\\web\\index.html'
            local html_content = handlers.read_html(addon_path)
            
            if html_content then
                -- Inject the configured port into the HTML
                -- Find and replace the hardcoded port in SSE connection
                html_content = html_content:gsub('http://localhost:11011/api/events', string.format('http://localhost:%d/api/events', port))
                
                local response = "HTTP/1.1 200 OK\r\n" ..
                               "Content-Type: text/html\r\n" ..
                               "Connection: close\r\n" ..
                               "\r\n" ..
                               html_content
                client:send(response)
            else
                local error_response = "HTTP/1.1 404 Not Found\r\n" ..
                                     "Content-Type: text/html\r\n" ..
                                     "Connection: close\r\n" ..
                                     "\r\n" ..
                                     "<!DOCTYPE html>\n<html><body><h1>404 - HTML file not found</h1></body></html>"
                client:send(error_response)
            end
        end
    end
    
    client:close()
end

-- Check for connections (non-blocking)
-- handlers table fields: get_all_characters, table_to_json, read_html,
--   handle_move, get_move_state, handle_sell, get_sell_state, handle_sort
function webserver.update(handlers, port, debug_mode, addon_name, chat)
    if webserver.server and webserver.is_server_owner then
        -- Send SSE keepalive every 30 seconds to prevent proxy/browser timeouts
        local current_time = os.time()
        if current_time - webserver.last_sse_heartbeat >= 30 then
            webserver.send_sse_heartbeat(debug_mode, addon_name, chat)
        end
        -- Process a small batch each frame to keep the render loop responsive.
        local processed = 0
        local max_per_frame = 5
        while processed < max_per_frame do
            local client = webserver.server:accept()
            if not client then
                break
            end

            client:settimeout(0.01)
            local success, err = pcall(function()
                webserver.handle_request(client, handlers, port, debug_mode, addon_name, chat)
            end)
            if not success then
                if debug_mode then
                    print(chat.header(addon_name):append(chat.error('Request error: ' .. tostring(err))))
                end
                pcall(function() client:close() end)
            end
            processed = processed + 1
        end
    end
end

-- Try to become server owner (failover mechanism)
function webserver.try_become_owner(port, addon_name, chat)
    local test_server = socket.tcp()
    local success, test_result = pcall(function()
        test_server:settimeout(0)
        local bind_success, bind_err = test_server:bind('127.0.0.1', port)
        
        if bind_success then
            local listen_success, listen_err = test_server:listen(5)
            -- Explicitly check for success (LuaSocket returns nil, err on failure)
            if listen_success == 1 or listen_success == true then
                -- We successfully took over the server!
                webserver.server = test_server
                webserver.is_server_owner = true
                print(chat.header(addon_name):append(chat.message('Webserver ownership acquired - now serving on port ' .. port)))
                return true
            end
        end
        return false
    end)
    
    -- Always close test_server unless it became the active server
    if not (success and test_result) then
        pcall(function() test_server:close() end)
        return false
    end
    
    return test_result
end

-- Cleanup
function webserver.cleanup(addon_name, chat)
    -- Close all SSE clients
    for _, client in ipairs(webserver.sse_clients) do
        pcall(function() client:close() end)
    end
    webserver.sse_clients = {}
    
    if webserver.server and webserver.is_server_owner then
        webserver.server:close()
        print(chat.header(addon_name):append(chat.message('Webserver stopped')))
    end
end

return webserver
