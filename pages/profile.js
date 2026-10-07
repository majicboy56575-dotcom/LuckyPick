// ============================================
// LuckyPick - Profile & My Vault & Golden Tickets Page
// Clean Individual Item Shipping & Instant Points Conversion
// ============================================
import { t } from '../i18n.js';
import { getCurrentUser, convertVaultItemToPointsServer, requestVaultShippingServer, grantUserBalanceServer } from '../services/firestore.js';
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, sendPasswordReset, signOut, getCurrentAuthUser } from '../services/auth.js';
import { 
  getUserPoints, 
  setUserPoints, 
  getUserVault, 
  getAvailableGoldenTicketsCount, 
  getAppliedGoldenTickets, 
  convertVaultItemToPoints, 
  requestShippingForVaultItem,
  cancelGoldenTicketApplication
} from '../services/randombox.js';
import '../services/unboxing-modal.js';

let activeProfileTab = 'vault'; // 'vault' | 'tickets' | 'charge'
let isSignUpMode = false;

function renderLoginSection() {
  return `
    <main class="pt-20 px-4 max-w-[500px] mx-auto pb-32 page-enter">
      <div class="glass-card rounded-3xl p-8 shadow-xl text-center space-y-6 bg-white border border-slate-200">
        <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <span class="material-symbols-outlined text-4xl">lock</span>
        </div>
        <div>
          <h2 class="font-headline-sm text-2xl text-on-surface font-bold mb-1">${t('quickAccess')}</h2>
          <p class="text-on-surface-variant text-sm">${t('loginSubtitle')}</p>
        </div>

        <!-- Social Login -->
        <div class="space-y-3">
          <button onclick="window.__doLogin('google')" class="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant px-6 py-3 rounded-full hover:bg-surface-bright transition-all font-semibold text-on-surface shadow-sm active:scale-95 text-sm cursor-pointer">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ${t('continueGoogle')}
          </button>
          <button onclick="window.__doLogin('apple')" class="w-full flex items-center justify-center gap-3 bg-black text-white px-6 py-3 rounded-full hover:opacity-90 transition-all font-semibold shadow-md active:scale-95 text-sm cursor-pointer">
            <svg class="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            ${t('continueApple')}
          </button>
        </div>

        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-outline-variant/30"></div></div>
          <div class="relative flex justify-center text-xs text-on-surface-variant bg-white px-3"><span class="bg-surface-bright px-2 py-0.5 rounded-full">${t('orContinueWithEmail')}</span></div>
        </div>

        <!-- Email Auth Form -->
        <form id="email-auth-form" onsubmit="event.preventDefault(); window.__submitEmailAuth();" class="space-y-3 text-left">
          <div id="signup-name-field" class="space-y-1 hidden">
            <label class="text-xs font-bold text-on-surface-variant">${t('name')}</label>
            <input type="text" id="auth-name-input" class="w-full bg-surface-bright border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="홍길동">
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface-variant">${t('emailAddress')}</label>
            <input type="email" id="auth-email-input" class="w-full bg-surface-bright border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="user@example.com" required>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <label class="text-xs font-bold text-on-surface-variant">${t('password')}</label>
              <button type="button" onclick="window.__openPasswordResetModal()" id="forgot-pw-btn" class="text-[11px] text-slate-500 hover:text-primary transition-colors cursor-pointer">
                비밀번호를 잊으셨나요?
              </button>
            </div>
            <input type="password" id="auth-pw-input" class="w-full bg-surface-bright border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="6자 이상 입력" minlength="6" required>
          </div>
          <button type="submit" id="email-submit-btn" class="w-full py-3 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container transition-all active:scale-95 text-sm shadow-md mt-2 cursor-pointer">
            ${t('emailLogin')}
          </button>
        </form>

        <div class="flex justify-between items-center text-xs pt-1 px-1">
          <button onclick="window.__toggleAuthMode()" id="toggle-auth-btn" class="text-primary font-bold hover:underline cursor-pointer">
            ${t('noAccountSignup')}
          </button>
          <button type="button" onclick="window.__openPasswordResetModal()" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            아이디/비밀번호 찾기
          </button>
        </div>

        <div class="p-3 bg-surface-container-low rounded-xl text-left border border-primary/10">
          <p class="text-xs text-on-surface-variant leading-relaxed flex items-start gap-2">
            <span class="material-symbols-outlined text-primary text-[18px]">shield</span>
            <span>${t('loginForServicesNotice')}</span>
          </p>
        </div>
      </div>
    </main>`;
}

function renderPasswordResetModal(initialEmail = '') {
  return `
    <div class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" id="password-reset-modal" onclick="if(event.target===this)window.__closePasswordResetModal()">
      <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-3xl">lock_reset</span>
        </div>
        
        <h3 class="font-headline-sm text-lg font-bold text-gray-900 mb-1">아이디 / 비밀번호 재설정</h3>
        <p class="text-xs text-gray-500 mb-4 leading-relaxed">
          LuckyPick의 아이디는 가입하신 <strong>이메일 주소</strong>입니다.<br>
          비밀번호를 재설정할 이메일을 입력하시면 안전한 재설정 링크를 발송해 드립니다.
        </p>

        <form onsubmit="event.preventDefault(); window.__submitPasswordReset();" class="space-y-3 text-left">
          <div>
            <label class="text-xs font-bold text-gray-700 block mb-1">가입 이메일 주소</label>
            <input type="email" id="reset-email-input" value="${initialEmail}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="user@example.com" required>
          </div>

          <div id="reset-error-msg" class="hidden text-[11px] text-red-600 font-medium"></div>

          <div class="space-y-2 pt-2">
            <button type="submit" id="reset-submit-btn" class="w-full py-3 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary-container shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-base">mail</span>
              <span>비밀번호 재설정 이메일 전송</span>
            </button>
            <button type="button" onclick="window.__closePasswordResetModal()" class="w-full py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderSingleShippingModal(vaultItemId, itemTitle, itemImage, itemPrice) {
  const currentPts = getUserPoints();
  const baseShippingFee = 3000;
  const canPayWithPoints = currentPts >= baseShippingFee;

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop bg-black/60 backdrop-blur-sm" id="single-ship-modal" onclick="if(event.target===this)window.__closeSingleShipModal()">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <span class="material-symbols-outlined text-sm">local_shipping</span>
            </span>
            <div>
              <h3 class="font-bold text-base">실물 상품 배송 신청 & 배송비 결제</h3>
              <p class="text-[11px] text-slate-300 truncate max-w-[280px]">${itemTitle}</p>
            </div>
          </div>
          <button onclick="window.__closeSingleShipModal()" class="text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          <!-- Item Card Header -->
          <div class="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <img src="${itemImage}" class="w-14 h-14 rounded-xl object-cover border border-slate-200" alt="">
            <div class="min-w-0 flex-1">
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">100% 정품 보장</span>
              <h4 class="font-extrabold text-sm text-gray-900 truncate mt-0.5">${itemTitle}</h4>
              <p class="text-[11px] text-gray-500 font-mono">소비자 정가: <strong>₩${itemPrice.toLocaleString()}원</strong> (배송 신청 시 무료 수령)</p>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div id="s-ship-error-banner" class="hidden p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-2.5 animate-in fade-in zoom-in-95">
            <span class="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">error</span>
            <div class="flex-1">
              <div class="font-extrabold text-xs text-red-800">필수 입력사항을 확인해주세요</div>
              <div id="s-ship-error-msg" class="text-[11px] text-red-600 mt-0.5 font-medium"></div>
            </div>
          </div>

          <!-- Recipient Form -->
          <div class="space-y-3">
            <div class="flex items-center gap-1.5 font-bold text-gray-900 text-xs border-b pb-1.5">
              <span class="material-symbols-outlined text-sm text-primary">pin_drop</span>
              <span>수령인 및 배송지 정보</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="font-bold text-gray-700 block mb-1">수령인 성명 <span class="text-red-500 font-black">*</span></label>
                <input type="text" id="s-ship-name" oninput="window.__clearShipFieldError('name')" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary text-xs font-bold transition-all" placeholder="홍길동">
                <p id="s-ship-name-err" class="text-[10px] text-red-500 font-bold mt-1 hidden">수령인 성명을 입력해주세요.</p>
              </div>
              <div>
                <label class="font-bold text-gray-700 block mb-1">연락처 <span class="text-red-500 font-black">*</span></label>
                <input type="tel" id="s-ship-phone" oninput="window.__clearShipFieldError('phone')" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary text-xs font-bold transition-all" placeholder="010-1234-5678">
                <p id="s-ship-phone-err" class="text-[10px] text-red-500 font-bold mt-1 hidden">연락처(전화번호)를 입력해주세요.</p>
              </div>
            </div>

            <div>
              <label class="font-bold text-gray-700 block mb-1">배송지 주소 <span class="text-red-500 font-black">*</span></label>
              <input type="text" id="s-ship-addr" oninput="window.__clearShipFieldError('addr')" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary text-xs transition-all" placeholder="예: 서울시 강남구 테헤란로 123">
              <p id="s-ship-addr-err" class="text-[10px] text-red-500 font-bold mt-1 hidden">배송지 주소를 입력해주세요.</p>
            </div>

            <div>
              <label class="font-bold text-gray-700 block mb-1">상세 주소 및 우편번호</label>
              <input type="text" id="s-ship-detail" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary text-xs" placeholder="예: 101동 202호 (우: 06234)">
            </div>

            <div>
              <label class="font-bold text-gray-700 block mb-1">배송 메모</label>
              <select id="s-ship-memo" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary text-xs font-medium">
                <option value="부재 시 문 앞에 놓아주세요.">부재 시 문 앞에 놓아주세요.</option>
                <option value="배송 전 미리 연락 바랍니다.">배송 전 미리 연락 바랍니다.</option>
                <option value="경비실에 맡겨주세요.">경비실에 맡겨주세요.</option>
                <option value="택배함에 넣어주세요.">택배함에 넣어주세요.</option>
                <option value="직접 수령하겠습니다.">직접 수령하겠습니다.</option>
              </select>
            </div>

            <!-- Remote area checkbox -->
            <label class="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" id="s-ship-remote" onchange="window.__toggleRemoteAreaShipping()" class="rounded text-primary focus:ring-primary w-4 h-4">
              <span class="font-bold text-gray-700 text-xs">제주도 및 도서산간 지역 배송 (+₩3,000원 추가 운임)</span>
            </label>
          </div>

          <!-- Shipping Fee Payment Section -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between border-b pb-1.5">
              <div class="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                <span class="material-symbols-outlined text-sm text-amber-600">payments</span>
                <span>배송비 결제 수단 선택</span>
              </div>
              <span class="text-[11px] text-gray-500">기본 배송비 <strong>₩3,000원</strong></span>
            </div>

            <div class="space-y-2">
              <!-- Option 1: Points -->
              <label class="flex items-center justify-between p-3 border-2 ${canPayWithPoints ? 'border-primary/50 bg-blue-50/40 hover:bg-blue-50' : 'border-slate-200 bg-slate-50 opacity-70'} rounded-2xl cursor-pointer transition-all">
                <div class="flex items-center gap-3">
                  <input type="radio" name="ship-pay-method" value="points" ${canPayWithPoints ? 'checked' : ''} class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-gray-900">보유 포인트 차감 결제</span>
                      <span class="text-[10px] font-extrabold bg-primary text-white px-2 py-0.2 rounded-full">추천</span>
                    </div>
                    <p class="text-[11px] text-gray-500">내 보유 잔액: <strong class="font-mono ${canPayWithPoints ? 'text-primary' : 'text-red-500'}">₩${currentPts.toLocaleString()} P</strong></p>
                  </div>
                </div>
                <span class="font-mono font-bold text-xs ${canPayWithPoints ? 'text-primary' : 'text-gray-400'}">
                  ${canPayWithPoints ? '즉시 차감 가능' : '잔액 부족'}
                </span>
              </label>

              <!-- Option 2: Toss Payments / Card -->
              <label class="flex items-center justify-between p-3 border-2 border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all bg-white">
                <div class="flex items-center gap-3">
                  <input type="radio" name="ship-pay-method" value="toss" ${!canPayWithPoints ? 'checked' : ''} class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <span class="font-bold text-gray-900">토스페이 / 신용·체크카드 간편결제</span>
                    <p class="text-[11px] text-gray-500">모든 국내 카드사 / 토스 즉시 결제</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-gray-400 text-sm">credit_card</span>
              </label>

              <!-- Option 3: Kakao/Naver Pay -->
              <label class="flex items-center justify-between p-3 border-2 border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all bg-white">
                <div class="flex items-center gap-3">
                  <input type="radio" name="ship-pay-method" value="easy_pay" class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <span class="font-bold text-gray-900">카카오페이 / 네이버페이</span>
                    <p class="text-[11px] text-gray-500">원클릭 간편결제</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-gray-400 text-sm">account_balance_wallet</span>
              </label>

              <!-- Option 4: PayPal -->
              <label class="flex items-center justify-between p-3 border-2 border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all bg-white">
                <div class="flex items-center gap-3">
                  <input type="radio" name="ship-pay-method" value="paypal" class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <span class="font-bold text-gray-900">PayPal 해외 결제</span>
                    <p class="text-[11px] text-gray-500">Global Credit Card / PayPal Balance ($2.50)</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-gray-400 text-sm">public</span>
              </label>
            </div>
          </div>

          <!-- Cost Summary Box -->
          <div class="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
            <div class="flex justify-between items-center text-xs text-slate-300">
              <span>상품 수령액</span>
              <span class="font-mono font-bold text-emerald-400">₩0원 (보관함 획득 무료)</span>
            </div>
            <div class="flex justify-between items-center text-xs text-slate-300">
              <span>기본 택배 배송비 (CJ대한통운/우체국)</span>
              <span class="font-mono">₩3,000원</span>
            </div>
            <div id="s-ship-remote-row" class="justify-between items-center text-xs text-amber-300 hidden">
              <span>도서산간/제주 추가 운임</span>
              <span class="font-mono font-bold">+₩3,000원</span>
            </div>
            <div class="pt-2 border-t border-slate-700 flex justify-between items-center">
              <span class="font-extrabold text-sm text-white">최종 결제 배송비</span>
              <span id="s-ship-total-fee" class="font-black text-lg text-amber-300 font-mono">₩3,000원</span>
            </div>
          </div>
        </div>

        <input type="hidden" id="s-ship-vault-id" value="${vaultItemId}">
        <input type="hidden" id="s-ship-item-title" value="${itemTitle.replace(/"/g, '&quot;')}">

        <!-- Action Buttons -->
        <div class="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
          <button type="button" onclick="window.__closeSingleShipModal()" class="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer">
            취소
          </button>
          <button type="button" id="s-ship-submit-btn" onclick="window.__submitSingleShipping('${vaultItemId}')" class="flex-1 py-3.5 bg-primary hover:bg-primary-container text-white font-black rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
            <span class="material-symbols-outlined text-sm">payment</span>
            <span id="s-ship-btn-text">₩3,000원 결제 및 배송 접수</span>
          </button>
        </div>
      </div>
    </div>`;
}

function renderPointsPaymentModal(points, amount) {
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop" id="charge-pay-modal" onclick="if(event.target===this)window.__closeChargePayModal()">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">포인트 충전 결제</h3>
            <p class="text-xs text-slate-400">충전 즉시 1P = 1원으로 럭키박스 개봉에 사용됩니다</p>
          </div>
          <button onclick="window.__closeChargePayModal()" class="text-slate-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex justify-between items-center">
            <div>
              <span class="text-[10px] text-amber-800 font-bold uppercase block">CHARGE AMOUNT</span>
              <span class="font-black text-2xl text-amber-600 font-mono">+₩${points.toLocaleString()} P</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-gray-500 font-bold block">결제 금액</span>
              <span class="font-bold text-base text-gray-900 font-mono">₩${amount.toLocaleString()}원</span>
            </div>
          </div>

          <div class="space-y-2.5">
            <!-- 1. Toss / Card -->
            <button onclick="window.__executeChargePayment(${points}, '토스페이 / 카드')" class="w-full p-4 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center justify-between transition-colors text-left group">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">토스</span>
                <div>
                  <h4 class="font-bold text-sm text-gray-900 group-hover:text-blue-600">토스페이 / 카드 간편결제</h4>
                  <p class="text-[11px] text-gray-500">신용카드, 카카오페이, 네이버페이</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-blue-600">chevron_right</span>
            </button>

            <!-- 2. PayPal -->
            <button onclick="window.__executeChargePayment(${points}, 'PayPal')" class="w-full p-4 bg-indigo-50/60 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl flex items-center justify-between transition-colors text-left group">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">PayPal</span>
                <div>
                  <h4 class="font-bold text-sm text-gray-900 group-hover:text-indigo-600">PayPal 해외 결제</h4>
                  <p class="text-[11px] text-gray-500">Global Credit Card / PayPal</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-gray-400 group-hover:text-indigo-600">chevron_right</span>
            </button>
          </div>
        </div>

        <div class="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button onclick="window.__closeChargePayModal()" class="text-xs font-bold text-gray-500 hover:text-gray-800">
            닫기
          </button>
        </div>
      </div>
    </div>`;
}

function renderVaultTab(vault) {
  if (vault.length === 0) {
    return `
      <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <div class="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-4xl">inventory_2</span>
        </div>
        <h3 class="font-bold text-lg text-gray-900 mb-1">보관함이 비어있습니다</h3>
        <p class="text-xs text-gray-500 mb-6">100% 실물 득템 럭키박스를 개봉하고 상품을 챙겨가세요!</p>
        <button onclick="window.location.hash='#home'" class="px-6 py-3 bg-primary text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95">
          럭키박스 둘러보러 가기
        </button>
      </div>`;
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${vault.map(item => {
        const isStored = item.status === 'in_vault';
        const isPendingShip = item.status === 'shipping_requested';
        const isShipped = item.status === 'shipped' || Boolean(item.trackingNumber);
        const isConverted = item.status === 'converted_to_points';

        const statusBadges = {
          in_vault: '<span class="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">보관 중 (수령 가능)</span>',
          shipping_requested: '<span class="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">📦 배송 접수 (출고 대기)</span>',
          shipped: '<span class="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">🚚 배송 중 (출고 완료)</span>',
          converted_to_points: '<span class="text-[10px] font-black bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">🔄 포인트 전환 완료</span>',
        };

        const currentBadge = isShipped ? statusBadges.shipped : (statusBadges[item.status] || statusBadges.in_vault);
        const refundAmount = item.refundPoints || Math.round(item.retailPrice * 0.8);

        return `
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-[10px] font-bold text-gray-400">${item.tierName || '럭키박스'} 획득</span>
                ${currentBadge}
              </div>

              <div class="flex gap-3.5 items-center mb-4">
                <img src="${item.imageUrl}" class="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-xs" alt="${item.title}">
                <div class="min-w-0">
                  <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">${item.grade || 'NORMAL'}</span>
                  <h4 class="font-extrabold text-sm text-gray-900 mt-1 leading-snug line-clamp-2">${item.title}</h4>
                  <p class="text-xs text-gray-500 mt-1">정가: <strong class="text-gray-900">₩${item.retailPrice.toLocaleString()}원</strong></p>
                </div>
              </div>
            </div>

            ${isStored ? `
              <div class="flex gap-2 pt-2 border-t border-slate-100">
                <button onclick="window.__openSingleShippingModal('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${item.imageUrl}', ${item.retailPrice})" class="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-container transition-colors flex items-center justify-center gap-1 shadow-xs active:scale-95">
                  <span class="material-symbols-outlined text-[15px]">local_shipping</span>
                  배송 신청
                </button>
                <button onclick="window.__convertItemToPoints('${item.id}')" class="flex-1 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 active:scale-95">
                  <span class="material-symbols-outlined text-[15px]">swap_horiz</span>
                  80% 포인트 전환 (+₩${refundAmount.toLocaleString()}P)
                </button>
              </div>
            ` : isShipped ? `
              <div class="p-3 bg-indigo-50/70 rounded-xl text-xs text-indigo-950 border border-indigo-200 space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-1.5 font-bold">
                    <span class="material-symbols-outlined text-indigo-600 text-base">local_shipping</span>
                    <span>${item.carrier || 'CJ대한통운'}</span>
                  </div>
                  <span class="font-mono font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-100">${item.trackingNumber || '배송 준비'}</span>
                </div>
                <button onclick="window.__trackDelivery('${item.carrier || 'CJ대한통운'}', '${item.trackingNumber || ''}')" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-sm">open_in_new</span>
                  실시간 택배 배송 조회
                </button>
              </div>
            ` : isPendingShip ? `
              <div class="p-2.5 bg-blue-50/60 rounded-xl text-[11px] text-blue-900 border border-blue-100 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600 text-base">schedule</span>
                <span>출고 준비 중입니다 (관리자 확인 후 운송장 번호가 등록됩니다)</span>
              </div>
            ` : `
              <div class="p-2.5 bg-gray-50 rounded-xl text-[11px] text-gray-500 border border-gray-200 text-center font-bold">
                ✓ 포인트로 ₩${refundAmount.toLocaleString()}P 환급 전환되었습니다.
              </div>
            `}
          </div>`;
      }).join('')}
    </div>`;
}

function renderTicketsTab(unassignedCount, appliedTickets) {
  return `
    <div class="space-y-6">
      <!-- Unassigned Golden Tickets Wallet Balance -->
      <div class="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 rounded-3xl p-6 shadow-xl border border-amber-300 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full">
            MY GOLDEN WALLET
          </span>
          <h3 class="text-2xl font-black mt-2">내 미응모 골든 티켓: ${unassignedCount}장</h3>
          <p class="text-xs text-slate-900/80 mt-0.5">아이폰 16 Pro, PS5 Pro 등 원하는 스페셜 래플에 자유롭게 응모하세요!</p>
        </div>
        <button onclick="window.location.hash='#home'" class="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base">add_circle</span>
          스페셜 상품에 응모하러 가기
        </button>
      </div>

      <!-- Applied Tickets History -->
      <div>
        <h4 class="font-black text-lg text-gray-900 mb-3">응모 완료된 골든 티켓 목록 (${appliedTickets.length}건)</h4>
        ${appliedTickets.length === 0 ? `
          <div class="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-gray-500">
            아직 스페셜 래플에 응모한 티켓이 없습니다. 홈 화면에서 원하는 상품에 응모해 보세요!
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${appliedTickets.map(t => {
              const status = t.resolvedStatus || 'active';
              
              let badgeHtml = '';
              let borderClass = 'border-amber-300';
              let actionHtml = '';

              if (status === 'won') {
                badgeHtml = `
                  <span class="text-[10px] text-amber-950 font-black bg-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span class="material-symbols-outlined text-xs">military_tech</span>
                    🎉 1등 당첨 (보관함 지급)
                  </span>`;
                borderClass = 'border-amber-500 shadow-md bg-amber-50/30';
                actionHtml = `<span class="text-amber-700 font-extrabold text-[10px]">실물 보관함 확인</span>`;
              } else if (status === 'refunded') {
                badgeHtml = `
                  <span class="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">undo</span>
                    목표 미달 100% 자동 환불
                  </span>`;
                borderClass = 'border-slate-200 opacity-75';
                actionHtml = `<span class="text-slate-400 font-bold text-[10px]">티켓 환불 완료</span>`;
              } else if (status === 'closed_lost') {
                badgeHtml = `
                  <span class="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    🏁 추첨 종료 (미당첨)
                  </span>`;
                borderClass = 'border-slate-200 opacity-75';
                actionHtml = `<span class="text-slate-400 font-bold text-[10px]">마감됨</span>`;
              } else if (status === 'group_locked') {
                badgeHtml = `
                  <span class="text-[10px] text-blue-700 font-extrabold bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    그룹 ${t.groupNumber} 100% 달성 (추첨 대기)
                  </span>`;
                borderClass = 'border-blue-300';
                actionHtml = `<span class="text-blue-600 font-bold text-[10px]">추첨 확정</span>`;
              } else {
                badgeHtml = `
                  <span class="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    그룹 ${t.groupNumber} 실시간 모집 중
                  </span>`;
                borderClass = 'border-amber-300';
                actionHtml = `
                  <button onclick="window.__cancelTicketFromProfile('${t.raffleId}', '${t.ticketId}')" class="text-red-600 hover:text-red-800 font-bold underline cursor-pointer">
                    응모 취소
                  </button>`;
              }

              return `
                <div class="bg-white rounded-2xl border-2 ${borderClass} p-4 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all">
                  <div class="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-400/10 rounded-full pointer-events-none"></div>
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      ${badgeHtml}
                      <span class="text-[9px] text-gray-400">${new Date(t.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <p class="text-xs font-bold text-gray-800 line-clamp-1 mb-2">${t.raffleTitle}</p>
                    <div class="p-2.5 bg-slate-900 text-amber-300 rounded-xl text-center font-mono font-black text-sm tracking-wider shadow-inner mb-2">
                      ${t.ticketNumber}
                    </div>
                    <div class="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100">
                      <span class="text-gray-500 font-mono">슬롯 #${t.slotIndex}</span>
                      ${actionHtml}
                    </div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        `}
      </div>
    </div>`;
}

function renderChargeTab() {
  const pointsPackages = [
    { pts: 10000, price: 10000, bonus: 0, tag: '체험팩' },
    { pts: 30000, price: 30000, bonus: 2000, tag: '인기팩 +2,000P 보너스' },
    { pts: 50000, price: 50000, bonus: 5000, tag: '대박팩 +5,000P 보너스' },
    { pts: 100000, price: 100000, bonus: 15000, tag: 'VIP팩 +15,000P 보너스' },
  ];

  return `
    <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div>
        <h3 class="font-black text-xl text-gray-900">포인트 즉시 충전 (1P = 1원)</h3>
        <p class="text-xs text-gray-500 mt-1">원하는 결제수단(토스페이, 카드 간편결제, PayPal)으로 포인트를 충전하고 럭키박스를 개봉하세요.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        ${pointsPackages.map(pkg => `
          <div class="border-2 border-slate-200 hover:border-primary rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group" onclick="window.__openChargePayModal(${pkg.pts + pkg.bonus}, ${pkg.price})">
            <div>
              <span class="text-[10px] font-extrabold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">${pkg.tag}</span>
              <h4 class="font-black text-2xl text-gray-900 mt-3 font-mono">₩${(pkg.pts + pkg.bonus).toLocaleString()} P</h4>
              <p class="text-xs text-gray-500 mt-1">결제 금액: <strong>₩${pkg.price.toLocaleString()}원</strong></p>
            </div>
            <button class="w-full mt-4 py-2.5 bg-slate-900 group-hover:bg-primary text-white font-bold rounded-xl text-xs transition-colors shadow-xs">
              충전하기
            </button>
          </div>
        `).join('')}
      </div>
    </div>`;
}

export function render() {
  window.__toggleAuthMode = () => {
    isSignUpMode = !isSignUpMode;
    const nameField = document.getElementById('signup-name-field');
    const submitBtn = document.getElementById('email-submit-btn');
    const toggleBtn = document.getElementById('toggle-auth-btn');

    if (isSignUpMode) {
      if (nameField) nameField.classList.remove('hidden');
      if (submitBtn) submitBtn.textContent = t('emailSignup');
      if (toggleBtn) toggleBtn.textContent = t('alreadyHaveAccount');
    } else {
      if (nameField) nameField.classList.add('hidden');
      if (submitBtn) submitBtn.textContent = t('emailLogin');
      if (toggleBtn) toggleBtn.textContent = t('noAccountSignup');
    }
  };

  window.__submitEmailAuth = async () => {
    const email = document.getElementById('auth-email-input')?.value.trim();
    const password = document.getElementById('auth-pw-input')?.value.trim();
    const name = document.getElementById('auth-name-input')?.value.trim();

    if (!email || !password) return;

    const submitBtn = document.getElementById('email-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> 처리 중...';
    }

    try {
      if (isSignUpMode) {
        await signUpWithEmail(email, password, name);
        alert(`🎉 회원가입이 완료되었습니다!\n(${email})`);
      } else {
        await signInWithEmail(email, password);
      }

      const hash = window.location.hash;
      if (hash.includes('redirect=')) {
        const target = hash.split('redirect=')[1].split('&')[0];
        window.location.hash = `#${target}`;
      } else {
        window.location.hash = '#profile';
        window.location.reload();
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (!isSignUpMode) {
        alert(`⚠️ 로그인 실패: ${err.message || '아이디 또는 비밀번호를 확인해주세요.'}`);
      } else {
        alert(`회원가입 실패: ${err.message || '회원가입 정보를 확인해주세요.'}`);
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? t('emailSignup') : t('emailLogin');
      }
    }
  };

  window.__doLogin = async (provider) => {
    try {
      if (provider === 'google') await signInWithGoogle();
      else if (provider === 'apple') await signInWithApple();

      const hash = window.location.hash;
      if (hash.includes('redirect=')) {
        const target = hash.split('redirect=')[1].split('&')[0];
        window.location.hash = `#${target}`;
      } else {
        window.location.hash = '#profile';
        window.location.reload();
      }
    } catch (err) {
      alert(`로그인 오류: ${err.message}`);
    }
  };

  window.__doLogout = async () => {
    await signOut();
    alert('로그아웃 되었습니다.');
    window.location.reload();
  };

  window.__openPasswordResetModal = () => {
    const currentEmail = document.getElementById('auth-email-input')?.value?.trim() || '';
    const existing = document.getElementById('password-reset-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', renderPasswordResetModal(currentEmail));
  };

  window.__closePasswordResetModal = () => {
    const modal = document.getElementById('password-reset-modal');
    if (modal) modal.remove();
  };

  window.__submitPasswordReset = async () => {
    const emailInput = document.getElementById('reset-email-input');
    const submitBtn = document.getElementById('reset-submit-btn');
    const errorMsg = document.getElementById('reset-error-msg');
    const email = emailInput?.value?.trim();

    if (!email) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> 전송 중...';
    }
    if (errorMsg) errorMsg.classList.add('hidden');

    try {
      await sendPasswordReset(email);
      alert(`📧 [비밀번호 재설정 이메일 발송 완료]\n\n${email} 주소로 비밀번호 재설정 링크를 전송했습니다.\n이메일 편지함(또는 스팸함)을 확인하여 비밀번호를 재설정해주세요.`);
      window.__closePasswordResetModal();
    } catch (err) {
      console.error('Password reset error:', err);
      let msg = '비밀번호 재설정 이메일 전송에 실패했습니다.';
      if (err.code === 'auth/user-not-found') {
        msg = '해당 이메일로 가입된 계정을 찾을 수 없습니다.';
      } else if (err.code === 'auth/invalid-email') {
        msg = '올바르지 않은 이메일 형식입니다.';
      } else if (err.message) {
        msg = err.message;
      }
      if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
      } else {
        alert(`⚠️ ${msg}`);
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">mail</span><span>비밀번호 재설정 이메일 전송</span>';
      }
    }
  };

  const authUser = getCurrentAuthUser();
  if (!authUser) {
    return renderLoginSection();
  }

  const user = getCurrentUser() || { name: authUser.displayName || '이용자', email: authUser.email };
  const userPts = getUserPoints();
  const unassignedTickets = getAvailableGoldenTicketsCount();
  const appliedTickets = getAppliedGoldenTickets();
  const vault = getUserVault();

  const html = `
    <main class="pt-8 pb-32 px-container-margin max-w-[1100px] mx-auto page-enter">
      <!-- Profile Header Summary Card -->
      <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 flex flex-wrap items-center justify-between gap-6 border border-slate-800">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md">
            ${user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-black text-xl text-white">${user.name}</h2>
              <span class="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">VIP MEMBER</span>
            </div>
            <p class="text-xs text-slate-400 font-mono mt-0.5">${user.email}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Golden Tickets Summary Card -->
          <div class="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-400/30 text-right cursor-pointer hover:border-amber-400 transition-all" onclick="window.location.hash='#home'" title="홈 화면에서 스페셜 상품에 응모하세요!">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] text-amber-300 font-extrabold flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">confirmation_number</span>
                골든티켓
              </span>
              <span class="text-[9px] text-amber-200 font-bold bg-amber-400/20 px-1.5 py-0.2 rounded">응모하기 &gt;</span>
            </div>
            <span class="font-black text-xl text-amber-400 font-mono mt-0.5 block">${unassignedTickets.toLocaleString()}장</span>
          </div>

          <!-- Points Display Card -->
          <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-right">
            <span class="text-[10px] text-gray-300 font-bold block">내 보유 포인트</span>
            <span id="profile-points-display" class="font-black text-2xl text-amber-300 font-mono">₩${userPts.toLocaleString()} P</span>
          </div>

          <button onclick="window.__switchProfileTab('charge')" class="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-md hover:from-amber-400 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-base">add_circle</span>
            + 포인트 충전
          </button>

          <button onclick="window.__doLogout()" class="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="로그아웃">
            <span class="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs (3 Tabs: Vault, Golden Tickets, Points Charge) -->
      <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-6">
        <button onclick="window.__switchProfileTab('vault')" id="tab-btn-vault" class="px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${activeProfileTab === 'vault' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100'}">
          <span class="material-symbols-outlined text-base">inventory_2</span>
          내 실물 보관함 (${vault.length})
        </button>

        <button onclick="window.__switchProfileTab('tickets')" id="tab-btn-tickets" class="px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${activeProfileTab === 'tickets' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold' : 'bg-white text-gray-600 hover:bg-slate-100'}">
          <span class="material-symbols-outlined text-base">confirmation_number</span>
          내 골든 티켓 (${unassignedTickets}장 보유)
        </button>

        <button onclick="window.__switchProfileTab('charge')" id="tab-btn-charge" class="px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${activeProfileTab === 'charge' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100'}">
          <span class="material-symbols-outlined text-base">payments</span>
          포인트 충전
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="profile-tab-content">
        ${activeProfileTab === 'vault' ? renderVaultTab(vault) : activeProfileTab === 'tickets' ? renderTicketsTab(unassignedTickets, appliedTickets) : renderChargeTab()}
      </div>

      <div id="vault-modal-container"></div>
    </main>`;

  // Handlers
  window.__switchProfileTab = (tab) => {
    activeProfileTab = tab;
    const content = document.getElementById('profile-tab-content');
    const btnVault = document.getElementById('tab-btn-vault');
    const btnTickets = document.getElementById('tab-btn-tickets');
    const btnCharge = document.getElementById('tab-btn-charge');

    if (btnVault && btnTickets && btnCharge) {
      btnVault.className = 'px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ' + (tab === 'vault' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100');
      btnTickets.className = 'px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ' + (tab === 'tickets' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold' : 'bg-white text-gray-600 hover:bg-slate-100');
      btnCharge.className = 'px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ' + (tab === 'charge' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-slate-100');
    }

    if (content) {
      if (tab === 'vault') content.innerHTML = renderVaultTab(getUserVault());
      else if (tab === 'tickets') content.innerHTML = renderTicketsTab(getAvailableGoldenTicketsCount(), getAppliedGoldenTickets());
      else content.innerHTML = renderChargeTab();
    }
  };

  window.__openSingleShippingModal = (vaultId, title, image, price) => {
    const container = document.getElementById('vault-modal-container') || document.body;
    const existing = document.getElementById('single-ship-modal');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', renderSingleShippingModal(vaultId, title, image, price));
  };

  window.__closeSingleShipModal = () => {
    const modal = document.getElementById('single-ship-modal');
    if (modal) modal.remove();
  };

  window.__toggleRemoteAreaShipping = () => {
    const isRemote = Boolean(document.getElementById('s-ship-remote')?.checked);
    const baseFee = 3000;
    const totalFee = isRemote ? baseFee + 3000 : baseFee;

    const feeDisplay = document.getElementById('s-ship-total-fee');
    const remoteRow = document.getElementById('s-ship-remote-row');
    const btnText = document.getElementById('s-ship-btn-text');

    if (feeDisplay) feeDisplay.textContent = `₩${totalFee.toLocaleString()}원`;
    if (remoteRow) {
      if (isRemote) {
        remoteRow.classList.remove('hidden');
        remoteRow.classList.add('flex');
      } else {
        remoteRow.classList.add('hidden');
        remoteRow.classList.remove('flex');
      }
    }
    if (btnText) btnText.textContent = `₩${totalFee.toLocaleString()}원 결제 및 배송 접수`;
  };

  window.__clearShipFieldError = (fieldKey) => {
    const inputMap = {
      name: document.getElementById('s-ship-name'),
      phone: document.getElementById('s-ship-phone'),
      addr: document.getElementById('s-ship-addr')
    };
    const errMap = {
      name: document.getElementById('s-ship-name-err'),
      phone: document.getElementById('s-ship-phone-err'),
      addr: document.getElementById('s-ship-addr-err')
    };

    const targetInput = inputMap[fieldKey];
    const targetErr = errMap[fieldKey];
    if (targetInput) {
      targetInput.classList.remove('border-red-500', 'bg-red-50/60', 'ring-2', 'ring-red-300');
      targetInput.classList.add('border-slate-200', 'bg-slate-50');
    }
    if (targetErr) {
      targetErr.classList.add('hidden');
    }

    // Hide top banner if all required fields are now filled
    const nameVal = document.getElementById('s-ship-name')?.value?.trim();
    const phoneVal = document.getElementById('s-ship-phone')?.value?.trim();
    const addrVal = document.getElementById('s-ship-addr')?.value?.trim();
    if (nameVal && phoneVal && addrVal) {
      const banner = document.getElementById('s-ship-error-banner');
      if (banner) banner.classList.add('hidden');
    }
  };

  window.__submitSingleShipping = async (passedVaultId) => {
    const vaultId = passedVaultId || document.getElementById('s-ship-vault-id')?.value;
    const itemTitle = document.getElementById('s-ship-item-title')?.value || '';
    
    const nameInput = document.getElementById('s-ship-name');
    const phoneInput = document.getElementById('s-ship-phone');
    const addrInput = document.getElementById('s-ship-addr');
    const nameErr = document.getElementById('s-ship-name-err');
    const phoneErr = document.getElementById('s-ship-phone-err');
    const addrErr = document.getElementById('s-ship-addr-err');
    const errorBanner = document.getElementById('s-ship-error-banner');
    const errorMsg = document.getElementById('s-ship-error-msg');

    const name = nameInput?.value?.trim();
    const phone = phoneInput?.value?.trim();
    const addr = addrInput?.value?.trim();
    const detail = document.getElementById('s-ship-detail')?.value?.trim() || '';
    const memo = document.getElementById('s-ship-memo')?.value || '부재 시 문 앞에 놓아주세요.';
    const isRemote = Boolean(document.getElementById('s-ship-remote')?.checked);
    const payMethod = document.querySelector('input[name="ship-pay-method"]:checked')?.value || 'points';

    // Reset styles
    [
      { input: nameInput, err: nameErr },
      { input: phoneInput, err: phoneErr },
      { input: addrInput, err: addrErr }
    ].forEach(({ input, err }) => {
      if (input) {
        input.classList.remove('border-red-500', 'bg-red-50/60', 'ring-2', 'ring-red-300');
        input.classList.add('border-slate-200', 'bg-slate-50');
      }
      if (err) err.classList.add('hidden');
    });

    const missingFields = [];
    let firstMissingElem = null;

    if (!name) {
      missingFields.push('수령인 성명');
      if (nameInput) {
        nameInput.classList.add('border-red-500', 'bg-red-50/60', 'ring-2', 'ring-red-300');
        nameInput.classList.remove('border-slate-200', 'bg-slate-50');
      }
      if (nameErr) nameErr.classList.remove('hidden');
      if (!firstMissingElem) firstMissingElem = nameInput;
    }

    if (!phone) {
      missingFields.push('연락처(전화번호)');
      if (phoneInput) {
        phoneInput.classList.add('border-red-500', 'bg-red-50/60', 'ring-2', 'ring-red-300');
        phoneInput.classList.remove('border-slate-200', 'bg-slate-50');
      }
      if (phoneErr) phoneErr.classList.remove('hidden');
      if (!firstMissingElem) firstMissingElem = phoneInput;
    }

    if (!addr) {
      missingFields.push('배송지 주소');
      if (addrInput) {
        addrInput.classList.add('border-red-500', 'bg-red-50/60', 'ring-2', 'ring-red-300');
        addrInput.classList.remove('border-slate-200', 'bg-slate-50');
      }
      if (addrErr) addrErr.classList.remove('hidden');
      if (!firstMissingElem) firstMissingElem = addrInput;
    }

    if (missingFields.length > 0) {
      if (errorBanner && errorMsg) {
        errorMsg.innerHTML = `아래 필수 입력사항이 작성되지 않았습니다:<br><strong>• ${missingFields.join('<br>• ')}</strong>`;
        errorBanner.classList.remove('hidden');
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (firstMissingElem) {
        firstMissingElem.focus();
      }

      alert(`⚠️ [필수 입력사항 누락]\n\n배송 신청을 위해 필수 항목을 모두 입력해주세요:\n• ${missingFields.join('\n• ')}`);
      return;
    }

    const fee = isRemote ? 6000 : 3000;
    const methodNames = {
      points: '보유 포인트 차감',
      toss: '토스페이 / 카드 간편결제',
      easy_pay: '카카오/네이버페이',
      paypal: 'PayPal'
    };

    try {
      await requestVaultShippingServer(vaultId, {
        itemTitle,
        name,
        phone,
        address: `${addr} ${detail}`.trim(),
        memo,
        isRemote,
        fee,
        payMethod,
        payMethodName: methodNames[payMethod] || '포인트'
      });

      alert(`🎉 [배송비 ₩${fee.toLocaleString()}원 ${methodNames[payMethod]} 결제 완료]\n실물 상품 배송 요청이 성공적으로 접수되었습니다!\n\n• 수령인: ${name} (${phone})\n• 배송지: ${addr} ${detail}`);
      window.__closeSingleShipModal();
      window.__switchProfileTab('vault');

      // Refresh top points display
      const newPts = getUserPoints();
      const ptsHeader = document.querySelector('#profile-points-display, .font-black.text-2xl.text-amber-300');
      if (ptsHeader) ptsHeader.textContent = `₩${newPts.toLocaleString()} P`;
    } catch (err) {
      console.error('Submit shipping error:', err);
      alert(err.message || '배송 요청 처리 중 오류가 발생했습니다.');
    }
  };

  window.__openChargePayModal = (points, amount) => {
    const container = document.getElementById('vault-modal-container') || document.body;
    const existing = document.getElementById('charge-pay-modal');
    if (existing) existing.remove();
    container.insertAdjacentHTML('beforeend', renderPointsPaymentModal(points, amount));
  };

  window.__closeChargePayModal = () => {
    const modal = document.getElementById('charge-pay-modal');
    if (modal) modal.remove();
  };

  window.__executeChargePayment = async (points, method) => {
    try {
      const current = getUserPoints();
      await grantUserBalanceServer(null, null, current + points, null);
      alert(`🎉 [${method} 결제 완료]\n₩${points.toLocaleString()}P 가 즉시 충전되었습니다!\n현재 잔액: ₩${(current + points).toLocaleString()}P`);
      window.__closeChargePayModal();
      window.location.reload();
    } catch (err) {
      alert(`충전 오류: ${err.message || err}`);
    }
  };

  window.__convertItemToPoints = async (vaultId) => {
    try {
      const res = await convertVaultItemToPointsServer(vaultId);
      const title = res.item?.title || res.item?.name || '상품';
      alert(`🎉 [80% 포인트 환급 완료]\n[${title}]\n+₩${res.addedPoints.toLocaleString()}P 가 즉시 적립되었습니다!\n현재 보유 포인트: ₩${res.newPoints.toLocaleString()}P`);
      window.__switchProfileTab('vault');

      // Refresh top points display
      const newPts = res.newPoints;
      const ptsDisplay = document.querySelector('#profile-points-display, .font-black.text-2xl.text-amber-300');
      if (ptsDisplay) ptsDisplay.textContent = `₩${newPts.toLocaleString()} P`;
    } catch (err) {
      console.error('Convert to points error:', err);
      alert(err.message || '포인트 전환 중 오류가 발생했습니다.');
    }
  };

  window.__trackDelivery = (carrier, trackingNumber) => {
    if (!trackingNumber) {
      alert('운송장 번호가 아직 등록되지 않았습니다.');
      return;
    }
    const query = encodeURIComponent(`${carrier} 배송조회 ${trackingNumber}`);
    window.open(`https://m.search.naver.com/search.naver?query=${query}`, '_blank');
  };

  window.__cancelTicketFromProfile = (raffleId, ticketId) => {
    if (!confirm('이 골든 티켓 응모를 취소하시겠습니까?\n취소 시 티켓은 내 지갑으로 즉시 반환되며, 뒤 순서 참여자의 순번이 1칸씩 자동으로 앞당겨집니다.')) return;
    try {
      const res = cancelGoldenTicketApplication(raffleId, ticketId);
      alert(`✓ 골든 티켓 응모가 취소되어 내 지갑으로 환불 반환되었습니다.\n잔여 보유 티켓: ${res.newAvailableBalance}장`);
      window.__switchProfileTab('tickets');
    } catch (err) {
      alert(err.message);
    }
  };

  return html;
}

export function cleanup() {
  delete window.__toggleAuthMode;
  delete window.__submitEmailAuth;
  delete window.__doLogin;
  delete window.__doLogout;
  delete window.__openPasswordResetModal;
  delete window.__closePasswordResetModal;
  delete window.__submitPasswordReset;
  delete window.__switchProfileTab;
  delete window.__openSingleShippingModal;
  delete window.__closeSingleShipModal;
  delete window.__toggleRemoteAreaShipping;
  delete window.__submitSingleShipping;
  delete window.__openChargePayModal;
  delete window.__closeChargePayModal;
  delete window.__executeChargePayment;
  delete window.__convertItemToPoints;
  delete window.__trackDelivery;
  delete window.__cancelTicketFromProfile;
}

