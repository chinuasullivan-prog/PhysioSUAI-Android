// Physio SUAI - Extended Features
// Chat, Business, AI, Lectures, and more

// ============================================================================
// CHAT FUNCTIONS
// ============================================================================

// ─── Get display name from Firebase users table ───────────────
async function getSenderName() {
  if (!currentUser) return 'Anonymous';
  // Try users table first (set during signup)
  try {
    const snap = await db.ref('users/' + currentUser.uid).once('value');
    const u = snap.val();
    if (u && u.name) return u.name;
  } catch(e) {}
  // Fallback to displayName or email prefix
  if (currentUser.displayName) return currentUser.displayName;
  return currentUser.email ? currentUser.email.split('@')[0] : 'Student';
}

// ─── Telegram dust particle animation ────────────────────────
function dustDelete(el, callback) {
  if (!el) return;
  var rect = el.getBoundingClientRect();
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  // Sample pixel colors from element area
  var particles = [];
  var cols = ['#ec4899','#8b5cf6','#374151','#6b7280','#1f2937','#9ca3af'];
  for (var i = 0; i < 60; i++) {
    particles.push({
      x: rect.left + Math.random() * rect.width,
      y: rect.top  + Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.8) * 5,
      r: Math.random() * 4 + 1,
      alpha: 1,
      color: cols[Math.floor(Math.random() * cols.length)]
    });
  }
  // Hide element immediately
  el.style.opacity = '0';
  el.style.transition = 'none';
  var frame = 0;
  function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    frame++;
    var done = true;
    particles.forEach(function(p) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.15; // gravity
      p.alpha -= 0.03;
      if (p.alpha > 0) { done = false; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    if (!done && frame < 80) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
      if (callback) callback();
    }
  }
  requestAnimationFrame(animate);
}

// ─── Chat context menu (long press) ─────────────────────────
var _longPressTimer = null;
var _ctxMenu = null;

function attachLongPress(el, onLongPress) {
  function start(e) {
    _longPressTimer = setTimeout(function() {
      onLongPress(e);
    }, 500);
  }
  function cancel() { clearTimeout(_longPressTimer); }
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend',   cancel);
  el.addEventListener('touchmove',  cancel);
  el.addEventListener('mousedown',  start);
  el.addEventListener('mouseup',    cancel);
}

function showMsgContextMenu(e, msgId, isMine, msgText) {
  // Close any open menu
  if (_ctxMenu) _ctxMenu.remove();

  var menu = document.createElement('div');
  _ctxMenu = menu;
  // Position near touch/click
  var x = e.touches ? e.touches[0].clientX : (e.clientX || window.innerWidth/2);
  var y = e.touches ? e.touches[0].clientY : (e.clientY || window.innerHeight/2);

  menu.style.cssText = [
    'position:fixed','z-index:9998',
    'background:#1f2937',
    'border:1.5px solid #374151',
    'border-radius:18px',
    'padding:8px',
    'min-width:200px',
    'box-shadow:0 8px 32px #000a',
    'animation:ctxIn .15s ease',
    'left:' + Math.min(x, window.innerWidth-220) + 'px',
    'top:'  + Math.min(y+10, window.innerHeight-200) + 'px'
  ].join(';');

  // Emoji reactions
  var emojis = ['❤️','😂','😮','😢','👍','🔥'];
  var emojiRow = '<div style="display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid #374151;margin-bottom:4px">';
  emojis.forEach(function(em) {
    emojiRow += '<button onclick="reactMsg(\'' + msgId + '\',\'' + em + '\')" style="font-size:22px;background:none;border:none;cursor:pointer;border-radius:8px;padding:4px;transition:transform .1s" onmousedown="this.style.transform=\'scale(1.3)\'" onmouseup="this.style.transform=\'\'">' + em + '</button>';
  });
  emojiRow += '</div>';

  var items = [emojiRow];

  // Reply (stub)
  items.push(menuItem('↩️', 'Reply', 'closeCtxMenu()'));
  // Copy
  items.push(menuItem('📋', 'Copy', 'copyMsg(\'' + msgText.replace(/'/g,"\\'").substring(0,80) + '\')'));
  // Delete only own messages
  if (isMine) {
    items.push(menuItem('🗑️', 'Delete', 'deletePubMsg(\'' + msgId + '\')', '#ef4444'));
  }

  menu.innerHTML = items.join('');

  // Add CSS animation
  if (!document.getElementById('ctxStyle')) {
    var s = document.createElement('style');
    s.id = 'ctxStyle';
    s.textContent = '@keyframes ctxIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}';
    document.head.appendChild(s);
  }

  document.body.appendChild(menu);

  // Close on outside tap (but NOT when tapping menu items)
  setTimeout(function() {
    function rmCtx(ev) {
      if (_ctxMenu && !_ctxMenu.contains(ev.target)) {
        closeCtxMenu();
        document.removeEventListener('click', rmCtx);
        document.removeEventListener('touchend', rmCtx);
      }
    }
    document.addEventListener('click', rmCtx);
    document.addEventListener('touchend', rmCtx);
  }, 150);
}

function menuItem(icon, label, action, color) {
  return '<button onclick="' + action + '" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;background:none;border:none;cursor:pointer;border-radius:12px;color:' + (color||'#e5e7eb') + ';font-size:14px;font-weight:500;text-align:left" onmouseover="this.style.background=\'#374151\'" onmouseout="this.style.background=\'none\'">' +
    '<span style="font-size:18px">' + icon + '</span>' + label +
  '</button>';
}

function closeCtxMenu() {
  if (_ctxMenu) { _ctxMenu.remove(); _ctxMenu = null; }
}

function copyMsg(text) {
  closeCtxMenu();
  navigator.clipboard.writeText(text).then(function() { showToast('Copied!'); }).catch(function(){ showToast('Copied!'); });
}

function reactMsg(msgId, emoji) {
  closeCtxMenu();
  if (!currentUser) return;
  db.ref('public_chat/' + msgId + '/reactions/' + currentUser.uid).set(emoji);
}

function deletePubMsg(msgId) {
  closeCtxMenu();
  var el = document.getElementById('pm_' + msgId);
  if (!el) return;
  dustDelete(el, function() {
    el.remove();
    db.ref('public_chat/' + msgId).remove();
  });
}

// ─── Main sendMessage ─────────────────────────────────────────
async function sendMessage(message, fileUrl = null, fileType = null, isPrivate = false, recipientId = null) {
  const chatPath = isPrivate ? `private_chats/${[currentUser.uid, recipientId].sort().join('_')}` : 'public_chat';
  // Always get real name - never anonymous for public/private chat
  const realName = await getSenderName();

  const result = await saveToFirebase(chatPath, {
    message,
    fileUrl,
    fileType,
    senderId: currentUser ? currentUser.uid : 'anon',
    senderName: realName,
    senderEmail: currentUser ? currentUser.email : '',
    timestamp: Date.now(),
    reactions: {}
  });

  if (result.success && isPrivate) {
    sendNotification(recipientId, `New message from ${realName}`);
  }

  return result.success;
}

// ─── Public chat listener (real names + long press + reactions)
function loadPublicChat(container) {
  if (!container) return;

  db.ref('public_chat').limitToLast(80).on('child_added', function(snap) {
    var msg = snap.val();
    if (!msg) return;
    msg.id = snap.key;
    if (document.getElementById('pm_' + snap.key)) return; // deduplicate
    renderPublicMsg(msg, container);
    container.scrollTop = container.scrollHeight;
  });

  // Listen for reactions updates
  db.ref('public_chat').on('child_changed', function(snap) {
    var msg = snap.val(); msg.id = snap.key;
    var el = document.getElementById('pm_' + snap.key);
    if (el) {
      var rEl = el.querySelector('.reactions-bar');
      if (rEl) rEl.innerHTML = buildReactionsHtml(msg.reactions, snap.key);
    }
  });

  // Listen for deletions
  db.ref('public_chat').on('child_removed', function(snap) {
    var el = document.getElementById('pm_' + snap.key);
    if (el) { el.style.opacity='0'; el.style.transform='scale(.9)'; el.style.transition='all .3s'; setTimeout(function(){ el.remove(); }, 300); }
  });
}

function buildReactionsHtml(reactions, msgId) {
  if (!reactions) return '';
  var counts = {};
  Object.values(reactions).forEach(function(em) { counts[em] = (counts[em]||0)+1; });
  if (!Object.keys(counts).length) return '';
  return Object.entries(counts).map(function(kv) {
    return '<span style="background:#374151;border-radius:20px;padding:2px 8px;font-size:13px;cursor:pointer" onclick="reactMsg(\'' + msgId + '\',\'' + kv[0] + '\')">' + kv[0] + ' ' + kv[1] + '</span>';
  }).join(' ');
}

function renderPublicMsg(msg, container) {
  var isMine = currentUser && msg.senderId === currentUser.uid;
  var isBot  = msg.isJoke || msg.senderName === '🤖 Fun Bot';
  var name   = msg.senderName || 'Student';
  var initial= isBot ? '🤖' : name[0].toUpperCase();
  var avatarBg = isBot ? '#ca8a04' : 'linear-gradient(135deg,#ec4899,#8b5cf6)';

  var div = document.createElement('div');
  div.id = 'pm_' + msg.id;
  div.style.cssText = 'display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;transition:all .3s;' + (isBot ? 'background:rgba(234,179,8,.08);padding:10px;border-radius:14px;' : '');

  var fileHtml = '';
  if (msg.fileUrl) {
    if (msg.fileType && msg.fileType.startsWith('image/')) {
      fileHtml = '<img src="' + msg.fileUrl + '" style="border-radius:12px;margin-top:8px;max-width:100%;max-height:180px;object-fit:cover;cursor:pointer" onclick="window.open(\'' + msg.fileUrl + '\')">';
    } else {
      fileHtml = '<a href="' + msg.fileUrl + '" target="_blank" style="color:#60a5fa;font-size:13px;margin-top:6px;display:block">📎 View attachment</a>';
    }
  }

  var reactHtml = buildReactionsHtml(msg.reactions, msg.id);

  div.innerHTML =
    // Avatar - tappable to see profile
    '<div onclick="viewSenderProfile(\'' + msg.senderId + '\',\'' + name.replace(/'/g,"\\'") + '\')" style="width:42px;height:42px;border-radius:50%;background:' + avatarBg + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px;flex-shrink:0;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform=\'scale(.9)\'" onmouseup="this.style.transform=\'\'">' + initial + '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="font-weight:700;font-size:14px">' + name + '</span>' +
        (isMine ? '<span style="font-size:11px;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;padding:1px 6px;border-radius:8px;font-weight:600">You</span>' : '') +
        '<span style="font-size:11px;color:#6b7280">' + timeAgoStr(msg.timestamp) + '</span>' +
      '</div>' +
      '<div style="background:#1f2937;border-radius:18px;border-top-left-radius:4px;padding:12px 16px;font-size:14px;line-height:1.5;word-break:break-word">' +
        (msg.message || '') + fileHtml +
      '</div>' +
      (reactHtml ? '<div class="reactions-bar" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">' + reactHtml + '</div>' : '<div class="reactions-bar" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px"></div>') +
    '</div>';

  // Long press handler
  attachLongPress(div, function(e) {
    showMsgContextMenu(e, msg.id, isMine, msg.message || '');
  });

  container.appendChild(div);
}

function viewSenderProfile(uid, name) {
  if (!uid || uid === 'anon') return;
  db.ref('users/' + uid).once('value').then(function(snap) {
    var u = snap.val() || {};
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.8);display:flex;align-items:flex-end;justify-content:center';
    modal.setAttribute('data-sender-modal', '1');
    modal.innerHTML =
      '<div style="background:#1f2937;border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:480px;space-y:16px">' +
        '<div style="width:40px;height:4px;background:#374151;border-radius:2px;margin:0 auto 16px"></div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:16px">' +
          '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:32px">' + (u.name||name||'S')[0].toUpperCase() + '</div>' +
          '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0">' + (u.name||name||'Student') + '</h2>' +
          '<p style="color:#9ca3af;font-size:13px;margin:0">' + (u.bio||'Physio SUAI Member') + '</p>' +
          '<p style="color:#6b7280;font-size:12px;margin:0">' + (u.email||'') + '</p>' +
        '</div>' +
        '<button onclick="closeSenderModal(this)" style="width:100%;padding:14px;background:#374151;color:#fff;border-radius:16px;border:none;cursor:pointer;font-weight:600;font-size:15px">Close</button>' +
      '</div>';
    modal.addEventListener('click', function(e) { if (e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
  });
}

function closeSenderModal(btn) {
  // Walk up DOM to find the modal overlay and remove it
  var el = btn;
  while (el && el !== document.body) {
    if (el.style && el.style.position === 'fixed') { el.remove(); return; }
    el = el.parentNode;
  }
  // Fallback: remove all sender modals
  document.querySelectorAll('[data-sender-modal]').forEach(function(m){ m.remove(); });
}

function timeAgoStr(ts) {
  if (!ts) return '';
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

function loadPrivateChat(recipientId, container) {
  const chatPath = `private_chats/${[currentUser.uid, recipientId].sort().join('_')}`;
  
  listenToFirebase(chatPath, (messages) => {
    container.innerHTML = messages.map(msg => {
      const isMine = msg.senderId === currentUser.uid;
      return `
        <div class="flex items-end space-x-2 mb-4 ${isMine ? 'flex-row-reverse space-x-reverse' : ''}">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            ${msg.senderName[0].toUpperCase()}
          </div>
          <div class="max-w-[70%]">
            <div class="${isMine ? 'bg-pink-500' : 'bg-gray-700'} rounded-2xl p-3 ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}">
              <p class="text-white break-words">${msg.message}</p>
              ${msg.fileUrl ? `
                <div class="mt-2">
                  ${msg.fileType?.startsWith('image/') ? `<img src="${msg.fileUrl}" class="rounded-lg max-w-full cursor-pointer" onclick='viewFile("${msg.fileUrl}", "${msg.fileType}", "Image")'>` : `<a href="${msg.fileUrl}" class="text-white underline">📎 Attachment</a>`}
                </div>
              ` : ''}
            </div>
            <span class="text-xs text-gray-400 mt-1 block ${isMine ? 'text-right' : ''}">${formatTimestamp(msg.timestamp)}</span>
          </div>
        </div>
      `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
  });
}

// ============================================================================
// FRIEND SYSTEM
// ============================================================================

async function sendFriendRequest(targetUserId) {
  if (!currentUser) {
    showToast('Please log in to send friend requests', 'error');
    return;
  }
  
  const result = await saveToFirebase(`friend_requests/${targetUserId}`, {
    fromId: currentUser.uid,
    fromName: currentUser.email,
    timestamp: Date.now(),
    status: 'pending'
  });
  
  if (result.success) {
    sendNotification(targetUserId, `${currentUser.email} sent you a friend request`);
    showToast('Friend request sent!');
  }
}

async function acceptFriendRequest(requestId, fromId) {
  // Add to both users' friend lists
  await saveToFirebase(`friends/${currentUser.uid}`, {
    friendId: fromId,
    timestamp: Date.now()
  });
  
  await saveToFirebase(`friends/${fromId}`, {
    friendId: currentUser.uid,
    timestamp: Date.now()
  });
  
  // Delete request
  await db.ref(`friend_requests/${currentUser.uid}/${requestId}`).remove();
  
  showToast('Friend request accepted!');
}

async function loadFriends(container) {
  if (!currentUser) return [];
  
  const friendsData = await getFromFirebase(`friends/${currentUser.uid}`, 100);
  const friends = [];
  
  for (const friend of friendsData) {
    const profile = await getUserProfile(friend.friendId);
    if (profile) {
      friends.push({ ...friend, profile });
    }
  }
  
  if (container) {
    container.innerHTML = friends.length === 0
      ? '<div class="text-center py-12 text-gray-400">No friends yet. Start chatting to make friends!</div>'
      : friends.map(friend => `
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-pink-500 transition cursor-pointer" onclick="openPrivateChat('${friend.friendId}')">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              ${friend.profile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div class="flex-1">
              <h3 class="font-bold">${friend.profile.name || friend.profile.email || 'User'}</h3>
              <p class="text-sm text-gray-400">${friend.profile.bio || 'Physio SUAI Member'}</p>
            </div>
            <div class="text-green-400">●</div>
          </div>
        </div>
      `).join('');
  }
  
  return friends;
}

function openPrivateChat(friendId) {
  // This will be implemented in the chat page
  window.location.href = `pages/chat.html?friend=${friendId}`;
}

// ============================================================================
// BUSINESS FUNCTIONS
// ============================================================================

async function submitBusiness(name, businessName, businessType, phone, image) {
  showLoading("Registering business...");
  
  let imageUrl = null;
  if (image) {
    const upload = await uploadFile(image, 'businesses');
    if (upload.success) imageUrl = upload.url;
  }
  
  const result = await saveToFirebase('businesses', {
    ownerName: name,
    businessName,
    businessType,
    phone,
    imageUrl,
    ownerId: currentUser ? currentUser.uid : 'anon',
    timestamp: Date.now(),
    orders: [],
    rating: 0,
    reviews: []
  });
  
  hideLoading();
  
  if (result.success) {
    showToast('Business registered successfully!');
    return true;
  } else {
    showToast('Failed to register business', 'error');
    return false;
  }
}

async function loadBusinesses(container) {
  showLoading("Loading businesses...");
  const businesses = await getFromFirebase('businesses', 100);
  hideLoading();
  
  if (!container) return businesses;
  
  container.innerHTML = businesses.length === 0
    ? '<div class="col-span-full text-center py-12 text-gray-400">No businesses yet. Register yours!</div>'
    : businesses.map(business => `
      <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition">
        ${business.imageUrl ? `<img src="${business.imageUrl}" class="w-full h-48 object-cover" alt="${business.businessName}">` : `<div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-6xl">🏪</div>`}
        <div class="p-4">
          <h3 class="font-bold text-lg mb-1">${business.businessName}</h3>
          <p class="text-gray-400 text-sm mb-2">${business.businessType}</p>
          <p class="text-gray-400 text-sm mb-3">Owner: ${business.ownerName}</p>
          <div class="flex space-x-2">
            <button onclick='placeOrderById(this.dataset.business)' data-business='${JSON.stringify(business)}' class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition">
              🛒 Order
            </button>
            <a href="tel:${business.phone}" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition text-center">
              📞 Call
            </a>
          </div>
        </div>
      </div>
    `).join('');
  
  return businesses;
}

async function placeOrder(business) {
  showModal('Place Order', `
    <div class="space-y-4">
      <p class="text-gray-300">Business: <strong>${business.businessName}</strong></p>
      <input type="number" id="orderQuantity" placeholder="Quantity" min="1" value="1" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500">
      <textarea id="orderNotes" placeholder="Additional notes (optional)" rows="3" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"></textarea>
      <p class="text-gray-400 text-sm">The business owner will be notified of your order.</p>
    </div>
  `, [
    { text: 'Cancel', onClick: 'this.closest(".fixed").remove()' },
    { 
      text: 'Confirm Order', 
      onClick: `confirmOrder('${business.id}', '${business.ownerId}', '${business.businessName}')`,
      class: 'bg-blue-500 hover:bg-blue-600'
    }
  ]);
}

function placeOrderById(jsonString) {
  try {
    const business = JSON.parse(jsonString);
    placeOrder(business);
  } catch (e) {
    console.error('Error parsing business:', e);
    showToast('Error loading business', 'error');
  }
}

async function confirmOrder(businessId, ownerId, businessName) {
  const quantity = document.getElementById('orderQuantity').value;
  const notes = document.getElementById('orderNotes').value;
  
  showLoading("Placing order...");
  
  const result = await saveToFirebase(`businesses/${businessId}/orders`, {
    customerId: currentUser ? currentUser.uid : 'anon',
    customerName: currentUser ? currentUser.email : 'Anonymous',
    quantity: parseInt(quantity),
    notes,
    timestamp: Date.now(),
    status: 'pending'
  });
  
  if (result.success) {
    sendNotification(ownerId, `New order for ${businessName}! Quantity: ${quantity}`);
    hideLoading();
    showToast('Order placed successfully!');
    document.querySelector('.fixed')?.remove();
  } else {
    hideLoading();
    showToast('Failed to place order', 'error');
  }
}

// ============================================================================
// STUDY AI (GEMINI) FUNCTIONS
// ============================================================================

let geminiConversation = [];

async function askGemini(question, imageFile = null) {
  showLoading("Thinking...");
  
  try {
    // In a real implementation, you would call Gemini API here
    // For now, we'll simulate responses with physiotherapy focus
    
    const responses = [
      `Great question about ${question}! In physiotherapy, this relates to musculoskeletal rehabilitation and therapeutic exercise principles.`,
      `Regarding ${question}, it's important to understand the biomechanics and kinesiological aspects in physiotherapy practice.`,
      `${question} is a fundamental concept in physical therapy. Let me explain the anatomical and functional perspectives.`,
      `In the context of physiotherapy, ${question} involves understanding movement patterns, manual therapy techniques, and evidence-based practice.`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    geminiConversation.push({
      role: 'user',
      content: question,
      timestamp: Date.now()
    });
    
    geminiConversation.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });
    
    hideLoading();
    return response;
  } catch (error) {
    hideLoading();
    showToast('Failed to get response', 'error');
    return 'Sorry, I encountered an error. Please try again.';
  }
}

function displayGeminiConversation(container) {
  container.innerHTML = geminiConversation.map(msg => `
    <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4">
      <div class="max-w-[80%] ${msg.role === 'user' ? 'bg-pink-500' : 'bg-gray-700'} rounded-2xl p-4">
        <p class="text-white">${msg.content}</p>
        <span class="text-xs text-gray-300 mt-2 block">${formatTimestamp(msg.timestamp)}</span>
      </div>
    </div>
  `).join('');
  
  container.scrollTop = container.scrollHeight;
}

function addPhysiotherapyTip() {
  const tips = [
    {
      title: "Proper Posture While Studying",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      description: "Maintain a neutral spine position with feet flat on the floor. Screen at eye level."
    },
    {
      title: "Stretching Exercises",
      image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400",
      description: "Regular stretching improves flexibility and reduces muscle tension. Hold each stretch for 30 seconds."
    },
    {
      title: "Core Strengthening",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
      description: "Strong core muscles support better posture and reduce back pain. Try planks and bridges."
    },
    {
      title: "Joint Mobilization",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
      description: "Gentle joint movements maintain range of motion and reduce stiffness."
    }
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

// ============================================================================
// LECTURE UPDATE FUNCTIONS
// ============================================================================

async function submitLecture(courseName, lecturerName, hall, time, password) {
  if (password !== '0987654321') {
    showToast('Incorrect password', 'error');
    return false;
  }
  
  showLoading("Adding lecture...");
  
  const result = await saveToFirebase('lectures', {
    courseName,
    lecturerName,
    hall,
    time,
    addedBy: currentUser ? currentUser.email : 'Anonymous',
    timestamp: Date.now()
  });
  
  hideLoading();
  
  if (result.success) {
    showToast('Lecture added successfully!');
    
    // Set alarm if time is in the future
    try {
      const lectureTime = new Date(time).getTime();
      if (lectureTime > Date.now()) {
        setLectureAlarm(lectureTime, courseName);
      }
    } catch (e) {
      console.error('Alarm error:', e);
    }
    
    return true;
  } else {
    showToast('Failed to add lecture', 'error');
    return false;
  }
}

async function loadLectures(container) {
  showLoading("Loading lectures...");
  const lectures = await getFromFirebase('lectures', 100);
  hideLoading();
  
  if (!container) return lectures;
  
  container.innerHTML = lectures.length === 0
    ? '<div class="col-span-full text-center py-12 text-gray-400">No lectures scheduled yet.</div>'
    : lectures.map(lecture => {
      const lectureTime = new Date(lecture.time);
      const isUpcoming = lectureTime > new Date();
      
      return `
        <div class="bg-gray-800 rounded-xl border-2 ${isUpcoming ? 'border-green-500' : 'border-gray-700'} overflow-hidden">
          <div class="bg-gradient-to-br from-purple-600 to-pink-600 p-6 relative">
            <div class="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml,...')] bg-repeat"></div>
            <h2 class="text-2xl font-bold text-white mb-2 relative z-10">${lecture.courseName}</h2>
            <p class="text-pink-100 relative z-10">🎓 LECTURE CERTIFICATE</p>
          </div>
          <div class="p-6 space-y-3">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">👨‍🏫</span>
              <div>
                <p class="text-sm text-gray-400">Lecturer</p>
                <p class="font-semibold">${lecture.lecturerName}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-2xl">📍</span>
              <div>
                <p class="text-sm text-gray-400">Hall</p>
                <p class="font-semibold">${lecture.hall}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-2xl">⏰</span>
              <div>
                <p class="text-sm text-gray-400">Time</p>
                <p class="font-semibold">${lectureTime.toLocaleString()}</p>
              </div>
            </div>
            ${isUpcoming ? '<div class="bg-green-500/20 border border-green-500 rounded-lg p-3 mt-4"><p class="text-green-400 text-center font-semibold">📢 Upcoming Lecture</p></div>' : ''}
          </div>
        </div>
      `;
    }).join('');
  
  return lectures;
}

function setLectureAlarm(time, courseName) {
  const now = Date.now();
  const delay = time - now;
  
  if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Within 24 hours
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Lecture Reminder', {
          body: `${courseName} is starting soon!`,
          icon: '/images/logo.png',
          vibrate: [200, 100, 200]
        });
      }
      
      // Play alarm sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiN0/DKdisGI3DC7N2QQAsTXrLr7a5aGg==...');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }, delay);
  }
}

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Set daily 5am alarm
function setDailyAlarm() {
  const now = new Date();
  const tomorrow5am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 5, 0, 0);
  const delay = tomorrow5am - now;
  
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Good Morning!', {
        body: 'Time to wake up and prepare for your physiotherapy studies! 📚',
        icon: '/images/logo.png',
        vibrate: [200, 100, 200, 100, 200]
      });
    }
    
    // Set next day's alarm
    setDailyAlarm();
  }, delay);
}

// Initialize daily alarm
setDailyAlarm();

console.log("✅ Extended features loaded!");
