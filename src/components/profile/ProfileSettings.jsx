import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Avatar,
    IconButton,
    Card,
    CardContent,
    Stack,
    Switch,
    FormControlLabel,
    Alert
} from '@mui/material';
import {
    PhotoCamera,
    Save,
    Instagram,
    Twitter,
    YouTube
} from '@mui/icons-material';

const ProfileSettings = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        artistName: user.artistName || '',
        email: user.email || '',
        location: user.location || '',
        bio: user.bio || '',
        socialLinks: {
            instagram: user.socialLinks?.instagram || '',
            twitter: user.socialLinks?.twitter || '',
            youtube: user.socialLinks?.youtube || ''
        },
        notifications: {
            email: user.notifications?.email ?? true,
            sales: user.notifications?.sales ?? true,
            messages: user.notifications?.messages ?? true
        }
    });

    const [profilePicture, setProfilePicture] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('social.')) {
            const social = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [social]: value
                }
            }));
        } else if (name.startsWith('notifications.')) {
            const notif = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                notifications: {
                    ...prev.notifications,
                    [notif]: e.target.checked
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size should not exceed 5MB');
                return;
            }
            if (type === 'profile') {
                setProfilePicture(file);
            } else {
                setCoverImage(file);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    formDataToSend.append(key, JSON.stringify(value));
                } else {
                    formDataToSend.append(key, value);
                }
            });

            if (profilePicture) {
                formDataToSend.append('profilePicture', profilePicture);
            }
            if (coverImage) {
                formDataToSend.append('coverImage', coverImage);
            }

            await onUpdate(formDataToSend);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Profile & Cover Images */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Profile Images
                            </Typography>
                            <Stack direction="row" spacing={4} alignItems="center">
                                <Box>
                                    <Avatar
                                        src={profilePicture ? URL.createObjectURL(profilePicture) : user.profilePicture}
                                        sx={{ width: 100, height: 100, mb: 1 }}
                                    />
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="profile-picture"
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'profile')}
                                    />
                                    <label htmlFor="profile-picture">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<PhotoCamera />}
                                            size="small"
                                        >
                                            Change Profile Picture
                                        </Button>
                                    </label>
                                </Box>

                                <Box>
                                    <Box
                                        component="img"
                                        src={coverImage ? URL.createObjectURL(coverImage) : user.coverImage}
                                        sx={{
                                            width: 200,
                                            height: 100,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            mb: 1
                                        }}
                                    />
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="cover-image"
                                        type="file"
                                        onChange={(e) => handleFileChange(e, 'cover')}
                                    />
                                    <label htmlFor="cover-image">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<PhotoCamera />}
                                            size="small"
                                        >
                                            Change Cover Image
                                        </Button>
                                    </label>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Basic Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                {user.role === 'beatmaker' && (
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Artist Name"
                                            name="artistName"
                                            value={formData.artistName}
                                            onChange={handleInputChange}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Bio"
                                        name="bio"
                                        multiline
                                        rows={4}
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Social Links & Notifications */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Social Links
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Instagram"
                                            name="social.instagram"
                                            value={formData.socialLinks.instagram}
                                            onChange={handleInputChange}
                                            InputProps={{
                                                startAdornment: <Instagram sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Twitter"
                                            name="social.twitter"
                                            value={formData.socialLinks.twitter}
                                            onChange={handleInputChange}
                                            InputProps={{
                                                startAdornment: <Twitter sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="YouTube"
                                            name="social.youtube"
                                            value={formData.socialLinks.youtube}
                                            onChange={handleInputChange}
                                            InputProps={{
                                                startAdornment: <YouTube sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Notification Settings
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.notifications.email}
                                            onChange={handleInputChange}
                                            name="notifications.email"
                                        />
                                    }
                                    label="Email Notifications"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.notifications.sales}
                                            onChange={handleInputChange}
                                            name="notifications.sales"
                                        />
                                    }
                                    label="Sales Updates"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.notifications.messages}
                                            onChange={handleInputChange}
                                            name="notifications.messages"
                                        />
                                    }
                                    label="Message Notifications"
                                />
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    size="large"
                >
                    Save Changes
                </Button>
            </Box>
        </Box>
    );
};

export default ProfileSettings;
