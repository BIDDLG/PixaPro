/**
 * PixelLab Pro - Core Logic
 */

let canvas;
let currentScreen = 'splash-screen';
let exportFormat = 'png';
let exportQuality = 1.0;

// Hindi Conversion Maps (Simplified for demo)
const krutiDevMap = {
    'अ': 'v', 'आ': 'vk', 'इ': 'f', 'ई': 'h', 'उ': 'm', 'ऊ': 'mw', 'ए': 's', 'ऐ': 'S', 'ओ': 'vks', 'औ': 'vkS',
    'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?', 'ङ': '³', 'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ञ': '¥',
    'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.', 'त': 'r', 'थ': 'Fk', 'द': 'n', 'ध': 'èk', 'न': 'u',
    'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'Hk', 'म': 'e', 'य': 'string', 'र': 'j', 'ल': 'y', 'व': 'o', 'श': 'string',
    'ष': 'string', 'स': 'l', 'ह': 'g', 'क्ष': 'string', 'त्र': 'string', 'ज्ञ': 'string',
    'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'm', 'ू': 'w', 'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ः': '%', 'ृ': '`', 'ॅ': 'W', 'ॉ': 'kS'
};

// Initialize App
window.onload = () => {
    setTimeout(() => {
        showScreen('home-screen');
    }, 2500);
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        currentScreen = screenId;
        
        // Re-initialize icons for the new screen
        if (window.lucide) {
            lucide.createIcons();
        }
    }
}

function setPreset(w, h, el) {
    document.querySelectorAll('.preset-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('custom-w').value = w;
    document.getElementById('custom-h').value = h;
}

function startEditor() {
    const w = parseInt(document.getElementById('custom-w').value);
    const h = parseInt(document.getElementById('custom-h').value);
    
    showScreen('editor-screen');
    initCanvas(w, h);
}

function initCanvas(w, h) {
    const wrapper = document.getElementById('canvas-wrapper');
    const containerW = wrapper.clientWidth - 40;
    const containerH = wrapper.clientHeight - 40;
    
    const scale = Math.min(containerW / w, containerH / h);
    
    if (canvas) canvas.dispose();
    
    canvas = new fabric.Canvas('main-canvas', {
        width: w,
        height: h,
        backgroundColor: '#ffffff'
    });

    // Handle scaling for display
    const canvasEl = document.querySelector('.canvas-container .canvas-container');
    if (canvasEl) {
        canvasEl.style.transform = `scale(${scale})`;
    }

    // Add initial text
    addText("Double tap to edit");
    
    canvas.on('selection:created', onObjectSelected);
    canvas.on('selection:updated', onObjectSelected);
    canvas.on('selection:cleared', onObjectCleared);
}

function addText(str = "New Text") {
    const text = new fabric.IText(str, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontFamily: 'Inter',
        fontSize: 80,
        fill: '#000000',
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    updateLayerList();
}

function onObjectSelected(e) {
    const obj = e.selected[0];
    if (obj.type === 'i-text') {
        switchTool('text');
    } else if (obj.type === 'image') {
        switchTool('image');
    }
    updateLayerList();
}

function onObjectCleared() {
    updateLayerList();
}

function switchTool(tool) {
    document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.add('hidden'));
    
    const tab = Array.from(document.querySelectorAll('.tool-tab')).find(t => t.innerText.toLowerCase().includes(tool));
    if (tab) tab.classList.add('active');
    
    const panel = document.getElementById(`${tool}-panel`);
    if (panel) panel.classList.remove('hidden');
}

// Hindi Auto-Conversion Logic
function convertToKrutiDev(unicodeText) {
    // This is a simplified placeholder for the complex mapping
    // Real implementation would involve a full character-by-character replacement loop
    let result = unicodeText;
    // Example logic...
    return result; 
}

function handleTextChange(obj) {
    const font = obj.fontFamily;
    const isLegacy = font.toLowerCase().includes('krutidev') || font.toLowerCase().includes('shree');
    
    if (isLegacy) {
        const unicode = obj.text;
        obj.set('text', convertToKrutiDev(unicode));
        canvas.renderAll();
    }
}

// Bottom Sheet Management
function openBottomSheet(id) {
    document.getElementById('sheet-overlay').style.display = 'block';
    document.getElementById(id).classList.add('active');
}

function closeBottomSheet() {
    document.getElementById('sheet-overlay').style.display = 'none';
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
}

// Layer Management
function updateLayerList() {
    const list = document.getElementById('layer-list');
    list.innerHTML = '';
    
    const objects = canvas.getObjects().reverse();
    objects.forEach((obj, index) => {
        const item = document.createElement('div');
        item.className = `layer-item ${canvas.getActiveObject() === obj ? 'active' : ''}`;
        
        let icon = 'type';
        let label = 'Text Layer';
        
        if (obj.type === 'image') { icon = 'image'; label = 'Image Layer'; }
        if (obj.type === 'rect' || obj.type === 'circle') { icon = 'shapes'; label = 'Shape Layer'; }
        
        item.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${label}</span>
            <div style="flex: 1"></div>
            <button onclick="toggleLock(${index})"><i data-lucide="${obj.selectable ? 'unlock' : 'lock'}"></i></button>
        `;
        
        item.onclick = () => {
            canvas.setActiveObject(obj);
            canvas.renderAll();
            updateLayerList();
        };
        
        list.appendChild(item);
    });
    lucide.createIcons();
}

function toggleLayers() {
    document.getElementById('layer-panel').classList.toggle('active');
    updateLayerList();
}

// Export Logic
function showExport() {
    const dataURL = canvas.toDataURL({
        format: exportFormat,
        quality: exportQuality
    });
    
    document.getElementById('export-preview').innerHTML = `<img src="${dataURL}" style="max-width: 100%; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5)">`;
    showScreen('export-screen');
}

function hideExport() {
    showScreen('editor-screen');
}

function saveToGallery() {
    const dataURL = canvas.toDataURL({
        format: exportFormat,
        quality: exportQuality
    });
    
    if (window.Android) {
        window.Android.saveImage(dataURL, `PixelLab_${Date.now()}.${exportFormat}`);
    } else {
        const link = document.createElement('a');
        link.download = `PixelLab_${Date.now()}.${exportFormat}`;
        link.href = dataURL;
        link.click();
    }
}

function shareProject() {
    const dataURL = canvas.toDataURL({ format: 'png' });
    if (window.Android) {
        window.Android.shareImage(dataURL);
    } else {
        alert("Sharing is only available on Android devices.");
    }
}

// Tool Functions
function toggleGrid() {
    document.getElementById('grid-overlay').classList.toggle('grid-visible');
}

function undo() {
    // Simple undo implementation would require a state stack
    console.log("Undo triggered");
}

function redo() {
    console.log("Redo triggered");
}

function confirmExit() {
    document.getElementById('confirm-dialog').style.display = 'flex';
}

function closeDialog() {
    document.getElementById('confirm-dialog').style.display = 'none';
}

function exitEditor() {
    closeDialog();
    showScreen('home-screen');
}

// Image Import
function importImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.scaleToWidth(canvas.width / 2);
                canvas.add(img);
                canvas.centerObject(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                updateLayerList();
            });
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Font Upload
function uploadFont() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Sanitize font name to avoid CSS issues
        const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const reader = new FileReader();
        
        reader.onload = async (f) => {
            const fontDataUrl = f.target.result;
            const fontFace = new FontFace(fontName, `url(${fontDataUrl})`);
            
            try {
                const loadedFace = await fontFace.load();
                document.fonts.add(loadedFace);
                
                // Add to font list in UI
                const fontList = document.getElementById('font-list');
                const fontItem = document.createElement('div');
                fontItem.className = 'font-item';
                fontItem.style.fontFamily = fontName;
                fontItem.innerHTML = `
                    <span>${fontName}</span>
                    <i data-lucide="check" class="hidden"></i>
                `;
                fontItem.onclick = () => applyFont(fontName);
                fontList.prepend(fontItem);
                
                lucide.createIcons();
                alert(`Font "${fontName}" added successfully!`);
            } catch (err) {
                console.error("Font loading failed:", err);
                alert("Failed to load font. Please ensure it's a valid font file (.ttf, .otf, .woff).");
            }
        };
        
        reader.onerror = () => {
            alert("Error reading file. Please try again.");
        };
        
        reader.readAsDataURL(file);
    };
    input.click();
}

function applyFont(fontName) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('fontFamily', fontName);
        canvas.renderAll();
    }
}

// Color Presets
const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#8b5cf6', '#06b6d4'];
const colorGrid = document.getElementById('preset-colors');
if (colorGrid) {
    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.backgroundColor = c;
        div.onclick = () => applyColor(c);
        colorGrid.appendChild(div);
    });
}

function applyColor(color) {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fill', color);
        canvas.renderAll();
    }
}

// Missing Functions
function openGallery() {
    importImage(); // Reuse importImage for gallery access
}

function addSticker() {
    alert("Stickers feature coming soon!");
}

function cropImage() {
    alert("Crop feature coming soon!");
}

function switchColorMode(mode) {
    document.querySelectorAll('.color-tab').forEach(t => t.classList.remove('active'));
    const tab = Array.from(document.querySelectorAll('.color-tab')).find(t => t.innerText.toLowerCase().includes(mode));
    if (tab) tab.classList.add('active');
    
    if (mode === 'gradient') {
        alert("Gradient mode coming soon!");
    }
}

function setExportFormat(format) {
    exportFormat = format;
    document.querySelectorAll('.toggle-btn').forEach(b => {
        if (b.innerText.toLowerCase() === format) b.classList.add('active');
        else if (b.innerText.toLowerCase() !== 'medium' && b.innerText.toLowerCase() !== 'ultra hd') b.classList.remove('active');
    });
    showExport(); // Refresh preview
}

function setExportQuality(quality) {
    if (quality === 'medium') exportQuality = 0.5;
    else exportQuality = 1.0;
    
    document.querySelectorAll('.toggle-btn').forEach(b => {
        if (b.innerText.toLowerCase().includes(quality)) b.classList.add('active');
        else if (b.innerText.toLowerCase() === 'medium' || b.innerText.toLowerCase() === 'ultra hd') b.classList.remove('active');
    });
    showExport(); // Refresh preview
}

function clearCache() {
    if (confirm("Are you sure you want to clear all project data?")) {
        localStorage.clear();
        alert("Cache cleared!");
        location.reload();
    }
}
