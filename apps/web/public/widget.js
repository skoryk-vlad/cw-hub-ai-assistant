(function () {
  // Get the origin from where this script was loaded
  const scriptSrc = document.currentScript?.src || '';
  const WIDGET_ORIGIN = scriptSrc
    ? new URL(scriptSrc).origin
    : 'http://localhost:3001';

  // --- Styles ---
  const style = document.createElement('style');
  style.innerHTML = `
    #chat-widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      z-index: 9999;
      user-select: none;
    }
    #chat-widget-window {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }
    #chat-widget-window iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);

  // --- Chat Button ---
  const button = document.createElement('div');
  button.id = 'chat-widget-button';
  button.innerHTML = '💬';
  document.body.appendChild(button);

  // --- Chat Window ---
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chat-widget-window';
  chatWindow.style.display = 'none';
  chatWindow.innerHTML = `
    <iframe src="${WIDGET_ORIGIN}/chat-ui"></iframe>
  `;
  document.body.appendChild(chatWindow);

  // --- Toggle Logic ---
  button.addEventListener('click', () => {
    chatWindow.style.display =
      chatWindow.style.display === 'none' ? 'flex' : 'none';
  });
})();
