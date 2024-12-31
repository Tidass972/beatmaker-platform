import React from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Grid,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {
    TrendingUp,
    MusicNote,
    ShoppingCart,
    Stars
} from '@mui/icons-material';

const StatCard = ({ icon: Icon, title, value, subtitle, progress }) => (
    <Card elevation={0} sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Icon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
            </Box>
            
            <Typography variant="h4" component="div" gutterBottom>
                {value}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
                {subtitle}
            </Typography>

            {progress !== undefined && (
                <Tooltip title={`${progress}% increase from last month`}>
                    <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>
                </Tooltip>
            )}
        </CardContent>
    </Card>
);

const BeatmakerStats = ({ stats }) => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={TrendingUp}
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    subtitle="Lifetime earnings"
                    progress={stats.revenueGrowth}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={MusicNote}
                    title="Active Beats"
                    value={stats.activeBeats}
                    subtitle={`${stats.totalBeats} total beats`}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={ShoppingCart}
                    title="Total Sales"
                    value={stats.totalSales}
                    subtitle={`${stats.salesThisMonth} this month`}
                    progress={stats.salesGrowth}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    icon={Stars}
                    title="Average Rating"
                    value={stats.averageRating.toFixed(1)}
                    subtitle={`${stats.totalRatings} ratings`}
                />
            </Grid>
        </Grid>
    );
};

export default BeatmakerStats;
