const chatWindow = document.getElementById('chat-window');
const inputField = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = content;
    
    msgDiv.appendChild(bubble);
    chatWindow.appendChild(msgDiv);
    
    // Autoscroll ke bawah
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTyping(show) {
    typingIndicator.style.display = show ? 'block' : 'none';
    if (show) {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    // Tampilkan pesan pengguna segera
    appendMessage('user', message);
    inputField.value = '';
    
    // Tampilkan status "typing..."
    showTyping(true);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        showTyping(false);

        if (response.ok) {
            if (data.response) {
                appendMessage('assistant', data.response);
            } else {
                appendMessage('assistant', `Error: ${data.error}`);
            }
        } else {
            appendMessage('assistant', `Error: ${data.error}`);
        }
    } catch (error) {
        showTyping(false);
        appendMessage('assistant', `Error: ${error.message}`);
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});

// Focus input on load
window.onload = () => {
    inputField.focus();
};