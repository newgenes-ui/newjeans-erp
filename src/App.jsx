import React, { useState, useEffect } from 'react';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';

// --- DATABASE VERSION FOR SEED RESET ---
const DB_VERSION = '2';

// --- MOCK SEED DATA ---
const initialItems = [
  { code: 'CD-001', name: "NewJeans 2nd EP 'Get Up' Album", type: '완제품', spec: 'Bunny Beach Bag Ver.', unit: 'EA', safetyStock: 100, purchasePrice: 9500, salesPrice: 18500, stock: 250 },
  { code: 'CD-002', name: "NewJeans Double Single 'How Sweet'", type: '완제품', spec: 'Standard Ver.', unit: 'EA', safetyStock: 80, purchasePrice: 11000, salesPrice: 22000, stock: 180 },
  { code: 'GD-001', name: 'NewJeans Official Lightstick (빙키봉)', type: '완제품', spec: 'LED Bluetooth V2', unit: 'EA', safetyStock: 50, purchasePrice: 22000, salesPrice: 49000, stock: 120 },
  { code: 'GD-002', name: 'NewJeans Tokki Keyring (토끼 키링)', type: '완제품', spec: 'Plush Mint', unit: 'EA', safetyStock: 150, purchasePrice: 6000, salesPrice: 15000, stock: 450 },
  { code: 'RM-CD', name: '공CD 디스크 (음반 프레싱 자재)', type: '원재료', spec: '120mm / Silver', unit: 'EA', safetyStock: 500, purchasePrice: 800, salesPrice: 0, stock: 2500 },
  { code: 'RM-PB', name: '포토북 인쇄용 수입지 (용지 지재)', type: '원재료', spec: 'Snow White 150g', unit: 'R', safetyStock: 200, purchasePrice: 1200, salesPrice: 0, stock: 320 }
];

const initialPartners = [
  // Existing Partners
  { code: 'PT-001', name: '위버스 글로벌 샵 (Weverse Shop)', type: '매출처', bizNum: '220-81-12345', owner: '최준원', email: 'support@weverse.io', phone: '02-120-4820' },
  { code: 'PT-002', name: '라인프렌즈 공식 스토어 (강남점)', type: '매출처', bizNum: '110-85-98765', owner: '이아름', email: 'wholesale@linefriends.com', phone: '02-3482-1234' },
  { code: 'PT-003', name: 'YG PLUS (음반 제작 위탁사)', type: '매입처', bizNum: '105-81-22941', owner: '최성준', email: 'logistics@ygplus.com', phone: '02-748-2940' },
  { code: 'PT-004', name: '(주)인쇄나라 (포토북 제작)', type: '매입처', bizNum: '206-82-44122', owner: '김종석', email: 'printing@nara.co.kr', phone: '031-987-1244' },
  { code: 'PT-005', name: 'SBS 예능제작본부', type: '매출처', bizNum: '101-81-00123', owner: '박상현', email: 'sbs_pd@sbs.co.kr', phone: '02-2113-5000' },
  
  // Image-Matching Partners
  { code: 'PT-006', name: '한림대학교', type: '매출처', bizNum: '아주대_오상욱P', owner: '오상욱', email: 'hanlim@univ.ac.kr', phone: '031-219-2114' },
  { code: 'PT-007', name: '이디럽서비스', type: '매출처', bizNum: '462-18-01288', owner: '이디럽 대표', email: 'info@edirub.com', phone: '02-582-9481' },
  { code: 'PT-008', name: '서울대 이장규P', type: '매출처', bizNum: '250811-01', owner: '이장규', email: 'jklee@snu.ac.kr', phone: '02-880-5114' },
  { code: 'PT-009', name: '주식회사 셀바스찬', type: '매출처', bizNum: '463-81-03153', owner: '세바스찬', email: 'contact@sebastian.co.kr', phone: '02-948-1244' }
];

const initialSales = [
  // Image-Matching Sales Entries (Seeded exactly as shown in the screenshot)
  { 
    id: 'SL-1001', 
    date: '2026-06-22', 
    seq: 2, 
    partnerCode: '아주대_오상욱P', 
    customer: '한림대학교', 
    paymentMethod: '', 
    note: '', 
    itemCode: 'CD-001', 
    itemName: 'Clonal Genes (300<X≤1800) - Total ea 외 2건', 
    qty: 3, 
    price: 735200, 
    supplyValue: 2205600, 
    vat: 220560, 
    purchasePlace: '엑소젠', 
    employee: '양유지', 
    isAccountReflected: false 
  },
  { 
    id: 'SL-1002', 
    date: '2026-06-22', 
    seq: 1, 
    partnerCode: '462-18-01288', 
    customer: '이디럽서비스', 
    paymentMethod: '나노엔텍(뉴진)', 
    note: '', 
    itemCode: 'CD-002', 
    itemName: 'ExTransfection, Transfection System starter pack (pipette, Station, 10ul, 100ul tips 192reaction)', 
    qty: 1, 
    price: 12000000, 
    supplyValue: 12000000, 
    vat: 1200000, 
    purchasePlace: '나노엔텍(뉴진)', 
    employee: '양유지', 
    isAccountReflected: true 
  },
  { 
    id: 'SL-1003', 
    date: '2026-06-17', 
    seq: 1, 
    partnerCode: '250811-01', 
    customer: '서울대 이장규P', 
    paymentMethod: '', 
    note: 'Q-669874', 
    itemCode: 'GD-001', 
    itemName: 'Gene Fragments without Adapters(300<X≤1800)- Total', 
    qty: 1, 
    price: 1937700, 
    supplyValue: 1937700, 
    vat: 193770, 
    purchasePlace: '엑소젠', 
    employee: '양유지', 
    isAccountReflected: false 
  },
  { 
    id: 'SL-1004', 
    date: '2026-06-11', 
    seq: 1, 
    partnerCode: '463-81-03153', 
    customer: '주식회사 셀바스찬', 
    paymentMethod: '6.22', 
    note: '', 
    itemCode: 'GD-002', 
    itemName: 'Stericup Quick Release-GP Sterile Vacuum Filtr 외 6건', 
    qty: 7, 
    price: 560928, 
    supplyValue: 3926500, 
    vat: 392650, 
    purchasePlace: '다원 홍성종', 
    employee: '양유지', 
    isAccountReflected: true 
  }
];

const initialPurchases = [
  { id: 'PC-1718000001', date: '2026-01-10', vendor: 'YG PLUS (음반 제작 위탁사)', itemCode: 'CD-001', itemName: "NewJeans 2nd EP 'Get Up' Album", qty: 1000, price: 9500, supplyValue: 9500000, vat: 950000, paymentMethod: '계좌' },
  { id: 'PC-1718000002', date: '2026-02-12', vendor: '(주)인쇄나라 (포토북 제작)', itemCode: 'RM-PB', itemName: '포토북 인쇄용 수입지 (용지 지재)', qty: 100, price: 12000, supplyValue: 1200000, vat: 120000, paymentMethod: '계좌' },
  { id: 'PC-1718000003', date: '2026-04-18', vendor: 'YG PLUS (음반 제작 위탁사)', itemCode: 'CD-001', itemName: "NewJeans 2nd EP 'Get Up' Album", qty: 1500, price: 9500, supplyValue: 14250000, vat: 1425000, paymentMethod: '계좌' },
  { id: 'PC-1718000004', date: '2026-06-12', vendor: '(주)인쇄나라 (포토북 제작)', itemCode: 'RM-PB', itemName: '포토북 인쇄용 수입지 (용지 지재)', qty: 150, price: 12000, supplyValue: 1800000, vat: 180000, paymentMethod: '계좌' }
];

const initialTaxInvoices = [
  { id: 'TX-1718000001', slipId: 'SL-1002', date: '2026-06-22', supplierName: '(주)어도어 (ADOR Co., Ltd.)', supplierRegNum: '107-86-94827', supplierOwner: '민희진', buyerName: '이디럽서비스', buyerRegNum: '462-18-01288', itemName: 'ExTransfection, Transfection System starter pack (pipette, Station, 10ul, 100ul tips 192reaction)', qty: 1, price: 12000000, supplyValue: 12000000, vat: 1200000, status: '발행' }
];

const initialBankTransactions = [
  { id: 'BT-001', date: '2026-06-20 14:15:32', accNum: '010-4829-1234-92 (기업은행)', partner: '위버스샵 정산 대금', type: '입금', amount: 35200000, balance: 185200000, synced: false, posted: false, slipId: '' },
  { id: 'BT-002', date: '2026-06-21 16:30:10', accNum: '010-4829-1234-92 (기업은행)', partner: 'YG PLUS 앨범 물류 대금', type: '출금', amount: 2400000, balance: 182800000, synced: false, posted: false, slipId: '' },
  { id: 'BT-003', date: '2026-06-22 09:10:45', accNum: '010-4829-1234-92 (기업은행)', partner: '하이브 댄스 스튜디오 대관료', type: '출금', amount: 1800000, balance: 181000000, synced: false, posted: false, slipId: '' },
  { id: 'BT-004', date: '2026-06-23 11:00:15', accNum: '010-4829-1234-92 (기업은행)', partner: 'SBS 인기가요 출연료 정산', type: '입금', amount: 500000, balance: 181500000, synced: false, posted: false, slipId: '' }
];

const initialCardSales = [
  { id: 'CS-001', date: '2026-06-22 18:24:11', cardCorp: '현대카드', partner: '위버스샵 온라인 결제', salesAmt: 1250000, fee: 12500, netAmt: 1237500, synced: false, posted: false, slipId: '' },
  { id: 'CS-002', date: '2026-06-22 20:15:33', cardCorp: '신한카드', partner: '홍대 팝업스토어 단말기', salesAmt: 4800000, fee: 48000, netAmt: 4752000, synced: false, posted: false, slipId: '' },
  { id: 'CS-003', date: '2026-06-23 09:11:58', cardCorp: '삼성카드', partner: '글로벌 위버스 몰 결제', salesAmt: 890000, fee: 8900, netAmt: 881100, synced: false, posted: false, slipId: '' }
];

const initialCardPurchases = [
  { id: 'CP-001', date: '2026-06-21 13:05:42', cardNum: 'KB국민법인카드 (9482)', partner: '버니즈 캠프 안무 스태프 식비', purchaseAmt: 450000, cardUser: '최성욱 실장 (매니지먼트)', synced: false, posted: false, slipId: '' },
  { id: 'CP-002', date: '2026-06-22 15:44:20', cardNum: 'KB국민법인카드 (9482)', partner: '뮤직비디오 소품 자재 구매', purchaseAmt: 120000, cardUser: '김주연 주임 (콘텐츠제작)', synced: false, posted: false, slipId: '' },
  { id: 'CP-003', date: '2026-06-22 17:10:05', cardNum: 'KB국민법인카드 (9482)', partner: '안무 연습실 생수/간식 비용', purchaseAmt: 85000, cardUser: '최성욱 실장 (매니지먼트)', synced: false, posted: false, slipId: '' }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'inventory', 'accounting'
  const [isLightMode, setIsLightMode] = useState(false);
  const [dashboardViewMode, setDashboardViewMode] = useState('monthly'); // 'monthly', 'quarterly'

  // DB Version Check - Clear localStorage if database schema changes
  useEffect(() => {
    const currentVersion = localStorage.getItem('nj_db_version');
    if (currentVersion !== DB_VERSION) {
      localStorage.removeItem('nj_items');
      localStorage.removeItem('nj_partners');
      localStorage.removeItem('nj_sales');
      localStorage.removeItem('nj_purchases');
      localStorage.removeItem('nj_tax_invoices');
      localStorage.removeItem('nj_bank_tx');
      localStorage.removeItem('nj_card_sales');
      localStorage.removeItem('nj_card_purchase');
      localStorage.setItem('nj_db_version', DB_VERSION);
      // Reload page to apply clean states
      window.location.reload();
    }
  }, []);

  // Global State (persisted in LocalStorage)
  const [items, setItems] = useState(() => {
    const local = localStorage.getItem('nj_items');
    return local ? JSON.parse(local) : initialItems;
  });

  const [partners, setPartners] = useState(() => {
    const local = localStorage.getItem('nj_partners');
    return local ? JSON.parse(local) : initialPartners;
  });

  const [sales, setSales] = useState(() => {
    const local = localStorage.getItem('nj_sales');
    return local ? JSON.parse(local) : initialSales;
  });

  const [purchases, setPurchases] = useState(() => {
    const local = localStorage.getItem('nj_purchases');
    return local ? JSON.parse(local) : initialPurchases;
  });

  const [taxInvoices, setTaxInvoices] = useState(() => {
    const local = localStorage.getItem('nj_tax_invoices');
    return local ? JSON.parse(local) : initialTaxInvoices;
  });

  const [bankTransactions, setBankTransactions] = useState(() => {
    const local = localStorage.getItem('nj_bank_tx');
    return local ? JSON.parse(local) : initialBankTransactions;
  });

  const [cardSalesTransactions, setCardSalesTransactions] = useState(() => {
    const local = localStorage.getItem('nj_card_sales');
    return local ? JSON.parse(local) : initialCardSales;
  });

  const [cardPurchaseTransactions, setCardPurchaseTransactions] = useState(() => {
    const local = localStorage.getItem('nj_card_purchase');
    return local ? JSON.parse(local) : initialCardPurchases;
  });

  // Linkage Connection State
  const [isIbkLinked, setIsIbkLinked] = useState(() => {
    const local = localStorage.getItem('nj_ibk_linked');
    return local ? JSON.parse(local) : false;
  });

  const [isCreLinked, setIsCreLinked] = useState(() => {
    const local = localStorage.getItem('nj_cre_linked');
    return local ? JSON.parse(local) : false;
  });

  // Recent system logs
  const [systemLogs, setSystemLogs] = useState(() => {
    const local = localStorage.getItem('nj_system_logs');
    return local ? JSON.parse(local) : [
      { id: 1, type: '시스템', time: '10:05:00', text: 'NJ-ERP 데스크톱 데이터베이스 초기 구축 완료.' },
      { id: 2, type: '재고', time: '10:05:10', text: '초기 굿즈 및 원재료 기초등록 로드 완료.' },
      { id: 3, type: '시스템', time: '10:27:00', text: '판매등록 메뉴 그리드 이미지 스펙(사원 양유지 외 13개 열) 패치 완료.' }
    ];
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('nj_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('nj_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('nj_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('nj_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('nj_tax_invoices', JSON.stringify(taxInvoices));
  }, [taxInvoices]);

  useEffect(() => {
    localStorage.setItem('nj_bank_tx', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('nj_card_sales', JSON.stringify(cardSalesTransactions));
  }, [cardSalesTransactions]);

  useEffect(() => {
    localStorage.setItem('nj_card_purchase', JSON.stringify(cardPurchaseTransactions));
  }, [cardPurchaseTransactions]);

  useEffect(() => {
    localStorage.setItem('nj_ibk_linked', JSON.stringify(isIbkLinked));
  }, [isIbkLinked]);

  useEffect(() => {
    localStorage.setItem('nj_cre_linked', JSON.stringify(isCreLinked));
  }, [isCreLinked]);

  useEffect(() => {
    localStorage.setItem('nj_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  // Dark/Light Theme toggler
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isLightMode]);

  const logActivity = (type, text) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog = {
      id: Date.now(),
      type,
      time: timeStr,
      text
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  // Financial Calculations
  const totalSalesAmount = sales.reduce((acc, curr) => acc + curr.supplyValue + curr.vat, 0);
  const totalPurchaseAmount = purchases.reduce((acc, curr) => acc + curr.supplyValue + curr.vat, 0);
  
  // Simulated Bank Cash Balance (Start balance of 150M + deposits - withdrawals)
  const baseCash = 150000000;
  
  // Calculate posted bank flow
  const bankFlow = bankTransactions
    .filter(tx => tx.synced && tx.posted)
    .reduce((acc, curr) => {
      return curr.type === '입금' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  
  // Calculate posted card sales flow (which goes to cash as net amount)
  const cardSalesFlow = cardSalesTransactions
    .filter(tx => tx.synced && tx.posted)
    .reduce((acc, curr) => acc + curr.netAmt, 0);

  // Calculate posted card purchase flow (which decreases cash)
  const cardPurchaseFlow = cardPurchaseTransactions
    .filter(tx => tx.synced && tx.posted)
    .reduce((acc, curr) => acc + curr.purchaseAmt, 0);

  const currentCashBalance = baseCash + bankFlow + cardSalesFlow - cardPurchaseFlow;

  // Inventory stats
  const lowStockCount = items.filter(i => i.stock <= i.safetyStock).length;

  // --- DASHBOARD MONTHLY & QUARTERLY GRAPH CALCULATION ---
  // Get sales by months
  const getMonthlySales = () => {
    const months = ['01', '02', '03', '04', '05', '06'];
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월'];
    return months.map((m, idx) => {
      const monthSales = sales
        .filter(s => s.date.split('-')[1] === m)
        .reduce((acc, curr) => acc + curr.supplyValue, 0);
      return { label: monthNames[idx], value: monthSales };
    });
  };

  // Get sales by quarters
  const getQuarterlySales = () => {
    const q1Sales = sales
      .filter(s => {
        const m = s.date.split('-')[1];
        return m === '01' || m === '02' || m === '03';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);

    const q2Sales = sales
      .filter(s => {
        const m = s.date.split('-')[1];
        return m === '04' || m === '05' || m === '06';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);

    return [
      { label: '1분기 (Q1)', value: q1Sales },
      { label: '2분기 (Q2)', value: q2Sales }
    ];
  };

  const chartData = dashboardViewMode === 'monthly' ? getMonthlySales() : getQuarterlySales();
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000000); // Prevent divide by zero

  return (
    <div className="app-container">
      
      {/* SIDEBAR (LNB) */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🐰</div>
          <div>
            <div className="logo-text">NJ-ERP</div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>For ADOR & Bunnies</div>
          </div>
        </div>

        <nav>
          <div className="menu-section-title">메인 업무</div>
          <ul className="menu-list">
            <li 
              className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 경영 대시보드
            </li>
            <li 
              className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              📦 재고 및 물류
            </li>
            <li 
              className={`menu-item ${activeTab === 'accounting' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounting')}
            >
              💳 회계 및 연동
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-row">
              <span>서버 연결</span>
              <span><span className="status-dot"></span>정상</span>
            </div>
            <div className="status-row">
              <span>기업은행 API</span>
              <span>
                <span className={`status-dot ${isIbkLinked ? '' : 'disconnected'}`}></span>
                {isIbkLinked ? '연결됨' : '미연결'}
              </span>
            </div>
            <div className="status-row">
              <span>여신협회 API</span>
              <span>
                <span className={`status-dot ${isCreLinked ? '' : 'disconnected'}`}></span>
                {isCreLinked ? '연결됨' : '미연결'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
            NJ-ERP v1.2.0 • 2026 ADOR
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        
        {/* HEADER (GNB) */}
        <header className="header-bar">
          <div className="page-title-container">
            <span className="page-title">
              {activeTab === 'dashboard' && '경영 종합 대시보드 (Management Dashboard)'}
              {activeTab === 'inventory' && '재고 수불 및 전표 처리'}
              {activeTab === 'accounting' && '전자세금계산서 및 금융 연동'}
            </span>
          </div>

          <div className="header-actions">
            <div className="theme-switch">
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {isLightMode ? '🌙 에스프레소' : '💡 Cozy 베이지'}
              </span>
              <button 
                className="theme-toggle-btn"
                onClick={() => setIsLightMode(!isLightMode)}
              >
                {isLightMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="content-area">
              
              {/* Top KPI row */}
              <div className="dashboard-grid">
                
                {/* cash balance */}
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">주거래 통장 잔액 (기업은행)</span>
                    <span className="kpi-icon">🏦</span>
                  </div>
                  <div className="kpi-value">{currentCashBalance.toLocaleString()}원</div>
                  <div className="kpi-subtext">
                    기초자금 1.5억 대조 대비 {' '}
                    <span className="kpi-trend up">
                      ▲ {((currentCashBalance - 150000000) / 150000000 * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Sales volume */}
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">누적 판매 매출액</span>
                    <span className="kpi-icon">📈</span>
                  </div>
                  <div className="kpi-value">{totalSalesAmount.toLocaleString()}원</div>
                  <div className="kpi-subtext">전표 등록 {sales.length}건 기준 (공급가+부가세)</div>
                </div>

                {/* Purchase volume */}
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">누적 매입 원가</span>
                    <span className="kpi-icon">📉</span>
                  </div>
                  <div className="kpi-value">{totalPurchaseAmount.toLocaleString()}원</div>
                  <div className="kpi-subtext">원부자재 및 앨범 위탁 생산 비용 합산</div>
                </div>

                {/* Safety stock alerts */}
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">재고부족 품목 경고</span>
                    <span className="kpi-icon">⚠️</span>
                  </div>
                  <div className="kpi-value" style={{ color: lowStockCount > 0 ? '#be123c' : 'inherit' }}>
                    {lowStockCount} 건
                  </div>
                  <div className="kpi-subtext">안전재고 임계치 이하로 설정된 자재 목록</div>
                </div>

              </div>

              {/* Bottom Split layout */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                
                {/* Monthly/Quarterly Sales Trend Chart (Custom Inline SVG) */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="panel-header" style={{ marginBottom: '8px', paddingBottom: 0 }}>
                    <h2 className="panel-title">누적 매출 판매 트렌드</h2>
                    <div className="btn-group">
                      <button 
                        className={`btn ${dashboardViewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setDashboardViewMode('monthly')}
                      >
                        월별 보기
                      </button>
                      <button 
                        className={`btn ${dashboardViewMode === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setDashboardViewMode('quarterly')}
                      >
                        분기별 보기
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {dashboardViewMode === 'monthly' ? '2026년 상반기 월별 총 판매 매출 공급가액 합계입니다.' : '2026년 분기별 총 판매 매출 공급가액 합계입니다.'}
                  </div>

                  <div className="chart-bar-container">
                    {chartData.map((d, idx) => {
                      const pct = Math.min(100, Math.max(8, (d.value / maxChartValue) * 100));

                      return (
                        <div key={idx} className="chart-bar-col">
                          <div className="chart-bar-fill" style={{ height: `${pct}%` }}>
                            <div className="chart-bar-value">
                              {d.value > 0 ? `${(d.value / 10000).toLocaleString()}만` : '0'}
                            </div>
                          </div>
                          <div className="chart-bar-label">
                            {d.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time System/ERP Action Log */}
                <div className="panel-card" style={{ maxHeight: '315px', overflowY: 'auto' }}>
                  <h2 className="panel-title" style={{ marginBottom: '16px' }}>실시간 시스템 활동 로그 (ERP logs)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {systemLogs.map(log => (
                      <div 
                        key={log.id} 
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid var(--border-color)', 
                          paddingBottom: '8px' 
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>[{log.time}]</span>
                        <span className={`badge ${
                          log.type === '재고' ? 'badge-blue' : 
                          log.type === '회계' ? 'badge-green' : 'badge-gray'
                        }`} style={{ padding: '0 6px', height: '18px' }}>
                          {log.type}
                        </span>
                        <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Data Summary Section */}
              <div className="panel-card">
                <h2 className="panel-title" style={{ marginBottom: '16px' }}>현재고 현황 요약 (기준일시: 실시간)</h2>
                <div className="table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>코드</th>
                        <th>구분</th>
                        <th>품목명</th>
                        <th style={{ textAlign: 'right' }}>안전재고</th>
                        <th style={{ textAlign: 'right' }}>현재고</th>
                        <th>단위</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.code}>
                          <td style={{ fontWeight: '600' }}>{item.code}</td>
                          <td>
                            <span className={`badge ${item.type === '완제품' ? 'badge-blue' : 'badge-pink'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{item.name}</td>
                          <td style={{ textAlign: 'right' }}>{item.safetyStock.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: item.stock <= item.safetyStock ? '#be123c' : 'inherit' }}>
                            {item.stock.toLocaleString()}
                          </td>
                          <td>{item.unit}</td>
                          <td>
                            {item.stock <= item.safetyStock ? (
                              <span style={{ color: '#be123c', fontSize: '12px', fontWeight: '600' }}>⚠️ 긴급 안전재고 미달 - 원자재 매입 필요</span>
                            ) : (
                              <span style={{ color: '#10b981', fontSize: '12px' }}>정상</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INVENTORY */}
          {activeTab === 'inventory' && (
            <Inventory 
              items={items}
              setItems={setItems}
              partners={partners}
              setPartners={setPartners}
              sales={sales}
              setSales={setSales}
              purchases={purchases}
              setPurchases={setPurchases}
              logActivity={logActivity}
            />
          )}

          {/* TAB 3: ACCOUNTING */}
          {activeTab === 'accounting' && (
            <Accounting 
              items={items}
              setItems={setItems}
              sales={sales}
              setSales={setSales}
              purchases={purchases}
              setPurchases={setPurchases}
              taxInvoices={taxInvoices}
              setTaxInvoices={setTaxInvoices}
              bankTransactions={bankTransactions}
              setBankTransactions={setBankTransactions}
              cardSalesTransactions={cardSalesTransactions}
              setCardSalesTransactions={setCardSalesTransactions}
              cardPurchaseTransactions={cardPurchaseTransactions}
              setCardPurchaseTransactions={setCardPurchaseTransactions}
              isIbkLinked={isIbkLinked}
              setIsIbkLinked={setIsIbkLinked}
              isCreLinked={isCreLinked}
              setIsCreLinked={setIsCreLinked}
              logActivity={logActivity}
            />
          )}

        </main>
      </div>
    </div>
  );
}
