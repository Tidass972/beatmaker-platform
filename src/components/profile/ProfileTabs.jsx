import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Paper
} from '@mui/material';
import {
    MusicNote,
    Favorite,
    PlaylistPlay,
    ShoppingCart,
    Settings
} from '@mui/icons-material';
import BeatList from './BeatList';
import BeatmakerStats from './BeatmakerStats';
import PlaylistList from '../playlist/PlaylistList';
import TransactionHistory from '../transaction/TransactionHistory';
import ProfileSettings from './ProfileSettings';

const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`profile-tabpanel-${index}`}
        aria-labelledby={`profile-tab-${index}`}
        {...other}
    >
        {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
        )}
    </div>
);

const ProfileTabs = ({ 
    user,
    beats,
    playlists,
    transactions,
    stats,
    isOwnProfile,
    onEditBeat,
    onDeleteBeat,
    onLikeBeat,
    onPurchaseBeat,
    onUpdateProfile
}) => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Paper sx={{ mt: 3 }}>
            <Tabs
                value={currentTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="profile tabs"
            >
                {user.role === 'beatmaker' && (
                    <Tab 
                        icon={<MusicNote />} 
                        label="Beats" 
                        iconPosition="start"
                    />
                )}
                <Tab 
                    icon={<Favorite />} 
                    label="Favorites" 
                    iconPosition="start"
                />
                <Tab 
                    icon={<PlaylistPlay />} 
                    label="Playlists" 
                    iconPosition="start"
                />
                <Tab 
                    icon={<ShoppingCart />} 
                    label={user.role === 'beatmaker' ? 'Sales' : 'Purchases'} 
                    iconPosition="start"
                />
                {isOwnProfile && (
                    <Tab 
                        icon={<Settings />} 
                        label="Settings" 
                        iconPosition="start"
                    />
                )}
            </Tabs>

            {user.role === 'beatmaker' && (
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" gutterBottom>
                            Statistics
                        </Typography>
                        <BeatmakerStats stats={stats} />
                    </Box>
                    
                    <Typography variant="h5" gutterBottom>
                        My Beats
                    </Typography>
                    <BeatList
                        beats={beats}
                        isOwner={isOwnProfile}
                        onEdit={onEditBeat}
                        onDelete={onDeleteBeat}
                        onLike={onLikeBeat}
                        onPurchase={onPurchaseBeat}
                    />
                </TabPanel>
            )}

            <TabPanel value={currentTab} index={user.role === 'beatmaker' ? 1 : 0}>
                <Typography variant="h5" gutterBottom>
                    Favorite Beats
                </Typography>
                <BeatList
                    beats={user.favorites || []}
                    onLike={onLikeBeat}
                    onPurchase={onPurchaseBeat}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={user.role === 'beatmaker' ? 2 : 1}>
                <Typography variant="h5" gutterBottom>
                    Playlists
                </Typography>
                <PlaylistList playlists={playlists} />
            </TabPanel>

            <TabPanel value={currentTab} index={user.role === 'beatmaker' ? 3 : 2}>
                <Typography variant="h5" gutterBottom>
                    {user.role === 'beatmaker' ? 'Sales History' : 'Purchase History'}
                </Typography>
                <TransactionHistory transactions={transactions} />
            </TabPanel>

            {isOwnProfile && (
                <TabPanel value={currentTab} index={user.role === 'beatmaker' ? 4 : 3}>
                    <Typography variant="h5" gutterBottom>
                        Profile Settings
                    </Typography>
                    <ProfileSettings 
                        user={user}
                        onUpdate={onUpdateProfile}
                    />
                </TabPanel>
            )}
        </Paper>
    );
};

export default ProfileTabs;
