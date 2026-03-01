import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Predefined hours array
const hours = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

// Battery level pattern throughout the day
const batteryPattern = [
  40, 40, 40, 40, 40, 40, 40, 40,  // Night (00:00-07:00) - Slow drain
  55, 80, 100, 100, 100, 100, 100, 100,  // Day (08:00-15:00) - Solar charging
  100, 100, 100, 100, 100, 100, 100, 40   // Evening (16:00-23:00) - High usage then stabilizing
];

interface House {
  id: number;
  name: string;
  description: string;
  usage: number[];
  contribution: number[];
}

const houses: House[] = [
  {
    id: 1,
    name: "House 1",
    description: "Scenario: Young working couple",
    usage: [
      0.2, 0.2, 0.2, 0.2, 0.2, 0.5, 1.0, 1.5,  // Night/Morning
      0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,  // Day (at work)
      0.3, 1.5, 2.5, 3.0, 2.5, 2.0, 1.0, 0.5   // Evening/Night
    ],
    contribution: [
      0, 0, 0, 0, 0, 0, 0, 0.5,                 // Morning
      2, 3, 4, 4.5, 4.5, 4, 3.5, 2,            // Day (solar peak)
      1, 0.5, 0, 0, 0, 0, 0, 0                  // Evening
    ],
  },
  {
    id: 2,
    name: "House 2",
    description: "Scenario: Work from home",
    usage: [
      0.2, 0.2, 0.2, 0.2, 0.2, 1.0, 1.5, 2.0,  // Night/Morning
      0.75, 0.8, 0.95, 0.7, 0.9, 0.85, 0.6, 0.45,  // Day (WFH)
      0.6, 0.75, 0.4, 0.55, 0.7, 0.3, 0.2, 0.1   // Evening/Night
    ],
    contribution: [
      0, 0, 0, 0, 0, 0, 0, 0.5,                 // Morning
      0, 0, 0, 1.5, 0.5, 1, 0, 1 ,            // Day (solar peak)
      1, 0.5, 0, 0, 0, 0, 0, 0                  // Evening
    ],
  },
  {
    id: 3,
    name: "House 3",
    description: "Scenario: Working family of 5",
    usage: [
      0.3, 0.3, 0.3, 0.3, 0.3, 0.5, 1.0, 1.5,  // Night/Morning
      0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2,  // Day (at work)
      0.5, 1.5, 2.5, 3.0, 2.5, 1.5, 1.0, 0.5   // Evening/Night
    ],
    contribution: [
      0, 0, 0, 0, 0, 0, 0, 0.5,                 // Morning
      1, 1, 1.5, 2.5, 3, 2, 1.5, 2,            // Day (solar peak)
      1, 0.5, 0, 0, 0, 0, 0, 0                  // Evening
    ],
  },
];

const App: React.FC = () => {
  const [currentHourIndex, setCurrentHourIndex] = useState(0);
  const [chartData, setChartData] = useState<{ time: string; level: number }[]>([]);
  const [houseWidgets, setHouseWidgets] = useState<{ usage: number; contribution: number }[]>(
    houses.map(() => ({ usage: 0, contribution: 0 }))
  );
  const [selectedTab, setSelectedTab] = useState<'main' | 'yourUsage'>('main');
  const [totalDailyUsage, setTotalDailyUsage] = useState(0);
  const [totalDailyContribution, setTotalDailyContribution] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHourIndex(prevHour => (prevHour + 1) % 24);
    }, 3000); // Speed up to 2 seconds per hour for demo
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update house widgets with current hour's data
    const newHouseWidgets = houses.map((house, index) => ({
      usage: house.usage[currentHourIndex],
      contribution: house.contribution[currentHourIndex]
    }));
    setHouseWidgets(newHouseWidgets);

    // Update chart data
    setChartData(prevData => {
      if (currentHourIndex === 0) {
        return [{ time: hours[0], level: batteryPattern[0] }];
      }

      const newData = [
        ...prevData,
        { time: hours[currentHourIndex], level: batteryPattern[currentHourIndex] }
      ];

      return newData.slice(-24);
    });

    // Update daily totals for House 1 (for Your Usage tab)
    setTotalDailyUsage(prev => prev + houses[0].usage[currentHourIndex]);
    setTotalDailyContribution(prev => prev + houses[0].contribution[currentHourIndex]);

  }, [currentHourIndex]);

  const HouseInfo: React.FC<{ house: House; widget: { usage: number; contribution: number } }> = ({ house, widget }) => (
    <div className="p-4 border rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-semibold mb-2">{house.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{house.description}</p>
      <p className="text-gray-700">Current Usage: {widget.usage.toFixed(1)} kWh</p>
      <p className="text-gray-700">Current Solar Contribution: {widget.contribution.toFixed(1)} kWh</p>
    </div>
  );

  const YourUsageTab: React.FC = () => {
    // Estimate monthly values  
    const estimatedMonthlyUsage = Math.round(totalDailyUsage);
    const estimatedMonthlyContribution = Math.round(totalDailyContribution);
    
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Your Monthly Usage</h2>
        <div className="mb-6">
          <p className="mb-2">Monthly usage: {estimatedMonthlyUsage} kWh</p>
          <p className="mb-2">Monthly solar contribution: {estimatedMonthlyContribution} kWh</p>
          <p className="mb-2">Current daily usage: {totalDailyUsage.toFixed(1)} kWh</p>
          <p className="mb-2">Current daily contribution: {totalDailyContribution.toFixed(1)} kWh</p>
        </div>
        
        <h2 className="text-xl font-bold mb-4">Energy Usage History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="level" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Community Battery Simulation</h1>

      <div className="mb-4">
        <button 
          className={`mr-2 px-4 py-2 rounded ${selectedTab === 'main' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setSelectedTab('main')}
        >
          Main
        </button>
        <button 
          className={`px-4 py-2 rounded ${selectedTab === 'yourUsage' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setSelectedTab('yourUsage')}
        >
          Your Usage
        </button>
      </div>

      {selectedTab === 'main' && (
  <div>
    <h2 className="text-xl font-bold mb-4">         
      Battery Level: {batteryPattern[currentHourIndex]}% 
      <span className="text-sm font-normal ml-2 text-gray-600">
        Current Time: {hours[currentHourIndex]}
      </span>
    </h2>
    <div className="mb-6">
      {houses.map((house, index) => (
        <HouseInfo key={house.id} house={house} widget={houseWidgets[index]} />
      ))}
    </div>

    {/* Add title for community battery percentage */}
    <h2 className="text-xl font-bold mb-4">Community Battery Percentage</h2>

    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="level" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}
      {selectedTab === 'yourUsage' && <YourUsageTab />}
    </div>
  );
};

export default App;