import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CommunityPage from './pages/CommunityPage';
import Classroom from './components/Classroom';

function App() {
  const [activeTab, setActiveTab] = useState('community');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-page">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-grow">
        {activeTab === 'community' && <CommunityPage />}
        {activeTab === 'classroom' && <Classroom />}
      </main>
    </div>
  );
}

export default App;