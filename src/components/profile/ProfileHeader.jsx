import React from 'react';
import { Box, Avatar, Typography, Button, Stack, IconButton } from '@mui/material';
import { Edit as EditIcon, Instagram, Twitter, YouTube } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const ProfileHeader = ({ user, isOwnProfile, onEditProfile }) => {
    const { user: currentUser } = useAuth();
    const isFollowing = currentUser?.following?.includes(user._id);

    return (
        <Box sx={{ 
            position: 'relative',
            width: '100%',
            height: '300px',
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 4
        }}>
            {/* Cover Image */}
            <Box
                component="img"
                src={user.coverImage || '/default-cover.jpg'}
                alt="Cover"
                sx={{
                    width: '100%',
                    height: '60%',
                    objectFit: 'cover'
                }}
            />

            {/* Profile Info */}
            <Box sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                {/* Avatar */}
                <Avatar
                    src={user.profilePicture}
                    alt={user.artistName || `${user.firstName} ${user.lastName}`}
                    sx={{
                        width: 120,
                        height: 120,
                        border: '4px solid',
                        borderColor: 'background.paper',
                        position: 'absolute',
                        bottom: '50%',
                        left: 40
                    }}
                />

                {/* User Info */}
                <Box sx={{ flex: 1, ml: '180px' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {user.artistName || `${user.firstName} ${user.lastName}`}
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body1" color="text.secondary">
                            {user.role === 'beatmaker' ? 'Beatmaker' : 'Client'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {user.location}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {user.followers?.length || 0} followers
                        </Typography>
                    </Stack>

                    {/* Social Links */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {user.socialLinks?.instagram && (
                            <IconButton 
                                href={user.socialLinks.instagram}
                                target="_blank"
                                size="small"
                            >
                                <Instagram />
                            </IconButton>
                        )}
                        {user.socialLinks?.twitter && (
                            <IconButton 
                                href={user.socialLinks.twitter}
                                target="_blank"
                                size="small"
                            >
                                <Twitter />
                            </IconButton>
                        )}
                        {user.socialLinks?.youtube && (
                            <IconButton 
                                href={user.socialLinks.youtube}
                                target="_blank"
                                size="small"
                            >
                                <YouTube />
                            </IconButton>
                        )}
                    </Stack>
                </Box>

                {/* Actions */}
                <Box>
                    {isOwnProfile ? (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={onEditProfile}
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <Button
                            variant={isFollowing ? "outlined" : "contained"}
                            onClick={() => {/* TODO: Implement follow/unfollow */}}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ProfileHeader;
