"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Eye, Heart, MessageCircle, Globe, Smartphone, ArrowUp, ArrowDown, Download } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

const overviewStats = [
  { label: "Total Users", value: "24,521", change: "+12.5%", up: true, icon: Users },
  { label: "Daily Active Users", value: "8,432", change: "+5.2%", up: true, icon: Eye },
  { label: "New Matches Today", value: "1,234", change: "+18.3%", up: true, icon: Heart },
  { label: "Messages Sent", value: "45,678", change: "-2.1%", up: false, icon: MessageCircle },
]

const userGrowthData = [
  { month: "Jan", users: 15000 },
  { month: "Feb", users: 16500 },
  { month: "Mar", users: 18200 },
  { month: "Apr", users: 19800 },
  { month: "May", users: 21500 },
  { month: "Jun", users: 22800 },
  { month: "Jul", users: 24521 },
]

const engagementData = [
  { day: "Mon", likes: 1200, comments: 800, shares: 400 },
  { day: "Tue", likes: 1400, comments: 900, shares: 500 },
  { day: "Wed", likes: 1600, comments: 1100, shares: 600 },
  { day: "Thu", likes: 1300, comments: 850, shares: 450 },
  { day: "Fri", likes: 1800, comments: 1200, shares: 700 },
  { day: "Sat", likes: 2200, comments: 1500, shares: 900 },
  { day: "Sun", likes: 2000, comments: 1400, shares: 800 },
]

const deviceData = [
  { name: "Mobile", value: 65, color: "#ff477e" },
  { name: "Desktop", value: 28, color: "#ffaa42" },
  { name: "Tablet", value: 7, color: "#6a4cff" },
]

const countryData = [
  { country: "United States", users: 8500, percentage: 35 },
  { country: "United Kingdom", users: 4200, percentage: 17 },
  { country: "Germany", users: 2800, percentage: 11 },
  { country: "France", users: 2100, percentage: 9 },
  { country: "Canada", users: 1800, percentage: 7 },
  { country: "Others", users: 5121, percentage: 21 },
]

const ageData = [
  { age: "18-24", male: 2500, female: 2800 },
  { age: "25-34", male: 4200, female: 4500 },
  { age: "35-44", male: 2800, female: 3100 },
  { age: "45-54", male: 1500, female: 1800 },
  { age: "55+", male: 600, female: 721 },
]

export default function AdminAnalyticsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.up ? "text-green-500" : "text-red-500"}`}>
                    {stat.up ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full p-6" style={{ height: "288px" }}>
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff477e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff477e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#ff477e" fill="url(#colorGrowth)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle>Weekly Engagement</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full p-6" style={{ height: "288px" }}>
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="day" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="likes" fill="#ff477e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comments" fill="#ffaa42" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="shares" fill="#6a4cff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Device Distribution */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full p-6" style={{ height: "192px" }}>
              <ResponsiveContainer width="100%" height={192}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {deviceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demographics */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "256px" }}>
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={ageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis dataKey="age" type="category" stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="female" fill="#ff477e" radius={[0, 4, 4, 0]} name="Female" />
                  <Bar dataKey="male" fill="#6a4cff" radius={[0, 4, 4, 0]} name="Male" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {countryData.map((country) => (
              <div key={country.country} className="flex items-center gap-4">
                <div className="w-32 font-medium">{country.country}</div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-bg rounded-full transition-all duration-500"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="font-medium">{country.users.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">({country.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
