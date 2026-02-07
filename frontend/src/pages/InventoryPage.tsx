import React, { useState } from 'react';
import InventoryList from '../components/InventoryList';
import TransactionForm from '../components/TransactionForm';
import { InventoryItem } from '../types';
import './InventoryPage.css';

export default function InventoryPage() {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpdateSuccess = () => {
        setSelectedItem(null);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div className="container">
                    <h2>Inventory Management</h2>
                    <p>Track medicine and supply levels</p>
                </div>
            </div>

            <div className="page-content container">
                <div className="inventory-dashboard">
                    <div className="inventory-main">
                        <InventoryList
                            key={refreshKey}
                            onEdit={(item) => setSelectedItem(item)}
                        />
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
        </div>
    );
}
