'use client';

import React, { useEffect, useState } from 'react';
import { ItemMaster, FilterState } from '@/lib/types';
import { loadItemMaster, getFilteredItems } from '@/lib/dataLoader';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [allItems, setAllItems] = useState<ItemMaster[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);

  // Load item master data
  useEffect(() => {
    loadItemMaster().then(items => {
      setAllItems(items);
    });
  }, []);

  // Update available options based on current filters (cascading)
  useEffect(() => {
    if (allItems.length === 0) return;

    // States (always available)
    const states = Array.from(new Set(allItems.map(item => item.state_id))).sort();
    setAvailableStates(states);

    // Stores (filtered by state)
    let filtered = allItems;
    if (filters.state) {
      filtered = filtered.filter(item => item.state_id === filters.state);
    }
    const stores = Array.from(new Set(filtered.map(item => item.store_id))).sort();
    setAvailableStores(stores);

    // Categories (filtered by state and store)
    if (filters.store) {
      filtered = filtered.filter(item => item.store_id === filters.store);
    }
    const categories = Array.from(new Set(filtered.map(item => item.cat_id))).sort();
    setAvailableCategories(categories);

    // Departments (filtered by state, store, and category)
    if (filters.category) {
      filtered = filtered.filter(item => item.cat_id === filters.category);
    }
    const departments = Array.from(new Set(filtered.map(item => item.dept_id))).sort();
    setAvailableDepartments(departments);

    // Items (filtered by all above)
    if (filters.department) {
      filtered = filtered.filter(item => item.dept_id === filters.department);
    }
    const items = Array.from(new Set(filtered.map(item => item.item_id))).sort();
    setAvailableItems(items);
  }, [allItems, filters.state, filters.store, filters.category, filters.department]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters: FilterState = { ...filters };
    
    // Reset dependent filters when parent filter changes
    if (key === 'state') {
      newFilters.store = '';
      newFilters.category = '';
      newFilters.department = '';
      newFilters.item = '';
    } else if (key === 'store') {
      newFilters.category = '';
      newFilters.department = '';
      newFilters.item = '';
    } else if (key === 'category') {
      newFilters.department = '';
      newFilters.item = '';
    } else if (key === 'department') {
      newFilters.item = '';
    }
    
    newFilters[key] = value;
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 h-fit">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Filters</h2>
      
      <div className="space-y-4">
        {/* State Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All States</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Store Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store
          </label>
          <select
            value={filters.store}
            onChange={(e) => handleFilterChange('store', e.target.value)}
            disabled={!filters.state}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Stores</option>
            {availableStores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
          {!filters.state && (
            <p className="mt-1 text-xs text-gray-500">Select a state first</p>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            disabled={!filters.state || !filters.store}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {(!filters.state || !filters.store) && (
            <p className="mt-1 text-xs text-gray-500">Select state and store first</p>
          )}
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            disabled={!filters.state || !filters.store || !filters.category}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Departments</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {(!filters.state || !filters.store || !filters.category) && (
            <p className="mt-1 text-xs text-gray-500">Select state, store, and category first</p>
          )}
        </div>

        {/* Item Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item
          </label>
          <select
            value={filters.item}
            onChange={(e) => handleFilterChange('item', e.target.value)}
            disabled={!filters.state || !filters.store || !filters.category || !filters.department}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Items</option>
            {availableItems.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          {(!filters.state || !filters.store || !filters.category || !filters.department) && (
            <p className="mt-1 text-xs text-gray-500">Select all previous filters first</p>
          )}
        </div>
      </div>
    </div>
  );
}

