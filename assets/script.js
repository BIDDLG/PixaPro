/**
 * PixelLab Pro - Core Logic
 */

let canvas;
let currentScreen = 'splash-screen';
let exportFormat = 'png';
let exportQuality = 1.0;
let undoStack = [];
let redoStack = [];
let isStateChanging = false;

// Hindi Conversion Maps (Simplified for demo)
const krutiDevMap = {
    'अ': 'v', 'आ': 'vk', 'इ': 'f', 'ई': 'h', 'उ': 'm', 'ऊ': 'mw', 'ए': 's', 'ऐ': 'S', 'ओ': 'vks', 'औ': 'vkS',
    'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?', 'ङ': '³', 'च': 'p', 'छ': 'N', 'ज': 't', 'झ': '>', 'ञ': '¥',
    'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<', 'ण': '.', 'त': 'r', 'थ': 'Fk', 'द': 'n', 'ध': 'èk', 'न': 'u',
    'प': 'i', 'फ': 'Q', 'ब': 'c', 'भ': 'Hk', 'म': 'e', 'य': 'string', 'र': 'j', 'ल': 'y', 'व': 'o', 'श': 'string',
    'ष': 'string', 'स': 'l', 'ह': 'g', 'क्ष': 'string', 'त्र': 'string', 'ज्ञ': 'string',
    'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'm', 'ू': 'w', 'े': 's', 'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ः': '%', 'ृ': '`', 'ॅ': 'W', 'ॉ': 'kS'
};

const defaultFonts = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Bebas Neue'];
const hindiUnicodeFonts = ['Lohit Hindi', 'Hind', 'Rajdhani'];
const legacyFonts = ['Kruti Dev 010', 'Shree Hindi 0800'];
const gradients = [
    'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    'linear-gradient(135deg, #f43f5e, #fb923c)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #34d399, #3b82f6)'
];

// Initialize App
window.onload = () => {
    populateFonts();
    loadRecentProjects();
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
    
    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);
    canvas.on('object:removed', saveState);
    canvas.on('text:changed', (e) => {
        handleTextChange(e.target);
        saveState();
    });

    saveState();
}

function saveState() {
    if (isStateChanging) return;
    const json = JSON.stringify(canvas.toJSON());
    undoStack.push(json);
    if (undoStack.length > 20) undoStack.shift();
    redoStack = [];
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
    let result = "";
    for (let i = 0; i < unicodeText.length; i++) {
        const char = unicodeText[i];
        result += krutiDevMap[char] || char;
    }
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

function toggleLock(index) {
    const objects = canvas.getObjects().reverse();
    const obj = objects[index];
    if (obj) {
        obj.selectable = !obj.selectable;
        obj.evented = obj.selectable;
        canvas.discardActiveObject();
        canvas.renderAll();
        updateLayerList();
    }
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
    
    saveProject(); // Also save to recent projects

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
    if (undoStack.length <= 1) return;
    isStateChanging = true;
    redoStack.push(undoStack.pop());
    const state = undoStack[undoStack.length - 1];
    canvas.loadFromJSON(state, () => {
        canvas.renderAll();
        isStateChanging = false;
        updateLayerList();
    });
}

function redo() {
    if (redoStack.length === 0) return;
    isStateChanging = true;
    const state = redoStack.pop();
    undoStack.push(state);
    canvas.loadFromJSON(state, () => {
        canvas.renderAll();
        isStateChanging = false;
        updateLayerList();
    });
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

function populateFonts(category = 'Default') {
    document.querySelectorAll('.cat-btn').forEach(b => {
        if (b.innerText === category) b.classList.add('active');
        else b.classList.remove('active');
    });

    const fontList = document.getElementById('font-list');
    fontList.innerHTML = '';
    
    let fonts = [];
    if (category === 'Default') fonts = defaultFonts;
    else if (category === 'Hindi (Unicode)') fonts = hindiUnicodeFonts;
    else if (category === 'Legacy (KrutiDev)') fonts = legacyFonts;
    else if (category === 'My Fonts') {
        // Custom fonts handled by uploadFont
        return;
    }
    
    fonts.forEach(f => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.style.fontFamily = f;
        item.innerHTML = `
            <span>${f}</span>
            <i data-lucide="check" class="hidden"></i>
        `;
        item.onclick = () => applyFont(f);
        fontList.appendChild(item);
    });
    lucide.createIcons();
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
    openBottomSheet('stickers-sheet');
}

function addStickerAsset(sticker) {
    const text = new fabric.IText(sticker, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: 120,
        originX: 'center',
        originY: 'center'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    closeBottomSheet();
    saveState();
}

function applyStyle(style) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        if (style === 'bold') {
            obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        } else if (style === 'italic') {
            obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        } else if (style === 'underline') {
            obj.set('underline', !obj.underline);
        }
        canvas.renderAll();
        saveState();
    }
}

function updateFontSize(size) {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.set('fontSize', parseInt(size));
        canvas.renderAll();
        saveState();
    }
}

function toggleEffect(effect, el) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        if (el) el.classList.toggle('active');
        if (effect === 'shadow') {
            if (obj.shadow) {
                obj.set('shadow', null);
            } else {
                obj.set('shadow', new fabric.Shadow({
                    color: 'rgba(0,0,0,0.5)',
                    blur: 10,
                    offsetX: 5,
                    offsetY: 5
                }));
            }
        } else if (effect === 'stroke') {
            if (obj.stroke) {
                obj.set('stroke', null);
                obj.set('strokeWidth', 0);
            } else {
                obj.set('stroke', '#000000');
                obj.set('strokeWidth', 2);
            }
        } else if (effect === 'bg') {
            if (obj.textBackgroundColor) {
                obj.set('textBackgroundColor', null);
            } else {
                obj.set('textBackgroundColor', '#ffff00');
            }
        }
        canvas.renderAll();
        saveState();
    }
}

function switchColorMode(mode) {
    document.querySelectorAll('.color-tab').forEach(t => t.classList.remove('active'));
    const tab = Array.from(document.querySelectorAll('.color-tab')).find(t => t.innerText.toLowerCase().includes(mode));
    if (tab) tab.classList.add('active');
    
    const colorGrid = document.getElementById('preset-colors');
    colorGrid.innerHTML = '';

    if (mode === 'solid') {
        colors.forEach(c => {
            const div = document.createElement('div');
            div.className = 'color-swatch';
            div.style.backgroundColor = c;
            div.onclick = () => applyColor(c);
            colorGrid.appendChild(div);
        });
    } else {
        gradients.forEach(g => {
            const div = document.createElement('div');
            div.className = 'color-swatch';
            div.style.background = g;
            div.onclick = () => applyGradient(g);
            colorGrid.appendChild(div);
        });
    }
}

function applyGradient(gradient) {
    const obj = canvas.getActiveObject();
    if (obj) {
        // Fabric.js gradient implementation
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Extract colors from linear-gradient string (simplified)
        const matches = gradient.match(/#[a-fA-F0-9]{6}/g);
        if (matches && matches.length >= 2) {
            const grad = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: obj.width, y2: obj.height },
                colorStops: [
                    { offset: 0, color: matches[0] },
                    { offset: 1, color: matches[1] }
                ]
            });
            obj.set('fill', grad);
            canvas.renderAll();
            saveState();
        }
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
        localStorage.removeItem('pixellab_projects');
        alert("Cache cleared!");
        location.reload();
    }
}

function saveProject() {
    const projects = JSON.parse(localStorage.getItem('pixellab_projects') || '[]');
    const newProject = {
        id: Date.now(),
        name: `Project ${projects.length + 1}`,
        data: canvas.toJSON(),
        thumb: canvas.toDataURL({ format: 'png', quality: 0.1 }),
        date: new Date().toLocaleDateString()
    };
    projects.unshift(newProject);
    if (projects.length > 10) projects.pop();
    localStorage.setItem('pixellab_projects', JSON.stringify(projects));
    loadRecentProjects();
}

function loadRecentProjects() {
    const list = document.getElementById('recent-list');
    if (!list) return;
    
    const projects = JSON.parse(localStorage.getItem('pixellab_projects') || '[]');
    if (projects.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.2; margin-bottom: 15px;"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.7.9H18a2 2 0 0 1 2 2v2"/></svg>
                <p>No projects yet</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = '';
    projects.forEach(p => {
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <div class="project-thumb">
                <img src="${p.thumb}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="project-info">
                <h5>${p.name}</h5>
                <p>${p.date}</p>
            </div>
        `;
        item.onclick = () => loadProject(p);
        list.appendChild(item);
    });
}

function loadProject(project) {
    showScreen('editor-screen');
    const w = project.data.width || 1080;
    const h = project.data.height || 1080;
    
    initCanvas(w, h);
    isStateChanging = true;
    canvas.loadFromJSON(project.data, () => {
        canvas.renderAll();
        isStateChanging = false;
        updateLayerList();
    });
}
