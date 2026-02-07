import { useState } from 'react';
import { InventoryItemInput } from '../services/inventoryService';
import './ManualItemForm.css';

interface ManualItemFormProps {
    initialData?: Partial<InventoryItemInput>;
    onSubmit: (data: InventoryItemInput) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function ManualItemForm({
    initialData = {},
    onSubmit,
    onCancel,
    loading = false,
}: ManualItemFormProps) {
    const [formData, setFormData] = useState<InventoryItemInput>({
        name: initialData.name || '',
        category: initialData.category || 'medicine',
        quantity: initialData.quantity || 0,
        unit: initialData.unit || 'units',
        min_stock_level: initialData.min_stock_level || 0,
        expiry_date: initialData.expiry_date || '',
        location: initialData.location || '',
        notes: initialData.notes || '',
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'quantity' || name === 'min_stock_level' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className="manual-item-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Item Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Aspirin 500mg"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Category <span className="required">*</span>
                    </label>
                    <select
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="medicine">Medicine</option>
                        <option value="supply">Supply</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">
                        Quantity <span className="required">*</span>
                    </label>
                    <input
                        type="number"
                        name="quantity"
                        className="form-input"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Unit <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="unit"
                        className="form-input"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        placeholder="tablets, ml, boxes, etc."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Minimum Stock Level</label>
                    <input
                        type="number"
                        name="min_stock_level"
                        className="form-input"
                        value={formData.min_stock_level}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                        type="date"
                        name="expiry_date"
                        className="form-input"
                        value={formData.expiry_date}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                        type="text"
                        name="location"
                        className="form-input"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Cabinet A, Shelf 2"
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                    name="notes"
                    className="form-textarea"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional information, warnings, or instructions..."
                    rows={3}
                />
            </div>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding Item...' : 'Add Item'}
                </button>
            </div>
        </form>
    );
}
