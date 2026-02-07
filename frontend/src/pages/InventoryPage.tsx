import { useState } from 'react';
import InventoryList from '../components/InventoryList';
import TransactionForm from '../components/TransactionForm';
import AddItemModal from '../components/AddItemModal';
import { InventoryItem } from '../types';
import './InventoryPage.css';

export default function InventoryPage() {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpdateSuccess = () => {
        setSelectedItem(null);
        setRefreshKey((prev) => prev + 1);
    };

    const handleAddSuccess = () => {
        setShowAddModal(false);
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div className="container">
                    <div className="header-content">
                        <div>
                            <h2>Inventory Management</h2>
                            <p>Track medicine and supply levels</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <span className="btn-icon">➕</span> Add Item
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-content container">
                <div className="inventory-dashboard">
                    <div className="inventory-main">
                        <InventoryList key={refreshKey} onEdit={(item) => setSelectedItem(item)} />
                    </div>
                </div>
            </div>

            {selectedItem && (
                <TransactionForm
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            {showAddModal && (
                <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
            )}
        </div>
    );
}
