import { useState } from 'react';
import PhotoCapture from './PhotoCapture';
import ManualItemForm from './ManualItemForm';
import inventoryService, { AIExtraction, InventoryItemInput } from '../services/inventoryService';
import './AddItemModal.css';

interface AddItemModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type Mode = 'select' | 'photo' | 'manual' | 'review';

export default function AddItemModal({ onClose, onSuccess }: AddItemModalProps) {
    const [mode, setMode] = useState<Mode>('select');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiData, setAiData] = useState<AIExtraction | null>(null);

    const handlePhotoCapture = async (file: File) => {
        setLoading(true);
        setError('');

        try {
            const response = await inventoryService.analyzeImage(file);
            setAiData(response.data);
            setMode('review');
        } catch (err: any) {
            console.error('Image analysis error:', err);
            setError(err.response?.data?.message || 'Failed to analyze image. Please try manual entry.');
            setMode('manual');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (data: InventoryItemInput) => {
        setLoading(true);
        setError('');

        try {
            await inventoryService.create(data);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Create item error:', err);
            setError(err.response?.data?.error || 'Failed to create item');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (data: InventoryItemInput) => {
        await handleManualSubmit(data);
    };

    const convertAIDataToForm = (ai: AIExtraction): Partial<InventoryItemInput> => {
        return {
            name: ai.name || '',
            category: ai.category || 'medicine',
            quantity: ai.quantity || 0,
            unit: ai.unit || 'units',
            expiry_date: ai.expiry_date || '',
            notes: [ai.description, ai.warnings, ai.manufacturer]
                .filter(Boolean)
                .join(' | '),
        };
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-item-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        {mode === 'select' && '📦 Add New Item'}
                        {mode === 'photo' && '📷 Capture Product Photo'}
                        {mode === 'manual' && '✍️ Manual Entry'}
                        {mode === 'review' && '✅ AI Extracted Details'}
                    </h3>
                    <button className="btn-close" onClick={onClose} disabled={loading}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <h4>AI is analyzing your photo...</h4>
                            <p>This usually takes 2-5 seconds. We're extracting the product name, category, and quantity.</p>
                        </div>
                    ) : error && mode !== 'review' ? (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <h4>Analysis Failed</h4>
                            <p>{error}</p>
                            <div className="error-actions">
                                <button className="btn btn-primary" onClick={() => setMode('photo')}>
                                    Try Again
                                </button>
                                <button className="btn btn-secondary" onClick={() => setMode('manual')}>
                                    Enter Manually
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {mode === 'select' && (
                                <div className="mode-selection">
                                    <div className="mode-card" onClick={() => setMode('photo')}>
                                        <div className="mode-icon">📸</div>
                                        <h4>Photo Mode</h4>
                                        <p>Snap a photo and let AI fill the details for you</p>
                                        <div className="mode-badge">Recommended</div>
                                    </div>

                                    <div className="mode-card" onClick={() => setMode('manual')}>
                                        <div className="mode-icon">✍️</div>
                                        <h4>Manual Entry</h4>
                                        <p>Fill out the form yourself</p>
                                    </div>
                                </div>
                            )}

                            {mode === 'photo' && (
                                <PhotoCapture
                                    onCapture={handlePhotoCapture}
                                    onCancel={() => setMode('select')}
                                />
                            )}

                            {mode === 'manual' && (
                                <ManualItemForm
                                    onSubmit={handleManualSubmit}
                                    onCancel={onClose}
                                    loading={loading}
                                />
                            )}

                            {mode === 'review' && aiData && (
                                <div className="review-section">
                                    <div className="success-banner">
                                        <div className="banner-icon">✨</div>
                                        <div className="banner-content">
                                            <h4>Successfully Analyzed!</h4>
                                            <p>AI has extracted the details below. Please review and confirm.</p>
                                        </div>
                                    </div>

                                    <div className="ai-confidence">
                                        <div className="confidence-label">
                                            <span>AI Confidence</span>
                                            <span className="confidence-value">{aiData.confidence}%</span>
                                        </div>
                                        <div className="confidence-bar">
                                            <div
                                                className="confidence-fill"
                                                style={{
                                                    width: `${aiData.confidence}%`,
                                                    backgroundColor:
                                                        aiData.confidence >= 70
                                                            ? 'var(--success)'
                                                            : aiData.confidence >= 50
                                                                ? 'var(--warning)'
                                                                : 'var(--danger)',
                                                }}
                                            />
                                        </div>
                                        {aiData.confidence < 70 && (
                                            <p className="confidence-hint">
                                                Low confidence detected. Double-check all fields.
                                            </p>
                                        )}
                                    </div>

                                    {error && <div className="error-message mb-4">{error}</div>}

                                    <ManualItemForm
                                        initialData={convertAIDataToForm(aiData)}
                                        onSubmit={handleReviewSubmit}
                                        onCancel={() => setMode('photo')}
                                        loading={loading}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
