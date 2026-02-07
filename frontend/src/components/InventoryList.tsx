import { useEffect, useState } from 'react';
import inventoryService from '../services/inventoryService';
import { InventoryItem } from '../types';
import './Inventory.css';

interface InventoryListProps {
    onEdit?: (item: InventoryItem) => void;
}

export default function InventoryList({ onEdit }: InventoryListProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAll();
            setItems(data);
        } catch (err) {
            setError('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        item.category.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="loading">Loading inventory...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="inventory-list-container">
            <div className="list-header">
                <input
                    type="text"
                    placeholder="Search items..."
                    className="form-input search-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="table-responsive">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Min Level</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center">No items found</td>
                            </tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr key={item.id} className={item.quantity <= item.minStockLevel ? 'row-low-stock' : ''}>
                                    <td><strong>{item.name}</strong></td>
                                    <td><span className={`badge badge-${item.category}`}>{item.category}</span></td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unit}</td>
                                    <td>{item.minStockLevel}</td>
                                    <td>
                                        {item.quantity <= item.minStockLevel ? (
                                            <span className="status-label status-danger">Low Stock</span>
                                        ) : (
                                            <span className="status-label status-success">In Stock</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline" onClick={() => onEdit?.(item)}>
                                            Update
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
