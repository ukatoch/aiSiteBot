(function () {
    // 1. Configuration
    const script = document.currentScript;
    const botId = script.getAttribute('data-bot-id') || 'bot-default';
    const currentHostname = window.location.hostname;

    // Auto-detect base URLs based on script location
    const frontendBase = script.src.split('/aiSiteBot.js')[0];
    const backendBase = script.getAttribute('data-api-url') || (frontendBase.replace(':5173', ':8000') + '/api/v1');

    // 2. Create Floating Button
    const chatButton = document.createElement('button');
    Object.assign(chatButton.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#006d77',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
        fontSize: '28px'
    });
    chatButton.innerHTML = '💬';
    chatButton.onmouseenter = () => chatButton.style.transform = 'scale(1.05)';
    chatButton.onmouseleave = () => chatButton.style.transform = 'scale(1)';
    document.body.appendChild(chatButton);

    // 3. Create Chat Container
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '400px',
        height: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        zIndex: '999999',
        display: 'none',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
    });

    // 4. Create Iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${frontendBase}/?botId=${botId}&hostname=${currentHostname}`;
    Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: 'none'
    });
    container.appendChild(iframe);
    document.body.appendChild(container);

    // 5. Toggle Logic with Validation
    let isValidated = false;

    chatButton.addEventListener('click', async () => {
        if (container.style.display === 'flex') {
            container.style.display = 'none';
            chatButton.innerHTML = '💬';
            return;
        }

        if (!isValidated) {
            try {
                const res = await fetch(`${backendBase}/validateBot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ botId, hostname: currentHostname })
                });

                if (res.ok) {
                    isValidated = true;
                } else {
                    const data = await res.json();
                    alert(`ChatBot Error: ${data.detail || 'Access denied'}`);
                    return;
                }
            } catch (err) {
                console.error('AISiteBot validation failed:', err);
                return;
            }
        }

        container.style.display = 'flex';
        chatButton.innerHTML = '✕';
    });
})();