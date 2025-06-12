import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Palette, Globe, Settings, CreditCard, Lock } from "lucide-react"

function SettingsPage() {
  return (
    <div className="bg-card">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Customization
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Profile Section */}
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
                    Z
                  </div>
                  <div>
                    <h3 className="font-medium">@zwgnr</h3>
                    <p className="text-muted-foreground text-sm">user@example.com</p>
                    <p className="text-muted-foreground text-xs mt-1">Member since December 2024</p>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Language & Region */}
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Language & Region
                </CardTitle>
                <p className="text-muted-foreground text-sm">Set your language and regional preferences</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Language</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Time Zone</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Date Format</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customization" className="space-y-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  Appearance
                </CardTitle>
                <p className="text-muted-foreground text-sm">Customize how the app looks and feels</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Theme</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Font Size</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Layout</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Subscription Plan
                </CardTitle>
                <p className="text-muted-foreground text-sm">Manage your subscription and billing</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Free Plan</h3>
                    <p className="text-muted-foreground text-sm">Basic features with limited usage</p>
                    <p className="text-xs text-muted-foreground mt-1">$0/month</p>
                  </div>
                  <Button className="w-full">Upgrade to Pro</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Payment Method</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Add Card
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Billing History</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Download Invoices</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Download
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Privacy & Security */}
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Privacy & Security
                </CardTitle>
                <p className="text-muted-foreground text-sm">Control your privacy and security settings</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Two-Factor Authentication</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Data Export</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Export
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Account Deletion</span>
                    <Button variant="ghost" size="sm" className="text-xs text-red-600">
                      Delete
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notifications
                </CardTitle>
                <p className="text-muted-foreground text-sm">Configure notification preferences</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Email Notifications</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Push Notifications</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                  <li className="flex items-center justify-between py-2">
                    <span className="text-sm">Sound Alerts</span>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Configure
                    </Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_layout/settings')({
  component: SettingsPage,
}) 