import { useState, useEffect } from 'react'
import { 
  Copy, 
  Link2, 
  Clock, 
  Coins, 
  Gem, 
  ArrowRightLeft, 
  Send, 
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

// Types
interface TransferRequest {
  id: string
  username: string
  points: number
  rewardType: 'money' | 'shards' | 'both' | 'money10' | 'shards10'
  status: 'pending' | 'completed'
  timestamp: number
}

// Admin credentials (in production, this would be server-side)
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'minecraft2024'

function App() {
  // User state
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [points, setPoints] = useState(0)
  
  // AFK state
  const [isAfk, setIsAfk] = useState(false)
  const [afkTime, setAfkTime] = useState(0)
  const [afkPoints, setAfkPoints] = useState(0)
  
  // Transfer state
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedReward, setSelectedReward] = useState<'money' | 'shards' | 'both' | 'money10' | 'shards10' | null>(null)
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([])
  
  // UI state
  const [activeSection, setActiveSection] = useState<'promote' | 'afk' | 'transfer'>('promote')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('mc_username')
    const savedPoints = localStorage.getItem('mc_points')
    const savedRequests = localStorage.getItem('mc_transfer_requests')
    
    if (savedUsername) {
      setUsername(savedUsername)
      setIsLoggedIn(true)
    }
    if (savedPoints) {
      setPoints(parseFloat(savedPoints))
    }
    if (savedRequests) {
      setTransferRequests(JSON.parse(savedRequests))
    }
  }, [])

  // Save points to localStorage
  useEffect(() => {
    localStorage.setItem('mc_points', points.toString())
  }, [points])

  // Save transfer requests to localStorage
  useEffect(() => {
    localStorage.setItem('mc_transfer_requests', JSON.stringify(transferRequests))
  }, [transferRequests])

  // AFK Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isAfk) {
      interval = setInterval(() => {
        setAfkTime(prev => prev + 1)
        setAfkPoints(prev => {
          const newPoints = prev + 0.5
          return newPoints
        })
      }, 60000) // Every minute
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAfk])

  // Claim AFK points
  const claimAfkPoints = () => {
    if (afkPoints > 0) {
      setPoints(prev => prev + afkPoints)
      toast.success(`Claimed ${afkPoints.toFixed(1)} points!`)
      setAfkPoints(0)
      setAfkTime(0)
      setIsAfk(false)
    }
  }

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Handle username entry
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      localStorage.setItem('mc_username', username)
      setIsLoggedIn(true)
      toast.success(`Welcome, ${username}!`)
    }
  }

  // Copy promotion link
  const copyPromotionLink = () => {
    const link = `https://minecraft-server.com/join?ref=${username}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    toast.success('Promotion link copied!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Handle transfer
  const handleTransfer = () => {
    const amount = parseInt(transferAmount)
    if (!amount || amount < 100) {
      toast.error('Minimum transfer is 100 points')
      return
    }
    if (amount > points) {
      toast.error('Insufficient points')
      return
    }
    if (!selectedReward) {
      toast.error('Please select a reward type')
      return
    }

    const newRequest: TransferRequest = {
      id: Date.now().toString(),
      username: username,
      points: amount,
      rewardType: selectedReward,
      status: 'pending',
      timestamp: Date.now()
    }

    setTransferRequests(prev => [newRequest, ...prev])
    setPoints(prev => prev - amount)
    setTransferAmount('')
    setSelectedReward(null)
    toast.success('Transfer request submitted! Admin will process it soon.')
  }

  // Admin login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setShowAdminLogin(false)
      toast.success('Admin access granted')
    } else {
      toast.error('Invalid credentials')
    }
  }

  // Complete transfer request
  const completeTransfer = (id: string) => {
    setTransferRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, status: 'completed' } : req
      )
    )
    toast.success('Transfer marked as completed')
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('mc_username')
    localStorage.removeItem('mc_points')
    setUsername('')
    setIsLoggedIn(false)
    setPoints(0)
    setIsAfk(false)
    setAfkTime(0)
    setAfkPoints(0)
    toast.success('Logged out successfully')
  }

  // Calculate reward
  const calculateReward = (points: number, type: 'money' | 'shards' | 'both' | 'money10' | 'shards10') => {
    if (type === 'money10') return { money: Math.floor(points / 10), shards: 0 }
    if (type === 'shards10') return { money: 0, shards: Math.floor(points / 10) }
    if (type === 'money') return { money: Math.floor(points / 10), shards: 0 }
    if (type === 'shards') return { money: 0, shards: Math.floor(points / 50) }
    return { money: Math.floor(points / 20), shards: Math.floor(points / 100) }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] mc-pattern flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#12121a] border-[#2d3748]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-violet-500 rounded-xl flex items-center justify-center mb-4">
              <Gem className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl gradient-text">Minecraft Server</CardTitle>
            <CardDescription className="text-[#94a3b8]">
              Enter your username to start earning rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                <Input
                  placeholder="Enter your Minecraft username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[#1a1a25] border-[#2d3748] text-white placeholder:text-[#64748b]"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                Enter Server
              </Button>
            </form>
            
            {/* Admin Login Button (hidden in plain sight) */}
            <button
              onClick={() => setShowAdminLogin(true)}
              className="mt-4 text-xs text-[#475569] hover:text-[#64748b] transition-colors"
            >
              Staff Access
            </button>
          </CardContent>
        </Card>

        {/* Admin Login Dialog */}
        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="bg-[#12121a] border-[#2d3748]">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Admin Login
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <Input
                placeholder="Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="bg-[#1a1a25] border-[#2d3748] text-white"
              />
              <Input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-[#1a1a25] border-[#2d3748] text-white"
              />
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Login
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Admin Dashboard
  if (isAdmin) {
    const pendingRequests = transferRequests.filter(r => r.status === 'pending')
    const completedRequests = transferRequests.filter(r => r.status === 'completed')

    return (
      <div className="min-h-screen bg-[#0a0a0f] mc-pattern">
        {/* Admin Header */}
        <header className="glass sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-[#94a3b8]">Transfer Requests</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsAdmin(false)}
              className="border-[#2d3748] text-[#94a3b8] hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit Admin
            </Button>
          </div>
        </header>

        {/* Admin Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Pending Requests</p>
                    <p className="text-3xl font-bold text-amber-500">{pendingRequests.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Completed</p>
                    <p className="text-3xl font-bold text-emerald-500">{completedRequests.length}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Total Points</p>
                    <p className="text-3xl font-bold text-violet-500">
                      {transferRequests.reduce((acc, r) => acc + r.points, 0)}
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-violet-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card className="bg-[#12121a] border-[#2d3748] mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-[#64748b] text-center py-8">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const reward = calculateReward(request.points, request.rewardType)
                    return (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{request.username}</p>
                            <p className="text-sm text-[#94a3b8]">
                              {request.points} points → {request.rewardType === 'money10' && `$${reward.money}`}
                              {request.rewardType === 'shards10' && `${reward.shards} Shards`}
                              {request.rewardType === 'money' && `$${reward.money}`}
                              {request.rewardType === 'shards' && `${reward.shards} Shards`}
                              {request.rewardType === 'both' && `$${reward.money} + ${reward.shards} Shards`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => completeTransfer(request.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Requests */}
          <Card className="bg-[#12121a] border-[#2d3748]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Completed Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedRequests.length === 0 ? (
                <p className="text-[#64748b] text-center py-8">No completed requests yet</p>
              ) : (
                <div className="space-y-3">
                  {completedRequests.map((request) => {
                    const reward = calculateReward(request.points, request.rewardType)
                    return (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 bg-[#1a1a25]/50 rounded-lg border border-[#2d3748]/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-500/50" />
                          </div>
                          <div>
                            <p className="text-white/70 font-medium">{request.username}</p>
                            <p className="text-sm text-[#64748b]">
                              {request.points} points → {request.rewardType === 'money10' && `$${reward.money}`}
                              {request.rewardType === 'shards10' && `${reward.shards} Shards`}
                              {request.rewardType === 'money' && `$${reward.money}`}
                              {request.rewardType === 'shards' && `${reward.shards} Shards`}
                              {request.rewardType === 'both' && `$${reward.money} + ${reward.shards} Shards`}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Completed
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] mc-pattern">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-violet-500 rounded-lg flex items-center justify-center animate-glow">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">Minecraft Server</h1>
                <p className="text-xs text-[#94a3b8]">Promotion & Rewards</p>
              </div>
            </div>

            {/* Points Display */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a25] rounded-lg border border-[#2d3748]">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-white font-bold">{points.toFixed(1)}</span>
                <span className="text-[#94a3b8] text-sm">Points</span>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#94a3b8] hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`mt-4 flex flex-wrap gap-2 ${mobileMenuOpen ? 'flex' : 'hidden lg:flex'}`}>
            <Button
              variant={activeSection === 'promote' ? 'default' : 'outline'}
              onClick={() => setActiveSection('promote')}
              className={`flex-1 lg:flex-none ${
                activeSection === 'promote' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : 'border-[#2d3748] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Promote
            </Button>
            <Button
              variant={activeSection === 'afk' ? 'default' : 'outline'}
              onClick={() => setActiveSection('afk')}
              className={`flex-1 lg:flex-none ${
                activeSection === 'afk' 
                  ? 'bg-gradient-to-r from-violet-500 to-violet-600' 
                  : 'border-[#2d3748] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              AFK Area
            </Button>
            <Button
              variant={activeSection === 'transfer' ? 'default' : 'outline'}
              onClick={() => setActiveSection('transfer')}
              className={`flex-1 lg:flex-none ${
                activeSection === 'transfer' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600' 
                  : 'border-[#2d3748] text-[#94a3b8] hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfer
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 lg:flex-none border-[#2d3748] text-[#94a3b8] hover:text-red-400 hover:border-red-400/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Promotion Section */}
        {activeSection === 'promote' && (
          <div className="animate-slide-up space-y-6">
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Link2 className="w-6 h-6 text-emerald-500" />
                  Promote Our Server
                </CardTitle>
                <CardDescription className="text-[#94a3b8]">
                  Share your unique link and earn rewards when players join!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Promotion Link */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-[#94a3b8] text-sm mb-3">Your Personal Promotion Link</p>
                  <div className="flex gap-2">
                    <Input 
                      value={`https://minecraft-server.com/join?ref=${username}`}
                      readOnly
                      className="bg-[#0a0a0f] border-[#2d3748] text-white font-mono text-sm"
                    />
                    <Button 
                      onClick={copyPromotionLink}
                      className={copiedLink ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'}
                    >
                      {copiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Rewards Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748] text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-white font-bold">+100 Points</p>
                    <p className="text-[#94a3b8] text-sm">Per new player</p>
                  </div>
                  <div className="p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748] text-center">
                    <div className="w-12 h-12 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gem className="w-6 h-6 text-violet-500" />
                    </div>
                    <p className="text-white font-bold">+50 Shards</p>
                    <p className="text-[#94a3b8] text-sm">Bonus reward</p>
                  </div>
                  <div className="p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748] text-center">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Coins className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-white font-bold">$1,000</p>
                    <p className="text-[#94a3b8] text-sm">In-game money</p>
                  </div>
                </div>

                {/* Surprise Message */}
                <Alert className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
                  <Gem className="w-5 h-5 text-violet-500" />
                  <AlertDescription className="text-violet-200">
                    <span className="font-bold">Surprise Bonus!</span> Players who bring 10+ friends will receive 
                    a <span className="text-violet-400 font-bold">Legendary Rank</span> upgrade and exclusive 
                    cosmetic items! Keep promoting to unlock hidden rewards!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AFK Section */}
        {activeSection === 'afk' && (
          <div className="animate-slide-up space-y-6">
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Clock className="w-6 h-6 text-violet-500" />
                  AFK Area
                </CardTitle>
                <CardDescription className="text-[#94a3b8]">
                  Stay in this area to earn points automatically!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AFK Status */}
                <div className="relative p-8 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20 text-center">
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isAfk ? 'bg-violet-500 animate-pulse' : 'bg-[#1a1a25]'
                  }`}>
                    <Clock className={`w-12 h-12 ${isAfk ? 'text-white' : 'text-[#64748b]'}`} />
                  </div>
                  
                  <p className="text-4xl font-bold text-white mb-2">
                    {formatTime(afkTime)}
                  </p>
                  <p className="text-[#94a3b8] mb-4">
                    {isAfk ? 'Earning points...' : 'Start AFK to earn'}
                  </p>
                  
                  {afkPoints > 0 && (
                    <div className="mb-4 p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <p className="text-amber-400 font-bold text-lg">
                        +{afkPoints.toFixed(1)} Points Ready!
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => setIsAfk(!isAfk)}
                      className={isAfk 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-violet-600 hover:bg-violet-700'
                      }
                    >
                      {isAfk ? 'Stop AFK' : 'Start AFK'}
                    </Button>
                    {afkPoints > 0 && (
                      <Button
                        onClick={claimAfkPoints}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Claim
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rate Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748] text-center">
                    <p className="text-3xl font-bold text-violet-500">0.50</p>
                    <p className="text-[#94a3b8] text-sm">Points per minute</p>
                  </div>
                  <div className="p-4 bg-[#1a1a25] rounded-lg border border-[#2d3748] text-center">
                    <p className="text-3xl font-bold text-emerald-500">30</p>
                    <p className="text-[#94a3b8] text-sm">Points per hour</p>
                  </div>
                </div>

                {/* Tips */}
                <Alert className="bg-[#1a1a25] border-[#2d3748]">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <AlertDescription className="text-[#94a3b8]">
                    Tip: You can AFK while doing other things. Just keep this page open! 
                    Points accumulate every minute automatically.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transfer Section */}
        {activeSection === 'transfer' && (
          <div className="animate-slide-up space-y-6">
            <Card className="bg-[#12121a] border-[#2d3748]">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-6 h-6 text-amber-500" />
                  Transfer Points
                </CardTitle>
                <CardDescription className="text-[#94a3b8]">
                  Exchange your points for in-game money and shards!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Exchange Rates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Best Value - 10 = 1 Money */}
                  <button
                    onClick={() => setSelectedReward('money10')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedReward === 'money10'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : 'bg-[#1a1a25] border-[#2d3748] hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold flex items-center gap-2">
                        Money
                        <Badge className="bg-emerald-500 text-white text-xs">BEST</Badge>
                      </span>
                      {selectedReward === 'money10' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <p className="text-2xl font-bold text-emerald-500">10 = 1</p>
                    <p className="text-[#94a3b8] text-sm">Points → Money</p>
                  </button>

                  {/* Best Value - 10 = 1 Shards */}
                  <button
                    onClick={() => setSelectedReward('shards10')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedReward === 'shards10'
                        ? 'bg-violet-500/20 border-violet-500'
                        : 'bg-[#1a1a25] border-[#2d3748] hover:border-violet-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold flex items-center gap-2">
                        Shards
                        <Badge className="bg-violet-500 text-white text-xs">BEST</Badge>
                      </span>
                      {selectedReward === 'shards10' && <CheckCircle2 className="w-5 h-5 text-violet-500" />}
                    </div>
                    <p className="text-2xl font-bold text-violet-500">10 = 1</p>
                    <p className="text-[#94a3b8] text-sm">Points → Shards</p>
                  </button>

                  {/* Bulk Money - 1000 = 100 */}
                  <button
                    onClick={() => setSelectedReward('money')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedReward === 'money'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : 'bg-[#1a1a25] border-[#2d3748] hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">Bulk Money</span>
                      {selectedReward === 'money' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <p className="text-2xl font-bold text-emerald-500">1000 = 100</p>
                    <p className="text-[#94a3b8] text-sm">Points → Money</p>
                  </button>

                  {/* Bulk Shards - 1000 = 20 */}
                  <button
                    onClick={() => setSelectedReward('shards')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedReward === 'shards'
                        ? 'bg-violet-500/20 border-violet-500'
                        : 'bg-[#1a1a25] border-[#2d3748] hover:border-violet-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">Bulk Shards</span>
                      {selectedReward === 'shards' && <CheckCircle2 className="w-5 h-5 text-violet-500" />}
                    </div>
                    <p className="text-2xl font-bold text-violet-500">1000 = 20</p>
                    <p className="text-[#94a3b8] text-sm">Points → Shards</p>
                  </button>

                  {/* Mixed - 1000 = 50+10 */}
                  <button
                    onClick={() => setSelectedReward('both')}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedReward === 'both'
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-[#1a1a25] border-[#2d3748] hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold flex items-center gap-2">
                        Mixed Pack
                        <Badge className="bg-amber-500 text-white text-xs">COMBO</Badge>
                      </span>
                      {selectedReward === 'both' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                    </div>
                    <p className="text-2xl font-bold text-amber-500">1000 = 50+10</p>
                    <p className="text-[#94a3b8] text-sm">Money + Shards</p>
                  </button>
                </div>

                {/* Transfer Input */}
                <div className="p-6 bg-[#1a1a25] rounded-xl border border-[#2d3748]">
                  <label className="text-[#94a3b8] text-sm mb-2 block">Amount to Transfer</label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Enter points (min 100)"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="flex-1 bg-[#0a0a0f] border-[#2d3748] text-white"
                    />
                    <Button 
                      onClick={handleTransfer}
                      disabled={!selectedReward || !transferAmount || parseInt(transferAmount) > points}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enter
                    </Button>
                  </div>
                  
                  {transferAmount && selectedReward && (
                    <div className="mt-4 p-3 bg-[#0a0a0f] rounded-lg">
                      <p className="text-[#94a3b8] text-sm">You will receive:</p>
                      <p className="text-white font-bold">
                        {selectedReward === 'money10' && `$${Math.floor(parseInt(transferAmount || '0') / 10)}`}
                        {selectedReward === 'shards10' && `${Math.floor(parseInt(transferAmount || '0') / 10)} Shards`}
                        {selectedReward === 'money' && `$${Math.floor(parseInt(transferAmount || '0') / 10)}`}
                        {selectedReward === 'shards' && `${Math.floor(parseInt(transferAmount || '0') / 50)} Shards`}
                        {selectedReward === 'both' && `$${Math.floor(parseInt(transferAmount || '0') / 20)} + ${Math.floor(parseInt(transferAmount || '0') / 100)} Shards`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <span className="text-[#94a3b8]">Your Balance</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{points.toFixed(1)} Points</span>
                </div>

                {/* Info */}
                <Alert className="bg-[#1a1a25] border-[#2d3748]">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <AlertDescription className="text-[#94a3b8]">
                    After clicking Enter, your request will be sent to admin. 
                    Rewards will be delivered in-game within 24 hours.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
