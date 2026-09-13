import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sun,
  Contrast,
  Sliders,
  Ruler,
  Eye,
  Trash2,
  Check,
  Sparkles,
  Download,
  FileImage,
  Layers,
} from 'lucide-react';
import { AttendanceRecord } from '../types';

export type XrayPresetType = 'normal' | 'infiltrat' | 'kardiomegali' | 'efusi';

interface ChestXrayViewerProps {
  patient: AttendanceRecord;
  photoUrl: string | null;
  photoName: string;
  projection?: string;
  onPhotoChange: (url: string | null, name: string) => void;
  onApplyPresetFindings?: (preset: XrayPresetType) => void;
  onNotify: (msg: string) => void;
}

export const ChestXrayViewer: React.FC<ChestXrayViewerProps> = ({
  patient,
  photoUrl,
  photoName,
  projection = 'PA Erektil (Thorax)',
  onPhotoChange,
  onApplyPresetFindings,
  onNotify,
}) => {
  const [activePreset, setActivePreset] = useState<XrayPresetType>('normal');
  const [zoom, setZoom] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [showCtrRuler, setShowCtrRuler] = useState<boolean>(false);
  const [showPatientInfo, setShowPatientInfo] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default to built-in sample radiograph if no custom photo uploaded
  const isCustomUpload = Boolean(photoUrl && !photoUrl.startsWith('preset:'));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.dcm')) {
      onNotify('Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onPhotoChange(dataUrl, file.name);
      onNotify(`Foto rontgen "${file.name}" berhasil diunggah!`);
      // Reset adjustments
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotify('Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onPhotoChange(dataUrl, file.name);
      onNotify(`Foto rontgen "${file.name}" berhasil diunggah via Drag & Drop!`);
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (type: XrayPresetType) => {
    setActivePreset(type);
    const names: Record<XrayPresetType, string> = {
      normal: 'Thorax_PA_Normal_Simulasi.dcm',
      infiltrat: 'Thorax_PA_Infiltrat_Apeks.dcm',
      kardiomegali: 'Thorax_PA_Kardiomegali_CTR56.dcm',
      efusi: 'Thorax_PA_Efusi_Pleura_Dextra.dcm',
    };
    onPhotoChange(`preset:${type}`, names[type]);
    onNotify(`Foto Radiograf simulasi "${type.toUpperCase()}" dimuat.`);
  };

  const handleResetAdjustments = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setIsInverted(false);
    setPanOffset({ x: 0, y: 0 });
    onNotify('Pengaturan tampilan rontgen di-reset.');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownloadImage = () => {
    if (photoUrl && isCustomUpload) {
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = photoName || `Rontgen_${patient.mcuNo}.jpg`;
      a.click();
    } else {
      onNotify('Mengekspor gambar radiografi standar...');
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rontgen_${activePreset}_${patient.mcuNo}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // CTR calculation parameters based on active status
  const ctrData = {
    normal: { a: 4.2, b: 8.3, c: 28.0, ctr: 44.6, status: 'CTR 45% (Normal < 50%)' },
    infiltrat: { a: 4.2, b: 8.5, c: 28.0, ctr: 45.3, status: 'CTR 45% (Normal < 50%)' },
    kardiomegali: { a: 5.4, b: 10.3, c: 28.0, ctr: 56.1, status: 'CTR 56% (Kardiomegali > 50%)' },
    efusi: { a: 4.5, b: 8.8, c: 27.8, ctr: 47.8, status: 'CTR 48% (Normal < 50%)' },
  }[activePreset];

  return (
    <div className="space-y-4">
      {/* Viewer Container */}
      <div
        className={`relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-black flex flex-col' : ''
        }`}
      >
        {/* Radiologist Top Lightbox Bar */}
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-wide flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-blue-400" />
              {isCustomUpload ? photoName : `Simulasi: ${photoName || 'Thorax_PA_Normal.dcm'}`}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
              {projection}
            </span>
            {isCustomUpload && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                Foto Pasien Asli
              </span>
            )}
          </div>

          {/* Quick Adjustment Controls */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.2).toFixed(1))))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(2.8, Number((prev + 0.2).toFixed(1))))}
                className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Invert Film (Negative) */}
            <button
              type="button"
              onClick={() => setIsInverted((prev) => !prev)}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isInverted
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Invert Warna Film (Mode Negatif/Positif)"
            >
              <Contrast className="w-3.5 h-3.5" />
              {isInverted ? 'Positif' : 'Invert (Negatif)'}
            </button>

            {/* CTR Ruler Toggle */}
            <button
              type="button"
              onClick={() => setShowCtrRuler((prev) => !prev)}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showCtrRuler
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Garis Ukur CTR (Cardiothoracic Ratio)"
            >
              <Ruler className="w-3.5 h-3.5" />
              Garis CTR
            </button>

            {/* Toggle Patient Overlay */}
            <button
              type="button"
              onClick={() => setShowPatientInfo((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                showPatientInfo
                  ? 'bg-slate-700 text-blue-300 border-slate-600'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="Tampilkan / Sembunyikan Info Pasien"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetAdjustments}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Reset Zoom & Efek"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Unduh Citra Rontgen"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh PACS'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Sliders Drawer */}
        <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center gap-5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">Brightness:</span>
            <input
              type="range"
              min="60"
              max="160"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="font-mono text-[10px] text-slate-400 w-8">{brightness}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Contrast className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Contrast:</span>
            <input
              type="range"
              min="60"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="font-mono text-[10px] text-slate-400 w-8">{contrast}%</span>
          </div>

          {showCtrRuler && (
            <div className="text-[11px] font-mono text-blue-300 ml-auto bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-800 flex items-center gap-2">
              <span className="text-amber-400 font-bold">CTR Measurement:</span>
              <span>A={ctrData.a}cm + B={ctrData.b}cm / C={ctrData.c}cm = <b>{ctrData.ctr}%</b></span>
              <span className="text-emerald-400 font-semibold">({ctrData.status})</span>
            </div>
          )}
        </div>

        {/* Viewport Canvas */}
        <div
          ref={containerRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full flex items-center justify-center overflow-hidden bg-radial from-slate-900 to-black select-none ${
            isFullscreen ? 'flex-1' : 'h-[440px] sm:h-[480px]'
          } ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        >
          {/* Patient Hospital Watermark (DICOM Corner Overlay) */}
          {showPatientInfo && (
            <>
              {/* Top Left: Patient Identification */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] text-amber-200/90 leading-tight bg-black/50 p-2 rounded backdrop-blur-xs border border-amber-500/20 pointer-events-none">
                <div className="font-bold text-amber-300 uppercase tracking-wide">{patient.nama}</div>
                <div className="text-slate-300">MCU ID: #{patient.mcuNo}</div>
                <div className="text-slate-300">JK / Umur: {patient.jk || 'Pria'} / {patient.usia || '32 th'}</div>
                <div className="text-slate-400 text-[10px]">{patient.pt}</div>
              </div>

              {/* Top Right: Study Date, Facility, Marker */}
              <div className="absolute top-3 right-3 z-10 font-mono text-[11px] text-amber-200/90 text-right leading-tight bg-black/50 p-2 rounded backdrop-blur-xs border border-amber-500/20 pointer-events-none">
                <div className="font-bold text-white tracking-widest text-sm">SIMREG RADIOLOGY</div>
                <div className="text-slate-300">Tgl: {patient.tglMcu || new Date().toISOString().split('T')[0]}</div>
                <div className="text-slate-300">{projection}</div>
                <div className="text-yellow-400 font-extrabold text-sm mt-0.5">R (Right)</div>
              </div>

              {/* Bottom Left: Exposure Parameters */}
              <div className="absolute bottom-3 left-3 z-10 font-mono text-[10px] text-slate-400 bg-black/50 px-2 py-1 rounded backdrop-blur-xs border border-slate-800 pointer-events-none">
                <div>kVp: 120 | mAs: 3.2 | SID: 180cm</div>
                <div>Matrix: 2048 x 2048 | 16-bit Grayscale</div>
              </div>
            </>
          )}

          {/* Radiograph Image or Authentic Radiograph SVG */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                isInverted ? 'invert(1) hue-rotate(180deg)' : ''
              }`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full flex items-center justify-center p-2"
          >
            {isCustomUpload ? (
              <img
                src={photoUrl!}
                alt="Foto Rontgen Thorax Pasien"
                className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-2xl"
              />
            ) : (
              /* Authentic Medical Chest X-Ray SVG Rendering */
              <svg
                viewBox="0 0 600 700"
                className="w-full h-full max-h-[440px] drop-shadow-2xl"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Soft gradients for lung radiolucency */}
                  <radialGradient id="lungLeft" cx="62%" cy="48%" r="40%">
                    <stop offset="0%" stopColor="#080a0e" />
                    <stop offset="60%" stopColor="#121820" />
                    <stop offset="100%" stopColor="#252d3a" />
                  </radialGradient>
                  <radialGradient id="lungRight" cx="38%" cy="48%" r="40%">
                    <stop offset="0%" stopColor="#080a0e" />
                    <stop offset="60%" stopColor="#121820" />
                    <stop offset="100%" stopColor="#252d3a" />
                  </radialGradient>

                  {/* Soft lung infiltrate gradient */}
                  <radialGradient id="infiltrateGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                    <stop offset="40%" stopColor="#d1d5db" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>

                  {/* Bone opacity filter */}
                  <filter id="softGaze" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="1.5" />
                  </filter>
                </defs>

                {/* Thoracic Cavity Background */}
                <rect width="600" height="700" fill="#040609" />

                {/* Soft Tissue Contour of Neck, Shoulder, Lateral Chest Walls */}
                <path
                  d="M 170 0 L 170 80 Q 80 120 40 260 Q 30 450 50 620 L 550 620 Q 570 450 560 260 Q 520 120 430 80 L 430 0 Z"
                  fill="#181e28"
                  opacity="0.8"
                />

                {/* Vertebral Column / Spine in Midline */}
                <rect x="286" y="40" width="28" height="560" rx="4" fill="#64748b" opacity="0.35" />
                {[...Array(12)].map((_, i) => (
                  <rect
                    key={`vert-${i}`}
                    x="280"
                    y={90 + i * 36}
                    width="40"
                    height="20"
                    rx="3"
                    fill="#94a3b8"
                    opacity="0.4"
                  />
                ))}

                {/* Trachea Air Column (Dark Radiolucent central line) */}
                <rect x="294" y="60" width="12" height="150" rx="5" fill="#0a0c10" opacity="0.85" />
                {/* Carina and Main Bronchi */}
                <path
                  d="M 295 210 L 250 250 M 305 210 L 350 250"
                  stroke="#0a0c10"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* Right Lung Field (Dark on real film, left side of image) */}
                <path
                  d="M 270 120 C 240 110 180 130 140 180 C 100 230 85 340 90 480 C 92 510 130 525 210 520 C 270 515 275 420 270 250 Z"
                  fill="url(#lungRight)"
                />

                {/* Left Lung Field (Right side of image) */}
                <path
                  d="M 330 120 C 360 110 420 130 460 180 C 500 230 515 340 510 480 C 508 518 470 535 410 530 C 330 520 325 380 330 250 Z"
                  fill="url(#lungLeft)"
                />

                {/* Broncho-vascular markings / hilar vessels (fine white arborizations) */}
                <g stroke="#cbd5e1" strokeWidth="1.2" opacity="0.35" strokeLinecap="round">
                  {/* Right Hilum */}
                  <path d="M 260 260 Q 210 240 160 250 M 260 270 Q 200 300 150 330 M 260 280 Q 210 340 170 410 M 255 250 Q 220 190 190 160" />
                  <path d="M 210 240 Q 180 230 140 220 M 200 300 Q 170 330 130 360" strokeWidth="0.8" />
                  {/* Left Hilum */}
                  <path d="M 340 250 Q 390 230 440 240 M 340 260 Q 400 290 450 320 M 340 270 Q 390 330 430 400 M 345 240 Q 380 180 410 150" />
                  <path d="M 390 230 Q 420 220 460 210 M 400 290 Q 430 320 470 350" strokeWidth="0.8" />
                </g>

                {/* Ribs (Posterior and Anterior Rib Arches) */}
                <g stroke="#94a3b8" strokeWidth="6" opacity="0.35" strokeLinecap="round" fill="none">
                  {/* Rib 1 - 8 Pairs */}
                  <path d="M 280 130 Q 200 120 160 150" />
                  <path d="M 320 130 Q 400 120 440 150" />
                  <path d="M 280 165 Q 180 160 125 210" />
                  <path d="M 320 165 Q 420 160 475 210" />
                  <path d="M 280 205 Q 170 205 105 270" />
                  <path d="M 320 205 Q 430 205 495 270" />
                  <path d="M 280 250 Q 165 255 95 330" />
                  <path d="M 320 250 Q 435 255 505 330" />
                  <path d="M 280 300 Q 160 310 90 395" />
                  <path d="M 320 300 Q 440 310 510 395" />
                  <path d="M 280 355 Q 160 370 95 460" />
                  <path d="M 320 355 Q 440 370 505 460" />
                  <path d="M 280 415 Q 165 435 105 515" />
                  <path d="M 320 415 Q 435 435 495 515" />
                </g>

                {/* Clavicles (Bilateral collarbones) */}
                <g stroke="#cbd5e1" strokeWidth="12" opacity="0.55" strokeLinecap="round" fill="none">
                  <path d="M 280 125 Q 210 115 130 135" />
                  <path d="M 320 125 Q 390 115 470 135" />
                </g>

                {/* Cardiac Silhouette & Great Vessels */}
                {/* Normal vs Kardiomegali Contour */}
                {activePreset === 'kardiomegali' ? (
                  /* Enlarged Heart: CTR 56% */
                  <g>
                    <path
                      d="M 315 220 
                         C 335 225 350 240 345 270
                         C 345 300 375 360 415 450
                         C 435 495 420 535 340 535
                         C 260 535 225 515 225 465
                         C 225 410 245 370 270 340
                         C 275 300 295 240 300 220 Z"
                      fill="#e2e8f0"
                      opacity="0.82"
                      filter="url(#softGaze)"
                    />
                    {/* Aortic Knuckle enlarged */}
                    <path d="M 300 215 C 330 210 345 235 340 250" stroke="#f1f5f9" strokeWidth="18" fill="none" opacity="0.8" />
                  </g>
                ) : (
                  /* Normal Heart Silhouette: CTR 44% */
                  <g>
                    <path
                      d="M 315 225 
                         C 330 230 340 240 335 265
                         C 335 295 350 340 380 440
                         C 395 480 380 525 330 525
                         C 270 525 240 500 240 455
                         C 240 410 255 370 275 340
                         C 280 300 295 240 300 225 Z"
                      fill="#cbd5e1"
                      opacity="0.75"
                      filter="url(#softGaze)"
                    />
                    {/* Aortic Knuckle */}
                    <path d="M 300 220 C 325 215 335 235 332 250" stroke="#e2e8f0" strokeWidth="14" fill="none" opacity="0.75" />
                  </g>
                )}

                {/* Diaphragm Domes & Costophrenic Angles */}
                {/* Right Diaphragm dome */}
                {activePreset === 'efusi' ? (
                  /* Efusi Pleura Dextra: Blunted Right Sinus with meniscus sign */
                  <path
                    d="M 90 410 C 95 470 120 495 160 505 C 220 515 270 515 300 525 L 300 620 L 70 620 Z"
                    fill="#e2e8f0"
                    opacity="0.85"
                  />
                ) : (
                  /* Normal Right Diaphragm with sharp CPA */
                  <path
                    d="M 85 505 C 105 475 160 460 220 465 C 270 470 290 495 300 525 L 300 620 L 70 620 Z"
                    fill="#cbd5e1"
                    opacity="0.65"
                  />
                )}

                {/* Left Diaphragm dome (slightly lower than right) */}
                <path
                  d="M 300 525 C 330 485 390 480 450 490 C 495 500 515 525 520 535 L 520 620 L 300 620 Z"
                  fill="#cbd5e1"
                  opacity="0.65"
                />

                {/* Gastric Air Bubble (Magenblase) under left hemidiaphragm */}
                <circle cx="430" cy="540" r="24" fill="#040609" opacity="0.8" />
                <path d="M 406 535 Q 430 520 454 535" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.5" />

                {/* Infiltrate Simulation (Suspek KP / TB) on Right Upper Lung Field */}
                {activePreset === 'infiltrat' && (
                  <g>
                    {/* Fluffy reticulonodular patchy opacities in right apex */}
                    <circle cx="190" cy="165" r="30" fill="url(#infiltrateGlow)" />
                    <circle cx="215" cy="180" r="25" fill="url(#infiltrateGlow)" />
                    <circle cx="170" cy="195" r="22" fill="url(#infiltrateGlow)" />
                    <path
                      d="M 160 160 Q 185 175 220 165 M 175 190 Q 210 185 230 205"
                      stroke="#f8fafc"
                      strokeWidth="2.5"
                      opacity="0.75"
                      strokeLinecap="round"
                    />
                    {/* Clinical annotation marker */}
                    <circle cx="195" cy="175" r="42" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.9" />
                    <text x="145" y="125" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Suspek Infiltrat Apeks (KP)
                    </text>
                  </g>
                )}

                {/* CTR Guide Overlay when toggled */}
                {showCtrRuler && (
                  <g>
                    {/* Midline vertical reference (Spine line) */}
                    <line x1="300" y1="180" x2="300" y2="550" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />

                    {/* Line A: Midline to Right Cardiac Border */}
                    <line
                      x1="300"
                      y1="460"
                      x2={activePreset === 'kardiomegali' ? 225 : 240}
                      y2="460"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                    <circle cx={activePreset === 'kardiomegali' ? 225 : 240} cy="460" r="3" fill="#10b981" />
                    <text x="250" y="455" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      A = {ctrData.a}cm
                    </text>

                    {/* Line B: Midline to Left Cardiac Apex */}
                    <line
                      x1="300"
                      y1="490"
                      x2={activePreset === 'kardiomegali' ? 420 : 385}
                      y2="490"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    <circle cx={activePreset === 'kardiomegali' ? 420 : 385} cy="490" r="3" fill="#f59e0b" />
                    <text x="330" y="485" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      B = {ctrData.b}cm
                    </text>

                    {/* Line C: Internal Thoracic Diameter (rib cage) */}
                    <line x1="90" y1="510" x2="510" y2="510" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
                    <circle cx="90" cy="510" r="4" fill="#ef4444" />
                    <circle cx="510" cy="510" r="4" fill="#ef4444" />
                    <text x="260" y="530" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      C = {ctrData.c}cm
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Bottom Lightbox Controls & Presets */}
        <div className="bg-slate-900/95 px-4 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Upload & Clear Trigger */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.dcm"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Unggah Foto Rontgen Pasien
            </button>

            {isCustomUpload && (
              <button
                type="button"
                onClick={() => {
                  onPhotoChange(null, '');
                  setActivePreset('normal');
                  onNotify('Foto rontgen kustom dihapus. Menggunakan visualisasi default.');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 hover:border-rose-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Foto
              </button>
            )}
          </div>

          {/* Quick Radiograph Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Preset Radiograf:
            </span>
            <button
              type="button"
              onClick={() => {
                handleSelectPreset('normal');
                onApplyPresetFindings?.('normal');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                !isCustomUpload && activePreset === 'normal'
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Thorax Normal (CTR 45%)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectPreset('infiltrat');
                onApplyPresetFindings?.('infiltrat');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                !isCustomUpload && activePreset === 'infiltrat'
                  ? 'bg-amber-600 text-white border border-amber-500'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Infiltrat Apeks (KP)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectPreset('kardiomegali');
                onApplyPresetFindings?.('kardiomegali');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                !isCustomUpload && activePreset === 'kardiomegali'
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Kardiomegali (CTR 56%)
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectPreset('efusi');
                onApplyPresetFindings?.('efusi');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                !isCustomUpload && activePreset === 'efusi'
                  ? 'bg-rose-600 text-white border border-rose-500'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              Efusi Pleura / Sinus Tumpul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
