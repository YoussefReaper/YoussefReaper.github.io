// ===== STICKER SYSTEM =====

// Sticker System State
let stickerSystemActive = false;
let userCoins = parseInt(localStorage.getItem('userCoins')) || 500;
let placedStickers = JSON.parse(localStorage.getItem('placedStickers')) || [];
let ownedStickers = JSON.parse(localStorage.getItem('ownedStickers')) || ['heart', 'star', 'smile']; // Default free stickers
let stickerQuantities = JSON.parse(localStorage.getItem('stickerQuantities')) || {
    'heart': 3, 'star': 3, 'smile': 3 // Default quantities for free stickers
}; // Track quantities for each sticker type
let customStickers = JSON.parse(localStorage.getItem('customStickers')) || []; // Custom uploaded stickers
let isDragging = false;
let currentDragSticker = null;
let dragOffset = { x: 0, y: 0 };

// Sticker System Initialization
function initializeStickerSystem() {
    console.log('🎨 Sticker System initialized');
    
    const stickerToggle = document.getElementById('stickerToggle');
    const maximizeStickerToggle = document.getElementById('maximizeStickerToggle');
    const stickerSidebar = document.getElementById('stickerSidebar');
    const closeStickerBtn = document.getElementById('closeStickerBtn');
    const saveStickerBtn = document.getElementById('saveStickerBtn');
    const clearStickersBtn = document.getElementById('clearStickersBtn');
    const switchPanelBtn = document.getElementById('switchStickerPanelBtn');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const stickerItems = document.querySelectorAll('.sticker-item');
    const uploadArea = document.getElementById('uploadArea');
    const customStickerInput = document.getElementById('customStickerInput');
    const gridCustomStickerInput = document.getElementById('gridCustomStickerInput');
    const userCoinsDisplay = document.getElementById('userCoins');
    
    // Debug element detection
    console.log('🔍 Element detection results:', {
        stickerToggle: !!stickerToggle,
        maximizeStickerToggle: !!maximizeStickerToggle,
        stickerSidebar: !!stickerSidebar,
        closeStickerBtn: !!closeStickerBtn,
        uploadArea: !!uploadArea
    });
    
    // Elements found - system ready
    // console.log('Found elements:', {
    //     maximizeStickerToggle: !!maximizeStickerToggle,
    //     stickerSidebar: !!stickerSidebar,
    //     stickerItems: stickerItems.length,
    //     switchPanelBtn: !!switchPanelBtn,
    //     canvas: !!document.getElementById('stickerCanvas')
    // });
    
    // Ensure sidebar starts hidden
    if (stickerSidebar) {
        stickerSidebar.classList.remove('active');
        // console.log('🔒 Sticker sidebar initialized as hidden');
    }
    
    // Update coins display
    updateCoinsDisplay();
    
    // Mark system as active
    stickerSystemActive = true;
    console.log('🎨 Sticker System fully initialized and active');
    
    // Load saved stickers
    loadSavedStickers();
    
    // Update sticker ownership display
    updateStickerOwnership();
    
    // Set initial panel position
    const savedPosition = localStorage.getItem('stickerPanelPosition') || 'right';
    if (stickerSidebar) {
        stickerSidebar.classList.remove('panel-left', 'panel-right');
        if (savedPosition === 'left') {
            stickerSidebar.classList.add('panel-left');
        }
    }
    if (switchPanelBtn) {
        if (savedPosition === 'right') {
            switchPanelBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            switchPanelBtn.title = 'Move Panel Left';
        } else {
            switchPanelBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
            switchPanelBtn.title = 'Move Panel Right';
        }
    }
    
    // Restore sidebar position from localStorage
    restoreSidebarPosition();
    
    // Initially hide all sticker buttons
    const maximizeStickerPanel = document.getElementById('maximizeStickerPanel');
    if (maximizeStickerToggle) maximizeStickerToggle.style.display = 'none';
    if (maximizeStickerPanel) maximizeStickerPanel.style.display = 'none';
    
    console.log('🔍 Debug sticker elements:', {
        maximizeStickerPanel: !!maximizeStickerPanel,
        maximizeStickerToggle: !!maximizeStickerToggle,
        stickerSidebar: !!stickerSidebar
    });
    
    // Force button styling for debugging
    if (maximizeStickerToggle) {
        maximizeStickerToggle.style.zIndex = '999999';
        maximizeStickerToggle.style.position = 'relative';
        maximizeStickerToggle.style.backgroundColor = '#667eea';
        maximizeStickerToggle.style.color = 'white';
        maximizeStickerToggle.style.border = 'none';
        maximizeStickerToggle.style.borderRadius = '50%';
        maximizeStickerToggle.style.width = '50px';
        maximizeStickerToggle.style.height = '50px';
        console.log('🎨 Applied button styling');
    }
    
    // Check maximize mode and show appropriate button
    let lastMaximizeState = null;
    let checkTimeout = null;
    
    const checkMaximizeMode = () => {
        // Debounce the check to prevent spam
        if (checkTimeout) {
            clearTimeout(checkTimeout);
        }
        
        checkTimeout = setTimeout(() => {
            const isMaximized = document.body.classList.contains('maximize-mode') || 
                               document.documentElement.classList.contains('maximize-mode') ||
                               document.querySelector('.maximize-mode') !== null;
            
            // Only log and act if state actually changed
            if (lastMaximizeState !== isMaximized) {
                console.log('🔍 Maximize mode changed:', { 
                    isMaximized, 
                    previous: lastMaximizeState
                });
                
                if (isMaximized) {
                    if (maximizeStickerPanel) {
                        maximizeStickerPanel.style.display = 'block';
                        maximizeStickerPanel.style.zIndex = '999999';
                        maximizeStickerPanel.style.position = 'fixed';
                        maximizeStickerPanel.style.top = '170px'; // 50px below user header
                        maximizeStickerPanel.style.right = '20px';
                        maximizeStickerPanel.style.width = '50px';
                        maximizeStickerPanel.style.height = '50px';
                        setTimeout(() => {
                            maximizeStickerPanel.classList.add('show');
                        }, 50);
                    }
                    console.log('✅ Maximize mode detected - showing sticker panel below user header');
                } else {
                    if (maximizeStickerPanel) {
                        maximizeStickerPanel.classList.remove('show');
                        setTimeout(() => {
                            if (!document.body.classList.contains('maximize-mode')) {
                                maximizeStickerPanel.style.display = 'none';
                            }
                        }, 300);
                    }
                    console.log('❌ Normal mode - hiding sticker panel');
                    // Also close sticker panel if it's open
                    if (stickerSystemActive) {
                        stickerSystemActive = false;
                        if (stickerSidebar) {
                            stickerSidebar.classList.remove('active');
                            console.log('🔒 Sticker sidebar hidden due to normal mode');
                        }
                        toggleStickerDragging(false);
                    }
                }
                
                lastMaximizeState = isMaximized;
            }
        }, 100); // Debounce delay
    };
        
    // Initial check
    checkMaximizeMode();
    
    // Watch for maximize mode changes (debounced)
    let observerTimeout = null;
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Only check if the class change is relevant to maximize mode
                const target = mutation.target;
                const currentClasses = target.className || '';
                if (currentClasses.includes('maximize-mode') || 
                    mutation.oldValue?.includes('maximize-mode')) {
                    shouldCheck = true;
                }
            }
        });
        
        if (shouldCheck) {
            if (observerTimeout) {
                clearTimeout(observerTimeout);
            }
            observerTimeout = setTimeout(() => {
                checkMaximizeMode();
            }, 50); // Small delay to batch multiple changes
        }
    });
    
    // Observe only body and html for class changes, not subtree
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        attributeOldValue: true 
    });
    observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'],
        attributeOldValue: true 
    });
    
    // Listen for maximize toggle events
    const maximizeToggle = document.getElementById('maximizeToggle');
    if (maximizeToggle) {
        maximizeToggle.addEventListener('click', () => {
            setTimeout(checkMaximizeMode, 100); // Small delay to let maximize mode activate
        });
    }
    
    // Sticker sidebar toggle for maximize button only
    const handleStickerToggle = () => {
        console.log('🎨 handleStickerToggle called, current state:', stickerSystemActive);
        stickerSystemActive = !stickerSystemActive;
        console.log('🎨 New state:', stickerSystemActive);
        
        if (stickerSidebar) {
            console.log('🎨 stickerSidebar found, applying state...');
            if (stickerSystemActive) {
                stickerSidebar.classList.add('active');
                console.log('🎨 Sticker sidebar opened - classes:', stickerSidebar.className);
            } else {
                stickerSidebar.classList.remove('active');
                console.log('🔒 Sticker sidebar closed - classes:', stickerSidebar.className);
            }
        } else {
            console.error('❌ stickerSidebar not found!');
        }
        
        // Enable/disable sticker dragging
        toggleStickerDragging(stickerSystemActive);
        console.log('🎨 Sticker panel toggled:', stickerSystemActive ? 'opened' : 'closed');
    };
    
    if (maximizeStickerToggle) {
        console.log('✅ maximizeStickerToggle found, adding event listener');
        maximizeStickerToggle.addEventListener('click', handleStickerToggle);
    } else {
        console.log('❌ maximizeStickerToggle not found');
    }
    
    // Add event listener for regular sticker toggle too
    if (stickerToggle) {
        console.log('✅ stickerToggle found, adding event listener');
        stickerToggle.addEventListener('click', handleStickerToggle);
    } else {
        console.log('❌ stickerToggle not found');
    }
    
    if (closeStickerBtn) {
        closeStickerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            stickerSystemActive = false;
            if (stickerSidebar) {
                stickerSidebar.classList.remove('active');
                console.log('🔒 Sticker sidebar closed via close button');
            }
            toggleStickerDragging(false);
        });
    }
    
    // Panel position switching
    if (switchPanelBtn) {
        switchPanelBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const isLeft = stickerSidebar.classList.contains('panel-left');
            
            if (isLeft) {
                // Switch to right
                stickerSidebar.classList.remove('panel-left');
                switchPanelBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
                switchPanelBtn.title = 'Move Panel Left';
                localStorage.setItem('stickerPanelPosition', 'right');
            } else {
                // Switch to left
                stickerSidebar.classList.add('panel-left');
                switchPanelBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
                switchPanelBtn.title = 'Move Panel Right';
                localStorage.setItem('stickerPanelPosition', 'left');
            }
            
            console.log('🔄 Panel switched to:', isLeft ? 'right' : 'left');
        });
    }

    // Position toggle functionality
    const positionToggleBtn = document.getElementById('positionToggleBtn');
    if (positionToggleBtn) {
        positionToggleBtn.addEventListener('click', () => {
            toggleSidebarPosition();
        });
    }
    
    // Category switching
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            switchStickerCategory(category);
        });
    });
    
    // Sticker selection
    stickerItems.forEach(item => {
        item.addEventListener('click', () => {
            console.log('Sticker item clicked:', item);
            const stickerData = item.dataset.sticker;
            console.log('Sticker data:', stickerData);
            
            // Check if sticker is owned
            if (!ownedStickers.includes(stickerData)) {
                console.log('Sticker not owned, trying to purchase...');
                // Try to purchase if not owned
                const cost = item.querySelector('.sticker-cost');
                if (cost) {
                    const price = parseInt(cost.textContent.match(/\d+/)[0]);
                    if (userCoins >= price) {
                        purchaseSticker(stickerData, price);
                        updateStickerOwnership();
                    } else {
                        showNotification('Not enough coins!', 'error');
                        return;
                    }
                } else {
                    return; // Shouldn't happen
                }
            }
            
            console.log('Placing sticker on canvas...');
            // Place sticker on canvas (always create new instance)
            addStickerToCanvas(stickerData);
        });
    });
    
    // Save layout
    if (saveStickerBtn) {
        saveStickerBtn.addEventListener('click', () => {
            saveStickerLayout();
            stickerSystemActive = false;
            stickerSidebar.classList.remove('active');
            toggleStickerDragging(false);
            showNotification('Sticker layout saved!', 'success');
        });
    }
    
    // Clear all stickers
    if (clearStickersBtn) {
        clearStickersBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove all stickers?')) {
                clearAllStickers();
                showNotification('All stickers cleared!', 'info');
            }
        });
    }
    
    // Custom sticker upload - Main upload area
    if (uploadArea && customStickerInput) {
        console.log('✅ Custom sticker upload elements found and setting up event listeners');
        
        uploadArea.addEventListener('click', () => {
            console.log('🖱️ Upload area clicked, triggering file input');
            customStickerInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(103, 197, 255, 0.8)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(103, 197, 255, 0.3)';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(103, 197, 255, 0.3)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                console.log('📎 File dropped:', files[0].name);
                handleCustomStickerUpload(files[0]);
            }
        });
        
        customStickerInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                console.log('📁 File selected:', e.target.files[0].name);
                handleCustomStickerUpload(e.target.files[0]);
            }
        });
    } else {
        console.log('❌ Upload area or custom sticker input not found:', { uploadArea: !!uploadArea, customStickerInput: !!customStickerInput });
    }
    
    // Grid upload button
    if (gridCustomStickerInput) {
        gridCustomStickerInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                console.log('📁 Grid file selected:', e.target.files[0].name);
                handleCustomStickerUpload(e.target.files[0]);
            }
        });
    }
    
    // Initialize the custom category by default since it's the only category
    console.log('🎨 Initializing custom sticker category');
    switchStickerCategory('custom');
}

// Switch sticker category
function switchStickerCategory(category) {
    const stickerGrid = document.getElementById('stickerGrid');
    const customUploadSection = document.querySelector('.custom-upload-section');
    
    if (category === 'custom') {
        stickerGrid.style.display = 'none';
        customUploadSection.style.display = 'block';
        // Add scroller to the custom upload section
        customUploadSection.style.cssText = `
            display: block;
            max-height: 400px;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 4px;
            scrollbar-width: thin;
            scrollbar-color: rgba(103, 197, 255, 0.6) rgba(255, 255, 255, 0.1);
        `;
        
        // Ensure scrollbar styles are applied to custom upload section
        let uploadScrollbarStyle = document.head.querySelector('style[data-upload-scrollbar]');
        if (!uploadScrollbarStyle) {
            uploadScrollbarStyle = document.createElement('style');
            uploadScrollbarStyle.setAttribute('data-upload-scrollbar', 'true');
            uploadScrollbarStyle.textContent = `
                .custom-upload-section::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-upload-section::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-upload-section::-webkit-scrollbar-thumb {
                    background: rgba(103, 197, 255, 0.6);
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }
                .custom-upload-section::-webkit-scrollbar-thumb:hover {
                    background: rgba(103, 197, 255, 0.8);
                }
                .custom-upload-section::-webkit-scrollbar-corner {
                    background: transparent;
                }
            `;
            document.head.appendChild(uploadScrollbarStyle);
            console.log('Custom upload section scrollbar styles injected');
        }
        displayCustomStickers();
    } else {
        stickerGrid.style.display = 'grid';
        customUploadSection.style.display = 'none';
    }
}

// Display custom stickers
function displayCustomStickers() {
    const customUploadSection = document.querySelector('.custom-upload-section');
    
    // Remove existing custom sticker grid if it exists
    let customGrid = customUploadSection.querySelector('.custom-stickers-grid');
    if (customGrid) {
        customGrid.remove();
    }
    
    // Create custom stickers grid
    customGrid = document.createElement('div');
    customGrid.className = 'custom-stickers-grid';
    customGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;
        margin-top: 16px;
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: rgba(103, 197, 255, 0.6) rgba(255, 255, 255, 0.1);
    `;
    
    // Force create scrollbar styles if not exists
    let scrollbarStyle = document.head.querySelector('style[data-custom-scrollbar]');
    if (!scrollbarStyle) {
        scrollbarStyle = document.createElement('style');
        scrollbarStyle.setAttribute('data-custom-scrollbar', 'true');
        scrollbarStyle.textContent = `
            .custom-stickers-grid::-webkit-scrollbar {
                width: 8px;
            }
            .custom-stickers-grid::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            .custom-stickers-grid::-webkit-scrollbar-thumb {
                background: rgba(103, 197, 255, 0.6);
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            .custom-stickers-grid::-webkit-scrollbar-thumb:hover {
                background: rgba(103, 197, 255, 0.8);
            }
            .custom-stickers-grid::-webkit-scrollbar-corner {
                background: transparent;
            }
        `;
        document.head.appendChild(scrollbarStyle);
        console.log('Custom scrollbar styles injected');
    }
    
    // Add custom stickers
    customStickers.forEach((sticker, index) => {
        const stickerItem = document.createElement('div');
        stickerItem.className = 'custom-sticker-item';
        stickerItem.style.cssText = `
            border: 2px solid rgba(103, 197, 255, 0.3);
            border-radius: 8px;
            padding: 8px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s ease;
            background: rgba(103, 197, 255, 0.1);
        `;
        
        const img = document.createElement('img');
        img.src = sticker.data;
        img.style.cssText = `
            width: 100%;
            height: 60px;
            object-fit: contain;
            border-radius: 4px;
        `;
        
        const name = document.createElement('div');
        name.textContent = sticker.name;
        name.style.cssText = `
            font-size: 12px;
            margin-top: 4px;
            color: var(--text-primary, #fff);
        `;
        
        stickerItem.appendChild(img);
        stickerItem.appendChild(name);
        
        // Click to place custom sticker
        stickerItem.addEventListener('click', () => {
            console.log('Custom sticker item clicked:', sticker);
            addCustomStickerToCanvas(sticker);
        });
        
        // Hover effects
        stickerItem.addEventListener('mouseenter', () => {
            stickerItem.style.borderColor = 'rgba(103, 197, 255, 0.8)';
            stickerItem.style.background = 'rgba(103, 197, 255, 0.2)';
        });
        
        stickerItem.addEventListener('mouseleave', () => {
            stickerItem.style.borderColor = 'rgba(103, 197, 255, 0.3)';
            stickerItem.style.background = 'rgba(103, 197, 255, 0.1)';
        });
        
        customGrid.appendChild(stickerItem);
    });
    
    // Add the grid to the section
    customUploadSection.appendChild(customGrid);
    
    // Add a test message if no custom stickers exist (to help see the scroller area)
    if (customStickers.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            border: 2px dashed rgba(103, 197, 255, 0.3);
            border-radius: 8px;
            margin-top: 16px;
        `;
        emptyMessage.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">📁</div>
            <div>No custom stickers yet</div>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Upload images to create custom stickers</div>
        `;
        customUploadSection.appendChild(emptyMessage);
    }
}

// Add sticker to canvas
function addStickerToCanvas(stickerType) {
    console.log('Adding sticker to canvas:', stickerType);
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    if (!stickerCanvas) {
        console.error('Sticker canvas not found!');
        showNotification('Error: Sticker canvas not found!', 'error');
        return;
    }
    
    // Check if user has this sticker type in quantity
    const availableQuantity = stickerQuantities[stickerType] || 0;
    const placedCount = stickerCanvas.querySelectorAll(`[data-sticker="${stickerType}"]`).length;
    
    if (placedCount >= availableQuantity) {
        showNotification(`No more ${stickerType} stickers available! Buy more or remove existing ones.`, 'error');
        return;
    }
    
    const stickerElement = document.createElement('div');
    stickerElement.className = 'placed-sticker new';
    stickerElement.dataset.sticker = stickerType;
    
    // Get sticker emoji/content and create image
    const stickerMap = {
        'heart': '❤️',
        'star': '⭐',
        'smile': '😊',
        'fire': '🔥',
        'rocket': '🚀',
        'unicorn': '🦄',
        'sparkles': '✨',
        'rainbow': '🌈',
        'crown': '👑',
        'diamond': '💎',
        'lightning': '⚡',
        'magic': '🪄',
        'butterfly': '🦋',
        'love': '❤️',
        'happy': '😊',
        'cool': '😎',
        'thumbs': '👍',
        'clap': '👏',
        'peace': '✌️',
        'ok': '👌',
        'muscle': '💪',
        'brain': '🧠',
        'eyes': '👀',
        'alien': '👽',
        'robot': '🤖',
        'ghost': '👻',
        'pizza': '🍕',
        'cake': '🎂',
        'gift': '🎁',
        'balloon': '🎈',
        'party': '🎉',
        'confetti': '🎊',
        'music': '🎵',
        'note': '🎶',
        'guitar': '🎸',
        'mic': '🎤',
        'headphones': '🎧'
    };
    
    // Create image element for the emoji
    const stickerImg = document.createElement('div');
    // Improved fallback: try to get content from stickerMap, or use a default happy emoji instead of ?
    const stickerContent = stickerMap[stickerType] || stickerMap[stickerType?.toLowerCase()] || '😊';
    stickerImg.textContent = stickerContent;
    stickerImg.style.cssText = `
        width: auto !important;
        height: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 3rem !important;
        line-height: 1 !important;
        pointer-events: none !important;
        flex-shrink: 0 !important;
    `;
    stickerElement.appendChild(stickerImg);
    
    console.log('Sticker content:', stickerImg.textContent);
    
    // Position in center area for better visibility
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const x = centerX + (Math.random() - 0.5) * 200; // Smaller random offset
    const y = centerY + (Math.random() - 0.5) * 200;
    
    stickerElement.style.cssText = `
        position: fixed !important;
        left: ${x}px !important;
        top: ${y}px !important;
        width: 100px !important;
        height: 100px !important;
        z-index: 999999 !important;
        user-select: none !important;
        cursor: ${stickerSystemActive ? 'pointer' : 'default'} !important;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: all !important;
        opacity: ${stickerSystemActive ? '1' : '0.8'} !important;
        visibility: visible !important;
    `;
    
    console.log('Sticker position:', stickerElement.style.left, stickerElement.style.top);
    
    // Add drag functionality
    addStickerDragHandlers(stickerElement);
    
    // Initially set to static mode since panel starts closed
    if (!stickerSystemActive) {
        stickerElement.classList.add('static');
    }
    
    stickerCanvas.appendChild(stickerElement);
    console.log('Sticker added to canvas. Canvas children count:', stickerCanvas.children.length);
    
    // Auto-save after placing new sticker
    setTimeout(() => {
        saveStickerLayout();
        console.log('Auto-saved after placing new sticker');
    }, 100);
    
    // Remove 'new' class after animation
    setTimeout(() => {
        stickerElement.classList.remove('new');
        console.log('Animation class removed');
    }, 600);
    
    const remaining = availableQuantity - placedCount - 1;
    showNotification(`${stickerType} sticker placed! (${remaining} remaining)`, 'success');
    
    // Update quantity display
    updateStickerOwnership();
}

// Add drag handlers to sticker
function addStickerDragHandlers(sticker) {
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: rgba(103, 197, 255, 0.9);
        border: 2px solid white;
        border-radius: 50%;
        cursor: nw-resize;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 100001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        display: none;
    `;
    sticker.appendChild(resizeHandle);
    
    // Add edit panel (shows when sticker is clicked in edit mode)
    const editPanel = document.createElement('div');
    editPanel.className = 'sticker-edit-panel';
    editPanel.style.cssText = `
        position: absolute;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 30, 0.95);
        border: 2px solid rgba(103, 197, 255, 0.8);
        border-radius: 12px;
        padding: 8px;
        display: none;
        flex-direction: row;
        gap: 8px;
        z-index: 100002;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        min-width: 120px;
        justify-content: center;
    `;
    
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '⚙️';
    editBtn.title = 'Edit Sticker';
    editBtn.style.cssText = `
        background: rgba(103, 197, 255, 0.8);
        border: none;
        border-radius: 6px;
        color: white;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Sticker';
    deleteBtn.style.cssText = `
        background: rgba(255, 68, 68, 0.8);
        border: none;
        border-radius: 6px;
        color: white;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    editPanel.appendChild(editBtn);
    editPanel.appendChild(deleteBtn);
    sticker.appendChild(editPanel);
    
    // Hover effects for static mode (when panel is closed)
    sticker.addEventListener('mouseenter', () => {
        if (!stickerSystemActive) {
            // Static mode hover effect - only add scale without affecting existing transforms
            sticker.style.transform = (sticker.style.transform || '') + ' scale(1.05)';
            sticker.style.filter = 'brightness(1.1) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        } else {
            // Edit mode hover effect
            resizeHandle.style.display = 'block';
            resizeHandle.style.opacity = '1';
        }
    });
    
    sticker.addEventListener('mouseleave', () => {
        if (!stickerSystemActive) {
            // Reset static mode hover - only remove scale, preserve all other transforms
            const currentTransform = sticker.style.transform || '';
            const transformWithoutScale = currentTransform.replace(/\s*scale\([^)]*\)\s*/g, '').trim();
            sticker.style.transform = transformWithoutScale;
            sticker.style.filter = 'none';
        } else {
            // Hide resize handle in edit mode when not needed
            if (!sticker.classList.contains('editing')) {
                resizeHandle.style.opacity = '0';
                setTimeout(() => {
                    if (resizeHandle.style.opacity === '0') {
                        resizeHandle.style.display = 'none';
                    }
                }, 200);
            }
        }
    });
    
    // Click handler for edit mode
    sticker.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (stickerSystemActive) {
            // Show edit panel
            const allPanels = document.querySelectorAll('.sticker-edit-panel');
            allPanels.forEach(panel => panel.style.display = 'none');
            
            editPanel.style.display = 'flex';
            sticker.classList.add('editing');
        }
    });
    
    // Edit button click
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showStickerEditModal(sticker);
    });
    
    // Delete button click
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this sticker?')) {
            sticker.remove();
            showNotification('Sticker deleted!', 'success');
            // Auto-save after deletion
            setTimeout(() => {
                saveStickerLayout();
                console.log('Auto-saved after sticker deletion');
            }, 100);
        }
    });
    
    // Right-click context menu
    sticker.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (stickerSystemActive) {
            showStickerContextMenu(e, sticker);
        }
    });

    // Drag functionality
    let isDraggingSticker = false;
    let isResizing = false;
    let dragStartX, dragStartY, stickerStartX, stickerStartY;
    let resizeStartSize;
    
    // Mouse down on sticker (not resize handle)
    sticker.addEventListener('mousedown', (e) => {
        // Only allow interaction when sticker system is active
        if (!stickerSystemActive) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        if (e.target === resizeHandle) {
            // Start resizing
            isResizing = true;
            e.preventDefault();
            e.stopPropagation();
            
            const rect = sticker.getBoundingClientRect();
            resizeStartSize = { width: rect.width, height: rect.height };
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            sticker.style.transition = 'none';
            document.body.style.cursor = 'nw-resize';
        } else if (e.target !== editBtn && e.target !== deleteBtn && !e.target.closest('.sticker-edit-panel')) {
            // Start dragging
            isDraggingSticker = true;
            e.preventDefault();
            e.stopPropagation();
            
            sticker.classList.add('dragging');
            sticker.style.transition = 'none';
            sticker.style.transform = 'scale(1.1)';
            
            const rect = sticker.getBoundingClientRect();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            stickerStartX = rect.left;
            stickerStartY = rect.top;
            
            document.body.style.cursor = 'grabbing';
            
            // Hide edit panel while dragging
            editPanel.style.display = 'none';
        }
    });
    
    // Global mouse move
    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            const delta = Math.max(deltaX, deltaY); // Use the larger delta for proportional resize
            
            const newSize = Math.max(50, Math.min(300, resizeStartSize.width + delta));
            sticker.style.width = newSize + 'px';
            sticker.style.height = newSize + 'px';
            
            // Update font size proportionally for emoji stickers
            const fontSize = Math.max(1.5, Math.min(8, (newSize / 100) * 3));
            const stickerContent = sticker.querySelector('div');
            if (stickerContent && !sticker.querySelector('img')) {
                stickerContent.style.fontSize = fontSize + 'rem';
            }
        } else if (isDraggingSticker) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            // Allow stickers to be moved everywhere without constraints
            const newX = stickerStartX + deltaX;
            const newY = stickerStartY + deltaY;
            
            sticker.style.left = newX + 'px';
            sticker.style.top = newY + 'px';
        }
    });
    
    // Global mouse up
    document.addEventListener('mouseup', () => {
        if (isDraggingSticker || isResizing) {
            sticker.classList.remove('dragging');
            sticker.style.transition = 'transform 0.2s ease';
            // Preserve existing transforms, only remove any scale from dragging
            const currentTransform = sticker.style.transform || '';
            const transformWithoutScale = currentTransform.replace(/\s*scale\([^)]*\)\s*/g, '').trim();
            sticker.style.transform = transformWithoutScale;
            document.body.style.cursor = 'default';
            
            // Auto-save sticker positions after dragging or resizing
            if (isDraggingSticker || isResizing) {
                setTimeout(() => {
                    saveStickerLayout();
                    console.log('Auto-saved sticker positions');
                }, 100); // Small delay to ensure final position is set
            }
            
            isDraggingSticker = false;
            isResizing = false;
        }
    });
}

// Toggle sticker dragging
function toggleStickerDragging(enable) {
    const stickers = document.querySelectorAll('.placed-sticker');
    stickers.forEach(sticker => {
        if (enable) {
            sticker.classList.remove('static');
            sticker.style.cursor = 'pointer';
            sticker.style.opacity = '1';
            sticker.style.pointerEvents = 'all';
        } else {
            sticker.classList.add('static');
            sticker.style.cursor = 'default';
            sticker.style.opacity = '0.8';
            sticker.style.pointerEvents = 'all'; // Keep clickable for hover effects
            
            // Hide any visible controls
            const editPanel = sticker.querySelector('.sticker-edit-panel');
            const removeBtn = sticker.querySelector('.sticker-remove');
            const resizeHandle = sticker.querySelector('.resize-handle');
            if (editPanel) editPanel.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'none';
            if (resizeHandle) resizeHandle.style.opacity = '0';
        }
    });
}

// Purchase sticker
function purchaseSticker(stickerType, cost) {
    userCoins -= cost;
    localStorage.setItem('userCoins', userCoins.toString());
    
    // Add to owned stickers (only once)
    if (!ownedStickers.includes(stickerType)) {
        ownedStickers.push(stickerType);
        localStorage.setItem('ownedStickers', JSON.stringify(ownedStickers));
        
        // Set initial quantity (usually 1 for purchased stickers)
        stickerQuantities[stickerType] = 1;
    } else {
        // If already owned, increase quantity
        stickerQuantities[stickerType] = (stickerQuantities[stickerType] || 0) + 1;
    }
    
    localStorage.setItem('stickerQuantities', JSON.stringify(stickerQuantities));
    
    updateCoinsDisplay();
    showNotification(`Purchased ${stickerType} sticker! Click it again to place.`, 'success');
}

// Update sticker ownership display
function updateStickerOwnership() {
    const stickerItems = document.querySelectorAll('.sticker-item');
    
    stickerItems.forEach(item => {
        const stickerType = item.dataset.sticker;
        const isOwned = ownedStickers.includes(stickerType);
        const quantity = stickerQuantities[stickerType] || 0;
        
        if (isOwned) {
            item.classList.remove('locked');
            
            // Remove old cost element
            const costElement = item.querySelector('.sticker-cost');
            if (costElement) {
                costElement.remove();
            }
            
            // Update or add quantity display
            let quantityElement = item.querySelector('.sticker-quantity');
            if (!quantityElement) {
                quantityElement = document.createElement('div');
                quantityElement.className = 'sticker-quantity';
                quantityElement.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(103, 197, 255, 0.9);
                    color: white;
                    border-radius: 12px;
                    padding: 2px 8px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10;
                `;
                item.appendChild(quantityElement);
            }
            quantityElement.textContent = `×${quantity}`;
            
            // Add quantity increase button
            let increaseBtn = item.querySelector('.quantity-increase-btn');
            if (!increaseBtn) {
                increaseBtn = document.createElement('button');
                increaseBtn.className = 'quantity-increase-btn';
                increaseBtn.innerHTML = '+';
                increaseBtn.style.cssText = `
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    background: rgba(16, 185, 129, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s ease;
                `;
                
                increaseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Calculate cost (50% of original cost)
                    const originalCost = getStickerOriginalCost(stickerType);
                    const increaseCost = Math.ceil(originalCost * 0.5);
                    
                    if (userCoins >= increaseCost) {
                        userCoins -= increaseCost;
                        stickerQuantities[stickerType] = (stickerQuantities[stickerType] || 0) + 1;
                        
                        localStorage.setItem('userCoins', userCoins.toString());
                        localStorage.setItem('stickerQuantities', JSON.stringify(stickerQuantities));
                        
                        updateCoinsDisplay();
                        updateStickerOwnership();
                        
                        showNotification(`+1 ${stickerType} sticker! (-${increaseCost} coins)`, 'success');
                    } else {
                        showNotification('Not enough coins!', 'error');
                    }
                });
                
                item.appendChild(increaseBtn);
            }
            
            // Add owned status if not exists
            let statusElement = item.querySelector('.sticker-status');
            if (!statusElement) {
                statusElement = document.createElement('span');
                statusElement.className = 'sticker-status unlocked';
                statusElement.textContent = 'Owned';
                statusElement.style.cssText = `
                    position: absolute;
                    bottom: 4px;
                    left: 4px;
                    background: rgba(34, 197, 94, 0.9);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: bold;
                `;
                item.appendChild(statusElement);
            }
        } else {
            item.classList.add('locked');
            
            // Remove quantity elements
            const quantityElement = item.querySelector('.sticker-quantity');
            const increaseBtn = item.querySelector('.quantity-increase-btn');
            const statusElement = item.querySelector('.sticker-status');
            
            if (quantityElement) quantityElement.remove();
            if (increaseBtn) increaseBtn.remove();
            if (statusElement) statusElement.remove();
        }
    });
}

// Get original cost of a sticker
function getStickerOriginalCost(stickerType) {
    const costMap = {
        'heart': 0, 'star': 0, 'smile': 0, // Free stickers
        'fire': 50, 'rocket': 75, 'unicorn': 100,
        'sparkles': 60, 'rainbow': 80, 'crown': 120,
        'diamond': 150, 'lightning': 90, 'magic': 110,
        'butterfly': 85
    };
    return costMap[stickerType] || 50;
}

// Update coins display
function updateCoinsDisplay() {
    const userCoinsDisplay = document.getElementById('userCoins');
    if (userCoinsDisplay) {
        userCoinsDisplay.textContent = userCoins;
    }
}

// Save sticker layout
function saveStickerLayout() {
    const stickers = document.querySelectorAll('.placed-sticker');
    placedStickers = [];
    
    stickers.forEach(sticker => {
        const stickerData = {
            type: sticker.dataset.sticker,
            x: parseInt(sticker.style.left),
            y: parseInt(sticker.style.top),
            width: parseInt(sticker.style.width) || 100,
            height: parseInt(sticker.style.height) || 100,
            transform: sticker.style.transform || '',
            zIndex: sticker.style.zIndex || '999999'
        };
        
        // Save custom sticker data if it's a custom sticker
        if (sticker.dataset.sticker === 'custom' && sticker.dataset.customId) {
            stickerData.customId = sticker.dataset.customId;
            const customSticker = customStickers.find(cs => cs.id === sticker.dataset.customId);
            if (customSticker) {
                stickerData.customData = customSticker;
            }
        } else {
            // For emoji stickers, save the content
            const stickerContent = sticker.querySelector('div:not(.sticker-edit-panel):not(.resize-handle)');
            if (stickerContent) {
                stickerData.content = stickerContent.textContent;
                stickerData.fontSize = stickerContent.style.fontSize || '3rem';
            }
        }
        
        placedStickers.push(stickerData);
    });
    
    localStorage.setItem('placedStickers', JSON.stringify(placedStickers));
}

// Load saved stickers
function loadSavedStickers() {
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    placedStickers.forEach(stickerData => {
        if (stickerData.type === 'custom' && stickerData.customId) {
            // Load custom sticker
            loadCustomSticker(stickerData);
        } else {
            // Load emoji sticker
            loadEmojiSticker(stickerData);
        }
    });
}

// Load custom sticker from saved data
function loadCustomSticker(stickerData) {
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    // Find the custom sticker data
    let customSticker = stickerData.customData;
    if (!customSticker && stickerData.customId) {
        customSticker = customStickers.find(cs => cs.id === stickerData.customId);
    }
    
    if (!customSticker) {
        console.warn('Custom sticker data not found for:', stickerData.customId);
        return;
    }
    
    const stickerElement = document.createElement('div');
    stickerElement.className = 'placed-sticker static';
    stickerElement.dataset.sticker = 'custom';
    stickerElement.dataset.customId = stickerData.customId;
    
    const img = document.createElement('img');
    img.src = customSticker.data;
    img.style.cssText = `
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        border-radius: 0 !important;
        pointer-events: none !important;
        flex-shrink: 0 !important;
        background: transparent !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) !important;
    `;
    stickerElement.appendChild(img);
    
    // Apply saved position and properties
    stickerElement.style.cssText = `
        position: fixed !important;
        left: ${stickerData.x}px !important;
        top: ${stickerData.y}px !important;
        width: ${stickerData.width || 100}px !important;
        height: ${stickerData.height || 100}px !important;
        z-index: ${stickerData.zIndex || 999999} !important;
        user-select: none !important;
        cursor: default !important;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        transition: transform 0.2s ease !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: all !important;
        opacity: 0.8 !important;
        visibility: visible !important;
        transform: ${stickerData.transform || ''} !important;
    `;
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'sticker-remove';
    removeBtn.innerHTML = '×';
    removeBtn.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 68, 68, 0.9);
        color: white;
        border: 2px solid white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
    `;
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stickerElement.remove();
        console.log('Custom sticker removed');
    });
    stickerElement.appendChild(removeBtn);
    
    // Add hover effects
    stickerElement.addEventListener('mouseenter', () => {
        removeBtn.style.display = 'flex';
        if (!stickerSystemActive) {
            // Only add scale without affecting existing transforms
            stickerElement.style.transform = (stickerElement.style.transform || '') + ' scale(1.05)';
            img.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        }
    });
    stickerElement.addEventListener('mouseleave', () => {
        removeBtn.style.display = 'none';
        if (!stickerSystemActive) {
            // Remove only scale but preserve original transform
            const currentTransform = stickerElement.style.transform || '';
            const transformWithoutScale = currentTransform.replace(/\s*scale\([^)]*\)\s*/g, '').trim();
            stickerElement.style.transform = transformWithoutScale;
            img.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
        }
    });
    
    addStickerDragHandlers(stickerElement);
    stickerCanvas.appendChild(stickerElement);
}

// Load emoji sticker from saved data
function loadEmojiSticker(stickerData) {
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    const stickerElement = document.createElement('div');
    stickerElement.className = 'placed-sticker static';
    stickerElement.dataset.sticker = stickerData.type;
    
    // Get sticker emoji/content and create image
    const stickerMap = {
        'heart': '❤️',
        'star': '⭐',
        'smile': '😊',
        'fire': '🔥',
        'rocket': '🚀',
        'unicorn': '🦄',
        'sparkles': '✨',
        'rainbow': '🌈',
        'crown': '👑',
        'diamond': '💎',
        'lightning': '⚡',
        'magic': '🪄',
        'butterfly': '🦋',
        'love': '❤️',
        'happy': '😊',
        'cool': '😎',
        'thumbs': '👍',
        'clap': '👏',
        'peace': '✌️',
        'ok': '👌',
        'muscle': '💪',
        'brain': '🧠',
        'eyes': '👀',
        'alien': '👽',
        'robot': '🤖',
        'ghost': '👻',
        'pizza': '🍕',
        'cake': '🎂',
        'gift': '🎁',
        'balloon': '🎈',
        'party': '🎉',
        'confetti': '🎊',
        'music': '🎵',
        'note': '🎶',
        'guitar': '🎸',
        'mic': '🎤',
        'headphones': '🎧'
    };
    
    // Create image element for the emoji
    const stickerImg = document.createElement('div');
    // Improved fallback handling with better error checking
    const stickerContent = stickerData.content || 
                          stickerMap[stickerData.type] || 
                          stickerMap[stickerData.type?.toLowerCase()] || 
                          '😊';
    stickerImg.textContent = stickerContent;
    stickerImg.style.cssText = `
        width: auto !important;
        height: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: ${stickerData.fontSize || '3rem'} !important;
        line-height: 1 !important;
        pointer-events: none !important;
        flex-shrink: 0 !important;
    `;
    stickerElement.appendChild(stickerImg);
    
    // Apply saved position and properties
    stickerElement.style.cssText = `
        position: fixed !important;
        left: ${stickerData.x}px !important;
        top: ${stickerData.y}px !important;
        width: ${stickerData.width || 100}px !important;
        height: ${stickerData.height || 100}px !important;
        z-index: ${stickerData.zIndex || 999999} !important;
        user-select: none !important;
        cursor: default !important;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: all !important;
        opacity: 0.8 !important;
        visibility: visible !important;
        transform: ${stickerData.transform || ''} !important;
    `;
    
    addStickerDragHandlers(stickerElement);
    stickerCanvas.appendChild(stickerElement);
}

// Clear all stickers
function clearAllStickers() {
    const stickerCanvas = document.getElementById('stickerCanvas');
    stickerCanvas.innerHTML = '';
    placedStickers = [];
    localStorage.removeItem('placedStickers');
}

// Handle custom sticker upload
function handleCustomStickerUpload(file) {
    console.log('🎨 handleCustomStickerUpload called with file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (!file.type.startsWith('image/')) {
        console.log('❌ File is not an image');
        showNotification('Please upload an image file!', 'error');
        return;
    }
    
    const size = file.size;
    let cost;
    
    if (size <= 50 * 1024) { // 50KB
        cost = 25;
    } else if (size <= 200 * 1024) { // 200KB
        cost = 50;
    } else if (size <= 500 * 1024) { // 500KB
        cost = 100;
    } else {
        showNotification('File too large! Maximum size is 500KB.', 'error');
        return;
    }
    
    if (userCoins < cost) {
        showNotification('Not enough coins for this file size!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        // Save custom sticker to collection (only once)
        const customSticker = {
            id: Date.now().toString(),
            name: file.name.split('.')[0],
            data: e.target.result,
            cost: cost
        };
        
        customStickers.push(customSticker);
        localStorage.setItem('customStickers', JSON.stringify(customStickers));
        
        // Deduct coins
        userCoins -= cost;
        localStorage.setItem('userCoins', userCoins.toString());
        updateCoinsDisplay();
        
        showNotification(`Custom sticker "${customSticker.name}" added to collection! (-${cost} coins)`, 'success');
        
        // Refresh custom stickers display if we're on custom tab
        const customTab = document.querySelector('.category-tab[data-category="custom"]');
        if (customTab && customTab.classList.contains('active')) {
            console.log('🔄 Refreshing custom stickers display');
            displayCustomStickers();
        } else {
            console.log('ℹ️ Custom tab not active, sticker saved to collection');
        }
    };
    
    reader.readAsDataURL(file);
}

// Add custom sticker to canvas
function addCustomStickerToCanvas(customSticker) {
    console.log('Adding custom sticker to canvas:', customSticker);
    const stickerCanvas = document.getElementById('stickerCanvas');
    
    if (!stickerCanvas) {
        console.error('Sticker canvas not found for custom sticker!');
        showNotification('Error: Sticker canvas not found!', 'error');
        return;
    }
    
    // Check if this custom sticker already exists (one quantity per sticker)
    const existingSticker = stickerCanvas.querySelector(`[data-custom-id="${customSticker.id}"]`);
    if (existingSticker) {
        showNotification(`"${customSticker.name}" is already placed! Remove it first.`, 'error');
        return;
    }
    
    const stickerElement = document.createElement('div');
    stickerElement.className = 'placed-sticker new';
    stickerElement.dataset.sticker = 'custom';
    stickerElement.dataset.customId = customSticker.id;
    
    const img = document.createElement('img');
    img.src = customSticker.data;
    img.style.cssText = `
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
        border-radius: 0 !important;
        pointer-events: none !important;
        flex-shrink: 0 !important;
        background: transparent !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) !important;
    `;
    stickerElement.appendChild(img);
    
    // Position in center area for better visibility
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const x = centerX + (Math.random() - 0.5) * 200;
    const y = centerY + (Math.random() - 0.5) * 200;
    
    stickerElement.style.cssText = `
        position: fixed !important;
        left: ${x}px !important;
        top: ${y}px !important;
        width: 100px !important;
        height: 100px !important;
        z-index: 999999 !important;
        user-select: none !important;
        cursor: ${stickerSystemActive ? 'move' : 'default'} !important;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        transition: transform 0.2s ease !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: all !important;
        opacity: ${stickerSystemActive ? '1' : '0.8'} !important;
        visibility: visible !important;
    `;
    
    console.log('Custom sticker position:', stickerElement.style.left, stickerElement.style.top);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'sticker-remove';
    removeBtn.innerHTML = '×';
    removeBtn.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 68, 68, 0.9);
        color: white;
        border: 2px solid white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
    `;
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stickerElement.remove();
        console.log('Custom sticker removed');
        // Auto-save after custom sticker removal
        setTimeout(() => {
            saveStickerLayout();
            console.log('Auto-saved after custom sticker removal');
        }, 100);
    });
    stickerElement.appendChild(removeBtn);
    
    // Show remove button on hover
    stickerElement.addEventListener('mouseenter', () => {
        removeBtn.style.display = 'flex';
        // Add subtle hover effect for transparent custom stickers
        if (!stickerSystemActive) {
            // Only add scale without affecting existing transforms
            stickerElement.style.transform = (stickerElement.style.transform || '') + ' scale(1.05)';
            img.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        }
    });
    stickerElement.addEventListener('mouseleave', () => {
        removeBtn.style.display = 'none';
        // Reset hover effect for transparent custom stickers
        if (!stickerSystemActive) {
            // Remove only scale but preserve original transform
            const currentTransform = stickerElement.style.transform || '';
            const transformWithoutScale = currentTransform.replace(/\s*scale\([^)]*\)\s*/g, '').trim();
            stickerElement.style.transform = transformWithoutScale;
            img.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
        }
    });

    addStickerDragHandlers(stickerElement);
    
    // Initially set to static mode since panel starts closed
    if (!stickerSystemActive) {
        stickerElement.classList.add('static');
    }
    
    stickerCanvas.appendChild(stickerElement);
    console.log('Custom sticker added to canvas. Canvas children count:', stickerCanvas.children.length);
    
    // Auto-save after placing custom sticker
    setTimeout(() => {
        saveStickerLayout();
        console.log('Auto-saved after placing custom sticker');
    }, 100);
    
    // Remove 'new' class after animation
    setTimeout(() => {
        stickerElement.classList.remove('new');
        console.log('Custom sticker animation class removed');
    }, 600);
    
    showNotification(`Custom sticker "${customSticker.name}" placed!`, 'success');
}

// Show sticker edit modal
function showStickerEditModal(sticker) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.sticker-edit-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'sticker-edit-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--bg-secondary, #2a2a2a);
        border: 2px solid rgba(103, 197, 255, 0.8);
        border-radius: 16px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        color: white;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Edit Sticker';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #67c5ff;
        text-align: center;
        font-size: 24px;
    `;
    
    // Size controls
    const sizeSection = document.createElement('div');
    sizeSection.style.cssText = 'margin-bottom: 20px;';
    
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Size (px):';
    sizeLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: #fff;
    `;
    
    const currentSize = parseInt(sticker.style.width) || 100;
    
    const sizeInput = document.createElement('input');
    sizeInput.type = 'number';
    sizeInput.value = currentSize;
    sizeInput.min = '50';
    sizeInput.max = '300';
    sizeInput.style.cssText = `
        width: 100%;
        padding: 8px;
        border: 2px solid #444;
        border-radius: 8px;
        background: #1a1a1a;
        color: white;
        font-size: 16px;
        margin-bottom: 8px;
    `;
    
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '50';
    sizeSlider.max = '300';
    sizeSlider.value = currentSize;
    sizeSlider.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
    `;
    
    // Mirror controls
    const mirrorSection = document.createElement('div');
    mirrorSection.style.cssText = 'margin-bottom: 20px;';
    
    const mirrorLabel = document.createElement('label');
    mirrorLabel.textContent = 'Mirror:';
    mirrorLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: #fff;
    `;
    
    const mirrorButtons = document.createElement('div');
    mirrorButtons.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: center;
    `;
    
    const mirrorHBtn = document.createElement('button');
    mirrorHBtn.textContent = '↔️ Horizontal';
    mirrorHBtn.style.cssText = `
        background: #67c5ff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-size: 14px;
    `;
    
    const mirrorVBtn = document.createElement('button');
    mirrorVBtn.textContent = '↕️ Vertical';
    mirrorVBtn.style.cssText = `
        background: #67c5ff;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-size: 14px;
    `;
    
    const resetMirrorBtn = document.createElement('button');
    resetMirrorBtn.textContent = '🔄 Reset';
    resetMirrorBtn.style.cssText = `
        background: #666;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-size: 14px;
    `;
    
    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
    `;
    
    const applyBtn = document.createElement('button');
    applyBtn.textContent = '✅ Apply';
    applyBtn.style.cssText = `
        background: #10b981;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌ Cancel';
    cancelBtn.style.cssText = `
        background: #ef4444;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
    `;
    
    // Event listeners
    let currentTransform = sticker.style.transform || '';
    let mirrorH = false;
    let mirrorV = false;
    
    // Parse existing transform
    if (currentTransform.includes('scaleX(-1)')) mirrorH = true;
    if (currentTransform.includes('scaleY(-1)')) mirrorV = true;
    
    sizeInput.addEventListener('input', () => {
        const value = Math.max(50, Math.min(300, parseInt(sizeInput.value) || 50));
        sizeSlider.value = value;
        sticker.style.width = value + 'px';
        sticker.style.height = value + 'px';
        
        // Update font size for emoji stickers
        const fontSize = Math.max(1.5, Math.min(8, (value / 100) * 3));
        const stickerContent = sticker.querySelector('div');
        if (stickerContent && !sticker.querySelector('img')) {
            stickerContent.style.fontSize = fontSize + 'rem';
        }
    });
    
    sizeSlider.addEventListener('input', () => {
        sizeInput.value = sizeSlider.value;
        sizeInput.dispatchEvent(new Event('input'));
    });
    
    mirrorHBtn.addEventListener('click', () => {
        mirrorH = !mirrorH;
        updateMirror();
        mirrorHBtn.style.background = mirrorH ? '#34d399' : '#67c5ff';
    });
    
    mirrorVBtn.addEventListener('click', () => {
        mirrorV = !mirrorV;
        updateMirror();
        mirrorVBtn.style.background = mirrorV ? '#34d399' : '#67c5ff';
    });
    
    resetMirrorBtn.addEventListener('click', () => {
        mirrorH = false;
        mirrorV = false;
        updateMirror();
        mirrorHBtn.style.background = '#67c5ff';
        mirrorVBtn.style.background = '#67c5ff';
    });
    
    function updateMirror() {
        let transform = '';
        if (mirrorH) transform += 'scaleX(-1) ';
        if (mirrorV) transform += 'scaleY(-1) ';
        sticker.style.transform = transform;
    }
    
    applyBtn.addEventListener('click', () => {
        modal.remove();
        sticker.classList.remove('editing');
        const editPanel = sticker.querySelector('.sticker-edit-panel');
        if (editPanel) editPanel.style.display = 'none';
        showNotification('Sticker updated!', 'success');
        // Auto-save after editing
        setTimeout(() => {
            saveStickerLayout();
            console.log('Auto-saved after sticker edit');
        }, 100);
    });
    
    cancelBtn.addEventListener('click', () => {
        // Reset to original values
        sticker.style.width = currentSize + 'px';
        sticker.style.height = currentSize + 'px';
        sticker.style.transform = currentTransform;
        
        modal.remove();
        sticker.classList.remove('editing');
        const editPanel = sticker.querySelector('.sticker-edit-panel');
        if (editPanel) editPanel.style.display = 'none';
    });
    
    // Set initial button states
    mirrorHBtn.style.background = mirrorH ? '#34d399' : '#67c5ff';
    mirrorVBtn.style.background = mirrorV ? '#34d399' : '#67c5ff';
    
    // Assemble modal
    sizeSection.appendChild(sizeLabel);
    sizeSection.appendChild(sizeInput);
    sizeSection.appendChild(sizeSlider);
    
    mirrorButtons.appendChild(mirrorHBtn);
    mirrorButtons.appendChild(mirrorVBtn);
    mirrorButtons.appendChild(resetMirrorBtn);
    mirrorSection.appendChild(mirrorLabel);
    mirrorSection.appendChild(mirrorButtons);
    
    actionButtons.appendChild(applyBtn);
    actionButtons.appendChild(cancelBtn);
    
    modalContent.appendChild(title);
    modalContent.appendChild(sizeSection);
    modalContent.appendChild(mirrorSection);
    modalContent.appendChild(actionButtons);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelBtn.click();
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;

    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show sticker context menu
function showStickerContextMenu(e, sticker) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.sticker-context-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.className = 'sticker-context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: var(--bg-secondary, #2a2a2a);
        border: 1px solid var(--border-color, #444);
        border-radius: 8px;
        padding: 8px 0;
        z-index: 10002;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        min-width: 150px;
    `;
    
    const options = [
        { icon: '📏', text: 'Resize', action: () => resizeSticker(sticker) },
        { icon: '🎨', text: 'Change Style', action: () => changeStickerStyle(sticker) },
        { icon: '📋', text: 'Duplicate', action: () => duplicateSticker(sticker) },
        { icon: '🗑️', text: 'Remove', action: () => sticker.remove() }
    ];
    
    options.forEach(option => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-primary, #ffffff);
            font-size: 14px;
        `;
        item.innerHTML = `<span>${option.icon}</span><span>${option.text}</span>`;
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--bg-hover, #444)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', () => {
            option.action();
            menu.remove();
        });
        
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
}

// Resize sticker
function resizeSticker(sticker) {
    const currentSize = sticker.style.fontSize || '2rem';
    const sizes = ['1rem', '1.5rem', '2rem', '3rem', '4rem'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    sticker.style.fontSize = sizes[nextIndex];
    showNotification(`Sticker resized to ${sizes[nextIndex]}`, 'success');
}

// Change sticker style
function changeStickerStyle(sticker) {
    const styles = [
        { filter: 'none', name: 'Normal' },
        { filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))', name: 'Shadow' },
        { filter: 'brightness(1.5)', name: 'Bright' },
        { filter: 'sepia(100%)', name: 'Sepia' },
        { filter: 'hue-rotate(180deg)', name: 'Color Shift' }
    ];
    
    const currentFilter = sticker.style.filter || 'none';
    const currentIndex = styles.findIndex(s => s.filter === currentFilter);
    const nextIndex = (currentIndex + 1) % styles.length;
    
    sticker.style.filter = styles[nextIndex].filter;
    showNotification(`Style changed to ${styles[nextIndex].name}`, 'success');
}

// Duplicate sticker
function duplicateSticker(sticker) {
    const newSticker = sticker.cloneNode(true);
    newSticker.style.left = (parseInt(sticker.style.left) + 20) + 'px';
    newSticker.style.top = (parseInt(sticker.style.top) + 20) + 'px';
    
    // Re-add event handlers to the new sticker
    addStickerDragHandlers(newSticker);
    
    document.getElementById('stickerCanvas').appendChild(newSticker);
    showNotification('Sticker duplicated!', 'success');
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 DOM loaded, initializing sticker system...');
    
    // Add a small delay to ensure all elements are ready
    setTimeout(() => {
        initializeStickerSystem();
    }, 100);
});

// Also try to initialize on window load as backup
window.addEventListener('load', () => {
    if (!stickerSystemActive) {
        console.log('🎨 Window loaded, trying backup initialization...');
        setTimeout(() => {
            initializeStickerSystem();
        }, 200);
    }
});

// Handle window resize to hide stickers on mobile
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    const stickerCanvas = document.getElementById('stickerCanvas');
    const stickerSidebar = document.getElementById('stickerSidebar');
    const maximizeStickerPanel = document.getElementById('maximizeStickerPanel');
    
    if (isMobile) {
        // Hide sticker system on mobile
        if (stickerCanvas) stickerCanvas.style.display = 'none';
        if (stickerSidebar) {
            stickerSidebar.classList.remove('active');
            stickerSidebar.style.display = 'none';
        }
        if (maximizeStickerPanel) maximizeStickerPanel.style.display = 'none';
        
        // Deactivate sticker system
        if (stickerSystemActive) {
            stickerSystemActive = false;
            toggleStickerDragging(false);
        }
        
        console.log('📱 Switched to mobile view - stickers hidden');
    } else {
        // Show sticker system on desktop
        if (stickerCanvas) stickerCanvas.style.display = '';
        if (stickerSidebar) stickerSidebar.style.display = '';
        if (maximizeStickerPanel) maximizeStickerPanel.style.display = '';
        
        console.log('🖥️ Switched to desktop view - stickers available');
    }
});

// Global click handler to close edit panels
document.addEventListener('click', (e) => {
    if (stickerSystemActive && !e.target.closest('.placed-sticker') && !e.target.closest('.sticker-edit-panel')) {
        // Close all edit panels
        const allPanels = document.querySelectorAll('.sticker-edit-panel');
        allPanels.forEach(panel => panel.style.display = 'none');
        
        // Remove editing class from all stickers
        const allStickers = document.querySelectorAll('.placed-sticker');
        allStickers.forEach(sticker => sticker.classList.remove('editing'));
    }
});

// ===== SIDEBAR POSITION TOGGLE =====

function toggleSidebarPosition() {
    const stickerSidebar = document.getElementById('stickerSidebar');
    const positionToggleBtn = document.getElementById('positionToggleBtn');
    
    if (!stickerSidebar || !positionToggleBtn) return;
    
    const isLeftSide = stickerSidebar.classList.contains('left-side');
    
    // Add smooth transition effect
    stickerSidebar.style.transition = 'all 0.3s ease';
    
    if (isLeftSide) {
        // Move to right side
        stickerSidebar.classList.remove('left-side');
        positionToggleBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        positionToggleBtn.title = 'Move to left side';
        
        // Save position preference
        localStorage.setItem('stickerSidebarPosition', 'right');
    } else {
        // Move to left side
        stickerSidebar.classList.add('left-side');
        positionToggleBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        positionToggleBtn.title = 'Move to right side';
        
        // Save position preference
        localStorage.setItem('stickerSidebarPosition', 'left');
    }
    
    // Add visual feedback
    positionToggleBtn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        positionToggleBtn.style.transform = 'scale(1)';
    }, 150);
    
    console.log('🔄 Sticker sidebar moved to:', isLeftSide ? 'right' : 'left');
}

// Function to restore saved sidebar position
function restoreSidebarPosition() {
    const savedPosition = localStorage.getItem('stickerSidebarPosition') || 'right';
    const stickerSidebar = document.getElementById('stickerSidebar');
    const positionToggleBtn = document.getElementById('positionToggleBtn');
    
    if (!stickerSidebar || !positionToggleBtn) return;
    
    if (savedPosition === 'left') {
        stickerSidebar.classList.add('left-side');
        positionToggleBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        positionToggleBtn.title = 'Move to right side';
    } else {
        stickerSidebar.classList.remove('left-side');
        positionToggleBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        positionToggleBtn.title = 'Move to left side';
    }
    
    console.log('📍 Restored sticker sidebar position:', savedPosition);
}

// Global helper functions for testing
window.testStickerSystem = {
    checkMaximizeMode: () => {
        const isMaximized = document.body.classList.contains('maximize-mode') || 
                           document.documentElement.classList.contains('maximize-mode') ||
                           document.querySelector('.maximize-mode') !== null;
        console.log('Current maximize status:', isMaximized);
        console.log('Body classes:', document.body.className);
        console.log('HTML classes:', document.documentElement.className);
        console.log('Chat container classes:', document.querySelector('.chat-container')?.className);
        console.log('Main content classes:', document.querySelector('.main-content')?.className);
        return isMaximized;
    },
    forceMaximizeMode: () => {
        document.body.classList.add('maximize-mode');
        console.log('Forced maximize mode - body class added');
        const btn = document.getElementById('stickerToggle');
        if (btn) btn.style.display = 'inline-flex';
    },
    forceNormalMode: () => {
        document.body.classList.remove('maximize-mode');
        document.documentElement.classList.remove('maximize-mode');
        console.log('Forced normal mode - maximize classes removed');
        const btn = document.getElementById('stickerToggle');
        if (btn) btn.style.display = 'none';
    },
    toggleStickerButton: (show) => {
        const btn = document.getElementById('stickerToggle');
        if (btn) {
            btn.style.display = show ? 'inline-flex' : 'none';
            console.log('Sticker button display set to:', btn.style.display);
        }
    },
    getStickerSystemState: () => {
        return {
            active: stickerSystemActive,
            button: document.getElementById('stickerToggle')?.style.display,
            stickerCount: document.querySelectorAll('.placed-sticker').length,
            maximizeMode: window.testStickerSystem.checkMaximizeMode()
        };
    }
};

// Expose global sticker system toggle function for chat interface
window.toggleStickerSystem = function() {
    console.log('🎨 Global toggleStickerSystem called');
    
    const stickerSidebar = document.getElementById('stickerSidebar');
    stickerSystemActive = !stickerSystemActive;
    
    if (stickerSidebar) {
        if (stickerSystemActive) {
            stickerSidebar.classList.add('active');
            console.log('🎨 Sticker sidebar opened from global function');
        } else {
            stickerSidebar.classList.remove('active');
            console.log('🔒 Sticker sidebar closed from global function');
        }
    } else {
        console.error('❌ stickerSidebar not found in global function!');
    }
    
    // Enable/disable sticker dragging
    if (typeof toggleStickerDragging === 'function') {
        toggleStickerDragging(stickerSystemActive);
    }
    console.log('🎨 Sticker panel toggled from global function:', stickerSystemActive ? 'opened' : 'closed');
};
