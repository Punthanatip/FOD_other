import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertTriangle, MapPin, Filter } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SummaryData {
  total_24h: number;
  avg_conf: number;
  top_fod: string | null;
}

export function DashboardPage() {
  const [dateRange, setDateRange] = useState('24h');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard summary data from backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/dashboard/summary`);
        if (response.ok) {
          const data: SummaryData = await response.json();
          setSummaryData(data);
        } else {
          console.error('Failed to fetch dashboard summary:', response.status);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const placeholderData = [
    { time: '00:00', detections: 0 },
    { time: '04:00', detections: 0 },
    { time: '08:00', detections: 0 },
    { time: '12:00', detections: 0 },
    { time: '16:00', detections: 0 },
    { time: '20:00', detections: 0 },
  ];

  const fodTypeData = [
    { name: 'None', value: 100, color: '#8E8E93' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white mb-2">Historical Data Dashboard</h2>
          <p className="text-[#8E8E93]">Analyze FOD detection patterns and trends</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`${dateRange === '24h' ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-[#2C2C2E] border-[#3C3C3E]'}`}
            onClick={() => setDateRange('24h')}
          >
            24 Hours
          </Button>
          <Button
            variant="outline"
            className={`${dateRange === '7d' ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-[#2C2C2E] border-[#3C3C3E]'}`}
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant="outline"
            className={`${dateRange === '30d' ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-[#2C2C2E] border-[#3C3C3E]'}`}
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Button>
          <Button variant="outline" className="bg-[#2C2C2E] border-[#3C3C3E]">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* KPI Cards - Show data from backend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8E8E93] text-sm mb-2">Total Detections (24h)</p>
              {loading ? (
                <p className="text-white text-3xl">...</p>
              ) : (
                <p className="text-white text-3xl">{summaryData?.total_24h || 0}</p>
              )}
              <p className="text-[#8E8E93] text-sm mt-2">
                {summaryData?.total_24h ? 'Active detections' : 'No recent detections'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#007BFF]/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#007BFF]" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8E8E93] text-sm mb-2">Critical Alerts Today</p>
              {loading ? (
                <p className="text-white text-3xl">...</p>
              ) : (
                <p className="text-white text-3xl">0</p>
              )}
              <p className="text-[#8E8E93] text-sm mt-2">No critical events</p>
            </div>
            <div className="w-12 h-12 bg-[#FF3B30]/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#FF3B30]" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8E8E93] text-sm mb-2">Avg. Confidence</p>
              {loading ? (
                <p className="text-white text-3xl">-</p>
              ) : (
                <p className="text-white text-3xl">{summaryData?.avg_conf ? summaryData.avg_conf.toFixed(2) : '-'}</p>
              )}
              <p className="text-[#8E8E93] text-sm mt-2">
                {summaryData?.avg_conf ? 'Model is active' : 'Model not active'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#34C759]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#34C759]" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8E8E93] text-sm mb-2">Most Common FOD</p>
              {loading ? (
                <p className="text-white text-3xl">...</p>
              ) : (
                <p className="text-white text-3xl">{summaryData?.top_fod || 'None'}</p>
              )}
              <p className="text-[#8E8E93] text-sm mt-2">
                {summaryData?.top_fod ? 'Most detected FOD type' : 'No detections yet'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FFCC00]/20 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-[#FFCC00]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row - Show placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <h3 className="text-white mb-4">Detection Timeline (24h)</h3>
          <div className="text-center py-8 text-[#8E8E93]">
            <p>No detection timeline available</p>
            <p className="text-sm mt-2">Start monitoring to see detection patterns</p>
          </div>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
          <h3 className="text-white mb-4">FOD Type Distribution</h3>
          <div className="flex items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fodTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fodTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #2C2C2E',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-[#8E8E93] mt-4">
            No type distribution available
          </div>
        </Card>
      </div>

      {/* Map Section */}
      <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white">Detection Location Map</h3>
          <Button variant="outline" size="sm" className="bg-[#2C2C2E] border-[#3C3C3E]">
            <MapPin className="w-4 h-4 mr-2" />
            View Full Map
          </Button>
        </div>
        <div className="bg-[#2C2C2E] rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
          <div className="text-[#8E8E93] text-center z-10">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No detection locations available</p>
            <p className="text-sm mt-1">Provide input to start monitoring</p>
          </div>
        </div>
      </Card>

      {/* Historical Data Table */}
      <Card className="bg-[#1A1A1A] border-[#2C2C2E] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white">Detection History</h3>
          <Button variant="outline" size="sm" className="bg-[#2C2C2E] border-[#3C3C3E]">
            Export Data
          </Button>
        </div>
        
        <div className="text-center py-12 text-[#8E8E93]">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No detection history available</p>
          <p className="text-sm mt-2">Detections will appear here once monitoring begins</p>
        </div>
      </Card>
    </div>
  );
}