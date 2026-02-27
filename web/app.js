        let DEBUG = false;
        
        // Temporary test values for progress bar
        let isMoving = false;
        let arrayLength = 5;
        let throttle = 2;
        let moveStartTime = 0;
        let moveTotalDuration = 0;
        
        // Sell progress tracking
        let isSelling = false;
        let sellStartTime = 0;
        let sellTotalDuration = 0;
        let waitingForSellUpdate = false;
        
        const VENTURE_WIKI_URL = 'https://www.bg-wiki.com/ffxi/CatsEyeXI_Content/Ventures';
        
        // Venture items with custom image URLs
        const VENTURE_ITEMS = {
            'Gob. Commendation': 'https://www.bg-wiki.com/images/1/15/Demon%27s_Medal_icon.png',
            'Goblin Giftbox (Small)': 'https://www.bg-wiki.com/images/2/2d/Coffer_%28Pluton%29_icon.png',
            'Goblin Giftbox (Medium)': 'https://www.bg-wiki.com/images/2/2d/Coffer_%28Pluton%29_icon.png',
            'Goblin Giftbox (Large)': 'https://www.bg-wiki.com/images/2/2d/Coffer_%28Pluton%29_icon.png',
            'Goblin Giftbox (Grand)': 'https://www.bg-wiki.com/images/2/2d/Coffer_%28Pluton%29_icon.png',
            'Goblin Brew': 'https://www.bg-wiki.com/images/5/53/Reraiser_icon.png',
            'Goblin Brew +1': 'https://www.bg-wiki.com/images/5/5d/Hi-Reraiser_icon.png',
            'Goblin Brew +2': 'https://www.bg-wiki.com/images/c/c6/Super_Reraiser_icon.png',
            'Goblin Brew +3': 'https://www.bg-wiki.com/images/d/d2/Max-Potion_%2B3_icon.png',
            'Goblin Commendations': 'https://www.bg-wiki.com/images/1/15/Demon%27s_Medal_icon.png',
            'Beastman Banners': 'https://www.bg-wiki.com/images/9/91/Beastman_Gonfalon_icon.png',
            'Tidepincher Lure': 'https://www.bg-wiki.com/images/4/42/Sardine_Chum_icon.png',
            'Emberwing Lure': 'https://www.bg-wiki.com/images/8/88/Cupid_Worm_icon.png',
            'Swiftsting Lure': 'https://www.bg-wiki.com/images/9/93/Punch_Bug_icon.png',
            'Dustburrower Lure': 'https://www.bg-wiki.com/images/2/25/Reishi_Mushroom_icon.png',
            'Aether Dust': 'https://www.bg-wiki.com/images/c/c4/Prism_Powder_icon.png',
            'Kupo Nut': 'https://www.bg-wiki.com/images/e/ea/Walnut_icon.png',
            'Prismatic Cluster': 'https://www.bg-wiki.com/images/a/af/Light_Cluster_icon.png',
            'Scarlet Cell': 'https://www.bg-wiki.com/images/c/c8/Lam._Fire_Cell_icon.png',
            'Venture Ring': 'https://www.bg-wiki.com/images/0/05/Dasra%27s_Ring_icon.png',
            'Battle Horn': 'https://www.bg-wiki.com/images/9/96/Damani_Horn_icon.png',
            'Battle Horn +1': 'https://www.bg-wiki.com/images/2/24/Damani_Horn_%2B1_icon.png',
            'Wilderness Earring': 'https://www.bg-wiki.com/images/7/78/Handler%27s_Earring_icon.png',
            'Wilder. Earring +1': 'https://www.bg-wiki.com/images/8/80/Handler%27s_Earring_%2B1_icon.png',
            "Thorin's Shield": 'https://www.bg-wiki.com/images/3/37/Thorfinn_Shield_icon.png',
            "Thorin's Shield +1": 'https://www.bg-wiki.com/images/0/03/Thorfinn_Shield_%2B1_icon.png',
            'Artisan Seal: Bd.': 'https://www.bg-wiki.com/images/4/49/Eastern_Paper_icon.png',
            'Artisan Seal: Hn.': 'https://www.bg-wiki.com/images/4/49/Eastern_Paper_icon.png',
            'Artisan Seal: Lg.': 'https://www.bg-wiki.com/images/4/49/Eastern_Paper_icon.png',
            'Artisan Seal: Ft.': 'https://www.bg-wiki.com/images/4/49/Eastern_Paper_icon.png',
            'Artisan Seal: Hd': 'https://www.bg-wiki.com/images/4/49/Eastern_Paper_icon.png',
            'Plain Gloves': 'https://www.bg-wiki.com/images/7/76/Chocobo_Gloves_icon.png',
            'Plain Gloves +1': 'https://www.bg-wiki.com/images/6/6e/Rider%27s_Gloves_icon.png',
            "Harvester's Sun Hat": 'https://www.bg-wiki.com/images/8/80/Straw_Hat_icon.png',
            "Mariner's Tunica": 'https://www.bg-wiki.com/images/0/09/Vgd._Tunica_icon.png',
            "Mariner's Tunica +1": 'https://www.bg-wiki.com/images/b/b7/Nomad%27s_Tunica_icon.png',
            "Mariner's Gloves": 'https://www.bg-wiki.com/images/1/1f/Fsh._Gloves_icon.png',
            "Mariner's Gloves +1": 'https://www.bg-wiki.com/images/1/17/Angler%27s_Gloves_icon.png',
            "Mariner's Hose": 'https://www.bg-wiki.com/images/f/ff/Fisherman%27s_Hose_icon.png',
            "Mariner's Hose +1": 'https://www.bg-wiki.com/images/4/47/Angler%27s_Hose_icon.png',
            "Mariner's Boots": 'https://www.bg-wiki.com/images/2/21/Fisherman%27s_Boots_icon.png',
            "Mariner's Boots +1": 'https://www.bg-wiki.com/images/0/0a/Angler%27s_Boots_icon.png',
            'Museum Case': 'https://www.bg-wiki.com/images/8/85/Display_Blades_icon.png',
            "Caver's Shovel": 'https://www.bg-wiki.com/images/1/16/Caver%27s_Shovel_icon.png',
            'Plain Tunica': 'https://www.bg-wiki.com/images/c/c0/Choc._Jack_Coat_icon.png',
            'Plain Tunica +1': 'https://www.bg-wiki.com/images/1/17/Rider%27s_Jack_Coat_icon.png',
            "Excavator's Shades": 'https://www.bg-wiki.com/images/8/81/Protective_Specs._icon.png',
            'Box of Rocks': 'https://www.bg-wiki.com/images/e/e7/Gemstone_Case_icon.png',
            "Lumberjack's Beret": 'https://www.bg-wiki.com/images/b/bd/Green_Beret_icon.png',
            'Worm Feelers': 'https://www.bg-wiki.com/images/b/bc/Worm_Feelers_icon.png',
            'Plain Hose': 'https://www.bg-wiki.com/images/9/95/Chocobo_Hose_icon.png',
            'Plain Hose +1': 'https://www.bg-wiki.com/images/a/a3/Rider%27s_Hose_icon.png',
            "Miner's Helmet": 'https://www.bg-wiki.com/images/6/6d/Spelunker%27s_Helm_icon.png',
            'Plain Boots': 'https://www.bg-wiki.com/images/e/ed/Chocobo_Boots_icon.png',
            'Plain Boots +1': 'https://www.bg-wiki.com/images/e/e2/Rider%27s_Boots_icon.png',
            "Angler's Commendation": 'https://www.bg-wiki.com/images/3/3e/Blue_Ribbon_icon.png',
            "Fury's Edge": 'https://www.bg-wiki.com/images/1/14/Ravana%27s_Axe_icon.png',
            'Pincer Mantle': 'https://www.bg-wiki.com/images/9/9d/Marid_Mantle_icon.png',
            'Eidolon Ring': 'https://www.bg-wiki.com/images/a/a2/Jadeite_Ring_icon.png',
            'Hieratic Ring': 'https://www.bg-wiki.com/images/9/91/Apollo%27s_Ring_icon.png',
            "Archer's Shield": 'https://www.bg-wiki.com/images/b/b5/Faerie_Shield_icon.png',
            'Yoru Shuriken': 'https://www.bg-wiki.com/images/2/2c/Togakushi_Shuriken_icon.png',
            'Resonance Sash': 'https://www.bg-wiki.com/images/4/40/Brocade_Obi_icon.png',
            'Kiryoku Nenju': 'https://www.bg-wiki.com/images/8/8f/Ajari_Necklace_icon.png',
            'Mountain Crest': 'https://www.bg-wiki.com/images/4/46/Light_Card_icon.png',
            'Forest Crest': 'https://www.bg-wiki.com/images/c/cd/Wind_Card_icon.png',
            'Tundra Crest': 'https://www.bg-wiki.com/images/f/f8/Thunder_Card_icon.png',
            'Ocean Crest': 'https://www.bg-wiki.com/images/a/a1/Water_Card_icon.png',
            'Desert Crest': 'https://www.bg-wiki.com/images/9/97/Earth_Card_icon.png',
            'Tiny Tacklebox': 'https://www.bg-wiki.com/images/b/b7/Bronze_Box_icon.png',
            'Titanic Tacklebox': 'https://www.bg-wiki.com/images/2/22/Rusty_Bolt_Case_icon.png',
            '??? Tacklebox': 'https://www.bg-wiki.com/images/b/b7/Bronze_Box_icon.png',
            'Timeworn Tacklebox': 'https://www.bg-wiki.com/images/b/b7/Bronze_Box_icon.png',
            'Goblin Gatherbox': 'https://www.bg-wiki.com/images/a/a8/Strix%27s_Coffer_icon.png',
            'Union Commendation': 'https://www.bg-wiki.com/images/2/23/Moonbow_Whistle_icon.png',
            'Special Brew': 'https://www.bg-wiki.com/images/a/a0/X-Potion_icon.png',
            'Zhulong Bell': 'https://www.bg-wiki.com/images/a/ac/Rabbit_Stick_icon.png',
            'Enlightenment': 'https://www.bg-wiki.com/images/e/e8/Abdhaljs_Tome_icon.png',
            'Sinister Sickle': 'https://www.bg-wiki.com/images/a/a4/Ivory_Sickle_icon.png',
            'Tigris Grip': 'https://www.bg-wiki.com/images/8/8d/Pax_Grip_icon.png',
            'Slippery Cape': 'https://www.bg-wiki.com/images/1/11/Peiste_Mantle_icon.png',
            'Liberty': 'https://www.bg-wiki.com/images/c/c8/Culverin_icon.png',
            'Wyrt Gorget': 'https://www.bg-wiki.com/images/d/d9/Wolf_Gorget_icon.png',
            'Myrmeleo Ring': 'https://www.bg-wiki.com/images/e/e1/Scorpion_Ring_icon.png',
            'Chivalric Emblem': 'https://www.bg-wiki.com/images/f/f5/Cama._Shield_icon.png',
            'Avarice': 'https://www.bg-wiki.com/images/1/1d/Humility_icon.png',
            'Kyugutachi': 'https://www.bg-wiki.com/images/6/6d/Shinsoku_icon.png',
            'Sprightly Feather': 'https://www.bg-wiki.com/images/d/d3/Phoenix_Feather_icon.png',
            'Hibernal Ring': 'https://www.bg-wiki.com/images/8/82/Griffon_Ring_icon.png',
            'Hailstone Hose': 'https://www.bg-wiki.com/images/f/f6/Quiahuiz_Trousers_icon.png',
            'Rikugame Nodowa': 'https://www.bg-wiki.com/images/3/3d/Darksteel_Nodowa_icon.png',
            'Tellus Pendulum': 'https://www.bg-wiki.com/images/b/b9/Moepapa_Pendant_icon.png',
            'Bagua Ring': 'https://www.bg-wiki.com/images/6/60/Renaye_Ring_icon.png',
            'Luminous Earring': 'https://www.bg-wiki.com/images/1/19/Peltast%27s_Earring_icon.png',
            'Emberpearl Earring': 'https://www.bg-wiki.com/images/c/c2/Flame_Pearl_icon.png',
            'Flamedancer Glaive': 'https://www.bg-wiki.com/images/7/76/Fuma_Shuriken_icon.png',
            'Oathbreaker': 'https://www.bg-wiki.com/images/4/49/Stylet_icon.png',
            "Kennan's Longbow": 'https://www.bg-wiki.com/images/9/93/Hangaku-no-Yumi_icon.png',
            'Manaflow Sash': 'https://www.bg-wiki.com/images/2/23/Zeta_Sash_icon.png',
            'Beastly Girdle': 'https://www.bg-wiki.com/images/5/58/Magic_Belt_icon.png'
        };
        
        // Build normalized lookup map for faster matching (lowercase keys -> image URLs)
        const VENTURE_ITEMS_NORMALIZED = {};
        for (const key in VENTURE_ITEMS) {
            VENTURE_ITEMS_NORMALIZED[key.toLowerCase()] = VENTURE_ITEMS[key];
        }
        
        // Replace elemental control characters with icon images
        function replaceElementalIcons(description) {
            if (!description) return description;
            
            // If the description already contains image tags from Lua processing, return as-is
            if (description.includes('<img') && description.includes('element-icon')) {
                // Just add the styling attributes if needed
                return description.replace(/class="element-icon"/g, 'class="element-icon" style="height: 16px; width: 16px; vertical-align: middle;"');
            }
            
            // Handle legacy corrupted sequences from old saved data
            // FFXI uses 0xEF followed by element-specific byte (0x1F-0x26)
            // These got corrupted and appear as � (U+FFFD) followed by ASCII characters
            let result = description;
            
            // Replace each corrupted elemental sequence
            result = result.split('\uFFFD\u001F').join('<img src="/assets/Fire-Icon.png" alt="Fire" style="height: 16px; width: 16px; vertical-align: middle;">'); // Fire (0x1F)
            result = result.split('\uFFFD ').join('<img src="/assets/Ice-Icon.png" alt="Ice" style="height: 16px; width: 16px; vertical-align: middle;">'); // Ice (0x20 = space)
            result = result.split('\uFFFD!').join('<img src="/assets/Wind-Icon.png" alt="Wind" style="height: 16px; width: 16px; vertical-align: middle;">'); // Wind (0x21 = !)
            result = result.split('\uFFFD"').join('<img src="/assets/Earth-Icon.png" alt="Earth" style="height: 16px; width: 16px; vertical-align: middle;">'); // Earth (0x22 = ")
            result = result.split('\uFFFD#').join('<img src="/assets/Lightning-Icon.png" alt="Lightning" style="height: 16px; width: 16px; vertical-align: middle;">'); // Lightning (0x23 = #)
            result = result.split('\uFFFD$').join('<img src="/assets/Water-Icon.png" alt="Water" style="height: 16px; width: 16px; vertical-align: middle;">'); // Water (0x24 = $)
            result = result.split('\uFFFD%').join('<img src="/assets/Light-Icon.png" alt="Light" style="height: 16px; width: 16px; vertical-align: middle;">'); // Light (0x25 = %)
            result = result.split('\uFFFD&').join('<img src="/assets/Dark-Icon.png" alt="Dark" style="height: 16px; width: 16px; vertical-align: middle;">'); // Dark (0x26 = &)        // Special characters
            result = result.replace(/\uFFFD`/g, '~'); // Tilde for ranges (0x60 = backtick, displays as ~)
            
            return result;
        }
        
        function getWikiUrlForItem(name) {
            const safeName = name || '';
            const normalized = safeName.trim().toLowerCase();
            // Check if name matches any venture item using normalized map
            if (normalized in VENTURE_ITEMS_NORMALIZED) {
                return VENTURE_WIKI_URL;
            }
            return `https://www.bg-wiki.com/index.php?search=${encodeURIComponent(safeName.replace(/ /g, '_'))}&title=Special%3ASearch&go=Go`;
        }
        
        const tooltip = document.getElementById('tooltip');
        const contextMenu = document.getElementById('contextMenu');
        const dragGhost = document.getElementById('dragGhost');
        const collapsedSections = new Set();
        let allCharactersData = {};
        let activeCharacter = null;
        let selectedItems = [];
        let bazaarItems = []; // Array to store items with bazaar prices {name, containerSlot}
        let trashItemsByCharacter = {}; // Object keyed by character_key, values are arrays of item names
        let contextMenuTarget = null;
        let isHeaderTarget = false;
        let moveMode = false;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let dragThreshold = 5; // pixels to move before considering it a drag
        let draggedItem = null;
        let dragMoveHandler = null;
        let hoveredContainer = null;
        let lastSelectedIndex = -1; // Track last selected item index for shift-click
        let isInMogHouse = false; // Track if the active character is in a mog house
        let waitingForMoveUpdate = false; // Track if we're waiting for UI update after move completes
        let itemsBeingProcessed = []; // Track items currently being processed {containerId, containerSlot, itemName}
        let lastBusyState = false; // Track previous busy state for debouncing
        let busyDebounceTimeout = null; // Timeout ID for busy state debounce
        
        // Container name to ID mapping (matches constants.lua)
        const CONTAINER_IDS = {
            'Inventory': 0,
            'Safe': 1,
            'Storage': 2,
            'Locker': 4,
            'Satchel': 5,
            'Sack': 6,
            'Case': 7,
            'Wardrobe': 8,
            'Wardrobe2': 10,
            'Wardrobe3': 11,
            'Wardrobe4': 12,
            'Wardrobe5': 13,
            'Wardrobe6': 14,
            'Wardrobe7': 15,
            'Wardrobe8': 16
        };
        
        // Track move progress locally to avoid hammering the backend.
        async function pollMoveState() {
            const elapsedSeconds = (Date.now() - moveStartTime) / 1000;
            const remainingSeconds = Math.max(0, Math.ceil(moveTotalDuration - elapsedSeconds));

            if (remainingSeconds > 0 && isMoving) {
                updateProgressBar();
                setTimeout(pollMoveState, 250);
            } else if (isMoving) {
                isMoving = false;
                waitingForMoveUpdate = true;
                updateProgressBar(); // Update to show "Updating..." state

                if (DEBUG) {
                    console.log('Move timer complete, waiting for UI update');
                }

                // Safety timeout: clear waiting flag if SSE update doesn't arrive.
                setTimeout(() => {
                    if (waitingForMoveUpdate) {
                        if (DEBUG) {
                            console.log('Move update timeout reached, clearing progress bar');
                        }
                        // Clear busy items state on timeout
                        itemsBeingProcessed.forEach(busyItem => {
                            const itemElement = document.querySelector(
                                `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                            );
                            if (itemElement) {
                                itemElement.classList.remove('busy');
                            }
                        });
                        itemsBeingProcessed = [];
                        waitingForMoveUpdate = false;
                        updateProgressBar();
                    }
                }, 3000);
            } else {
                // If move state was cleared by another path, just refresh UI.
                updateProgressBar();
            }
        }

        // Track sell progress locally to avoid hammering the backend.
        async function pollSellState() {
            const elapsedSeconds = (Date.now() - sellStartTime) / 1000;
            const remainingSeconds = Math.max(0, Math.ceil(sellTotalDuration - elapsedSeconds));

            if (remainingSeconds > 0 && isSelling) {
                updateProgressBar();
                setTimeout(pollSellState, 250);
            } else if (isSelling) {
                isSelling = false;
                waitingForSellUpdate = true;
                updateProgressBar(); // Update to show "Updating..." state

                if (DEBUG) {
                    console.log('Sell timer complete, waiting for UI update');
                }

                // Safety timeout: clear waiting flag if SSE update doesn't arrive.
                setTimeout(() => {
                    if (waitingForSellUpdate) {
                        if (DEBUG) {
                            console.log('Sell update timeout reached, clearing progress bar');
                        }
                        // Clear busy items on timeout
                        itemsBeingProcessed.forEach(busyItem => {
                            const itemElement = document.querySelector(
                                `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                            );
                            if (itemElement) {
                                itemElement.classList.remove('busy');
                            }
                        });
                        itemsBeingProcessed = [];
                        waitingForSellUpdate = false;
                        updateProgressBar();
                    }
                }, 3000);
            } else {
                updateProgressBar();
            }
        }
        
        // Send move request to backend
        async function sendMoveRequest(items, targetContainerId) {
            if (!items || items.length === 0) {
                console.error('No items to move');
                return { success: false, error: 'No items to move' };
            }
            
            // Helper function to clear busy state
            function clearBusyState() {
                itemsBeingProcessed.forEach(busyItem => {
                    const itemElement = document.querySelector(
                        `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                    );
                    if (itemElement) {
                        itemElement.classList.remove('busy');
                    }
                });
                itemsBeingProcessed = [];
            }
            
            // Build move request array
            const moves = items.map(item => {
                const move = {
                    count: item.count || 1,
                    srcCont: parseInt(item.containerId),
                    dstCont: parseInt(targetContainerId),
                    srcSlot: parseInt(item.containerSlot)
                };
                
                if (DEBUG) {
                    console.log('Mapping item:', item, '-> move:', move);
                }
                
                return move;
            });
            
            // Build request payload with character key
            const requestPayload = {
                character_key: activeCharacter,
                moves: moves
            };
            
            if (DEBUG) {
                console.log('Sending move request:', requestPayload);
            }
            
            // Set move in progress and show progress bar
            isMoving = true;
            arrayLength = moves.length;
            moveStartTime = Date.now();
            moveTotalDuration = arrayLength * throttle;
            updateProgressBar();
            
            // Mark items as busy (dim and disable interaction)
            itemsBeingProcessed = items.map(item => ({
                containerId: item.containerId,
                containerSlot: item.containerSlot,
                itemName: item.name
            }));
            
            // Add 'busy' class to items in the DOM
            itemsBeingProcessed.forEach(busyItem => {
                const itemElement = document.querySelector(
                    `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                );
                if (itemElement) {
                    itemElement.classList.add('busy');
                }
            });
            
            try {
                const response = await fetch('/api/move', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                });
                
                const result = await response.json();
                
                if (DEBUG) {
                    console.log('Move response:', result);
                }
                
                if (!result.success) {
                    console.error('Move failed:', result.error || 'Unknown error');
                    if (result.errors && result.errors.length > 0) {
                        console.error('Errors:', result.errors);
                    }
                    // On failure, stop the progress bar immediately and clear busy state
                    isMoving = false;
                    clearBusyState();
                    updateProgressBar();
                } else {
                    // Start polling to track backend progress
                    pollMoveState();
                }
                
                return result;
            } catch (error) {
                console.error('Failed to send move request:', error);
                // On error, stop the progress bar and clear busy state
                isMoving = false;
                clearBusyState();
                updateProgressBar();
                return { success: false, error: error.message };
            }
        }
        
        // Send sort request to backend
        async function sendSortRequest(containerId) {
            if (!activeCharacter) {
                console.error('No active character');
                return { success: false, error: 'No active character' };
            }
            
            // Build request payload with character key and container ID
            const requestPayload = {
                character_key: activeCharacter,
                container_id: containerId
            };
            
            if (DEBUG) {
                console.log('Sending sort request:', requestPayload);
            }
            
            try {
                const response = await fetch('/api/sort', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                });
                
                const result = await response.json();
                
                if (DEBUG) {
                    console.log('Sort response:', result);
                }
                
                if (!result.success) {
                    console.error('Sort failed:', result.error || 'Unknown error');
                    alert('Sort failed: ' + (result.error || 'Unknown error'));
                } else {
                    console.log('Sort request sent successfully');
                }
                
                return result;
            } catch (error) {
                console.error('Failed to send sort request:', error);
                alert('Sort failed: ' + error.message);
                return { success: false, error: error.message };
            }
        }
        
        function updateDragGhost(x, y) {
            dragGhost.style.left = (x + 15) + 'px';
            dragGhost.style.top = (y + 15) + 'px';
        }
        
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        function formatDate(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }
        
        function hideTooltip() {
            tooltip.style.display = 'none';
        }
        
        function updateProgressBar() {
            const progressBarContainer = document.getElementById('progressBarContainer');
            const progressBarLabel = document.getElementById('progressBarLabel');
            
            if (isMoving || waitingForMoveUpdate || isSelling || waitingForSellUpdate) {
                progressBarContainer.classList.add('visible');
                
                if (waitingForMoveUpdate || waitingForSellUpdate) {
                    // Show "Updating..." message while waiting for SSE update
                    progressBarLabel.textContent = 'Updating inventory...';
                } else if (isSelling) {
                    // Calculate remaining time for sell based on elapsed time
                    const elapsedSeconds = (Date.now() - sellStartTime) / 1000;
                    const remainingSeconds = Math.max(0, Math.ceil(sellTotalDuration - elapsedSeconds));
                    
                    progressBarLabel.textContent = `Sell in progress, ${remainingSeconds} seconds remaining...`;
                } else {
                    // Calculate remaining time for move based on elapsed time
                    const elapsedSeconds = (Date.now() - moveStartTime) / 1000;
                    const remainingSeconds = Math.max(0, Math.ceil(moveTotalDuration - elapsedSeconds));
                    
                    progressBarLabel.textContent = `Move in progress, ${remainingSeconds} seconds remaining...`;
                }
            } else {
                progressBarContainer.classList.remove('visible');
            }
            
            // Update button states (sell trash and sort icons)
            updateButtonStates();
        }
        
        function updateButtonStates() {
            // Check if we're in a busy state
            const isBusy = isMoving || waitingForMoveUpdate || isSelling || waitingForSellUpdate || itemsBeingProcessed.length > 0;
            
            // Clear any pending debounce timeout if we're going back to busy
            if (isBusy && busyDebounceTimeout) {
                clearTimeout(busyDebounceTimeout);
                busyDebounceTimeout = null;
            }
            
            // If transitioning from busy to not busy, add 1 second delay
            if (lastBusyState && !isBusy) {
                // Don't update buttons yet - wait 1 second
                if (!busyDebounceTimeout) {
                    busyDebounceTimeout = setTimeout(() => {
                        busyDebounceTimeout = null;
                        lastBusyState = false;
                        // Update all sell trash buttons
                        const sellTrashButtons = document.querySelectorAll('.sell-trash-btn');
                        sellTrashButtons.forEach(btn => {
                            btn.disabled = false;
                        });
                        // Update all sort icons (remove busy disabled, keep mog house disabled)
                        const sortIcons = document.querySelectorAll('.sort-icon');
                        sortIcons.forEach(icon => {
                            // Check if this is a mog house container that should stay disabled
                            const section = icon.closest('.section, .left-column');
                            const isMogHouseRestricted = section?.classList.contains('not-in-mog-house');
                            if (!isMogHouseRestricted) {
                                icon.classList.remove('disabled');
                            }
                        });
                    }, 3000);
                }
                return; // Don't update buttons this cycle
            }
            
            // If transitioning from not busy to busy, update immediately
            if (!lastBusyState && isBusy) {
                lastBusyState = true;
            }
            
            // Update all sell trash buttons
            const sellTrashButtons = document.querySelectorAll('.sell-trash-btn');
            sellTrashButtons.forEach(btn => {
                btn.disabled = isBusy;
            });
            
            // Update all sort icons
            const sortIcons = document.querySelectorAll('.sort-icon');
            sortIcons.forEach(icon => {
                if (isBusy) {
                    icon.classList.add('disabled');
                } else {
                    // Check if this is a mog house container that should stay disabled
                    const section = icon.closest('.section, .left-column');
                    const isMogHouseRestricted = section?.classList.contains('not-in-mog-house');
                    if (!isMogHouseRestricted) {
                        icon.classList.remove('disabled');
                    }
                }
            });
        }
        
        function attachTooltip(element, getContentFn) {
            element.addEventListener('mouseenter', (e) => {
                // Don't show tooltips during move mode
                if (moveMode) return;
                
                tooltip.innerHTML = getContentFn();
                tooltip.style.display = 'block';
                
                // Initial position
                let x = e.pageX + 10;
                let y = e.pageY + 10;
                
                // Get tooltip dimensions after display
                const tooltipRect = tooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Adjust horizontal position if tooltip would go off screen
                if (x + tooltipRect.width > viewportWidth) {
                    x = viewportWidth - tooltipRect.width - 10;
                }
                
                // Adjust vertical position if tooltip would go off screen
                if (y + tooltipRect.height > window.pageYOffset + viewportHeight) {
                    y = window.pageYOffset + viewportHeight - tooltipRect.height - 10;
                }
                
                // Ensure tooltip doesn't go off left edge
                if (x < 10) {
                    x = 10;
                }
                
                // Ensure tooltip doesn't go off top edge
                if (y < window.pageYOffset + 10) {
                    y = window.pageYOffset + 10;
                }
                
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            });
            
            element.addEventListener('mousemove', (e) => {
                // Don't update tooltips during move mode
                if (moveMode) return;
                
                let x = e.pageX + 10;
                let y = e.pageY + 10;
                
                // Get tooltip dimensions
                const tooltipRect = tooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Adjust horizontal position if tooltip would go off screen
                if (x + tooltipRect.width > viewportWidth) {
                    x = viewportWidth - tooltipRect.width - 10;
                }
                
                // Adjust vertical position if tooltip would go off screen
                if (y + tooltipRect.height > window.pageYOffset + viewportHeight) {
                    y = window.pageYOffset + viewportHeight - tooltipRect.height - 10;
                }
                
                // Ensure tooltip doesn't go off left edge
                if (x < 10) {
                    x = 10;
                }
                
                // Ensure tooltip doesn't go off top edge
                if (y < window.pageYOffset + 10) {
                    y = window.pageYOffset + 10;
                }
                
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            });
            
            element.addEventListener('mouseleave', hideTooltip);
        }
        
        function createItemElement(item, isEquipped = false) {
            const div = document.createElement('div');
            div.className = 'item';
            div.dataset.itemName = item.name.toLowerCase();
            
            // Store selection data
            div.dataset.itemId = item.id;
            div.dataset.containerSlot = item.containerSlot !== undefined ? item.containerSlot : item.slot;
            div.dataset.containerId = item.containerId !== undefined ? item.containerId : 'unknown';
            div.dataset.itemCount = item.count || 1;
            
            // Store item data for filtering
            div.dataset.itemLevel = item.level || 0;
            div.dataset.itemRare = item.rare || false;
            div.dataset.itemExclusive = item.exclusive || false;
            div.dataset.itemAugmented = (item.augments && item.augments.augments && item.augments.augments.length > 0) || false;
            div.dataset.itemJobs = item.jobs || 0;
            div.dataset.itemSkill = item.skill || 0;
            div.dataset.itemRaces = item.races || 0;
            div.dataset.itemSkill = item.skill || 0;
            div.dataset.itemSlotMask = item.slotMask || 0;
            div.dataset.itemType = item.type || 0;
            div.dataset.itemDescription = (item.Description || '').toLowerCase();
            
            // Add equipped class if this item is equipped
            if (isEquipped) {
                div.classList.add('equipped');
            }
            
            // Add bazaar class if this item has a price
            if (item.price && item.price > 0) {
                div.classList.add('bazaar');
            }
            
            // Add trash class if this item name is in the character's trash list
            const currentTrashList = trashItemsByCharacter[activeCharacter];
            if (Array.isArray(currentTrashList) && currentTrashList.some(trashItem => trashItem.toLowerCase() === item.name.toLowerCase())) {
                div.classList.add('trash');
            }
            
            // Add busy class if this item is currently being processed
            const isBeingProcessed = itemsBeingProcessed.some(busyItem => 
                busyItem.containerId === item.containerId && 
                busyItem.containerSlot === (item.containerSlot !== undefined ? item.containerSlot : item.slot)
            );
            if (isBeingProcessed) {
                div.classList.add('busy');
            }
            
            // Apply background color if provided, otherwise use default white
            if (item.backgroundColor) {
                div.style.backgroundColor = item.backgroundColor;
            }
            
            const img = document.createElement('img');
            // Check if this is a venture item with a custom image URL (case-insensitive lookup)
            const normalizedItemName = item.name.trim().toLowerCase();
            const isVentureItem = normalizedItemName in VENTURE_ITEMS_NORMALIZED;
            const customImageUrl = VENTURE_ITEMS_NORMALIZED[normalizedItemName];
            
            if (isVentureItem) {
                if (customImageUrl) {
                    img.src = customImageUrl;
                } else {
                    img.src = `https://static.ffxiah.com/images/icon/${item.id}.png`;
                }
            } else {
                img.src = `https://static.ffxiah.com/images/icon/${item.id}.png`;
            }
            
            img.alt = item.name;
            img.draggable = false;
            img.onerror = function() {
                // Fallback if image doesn't exist
                this.style.display = 'none';
            };
            div.appendChild(img);
            
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = item.count;
                div.appendChild(count);
            }
            
            // Add click handler for selection
            div.addEventListener('mousedown', (e) => {
                // Don't allow interaction with items being processed
                if (div.classList.contains('busy')) {
                    return;
                }
                // Don't allow dragging equipped or bazaar items
                if (div.classList.contains('equipped') || div.classList.contains('bazaar')) {
                    return;
                }
                // Don't handle for empty slots or right clicks
                if (div.classList.contains('empty-slot') || e.button !== 0) {
                    return;
                }
                
                // If not in mog house, block Safe (1), Storage (2), and Locker (4) only
                if (!isInMogHouse) {
                    const itemContainerId = parseInt(div.dataset.containerId);
                    if (itemContainerId === 1 || itemContainerId === 2 || itemContainerId === 4) {
                        e.preventDefault();
                        div.classList.add('mog-house-denied');
                        setTimeout(() => {
                            div.classList.remove('mog-house-denied');
                        }, 500);
                        return;
                    }
                }
                
                // Prevent default to stop image drag/selection
                e.preventDefault();
                
                // Store drag start position
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                isDragging = false;
                draggedItem = {
                    element: div,
                    item: item
                };
                
                // Create global mouse move handler
                dragMoveHandler = (moveEvent) => {
                    // Check if we've moved enough to consider it a drag
                    if (!isDragging && moveEvent.buttons === 1) {
                        const deltaX = Math.abs(moveEvent.clientX - dragStartX);
                        const deltaY = Math.abs(moveEvent.clientY - dragStartY);
                        
                        if (deltaX > dragThreshold || deltaY > dragThreshold) {
                            // Don't allow moves while sell operation is in progress or items are being processed
                            if (isSelling || waitingForSellUpdate || isMoving || waitingForMoveUpdate || itemsBeingProcessed.length > 0) {
                                return;
                            }
                            
                            isDragging = true;
                            
                            // If this item isn't selected, select it
                            if (!div.classList.contains('selected')) {
                                div.classList.add('selected');
                                const instanceKey = div.dataset.containerId + ':' + div.dataset.containerSlot;
                                // Remove any existing entry for this item first
                                selectedItems = selectedItems.filter(sel => 
                                    (sel.containerId + ':' + sel.containerSlot) !== instanceKey
                                );
                                selectedItems.push({
                                    name: item.name,
                                    containerSlot: parseInt(div.dataset.containerSlot),
                                    containerId: parseInt(div.dataset.containerId),
                                    count: parseInt(div.dataset.itemCount)
                                });
                            }
                            
                            // Create drag ghost
                            dragGhost.innerHTML = '';
                            const maxGhostItems = 5;
                            const itemsToShow = selectedItems.slice(0, maxGhostItems);
                            
                            itemsToShow.forEach((selItem, index) => {
                                const ghostItem = document.createElement('div');
                                ghostItem.className = 'item';
                                ghostItem.style.width = '36px';
                                ghostItem.style.height = '36px';
                                
                                const ghostImg = document.createElement('img');
                                // Find the actual element to get the correct image src
                                const actualItem = document.querySelector(`[data-container-id="${selItem.containerId}"][data-container-slot="${selItem.containerSlot}"]`);
                                if (actualItem) {
                                    const actualImg = actualItem.querySelector('img');
                                    if (actualImg) {
                                        ghostImg.src = actualImg.src;
                                    }
                                }
                                ghostImg.style.width = '100%';
                                ghostImg.style.height = '100%';
                                ghostImg.draggable = false;
                                
                                ghostItem.appendChild(ghostImg);
                                
                                // Add count if > 1
                                if (selItem.count > 1) {
                                    const countEl = document.createElement('div');
                                    countEl.className = 'item-count';
                                    countEl.textContent = selItem.count;
                                    ghostItem.appendChild(countEl);
                                }
                                
                                dragGhost.appendChild(ghostItem);
                            });
                            
                            // Add badge if more items than shown
                            if (selectedItems.length > maxGhostItems) {
                                const badge = document.createElement('div');
                                badge.className = 'drag-ghost-badge';
                                badge.textContent = selectedItems.length;
                                dragGhost.appendChild(badge);
                            }
                            
                            dragGhost.classList.add('visible');
                            updateDragGhost(moveEvent.clientX, moveEvent.clientY);
                            
                            // Enter move mode
                            moveMode = true;
                            document.body.style.cursor = 'crosshair';
                            hideTooltip();
                            
                            if (DEBUG) {
                                console.log('Drag started - entering move mode');
                            }
                        }
                    }
                    
                    // Update ghost position while dragging
                    if (isDragging) {
                        updateDragGhost(moveEvent.clientX, moveEvent.clientY);
                    }
                };
                
                // Attach global mousemove listener
                document.addEventListener('mousemove', dragMoveHandler);
            });
            
            div.addEventListener('click', (e) => {
                // Don't select items being processed
                if (div.classList.contains('busy')) {
                    return;
                }
                // Don't select empty slots
                if (div.classList.contains('empty-slot')) {
                    return;
                }
                
                // Don't select equipped or bazaar items
                if (div.classList.contains('equipped') || div.classList.contains('bazaar')) {
                    return;
                }
                
                // If not in mog house, block Safe (1), Storage (2), and Locker (4) only
                if (!isInMogHouse) {
                    const itemContainerId = parseInt(div.dataset.containerId);
                    if (itemContainerId === 1 || itemContainerId === 2 || itemContainerId === 4) {
                        div.classList.add('mog-house-denied');
                        setTimeout(() => {
                            div.classList.remove('mog-house-denied');
                        }, 500);
                        return;
                    }
                }
                
                // If we were dragging, don't handle as a click
                if (isDragging) {
                    return;
                }
                
                const instanceKey = div.dataset.containerId + ':' + div.dataset.containerSlot;
                const itemData = {
                    name: item.name,
                    containerSlot: parseInt(div.dataset.containerSlot),
                    containerId: parseInt(div.dataset.containerId),
                    count: parseInt(div.dataset.itemCount)
                };
                
                if (e.shiftKey && lastSelectedIndex !== -1) {
                    // Shift+click: Select range from last selected to current
                    const allItems = Array.from(document.querySelectorAll('.item:not(.empty-slot):not(.equipped):not(.bazaar)'));
                    const currentIndex = allItems.indexOf(div);
                    
                    if (currentIndex !== -1) {
                        const start = Math.min(lastSelectedIndex, currentIndex);
                        const end = Math.max(lastSelectedIndex, currentIndex);
                        
                        // Clear existing selection first
                        document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
                        selectedItems = [];
                        
                        // Select range
                        for (let i = start; i <= end; i++) {
                            const itemEl = allItems[i];
                            itemEl.classList.add('selected');
                            selectedItems.push({
                                name: itemEl.querySelector('.item-name')?.textContent || itemEl.dataset.itemName,
                                containerSlot: parseInt(itemEl.dataset.containerSlot),
                                containerId: parseInt(itemEl.dataset.containerId),
                                count: parseInt(itemEl.dataset.itemCount)
                            });
                        }
                    }
                } else if (e.ctrlKey || e.metaKey) {
                    // Ctrl+click: Toggle this item in selection
                    if (div.classList.contains('selected')) {
                        div.classList.remove('selected');
                        selectedItems = selectedItems.filter(sel => 
                            (sel.containerId + ':' + sel.containerSlot) !== instanceKey
                        );
                    } else {
                        div.classList.add('selected');
                        selectedItems.push(itemData);
                        lastSelectedIndex = Array.from(document.querySelectorAll('.item:not(.empty-slot):not(.equipped):not(.bazaar)')).indexOf(div);
                    }
                } else {
                    // Plain click: Select only this item
                    document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
                    selectedItems = [];
                    
                    div.classList.add('selected');
                    selectedItems.push(itemData);
                    lastSelectedIndex = Array.from(document.querySelectorAll('.item:not(.empty-slot):not(.equipped):not(.bazaar)')).indexOf(div);
                }
                
                // Log to console in debug mode
                if (DEBUG) {
                    console.log('Selected Items:', selectedItems);
                }
            });
            
            // Add right-click handler for context menu
            div.addEventListener('contextmenu', (e) => {
                // Don't show menu for empty slots
                if (div.classList.contains('empty-slot')) {
                    return;
                }
                
                // Don't show menu for bazaar items
                if (div.classList.contains('bazaar')) {
                    return;
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                // Store the target item with all necessary data
                contextMenuTarget = {
                    name: item.name,
                    id: item.id,
                    slot: div.dataset.containerSlot,
                    containerId: div.dataset.containerId
                };
                
                // Show/hide menu items based on context
                isHeaderTarget = false;
                const consolidateMenuItem = document.getElementById('consolidateMenuItem');
                const collapseAllMenuItem = document.getElementById('collapseAllMenuItem');
                const expandAllMenuItem = document.getElementById('expandAllMenuItem');
                const moveMenuItem = document.getElementById('moveMenuItem');
                const wikiMenuItem = document.getElementById('wikiMenuItem');
                const setBazaarMenuItem = document.getElementById('setBazaarMenuItem');
                const tagAsTrashMenuItem = document.getElementById('tagAsTrashMenuItem');
                const removeFromTrashMenuItem = document.getElementById('removeFromTrashMenuItem');
                
                // Determine if item is in trash list
                const currentTrashList = trashItemsByCharacter[activeCharacter];
                const itemName = item.name;
                const isInTrash = Array.isArray(currentTrashList) && currentTrashList.some(trashItem => trashItem.toLowerCase() === itemName.toLowerCase());
                const isEquipped = div.classList.contains('equipped');
                
                // Hide consolidate and set bazaar price
                consolidateMenuItem.style.display = 'none';
                setBazaarMenuItem.style.display = 'none';
                
                // Hide move for equipped items or when operations are in progress
                const isBusy = isSelling || waitingForSellUpdate || isMoving || waitingForMoveUpdate || itemsBeingProcessed.length > 0;
                moveMenuItem.style.display = (isEquipped || isBusy) ? 'none' : 'flex';
                wikiMenuItem.style.display = 'flex';
                
                // Show either "Tag as Trash" or "Remove from Trash" based on current state
                // Hide "Tag as Trash" if item is equipped or cannot be sold
                if (isInTrash) {
                    tagAsTrashMenuItem.style.display = 'none';
                    removeFromTrashMenuItem.style.display = 'flex';
                } else if (isEquipped || item.noSale) {
                    tagAsTrashMenuItem.style.display = 'none';
                    removeFromTrashMenuItem.style.display = 'none';
                } else {
                    tagAsTrashMenuItem.style.display = 'flex';
                    removeFromTrashMenuItem.style.display = 'none';
                }
                
                collapseAllMenuItem.style.display = 'none';
                expandAllMenuItem.style.display = 'none';
                
                // Position and show context menu with boundary checking
                contextMenu.classList.add('visible');
                
                // Initial position
                let x = e.pageX;
                let y = e.pageY;
                
                // Get menu dimensions after making it visible
                const menuRect = contextMenu.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Adjust horizontal position if menu would go off screen
                if (x + menuRect.width > viewportWidth) {
                    x = viewportWidth - menuRect.width - 10;
                }
                
                // Adjust vertical position if menu would go off screen
                if (y + menuRect.height > window.pageYOffset + viewportHeight) {
                    y = window.pageYOffset + viewportHeight - menuRect.height - 10;
                }
                
                // Ensure menu doesn't go off left edge
                if (x < 10) {
                    x = 10;
                }
                
                // Ensure menu doesn't go off top edge
                if (y < window.pageYOffset + 10) {
                    y = window.pageYOffset + 10;
                }
                
                contextMenu.style.left = x + 'px';
                contextMenu.style.top = y + 'px';
                
                // Hide tooltip when showing context menu
                hideTooltip();
            });
            
            attachTooltip(div, () => {
                // Build name row with rare/exclusive/augmented flags
                let nameRow = `<div class="tooltip-row" style="display: flex; justify-content: space-between; align-items: center;">`;
                nameRow += `<strong>${item.name}${item.count > 1 ? ` (${item.count})` : ''}</strong>`;
                if (item.rare === true || item.exclusive === true || (item.augments && item.augments.augments && item.augments.augments.length > 0)) {
                    nameRow += `<div style="display: flex; gap: 6px; padding-left: 8px;">`;
                    if (item.rare === true) {
                        nameRow += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 15px; border: 2px solid #fbbf24; border-radius: 10px; color: rgb(15, 23, 42); background-color: #fbbf24; font-weight: 700; font-size: 11px;">Rare</span>`;
                    }
                    if (item.exclusive === true) {
                        nameRow += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 15px; border: 2px solid #10b981; border-radius: 10px; color: rgb(15, 23, 42); background-color: #10b981; font-weight: 700; font-size: 11px;">Ex.</span>`;
                    }
                    if (item.augments && item.augments.augments && item.augments.augments.length > 0) {
                        nameRow += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 15px; border: 2px solid #ec4899; border-radius: 10px; color: rgb(15, 23, 42); background-color: #ec4899; font-weight: 700; font-size: 11px;">Aug.</span>`;
                    }
                    nameRow += `</div>`;
                }
                nameRow += `</div>`;
                
                const lines = [
                    nameRow,
                ];
                
                // Show ID and Slot only in debug mode
                if (DEBUG) {
                    lines.push(`<div class="tooltip-row">ID: ${item.id}</div>`);
                    lines.push(`<div class="tooltip-row">Slot: ${item.slot !== undefined ? item.slot : 'Equipped'}</div>`);
                }
                

                


                // Display skill and race restrictions
                let skillText = '';
                if (item.skill && item.skill > 0) {
                    const skillNames = {
                        1: 'Hand-to-Hand', 2: 'Dagger', 3: 'Sword', 4: 'G.Sword',
                        5: 'Axe', 6: 'G.Axe', 7: 'Scythe', 8: 'Polearm',
                        9: 'Katana', 10: 'G.Katana', 11: 'Club', 12: 'Staff',
                        25: 'Archery', 26: 'Marksmanship', 27: 'Throwing',
                        41: 'String', 42: 'Wind', 45: 'Handbell', 48: 'Fishing'
                    };
                    const skillName = skillNames[item.skill] || item.skill;
                    skillText = `(${skillName}) `;
                }
                
                // Build slot text (only if no skill)
                let slotText = '';
                if (!skillText && item.slotMask && item.slotMask > 0) {
                    const slotNames = [];
                    if (item.slotMask & 1) slotNames.push('Two Handed');
                    if (item.slotMask & 2) slotNames.push('Off Hand');
                    if (item.slotMask & 4) slotNames.push('Ranged');
                    if (item.slotMask & 8) slotNames.push('Ammo');
                    if (item.slotMask & 16) slotNames.push('Head');
                    if (item.slotMask & 32) slotNames.push('Body');
                    if (item.slotMask & 64) slotNames.push('Hands');
                    if (item.slotMask & 128) slotNames.push('Legs');
                    if (item.slotMask & 256) slotNames.push('Feet');
                    if (item.slotMask & 512) slotNames.push('Neck');
                    if (item.slotMask & 1024) slotNames.push('Waist');
                    if (item.slotMask & 2048) slotNames.push('Ear');
                    if (item.slotMask & 4096) slotNames.push('Ear');
                    if (item.slotMask & 8192) slotNames.push('Ring');
                    if (item.slotMask & 16384) slotNames.push('Ring');
                    if (item.slotMask & 32768) slotNames.push('Back');
                    
                    // Remove duplicates for Ear and Ring
                    const uniqueSlotNames = [...new Set(slotNames)];
                    if (uniqueSlotNames.length > 0) {
                        slotText = `[${uniqueSlotNames.join(' / ')}] `;
                    }
                }
                
                if (skillText || slotText || (item.races && item.races > 0)) {
                    const raceNames = [];
                    if (item.races & 0x02) raceNames.push('Hume M');
                    if (item.races & 0x04) raceNames.push('Hume F');
                    if (item.races & 0x08) raceNames.push('Elvaan M');
                    if (item.races & 0x10) raceNames.push('Elvaan F');
                    if (item.races & 0x20) raceNames.push('Tarutaru M');
                    if (item.races & 0x40) raceNames.push('Tarutaru F');
                    if (item.races & 0x80) raceNames.push('Mithra');
                    if (item.races & 0x100) raceNames.push('Galka');
                    
                    if (skillText || slotText || raceNames.length > 0) {
                        let raceText = '';
                        if (raceNames.length === 8) {
                            raceText = 'All Races';
                        } else if (raceNames.length > 0) {
                            raceText = raceNames.join(' / ');
                        }
                        if (skillText || slotText || raceText) {
                            lines.push(`<div class="tooltip-row">${skillText}${slotText}${raceText}</div>`);
                        }
                    }
                }

                // Display description
                if (item.Description) {
                    const dpsText = (item.dps && item.dps > 0) ? ` <strong style="color: #FFFFFF;">DPS:</strong> ${item.dps.toFixed(2)}` : '';
                    const descriptionWithIcons = replaceElementalIcons(item.Description);
                    lines.push(`<div class="tooltip-row" style="font-size: 16px;"><strong style="color: #FFFFFF;">${descriptionWithIcons} ${dpsText}</strong></div>`);
                }

                
                // Display level requirement and job restrictions on same line
                const levelText = (item.level && item.level > 0) ? `Lv. ${item.level} ` : '';
                let jobsText = '';
                
                if (item.jobs && item.jobs > 0) {
                    const jobNames = [];
                    if (item.jobs & 0x02) jobNames.push('WAR');
                    if (item.jobs & 0x04) jobNames.push('MNK');
                    if (item.jobs & 0x08) jobNames.push('WHM');
                    if (item.jobs & 0x10) jobNames.push('BLM');
                    if (item.jobs & 0x20) jobNames.push('RDM');
                    if (item.jobs & 0x40) jobNames.push('THF');
                    if (item.jobs & 0x80) jobNames.push('PLD');
                    if (item.jobs & 0x100) jobNames.push('DRK');
                    if (item.jobs & 0x200) jobNames.push('BST');
                    if (item.jobs & 0x400) jobNames.push('BRD');
                    if (item.jobs & 0x800) jobNames.push('RNG');
                    if (item.jobs & 0x1000) jobNames.push('SAM');
                    if (item.jobs & 0x2000) jobNames.push('NIN');
                    if (item.jobs & 0x4000) jobNames.push('DRG');
                    if (item.jobs & 0x8000) jobNames.push('SMN');
                    if (item.jobs & 0x10000) jobNames.push('BLU');
                    if (item.jobs & 0x20000) jobNames.push('COR');
                    if (item.jobs & 0x40000) jobNames.push('PUP');
                    if (item.jobs & 0x80000) jobNames.push('DNC');
                    if (item.jobs & 0x100000) jobNames.push('SCH');
                    if (item.jobs & 0x200000) jobNames.push('GEO');
                    if (item.jobs & 0x400000) jobNames.push('RUN');
                    
                    if (jobNames.length === 22) {
                        jobsText = 'All Jobs';
                    } else if (jobNames.length > 0) {
                        jobsText = jobNames.join(' / ');
                    }
                }
                
                if (levelText || jobsText) {
                    const combinedText = [levelText, jobsText].filter(t => t).join(' ');
                    lines.push(`<div class="tooltip-row">${combinedText}</div>`);
                }

                // Display Shield Size
                if (item.shieldSize && item.shieldSize > 0) {
                    lines.push(`<div class="tooltip-row"><strong style="color: #60a5fa;">Shield Size:</strong> ${item.shieldSize}</div>`);
                }
                
                // Display item level
                if (item.itemLevel && item.itemLevel > 0) {
                    lines.push(`<div class="tooltip-row"><strong style="color: #a78bfa;">Item Level:</strong> ${item.itemLevel}</div>`);
                }
                
                // Display cast/recast times
                if (item.castTime && item.castTime > 0) {
                    lines.push(`<div class="tooltip-row"><strong style="color: #06b6d4;">Cast Time:</strong> ${(item.castTime / 4).toFixed(2)}s</div>`);
                }
                if (item.recastDelay && item.recastDelay > 0) {
                    lines.push(`<div class="tooltip-row"><strong style="color: #06b6d4;">Recast:</strong> ${item.recastDelay}s</div>`);
                }
                if (item.activationTime && item.activationTime > 0) {
                    lines.push(`<div class="tooltip-row"><strong style="color: #06b6d4;">Activation:</strong> ${item.activationTime}s</div>`);
                }

                // Display augments (new decoded format)
                if (item.augments && item.augments.augments && item.augments.augments.length > 0) {
                    lines.push(`<div class="tooltip-row" style="border-top: 1px solid rgba(148, 163, 184, 0.3); margin-top: 4px; padding-top: 4px;"></div>`);
                    lines.push(`<div class="tooltip-row"><strong style="color: #a78bfa;">Augments:</strong></div>`);
                    
                    // Display each decoded augment string
                    item.augments.augments.forEach((augStr, index) => {
                        lines.push(`<div class="tooltip-row" style="padding-left: 12px;">Slot ${index + 1}: ${augStr}</div>`);
                    });
                }
                
                // Display extra data (charges, crafter signature) if present
                if (item.extraData) {
                    // Display charges
                    if (item.extraData.charges) {
                        if (!item.augments || !item.augments.augments || item.augments.augments.length === 0) {
                            lines.push(`<div class="tooltip-row" style="border-top: 1px solid rgba(148, 163, 184, 0.3); margin-top: 4px; padding-top: 4px;"></div>`);
                        }
                        lines.push(`<div class="tooltip-row"><strong style="color: #60a5fa;">Charges:</strong> ${item.extraData.charges}</div>`);
                    }
                    
                    // Display crafter signature
                    if (item.extraData.crafter_id) {
                        if (!item.augments || !item.augments.augments || item.augments.augments.length === 0) {
                            lines.push(`<div class="tooltip-row" style="border-top: 1px solid rgba(148, 163, 184, 0.3); margin-top: 4px; padding-top: 4px;"></div>`);
                        }
                        lines.push(`<div class="tooltip-row"><strong style="color: #10b981;">Crafter ID:</strong> ${item.extraData.crafter_id}</div>`);
                    }
                }
                
                // Display bazaar price
                if (item.price > 0) {
                    lines.push(`<div class="tooltip-row" style="border-top: 1px solid rgba(148, 163, 184, 0.3); margin-top: 4px; padding-top: 4px;"></div>`);
                    lines.push(`<div class="tooltip-row"><strong style="color: #fbbf24;">Bazaar:</strong> ${formatNumber(item.price)} Gil</div>`);
                }
                
                // DEBUG MODE: Display all additional item properties
                if (DEBUG) {
                    lines.push(`<div class="tooltip-row" style="border-top: 2px solid #ef4444; margin-top: 6px; padding-top: 6px;"></div>`);
                    lines.push(`<div class="tooltip-row"><strong style="color: #ef4444;">DEBUG INFO:</strong></div>`);
                    
                    // Display flags
                    if (item.flags !== undefined) {
                        lines.push(`<div class="tooltip-row">Flags: 0x${item.flags.toString(16).toUpperCase()}</div>`);
                    }
                    
                    // Display item type
                    if (item.type !== undefined) {
                        lines.push(`<div class="tooltip-row">Type: ${item.type}</div>`);
                    }
                    
                    // Display skill
                    if (item.skill !== undefined) {
                        lines.push(`<div class="tooltip-row">Skill: ${item.skill}</div>`);
                    }

                    // Display background color if set
                    if (item.slotMask !== undefined) {
                        lines.push(`<div class="tooltip-row">Slot Mask: ${item.slotMask}</div>`);
                    }
                    
                    // Display full item JSON
                    lines.push(`<div class="tooltip-row" style="border-top: 1px solid rgba(239, 68, 68, 0.3); margin-top: 4px; padding-top: 4px;"></div>`);
                    lines.push(`<div class="tooltip-row"><strong style="color: #fb923c;">Full Item Data:</strong></div>`);
                    lines.push(`<div class="tooltip-row" style="font-size: 10px; font-family: 'Courier New', monospace; white-space: pre-wrap; max-width: 400px; word-break: break-all;">${JSON.stringify(item, null, 2)}</div>`);
                }
                
                return lines.join('');
            });
            
            return div;
        }
        
        function toggleCollapse(contentDiv, icon, sectionName) {
            contentDiv.classList.toggle('collapsed');
            icon.classList.toggle('collapsed');
            
            if (contentDiv.classList.contains('collapsed')) {
                collapsedSections.add(sectionName);
            } else {
                collapsedSections.delete(sectionName);
            }
        }
        
        function createCharacterButtons() {
            const buttonsContainer = document.getElementById('characterButtons');
            buttonsContainer.innerHTML = '';
            
            const characterKeys = Object.keys(allCharactersData);
            
            if (DEBUG) console.log('Creating character buttons, count:', characterKeys.length);
            
            if (characterKeys.length === 0) {
                return;
            }
            
            // Set first character as active if none selected
            if (!activeCharacter && characterKeys.length > 0) {
                activeCharacter = characterKeys[0];
            }
            
            characterKeys.forEach(charKey => {
                const charData = allCharactersData[charKey];
                const button = document.createElement('button');
                button.className = charKey === activeCharacter ? 'character-btn active' : 'character-btn inactive';
                button.textContent = charData.character_name;
                button.dataset.charKey = charKey;
                
                // Add status indicator icon
                const statusIndicator = document.createElement('i');
                if (charData.is_online) {
                    statusIndicator.className = 'mdi mdi-circle-slice-8 status-indicator online';
                } else {
                    statusIndicator.className = 'mdi mdi-minus-circle-off status-indicator offline';
                }
                button.appendChild(statusIndicator);
                
                // Add custom tooltip
                attachTooltip(button, () => [
                    `<div class="tooltip-row"><strong>${charData.character_name}</strong></div>`,
                    `<div class="tooltip-row">Last updated: ${formatDate(charData.last_updated)}</div>`,
                    `<div class="tooltip-row">Status: ${charData.is_online ? 'Online' : 'Offline'}</div>`
                ].join(''));
                
                button.addEventListener('click', () => {
                    activeCharacter = charKey;
                    createCharacterButtons();
                    displayInventory(allCharactersData[activeCharacter]);
                });
                
                buttonsContainer.appendChild(button);
            });
        }
        
        function displayInventory(data) {
            if (DEBUG) console.log('Displaying inventory for:', data?.character_name || 'no character');
            const content = document.getElementById('content');
            
            // Preserve scroll positions and fade states before clearing DOM
            const oldLeftColumn = content.querySelector('.left-column');
            const oldRightColumn = content.querySelector('.right-column');
            const oldInvScrollContainer = oldLeftColumn?.querySelector('.inventory-scroll-container');
            const oldInvScrollContent = oldInvScrollContainer?.querySelector('.inventory-scroll-content');
            
            const savedScrollState = {
                inventoryScrollTop: oldInvScrollContent?.scrollTop || 0,
                inventoryHasTopFade: oldInvScrollContainer?.classList.contains('show-top-fade') || false,
                inventoryHasBottomFade: oldInvScrollContainer?.classList.contains('show-bottom-fade') || false,
                rightColumnScrollTop: oldRightColumn?.scrollTop || 0,
                rightColumnHasTopFade: oldRightColumn?.classList.contains('show-top-fade') || false,
                rightColumnHasBottomFade: oldRightColumn?.classList.contains('show-bottom-fade') || false
            };
            
            content.innerHTML = '';
            
            // Update mog house state for active character
            isInMogHouse = data && data.in_mog_house === true;
            if (DEBUG) console.log('In Mog House:', isInMogHouse);
            
            // Helper to build a unique per-instance key for an item
            function getItemInstanceKey(item) {
                // Use containerId and containerSlot to uniquely identify an item instance
                // Note: item.slot refers to equipment slot (Main, Sub, etc) for equipped items
                // item.containerSlot refers to the actual container position
                const containerId = item.containerId ?? 'unknown';
                const containerSlot = item.containerSlot;
                
                if (containerSlot !== undefined && containerSlot !== null) {
                    return containerId + ':' + containerSlot;
                }
                
                // Fallback for items without proper slot info (shouldn't happen in normal operation)
                // This maintains compatibility if backend data is incomplete
                return containerId + ':' + item.id;
            }
            
            // Build a set of equipped item instance keys for quick lookup
            const equippedItemKeys = new Set();
            if (data && data.equipment && Array.isArray(data.equipment)) {
                data.equipment.forEach(equip => {
                    // Equipment items have containerId and containerSlot indicating where they live
                    if (equip.containerId !== undefined && equip.containerSlot !== undefined) {
                        equippedItemKeys.add(equip.containerId + ':' + equip.containerSlot);
                    }
                });
            }
            
            // Default container sizes if no data
            const defaultSizes = {
                'Inventory': 80,
                'Safe': 80,
                'Storage': 80,
                'Locker': 80,
                'Satchel': 80,
                'Sack': 80,
                'Case': 80,
                'Wardrobe': 80,
                'Wardrobe2': 80,
                'Wardrobe3': 80,
                'Wardrobe4': 80,
                'Wardrobe5': 80,
                'Wardrobe6': 80,
                'Wardrobe7': 80,
                'Wardrobe8': 80
            };
            
            // Create left column
            const leftColumn = document.createElement('div');
            leftColumn.className = 'left-column';
            
            // Create equipped section (its own container)
            const equippedSection = document.createElement('div');
            equippedSection.className = 'section';
            
            // Equipped items
            const equippedHeader = document.createElement('div');
            equippedHeader.className = 'section-header green';
            equippedHeader.textContent = 'Equipped';
            equippedSection.appendChild(equippedHeader);
            
            const equipGrid = document.createElement('div');
            equipGrid.className = 'equipment-grid';
            
            // Define equipment slot order and names
            const slotOrder = [
                [0, 'Main'], [1, 'Sub'], [2, 'Range'], [3, 'Ammo'],
                [4, 'Head'], [9, 'Neck'], [11, 'Ear1'], [12, 'Ear2'],
                [5, 'Body'], [6, 'Hands'], [13, 'Ring1'], [14, 'Ring2'],
                [15, 'Back'], [10, 'Waist'], [7, 'Legs'], [8, 'Feet']
            ];
            
            // Create a map of equipped items by slot
            const equippedBySlot = {};
            if (data && data.equipment) {
                data.equipment.forEach(item => {
                    equippedBySlot[item.slot] = item;
                });
            }
            
            // Display slots in order
            slotOrder.forEach(([slotNum, slotName]) => {
                if (equippedBySlot[slotNum]) {
                    equipGrid.appendChild(createItemElement(equippedBySlot[slotNum], true));
                } else {
                    // Empty slot - show slot name
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'item empty-slot';
                    emptyDiv.textContent = slotName;
                    equipGrid.appendChild(emptyDiv);
                }
            });
            
            equippedSection.appendChild(equipGrid);
            leftColumn.appendChild(equippedSection);
            
            // Gil (between equipped and inventory)
            const gilContent = document.createElement('div');
            gilContent.className = 'gil-content';
            
            const gilImg = document.createElement('img');
            gilImg.src = 'https://static.ffxiah.com/images/icon/65535.png';
            gilImg.alt = 'Gil';
            gilContent.appendChild(gilImg);
            
            const gilAmount = document.createElement('span');
            gilAmount.textContent = (data && data.gil !== undefined) ? formatNumber(data.gil) + ' G' : '0 G';
            gilContent.appendChild(gilAmount);
            
            leftColumn.appendChild(gilContent);
            
            // Inventory - wrap in scrollable container with fade gradients
            const invContainer = data && data.containers ? data.containers['Inventory'] : null;
            const invMaxSize = (invContainer && invContainer.maxSize && invContainer.maxSize > 0) ? invContainer.maxSize : defaultSizes['Inventory'];
            const invItems = invContainer && invContainer.items && Array.isArray(invContainer.items) ? invContainer.items : [];
            const invCurrentCount = invContainer && invContainer.currentCount ? invContainer.currentCount : 0;
            
            // Helper function to check if items can be moved to a container
            function canMoveToContainer(containerName, selectedItems) {
                // Wardrobe containers only accept armor (type 4) and weapon (type 5) items
                if (containerName.startsWith('Wardrobe')) {
                    return selectedItems.every(item => {
                        const itemEl = document.querySelector(`[data-container-slot="${item.containerSlot}"][data-container-id="${item.containerId}"]`);
                        if (itemEl) {
                            const itemType = parseInt(itemEl.dataset.itemType) || 0;
                            return itemType === 4 || itemType === 5;
                        }
                        return false;
                    });
                }
                return true;
            }
            
            // Helper function to check if all selected items are from the same container
            function areAllItemsFromSameContainer(selectedItems) {
                if (selectedItems.length === 0) return false;
                const firstContainerId = selectedItems[0].containerId;
                return selectedItems.every(item => item.containerId === firstContainerId);
            }
            
            // Helper function to get the source container ID of selected items (if all from same container)
            function getSourceContainerId(selectedItems) {
                if (areAllItemsFromSameContainer(selectedItems)) {
                    return selectedItems[0].containerId;
                }
                return null;
            }
            
            // Create wrapper for inventory section (header + grid only)
            const invSection = document.createElement('div');
            invSection.className = 'section inventory-section';
            invSection.dataset.containerId = '0';
            invSection.dataset.maxSize = invMaxSize;
            invSection.dataset.currentCount = invCurrentCount;
            
            const invHeader = document.createElement('div');
            invHeader.className = 'section-header green';
            invHeader.dataset.containerName = 'Inventory';
            invHeader.dataset.containerId = '0';
            
            const invHeaderLeft = document.createElement('div');
            invHeaderLeft.className = 'section-header-left';
            
            const invHeaderText = document.createElement('span');
            invHeaderText.textContent = `Inventory (${invCurrentCount}/${invMaxSize})`;
            invHeaderLeft.appendChild(invHeaderText);
            
            const invSortIcon = document.createElement('i');
            invSortIcon.className = 'mdi mdi-sort sort-icon';
            invSortIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                // Don't sort if disabled (busy state)
                if (invSortIcon.classList.contains('disabled')) {
                    return;
                }
                if (DEBUG) {
                    console.log('Sort Inventory clicked');
                }
                await sendSortRequest(0); // 0 is the container ID for Inventory
            });
            invHeaderLeft.appendChild(invSortIcon);
            
            invHeader.appendChild(invHeaderLeft);
            
            // Add move mode hover and click handlers to the inventory section wrapper
            invSection.addEventListener('mouseenter', function() {
                if (moveMode) {
                    const targetContainerId = parseInt(this.dataset.containerId);
                    const sourceContainerId = getSourceContainerId(selectedItems);
                    
                    // If hovering over source container, don't highlight at all
                    if (sourceContainerId !== null && sourceContainerId === targetContainerId) {
                        hoveredContainer = {
                            containerId: targetContainerId,
                            element: invSection,
                            canFit: false,
                            isSourceContainer: true
                        };
                        return;
                    }
                    
                    invSection.classList.add('move-target-hover');
                    
                    // Check if items can fit
                    const freeSlots = invMaxSize - invCurrentCount;
                    const itemsToMove = selectedItems.length;
                    const canMove = itemsToMove <= freeSlots && canMoveToContainer('Inventory', selectedItems);
                    
                    if (canMove) {
                        invSection.classList.add('can-fit');
                        invSection.classList.remove('cannot-fit');
                    } else {
                        invSection.classList.add('cannot-fit');
                        invSection.classList.remove('can-fit');
                    }
                    
                    hoveredContainer = {
                        containerId: targetContainerId,
                        element: invSection,
                        canFit: canMove
                    };
                }
            });
            invSection.addEventListener('mouseleave', function() {
                invSection.classList.remove('move-target-hover');
                invSection.classList.remove('can-fit');
                invSection.classList.remove('cannot-fit');
                if (hoveredContainer && hoveredContainer.element === invSection) {
                    hoveredContainer = null;
                }
            });
            invSection.addEventListener('click', function(e) {
                if (moveMode) {
                    e.stopPropagation();
                    const targetContainerId = parseInt(this.dataset.containerId);
                    const sourceContainerId = getSourceContainerId(selectedItems);
                    
                    // If clicking on source container, just cancel the move
                    if (sourceContainerId !== null && sourceContainerId === targetContainerId) {
                        console.log('Move cancelled - same container');
                        moveMode = false;
                        invSection.classList.remove('move-target-hover');
                        invSection.classList.remove('can-fit');
                        invSection.classList.remove('cannot-fit');
                        document.body.style.cursor = 'default';
                        hoveredContainer = null;
                        return;
                    }
                    
                    const freeSlots = invMaxSize - invCurrentCount;
                    const itemsToMove = selectedItems.length;
                    
                    if (itemsToMove <= freeSlots && canMoveToContainer('Inventory', selectedItems)) {
                        // Send move request to backend
                        sendMoveRequest(selectedItems, targetContainerId).then(result => {
                            if (result.success) {
                                console.log(`Move initiated: ${selectedItems.length} item(s) to Inventory`);
                            } else {
                                console.error('Move failed:', result.error);
                                if (result.errors && result.errors.length > 0) {
                                    alert('Move failed:\n' + result.errors.join('\n'));
                                } else if (result.error) {
                                    alert('Move failed: ' + result.error);
                                }
                            }
                        });
                        
                        // Clear selection after successful move
                        document.querySelectorAll('.item.selected').forEach(el => {
                            el.classList.remove('selected');
                        });
                        selectedItems = [];
                    } else {
                        console.log('Cannot move');
                    }
                    
                    // Exit move mode
                    moveMode = false;
                    invSection.classList.remove('move-target-hover');
                    invSection.classList.remove('can-fit');
                    invSection.classList.remove('cannot-fit');
                    document.body.style.cursor = 'default';
                    hoveredContainer = null;
                }
            });
            
            invSection.appendChild(invHeader);
            
            // Create scroll container for inventory
            const invScrollContainer = document.createElement('div');
            invScrollContainer.className = 'inventory-scroll-container';
            // Restore fade classes immediately to prevent flash
            if (savedScrollState.inventoryHasTopFade) {
                invScrollContainer.classList.add('show-top-fade');
            }
            if (savedScrollState.inventoryHasBottomFade) {
                invScrollContainer.classList.add('show-bottom-fade');
            }
            
            const invScrollContent = document.createElement('div');
            invScrollContent.className = 'inventory-scroll-content';
            // Restore scroll position immediately
            invScrollContent.scrollTop = savedScrollState.inventoryScrollTop;
            
            const invGrid = document.createElement('div');
            invGrid.className = 'item-grid';
            
            for (const item of invItems) {
                const itemKey = getItemInstanceKey(item);
                const isEquipped = equippedItemKeys.has(itemKey);
                invGrid.appendChild(createItemElement(item, isEquipped));
            }
            
            const invEmptySlots = invMaxSize - invItems.length;
            for (let i = 0; i < invEmptySlots; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'item';
                invGrid.appendChild(emptyDiv);
            }
            
            invScrollContent.appendChild(invGrid);
            invScrollContainer.appendChild(invScrollContent);
            invSection.appendChild(invScrollContainer);
            
            // Restore scroll position after content is added
            if (savedScrollState.inventoryScrollTop > 0) {
                invScrollContent.scrollTop = savedScrollState.inventoryScrollTop;
            }
            
            // Create Sell Trash button
            const sellTrashBtn = document.createElement('button');
            sellTrashBtn.className = 'sell-trash-btn';
            sellTrashBtn.innerHTML = '<i class="mdi mdi-trash-can"></i><span>Sell Trash</span>';
            // Set initial disabled state immediately to prevent flash
            const isBusy = isMoving || waitingForMoveUpdate || isSelling || waitingForSellUpdate || itemsBeingProcessed.length > 0;
            sellTrashBtn.disabled = isBusy;
            sellTrashBtn.addEventListener('click', async () => {
                const currentTrashList = trashItemsByCharacter[activeCharacter];
                if (!Array.isArray(currentTrashList) || currentTrashList.length === 0) {
                    console.log('No items tagged as trash for this character');
                    return;
                }
                
                // Get unique item names from current inventory (lowercase for comparison)
                const inventoryItemNames = new Set();
                for (const item of invItems) {
                    inventoryItemNames.add(item.name.toLowerCase());
                }
                
                // Filter trash list to only items currently in inventory
                const itemsToSell = currentTrashList.filter(trashItemName => 
                    inventoryItemNames.has(trashItemName.toLowerCase())
                );
                
                if (itemsToSell.length === 0) {
                    console.log('No trash items found in inventory');
                    return;
                }
                
                // Count total number of items being sold (not just unique types)
                const itemsToSellSet = new Set(itemsToSell.map(name => name.toLowerCase()));
                let totalItemCount = 0;
                for (const item of invItems) {
                    if (itemsToSellSet.has(item.name.toLowerCase())) {
                        totalItemCount++;
                    }
                }
                
                console.log('Sell trash items:', itemsToSell, `(${itemsToSell.length} unique types, ${totalItemCount} total items)`);
                
                // Cancel any active move mode
                if (moveMode) {
                    moveMode = false;
                    isDragging = false;
                    dragGhost.classList.remove('visible');
                    document.body.style.cursor = 'default';
                    // Clear any selected items
                    document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
                    selectedItems = [];
                }
                
                // Set sell in progress and show progress bar
                isSelling = true;
                sellStartTime = Date.now();
                sellTotalDuration = totalItemCount * 2; // 2 seconds per item (base_delay from sellit.lua)
                updateProgressBar();
                
                // Mark items being sold as busy (dim and disable interaction)
                const itemsToSellLowerCase = new Set(itemsToSell.map(name => name.toLowerCase()));
                for (const item of invItems) {
                    if (itemsToSellLowerCase.has(item.name.toLowerCase())) {
                        // Add to busy tracking array
                        itemsBeingProcessed.push({
                            containerId: item.containerId,
                            containerSlot: item.containerSlot,
                            itemName: item.name
                        });
                        
                        // Add 'busy' class to the item in the DOM
                        const itemElement = document.querySelector(
                            `[data-container-id="${item.containerId}"][data-container-slot="${item.containerSlot}"]`
                        );
                        if (itemElement) {
                            itemElement.classList.add('busy');
                        }
                    }
                }
                
                // Send sell request to backend
                try {
                    const requestPayload = {
                        character_key: activeCharacter,
                        item_names: itemsToSell
                    };
                    
                    const response = await fetch('/api/sell', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestPayload)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        console.log('Sell request queued:', result.message);
                        // Start local sell progress tracking.
                        setTimeout(pollSellState, 250);
                    } else {
                        console.error('Sell failed:', result.error);
                        alert('Sell failed: ' + result.error);
                        // Reset sell state on error and clear busy items
                        isSelling = false;
                        itemsBeingProcessed.forEach(busyItem => {
                            const itemElement = document.querySelector(
                                `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                            );
                            if (itemElement) {
                                itemElement.classList.remove('busy');
                            }
                        });
                        itemsBeingProcessed = [];
                        updateProgressBar();
                    }
                } catch (error) {
                    console.error('Failed to send sell request:', error);
                    alert('Failed to send sell request: ' + error.message);
                    // Reset sell state on error and clear busy items
                    isSelling = false;
                    itemsBeingProcessed.forEach(busyItem => {
                        const itemElement = document.querySelector(
                            `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                        );
                        if (itemElement) {
                            itemElement.classList.remove('busy');
                        }
                    });
                    itemsBeingProcessed = [];
                    updateProgressBar();
                }
            });
            invSection.appendChild(sellTrashBtn);
            
            // Set initial button state based on current busy status
            updateButtonStates();
            
            // Add scroll event listener for fade gradients
            function updateInventoryFade() {
                const scrollTop = invScrollContent.scrollTop;
                const scrollHeight = invScrollContent.scrollHeight;
                const clientHeight = invScrollContent.clientHeight;
                const scrollBottom = scrollHeight - scrollTop - clientHeight;
                
                if (scrollTop > 10) {
                    invScrollContainer.classList.add('show-top-fade');
                } else {
                    invScrollContainer.classList.remove('show-top-fade');
                }
                
                if (scrollBottom > 10) {
                    invScrollContainer.classList.add('show-bottom-fade');
                } else {
                    invScrollContainer.classList.remove('show-bottom-fade');
                }
            }
            
            invScrollContent.addEventListener('scroll', updateInventoryFade);
            // Initial check - use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    updateInventoryFade();
                    // Also update button state after inventory is fully rendered
                    updateButtonStates();
                });
            });
            
            // Add the inventory section to leftColumn
            leftColumn.appendChild(invSection);
            
            content.appendChild(leftColumn);
            
            // Create right column
            const rightColumn = document.createElement('div');
            rightColumn.className = 'right-column';
            // Restore fade classes immediately to prevent flash
            if (savedScrollState.rightColumnHasTopFade) {
                rightColumn.classList.add('show-top-fade');
            }
            if (savedScrollState.rightColumnHasBottomFade) {
                rightColumn.classList.add('show-bottom-fade');
            }
            // Restore scroll position (will be set after content is added)
            rightColumn.scrollTop = savedScrollState.rightColumnScrollTop;
            
            // Display remaining containers
            const containerOrder = ['Safe', 'Storage', 'Locker', 'Satchel', 'Sack', 'Case', 
                                   'Wardrobe', 'Wardrobe2', 'Wardrobe3', 'Wardrobe4', 'Wardrobe5', 
                                   'Wardrobe6', 'Wardrobe7', 'Wardrobe8'];
            
            for (const containerName of containerOrder) {
                const container = data && data.containers ? data.containers[containerName] : null;
                
                // Skip containers that don't exist or have maxSize = 0 (not unlocked)
                if (!container || !container.maxSize || container.maxSize === 0) {
                    continue;
                }
                
                const maxSize = container.maxSize;
                const items = container.items && Array.isArray(container.items) ? container.items : [];
                const currentCount = container.currentCount ? container.currentCount : 0;
                
                // Debug logging for slot count issues
                if (DEBUG || items.length !== currentCount) {
                    console.log(`${containerName}: maxSize=${maxSize}, items.length=${items.length}, currentCount=${currentCount}, mismatch=${items.length !== currentCount}`);
                }
                
                const section = document.createElement('div');
                section.className = 'section';
                section.dataset.containerId = container.id;
                section.dataset.maxSize = maxSize;
                section.dataset.currentCount = currentCount;
                
                const header = document.createElement('div');
                // Assign colors based on container name
                let colorClass = 'blue'; // default for remaining containers
                if (containerName === 'Safe' || containerName === 'Storage' || containerName === 'Locker') {
                    colorClass = 'purple';
                }
                header.className = `section-header collapsable ${colorClass}`;
                // Only gray out Safe, Storage, and Locker when not in mog house
                if (!isInMogHouse && (containerName === 'Safe' || containerName === 'Storage' || containerName === 'Locker')) {
                    section.classList.add('not-in-mog-house');
                }
                header.dataset.containerName = containerName;
                header.dataset.containerId = container.id;
                
                const headerLeft = document.createElement('div');
                headerLeft.className = 'section-header-left';
                
                const headerText = document.createElement('span');
                headerText.textContent = `${containerName} (${currentCount}/${maxSize})`;
                headerLeft.appendChild(headerText);
                
                const sortIcon = document.createElement('i');
                sortIcon.className = 'mdi mdi-sort sort-icon';
                // Disable sort for mog house containers when not in mog house
                const isMogHouseContainer = (containerName === 'Safe' || containerName === 'Storage' || containerName === 'Locker');
                if (isMogHouseContainer && !isInMogHouse) {
                    sortIcon.classList.add('disabled');
                }
                sortIcon.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // Don't sort if disabled (not in mog house for Safe/Storage/Locker, or busy state)
                    if (sortIcon.classList.contains('disabled')) {
                        return;
                    }
                    if (DEBUG) {
                        console.log(`Sort ${containerName} clicked, container ID: ${container.id}`);
                    }
                    await sendSortRequest(container.id);
                });
                headerLeft.appendChild(sortIcon);
                
                header.appendChild(headerLeft);
                
                const collapseIcon = document.createElement('i');
                collapseIcon.className = 'mdi mdi-chevron-down collapse-icon';
                header.appendChild(collapseIcon);
                
                // Add move mode hover and click handlers to the entire section
                section.addEventListener('mouseenter', function() {
                    if (moveMode) {
                        const targetContainerId = parseInt(this.dataset.containerId);
                        const sourceContainerId = getSourceContainerId(selectedItems);
                        
                        // If hovering over source container, don't highlight at all
                        if (sourceContainerId !== null && sourceContainerId === targetContainerId) {
                            hoveredContainer = {
                                containerId: targetContainerId,
                                element: section,
                                canFit: false,
                                isSourceContainer: true
                            };
                            return;
                        }
                        
                        section.classList.add('move-target-hover');
                        
                        // Check if trying to access mog house container while not in mog house
                        const isMogHouseContainer = (containerName === 'Safe' || containerName === 'Storage' || containerName === 'Locker');
                        if (isMogHouseContainer && !isInMogHouse) {
                            section.classList.add('cannot-fit');
                            section.classList.remove('can-fit');
                            hoveredContainer = {
                                containerId: targetContainerId,
                                element: section,
                                canFit: false
                            };
                            return;
                        }
                        
                        // Check if items can fit and meet container requirements
                        const freeSlots = maxSize - currentCount;
                        const itemsToMove = selectedItems.length;
                        const canMove = itemsToMove <= freeSlots && canMoveToContainer(containerName, selectedItems);
                        
                        if (canMove) {
                            section.classList.add('can-fit');
                            section.classList.remove('cannot-fit');
                        } else {
                            section.classList.add('cannot-fit');
                            section.classList.remove('can-fit');
                        }
                        
                        hoveredContainer = {
                            containerId: targetContainerId,
                            element: section,
                            canFit: canMove
                        };
                    }
                });
                section.addEventListener('mouseleave', function() {
                    section.classList.remove('move-target-hover');
                    section.classList.remove('can-fit');
                    section.classList.remove('cannot-fit');
                    if (hoveredContainer && hoveredContainer.element === section) {
                        hoveredContainer = null;
                    }
                });
                section.addEventListener('click', function(e) {
                    if (moveMode) {
                        e.stopPropagation();
                        const targetContainerId = parseInt(this.dataset.containerId);
                        const sourceContainerId = getSourceContainerId(selectedItems);
                        
                        // If clicking on source container, just cancel the move
                        if (sourceContainerId !== null && sourceContainerId === targetContainerId) {
                            console.log('Move cancelled - same container');
                            moveMode = false;
                            section.classList.remove('move-target-hover');
                            section.classList.remove('can-fit');
                            section.classList.remove('cannot-fit');
                            document.body.style.cursor = 'default';
                            hoveredContainer = null;
                            return;
                        }
                        
                        // Check if trying to access mog house container while not in mog house
                        const isMogHouseContainer = (containerName === 'Safe' || containerName === 'Storage' || containerName === 'Locker');
                        if (isMogHouseContainer && !isInMogHouse) {
                            console.log('Cannot move - mog house not accessible');
                            moveMode = false;
                            section.classList.remove('move-target-hover');
                            section.classList.remove('can-fit');
                            section.classList.remove('cannot-fit');
                            document.body.style.cursor = 'default';
                            hoveredContainer = null;
                            return;
                        }
                        
                        const freeSlots = parseInt(this.dataset.maxSize);
                        const currentItemCount = parseInt(this.dataset.currentCount);
                        const itemsToMove = selectedItems.length;
                        
                        if (itemsToMove <= (freeSlots - currentItemCount) && canMoveToContainer(containerName, selectedItems)) {
                            // Send move request to backend
                            sendMoveRequest(selectedItems, targetContainerId).then(result => {
                                if (result.success) {
                                    console.log(`Move initiated: ${selectedItems.length} item(s) to ${containerName}`);
                                } else {
                                    console.error('Move failed:', result.error);
                                    if (result.errors && result.errors.length > 0) {
                                        alert('Move failed:\n' + result.errors.join('\n'));
                                    } else if (result.error) {
                                        alert('Move failed: ' + result.error);
                                    }
                                }
                            });
                            
                            // Clear selection after successful move
                            document.querySelectorAll('.item.selected').forEach(el => {
                                el.classList.remove('selected');
                            });
                            selectedItems = [];
                        } else {
                            console.log('Cannot move');
                        }
                        
                        // Exit move mode
                        moveMode = false;
                        section.classList.remove('move-target-hover');
                        section.classList.remove('can-fit');
                        section.classList.remove('cannot-fit');
                        document.body.style.cursor = 'default';
                        hoveredContainer = null;
                        return;
                    }
                });
                
                // Collapse functionality for header
                header.addEventListener('click', function(e) {
                    if (moveMode) {
                        // Don't handle header click in move mode - let it bubble to section
                        return;
                    }
                    // Prevent clicks on header from bubbling to section in normal mode
                    e.stopPropagation();
                    // Normal collapse/expand functionality
                    toggleCollapse(contentDiv, collapseIcon, containerName);
                });
                
                // Right-click context menu for header
                header.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Mark that this is a header context menu
                    isHeaderTarget = true;
                    contextMenuTarget = { containerName: containerName };
                    
                    // Show/hide menu items based on context
                    const consolidateMenuItem = document.getElementById('consolidateMenuItem');
                    const collapseAllMenuItem = document.getElementById('collapseAllMenuItem');
                    const expandAllMenuItem = document.getElementById('expandAllMenuItem');
                    const moveMenuItem = document.getElementById('moveMenuItem');
                    const wikiMenuItem = document.getElementById('wikiMenuItem');
                    const setBazaarMenuItem = document.getElementById('setBazaarMenuItem');
                    const tagAsTrashMenuItem = document.getElementById('tagAsTrashMenuItem');
                    const removeFromTrashMenuItem = document.getElementById('removeFromTrashMenuItem');
                    
                    // For headers: show collapse/expand all only, hide other items
                    consolidateMenuItem.style.display = 'none';
                    moveMenuItem.style.display = 'none';
                    wikiMenuItem.style.display = 'none';
                    setBazaarMenuItem.style.display = 'none';
                    tagAsTrashMenuItem.style.display = 'none';
                    removeFromTrashMenuItem.style.display = 'none';
                    collapseAllMenuItem.style.display = 'flex';
                    expandAllMenuItem.style.display = 'flex';
                    
                    // Position and show context menu with boundary checking
                    contextMenu.classList.add('visible');
                    
                    let x = e.pageX;
                    let y = e.pageY;
                    
                    const menuRect = contextMenu.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    if (x + menuRect.width > viewportWidth) {
                        x = viewportWidth - menuRect.width - 10;
                    }
                    if (y + menuRect.height > window.pageYOffset + viewportHeight) {
                        y = window.pageYOffset + viewportHeight - menuRect.height - 10;
                    }
                    if (x < 10) {
                        x = 10;
                    }
                    if (y < window.pageYOffset + 10) {
                        y = window.pageYOffset + 10;
                    }
                    
                    contextMenu.style.left = x + 'px';
                    contextMenu.style.top = y + 'px';
                });
                
                section.appendChild(header);
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'section-content';
                
                const grid = document.createElement('div');
                grid.className = 'item-grid';
                
                for (const item of items) {
                    const itemKey = getItemInstanceKey(item);
                    const isEquipped = equippedItemKeys.has(itemKey);
                    grid.appendChild(createItemElement(item, isEquipped));
                }
                
                const emptySlots = maxSize - items.length;
                for (let i = 0; i < emptySlots; i++) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'item';
                    grid.appendChild(emptyDiv);
                }
                
                contentDiv.appendChild(grid);
                section.appendChild(contentDiv);
                
                // Apply saved collapse state
                const isCollapsed = collapsedSections.has(containerName);
                if (isCollapsed) {
                    contentDiv.classList.add('collapsed');
                    collapseIcon.classList.add('collapsed');
                }
                
                rightColumn.appendChild(section);
            }
            
            content.appendChild(rightColumn);
            
            // Restore scroll position after content is added
            if (savedScrollState.rightColumnScrollTop > 0) {
                rightColumn.scrollTop = savedScrollState.rightColumnScrollTop;
            }
            
            // Add scroll event listener for right column fade gradients
            function updateRightColumnFade() {
                const scrollTop = rightColumn.scrollTop;
                const scrollHeight = rightColumn.scrollHeight;
                const clientHeight = rightColumn.clientHeight;
                const scrollBottom = scrollHeight - scrollTop - clientHeight;
                
                if (scrollTop > 10) {
                    rightColumn.classList.add('show-top-fade');
                } else {
                    rightColumn.classList.remove('show-top-fade');
                }
                
                if (scrollBottom > 10) {
                    rightColumn.classList.add('show-bottom-fade');
                } else {
                    rightColumn.classList.remove('show-bottom-fade');
                }
            }
            
            rightColumn.addEventListener('scroll', updateRightColumnFade);
            // Initial check - use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(updateRightColumnFade);
            });
            
            // Re-apply filters immediately to avoid one-frame unfiltered flicker on SSE updates.
            applyFilters();
        }
        
        function fetchInventory() {
            const apiUrl = '/api/inventory';
            
            fetch(apiUrl)
                .then(response => {
                    if (DEBUG) {
                        console.log('Fetch response status:', response.status);
                    }
                    return response.text();
                })
                .then(text => {
                    
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('JSON Parse Error:', e);
                        throw e;
                    }
                    
                    allCharactersData = data;
                    
                    syncTrashListsFromData();
                    scheduleInventoryRender();
                })
                .catch(error => {
                    console.error('Failed to fetch inventory:', error.message);
                    displayInventory(null);
                });
        }
        
        // SSE connection for real-time updates
        let eventSource = null;
        let renderScheduled = false;

        function syncTrashListsFromData() {
            Object.keys(allCharactersData).forEach(charKey => {
                const charData = allCharactersData[charKey];
                // Ensure trash_items is always an array (handle both missing and object cases)
                if (Array.isArray(charData.trash_items)) {
                    trashItemsByCharacter[charKey] = charData.trash_items;
                } else {
                    trashItemsByCharacter[charKey] = [];
                }
            });
        }

        function scheduleInventoryRender() {
            if (renderScheduled) {
                return;
            }
            renderScheduled = true;
            requestAnimationFrame(() => {
                renderScheduled = false;
                createCharacterButtons();

                if (activeCharacter && allCharactersData[activeCharacter]) {
                    displayInventory(allCharactersData[activeCharacter]);
                } else if (Object.keys(allCharactersData).length > 0) {
                    // Display first character if active not set
                    const firstKey = Object.keys(allCharactersData)[0];
                    activeCharacter = firstKey;
                    displayInventory(allCharactersData[firstKey]);
                } else {
                    displayInventory(null);
                }
            });
        }
        
        function connectSSE() {
            if (eventSource) {
                eventSource.close();
            }
            
            const sseUrl = `${window.location.origin}/api/events`;
            eventSource = new EventSource(sseUrl);
            
            eventSource.onopen = function() {
                if (DEBUG) console.log('SSE connection established');
            };
            
            eventSource.onmessage = function(event) {
                if (DEBUG) console.log('SSE update received:', event.data.substring(0, 100) + '...');
                const data = JSON.parse(event.data);
                
                allCharactersData = data;
                
                syncTrashListsFromData();
                
                // Clear the waiting flag and hide progress bar after UI updates
                if (waitingForMoveUpdate || waitingForSellUpdate) {
                    if (DEBUG) {
                        console.log('UI update received, waiting 2 seconds before hiding progress bar');
                    }
                    
                    // Clear busy items state immediately when UI updates
                    if (waitingForMoveUpdate) {
                        itemsBeingProcessed = itemsBeingProcessed.filter(busyItem => {
                            const itemElement = document.querySelector(
                                `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                            );
                            if (itemElement) {
                                itemElement.classList.remove('busy');
                            }
                            return false; // Remove all move-related items
                        });
                    }
                    
                    // Clear busy items for sell operations
                    if (waitingForSellUpdate) {
                        itemsBeingProcessed = itemsBeingProcessed.filter(busyItem => {
                            // Only clear items that were marked for selling (those without specific slots or by name)
                            const itemElement = document.querySelector(
                                `[data-container-id="${busyItem.containerId}"][data-container-slot="${busyItem.containerSlot}"]`
                            );
                            if (itemElement) {
                                itemElement.classList.remove('busy');
                            }
                            return false; // Remove all sell-related items
                        });
                    }
                    
                    // Keep "Updating inventory..." visible for 2 additional seconds
                    setTimeout(() => {
                        waitingForMoveUpdate = false;
                        waitingForSellUpdate = false;
                        updateProgressBar();
                        
                        if (DEBUG) {
                            console.log('Operation complete, progress bar hidden');
                        }
                    }, 2000);
                }
                
                scheduleInventoryRender();
            };
            
            eventSource.onerror = function(error) {
                console.error('SSE connection error:', error);
                eventSource.close();
                
                // Fallback to initial fetch and reconnect after 5 seconds
                fetchInventory();
                setTimeout(connectSSE, 5000);
            };
        }
        
        // Apply all active filters (search + filter panel)
        function applyFilters() {
            const searchTerm = document.querySelector('.search-bar').value.toLowerCase();
            const levelMin = parseInt(document.getElementById('levelMin').value) || 0;
            const levelMax = parseInt(document.getElementById('levelMax').value) || 999;
            const filterRareActive = document.getElementById('filterRare').classList.contains('active');
            const filterExclusiveActive = document.getElementById('filterExclusive').classList.contains('active');
            const filterAugmentedActive = document.getElementById('filterAugmented').classList.contains('active');
            const filterDuplicateActive = document.getElementById('filterDuplicate').classList.contains('active');
            
            // Build duplicate item ID map if duplicate filter is active
            let duplicateItemIds = new Set();
            if (filterDuplicateActive) {
                const itemIdCounts = {};
                document.querySelectorAll('.item[data-item-name]').forEach(item => {
                    // Skip equipped and bazaar items
                    if (item.classList.contains('equipped') || item.classList.contains('bazaar')) {
                        return;
                    }
                    const itemId = item.querySelector('img')?.src?.match(/icon\/(\d+)\.png/)?.[1];
                    if (itemId) {
                        itemIdCounts[itemId] = (itemIdCounts[itemId] || 0) + 1;
                    }
                });
                // Store IDs that appear more than once
                for (const [id, count] of Object.entries(itemIdCounts)) {
                    if (count > 1) {
                        duplicateItemIds.add(id);
                    }
                }
            }
            
            // Check job filters
            const jobBadges = document.querySelectorAll('.filter-badge.job');
            const activeJobValues = [];
            jobBadges.forEach(badge => {
                if (badge.classList.contains('active')) {
                    activeJobValues.push(parseInt(badge.dataset.jobValue));
                }
            });
            const anyJobFilterActive = activeJobValues.length > 0;
            
            // Check race filters
            const raceBadges = document.querySelectorAll('.filter-badge.race');
            const activeRaceValues = [];
            raceBadges.forEach(badge => {
                if (badge.classList.contains('active')) {
                    activeRaceValues.push(parseInt(badge.dataset.raceValue));
                }
            });
            const anyRaceFilterActive = activeRaceValues.length > 0;
            
            // Check skill filters
            const skillBadges = document.querySelectorAll('.filter-badge.skill');
            const activeSkillValues = [];
            skillBadges.forEach(badge => {
                if (badge.classList.contains('active')) {
                    activeSkillValues.push(parseInt(badge.dataset.skillValue));
                }
            });
            const anySkillFilterActive = activeSkillValues.length > 0;
            
            // Check slot filters
            const slotBadges = document.querySelectorAll('.filter-badge.slot');
            const activeSlotValues = [];
            slotBadges.forEach(badge => {
                if (badge.classList.contains('active')) {
                    activeSlotValues.push(parseInt(badge.dataset.slotValue));
                }
            });
            const anySlotFilterActive = activeSlotValues.length > 0;
            
            // Check if any filters are active (excluding search for icon color)
            const hasActiveFilters = levelMin > 0 || 
                                     levelMax < 999 || 
                                     filterRareActive || 
                                     filterExclusiveActive ||
                                     filterAugmentedActive ||
                                     filterDuplicateActive ||
                                     anyJobFilterActive ||
                                     anyRaceFilterActive ||
                                     anySkillFilterActive ||
                                     anySlotFilterActive;
            
            // Update filter icon color
            const filterIcon = document.getElementById('filterIcon');
            const filterClearIcon = document.getElementById('filterClearIcon');
            if (hasActiveFilters) {
                filterIcon.classList.add('filtered');
                filterClearIcon.classList.add('filtered');
            } else {
                filterIcon.classList.remove('filtered');
                filterClearIcon.classList.remove('filtered');
            }
            
            // Check if any filters are active (including search for item highlighting)
            const hasAnyFilters = searchTerm !== '' || hasActiveFilters;
            
            const allItems = document.querySelectorAll('.item[data-item-name]');
            
            allItems.forEach(item => {
                const itemName = item.dataset.itemName;
                const itemLevel = parseInt(item.dataset.itemLevel) || 0;
                const itemRare = item.dataset.itemRare === 'true';
                const itemExclusive = item.dataset.itemExclusive === 'true';
                const itemAugmented = item.dataset.itemAugmented === 'true';
                const itemJobs = parseInt(item.dataset.itemJobs) || 0;
                const itemRaces = parseInt(item.dataset.itemRaces) || 0;
                const itemSkill = parseInt(item.dataset.itemSkill) || 0;
                const itemSlotMask = parseInt(item.dataset.itemSlotMask) || 0;
                
                let matches = true;
                let searchMatches = false;
                
                // Check search term
                if (searchTerm !== '') {
                    const itemDescription = item.dataset.itemDescription || '';
                    if (itemName.includes(searchTerm) || itemDescription.includes(searchTerm)) {
                        searchMatches = true;
                    } else {
                        matches = false;
                    }
                }
                
                // Check level range
                if (itemLevel < levelMin || itemLevel > levelMax) {
                    matches = false;
                }
                
                // Check job filters (show items that can be used by any active job)
                if (anyJobFilterActive && itemJobs > 0) {
                    let itemMatchesAnyJob = false;
                    for (const jobValue of activeJobValues) {
                        if (itemJobs & jobValue) {
                            itemMatchesAnyJob = true;
                            break;
                        }
                    }
                    if (!itemMatchesAnyJob) {
                        matches = false;
                    }
                }
                
                // Check race filters (show items that can be used by any active race)
                if (anyRaceFilterActive && itemRaces > 0) {
                    let itemMatchesAnyRace = false;
                    for (const raceValue of activeRaceValues) {
                        if (itemRaces & raceValue) {
                            itemMatchesAnyRace = true;
                            break;
                        }
                    }
                    if (!itemMatchesAnyRace) {
                        matches = false;
                    }
                }
                
                // Check skill filters (show items that match any active skill)
                if (anySkillFilterActive) {
                    let itemMatchesAnySkill = false;
                    for (const skillValue of activeSkillValues) {
                        if (itemSkill === skillValue) {
                            itemMatchesAnySkill = true;
                            break;
                        }
                    }
                    if (!itemMatchesAnySkill) {
                        matches = false;
                    }
                }
                
                // Check slot filters (show items that match any active slot)
                if (anySlotFilterActive) {
                    let itemMatchesAnySlot = false;
                    for (const slotValue of activeSlotValues) {
                        if (itemSlotMask === slotValue) {
                            itemMatchesAnySlot = true;
                            break;
                        }
                    }
                    if (!itemMatchesAnySlot) {
                        matches = false;
                    }
                }
                
                // Check rare filter (only filter if badge is active)
                if (filterRareActive && !itemRare) {
                    matches = false;
                }
                
                // Check exclusive filter (only filter if badge is active)
                if (filterExclusiveActive && !itemExclusive) {
                    matches = false;
                }
                
                // Check augmented filter (only filter if badge is active)
                if (filterAugmentedActive && !itemAugmented) {
                    matches = false;
                }
                
                // Check duplicate filter (only filter if badge is active)
                if (filterDuplicateActive) {
                    const itemId = item.querySelector('img')?.src?.match(/icon\/(\d+)\.png/)?.[1];
                    if (!itemId || !duplicateItemIds.has(itemId)) {
                        matches = false;
                    }
                }
                
                // Apply visual classes
                if (matches) {
                    item.classList.remove('filtered');
                    // Apply glow if any filters are active and item matches
                    if (hasAnyFilters) {
                        item.classList.add('search-matched');
                    } else {
                        item.classList.remove('search-matched');
                    }
                } else {
                    item.classList.add('filtered');
                    item.classList.remove('search-matched');
                }
            });
        }
        
        // Wait for DOM to be ready before initializing
        document.addEventListener('DOMContentLoaded', function() {
            // Initial fetch then connect SSE
            fetchInventory();
            connectSSE();
            
            // Initialize progress bar
            updateProgressBar();
            
            // Add click handler to settings icon to toggle debug mode
            document.querySelector('.settings-icon').addEventListener('click', () => {
            DEBUG = !DEBUG;
            const icon = document.querySelector('.settings-icon');
            if (DEBUG) {
                icon.classList.add('active');
                console.log('Debug mode enabled');
                isMoving = true;
                updateProgressBar();
            } else {
                icon.classList.remove('active');
                console.log('Debug mode disabled');
                isMoving = false;
                updateProgressBar();
            }
        });
        
        // Add search functionality
        document.querySelector('.search-bar').addEventListener('input', (e) => {
            applyFilters();
        });
        
        // Filter panel toggle
        const filterIcon = document.getElementById('filterIcon');
        const filterPanel = document.getElementById('filterPanel');
        
        filterIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            filterPanel.classList.toggle('visible');
            filterIcon.classList.toggle('active');
        });
        
        // Close filter panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterPanel.contains(e.target) && e.target !== filterIcon) {
                filterPanel.classList.remove('visible');
                filterIcon.classList.remove('active');
            }
        });
        
        // Job expand button toggle
        document.getElementById('filterJobExpand').addEventListener('click', function() {
            this.classList.toggle('active');
            document.getElementById('jobBadgesContainer').classList.toggle('visible');
        });
        
        // Job filter toggles
        document.querySelectorAll('.filter-badge.job').forEach(badge => {
            badge.addEventListener('click', function() {
                this.classList.toggle('active');
                applyFilters();
            });
        });
        
        // Race expand button toggle
        document.getElementById('filterRaceExpand').addEventListener('click', function() {
            this.classList.toggle('active');
            document.getElementById('raceBadgesContainer').classList.toggle('visible');
        });
        
        // Race filter toggles
        document.querySelectorAll('.filter-badge.race').forEach(badge => {
            badge.addEventListener('click', function() {
                this.classList.toggle('active');
                applyFilters();
            });
        });
        
        // Skill expand button toggle
        document.getElementById('filterSkillExpand').addEventListener('click', function() {
            this.classList.toggle('active');
            document.getElementById('skillBadgesContainer').classList.toggle('visible');
        });
        
        // Skill filter toggles
        document.querySelectorAll('.filter-badge.skill').forEach(badge => {
            badge.addEventListener('click', function() {
                this.classList.toggle('active');
                applyFilters();
            });
        });
        
        // Slot expand button toggle
        document.getElementById('filterSlotExpand').addEventListener('click', function() {
            this.classList.toggle('active');
            document.getElementById('slotBadgesContainer').classList.toggle('visible');
        });
        
        // Slot filter toggles
        document.querySelectorAll('.filter-badge.slot').forEach(badge => {
            badge.addEventListener('click', function() {
                this.classList.toggle('active');
                applyFilters();
            });
        });
        
        // Filter badge toggles
        document.getElementById('filterRare').addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
        
        document.getElementById('filterExclusive').addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
        
        document.getElementById('filterAugmented').addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
        
        document.getElementById('filterDuplicate').addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
        
        // Level range inputs
        document.getElementById('levelMin').addEventListener('input', function() {
            applyFilters();
        });
        
        document.getElementById('levelMax').addEventListener('input', function() {
            applyFilters();
        });
        
        // Clear filter button
        document.getElementById('filterClearIcon').addEventListener('click', function() {
            // Reset level inputs to defaults
            document.getElementById('levelMin').value = '';
            document.getElementById('levelMax').value = '';
            
            // Deactivate all badges
            document.getElementById('filterRare').classList.remove('active');
            document.getElementById('filterExclusive').classList.remove('active');
            document.getElementById('filterAugmented').classList.remove('active');
            document.getElementById('filterDuplicate').classList.remove('active');
            
            // Deactivate job expand and hide job container
            document.getElementById('filterJobExpand').classList.remove('active');
            document.getElementById('jobBadgesContainer').classList.remove('visible');
            
            // Deactivate all job badges
            document.querySelectorAll('.filter-badge.job').forEach(badge => {
                badge.classList.remove('active');
            });
            
            // Deactivate race expand and hide race container
            document.getElementById('filterRaceExpand').classList.remove('active');
            document.getElementById('raceBadgesContainer').classList.remove('visible');
            
            // Deactivate all race badges
            document.querySelectorAll('.filter-badge.race').forEach(badge => {
                badge.classList.remove('active');
            });
            
            // Deactivate skill expand and hide skill container
            document.getElementById('filterSkillExpand').classList.remove('active');
            document.getElementById('skillBadgesContainer').classList.remove('visible');
            
            // Deactivate all skill badges
            document.querySelectorAll('.filter-badge.skill').forEach(badge => {
                badge.classList.remove('active');
            });
            
            // Deactivate slot expand and hide slot container
            document.getElementById('filterSlotExpand').classList.remove('active');
            document.getElementById('slotBadgesContainer').classList.remove('visible');
            
            // Deactivate all slot badges
            document.querySelectorAll('.filter-badge.slot').forEach(badge => {
                badge.classList.remove('active');
            });
            
            // Clear search
            document.querySelector('.search-bar').value = '';
            
            // Reapply filters (which will now show everything)
            applyFilters();
        });
        
        // Context menu event handlers
        document.getElementById('moveMenuItem').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click handler from clearing selection
            
            // Don't allow moves while sell operation is in progress or items are being processed
            if (isSelling || waitingForSellUpdate || isMoving || waitingForMoveUpdate || itemsBeingProcessed.length > 0) {
                contextMenu.classList.remove('visible');
                return;
            }
            
            // If no items selected, use the right-clicked item
            if (selectedItems.length === 0 && contextMenuTarget) {
                // Find the item element that was right-clicked and select it
                const allItems = document.querySelectorAll('.item[data-item-id]');
                allItems.forEach(itemEl => {
                    if (itemEl.dataset.itemId == contextMenuTarget.id && 
                        itemEl.dataset.containerSlot == contextMenuTarget.slot &&
                        itemEl.dataset.containerId == contextMenuTarget.containerId) {
                        itemEl.classList.add('selected');
                        selectedItems.push({
                            name: contextMenuTarget.name,
                            containerSlot: parseInt(itemEl.dataset.containerSlot),
                            containerId: parseInt(itemEl.dataset.containerId),
                            count: parseInt(itemEl.dataset.itemCount)
                        });
                    }
                });
            }
            
            if (selectedItems.length > 0) {
                // Enter move mode
                moveMode = true;
                console.log('Move mode activated. Click on a container to move selected items.');
            } else {
                alert('Move failed: No items to move');
            }
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('wikiMenuItem').addEventListener('click', () => {
            if (selectedItems.length > 0) {
                // If items are selected, open Wiki for each unique item name
                const uniqueNames = new Set();
                selectedItems.forEach(item => {
                    uniqueNames.add(item.name);
                });
                
                console.log('Selected items:', selectedItems);
                console.log('Unique names to open:', Array.from(uniqueNames));
                
                // Open Wiki page for each unique item with unique window names
                let successCount = 0;
                let blockedCount = 0;
                Array.from(uniqueNames).forEach((name, index) => {
                    const wikiUrl = getWikiUrlForItem(name);
                    // Use unique window name instead of _blank to avoid popup blocker
                    const windowName = 'wiki_' + Date.now() + '_' + index;
                    const newWindow = window.open(wikiUrl, windowName);
                    if (newWindow) {
                        successCount++;
                    } else {
                        blockedCount++;
                    }
                });
                
                if (blockedCount > 0) {
                    console.warn(`${blockedCount} tabs were blocked by popup blocker. Please allow popups for this site.`);
                    alert(`${blockedCount} of ${uniqueNames.size} tabs were blocked by your browser's popup blocker.\n\nPlease allow popups for localhost and try again.`);
                }
            } else if (contextMenuTarget) {
                // No selection, open Wiki for right-clicked item only
                const wikiUrl = getWikiUrlForItem(contextMenuTarget.name);
                window.open(wikiUrl, '_blank');
            }
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('tagAsTrashMenuItem').addEventListener('click', () => {
            if (!contextMenuTarget) {
                contextMenu.classList.remove('visible');
                return;
            }
            
            const itemName = contextMenuTarget.name; // Keep original title case
            
            // Get current character's trash list
            if (!trashItemsByCharacter[activeCharacter]) {
                trashItemsByCharacter[activeCharacter] = [];
            }
            let currentTrashList = trashItemsByCharacter[activeCharacter];
            
            // Ensure it's an array
            if (!Array.isArray(currentTrashList)) {
                currentTrashList = [];
                trashItemsByCharacter[activeCharacter] = currentTrashList;
            }
            
            // Check if already in trash list (avoid duplicates) - case insensitive
            if (currentTrashList.some(trashItem => trashItem.toLowerCase() === itemName.toLowerCase())) {
                console.log('Item already tagged as trash:', itemName);
            } else {
                currentTrashList.push(itemName);
                console.log('Tagged item as trash:', itemName);
                
                // Save updated trash list to server
                saveTrashList(activeCharacter, currentTrashList);
                
                // Add trash class to all items with this name for this character
                const itemNameLower = itemName.toLowerCase();
                const allItems = document.querySelectorAll(`.item[data-item-name="${itemNameLower}"]`);
                allItems.forEach(itemEl => {
                    itemEl.classList.add('trash');
                });
            }
            
            console.log('Current trash items for', activeCharacter, ':', currentTrashList);
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('removeFromTrashMenuItem').addEventListener('click', () => {
            if (!contextMenuTarget) {
                contextMenu.classList.remove('visible');
                return;
            }
            
            const itemName = contextMenuTarget.name; // Keep original title case
            
            // Get current character's trash list
            if (!trashItemsByCharacter[activeCharacter]) {
                trashItemsByCharacter[activeCharacter] = [];
            }
            let currentTrashList = trashItemsByCharacter[activeCharacter];
            
            // Ensure it's an array
            if (!Array.isArray(currentTrashList)) {
                currentTrashList = [];
                trashItemsByCharacter[activeCharacter] = currentTrashList;
            }
            
            // Find and remove item from trash list (case insensitive)
            const index = currentTrashList.findIndex(trashItem => trashItem.toLowerCase() === itemName.toLowerCase());
            if (index > -1) {
                currentTrashList.splice(index, 1);
                console.log('Removed item from trash:', itemName);
                
                // Save updated trash list to server
                saveTrashList(activeCharacter, currentTrashList);
                
                // Remove trash class from all items with this name
                const itemNameLower = itemName.toLowerCase();
                const allItems = document.querySelectorAll(`.item[data-item-name=\"${itemNameLower}\"]`);
                allItems.forEach(itemEl => {
                    itemEl.classList.remove('trash');
                });
            } else {
                console.log('Item not in trash list:', itemName);
            }
            
            console.log('Current trash items for', activeCharacter, ':', currentTrashList);
            contextMenu.classList.remove('visible');
        });
        
        // Function to save trash list to server
        async function saveTrashList(character_key, trash_items) {
            try {
                const requestPayload = {
                    character_key: character_key,
                    trash_items: trash_items
                };
                
                const response = await fetch('/api/trash', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('Trash list updated for', character_key);
                    // Update local data
                    if (allCharactersData[character_key]) {
                        allCharactersData[character_key].trash_items = trash_items;
                    }
                } else {
                    console.error('Failed to save trash list:', result.error);
                }
            } catch (error) {
                console.error('Failed to save trash list:', error);
            }
        }
        
        document.getElementById('setBazaarMenuItem').addEventListener('click', () => {
            if (!contextMenuTarget) {
                contextMenu.classList.remove('visible');
                return;
            }
            
            // Only allow for items in Inventory (container ID 0)
            if (contextMenuTarget.containerId !== '0') {
                console.log('Set Bazaar Price only works for items in Inventory');
                contextMenu.classList.remove('visible');
                return;
            }
            
            // Add to bazaar items array
            const bazaarItem = {
                name: contextMenuTarget.name,
                containerSlot: parseInt(contextMenuTarget.slot)
            };
            
            // Check if already in array (avoid duplicates)
            const existingIndex = bazaarItems.findIndex(item => 
                item.name === bazaarItem.name && item.containerSlot === bazaarItem.containerSlot
            );
            
            if (existingIndex >= 0) {
                console.log('Item already has bazaar price set:', bazaarItem);
            } else {
                bazaarItems.push(bazaarItem);
                console.log('Added item to bazaar:', bazaarItem);
            }
            
            console.log('Current bazaar items:', bazaarItems);
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('consolidateMenuItem').addEventListener('click', () => {
            if (!contextMenuTarget) {
                contextMenu.classList.remove('visible');
                return;
            }
            
            // Find all items with the same ID as the right-clicked item
            const allItems = document.querySelectorAll('.item[data-item-id]');
            const consolidateArray = [];
            
            allItems.forEach(itemEl => {
                // Match by item ID, but exclude the target item itself
                if (itemEl.dataset.itemId == contextMenuTarget.id) {
                    const itemData = {
                        name: itemEl.querySelector('.item-name').textContent,
                        containerSlot: parseInt(itemEl.dataset.containerSlot),
                        containerId: parseInt(itemEl.dataset.containerId) || itemEl.dataset.containerId,
                        count: parseInt(itemEl.dataset.itemCount),
                        targetContainerId: parseInt(contextMenuTarget.containerId) || contextMenuTarget.containerId
                    };
                    consolidateArray.push(itemData);
                }
            });
            
            if (DEBUG) {
                console.log('Consolidate Array:', consolidateArray);
            }
            
            // TODO: Send consolidate command to server
            console.log(`Would consolidate ${consolidateArray.length} item(s) of ${contextMenuTarget.name} to container ${contextMenuTarget.containerId}`);
            
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('collapseAllMenuItem').addEventListener('click', () => {
            // Collapse all sections
            document.querySelectorAll('.section-header.collapsable').forEach(header => {
                const containerName = header.dataset.containerName;
                const section = header.parentElement;
                const contentDiv = section.querySelector('.section-content');
                const collapseIcon = header.querySelector('.collapse-icon');
                
                if (contentDiv && collapseIcon && !contentDiv.classList.contains('collapsed')) {
                    contentDiv.classList.add('collapsed');
                    collapseIcon.classList.add('collapsed');
                    collapsedSections.add(containerName);
                }
            });
            
            console.log('All sections collapsed');
            contextMenu.classList.remove('visible');
        });
        
        document.getElementById('expandAllMenuItem').addEventListener('click', () => {
            // Expand all sections
            document.querySelectorAll('.section-header.collapsable').forEach(header => {
                const containerName = header.dataset.containerName;
                const section = header.parentElement;
                const contentDiv = section.querySelector('.section-content');
                const collapseIcon = header.querySelector('.collapse-icon');
                
                if (contentDiv && collapseIcon && contentDiv.classList.contains('collapsed')) {
                    contentDiv.classList.remove('collapsed');
                    collapseIcon.classList.remove('collapsed');
                    collapsedSections.delete(containerName);
                }
            });
            
            console.log('All sections expanded');
            contextMenu.classList.remove('visible');
        });
        
        // Hide context menu and clear selection when clicking outside items
        document.addEventListener('click', (e) => {
            contextMenu.classList.remove('visible');
            
            // Clear selection if clicking on background (not an item or context menu)
            if (!e.target.closest('.item') && !e.target.closest('#contextMenu')) {
                document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
                selectedItems = [];
                lastSelectedIndex = -1;
                
                if (DEBUG) {
                    console.log('Selection cleared');
                }
            }
        });
        
        // Clear selection on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.item.selected').forEach(el => el.classList.remove('selected'));
                selectedItems = [];
                lastSelectedIndex = -1;
                contextMenu.classList.remove('visible');
                
                // Exit move mode if active
                if (moveMode) {
                    moveMode = false;
                    document.body.style.cursor = 'default';
                    console.log('Move mode cancelled');
                }
                
                // Cancel drag and drop if active
                if (isDragging) {
                    isDragging = false;
                    draggedItem = null;
                    dragGhost.classList.remove('visible');
                    dragGhost.innerHTML = '';
                    
                    // Remove the global mousemove listener
                    if (dragMoveHandler) {
                        document.removeEventListener('mousemove', dragMoveHandler);
                        dragMoveHandler = null;
                    }
                    
                    console.log('Drag cancelled');
                }
                
                // Clear hover state on containers
                if (hoveredContainer) {
                    hoveredContainer.element.classList.remove('move-target-hover');
                    hoveredContainer.element.classList.remove('can-fit');
                    hoveredContainer.element.classList.remove('cannot-fit');
                    hoveredContainer = null;
                }
                
                if (DEBUG) {
                    console.log('Selection cleared by ESC');
                }
            }
        });
        
        // Hide context menu when scrolling
        document.addEventListener('scroll', () => {
            contextMenu.classList.remove('visible');
        }, true);
        
        // Reset drag state on mouseup
        document.addEventListener('mouseup', () => {
            // If we're in move mode and hovering over a container, complete the move
            if (moveMode && hoveredContainer) {
                // Don't allow moving to the source container
                if (hoveredContainer.isSourceContainer) {
                    console.log('Cannot move to source container');
                } else if (hoveredContainer.canFit) {
                    const targetContainerId = hoveredContainer.containerId;
                    
                    // Send move request to backend
                    sendMoveRequest(selectedItems, targetContainerId).then(result => {
                        if (result.success) {
                            console.log(`Move initiated: ${selectedItems.length} item(s) to container ${targetContainerId}`);
                        } else {
                            console.error('Move failed:', result.error);
                            if (result.errors && result.errors.length > 0) {
                                alert('Move failed:\n' + result.errors.join('\n'));
                            } else if (result.error) {
                                alert('Move failed: ' + result.error);
                            }
                        }
                    });
                    
                    // Clear selection after successful move
                    document.querySelectorAll('.item.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    selectedItems = [];
                } else {
                    console.log('Cannot move');
                }
                
                // Clean up
                hoveredContainer.element.classList.remove('move-target-hover');
                hoveredContainer.element.classList.remove('can-fit');
                hoveredContainer.element.classList.remove('cannot-fit');
                moveMode = false;
                document.body.style.cursor = 'default';
                hoveredContainer = null;
            }
            
            // Hide drag ghost
            dragGhost.classList.remove('visible');
            dragGhost.innerHTML = '';
            
            isDragging = false;
            draggedItem = null;
            
            // Remove the global mousemove listener
            if (dragMoveHandler) {
                document.removeEventListener('mousemove', dragMoveHandler);
                dragMoveHandler = null;
            }
        });
        });
