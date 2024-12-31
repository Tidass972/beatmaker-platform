import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const api = useApi();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [beats, setBeats] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);

    const isOwnProfile = currentUser?._id === id;

    useEffect(() => {
        loadProfileData();
    }, [id]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            setError('');

            // Load user profile
            const userData = await api.get(`/users/${id}`);
            setUser(userData);

            // Load user's beats if beatmaker
            if (userData.role === 'beatmaker') {
                const [beatsData, statsData] = await Promise.all([
                    api.get(`/beats?producer=${id}`),
                    api.get(`/beats/stats?producer=${id}`)
                ]);
                setBeats(beatsData.beats);
                setStats(statsData);
            }

            // Load playlists
            const playlistsData = await api.get(`/playlists?creator=${id}`);
            setPlaylists(playlistsData.playlists);

            // Load transactions based on role
            const transactionEndpoint = userData.role === 'beatmaker' 
                ? '/transactions/sales' 
                : '/transactions/purchases';
            const transactionsData = await api.get(transactionEndpoint);
            setTransactions(transactionsData.transactions);

        } catch (err) {
            setError(err.message || 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = async (formData) => {
        try {
            const updatedUser = await api.patch(`/users/${id}`, formData);
            setUser(updatedUser);
        } catch (err) {
            throw new Error(err.message || 'Failed to update profile');
        }
    };

    const handleEditBeat = async (beat) => {
        try {
            const updatedBeat = await api.patch(`/beats/${beat._id}`, beat);
            setBeats(prev => prev.map(b => 
                b._id === updatedBeat._id ? updatedBeat : b
            ));
        } catch (err) {
            throw new Error(err.message || 'Failed to update beat');
        }
    };

    const handleDeleteBeat = async (beat) => {
        try {
            await api.delete(`/beats/${beat._id}`);
            setBeats(prev => prev.filter(b => b._id !== beat._id));
        } catch (err) {
            throw new Error(err.message || 'Failed to delete beat');
        }
    };

    const handleLikeBeat = async (beat) => {
        try {
            const endpoint = beat.isLiked ? 'unlike' : 'like';
            await api.post(`/beats/${beat._id}/${endpoint}`);
            setBeats(prev => prev.map(b => 
                b._id === beat._id 
                    ? { ...b, isLiked: !b.isLiked, stats: { 
                        ...b.stats, 
                        likes: b.stats.likes + (b.isLiked ? -1 : 1) 
                    }} 
                    : b
            ));
        } catch (err) {
            throw new Error(err.message || 'Failed to like/unlike beat');
        }
    };

    const handlePurchaseBeat = async (beat) => {
        try {
            const session = await api.post('/transactions/checkout', {
                beatId: beat._id,
                licenseType: 'basic' // Default to basic license
            });
            
            // Redirect to Stripe checkout
            window.location.href = session.url;
        } catch (err) {
            throw new Error(err.message || 'Failed to initiate purchase');
        }
    };

    if (loading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 3 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 3 }}>
                    User not found
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <ProfileHeader 
                    user={user}
                    isOwnProfile={isOwnProfile}
                    onEditProfile={() => {/* Handled by ProfileTabs */}}
                />

                <ProfileTabs
                    user={user}
                    beats={beats}
                    playlists={playlists}
                    transactions={transactions}
                    stats={stats}
                    isOwnProfile={isOwnProfile}
                    onEditBeat={handleEditBeat}
                    onDeleteBeat={handleDeleteBeat}
                    onLikeBeat={handleLikeBeat}
                    onPurchaseBeat={handlePurchaseBeat}
                    onUpdateProfile={handleEditProfile}
                />
            </Box>
        </Container>
    );
};

export default Profile;
