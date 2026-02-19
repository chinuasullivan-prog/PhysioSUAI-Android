// Physio SUAI - Main JavaScript
// Comprehensive utilities and app functionality

// ============================================================================
// GLOBAL STATE MANAGEMENT
// ============================================================================

const AppState = {
  currentPage: 'home',
  selectedFiles: [],
  friendRequests: [],
  friends: [],
  notifications: [],
  darkMode: true,
  currentChat: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showLoading(message = "Loading...") {
  const loading = document.getElementById('loadingOverlay');
  if (loading) {
    loading.querySelector('.loading-text').textContent = message;
    loading.classList.remove('hidden');
  }
}

function hideLoading() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.classList.add('hidden');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-500 ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  toast.innerHTML = `
    <div class="flex items-center space-x-3 text-white">
      <span class="text-2xl">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function showModal(title, content, buttons = []) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 border border-gray-700 transform transition-all scale-95 animate-scale-in">
      <h3 class="text-2xl font-bold mb-4">${title}</h3>
      <div class="mb-6">${content}</div>
      <div class="flex space-x-3">
        ${buttons.map(btn => `
          <button onclick="${btn.onClick}" class="flex-1 px-4 py-3 rounded-lg font-medium transition ${btn.class || 'bg-gray-700 hover:bg-gray-600'}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  return modal;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================================================
// FILE HANDLING
// ============================================================================

async function handleFileSelect(acceptType = '*/*', multiple = false) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptType;
    input.multiple = multiple;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const processedFiles = [];
      
      for (const file of files) {
        const reader = new FileReader();
        const fileData = await new Promise((resolve) => {
          reader.onload = (e) => {
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              data: e.target.result,
              file: file
            });
          };
          
          if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
        processedFiles.push(fileData);
      }
      
      resolve(multiple ? processedFiles : processedFiles[0]);
    };
    
    input.click();
  });
}

async function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// CAMERA FUNCTIONALITY
// ============================================================================

async function openCamera() {
  return new Promise(async (resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[9999] bg-black flex flex-col';
    modal.innerHTML = `
      <div class="flex items-center justify-between p-4 bg-gray-900">
        <button onclick="this.closest('.fixed').remove()" class="text-white text-xl">✕</button>
        <h3 class="text-white font-bold">Take Photo</h3>
        <button id="captureBtn" class="bg-pink-500 px-4 py-2 rounded-lg text-white">Capture</button>
      </div>
      <video id="cameraStream" class="flex-1 w-full object-cover" autoplay playsinline></video>
      <canvas id="cameraCanvas" class="hidden"></canvas>
    `;
    document.body.appendChild(modal);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      const video = modal.querySelector('#cameraStream');
      video.srcObject = stream;
      
      modal.querySelector('#captureBtn').onclick = () => {
        const canvas = modal.querySelector('#cameraCanvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          stream.getTracks().forEach(track => track.stop());
          modal.remove();
          resolve(new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };
    } catch (error) {
      console.error('Camera error:', error);
      modal.remove();
      showToast('Camera access denied', 'error');
      resolve(null);
    }
  });
}

// ============================================================================
// IMAGE/PDF VIEWER
// ============================================================================

function viewFile(url, type, name) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4';
  
  const content = type.startsWith('image/') 
    ? `<img src="${url}" class="max-w-full max-h-[90vh] object-contain rounded-lg" alt="${name}">`
    : type === 'application/pdf'
    ? `<iframe src="${url}" class="w-full h-[90vh] rounded-lg"></iframe>`
    : `<div class="bg-gray-800 p-8 rounded-lg"><p class="text-white">Preview not available for this file type</p></div>`;
  
  modal.innerHTML = `
    <div class="relative max-w-6xl w-full">
      <button onclick="this.closest('.fixed').remove()" class="absolute -top-4 -right-4 bg-red-500 text-white w-12 h-12 rounded-full text-2xl hover:bg-red-600 transition z-10">✕</button>
      <div class="bg-gray-900 rounded-lg p-4">
        <h3 class="text-white font-bold mb-4">${name}</h3>
        ${content}
        <a href="${url}" download="${name}" class="mt-4 block bg-green-500 text-white text-center py-3 rounded-lg hover:bg-green-600 transition">Download</a>
      </div>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.body.appendChild(modal);
}

// ============================================================================
// EMOJI/STICKER PICKER
// ============================================================================

function showEmojiPicker(callback) {
  const emojis = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾'];
  
  const stickers = ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','💪','🙏','✍️','💅','🦵','🦶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  
  const modal = document.createElement('div');
  modal.className = 'fixed bottom-20 right-4 z-[9999] bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-80 max-h-96 overflow-y-auto';
  modal.innerHTML = `
    <div class="sticky top-0 bg-gray-800 border-b border-gray-700 p-3">
      <div class="flex space-x-2">
        <button onclick="this.parentElement.parentElement.nextElementSibling.innerHTML = this.dataset.emojis" data-emojis="${emojis.map(e => `<button onclick="(${callback})('${e}'); this.closest('.fixed').remove()" class='text-3xl hover:scale-125 transition p-2'>${e}</button>`).join('')}" class="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">😀 Emojis</button>
        <button onclick="this.parentElement.parentElement.nextElementSibling.innerHTML = this.dataset.stickers" data-stickers="${stickers.map(s => `<button onclick="(${callback})('${s}'); this.closest('.fixed').remove()" class='text-3xl hover:scale-125 transition p-2'>${s}</button>`).join('')}" class="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">👍 Stickers</button>
      </div>
    </div>
    <div class="p-4 grid grid-cols-6 gap-2">
      ${emojis.map(emoji => `<button onclick="(${callback})('${emoji}'); this.closest('.fixed').remove()" class='text-3xl hover:scale-125 transition p-2'>${emoji}</button>`).join('')}
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.remove(), 30000);
}

// ============================================================================
// ASSIGNMENT FUNCTIONS
// ============================================================================

async function submitAssignment(name, description, file = null) {
  showLoading("Submitting assignment...");
  
  let fileUrl = null;
  if (file) {
    const upload = await uploadFile(file, 'assignments');
    if (upload.success) fileUrl = upload.url;
  }
  
  const result = await saveToFirebase('assignments', {
    name,
    description,
    fileUrl,
    fileType: file ? file.type : null,
    author: currentUser ? currentUser.email : 'Anonymous',
    authorId: currentUser ? currentUser.uid : 'anon',
    timestamp: Date.now(),
    views: 0,
    downloads: 0,
    helpful: 0
  });
  
  hideLoading();
  
  if (result.success) {
    showToast('Assignment submitted successfully!');
    return true;
  } else {
    showToast('Failed to submit assignment', 'error');
    return false;
  }
}

async function loadAssignments(container) {
  showLoading("Loading assignments...");
  const assignments = await getFromFirebase('assignments', 100);
  hideLoading();
  
  if (!container) return assignments;
  
  container.innerHTML = assignments.length === 0 
    ? '<div class="col-span-full text-center py-12 text-gray-400">No assignments yet. Be the first to add one!</div>'
    : assignments.map(assignment => `
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-pink-500 transition cursor-pointer" data-assignment='${JSON.stringify(assignment)}' onclick="viewAssignmentById(this.dataset.assignment)">
        <div class="flex items-start justify-between mb-4">
          <span class="px-3 py-1 bg-pink-500/20 text-pink-500 rounded-full text-sm">${assignment.fileType || 'Text'}</span>
          <span class="text-gray-400 text-sm">${formatTimestamp(assignment.timestamp)}</span>
        </div>
        <h3 class="text-lg font-bold mb-2">${assignment.name}</h3>
        <p class="text-gray-400 text-sm mb-4 line-clamp-2">${assignment.description}</p>
        <div class="flex items-center justify-between text-sm text-gray-400">
          <span>By ${assignment.author}</span>
          <div class="flex space-x-4">
            <span>👁 ${assignment.views || 0}</span>
            <span>⬇ ${assignment.downloads || 0}</span>
            <span>👍 ${assignment.helpful || 0}</span>
          </div>
        </div>
      </div>
    `).join('');
  
  return assignments;
}

function viewAssignment(assignment) {
  if (assignment.fileUrl) {
    viewFile(assignment.fileUrl, assignment.fileType, assignment.name);
    // Increment views
    db.ref(`assignments/${assignment.id}/views`).transaction((views) => (views || 0) + 1);
  } else {
    showModal(assignment.name, `<p class="text-gray-300">${assignment.description}</p>`, [
      { text: 'Close', onClick: 'this.closest(".fixed").remove()' }
    ]);
  }
}

function viewAssignmentById(jsonString) {
  try {
    const assignment = JSON.parse(jsonString);
    viewAssignment(assignment);
  } catch (e) {
    console.error('Error parsing assignment:', e);
    showToast('Error loading assignment', 'error');
  }
}

// ============================================================================
// NOVEL FUNCTIONS
// ============================================================================

async function submitNovel(file) {
  if (!file || (file.type !== 'application/pdf' && !file.type.startsWith('image/'))) {
    showToast('Please select a PDF or image file', 'error');
    return false;
  }
  
  showLoading("Uploading novel...");
  const upload = await uploadFile(file, 'novels');
  
  if (upload.success) {
    const result = await saveToFirebase('novels', {
      name: file.name,
      fileUrl: upload.url,
      fileType: file.type,
      author: currentUser ? currentUser.email : 'Anonymous',
      authorId: currentUser ? currentUser.uid : 'anon',
      timestamp: Date.now(),
      views: 0,
      downloads: 0,
      ratings: []
    });
    
    hideLoading();
    
    if (result.success) {
      showToast('Novel uploaded successfully!');
      return true;
    }
  }
  
  hideLoading();
  showToast('Failed to upload novel', 'error');
  return false;
}

async function loadNovels(container) {
  showLoading("Loading novels...");
  const novels = await getFromFirebase('novels', 100);
  hideLoading();
  
  if (!container) return novels;
  
  container.innerHTML = novels.length === 0
    ? '<div class="col-span-full text-center py-12 text-gray-400">No novels yet. Be the first to share one!</div>'
    : novels.map(novel => `
      <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-pink-500 transition cursor-pointer" onclick='viewFile("${novel.fileUrl}", "${novel.fileType}", "${novel.name}")'>
        <div class="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span class="text-6xl">📚</span>
        </div>
        <div class="p-4">
          <h3 class="font-bold mb-2 truncate">${novel.name}</h3>
          <p class="text-gray-400 text-sm mb-3">By ${novel.author}</p>
          <div class="flex items-center justify-between text-sm text-gray-400">
            <span>${formatTimestamp(novel.timestamp)}</span>
            <div class="flex space-x-3">
              <span>👁 ${novel.views || 0}</span>
              <span>⬇ ${novel.downloads || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  
  return novels;
}

// ============================================================================
// BUY BOOK FUNCTIONS
// ============================================================================

async function submitBook(name, amount, account, phone, image, password) {
  if (password !== '0987654321') {
    showToast('Incorrect password', 'error');
    return false;
  }
  
  showLoading("Listing book for sale...");
  
  let imageUrl = null;
  if (image) {
    const upload = await uploadFile(image, 'books');
    if (upload.success) imageUrl = upload.url;
  }
  
  const result = await saveToFirebase('books', {
    name,
    amount,
    account,
    phone,
    imageUrl,
    sellerId: currentUser ? currentUser.uid : 'anon',
    sellerName: currentUser ? currentUser.email : 'Anonymous',
    timestamp: Date.now(),
    sold: false,
    buyers: []
  });
  
  hideLoading();
  
  if (result.success) {
    showToast('Book listed successfully!');
    return true;
  } else {
    showToast('Failed to list book', 'error');
    return false;
  }
}

async function loadBooks(container) {
  showLoading("Loading books...");
  const books = await getFromFirebase('books', 100);
  hideLoading();
  
  if (!container) return books;
  
  container.innerHTML = books.length === 0
    ? '<div class="col-span-full text-center py-12 text-gray-400">No books for sale yet.</div>'
    : books.map(book => `
      <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition">
        ${book.imageUrl ? `<img src="${book.imageUrl}" class="w-full h-48 object-cover" alt="${book.name}">` : `<div class="w-full h-48 bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-6xl">📖</div>`}
        <div class="p-4">
          <h3 class="font-bold text-lg mb-2">${book.name}</h3>
          <p class="text-green-400 text-2xl font-bold mb-3">₦${book.amount}</p>
          <p class="text-gray-400 text-sm mb-3">Seller: ${book.sellerName}</p>
          <button onclick='buyBookById(this.dataset.book)' data-book='${JSON.stringify(book)}' class="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition">
            🛒 Buy Now
          </button>
        </div>
      </div>
    `).join('');
  
  return books;
}

async function buyBook(book) {
  const modal = showModal('Purchase Book', `
    <div class="space-y-4">
      <p class="text-gray-300">Book: <strong>${book.name}</strong></p>
      <p class="text-gray-300">Price: <strong class="text-green-400">₦${book.amount}</strong></p>
      <p class="text-gray-300">Seller Phone: <strong>${book.phone}</strong></p>
      <p class="text-gray-300">Account: <strong>${book.account}</strong></p>
      <div class="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mt-4">
        <p class="text-yellow-200 text-sm">📤 Upload payment proof (image or PDF)</p>
      </div>
    </div>
  `, [
    { text: 'Cancel', onClick: 'this.closest(".fixed").remove()' },
    { 
      text: 'Upload Proof', 
      onClick: `uploadPaymentProof('${book.id}', '${book.sellerId}')`,
      class: 'bg-green-500 hover:bg-green-600'
    }
  ]);
}

function buyBookById(jsonString) {
  try {
    const book = JSON.parse(jsonString);
    buyBook(book);
  } catch (e) {
    console.error('Error parsing book:', e);
    showToast('Error loading book', 'error');
  }
}

async function uploadPaymentProof(bookId, sellerId) {
  const file = await handleFileSelect('image/*,.pdf');
  if (!file) return;
  
  showLoading("Verifying payment...");
  const upload = await uploadFile(file.file, 'payments');
  
  if (upload.success) {
    await saveToFirebase(`books/${bookId}/buyers`, {
      buyerId: currentUser ? currentUser.uid : 'anon',
      buyerName: currentUser ? currentUser.email : 'Anonymous',
      proofUrl: upload.url,
      timestamp: Date.now(),
      verified: false
    });
    
    sendNotification(sellerId, `New purchase request for your book!`);
    hideLoading();
    showToast('Payment proof uploaded! Seller will be notified.');
    document.querySelector('.fixed')?.remove();
  } else {
    hideLoading();
    showToast('Failed to upload proof', 'error');
  }
}

// I'll continue with more functions in the next part...
console.log("✅ Main utilities loaded!");
