'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import { FilterState, ItemMaster } from '@/lib/types';
import { getFilteredItems } from '@/lib/dataLoader';

export default function Dashboard() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    store: '',
    category: '',
    department: '',
    item: '',
  });

  const [filteredItems, setFilteredItems] = useState<ItemMaster[]>([]);
  const [loading, setLoading] = useState(true);

  // Load filtered items when filters change
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const items = await getFilteredItems({
          state: filters.state || undefined,
          store: filters.store || undefined,
          category: filters.category || undefined,
          department: filters.department || undefined,
          item: filters.item || undefined,
        });
        setFilteredItems(items);
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [filters]);

  const handleItemClick = (item: ItemMaster) => {
    // Navigate using item_id, which is more user-friendly
    router.push(`/product/${item.item_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 lg:px-10 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Walmart Retail Sales Forecasting & Decision Intelligence
              </h1>
              <p className="text-base text-gray-600 mt-1">
                Machine learning–driven demand forecasting and inventory insights
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Product List - Full Width */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Product Selection
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select filters above to browse available products, then click a product to view detailed forecast analysis
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      Found {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredItems.slice(0, 100).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="text-left p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all bg-white hover:bg-primary-50 group"
                      >
                        <div className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {item.item_id}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Store:</span>
                            <span>{item.store_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Category:</span>
                            <span>{item.cat_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">State:</span>
                            <span>{item.state_id}</span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          View Forecast Analysis →
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredItems.length > 100 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Showing first 100 of {filteredItems.length} products. Use filters to narrow your search.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-600 mb-2">No products found</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your filters to see more products
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
