import { useState, useRef } from 'react';
import './PhotoCapture.css';

interface PhotoCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

export default function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err: any) {
            console.error('Camera access error:', err);
            setError('Unable to access camera. Please use file upload instead.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(imageData);
                stopCamera();
            }
        }
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const confirmCapture = () => {
        if (capturedImage) {
            // Convert base64 to File
            fetch(capturedImage)
                .then((res) => res.blob())
                .then((blob) => {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                onCapture(file);
            } else {
                setError('Please select an image file');
            }
        }
    };

    return (
        <div className="photo-capture">
            {error && <div className="error-message">{error}</div>}

            {!stream && !capturedImage && (
                <div className="capture-options">
                    <div className="option-card">
                        <div className="option-icon">📷</div>
                        <h3>Take Photo</h3>
                        <p>Use your device camera to capture the product</p>
                        {window.isSecureContext ? (
                            <button className="btn btn-primary" onClick={startCamera}>
                                Open Camera
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Use Camera
                            </button>
                        )}
                        {!window.isSecureContext && (
                            <p className="secure-context-note">
                                (Secure context required for live preview)
                            </p>
                        )}
                    </div>

                    <div className="option-divider">
                        <span>OR</span>
                    </div>

                    <div className="option-card">
                        <div className="option-icon">📁</div>
                        <h3>Upload Image</h3>
                        <p>Select an existing photo from your device</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn btn-secondary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Choose File
                        </button>
                    </div>
                </div>
            )}

            {stream && !capturedImage && (
                <div className="camera-view">
                    <video ref={videoRef} autoPlay playsInline className="video-preview" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="camera-controls">
                        <button className="btn btn-secondary" onClick={stopCamera}>
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-capture" onClick={capturePhoto}>
                            <span className="capture-icon">📸</span> Capture
                        </button>
                    </div>
                </div>
            )}

            {capturedImage && (
                <div className="image-preview">
                    <img src={capturedImage} alt="Captured" className="preview-image" />
                    <div className="preview-controls">
                        <button className="btn btn-secondary" onClick={retake}>
                            Retake
                        </button>
                        <button className="btn btn-primary" onClick={confirmCapture}>
                            Use This Photo
                        </button>
                    </div>
                </div>
            )}

            {!stream && !capturedImage && (
                <div className="capture-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
