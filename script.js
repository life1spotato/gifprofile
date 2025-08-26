import { parseGIF, decompressFrames } from "https://esm.sh/gifuct-js@2.1.2";

const fileInput = document.getElementById('fileInput');
const gifPreview = document.getElementById('gifPreview');
const overlayMask = document.getElementById('overlayMask');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const previewOuterContainer = document.querySelector('.preview-outer-container');
const previewContainer = document.querySelector('.preview-container');
const emptyStateText = document.querySelector('.empty-state-text');

const sizeSlider = document.getElementById('sizeSlider');
const xSlider = document.getElementById('xSlider');
const ySlider = document.getElementById('ySlider');

const borderColorPicker1 = document.getElementById('borderColorPicker1');
const borderThicknessSlider1 = document.getElementById('borderThicknessSlider1');

const sizeValueSpan = document.getElementById('sizeValue');
const xValueSpan = document.getElementById('xValue');
const yValueSpan = document.getElementById('yValue');
const borderThicknessValue1Span = document.getElementById('borderThicknessValue1');

let gifFrames = [];
let gifWidth = 0;
let gifHeight = 0;
let originalFileName = "";
let isDragging = false;
let dragStartX, dragStartY;
let oldSizeValue = 100;

// 초기 빈 상태 설정
gifPreview.style.display = 'none';
overlayMask.style.display = 'none';
emptyStateText.style.display = 'block';

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.includes('gif')) {
        alert("GIF 파일만 업로드 가능합니다.");
        gifPreview.src = '';
        gifPreview.style.display = 'none';
        overlayMask.style.display = 'none';
        emptyStateText.style.display = 'block';
        saveBtn.disabled = true;
        return;
    }

    // 원본 파일명 저장
    const fileName = file.name;
    const dotIndex = fileName.lastIndexOf('.');
    originalFileName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    
    const buffer = await file.arrayBuffer();
    const parsedGif = parseGIF(buffer);
    const frames = decompressFrames(parsedGif, true);

    gifFrames = frames;
    gifWidth = parsedGif.lsd.width;
    gifHeight = parsedGif.lsd.height;

    const gifBlob = new Blob([buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(gifBlob);
    
    gifPreview.src = url;
    gifPreview.style.display = 'block';
    overlayMask.style.display = 'block';
    emptyStateText.style.display = 'none';

    // 미리보기 컨테이너 크기를 원본 GIF 크기와 동일하게 설정
    previewContainer.style.width = `${gifWidth}px`;
    previewContainer.style.height = `${gifHeight}px`;

    resetSliders();
    updateOverlay();
    saveBtn.disabled = false;
});

const allSliders = [sizeSlider, xSlider, ySlider, borderThicknessSlider1, borderColorPicker1];

allSliders.forEach(slider => {
    slider.addEventListener('input', updateOverlay);
});

resetBtn.addEventListener('click', () => {
    if (gifFrames.length === 0) return;
    resetSliders();
    updateOverlay();
});

function resetSliders() {
    xSlider.value = 50;
    ySlider.value = 50;
    sizeSlider.value = 100;
    borderColorPicker1.value = '#9F9FDF';
    borderThicknessSlider1.value = 0;
    oldSizeValue = 100;

    sizeValueSpan.textContent = 100;
    xValueSpan.textContent = 50;
    yValueSpan.textContent = 50;
    borderThicknessValue1Span.textContent = 0;
}

function updateOverlay() {
    if (gifFrames.length === 0) return;

    const diameter = Math.min(gifWidth, gifHeight) * (sizeSlider.value / 100);
    const radius = diameter / 2;
    
    const circleX = gifWidth * (xSlider.value / 100);
    const circleY = gifHeight * (ySlider.value / 100);

    const xPos = circleX - radius;
    const yPos = circleY - radius;

    const borderWidth1 = parseInt(borderThicknessSlider1.value);
    const borderColor1 = borderColorPicker1.value;

    overlayMask.style.width = `${diameter}px`;
    overlayMask.style.height = `${diameter}px`;
    overlayMask.style.left = `${xPos}px`;
    overlayMask.style.top = `${yPos}px`;
    
    overlayMask.style.border = `${borderWidth1}px solid ${borderColor1}`;
    overlayMask.style.boxShadow = `0 0 0 9999px rgba(0, 0, 0, 1)`;

    sizeValueSpan.textContent = sizeSlider.value;
    xValueSpan.textContent = xSlider.value;
    yValueSpan.textContent = ySlider.value;
    borderThicknessValue1Span.textContent = borderWidth1;
}

// 마우스 드래그 이벤트
previewContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gifFrames.length === 0) return;
    
    isDragging = true;
    const previewRect = previewContainer.getBoundingClientRect();
    dragStartX = e.clientX - previewRect.left;
    dragStartY = e.clientY - previewRect.top;
    
    document.body.style.userSelect = 'none';
    previewContainer.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || gifFrames.length === 0) return;
    
    const previewRect = previewContainer.getBoundingClientRect();
    const currentMouseX = e.clientX - previewRect.left;
    const currentMouseY = e.clientY - previewRect.top;

    const dx = currentMouseX - dragStartX;
    const dy = currentMouseY - dragStartY;

    const currentX = gifWidth * (xSlider.value / 100);
    const currentY = gifHeight * (ySlider.value / 100);

    let newCircleX = currentX + dx;
    let newCircleY = currentY + dy;

    const diameter = Math.min(gifWidth, gifHeight) * (sizeSlider.value / 100);
    const radius = diameter / 2;

    newCircleX = Math.max(radius, Math.min(gifWidth - radius, newCircleX));
    newCircleY = Math.max(radius, Math.min(gifHeight - radius, newCircleY));

    xSlider.value = Math.round((newCircleX / gifWidth) * 100);
    ySlider.value = Math.round((newCircleY / gifHeight) * 100);

    dragStartX = currentMouseX;
    dragStartY = currentMouseY;

    updateOverlay();
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = 'auto';
    previewContainer.style.cursor = 'grab';
});

// 마우스 휠 이벤트
previewContainer.addEventListener('wheel', (e) => {
    if (gifFrames.length === 0) return;
    e.preventDefault();

    const oldSizeValue = parseInt(sizeSlider.value);
    let newSizeValue = oldSizeValue;
    const step = 2;

    if (e.deltaY < 0) {
        newSizeValue -= step;
    } else {
        newSizeValue += step;
    }
    
    newSizeValue = Math.max(0, Math.min(100, newSizeValue));
    
    if (newSizeValue === oldSizeValue) {
        return;
    }

    const previewRect = previewContainer.getBoundingClientRect();
    const mouseX = e.clientX - previewRect.left;
    const mouseY = e.clientY - previewRect.top;

    const currentCircleX = gifWidth * (xSlider.value / 100);
    const currentCircleY = gifHeight * (ySlider.value / 100);

    const oldRadius = Math.min(gifWidth, gifHeight) * (oldSizeValue / 100) / 2;
    const newRadius = Math.min(gifWidth, gifHeight) * (newSizeValue / 100) / 2;

    const scaleFactor = newRadius / oldRadius;

    let newCircleX = mouseX + (currentCircleX - mouseX) * scaleFactor;
    let newCircleY = mouseY + (currentCircleY - mouseY) * scaleFactor;

    newCircleX = Math.max(newRadius, Math.min(gifWidth - newRadius, newCircleX));
    newCircleY = Math.max(newRadius, Math.min(gifHeight - newRadius, newCircleY));

    xSlider.value = Math.round((newCircleX / gifWidth) * 100);
    ySlider.value = Math.round((newCircleY / gifHeight) * 100);
    sizeSlider.value = newSizeValue;

    updateOverlay();
});

// GIF 저장 버튼 클릭 이벤트
saveBtn.addEventListener('click', () => {
    if (!gifFrames.length) return alert("GIF를 먼저 업로드하세요.");

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: gifWidth,
        height: gifHeight,
        transparent: 'rgba(0,0,0,0)'
    });
    
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = gifWidth;
    highResCanvas.height = gifHeight;
    const highResCtx = highResCanvas.getContext('2d', { willReadFrequently: true });

    const diameter = Math.min(gifWidth, gifHeight) * (sizeSlider.value / 100);
    const circleX = gifWidth * (xSlider.value / 100);
    const circleY = gifHeight * (ySlider.value / 100);
    
    const borderWidth1 = parseInt(borderThicknessSlider1.value);
    const borderColor1 = borderColorPicker1.value;

    gifFrames.forEach(frame => {
        highResCtx.clearRect(0, 0, highResCanvas.width, highResCanvas.height);
        
        highResCtx.save();
        highResCtx.beginPath();
        highResCtx.arc(circleX, circleY, diameter / 2, 0, Math.PI * 2);
        highResCtx.clip();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frame.dims.width;
        tempCanvas.height = frame.dims.height;
        const tempCtx = tempCanvas.getContext('2d');
        const imageData = new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height);
        tempCtx.putImageData(imageData, 0, 0);
        highResCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        
        highResCtx.restore();

        if (borderWidth1 > 0) {
            highResCtx.save();
            highResCtx.beginPath();
            highResCtx.arc(circleX, circleY, diameter / 2 - (borderWidth1 / 2), 0, Math.PI * 2);
            highResCtx.lineWidth = borderWidth1;
            highResCtx.strokeStyle = borderColor1;
            highResCtx.stroke();
            highResCtx.restore();
        }
        
        gif.addFrame(highResCanvas, {copy: true, delay: frame.delay || 100});
    });

    gif.on('finished', blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${originalFileName}_edit.gif`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    gif.render();
});