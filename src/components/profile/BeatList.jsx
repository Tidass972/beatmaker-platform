import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Stack,
    Tooltip
} from '@mui/material';
import {
    PlayArrow,
    Pause,
    MoreVert,
    Edit,
    Delete,
    ShoppingCart,
    Favorite,
    FavoriteBorder
} from '@mui/icons-material';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

const BeatCard = ({ beat, isOwner, onEdit, onDelete, onLike, onPurchase }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { 
        isPlaying, 
        currentBeatId, 
        togglePlay 
    } = useAudioPlayer();

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAction = (action) => {
        handleMenuClose();
        switch(action) {
            case 'edit':
                onEdit(beat);
                break;
            case 'delete':
                onDelete(beat);
                break;
            default:
                break;
        }
    };

    const isCurrentlyPlaying = isPlaying && currentBeatId === beat._id;

    return (
        <Card 
            sx={{ 
                display: 'flex', 
                mb: 2,
                '&:hover': {
                    boxShadow: 6
                }
            }}
        >
            {/* Cover Image */}
            <CardMedia
                component="img"
                sx={{ width: 151 }}
                image={beat.coverImage}
                alt={beat.title}
            />

            {/* Beat Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography component="div" variant="h6">
                                {beat.title}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                {beat.genre}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <Tooltip title={isCurrentlyPlaying ? 'Pause' : 'Play'}>
                                <IconButton 
                                    onClick={() => togglePlay(beat._id, beat.audioPreview)}
                                >
                                    {isCurrentlyPlaying ? <Pause /> : <PlayArrow />}
                                </IconButton>
                            </Tooltip>

                            <IconButton onClick={(e) => onLike(beat)}>
                                {beat.isLiked ? 
                                    <Favorite color="error" /> : 
                                    <FavoriteBorder />
                                }
                            </IconButton>

                            {isOwner && (
                                <>
                                    <IconButton onClick={handleMenuOpen}>
                                        <MoreVert />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                    >
                                        <MenuItem onClick={() => handleAction('edit')}>
                                            <Edit sx={{ mr: 1 }} /> Edit
                                        </MenuItem>
                                        <MenuItem onClick={() => handleAction('delete')}>
                                            <Delete sx={{ mr: 1 }} /> Delete
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* Tags */}
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip 
                            label={`${beat.bpm} BPM`} 
                            size="small" 
                            variant="outlined"
                        />
                        <Chip 
                            label={beat.key} 
                            size="small" 
                            variant="outlined"
                        />
                        {beat.mood && (
                            <Chip 
                                label={beat.mood} 
                                size="small" 
                                variant="outlined"
                            />
                        )}
                    </Stack>

                    {/* Stats & Price */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 2
                    }}>
                        <Stack direction="row" spacing={2}>
                            <Typography variant="body2" color="text.secondary">
                                {beat.stats.plays} plays
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {beat.stats.likes} likes
                            </Typography>
                        </Stack>

                        <Box>
                            <Typography 
                                variant="h6" 
                                component="span"
                                color="primary"
                                sx={{ mr: 1 }}
                            >
                                ${beat.licenses.basic.price}
                            </Typography>
                            <Tooltip title="Purchase">
                                <IconButton 
                                    color="primary"
                                    onClick={() => onPurchase(beat)}
                                >
                                    <ShoppingCart />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </CardContent>
            </Box>
        </Card>
    );
};

const BeatList = ({ 
    beats, 
    isOwner = false,
    onEdit,
    onDelete,
    onLike,
    onPurchase
}) => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                {beats.map(beat => (
                    <BeatCard
                        key={beat._id}
                        beat={beat}
                        isOwner={isOwner}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onLike={onLike}
                        onPurchase={onPurchase}
                    />
                ))}
            </Grid>
        </Grid>
    );
};

export default BeatList;
