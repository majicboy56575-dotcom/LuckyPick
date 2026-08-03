// ============================================
// LuckyPick - Admin Page (관리자 페이지)
// ============================================
import { t, renderLanguageDropdown } from '../i18n.js';
import { getAdminStats, getMembers, getAdminInventory, addProduct, getAllShippingInfos, updateShippingStatus, DEMO_IMAGES } from '../services/firestore.js';

export function render() {
  const stats = getAdminStats();
  const members = getMembers();
  const inventory = getAdminInventory();
  const shippingList = getAllShippingInfos();

  const html = `
    <div class="flex h-screen overflow-hidden page-enter" id="admin-layout">
      <!-- Sidebar -->
      <aside class="hidden lg:flex h-full w-72 rounded-r-xl bg-surface-container-low border-r border-outline-variant shadow-xl flex-col py-4 z-40 shrink-0" id="admin-sidebar">
        <div class="px-6 mb-8 flex items-center gap-3">
          <span class="material-symbols-outlined text-primary text-3xl">language</span>
          <h1 class="font-headline-md text-primary">LuckyPick</h1>
        </div>
        <div class="px-4 mb-8">
          <div class="flex items-center gap-3 p-3 bg-surface-bright rounded-xl border border-outline-variant/30">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container">
              <span class="material-symbols-outlined">person</span>
            </div>
            <div>
              <p class="font-bold text-on-surface text-sm">${t('adminPanel')}</p>
              <p class="text-xs text-on-surface-variant">${t('adminManagement')}</p>
            </div>
          </div>
        </div>
        <nav class="flex-1 space-y-1">
          <a class="bg-secondary-container text-on-secondary-container font-bold rounded-lg m-2 flex items-center gap-3 px-4 py-3 transition-colors duration-200" href="#">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="font-body-md">${t('dashboard')}</span>
          </a>
          <a class="text-on-surface-variant hover:bg-surface-variant/50 m-2 flex items-center gap-3 px-4 py-3 transition-colors duration-200 rounded-lg" href="#">
            <span class="material-symbols-outlined">inventory_2</span>
            <span class="font-body-md">${t('prizeManagement')}</span>
          </a>
          <a class="text-on-surface-variant hover:bg-surface-variant/50 m-2 flex items-center gap-3 px-4 py-3 transition-colors duration-200 rounded-lg" href="#">
            <span class="material-symbols-outlined">group</span>
            <span class="font-body-md">${t('userRecords')}</span>
          </a>
          <a class="text-on-surface-variant hover:bg-surface-variant/50 m-2 flex items-center gap-3 px-4 py-3 transition-colors duration-200 rounded-lg" href="#">
            <span class="material-symbols-outlined">local_shipping</span>
            <span class="font-body-md">${t('shippingInfoReview')}</span>
          </a>
          <a class="text-on-surface-variant hover:bg-surface-variant/50 m-2 flex items-center gap-3 px-4 py-3 transition-colors duration-200 rounded-lg" href="#">
            <span class="material-symbols-outlined">settings</span>
            <span class="font-body-md">${t('settings')}</span>
          </a>
        </nav>
        <div class="mt-auto px-4">
          <button class="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/20 rounded-lg transition-colors" onclick="window.location.hash='#home'">
            <span class="material-symbols-outlined">logout</span>
            <span class="font-body-md font-semibold">${t('secureLogout')}</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-y-auto relative">
        <!-- Top Bar -->
        <header class="sticky top-0 z-30 flex justify-between items-center h-16 px-container-margin bg-surface/80 backdrop-blur-md shadow-sm">
          <button class="lg:hidden p-2 rounded-full hover:bg-surface-variant/20" onclick="window.__toggleAdminSidebar()">
            <span class="material-symbols-outlined">menu</span>
          </button>
          <div class="flex items-center gap-2">
            <span class="text-on-surface-variant font-body-md">${t('systemStatus')}:</span>
            <span class="flex items-center gap-1 text-tertiary font-bold text-sm">
              <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              ${t('operational')}
            </span>
          </div>
          <div class="flex items-center gap-3">
            ${renderLanguageDropdown('admin-lang-dropdown')}
            <div class="relative">
              <button class="text-on-surface-variant hover:bg-surface-variant/20 p-2 rounded-full transition-all">
                <span class="material-symbols-outlined">notifications</span>
              </button>
              <span class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </div>
          </div>
        </header>

        <div class="px-container-margin py-8 space-y-stack-md">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div class="glass-card p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div class="flex justify-between items-start mb-4">
                <div class="bg-primary-container/10 p-2 rounded-lg"><span class="material-symbols-outlined text-primary">payments</span></div>
                <span class="text-tertiary text-xs font-bold">+12.5%</span>
              </div>
              <p class="text-on-surface-variant font-label-caps text-label-caps">${t('totalRevenue')}</p>
              <h2 class="text-primary font-display-lg text-display-lg-mobile mt-1">$${stats.totalRevenue.toLocaleString()}</h2>
              <div class="mt-4 h-1 w-full bg-surface-variant rounded-full overflow-hidden"><div class="h-full bg-primary w-3/4"></div></div>
            </div>
            <div class="glass-card p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div class="flex justify-between items-start mb-4">
                <div class="bg-secondary-container/10 p-2 rounded-lg"><span class="material-symbols-outlined text-secondary">stadium</span></div>
                <span class="text-secondary text-xs font-bold">${stats.activeCount} ${t('active')}</span>
              </div>
              <p class="text-on-surface-variant font-label-caps text-label-caps">${t('activeDraws')}</p>
              <h2 class="text-secondary font-display-lg text-display-lg-mobile mt-1">${stats.activeDraws}</h2>
              <div class="mt-4 flex gap-1">
                <div class="h-1 flex-1 bg-secondary rounded-full"></div>
                <div class="h-1 flex-1 bg-secondary rounded-full"></div>
                <div class="h-1 flex-1 bg-secondary/30 rounded-full"></div>
              </div>
            </div>
            <div class="glass-card p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div class="flex justify-between items-start mb-4">
                <div class="bg-tertiary-container/10 p-2 rounded-lg"><span class="material-symbols-outlined text-tertiary">group</span></div>
                <span class="text-tertiary text-xs font-bold">${t('verified')}</span>
              </div>
              <p class="text-on-surface-variant font-label-caps text-label-caps">${t('totalMembers')}</p>
              <h2 class="text-tertiary font-display-lg text-display-lg-mobile mt-1">${stats.totalMembers.toLocaleString()}</h2>
              <p class="text-xs text-on-surface-variant mt-4">${stats.newSignups} ${t('newSignupsToday')}</p>
            </div>
          </div>

          <!-- Bento Grid: Registration Form + Members -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <!-- Registration Form -->
            <div class="lg:col-span-5 glass-card p-8 rounded-xl">
              <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-primary">add_circle</span>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${t('registerNewPrize')}</h3>
              </div>
              <form class="space-y-5" id="admin-register-form" onsubmit="event.preventDefault(); window.__registerProduct()">
                <div class="space-y-2">
                  <label class="font-label-caps text-label-caps text-on-surface-variant">${t('productPhoto')}</label>
                  <input type="file" accept="image/*" id="admin-photo-input" style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
                  <div class="relative group cursor-pointer border-2 border-dashed border-outline-variant rounded-xl h-40 flex flex-col items-center justify-center bg-surface-bright hover:bg-surface-variant/20 transition-all overflow-hidden" id="admin-photo-drop">
                    <img id="admin-photo-preview" class="absolute inset-0 w-full h-full object-contain bg-white" style="display:none" alt="preview">
                    <div id="admin-photo-placeholder" class="flex flex-col items-center pointer-events-none">
                      <span class="material-symbols-outlined text-outline text-4xl group-hover:scale-110 transition-transform">cloud_upload</span>
                      <span class="text-xs text-on-surface-variant mt-2">${t('clickOrDragUpload')}</span>
                    </div>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="font-label-caps text-label-caps text-on-surface-variant">${t('productName')}</label>
                  <input id="admin-product-name" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border" placeholder="iPhone 15 Pro" type="text" required>
                </div>
                <div class="space-y-2">
                  <label class="font-label-caps text-label-caps text-on-surface-variant">${t('productDescription')}</label>
                  <textarea id="admin-product-desc" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border resize-none" rows="2" placeholder="Natural Titanium, 256GB"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="font-label-caps text-label-caps text-on-surface-variant">${t('priceUSD')}</label>
                    <input id="admin-product-price" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border" placeholder="50.00" type="number" step="0.01" min="0" required>
                  </div>
                  <div class="space-y-2">
                    <label class="font-label-caps text-label-caps text-on-surface-variant">${t('ticketCost')}</label>
                    <input id="admin-product-ticket" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border" placeholder="1.00" type="number" step="0.01" min="0" required>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="font-label-caps text-label-caps text-on-surface-variant">${t('maxParticipants')}</label>
                    <input id="admin-product-max" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border" placeholder="100" type="number" min="1" required>
                  </div>
                  <div class="space-y-2">
                    <label class="font-label-caps text-label-caps text-on-surface-variant">${t('timerHours')}</label>
                    <input id="admin-product-timer" class="w-full bg-surface-bright border-outline-variant rounded-lg focus:ring-primary focus:border-primary px-4 py-3 outline-none border" placeholder="24" type="number" min="1" required>
                  </div>
                </div>
                <button class="w-full bg-primary text-on-primary font-bold py-4 rounded-full shadow-lg hover:shadow-primary/20 active:scale-95 transition-all mt-4" type="submit" id="admin-submit-btn">
                  ${t('initializeLuckyPick')}
                </button>
              </form>
            </div>

            <!-- Member Directory -->
            <div class="lg:col-span-7 glass-card p-8 rounded-xl flex flex-col">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary">manage_accounts</span>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface">${t('memberDirectory')}</h3>
                </div>
                <div class="relative w-full md:w-64">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
                  <input class="w-full pl-10 bg-surface-bright border-outline-variant rounded-full text-sm focus:ring-primary focus:border-primary px-4 py-2 outline-none border" placeholder="${t('searchMembers')}" type="text">
                </div>
              </div>
              <div class="overflow-x-auto flex-1">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-outline-variant">
                      <th class="py-4 font-label-caps text-label-caps text-on-surface-variant">${t('userIdentifier')}</th>
                      <th class="py-4 font-label-caps text-label-caps text-on-surface-variant">${t('joinDate')}</th>
                      <th class="py-4 font-label-caps text-label-caps text-on-surface-variant">${t('participation')}</th>
                      <th class="py-4 font-label-caps text-label-caps text-on-surface-variant">${t('status')}</th>
                      <th class="py-4"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/30">
                    ${members.map(m => `
                      <tr class="hover:bg-surface-variant/10 transition-colors">
                        <td class="py-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-tr ${m.colors} flex items-center justify-center text-[10px] font-bold text-on-primary">${m.initials}</div>
                            <span class="font-body-md text-on-surface">${m.name}</span>
                          </div>
                        </td>
                        <td class="py-4 text-sm text-on-surface-variant font-timer-numeric">${m.joinDate}</td>
                        <td class="py-4 text-sm text-on-surface">${m.tickets} Tickets</td>
                        <td class="py-4">
                          <span class="px-2 py-1 rounded-full ${m.status === 'verified' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-error-container/20 text-error'} text-[10px] font-bold uppercase">${m.status === 'verified' ? t('verified') : t('restricted')}</span>
                        </td>
                        <td class="py-4 text-right">
                          <button class="p-2 hover:bg-surface-variant rounded-full transition-colors"><span class="material-symbols-outlined text-outline">more_vert</span></button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="mt-auto pt-6 flex justify-between items-center text-sm text-on-surface-variant font-label-caps">
                <span>${t('showing')} ${members.length} ${t('of')} ${stats.totalMembers.toLocaleString()} ${t('members')}</span>
                <div class="flex gap-2">
                  <button class="p-2 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50" disabled><span class="material-symbols-outlined">chevron_left</span></button>
                  <button class="p-2 border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory Cards -->
          <div class="glass-card p-8 rounded-xl">
            <div class="flex items-center justify-between mb-8">
              <h3 class="font-headline-sm text-headline-sm text-on-surface">${t('latestInventory')}</h3>
              <button class="text-primary font-bold text-sm hover:underline">${t('viewAllInventory')}</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              ${inventory.map(item => `
                <div class="group relative bg-surface-bright border border-outline-variant/30 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div class="aspect-video relative overflow-hidden bg-surface-container">
                    <div class="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style="background-image: url('${item.image}')"></div>
                    <div class="absolute top-2 right-2 px-2 py-1 bg-${item.badge} text-white text-[10px] font-bold rounded-md ${item.urgent ? 'uppercase' : ''}">${item.badgeText}</div>
                  </div>
                  <div class="p-4">
                    <h4 class="font-bold text-on-surface truncate">${item.title}</h4>
                    <div class="flex justify-between items-center mt-2">
                      <span class="font-timer-numeric text-primary text-sm">$${item.price.toLocaleString()}</span>
                      <span class="text-xs ${item.urgent ? 'text-secondary font-bold' : 'text-on-surface-variant'} ${item.fill === 0 ? 'italic' : ''}">${item.timeLeft}</span>
                    </div>
                    <div class="mt-3 h-1.5 w-full bg-surface-variant rounded-full">
                      <div class="h-full bg-${item.fill === 0 ? 'outline' : item.urgent ? 'secondary' : item.fill < 50 ? 'tertiary' : 'primary'} rounded-full relative" style="width:${item.fill}%">
                        ${item.fill > 0 && !item.urgent ? '<div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse"></div>' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Shipping Info Review Card -->
          <div class="glass-card p-8 rounded-xl" id="admin-shipping-section">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">local_shipping</span>
                <h3 class="font-headline-sm text-headline-sm text-on-surface">${t('shippingInfoReview')}</h3>
              </div>
              <span class="text-xs bg-primary-container/20 text-primary font-bold px-3 py-1 rounded-full">
                총 ${shippingList.length}건
              </span>
            </div>
            ${shippingList.length === 0 ? `
              <div class="p-8 text-center bg-surface-bright rounded-xl border border-outline-variant/20">
                <p class="text-on-surface-variant text-sm">제출된 배송 정보가 없습니다.</p>
              </div>
            ` : `
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-outline-variant">
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">상품명</th>
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">당첨자 계정</th>
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">수령인 / 연락처</th>
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">배송 주소 (우편번호)</th>
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">상태</th>
                      <th class="py-3 font-label-caps text-label-caps text-on-surface-variant">관리</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/30">
                    ${shippingList.map(s => `
                      <tr class="hover:bg-surface-variant/10 transition-colors">
                        <td class="py-4">
                          <div class="flex items-center gap-3">
                            <img src="${s.imageUrl}" class="w-10 h-10 rounded-lg object-contain bg-white border border-outline-variant/20">
                            <span class="font-semibold text-on-surface text-sm">${s.productTitle}</span>
                          </div>
                        </td>
                        <td class="py-4">
                          <p class="font-bold text-sm text-on-surface">${s.winnerName}</p>
                          <p class="text-xs text-on-surface-variant font-mono">${s.winnerEmail}</p>
                        </td>
                        <td class="py-4">
                          <p class="font-semibold text-sm text-on-surface">${s.recipientName}</p>
                          <p class="text-xs font-mono text-on-surface-variant">${s.recipientPhone}</p>
                        </td>
                        <td class="py-4">
                          <p class="text-sm text-on-surface">${s.shippingAddress}</p>
                          <p class="text-xs font-mono text-on-surface-variant">[${s.zipCode}]</p>
                        </td>
                        <td class="py-4">
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${s.status === 'shipped' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-secondary-container/20 text-secondary'}">
                            ${s.status === 'shipped' ? '배송 완료' : '배송 대기'}
                          </span>
                        </td>
                        <td class="py-4">
                          ${s.status === 'shipped' ? `
                            <span class="text-xs text-outline font-bold">완료됨</span>
                          ` : `
                            <button onclick="window.__markShipped('${s.id}')" class="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-all shadow-sm">
                              배송 완료 처리
                            </button>
                          `}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>

    <!-- Success Toast Container -->
    <div id="admin-toast-container" class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4 pointer-events-none"></div>

    <!-- FAB -->
    <button class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group" onclick="document.getElementById('admin-register-form').scrollIntoView({ behavior: 'smooth' })">
      <span class="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
      <div class="absolute right-16 px-4 py-2 bg-inverse-surface text-inverse-on-surface rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">${t('newPrizeLaunch')}</div>
    </button>`;

  // --- Uploaded image data URL storage ---
  let _uploadedImageDataUrl = null;

  // Shared preview function for both click and drag
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      _uploadedImageDataUrl = e.target.result;
      const preview = document.getElementById('admin-photo-preview');
      const placeholder = document.getElementById('admin-photo-placeholder');
      if (preview) {
        preview.src = _uploadedImageDataUrl;
        preview.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }

  // Attach all upload handlers after DOM is ready
  function initUploadHandlers() {
    const fileInput = document.getElementById('admin-photo-input');
    const dropZone = document.getElementById('admin-photo-drop');
    if (!fileInput || !dropZone) return;

    // Click to open file dialog
    dropZone.addEventListener('click', () => {
      fileInput.value = '';
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) handleImageFile(fileInput.files[0]);
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = '#0058be';
      dropZone.style.backgroundColor = 'rgba(0,88,190,0.05)';
    });
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = '';
      dropZone.style.backgroundColor = '';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.style.borderColor = '';
      dropZone.style.backgroundColor = '';
      const file = e.dataTransfer?.files?.[0];
      if (file) handleImageFile(file);
    });

    console.log('[Admin] Upload handlers initialized');
  }

  // Product registration handler
  window.__registerProduct = () => {
    const name = document.getElementById('admin-product-name')?.value?.trim();
    const desc = document.getElementById('admin-product-desc')?.value?.trim();
    const price = document.getElementById('admin-product-price')?.value;
    const ticket = document.getElementById('admin-product-ticket')?.value;
    const max = document.getElementById('admin-product-max')?.value;
    const timer = document.getElementById('admin-product-timer')?.value;

    // Validation
    if (!name) {
      document.getElementById('admin-product-name')?.focus();
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      document.getElementById('admin-product-price')?.focus();
      return;
    }
    if (!ticket || parseFloat(ticket) <= 0) {
      document.getElementById('admin-product-ticket')?.focus();
      return;
    }
    if (!max || parseInt(max) <= 0) {
      document.getElementById('admin-product-max')?.focus();
      return;
    }
    if (!timer || parseFloat(timer) <= 0) {
      document.getElementById('admin-product-timer')?.focus();
      return;
    }

    // Register product
    const newProduct = addProduct({
      title: name,
      description: desc || '',
      imageUrl: window.__uploadedImageDataUrl || null,
      retailPrice: price,
      entryPrice: ticket,
      maxParticipants: max,
      timerHours: timer,
    });

    // Show success toast
    const toastContainer = document.getElementById('admin-toast-container');
    if (toastContainer) {
      toastContainer.innerHTML = `
        <div class="pointer-events-auto bg-tertiary text-on-tertiary rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-bounce" style="animation-duration:0.5s;animation-iteration-count:1">
          <span class="material-symbols-outlined text-3xl">check_circle</span>
          <div class="flex-1">
            <p class="font-bold text-sm">✅ ${t('productRegistered')}</p>
            <p class="text-xs opacity-80">${name} — $${parseFloat(price).toLocaleString()}</p>
          </div>
          <button class="px-3 py-1 bg-white/20 rounded-full text-sm font-bold hover:bg-white/30 transition-all" onclick="window.location.hash='#home'">
            ${t('viewHome')}
          </button>
        </div>`;
      setTimeout(() => { toastContainer.innerHTML = ''; }, 4000);
    }

    // Reset form
    document.getElementById('admin-register-form')?.reset();
    window.__uploadedImageDataUrl = null;
    const preview = document.getElementById('admin-photo-preview');
    const placeholder = document.getElementById('admin-photo-placeholder');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) { placeholder.style.display = ''; }
  };

  // Mobile sidebar toggle
  window.__toggleAdminSidebar = () => {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('fixed');
      sidebar.classList.toggle('inset-y-0');
      sidebar.classList.toggle('left-0');
    }
  };

  return html;
}

// Helper function to process image: scale to fit (contain) inside 16:9 (800x450), 
// and dynamically fill the background letterbox with the image's own background color.
function resizeAndCropImage(dataUrl, targetWidth = 800, targetHeight = 450) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Fill the canvas with a clean white background (prevents Tainted Canvas security errors)
        const bgColor = '#ffffff';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 3. Calculate scaling and positions to draw the entire image (contain-fit)
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth, drawHeight;
        let dx, dy;

        if (imgRatio > targetRatio) {
          // Image is wider than 16:9 -> fit width, add padding on top/bottom
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgRatio;
          dx = 0;
          dy = (targetHeight - drawHeight) / 2;
        } else {
          // Image is taller than 16:9 -> fit height, add padding on left/right
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgRatio;
          dx = (targetWidth - drawWidth) / 2;
          dy = 0;
        }

        // 4. Draw the whole image scaled down
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawWidth, drawHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.85)); // compress as JPEG with 85% quality
      } catch (err) {
        console.error('[Admin] Error drawing on canvas, falling back to original:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = (err) => {
      console.error('[Admin] Failed to load image element, falling back to original:', err);
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

export function init() {
  // Must be called AFTER render() HTML is inserted into the DOM
  const fileInput = document.getElementById('admin-photo-input');
  const dropZone = document.getElementById('admin-photo-drop');
  if (!fileInput || !dropZone) {
    console.warn('[Admin] Upload elements not found in DOM');
    return;
  }

  // Click to open file dialog
  dropZone.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  const processAndShowImage = (file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const resizedDataUrl = await resizeAndCropImage(ev.target.result);
      window.__uploadedImageDataUrl = resizedDataUrl;
      const preview = document.getElementById('admin-photo-preview');
      const placeholder = document.getElementById('admin-photo-placeholder');
      if (preview) { preview.src = resizedDataUrl; preview.style.display = 'block'; }
      if (placeholder) { placeholder.style.display = 'none'; }
    };
    reader.readAsDataURL(file);
  };

  // File selected via dialog
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      processAndShowImage(fileInput.files[0]);
    }
  });

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = '#0058be';
    dropZone.style.backgroundColor = 'rgba(0,88,190,0.05)';
  });
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = '';
    dropZone.style.backgroundColor = '';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.borderColor = '';
    dropZone.style.backgroundColor = '';
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processAndShowImage(file);
    }
  });

  window.__markShipped = (shippingId) => {
    updateShippingStatus(shippingId, 'shipped');
    alert('배송 상태가 [배송 완료]로 변경되었습니다.');
    window.dispatchEvent(new CustomEvent('languageChanged'));
  };

  console.log('[Admin] Upload handlers initialized successfully');
}

export function cleanup() {
  delete window.__toggleAdminSidebar;
  delete window.__registerProduct;
  delete window.__uploadedImageDataUrl;
  delete window.__markShipped;
}
