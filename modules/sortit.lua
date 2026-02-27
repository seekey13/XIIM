-- sortit.lua
--
-- Class-style module responsible for sending 0x03A "sort container" packets.
--
-- Packet format (8 bytes):
--   3A 04 [seqLo seqHi] [containerId] 00 00 00
--
-- Usage:
--   local SortService = require('sortit');
--   local sorter = SortService.new({ sortSeq = 0x0500, log = function(level, msg) print(msg) end });
--   sorter:Send(0); -- sort inventory

require('common');

local SortService = {};
SortService.__index = SortService;

local PKT_SORT = 0x03A;

-- ───────────────────────────── Construction ─────────────────────────────

function SortService.new(opts)
    opts = opts or {};
    local self = setmetatable({}, SortService);

    -- Rolling uint16 sequence (client uses one; we can manage our own)
    self.sortSeq = opts.sortSeq or 0x0500;

    -- Optional: function(level, msg) end
    self.log = opts.log;

    return self;
end

local function log(self, level, msg)
    if self.log then
        self.log(level, msg);
    end
end

-- ───────────────────────────── Validation ─────────────────────────────

function SortService:Validate(containerId)
    if type(containerId) ~= 'number' then
        return false, 'containerId must be a number.';
    end

    if containerId < 0 or containerId > 255 then
        return false, 'containerId must be 0..255.';
    end

    return true;
end

-- ───────────────────────────── Packet Send ─────────────────────────────

function SortService:_NextSeq()
    self.sortSeq = (self.sortSeq + 1) % 0x10000;
    return self.sortSeq;
end

function SortService:BuildPacket(containerId)
    local ok, err = self:Validate(containerId);
    if not ok then
        return nil, err;
    end

    local seq = self:_NextSeq();

    -- NOTE: Ashita struct does NOT support numeric repeat counts (no "3x").
    -- Use literal padding bytes: "xxx".
    local pkt = struct.pack('BBHBxxx',
        PKT_SORT,      -- 0x3A
        0x04,          -- size byte (matches your capture)
        seq,           -- uint16 LE
        containerId    -- uint8
    );

    return pkt, nil, { seq = seq };
end

function SortService:Send(containerId)
    local pkt, err, ctx = self:BuildPacket(containerId);
    if not pkt then
        log(self, 'error', 'Sort validate failed: ' .. tostring(err));
        return false, err;
    end

    AshitaCore:GetPacketManager():AddOutgoingPacket(PKT_SORT, pkt:totable());

    log(self, 'info', string.format('Sent sort: container=%d seq=%d', containerId, ctx.seq));
    return true;
end

return SortService;