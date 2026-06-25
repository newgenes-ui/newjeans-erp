import React, { useState, useEffect } from 'react';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import FixedExpenses from './components/FixedExpenses';

// --- DATABASE VERSION FOR SEED RESET ---
const DB_VERSION = '17';

import initialPartners from './data/partners.json';
import initialItems from './data/items.json';
import initialSales from './data/sales.json';
import initialPurchases from './data/purchases.json';


const initialTaxInvoices = [
  { 
    id: 'TX-1718000001', 
    slipId: 'SL-1002', 
    date: '2026-06-22', 
    supplierName: '(주)뉴진사이언스', 
    supplierRegNum: '595-81-02960', 
    supplierOwner: '김기환', 
    supplierAddress: '경기도 광명시 소하동 190,광명G타워 B동 921호',
    supplierBizType: '도소매',
    supplierBizItem: '연구용시약기재수출입업',
    supplierEmail: 'newgenes@newgenesci.com',
    buyerName: '이디럽서비스', 
    buyerRegNum: '462-18-01288', 
    buyerOwner: '이디럽 대표',
    buyerAddress: '인천광역시 부평구 부평대로 301',
    buyerBizType: '서비스업',
    buyerBizItem: '전자상거래',
    buyerEmail: 'edirup@naver.com',
    itemName: 'ExTransfection, Transfection System starter pack (pipette, Station, 10ul, 100ul tips 192reaction)', 
    qty: 1, 
    price: 12000000, 
    supplyValue: 12000000, 
    vat: 1200000, 
    status: '발행' 
  }
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
      localStorage.removeItem('nj_sales_v2');
      localStorage.removeItem('nj_purchases_v2');
      localStorage.removeItem('nj_tax_invoices');
      localStorage.removeItem('nj_bank_tx');
      localStorage.removeItem('nj_card_sales');
      localStorage.removeItem('nj_card_purchase');
      localStorage.removeItem('nj_employees');
      localStorage.removeItem('nj_office_expenses');
      localStorage.setItem('nj_db_version', DB_VERSION);
      // Reload page to apply clean states
      window.location.reload();
    }
  }, []);

  // Global State (persisted in LocalStorage)
  const [items, setItems] = useState(() => {
    const local = localStorage.getItem('nj_items');
    if (local) {
      const parsed = JSON.parse(local);
      // Auto-reset if it's only the old mock list or contains any old mock codes
      const hasMockItems = parsed.some(item => ['CD-001', 'CD-002', 'GD-001', 'GD-002', 'RM-CD', 'RM-PB'].includes(item.code));
      if (hasMockItems || parsed.length <= 6) {
        return initialItems;
      }
      return parsed;
    }
    return initialItems;
  });

  const [partners, setPartners] = useState(() => {
    const local = localStorage.getItem('nj_partners');
    if (local) {
      const parsed = JSON.parse(local);
      // Auto-reset if it's the old mock list, contains mock partner names, or missing bizType
      const hasMockPartners = parsed.some(p => ['YG PLUS (음반 제작 위탁사)', '(주)인쇄나라 (포토북 제작)', 'YG PLUS', '인쇄나라'].includes(p.name));
      if (hasMockPartners || parsed.length <= 9 || (parsed.length > 0 && !('bizType' in parsed[0]))) {
        return initialPartners;
      }
      return parsed;
    }
    return initialPartners;
  });

  const [sales, setSales] = useState(() => {
    const local = localStorage.getItem('nj_sales_v2');
    return local ? JSON.parse(local) : initialSales;
  });

  const [purchases, setPurchases] = useState(() => {
    const local = localStorage.getItem('nj_purchases_v2');
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

  const [employees, setEmployees] = useState(() => {
    const local = localStorage.getItem('nj_employees');
    if (local) return JSON.parse(local);
    return [
      { id: 'EMP-001', name: '최성욱', position: '실장 (매니지먼트)', baseSalary: 6500000, pension: 292500, health: 230100, employment: 58500, netPay: 5918900, cardUsage: 1250000 },
      { id: 'EMP-002', name: '김주연', position: '주임 (콘텐츠제작)', baseSalary: 3800000, pension: 171000, health: 134520, employment: 34200, netPay: 3460280, cardUsage: 450000 },
      { id: 'EMP-003', name: '양유지', position: '팀원 (경영지원)', baseSalary: 3200000, pension: 144000, health: 113280, employment: 28800, netPay: 2913920, cardUsage: 180000 },
      { id: 'EMP-004', name: '민지', position: '아티스트', baseSalary: 12000000, pension: 540000, health: 424800, employment: 108000, netPay: 10927200, cardUsage: 2500000 },
      { id: 'EMP-005', name: '하니', position: '아티스트', baseSalary: 12000000, pension: 540000, health: 424800, employment: 108000, netPay: 10927200, cardUsage: 2100000 },
      { id: 'EMP-006', name: '다니엘', position: '아티스트', baseSalary: 12000000, pension: 540000, health: 424800, employment: 108000, netPay: 10927200, cardUsage: 1900000 },
      { id: 'EMP-007', name: '해린', position: '아티스트', baseSalary: 12000000, pension: 540000, health: 424800, employment: 108000, netPay: 10927200, cardUsage: 3200000 },
      { id: 'EMP-008', name: '혜인', position: '아티스트', baseSalary: 12000000, pension: 540000, health: 424800, employment: 108000, netPay: 10927200, cardUsage: 1500000 }
    ];
  });

  const [officeExpenses, setOfficeExpenses] = useState(() => {
    const local = localStorage.getItem('nj_office_expenses');
    if (local) {
      const parsed = JSON.parse(local);
      const needsPatch = parsed.some(o => !('samsungOA' in o));
      if (!needsPatch) {
        return parsed;
      }
    }
    return [
      {
        month: '2026-06',
        tax: 1650000,
        corporatePhone: 43936,
        officeRent: 1100000,
        maintenance: 281210,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 175000,
        ibkLoanInterest: 310000,
        kiboLoanInterest: 215000,
        creditLoanInterest: 245000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 281210,
        taxService: 1650000,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 43936,
        skt: 0
      },
      {
        month: '2026-05',
        tax: 0,
        corporatePhone: 43936,
        officeRent: 1100000,
        maintenance: 281210,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 180000,
        ibkLoanInterest: 320000,
        kiboLoanInterest: 220000,
        creditLoanInterest: 250000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 281210,
        taxService: 0,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 43936,
        skt: 0
      },
      {
        month: '2026-04',
        tax: 165000,
        corporatePhone: 64768,
        officeRent: 1100000,
        maintenance: 333020,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 182000,
        ibkLoanInterest: 325000,
        kiboLoanInterest: 224000,
        creditLoanInterest: 255000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 333020,
        taxService: 165000,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 42768,
        skt: 22000
      },
      {
        month: '2026-03',
        tax: 2332000,
        corporatePhone: 65599,
        officeRent: 1100000,
        maintenance: 377860,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 185000,
        ibkLoanInterest: 330000,
        kiboLoanInterest: 228000,
        creditLoanInterest: 260000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 377860,
        taxService: 2332000,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 43599,
        skt: 22000
      },
      {
        month: '2026-02',
        tax: 132000,
        corporatePhone: 65953,
        officeRent: 1100000,
        maintenance: 430680,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 188000,
        ibkLoanInterest: 335000,
        kiboLoanInterest: 232000,
        creditLoanInterest: 265000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 430680,
        taxService: 132000,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 43953,
        skt: 22000
      },
      {
        month: '2026-01',
        tax: 132000,
        corporatePhone: 66785,
        officeRent: 1100000,
        maintenance: 393990,
        equipmentRental: 155900,
        erpServiceFee: 59730,
        avanteRental: 450000,
        rayInstallment: 280000,
        smallBizLoanInterest: 191000,
        ibkLoanInterest: 340000,
        kiboLoanInterest: 236000,
        creditLoanInterest: 270000,
        // Partner breakdown
        samsungOA: 110000,
        sungjin: 15730,
        gwangmyeongG: 393990,
        taxService: 132000,
        ecount: 44000,
        bsTech: 1100000,
        chungho: 45900,
        kt: 44785,
        skt: 22000
      }
    ];
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
    localStorage.setItem('nj_sales_v2', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('nj_purchases_v2', JSON.stringify(purchases));
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

  useEffect(() => {
    localStorage.setItem('nj_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('nj_office_expenses', JSON.stringify(officeExpenses));
  }, [officeExpenses]);

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

  // --- DASHBOARD MONTHLY & QUARTERLY PROFIT CALCULATION ---
  // Get profit by months
  const getMonthlyProfit = () => {
    const months = ['01', '02', '03', '04', '05', '06'];
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월'];
    return months.map((m, idx) => {
      const monthSales = sales
        .filter(s => s.date.split('-')[1] === m)
        .reduce((acc, curr) => acc + curr.supplyValue, 0);
      const monthPurchases = purchases
        .filter(p => p.date.split('-')[1] === m)
        .reduce((acc, curr) => acc + curr.supplyValue, 0);
      return { 
        label: monthNames[idx], 
        sales: monthSales,
        purchases: monthPurchases,
        value: monthSales - monthPurchases
      };
    });
  };

  // Get profit by quarters
  const getQuarterlyProfit = () => {
    const q1Sales = sales
      .filter(s => {
        const m = s.date.split('-')[1];
        return m === '01' || m === '02' || m === '03';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);
    const q1Purchases = purchases
      .filter(p => {
        const m = p.date.split('-')[1];
        return m === '01' || m === '02' || m === '03';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);

    const q2Sales = sales
      .filter(s => {
        const m = s.date.split('-')[1];
        return m === '04' || m === '05' || m === '06';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);
    const q2Purchases = purchases
      .filter(p => {
        const m = p.date.split('-')[1];
        return m === '04' || m === '05' || m === '06';
      })
      .reduce((acc, curr) => acc + curr.supplyValue, 0);

    return [
      { label: '1분기 (Q1)', sales: q1Sales, purchases: q1Purchases, value: q1Sales - q1Purchases },
      { label: '2분기 (Q2)', sales: q2Sales, purchases: q2Purchases, value: q2Sales - q2Purchases }
    ];
  };

  const chartData = dashboardViewMode === 'monthly' ? getMonthlyProfit() : getQuarterlyProfit();
  const maxChartValue = Math.max(...chartData.map(d => Math.abs(d.value)), 1000000); // Prevent divide by zero

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
              className={`menu-item ${activeTab === 'fixed_expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('fixed_expenses')}
            >
              💸 고정 지출
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
              {activeTab === 'fixed_expenses' && '고정 지출 및 대출 이자 관리'}
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
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                
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

                {/* Operating Profit */}
                {(() => {
                  const totalProfit = totalSalesAmount - totalPurchaseAmount;
                  return (
                    <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-lavender, #c084fc)' }}>
                      <div className="kpi-header">
                        <span className="kpi-title">누적 영업 이익 (매출 - 매입)</span>
                        <span className="kpi-icon">💰</span>
                      </div>
                      <div className="kpi-value" style={{ color: totalProfit >= 0 ? 'var(--primary-blue, #1a56db)' : '#be123c' }}>
                        {totalProfit.toLocaleString()}원
                      </div>
                      <div className="kpi-subtext">
                        누적 판매 매출액과 매입원가의 차액 기준 {' '}
                        <span className={`kpi-trend ${totalProfit >= 0 ? 'up' : 'down'}`}>
                          {totalProfit >= 0 ? '▲' : '▼'} {totalSalesAmount > 0 ? (totalProfit / totalSalesAmount * 100).toFixed(1) : 0}% (이익률)
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Bottom Split layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Monthly/Quarterly Profit Trend Chart */}
                <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="panel-header" style={{ marginBottom: '8px', paddingBottom: 0 }}>
                    <h2 className="panel-title">영업 이익 (Profit) 트렌드</h2>
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
                    {dashboardViewMode === 'monthly' ? '2026년 상반기 월별 영업 이익(매출 - 매입) 현황입니다.' : '2026년 분기별 영업 이익(매출 - 매입) 현황입니다.'}
                  </div>

                  <div className="chart-bar-container">
                    {chartData.map((d, idx) => {
                      const isPositive = d.value >= 0;
                      const pct = Math.min(100, Math.max(8, (Math.abs(d.value) / maxChartValue) * 100));

                      return (
                        <div key={idx} className="chart-bar-col">
                          <div 
                            className="chart-bar-fill" 
                            style={{ 
                              height: `${pct}%`,
                              background: isPositive 
                                ? 'linear-gradient(to top, var(--primary-blue, #1a56db), var(--accent-lavender, #c084fc))' 
                                : 'linear-gradient(to top, #e11d48, #fda4af)'
                            }}
                          >
                            <div className="chart-bar-value" style={{ color: isPositive ? 'var(--text-primary)' : '#be123c', fontWeight: 'bold' }}>
                              {d.value !== 0 ? `${(d.value / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}만` : '0'}
                            </div>
                          </div>
                          <div className="chart-bar-label">
                            {d.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <table className="erp-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>구분</th>
                          <th style={{ textAlign: 'right' }}>판매 매출액 (A)</th>
                          <th style={{ textAlign: 'right' }}>매입 원가 (B)</th>
                          <th style={{ textAlign: 'right' }}>영업 이익 (A - B)</th>
                          <th style={{ textAlign: 'right' }}>이익률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((d, idx) => {
                          const profit = d.value;
                          const salesVal = d.sales;
                          const purchasesVal = d.purchases;
                          const profitRate = salesVal > 0 ? ((profit / salesVal) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: '600' }}>{d.label}</td>
                              <td style={{ textAlign: 'right' }}>{salesVal.toLocaleString()}원</td>
                              <td style={{ textAlign: 'right' }}>{purchasesVal.toLocaleString()}원</td>
                              <td style={{ textAlign: 'right', fontWeight: '700', color: profit >= 0 ? 'var(--primary-blue)' : '#be123c' }}>
                                {profit.toLocaleString()}원
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`badge ${profit >= 0 ? 'badge-blue' : 'badge-pink'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>
                                  {profitRate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Deleted low stock alert summary section from dashboard view */}

            </div>
          )}

          {/* TAB: FIXED EXPENSES */}
          {activeTab === 'fixed_expenses' && (
            <FixedExpenses 
              employees={employees}
              setEmployees={setEmployees}
              officeExpenses={officeExpenses}
              setOfficeExpenses={setOfficeExpenses}
              cardPurchaseTransactions={cardPurchaseTransactions}
              setCardPurchaseTransactions={setCardPurchaseTransactions}
              items={items}
              setItems={setItems}
              purchases={purchases}
              setPurchases={setPurchases}
              logActivity={logActivity}
            />
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
              partners={partners}
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
              employees={employees}
              setEmployees={setEmployees}
            />
          )}

        </main>
      </div>
    </div>
  );
}
