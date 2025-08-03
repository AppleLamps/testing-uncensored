/* ===== SIDEBAR & CHAT MANAGEMENT SYSTEM ===== */

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatArea = document.getElementById('chatArea');
const attachBtn = document.getElementById('attachBtn');
const sendBtn = document.getElementById('sendBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// State Management
let currentChatId = null;
let chats = {};
let sidebarExpanded = localStorage.getItem('sidebarExpanded') === 'true';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadChatsFromStorage();
    initializeSidebar();
    setupEventListeners();
    
    // Create initial chat if none exist
    if (Object.keys(chats).length === 0) {
        createNewChat();
    } else {
        // Load the most recent chat
        const chatIds = Object.keys(chats).sort((a, b) => 
            new Date(chats[b].lastUpdated) - new Date(chats[a].lastUpdated)
        );
        switchToChat(chatIds[0]);
    }
});

/* ===== SIDEBAR FUNCTIONALITY ===== */

function initializeSidebar() {
    if (sidebarExpanded) {
        sidebar.classList.add('expanded');
    }
    renderChatList();
}

function toggleSidebar() {
    sidebarExpanded = !sidebarExpanded;
    sidebar.classList.toggle('expanded', sidebarExpanded);
    localStorage.setItem('sidebarExpanded', sidebarExpanded);
}

/* ===== CHAT MANAGEMENT ===== */

function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createNewChat() {
    const chatId = generateChatId();
    const now = new Date().toISOString();
    
    chats[chatId] = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        created: now,
        lastUpdated: now
    };
    
    switchToChat(chatId);
    saveChatsToStorage();
    renderChatList();
    
    // Clear chat area and show welcome message
    clearChatArea();
    addWelcomeMessage();
}

function switchToChat(chatId) {
    if (!chats[chatId]) return;
    
    // Save current chat state if switching from another chat
    if (currentChatId && currentChatId !== chatId) {
        saveCurrentChatMessages();
    }
    
    currentChatId = chatId;
    loadChatMessages(chatId);
    renderChatList(); // Update active state
    scrollToBottom();
}

function deleteChat(chatId) {
    if (!chats[chatId]) return;
    
    delete chats[chatId];
    saveChatsToStorage();
    
    // If deleting current chat, switch to another or create new
    if (currentChatId === chatId) {
        const remainingChats = Object.keys(chats);
        if (remainingChats.length > 0) {
            switchToChat(remainingChats[0]);
        } else {
            createNewChat();
        }
    }
    
    renderChatList();
}

function updateChatTitle(chatId, newTitle) {
    if (!chats[chatId]) return;
    
    chats[chatId].title = newTitle.substring(0, 50); // Limit title length
    chats[chatId].lastUpdated = new Date().toISOString();
    saveChatsToStorage();
    renderChatList();
}

function clearAllChatHistory() {
    // Double confirmation to prevent accidental deletion
    const confirmMessage = 'Are you sure you want to delete ALL chat history? This action cannot be undone.';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Second confirmation for extra safety
    const finalConfirm = 'This will permanently delete all your conversations. Are you absolutely sure?';
    
    if (!confirm(finalConfirm)) {
        return;
    }
    
    // Clear all chats
    chats = {};
    currentChatId = null;
    
    // Remove from localStorage
    try {
        localStorage.removeItem('uncensoredai_chats');
    } catch (error) {
        console.warn('Failed to clear chats from localStorage:', error);
    }
    
    // Create a new default chat
    createNewChat();
    
    // Show success feedback
    setTimeout(() => {
        alert('Chat history has been cleared successfully.');
    }, 100);
}

/* ===== MESSAGE MANAGEMENT ===== */

function addWelcomeMessage() {
    const welcomeMessage = {
        sender: 'ai',
        text: 'Welcome To Uncensored AI',
        timestamp: new Date().toISOString(),
        hasUpgrade: true
    };
    
    renderMessage(welcomeMessage);
}

function saveCurrentChatMessages() {
    if (!currentChatId) return;
    
    const messages = [];
    const messageElements = chatArea.querySelectorAll('.message-wrapper');
    
    messageElements.forEach(elem => {
        const isUser = elem.classList.contains('user-message');
        const textContent = elem.querySelector('.message-bubble p')?.textContent || '';
        const hasUpgrade = elem.querySelector('.upgrade-btn') !== null;
        
        if (textContent) {
            messages.push({
                sender: isUser ? 'user' : 'ai',
                text: textContent,
                timestamp: new Date().toISOString(),
                hasUpgrade: hasUpgrade
            });
        }
    });
    
    chats[currentChatId].messages = messages;
    chats[currentChatId].lastUpdated = new Date().toISOString();
}

function loadChatMessages(chatId) {
    if (!chats[chatId]) return;
    
    clearChatArea();
    const messages = chats[chatId].messages;
    
    if (messages.length === 0) {
        addWelcomeMessage();
    } else {
        messages.forEach(message => renderMessage(message));
    }
}

function clearChatArea() {
    chatArea.innerHTML = '';
}

function renderMessage(message) {
    const wrap = document.createElement('div');
    wrap.className = 'message-wrapper ' + (message.sender === 'user' ? 'user-message' : 'ai-message');
    
    // Create action buttons HTML
    const actionButtons = `
        <div class="message-actions">
            <button class="action-btn" data-action="copy" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
            </button>
            <button class="action-btn" data-action="like" title="Like">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M7 10v12l4-4 4 4V10"/>
                    <path d="M5 6h14l-1 4H6z"/>
                </svg>
            </button>
            <button class="action-btn" data-action="dislike" title="Dislike">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 14V2l-4 4-4-4v12"/>
                    <path d="M19 18H5l1-4h12z"/>
                </svg>
            </button>
            <button class="action-btn" data-action="share" title="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
            </button>
            <button class="action-btn" data-action="more" title="More">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                </svg>
            </button>
        </div>
    `;
    
    // Create attachments HTML
    let attachmentsHTML = '';
    if (message.attachments && message.attachments.length > 0) {
        attachmentsHTML = '<div class="message-attachments">';
        
        message.attachments.forEach(attachment => {
            if (attachment.type === 'image') {
                attachmentsHTML += `
                    <div class="message-attachment image-attachment">
                        <img src="${attachment.data}" alt="${attachment.name}" class="message-image" onclick="openImageModal(this)">
                        <div class="image-caption">${attachment.name}</div>
                    </div>
                `;
            } else {
                const fileIcon = getFileIcon(attachment.fileType);
                attachmentsHTML += `
                    <div class="message-attachment file-attachment">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-info">
                            <span class="file-name">${attachment.name}</span>
                            <span class="file-size">${formatFileSize(attachment.size)}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        attachmentsHTML += '</div>';
    }
    
    if (message.sender === 'user') {
        wrap.innerHTML = `
            <div class="message-bubble">
                ${message.text ? `<p>${message.text}</p>` : ''}
                ${attachmentsHTML}
            </div>
            ${actionButtons}`;
    } else {
        wrap.innerHTML = `
            <div class="ai-icon message-icon"></div>
            <div class="message-bubble">
                <p>${message.text}</p>
                ${message.hasUpgrade ? '<button class="upgrade-btn">Upgrade to Pro</button>' : ''}
                ${attachmentsHTML}
            </div>
            ${actionButtons}`;
    }
    
    // Add event listeners for action buttons
    setupMessageActionListeners(wrap);
    
    chatArea.appendChild(wrap);
}

function addMessage(sender, text, hasUpgrade = false) {
    const message = {
        sender: sender,
        text: text,
        timestamp: new Date().toISOString(),
        hasUpgrade: hasUpgrade
    };
    
    renderMessage(message);
    
    // Add to current chat
    if (currentChatId && chats[currentChatId]) {
        chats[currentChatId].messages.push(message);
        chats[currentChatId].lastUpdated = new Date().toISOString();
        
        // Auto-generate title from first user message
        if (sender === 'user' && chats[currentChatId].title === 'New Chat') {
            const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            updateChatTitle(currentChatId, title);
        }
        
        saveChatsToStorage();
    }
    
    scrollToBottom();
}

function addMessageWithAttachments(sender, text, attachments = []) {
    const message = {
        sender: sender,
        text: text,
        attachments: attachments,
        timestamp: new Date().toISOString()
    };
    
    renderMessage(message);
    
    // Add to current chat
    if (currentChatId && chats[currentChatId]) {
        chats[currentChatId].messages.push(message);
        chats[currentChatId].lastUpdated = new Date().toISOString();
        
        // Auto-generate title from first user message
        if (sender === 'user' && chats[currentChatId].title === 'New Chat') {
            const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            updateChatTitle(currentChatId, title);
        }
        
        saveChatsToStorage();
    }
    
    scrollToBottom();
}

/* ===== CHAT LIST RENDERING ===== */

function renderChatList() {
    if (!chatList) return;
    
    const chatIds = Object.keys(chats).sort((a, b) => 
        new Date(chats[b].lastUpdated) - new Date(chats[a].lastUpdated)
    );
    
    if (chatIds.length === 0) {
        chatList.innerHTML = '<div class="no-chats-message"><em>No previous chats yet</em></div>';
        return;
    }
    
    chatList.innerHTML = chatIds.map(chatId => {
        const chat = chats[chatId];
        const isActive = chatId === currentChatId;
        const lastMessage = chat.messages[chat.messages.length - 1];
        const preview = lastMessage ? lastMessage.text.substring(0, 40) + '...' : 'New chat';
        
        return `
            <div class="chat-item-wrapper">
                <button class="chat-item ${isActive ? 'active' : ''}" 
                        data-chat-id="${chatId}" 
                        title="${chat.title}">
                    <div class="chat-content">
                        <div style="font-weight: 500; margin-bottom: 2px;">${chat.title}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); opacity: 0.8;">${preview}</div>
                    </div>
                </button>
                <button class="chat-delete-btn" data-chat-id="${chatId}" title="Delete chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    // Add event listeners to chat items
    chatList.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const chatId = e.currentTarget.dataset.chatId;
            switchToChat(chatId);
        });
    });
    
    // Add event listeners to delete buttons
    chatList.querySelectorAll('.chat-delete-btn').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering chat selection
            const chatId = e.currentTarget.dataset.chatId;
            if (confirm('Delete this chat?')) {
                deleteChat(chatId);
            }
        });
    });
}

/* ===== LOCAL STORAGE ===== */

function saveChatsToStorage() {
    try {
        localStorage.setItem('uncensoredai_chats', JSON.stringify(chats));
    } catch (error) {
        console.warn('Failed to save chats to localStorage:', error);
    }
}

function loadChatsFromStorage() {
    try {
        const stored = localStorage.getItem('uncensoredai_chats');
        if (stored) {
            chats = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load chats from localStorage:', error);
        chats = {};
    }
}

/* ===== EVENT LISTENERS ===== */

function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle?.addEventListener('click', toggleSidebar);
    
    // New chat button
    newChatBtn?.addEventListener('click', createNewChat);
    
    // Clear history button removed - individual delete buttons now handle chat deletion
    
    // Chat form submission
    chatForm?.addEventListener('submit', handleChatSubmit);
    
    // Input field events
    userInput?.addEventListener('input', () => {
        autosize();
        updateSendButtonState();
    });
    
    // Enter to send, Shift+Enter for newline
    userInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });
    
    // File attach
    attachBtn?.addEventListener('click', handleFileAttach);
    
    // Auto-collapse sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar?.classList.remove('expanded');
        sidebarExpanded = false;
    }
}

/* ===== CHAT FUNCTIONALITY ===== */

function handleChatSubmit(e) {
    e.preventDefault();
    const text = userInput.value.trim();
    const attachmentContainer = document.querySelector('.attachment-container');
    
    // Check if we have text or attachments
    if (!text && !attachmentContainer) return;
    
    // Collect attachment data
    let attachments = [];
    let attachmentInfo = '';
    if (attachmentContainer) {
        const attachmentItems = Array.from(attachmentContainer.querySelectorAll('.attachment-item'));
        
        attachmentItems.forEach(item => {
            const fileName = item.dataset.fileName;
            const fileType = item.dataset.fileType;
            const fileSize = item.dataset.fileSize;
            
            // Check if it's an image and get the image data
            if (fileType.startsWith('image/')) {
                const img = item.querySelector('.preview-image');
                if (img && img.src) {
                    attachments.push({
                        type: 'image',
                        name: fileName,
                        size: fileSize,
                        data: img.src // This contains the base64 data URL
                    });
                }
            } else {
                attachments.push({
                    type: 'file',
                    name: fileName,
                    size: fileSize,
                    fileType: fileType
                });
            }
        });
        
        const attachmentNames = attachments.map(att => att.name);
        attachmentInfo = attachmentNames.length > 0 ? ` [Attachments: ${attachmentNames.join(', ')}]` : '';
    }
    
    // Create message text (without attachment info for display)
    const messageText = text;
    
    // Add user message with attachments
    addMessageWithAttachments('user', messageText, attachments);
    
    // Clear input and attachments
    userInput.value = '';
    if (attachmentContainer) {
        attachmentContainer.remove();
    }
    
    autosize();
    updateSendButtonState();
    
    // Get AI response from OpenRouter API
    getAIResponse(messageText, attachments);
}

function handleFileAttach() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
    input.multiple = true;
    input.onchange = () => {
        const files = Array.from(input.files || []);
        if (files.length > 0) {
            handleFileSelection(files);
        }
    };
    input.click();
}

function handleFileSelection(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const otherFiles = files.filter(file => !file.type.startsWith('image/'));
    
    // Handle non-image files immediately
    otherFiles.forEach(file => {
        addAttachmentToComposer(file, false);
    });
    
    // Handle image files with preview
    imageFiles.forEach(file => {
        addAttachmentToComposer(file, true);
    });
}

function addAttachmentToComposer(file, isImage) {
    // Create attachment container if it doesn't exist
    let attachmentContainer = document.querySelector('.attachment-container');
    if (!attachmentContainer) {
        attachmentContainer = document.createElement('div');
        attachmentContainer.className = 'attachment-container';
        
        // Insert before composer-bottom
        const composerBottom = document.querySelector('.composer-bottom');
        composerBottom.parentNode.insertBefore(attachmentContainer, composerBottom);
    }
    
    // Create attachment item
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'attachment-item';
    attachmentItem.dataset.fileName = file.name;
    attachmentItem.dataset.fileSize = file.size;
    attachmentItem.dataset.fileType = file.type;
    
    // Function to add remove functionality
    const addRemoveFunctionality = () => {
        const removeBtn = attachmentItem.querySelector('.remove-attachment');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                attachmentItem.remove();
                
                // Remove container if no attachments left
                if (attachmentContainer.children.length === 0) {
                    attachmentContainer.remove();
                }
                
                updateSendButtonState();
            });
        }
    };
    
    if (isImage) {
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            attachmentItem.innerHTML = `
                <div class="attachment-preview">
                    <img src="${e.target.result}" alt="${file.name}" class="preview-image">
                    <div class="attachment-overlay">
                        <div class="attachment-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                        <button class="remove-attachment" title="Remove attachment">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            // Add remove functionality after HTML is set
            addRemoveFunctionality();
        };
        reader.readAsDataURL(file);
    } else {
        // Create file attachment (non-image)
        const fileIcon = getFileIcon(file.type);
        attachmentItem.innerHTML = `
            <div class="attachment-preview file-attachment">
                <div class="file-icon">${fileIcon}</div>
                <div class="attachment-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button class="remove-attachment" title="Remove attachment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
        // Add remove functionality after HTML is set
        addRemoveFunctionality();
    }
    
    attachmentContainer.appendChild(attachmentItem);
    updateSendButtonState();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('text')) return '📄';
    return '📎';
}

function updateSendButtonState() {
    const hasText = userInput.value.trim().length > 0;
    const hasAttachments = document.querySelector('.attachment-container') !== null;
    sendBtn.disabled = !hasText && !hasAttachments;
}

/* ===== UTILITIES ===== */

function scrollToBottom() {
    if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

function autosize() {
    if (!userInput) return;
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 152) + 'px';
}

function toggleSendDisabled() {
    if (!sendBtn || !userInput) return;
    const hasText = userInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

async function getAIResponse(userMessage, attachments = []) {
    try {
        // Show typing indicator
        addTypingIndicator();
        
        // Prepare messages for API
        const messages = [];
        
        // Add conversation history from current chat
        if (currentChatId && chats[currentChatId]) {
            const chatMessages = chats[currentChatId].messages;
            // Get last 10 messages for context (excluding the just-added user message)
            const recentMessages = chatMessages.slice(-11, -1);
            
            recentMessages.forEach(msg => {
                messages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            });
        }
        
        // Add current user message
        let content = userMessage;
        if (attachments.length > 0) {
            const attachmentNames = attachments.map(att => att.name).join(', ');
            content += ` [Note: User attached files: ${attachmentNames}]`;
        }
        
        messages.push({
            role: 'user',
            content: content
        });
        
        // Make API call to OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_OPENROUTER_API_KEY', // Replace with your actual API key
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Uncensored AI Chat',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3',
                messages: messages
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
        
        // Remove typing indicator and add AI response
        removeTypingIndicator();
        addMessage('ai', aiResponse);
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        
        let errorMessage = 'Sorry, I\'m having trouble connecting right now. ';
        if (error.message.includes('401')) {
            errorMessage += 'Please check your API key configuration.';
        } else if (error.message.includes('429')) {
            errorMessage += 'Rate limit exceeded. Please try again later.';
        } else {
            errorMessage += 'Please try again in a moment.';
        }
        
        addMessage('ai', errorMessage);
    }
}

function addTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message-wrapper ai-message typing-indicator';
    typingIndicator.innerHTML = `
        <div class="ai-icon message-icon"></div>
        <div class="message-bubble">
            <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatArea.appendChild(typingIndicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/* ===== IMAGE MODAL ===== */

function openImageModal(img) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    // Create modal image
    const modalImg = document.createElement('img');
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;
    
    modal.appendChild(modalImg);
    document.body.appendChild(modal);
    
    // Close modal on click
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Close modal on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/* ===== MESSAGE ACTION HANDLERS ===== */

function setupMessageActionListeners(messageWrapper) {
    const actionButtons = messageWrapper.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = button.dataset.action;
            const messageText = messageWrapper.querySelector('.message-bubble p')?.textContent || '';
            
            handleMessageAction(action, messageText, messageWrapper);
        });
    });
}

function handleMessageAction(action, messageText, messageWrapper) {
    switch (action) {
        case 'copy':
            handleCopyAction(messageText);
            break;
        case 'like':
            handleLikeAction(messageWrapper);
            break;
        case 'dislike':
            handleDislikeAction(messageWrapper);
            break;
        case 'share':
            handleShareAction(messageText);
            break;
        case 'more':
            handleMoreAction(messageWrapper);
            break;
        default:
            console.warn('Unknown action:', action);
    }
}

function handleAudioAction(messageText) {
    if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(messageText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        showActionFeedback('🔊 Reading message aloud...');
    } else {
        showActionFeedback('❌ Text-to-speech not supported in this browser');
    }
}

function handleCopyAction(messageText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(messageText).then(() => {
            showActionFeedback('✅ Message copied to clipboard');
        }).catch(() => {
            fallbackCopyToClipboard(messageText);
        });
    } else {
        fallbackCopyToClipboard(messageText);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showActionFeedback('✅ Message copied to clipboard');
    } catch (err) {
        showActionFeedback('❌ Failed to copy message');
    }
    
    document.body.removeChild(textArea);
}

function handleShareAction(messageText) {
    if (navigator.share) {
        navigator.share({
            title: 'Uncensored AI Chat Message',
            text: messageText,
            url: window.location.href
        }).then(() => {
            showActionFeedback('✅ Message shared successfully');
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                fallbackShareAction(messageText);
            }
        });
    } else {
        fallbackShareAction(messageText);
    }
}

function fallbackShareAction(messageText) {
    const shareData = `Check out this message from Uncensored AI:\n\n"${messageText}"\n\n${window.location.href}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareData).then(() => {
            showActionFeedback('✅ Share link copied to clipboard');
        }).catch(() => {
            showActionFeedback('❌ Sharing not supported in this browser');
        });
    } else {
        showActionFeedback('❌ Sharing not supported in this browser');
    }
}

function handleLikeAction(messageWrapper) {
    const likeBtn = messageWrapper.querySelector('[data-action="like"]');
    const isLiked = likeBtn.classList.contains('liked');
    
    if (isLiked) {
        likeBtn.classList.remove('liked');
        likeBtn.style.color = '#6B7280';
        showActionFeedback('👍 Like removed');
    } else {
        likeBtn.classList.add('liked');
        likeBtn.style.color = '#10B981';
        
        // Remove dislike if it was active
        const dislikeBtn = messageWrapper.querySelector('[data-action="dislike"]');
        dislikeBtn.classList.remove('disliked');
        dislikeBtn.style.color = '#6B7280';
        
        showActionFeedback('👍 Message liked');
    }
}

function handleDislikeAction(messageWrapper) {
    const dislikeBtn = messageWrapper.querySelector('[data-action="dislike"]');
    const isDisliked = dislikeBtn.classList.contains('disliked');
    
    if (isDisliked) {
        dislikeBtn.classList.remove('disliked');
        dislikeBtn.style.color = '#6B7280';
        showActionFeedback('👎 Dislike removed');
    } else {
        dislikeBtn.classList.add('disliked');
        dislikeBtn.style.color = '#EF4444';
        
        // Remove like if it was active
        const likeBtn = messageWrapper.querySelector('[data-action="like"]');
        likeBtn.classList.remove('liked');
        likeBtn.style.color = '#6B7280';
        
        showActionFeedback('👎 Message disliked');
    }
}

function handleMoreAction(messageWrapper) {
    // Create a simple context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px 0;
        z-index: 1000;
        min-width: 150px;
        font-size: 14px;
    `;
    
    const menuItems = [
        { label: 'Edit message', action: 'edit' },
        { label: 'Delete message', action: 'delete' },
        { label: 'Report message', action: 'report' }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.textContent = item.label;
        menuItem.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s ease;
        `;
        
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = '#F3F4F6';
        });
        
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        
        menuItem.addEventListener('click', () => {
            showActionFeedback(`${item.label} - Feature coming soon!`);
            document.body.removeChild(contextMenu);
        });
        
        contextMenu.appendChild(menuItem);
    });
    
    // Position the menu near the more button
    const moreBtn = messageWrapper.querySelector('[data-action="more"]');
    const rect = moreBtn.getBoundingClientRect();
    contextMenu.style.left = rect.left + 'px';
    contextMenu.style.top = (rect.bottom + 5) + 'px';
    
    document.body.appendChild(contextMenu);
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
            document.body.removeChild(contextMenu);
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

function showActionFeedback(message) {
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#feedback-animations')) {
        const style = document.createElement('style');
        style.id = 'feedback-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
        feedback.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
        }, 300);
    }, 3000);
}

// Initialize autosize and send button state
document.addEventListener('DOMContentLoaded', () => {
    autosize();
    updateSendButtonState();
});
