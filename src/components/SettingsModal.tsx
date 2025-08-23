'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { formatBytes } from '@/lib/utils';
import {
  Settings,
  User,
  Shield,
  Database,
  Bell,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Save,
  X,
  Camera,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
  });

  // Security settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      desktop: true,
      sharing: true,
      storage: true,
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser(profileData);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                onClick={() => toast.info('Avatar upload not implemented yet')}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
              <Badge variant="premium" className="mt-2">Premium User</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">First Name</label>
              <Input
                value={profileData.firstName}
                onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Last Name</label>
              <Input
                value={profileData.lastName}
                onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Username</label>
            <Input
              value={profileData.username}
              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email"
              type="email"
            />
          </div>
          <Button onClick={handleProfileUpdate} disabled={isLoading} className="btn-premium">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Current Password</label>
            <div className="relative">
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button 
            onClick={handlePasswordChange} 
            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword}
            className="btn-premium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Changing...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderStorageTab = () => {
    const storageUsed = user ? parseInt(user.storageUsed) : 0;
    const storageLimit = user ? parseInt(user.storageLimit) : 5368709120; // 5GB
    const storagePercentage = (storageUsed / storageLimit) * 100;

    return (
      <div className="space-y-6">
        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
            <CardDescription>Monitor your cloud storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Used Storage</span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(storageUsed)} of {formatBytes(storageLimit)}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{user?.fileCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Files</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{user?.folderCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Folders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">{storagePercentage.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Management</CardTitle>
            <CardDescription>Manage your storage and files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => toast.info('Feature coming soon')}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" onClick={() => toast.info('Feature coming soon')}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Trash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription>Customize your interface theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((theme) => (
              <Button
                key={theme.id}
                variant={preferences.theme === theme.id ? 'default' : 'outline'}
                onClick={() => setPreferences(prev => ({ ...prev, theme: theme.id }))}
                className="flex flex-col h-16"
              >
                <theme.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{theme.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
              { key: 'desktop', label: 'Desktop Notifications', description: 'Show browser notifications' },
              { key: 'sharing', label: 'Sharing Updates', description: 'Notifications about shared files' },
              { key: 'storage', label: 'Storage Alerts', description: 'Alerts when storage is nearly full' },
            ].map((notification) => (
              <div key={notification.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{notification.label}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                </div>
                <Button
                  variant={preferences.notifications[notification.key as keyof typeof preferences.notifications] ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      [notification.key]: !prev.notifications[notification.key as keyof typeof prev.notifications]
                    }
                  }))}
                >
                  {preferences.notifications[notification.key as keyof typeof preferences.notifications] ? 'On' : 'Off'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Manage your account and preferences
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/30 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full justify-start"
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'storage' && renderStorageTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
