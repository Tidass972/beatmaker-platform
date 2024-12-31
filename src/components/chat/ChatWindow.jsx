import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Badge,
    CircularProgress,
    Tooltip,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Send,
    AttachFile,
    MoreVert,
    Close,
    Block,
    Report,
    Delete
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

const Message = ({ message, isOwnMessage }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            mb: 2
        }}
    >
        {!isOwnMessage && (
            <Avatar
                src={message.sender.picture}
                alt={message.sender.name}
                sx={{ width: 32, height: 32, mr: 1 }}
            />
        )}
        <Box>
            <Paper
                elevation={1}
                sx={{
                    p: 1,
                    maxWidth: '70%',
                    bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                    color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2
                }}
            >
                <Typography variant="body1">
                    {message.content}
                </Typography>
            </Paper>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
            >
                {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
            </Typography>
        </Box>
    </Box>
);

const ChatWindow = ({ conversation, onClose }) => {
    const { user } = useAuth();
    const { 
        messages,
        sendMessage,
        markAsRead,
        loadMoreMessages,
        setTypingStatus
    } = useChat(conversation.id);
    
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);

    const otherParticipant = conversation.participants.find(
        p => p._id !== user._id
    );

    useEffect(() => {
        scrollToBottom();
        markAsRead(conversation.id);
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = () => {
        const { scrollTop } = messageListRef.current;
        if (scrollTop === 0) {
            loadMoreMessages(conversation.id);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        
        try {
            await sendMessage(conversation.id, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        setTypingStatus(conversation.id, true);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleBlock = async () => {
        // TODO: Implement block functionality
        handleMenuClose();
    };

    const handleReport = async () => {
        // TODO: Implement report functionality
        handleMenuClose();
    };

    const handleDelete = async () => {
        // TODO: Implement delete conversation functionality
        handleMenuClose();
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                width: 360,
                height: 480,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={conversation.isOnline ? 'success' : 'error'}
                    >
                        <Avatar
                            src={otherParticipant.profilePicture}
                            alt={otherParticipant.artistName}
                        />
                    </Badge>
                    <Box sx={{ ml: 1 }}>
                        <Typography variant="subtitle1">
                            {otherParticipant.artistName}
                        </Typography>
                        {conversation.isTyping && (
                            <Typography variant="caption" color="text.secondary">
                                typing...
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box>
                    <IconButton size="small" onClick={handleMenuOpen}>
                        <MoreVert />
                    </IconButton>
                    <IconButton size="small" onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </Box>

            {/* Messages */}
            <Box
                ref={messageListRef}
                onScroll={handleScroll}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    bgcolor: 'background.default'
                }}
            >
                {loading && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
                {messages.map((message) => (
                    <Message
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender.id === user._id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                    />
                    <Tooltip title="Send">
                        <IconButton 
                            color="primary"
                            onClick={handleSend}
                            disabled={!newMessage.trim()}
                        >
                            <Send />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleBlock}>
                    <Block sx={{ mr: 1 }} /> Block User
                </MenuItem>
                <MenuItem onClick={handleReport}>
                    <Report sx={{ mr: 1 }} /> Report User
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <Delete sx={{ mr: 1 }} /> Delete Conversation
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default ChatWindow;
