import { useState } from 'react';
import inventoryService from '../services/inventoryService';
import { InventoryItem } from '../types';

interface TransactionFormProps {
    item: InventoryItem;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TransactionForm({ item, onClose, onSuccess }: TransactionFormProps) {
    const [type, setType] = useState<'in' | 'out'>('out');
    const [quantity, setQuantity] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            setError('Quantity must be greater than zero');
            return;
        }

        if (type === 'out' && quantity > item.quantity) {
            setError('Insufficient stock for this withdrawal');
            return;
        }

        try {
            setLoading(true);
            await inventoryService.recordTransaction(item.id, type, quantity, notes || undefined);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Update Stock: {item.name}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message mb-4">{error}</div>}

                        <div className="current-stock-info mb-4">
                            <p>Current Quantity: <strong>{item.quantity} {item.unit}</strong></p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Transaction Type</label>
                            <div className="radio-group flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="out"
                                        checked={type === 'out'}
                                        onChange={() => setType('out')}
                                    />
                                    <span>Withdraw (Out)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value="in"
                                        checked={type === 'in'}
                                        onChange={() => setType('in')}
                                    />
                                    <span>Add (In)</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Quantity ({item.unit})</label>
                            <input
                                type="number"
                                step="any"
                                className="form-input"
                                value={quantity || ''}
                                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
                            <textarea
                                className="form-input"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Why is this stock changing?"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Record Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
