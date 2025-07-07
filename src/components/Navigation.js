// src/components/Navigation.js - Dark Theme
import React from 'react';
import { Search, Plus, BarChart3 } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'proposals',
      label: 'Proposals',
      icon: Search,
      description: 'Browse and vote on proposals'
    },
    {
      id: 'create',
      label: 'Create Proposal',
      icon: Plus,
      description: 'Submit new proposals'
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: BarChart3,
      description: 'Voting statistics and data'
    }
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }`}
                title={tab.description}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;