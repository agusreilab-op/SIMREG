import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  participantName?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  participantName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen) {
      setIsLoading(true);
      setCameraError(null);
      setCapturedImage(null);

      // Attempt to access user media (webcam)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false,
          })
          .then((mediaStream) => {
            currentStream = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
            }
            setIsLoading(false);
          })
          .catch((err) => {
            console.warn('Camera access error:', err);
            setCameraError(
              'Tidak dapat mengakses kamera perangkat secara langsung (izin belum diberikan atau perangkat tidak memiliki webcam). Anda dapat menggunakan simulasi foto instan atau unggah berkas foto.'
            );
            setIsLoading(false);
          });
      } else {
        setCameraError('Browser tidak mendukung akses kamera secara langsung.');
        setIsLoading(false);
      }
    }

    return () => {
      // Cleanup stream on close or unmount
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw image mirrored if front camera
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCameraStream();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsLoading(true);
    setCameraError(null);

    navigator.mediaDevices
      .getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setCameraError('Gagal menghubungkan kembali kamera.');
        setIsLoading(false);
      });
  };

  const handleSaveCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCameraStream();
      onClose();
    }
  };

  // Simulated Instant Snapshot for testing or fallback when camera is restricted
  const handleSimulatedSnap = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clean medical badge background
      const grad = ctx.createLinearGradient(0, 0, 0, 500);
      grad.addColorStop(0, '#E0F2FE');
      grad.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 500);

      // Silhouette / Face mockup
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(200, 190, 75, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.ellipse(200, 390, 130, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stamp
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(participantName || 'PESERTA MCU', 200, 460);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCameraStream();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0F172A] text-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1E293B] p-4 px-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] leading-tight">
                Foto Shoot Kamera Peserta
              </h3>
              <p className="text-[12px] text-slate-400">
                {participantName ? `Pasien: ${participantName}` : 'Ambil foto pasfoto langsung di meja registrasi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="p-5 flex flex-col items-center justify-center bg-black/40 min-h-[340px] relative">
          {/* Live Video Feed */}
          {!capturedImage && !cameraError && (
            <div className="relative w-full max-w-[360px] aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {/* Photo Guide Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                <div className="w-44 h-56 border-2 border-dashed border-cyan-400/60 rounded-full" />
              </div>
              <div className="absolute bottom-2 text-center w-full text-[11px] bg-black/60 py-1 text-cyan-300 font-medium">
                Posisikan wajah di dalam lingkaran panduan
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="relative w-full max-w-[360px] aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xl">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Check className="w-3 h-3" /> Foto Terambil
              </div>
            </div>
          )}

          {/* Camera Error / Fallback Card */}
          {cameraError && !capturedImage && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-6 text-center max-w-sm space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="text-[14px] font-bold text-slate-100">
                Akses Kamera Tidak Tersedia
              </h4>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={handleSimulatedSnap}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-[12.5px] font-bold rounded-lg shadow-md hover:brightness-110"
              >
                Gunakan Pasfoto Otomatis
              </button>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 px-5 bg-[#1E293B] border-t border-slate-700 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[13px] font-bold transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleSimulatedSnap}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-[12px] font-bold transition-colors"
                  title="Gunakan contoh foto instan bila tidak ada kamera fisik"
                >
                  Snap Instan
                </button>
                <button
                  type="button"
                  disabled={isLoading || !!cameraError}
                  onClick={handleTakePhoto}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[13px] font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-40"
                >
                  <Camera className="w-4 h-4" />
                  Foto Shoot Sekarang
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[13px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Foto Ulang
                </button>
                <button
                  type="button"
                  onClick={handleSaveCapture}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[13px] font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                  Gunakan Foto Ini
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
