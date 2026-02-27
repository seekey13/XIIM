-- moveit.lua
--
-- Class-style module responsible for validating and sending 0x029 "move item" packets.
--
-- Validations performed (best-effort, based on available memory/resource data):
--   1) Source container is known
--   2) Destination container is known
--   3) Source slot is valid for that container (uses GetContainerCountMax)
--   4) Item exists in source slot
--   5) Requested count is within stack count and 1..255
--   6) Item is not flagged / locked (best-effort via item.Flags)
--   7) Destination has at least one free slot (uses GetContainerCount + CountMax)
--   8) Destination can accept the item (wardrobe containers only accept equipable items)
--
-- Packet format:
--   29 06 [seqLo seqHi] [count] 00 00 00 [srcCont] [dstCont] [srcSlot]
--
--
-- Usage:
--   local MoveService = require('move_service');
--   local mover = MoveService.new({ moveSeq = 0x0700, log = function(level, msg) print(msg) end });
--   mover:Send({ count=1, srcCont=0, dstCont=7, srcSlot=9 });
--

require('common');

local MoveService = {};
MoveService.__index = MoveService;

-- ───────────────────────────── Container Definitions ─────────────────────────────
-- Your verified list:
local CONTAINERS = {
    [0]  = 'Inventory',
    [1]  = 'Safe',
    [2]  = 'Storage',
    [4]  = 'Locker',
    [5]  = 'Satchel',
    [6]  = 'Sack',
    [7]  = 'Case',
    [8]  = 'Wardrobe',
    [10] = 'Wardrobe2',
    [11] = 'Wardrobe3',
    [12] = 'Wardrobe4',
    [13] = 'Wardrobe5',
    [14] = 'Wardrobe6',
    [15] = 'Wardrobe7',
    [16] = 'Wardrobe8',
};

local WARDROBE = {
    [8]  = true,
    [10] = true,
    [11] = true,
    [12] = true,
    [13] = true,
    [14] = true,
    [15] = true,
    [16] = true,
};

-- ───────────────────────────── Construction ─────────────────────────────

function MoveService.new(opts)
    opts = opts or {};
    local self = setmetatable({}, MoveService);

    self.moveSeq = opts.moveSeq or 0x0700;

    -- Optional: function(level, msg) end
    self.log = opts.log;

    return self;
end

local function log(self, level, msg)
    if self.log then
        self.log(level, msg);
    end
end

-- ───────────────────────────── Core Accessors ─────────────────────────────

function MoveService:_Inv()
    return AshitaCore:GetMemoryManager():GetInventory();
end

function MoveService:_ItemRes(itemId)
    return AshitaCore:GetResourceManager():GetItemById(itemId);
end

function MoveService:_ContainerName(containerId)
    return CONTAINERS[containerId] or ('Container(' .. tostring(containerId) .. ')');
end

function MoveService:_IsKnownContainer(containerId)
    return CONTAINERS[containerId] ~= nil;
end

function MoveService:_IsWardrobe(containerId)
    return WARDROBE[containerId] == true;
end

function MoveService:_IsEmptyItem(item)
    return item == nil or item.Id == nil or item.Id == 0;
end

function MoveService:_GetContainerMax(containerId)
    local inv = self:_Inv();
    -- Your correction: dynamic max size
    return inv:GetContainerCountMax(containerId);
end

function MoveService:_IsSlotValid(containerId, slot)
    if type(slot) ~= 'number' then
        return false;
    end

    local max = self:_GetContainerMax(containerId);
    return slot >= 1 and slot <= max;
end

function MoveService:_IsDestFull(containerId)
    local inv = self:_Inv();
    local max = inv:GetContainerCountMax(containerId);
    local cnt = inv:GetContainerCount(containerId);
    return cnt >= max;
end

-- ───────────────────────────── Rule Checks ─────────────────────────────

function MoveService:_IsEquipable(itemRes)
    if itemRes == nil then
        return false;
    end

    -- Common Ashita resource field: Slots (bitmask). 0 means not equipable.
    if itemRes.Slots ~= nil then
        return itemRes.Slots ~= 0;
    end

    -- Safer default: treat unknown as not equipable.
    return false;
end

function MoveService:_CanContainerAcceptItem(dstCont, itemRes)
    -- Rule: wardrobes only accept equipable items
    if self:_IsWardrobe(dstCont) then
        return self:_IsEquipable(itemRes);
    end

    return true;
end

function MoveService:_IsBazaarOrLockedBestEffort(item)
    -- Best-effort: treat any non-zero item.Flags as locked/in-use.
    -- If you later identify a specific bazaar bit, refine this check.
    if item == nil then
        return true;
    end

    if item.Flags ~= nil and item.Flags ~= 0 then
        return true;
    end

    return false;
end

-- ───────────────────────────── Validation ─────────────────────────────
-- req fields:
--   count   (1..255)
--   srcCont (known container id)
--   dstCont (known container id)
--   srcSlot (1..GetContainerCountMax(srcCont))
--
-- Returns:
--   ok(bool), err(string|nil), ctx(table|nil)
function MoveService:Validate(req)
    if type(req) ~= 'table' then
        return false, 'Request must be a table.';
    end

    -- Count
    if type(req.count) ~= 'number' or req.count < 1 or req.count > 255 then
        return false, 'Invalid count; must be 1..255.';
    end

    -- Containers
    if type(req.srcCont) ~= 'number' or not self:_IsKnownContainer(req.srcCont) then
        return false, 'Invalid source container id.';
    end

    if type(req.dstCont) ~= 'number' or not self:_IsKnownContainer(req.dstCont) then
        return false, 'Invalid destination container id.';
    end

    if req.srcCont == req.dstCont then
        return false, 'Source and destination containers are the same.';
    end

    -- Slot
    if not self:_IsSlotValid(req.srcCont, req.srcSlot) then
        return false, ('Invalid source slot for %s.'):format(self:_ContainerName(req.srcCont));
    end

    local inv = self:_Inv();

    -- 1) Item exists
    local item = inv:GetContainerItem(req.srcCont, req.srcSlot);
    if self:_IsEmptyItem(item) then
        return false, ('No item found at %s slot %d.'):format(self:_ContainerName(req.srcCont), req.srcSlot);
    end

    -- 2) Count <= stack
    if item.Count ~= nil and req.count > item.Count then
        return false, ('Requested count (%d) exceeds stack count (%d).'):format(req.count, item.Count);
    end

    -- 3) Bazaar/locked best-effort
    if self:_IsBazaarOrLockedBestEffort(item) then
        return false, 'Item appears locked/in-use (possibly bazaar/flagged).';
    end

    -- 4) Destination has space (fast check)
    if self:_IsDestFull(req.dstCont) then
        return false, ('Destination %s is full.'):format(self:_ContainerName(req.dstCont));
    end

    -- 5) Destination acceptance rules
    local res = self:_ItemRes(item.Id);
    if not self:_CanContainerAcceptItem(req.dstCont, res) then
        return false, ('%s only accepts equipable items.'):format(self:_ContainerName(req.dstCont));
    end

    local ctx = {
        itemId   = item.Id,
        itemName = (res and res.Name and res.Name[1]) or tostring(item.Id),
        srcName  = self:_ContainerName(req.srcCont),
        dstName  = self:_ContainerName(req.dstCont),
        srcSlot  = req.srcSlot,
        stack    = item.Count,
        index    = item.Index,
    };

    return true, nil, ctx;
end

-- ───────────────────────────── Packet Send ─────────────────────────────
function MoveService:Send(req)

    local ok, err, ctx = self:Validate(req);
    if not ok then
        log(self, 'error', err);
        return false, err;
    end

    self.moveSeq = (self.moveSeq + 1) % 0x10000;

    local head = struct.pack('BBHBBBBBBBB',
        0x29,            -- [0]
        0x06,            -- [1]
        self.moveSeq,    -- [2-3]
        req.count,       -- [4]
        0x00, 0x00, 0x00,-- [5-7]
        req.srcCont,     -- [8]
        req.dstCont,     -- [9]
        req.srcSlot,     -- [10]
        0x52             -- [11]
    );

    local pkt = head:totable();
    AshitaCore:GetPacketManager():AddOutgoingPacket(0x29, pkt);

    log(self, 'info', ('Move sent: %d x %s (%s:%d -> %s)'):format(
        req.count, ctx.itemName, ctx.srcName, ctx.srcSlot, ctx.dstName
    ));

    return true;
end

return MoveService;