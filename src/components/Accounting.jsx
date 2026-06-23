import React, { useState } from 'react';

export default function Accounting({
  items,
  setItems,
  sales,
  setSales,
  purchases,
  setPurchases,
  taxInvoices,
  setTaxInvoices,
  bankTransactions,
  setBankTransactions,
  cardSalesTransactions,
  setCardSalesTransactions,
  cardPurchaseTransactions,
  setCardPurchaseTransactions,
  isIbkLinked,
  setIsIbkLinked,
  isCreLinked,
  setIsCreLinked,
  logActivity
}) {
  const [activeSubTab, setActiveSubTab] = useState('sync'); // 'sync', 'tax'
  const [syncSubTab, setSyncSubTab] = useState('bank'); // 'bank', 'cardsales', 'cardpurchase'
  
  // Simulated Loading States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState(''); // 'IBK', 'CRE'
  
  // Connection Modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalType, setLinkModalType] = useState(''); // 'IBK', 'CRE'
  const [linkForm, setLinkForm] = useState({
    userId: '',
    password: '',
    certPass: '',
    accNum: '010-4829-1234-92 (IBK 기업은행 기업통장)'
  });

  // Journalizing Modal (전표처리 모달)
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [txType, setTxType] = useState('sales'); // 'sales' (입금/매출), 'purchase' (출금/매입)
  const [journalForm, setJournalForm] = useState({
    date: '',
    partner: '',
    itemCode: '',
    qty: 1,
    price: 0,
    supplyValue: 0,
    vat: 0,
    paymentMethod: '계좌'
  });

  // Tax Invoice Viewer Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Trigger Link Modal
  const triggerLink = (type) => {
    setLinkModalType(type);
    setShowLinkModal(true);
  };

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    if (linkModalType === 'IBK') {
      setIsIbkLinked(true);
      logActivity('회계', 'IBK 기업은행 기업 계좌 연동 완료');
    } else {
      setIsCreLinked(true);
      logActivity('회계', '여신금융협회 가맹점 카드 단말기/매입 연동 완료');
    }
    setShowLinkModal(false);
  };

  // Sync Action
  const handleSync = (type) => {
    setSyncTarget(type);
    setIsSyncing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsSyncing(false);
      
      if (type === 'IBK') {
        // Load IBK transactions (change synced flag to true)
        setBankTransactions(prev => prev.map(tx => ({ ...tx, synced: true })));
        logActivity('회계', '기업은행 계좌 실시간 입출금 내역 동기화 성공');
      } else {
        // Load Cards transactions
        setCardSalesTransactions(prev => prev.map(tx => ({ ...tx, synced: true })));
        setCardPurchaseTransactions(prev => prev.map(tx => ({ ...tx, synced: true })));
        logActivity('회계', '여신금융협회 카드 매출/매입 승인 내역 동기화 성공');
      }
    }, 1500);
  };

  // Trigger Journalizing (전표 처리)
  const triggerJournal = (tx, type) => {
    setSelectedTx(tx);
    setTxType(type); // 'sales' or 'purchase'
    
    // Pre-calculate vat & supply
    const amount = Number(tx.amount || tx.salesAmt || tx.purchaseAmt || 0);
    const supplyValue = Math.round(amount / 1.1);
    const vat = amount - supplyValue;

    // Try to guess default item
    let guessedItem = '';
    const nameMatch = (tx.description || tx.partner || '').toLowerCase();
    if (nameMatch.includes('앨범') || nameMatch.includes('album') || nameMatch.includes('위버스샵')) {
      guessedItem = items.find(i => i.code.startsWith('CD'))?.code || '';
    } else if (nameMatch.includes('응원봉') || nameMatch.includes('빙키봉') || nameMatch.includes('binky')) {
      guessedItem = items.find(i => i.code === 'GD-001')?.code || '';
    }

    setJournalForm({
      date: tx.date || new Date().toISOString().substring(0, 10),
      partner: tx.partner || tx.description || '',
      itemCode: guessedItem,
      qty: 1,
      price: supplyValue,
      supplyValue: supplyValue,
      vat: vat,
      paymentMethod: type === 'sales' ? (tx.cardCorp ? '카드' : '계좌') : (tx.cardCorp ? '카드' : '계좌')
    });
    
    setShowJournalModal(true);
  };

  // Update supply/vat when qty/price changes inside Journal Form
  const handleJournalFormChange = (field, val) => {
    setJournalForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'qty' || field === 'price') {
        const supply = Number(updated.qty) * Number(updated.price);
        updated.supplyValue = supply;
        updated.vat = Math.round(supply * 0.1);
      }
      return updated;
    });
  };

  // Submit Journal
  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (!journalForm.partner || !journalForm.itemCode || journalForm.qty <= 0) {
      alert('필수값을 확인해 주세요.');
      return;
    }

    const item = items.find(i => i.code === journalForm.itemCode);
    if (!item) {
      alert('선택된 품목이 올바르지 않습니다.');
      return;
    }

    if (txType === 'sales') {
      // Create Sales Slip
      const newSale = {
        id: 'SL-' + Date.now(),
        date: journalForm.date,
        customer: journalForm.partner,
        itemCode: journalForm.itemCode,
        itemName: item.name,
        qty: Number(journalForm.qty),
        price: Number(journalForm.price),
        supplyValue: Number(journalForm.supplyValue),
        vat: Number(journalForm.vat),
        paymentMethod: journalForm.paymentMethod
      };
      setSales(prev => [newSale, ...prev]);

      // Deduct inventory
      setItems(prev => prev.map(i => i.code === journalForm.itemCode ? { ...i, stock: i.stock - Number(journalForm.qty) } : i));

      // Mark transaction as posted
      if (selectedTx.accNum) {
        // Bank
        setBankTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, posted: true, slipId: newSale.id } : t));
      } else {
        // Card Sales
        setCardSalesTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, posted: true, slipId: newSale.id } : t));
      }
      logActivity('회계', `연동 내역 전표 승인: 판매 등록 (${journalForm.partner} - ${item.name})`);
    } else {
      // Create Purchase Slip
      const newPurchase = {
        id: 'PC-' + Date.now(),
        date: journalForm.date,
        vendor: journalForm.partner,
        itemCode: journalForm.itemCode,
        itemName: item.name,
        qty: Number(journalForm.qty),
        price: Number(journalForm.price),
        supplyValue: Number(journalForm.supplyValue),
        vat: Number(journalForm.vat),
        paymentMethod: journalForm.paymentMethod
      };
      setPurchases(prev => [newPurchase, ...prev]);

      // Add inventory
      setItems(prev => prev.map(i => i.code === journalForm.itemCode ? { ...i, stock: i.stock + Number(journalForm.qty) } : i));

      // Mark transaction as posted
      if (selectedTx.accNum) {
        // Bank
        setBankTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, posted: true, slipId: newPurchase.id } : t));
      } else {
        // Card Purchase
        setCardPurchaseTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, posted: true, slipId: newPurchase.id } : t));
      }
      logActivity('회계', `연동 내역 전표 승인: 구매 등록 (${journalForm.partner} - ${item.name})`);
    }

    setShowJournalModal(false);
  };

  // Generate Electronic Tax Invoice from Sales Slip
  const generateInvoiceFromSale = (sale) => {
    // Check if already exists
    if (taxInvoices.some(inv => inv.slipId === sale.id)) {
      alert('이미 세금계산서가 발행된 판매 건입니다.');
      return;
    }

    const newInvoice = {
      id: 'TX-' + Date.now(),
      slipId: sale.id,
      date: sale.date,
      supplierName: '(주)어도어 (ADOR Co., Ltd.)',
      supplierRegNum: '107-86-94827',
      supplierOwner: '민희진',
      buyerName: sale.customer,
      buyerRegNum: '220-81-12345', // Dummy
      itemName: sale.itemName,
      qty: sale.qty,
      price: sale.price,
      supplyValue: sale.supplyValue,
      vat: sale.vat,
      status: '작성' // '작성', '발행(국세청전송완료)'
    };

    setTaxInvoices(prev => [newInvoice, ...prev]);
    logActivity('회계', `전자세금계산서 임시 작성 완료: ${sale.customer} (${sale.itemName})`);
    setActiveSubTab('tax');
  };

  // Send Tax Invoice to National Tax Service (NTS / 국세청 전송)
  const transmitToNts = (id) => {
    setTaxInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        logActivity('회계', `국세청 전자세금계산서 전송 승인: 승인번호 ${inv.id}`);
        return { ...inv, status: '발행' };
      }
      return inv;
    }));
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice(prev => ({ ...prev, status: '발행' }));
    }
  };

  // Open Invoice detail modal
  const openInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  return (
    <div className="content-area">
      <div className="page-title-container">
        <div className="logo-icon">💳</div>
        <h1 className="page-title">회계 관리 (Accounting)</h1>
      </div>

      {/* Main Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeSubTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sync')}
        >
          계좌/카드 연동 및 전표 처리
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('tax')}
        >
          전자세금계산서 관리
        </button>
      </div>

      {/* --- SUBTAB 1: 계좌/카드 연동 --- */}
      {activeSubTab === 'sync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Link Controls Card */}
          <div className="dashboard-grid">
            {/* IBK Link status */}
            <div className="kpi-card" style={{ padding: '20px' }}>
              <div className="kpi-header" style={{ marginBottom: '8px' }}>
                <span className="kpi-title">IBK 기업은행 계좌 연동</span>
                <span className="kpi-icon">🏦</span>
              </div>
              <div className="sync-status-badge" style={{ marginBottom: '16px' }}>
                <span className={`status-dot ${isIbkLinked ? '' : 'disconnected'}`}></span>
                <span style={{ fontWeight: '500' }}>{isIbkLinked ? '연동 완료 (계좌 1개)' : '미연동'}</span>
              </div>
              <div className="btn-group">
                {!isIbkLinked ? (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => triggerLink('IBK')}>
                    기업은행 연동하기
                  </button>
                ) : (
                  <>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSync('IBK')}>
                      실시간 동기화
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setIsIbkLinked(false)}>
                      연동 해제
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* CRE Link status (Credit Finance Association) */}
            <div className="kpi-card" style={{ padding: '20px' }}>
              <div className="kpi-header" style={{ marginBottom: '8px' }}>
                <span className="kpi-title">여신금융협회 연동 (카드)</span>
                <span className="kpi-icon">💳</span>
              </div>
              <div className="sync-status-badge" style={{ marginBottom: '16px' }}>
                <span className={`status-dot ${isCreLinked ? '' : 'disconnected'}`}></span>
                <span style={{ fontWeight: '500' }}>{isCreLinked ? '연동 완료 (매출/매입)' : '미연동'}</span>
              </div>
              <div className="btn-group">
                {!isCreLinked ? (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => triggerLink('CRE')}>
                    여신금융협회 연동
                  </button>
                ) : (
                  <>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSync('CRE')}>
                      실시간 동기화
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setIsCreLinked(false)}>
                      연동 해제
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Syncing Overlay Spinner */}
          {isSyncing && (
            <div className="panel-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="syncing-overlay">
                <div className="spinner"></div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
                    {syncTarget === 'IBK' ? 'IBK 기업은행 API 호출 중...' : '여신금융협회 스크래핑 서버 통신 중...'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    실시간 금융 자산 내역을 대조하여 가져오는 중입니다. 잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Tables Container */}
          {!isSyncing && (
            <div className="panel-card">
              <div className="panel-header">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`btn ${syncSubTab === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSyncSubTab('bank')}
                  >
                    🏦 기업은행 계좌 내역
                  </button>
                  <button 
                    className={`btn ${syncSubTab === 'cardsales' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSyncSubTab('cardsales')}
                  >
                    📈 신용카드 매출 (입금예정)
                  </button>
                  <button 
                    className={`btn ${syncSubTab === 'cardpurchase' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSyncSubTab('cardpurchase')}
                  >
                    📉 신용카드 매입 (법카지출)
                  </button>
                </div>
              </div>

              {/* 1. IBK Bank Account Ledger */}
              {syncSubTab === 'bank' && (
                <div>
                  {!isIbkLinked ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      기업은행 계좌가 연동되어 있지 않습니다. 상단에서 연동해 주세요.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>거래일시</th>
                            <th>계좌번호</th>
                            <th>적요 (거래처)</th>
                            <th style={{ textAlign: 'right' }}>입금액</th>
                            <th style={{ textAlign: 'right' }}>출금액</th>
                            <th style={{ textAlign: 'right' }}>잔액</th>
                            <th style={{ textAlign: 'center' }}>상태</th>
                            <th style={{ textAlign: 'center' }}>전표처리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankTransactions.filter(tx => tx.synced).length === 0 ? (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                동기화된 내역이 없습니다. [실시간 동기화] 버튼을 클릭해 최신 내역을 불러오세요.
                              </td>
                            </tr>
                          ) : (
                            bankTransactions.filter(tx => tx.synced).map(tx => (
                              <tr key={tx.id} className={tx.posted ? '' : 'synced-item-highlight'}>
                                <td>{tx.date}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{tx.accNum}</td>
                                <td style={{ fontWeight: '500' }}>{tx.partner}</td>
                                <td style={{ textAlign: 'right', color: tx.type === '입금' ? '#10b981' : 'inherit', fontWeight: tx.type === '입금' ? '700' : 'normal' }}>
                                  {tx.type === '입금' ? `+${tx.amount.toLocaleString()}원` : '-'}
                                </td>
                                <td style={{ textAlign: 'right', color: tx.type === '출금' ? '#fb7185' : 'inherit', fontWeight: tx.type === '출금' ? '700' : 'normal' }}>
                                  {tx.type === '출금' ? `-${tx.amount.toLocaleString()}원` : '-'}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{tx.balance.toLocaleString()}원</td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span className="badge badge-green">전표완료</span>
                                  ) : (
                                    <span className="badge badge-pink">전표미분개</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.slipId}</span>
                                  ) : (
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: '4px 10px', fontSize: '12px' }}
                                      onClick={() => triggerJournal(tx, tx.type === '입금' ? 'sales' : 'purchase')}
                                    >
                                      전표 승인
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Credit Card Sales (매출) */}
              {syncSubTab === 'cardsales' && (
                <div>
                  {!isCreLinked ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      여신금융협회가 연동되어 있지 않습니다. 상단에서 연동해 주세요.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>승인일시</th>
                            <th>카드사</th>
                            <th>가맹점명</th>
                            <th style={{ textAlign: 'right' }}>승인금액</th>
                            <th style={{ textAlign: 'right' }}>수수료 (공제)</th>
                            <th style={{ textAlign: 'right' }}>입금예정액</th>
                            <th style={{ textAlign: 'center' }}>상태</th>
                            <th style={{ textAlign: 'center' }}>전표처리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cardSalesTransactions.filter(tx => tx.synced).length === 0 ? (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                동기화된 내역이 없습니다. [실시간 동기화] 버튼을 클릭해 최신 내역을 불러오세요.
                              </td>
                            </tr>
                          ) : (
                            cardSalesTransactions.filter(tx => tx.synced).map(tx => (
                              <tr key={tx.id} className={tx.posted ? '' : 'synced-item-highlight'}>
                                <td>{tx.date}</td>
                                <td>{tx.cardCorp}</td>
                                <td style={{ fontWeight: '500' }}>{tx.partner}</td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>{tx.salesAmt.toLocaleString()}원</td>
                                <td style={{ textAlign: 'right', color: '#fb7185' }}>-{tx.fee.toLocaleString()}원</td>
                                <td style={{ textAlign: 'right', color: 'var(--primary-blue)', fontWeight: '700' }}>
                                  {tx.netAmt.toLocaleString()}원
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span className="badge badge-green">전표완료</span>
                                  ) : (
                                    <span className="badge badge-pink">전표미분개</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.slipId}</span>
                                  ) : (
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: '4px 10px', fontSize: '12px' }}
                                      onClick={() => triggerJournal(tx, 'sales')}
                                    >
                                      전표 승인
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Credit Card Purchase (매입) */}
              {syncSubTab === 'cardpurchase' && (
                <div>
                  {!isCreLinked ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      여신금융협회가 연동되어 있지 않습니다. 상단에서 연동해 주세요.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>사용일시</th>
                            <th>카드번호</th>
                            <th>사용처 (가맹점)</th>
                            <th style={{ textAlign: 'right' }}>이용금액</th>
                            <th>카드구분</th>
                            <th style={{ textAlign: 'center' }}>상태</th>
                            <th style={{ textAlign: 'center' }}>전표처리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cardPurchaseTransactions.filter(tx => tx.synced).length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                동기화된 내역이 없습니다. [실시간 동기화] 버튼을 클릭해 최신 내역을 불러오세요.
                              </td>
                            </tr>
                          ) : (
                            cardPurchaseTransactions.filter(tx => tx.synced).map(tx => (
                              <tr key={tx.id} className={tx.posted ? '' : 'synced-item-highlight'}>
                                <td>{tx.date}</td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.cardNum}</td>
                                <td style={{ fontWeight: '500' }}>{tx.partner}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#fb7185' }}>
                                  -{tx.purchaseAmt.toLocaleString()}원
                                </td>
                                <td>{tx.cardUser}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span className="badge badge-green">전표완료</span>
                                  ) : (
                                    <span className="badge badge-pink">전표미분개</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {tx.posted ? (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.slipId}</span>
                                  ) : (
                                    <button 
                                      className="btn btn-primary" 
                                      style={{ padding: '4px 10px', fontSize: '12px' }}
                                      onClick={() => triggerJournal(tx, 'purchase')}
                                    >
                                      전표 승인
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: 전자세금계산서 --- */}
      {activeSubTab === 'tax' && (
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">국세청 전자세금계산서 발행 리스트</h2>
            
            {/* Quick Generator from Unbilled Sales */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              * '판매 전표 등록' 탭에서 전표를 추가한 후, 세금계산서를 즉시 생성할 수 있습니다.
            </div>
          </div>

          <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>미발행 판매 전표 (세금계산서 작성 대상)</h3>
            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>전표번호</th>
                    <th>일자</th>
                    <th>거래처</th>
                    <th>품목명</th>
                    <th style={{ textAlign: 'right' }}>수량</th>
                    <th style={{ textAlign: 'right' }}>합계금액</th>
                    <th style={{ textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.filter(sale => !taxInvoices.some(inv => inv.slipId === sale.id)).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>
                        세금계산서 미발행 상태인 판매 건이 없습니다. (신규 판매 전표를 먼저 생성해 주세요)
                      </td>
                    </tr>
                  ) : (
                    sales.filter(sale => !taxInvoices.some(inv => inv.slipId === sale.id)).map(sale => (
                      <tr key={sale.id}>
                        <td>{sale.id}</td>
                        <td>{sale.date}</td>
                        <td style={{ fontWeight: '500' }}>{sale.customer}</td>
                        <td>{sale.itemName}</td>
                        <td style={{ textAlign: 'right' }}>{sale.qty.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{(sale.supplyValue + sale.vat).toLocaleString()}원</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => generateInvoiceFromSale(sale)}
                          >
                            세금계산서 작성
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>발행대장 및 국세청 전송 상태</h3>
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>임시번호</th>
                  <th>발행일자</th>
                  <th>공급받는자 (거래처)</th>
                  <th>품목명</th>
                  <th style={{ textAlign: 'right' }}>공급가액</th>
                  <th style={{ textAlign: 'right' }}>부가세</th>
                  <th style={{ textAlign: 'right' }}>합계액</th>
                  <th style={{ textAlign: 'center' }}>국세청 전송상태</th>
                  <th style={{ textAlign: 'center' }}>인쇄/조회</th>
                </tr>
              </thead>
              <tbody>
                {taxInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      발행된 세금계산서 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  taxInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: '600' }}>{inv.id}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: '500' }}>{inv.buyerName}</td>
                      <td>{inv.itemName}</td>
                      <td style={{ textAlign: 'right' }}>{inv.supplyValue.toLocaleString()}원</td>
                      <td style={{ textAlign: 'right' }}>{inv.vat.toLocaleString()}원</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        {(inv.supplyValue + inv.vat).toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {inv.status === '발행' ? (
                          <span className="badge badge-green">전송 완료 (승인)</span>
                        ) : (
                          <span className="badge badge-pink">임시 작성 (미전송)</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="btn-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => openInvoiceDetails(inv)}
                          >
                            보기 / 발행
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: 연동 자격증명 입력 모달 --- */}
      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="panel-title">
                {linkModalType === 'IBK' ? 'IBK 기업은행 계좌 연동 인증' : '여신금융협회 통합로그인 연동'}
              </h2>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleLinkSubmit}>
              <div className="modal-body">
                {linkModalType === 'IBK' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      기업 인터넷 뱅킹에 등록된 공동인증서 또는 금융인증서 비밀번호를 입력하여 계좌 거래 내역을 자동으로 수집합니다.
                    </div>
                    <div className="form-group">
                      <label className="form-label">계좌선택 (가상)</label>
                      <input type="text" className="form-control" disabled value={linkForm.accNum} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">인증서 비밀번호</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        required 
                        placeholder="••••••••••••"
                        value={linkForm.certPass}
                        onChange={(e) => setLinkForm(prev => ({ ...prev, certPass: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      여신금융협회 가맹점 매출거래정보 통합조회 시스템(https://www.cardsales.or.kr)의 로그인 정보를 연동합니다.
                    </div>
                    <div className="form-group">
                      <label className="form-label">아이디 (ID)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="ador_cardsales"
                        value={linkForm.userId}
                        onChange={(e) => setLinkForm(prev => ({ ...prev, userId: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">비밀번호</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        required 
                        placeholder="••••••••••••"
                        value={linkForm.password}
                        onChange={(e) => setLinkForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">연동 및 인증완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: 금융연동내역 전표 발행 모달 --- */}
      {showJournalModal && selectedTx && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="panel-title">
                {txType === 'sales' ? '금융 내역 -> 판매 전표 전환 승인' : '금융 내역 -> 구매 전표 전환 승인'}
              </h2>
              <button className="modal-close" onClick={() => setShowJournalModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleJournalSubmit}>
              <div className="modal-body">
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '6px', color: 'var(--primary-blue)' }}>원천 금융 거래 정보</div>
                  <div>- 거래일시: {selectedTx.date}</div>
                  <div>- 거래처/적요: {selectedTx.partner || selectedTx.description}</div>
                  <div>
                    - 거래금액: {' '}
                    <span style={{ fontWeight: '700' }}>
                      {Number(selectedTx.amount || selectedTx.salesAmt || selectedTx.purchaseAmt || 0).toLocaleString()} 원
                    </span>
                    {selectedTx.fee ? ` (수수료 ${selectedTx.fee.toLocaleString()}원 제외 입금예정)` : ''}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">일자</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={journalForm.date}
                      onChange={(e) => setJournalForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{txType === 'sales' ? '공급처/거래처 *' : '매입처/거래처 *'}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={journalForm.partner}
                      onChange={(e) => setJournalForm(prev => ({ ...prev, partner: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">연계 품목 맵핑 *</label>
                  <select 
                    className="form-control"
                    required
                    value={journalForm.itemCode}
                    onChange={(e) => handleJournalFormChange('itemCode', e.target.value)}
                  >
                    <option value="">-- 매칭할 품목을 선택하세요 --</option>
                    {items.map(i => (
                      <option key={i.code} value={i.code}>
                        [{i.code}] {i.name} (재고: {i.stock} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">수량 *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      min="1"
                      value={journalForm.qty}
                      onChange={(e) => handleJournalFormChange('qty', Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단가 (원) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      value={journalForm.price}
                      onChange={(e) => handleJournalFormChange('price', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">공급가액 (공제전, 자동)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={journalForm.supplyValue.toLocaleString() + ' 원'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">부가세 (자동, 10%)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={journalForm.vat.toLocaleString() + ' 원'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">결제 방법</label>
                  <select 
                    className="form-control"
                    value={journalForm.paymentMethod}
                    onChange={(e) => setJournalForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="계좌">계좌 이체</option>
                    <option value="카드">법인 신용카드</option>
                    <option value="외상">외상 거래</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJournalModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">전표 생성 승인</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: 전자세금계산서 뷰어 (국세청 양식) --- */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', background: '#fcfcfc' }}>
            <div className="modal-header print-hide" style={{ background: '#f3f4f6', borderColor: '#e5e7eb' }}>
              <h2 className="panel-title" style={{ color: '#1f2937' }}>전자세금계산서 인쇄 및 발행조회</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedInvoice.status === '작성' && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => transmitToNts(selectedInvoice.id)}
                  >
                    국세청 전송 발행
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => window.print()}>인쇄하기 (Print)</button>
                <button className="modal-close" style={{ color: '#1f2937' }} onClick={() => setShowInvoiceModal(false)}>&times;</button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '30px 20px', background: '#ffffff' }}>
              
              {/* Official Tax Invoice Red Table Container */}
              <div className="tax-invoice-container">
                <div className="invoice-title">전 자 세 금 계 산 서</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                  <div>(공급자 보관용 / 수탁 발행용)</div>
                  <div>승인 번호: {selectedInvoice.status === '발행' ? selectedInvoice.id : '임시 작성중 (미전송)'}</div>
                </div>

                <table className="tax-invoice-table">
                  <tbody>
                    {/* 공급자 Section */}
                    <tr>
                      <td rowspan="4" className="invoice-section-header">공<br />급<br />자</td>
                      <td className="invoice-label">등록번호</td>
                      <td colspan="3" style={{ fontWeight: 'bold', fontSize: '12px' }}>{selectedInvoice.supplierRegNum}</td>
                      <td rowspan="4" className="invoice-section-header" style={{ backgroundColor: '#e6f0ff', color: '#1a56db', borderLeft: '2px solid #ff4d4d' }}>공<br />급<br />받<br />는<br />자</td>
                      <td className="invoice-label">등록번호</td>
                      <td colspan="3" style={{ fontWeight: 'bold', fontSize: '12px' }}>{selectedInvoice.buyerRegNum}</td>
                    </tr>
                    <tr>
                      <td className="invoice-label">상호(법인명)</td>
                      <td className="invoice-value">{selectedInvoice.supplierName}</td>
                      <td className="invoice-label">성명(대표)</td>
                      <td>{selectedInvoice.supplierOwner} (인)</td>
                      <td className="invoice-label">상호(법인명)</td>
                      <td className="invoice-value">{selectedInvoice.buyerName}</td>
                      <td className="invoice-label">성명(대표)</td>
                      <td>홍길동</td>
                    </tr>
                    <tr>
                      <td className="invoice-label">사업장주소</td>
                      <td colspan="3" className="invoice-value">서울특별시 마포구 독막로 311 (창전동, 하이브빌딩)</td>
                      <td className="invoice-label">사업장주소</td>
                      <td colspan="3" className="invoice-value">대한민국 서울시 어딘가</td>
                    </tr>
                    <tr>
                      <td className="invoice-label">업태 / 종목</td>
                      <td className="invoice-value">서비스 / 음악제작, 매니지먼트</td>
                      <td className="invoice-label">이메일</td>
                      <td>finance@ador.world</td>
                      <td className="invoice-label">업태 / 종목</td>
                      <td className="invoice-value">소매 / 유통 및 음반소비</td>
                      <td className="invoice-label">이메일</td>
                      <td>buyer@company.co.kr</td>
                    </tr>

                    {/* Double border separator */}
                    <tr className="invoice-double-line">
                      <td colspan="10" style={{ height: '4px', padding: 0, backgroundColor: '#ff4d4d' }}></td>
                    </tr>

                    {/* 작성일자 & 금액 */}
                    <tr>
                      <td colspan="2" className="invoice-label">작성일자</td>
                      <td colspan="2" className="invoice-value-center" style={{ fontWeight: 'bold' }}>{selectedInvoice.date}</td>
                      <td colspan="2" className="invoice-label">공급가액</td>
                      <td colspan="2" className="invoice-value-center" style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {selectedInvoice.supplyValue.toLocaleString()} 원
                      </td>
                      <td className="invoice-label">세액 (부가세)</td>
                      <td className="invoice-value-center" style={{ fontWeight: 'bold', fontSize: '12px' }}>
                        {selectedInvoice.vat.toLocaleString()} 원
                      </td>
                    </tr>

                    {/* 세부 항목 표 */}
                    <tr style={{ backgroundColor: '#ffeef0' }}>
                      <td className="invoice-label" style={{ width: '4%' }}>월/일</td>
                      <td colspan="3" className="invoice-label">품목명 (규격)</td>
                      <td className="invoice-label">수량</td>
                      <td className="invoice-label">단가</td>
                      <td colspan="2" className="invoice-label">공급가액</td>
                      <td className="invoice-label">세액</td>
                      <td className="invoice-label" style={{ width: '10%' }}>비고</td>
                    </tr>
                    <tr>
                      <td>{selectedInvoice.date.substring(5, 7)} / {selectedInvoice.date.substring(8, 10)}</td>
                      <td colspan="3" className="invoice-value">{selectedInvoice.itemName}</td>
                      <td>{selectedInvoice.qty}</td>
                      <td style={{ textAlign: 'right' }}>{selectedInvoice.price.toLocaleString()}</td>
                      <td colspan="2" style={{ textAlign: 'right' }}>{selectedInvoice.supplyValue.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{selectedInvoice.vat.toLocaleString()}</td>
                      <td>-</td>
                    </tr>

                    {/* 합계금액 및 영수/청구 */}
                    <tr style={{ height: '30px' }}>
                      <td colspan="2" className="invoice-label">합계금액</td>
                      <td colspan="6" style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px', fontSize: '12px' }}>
                        {(selectedInvoice.supplyValue + selectedInvoice.vat).toLocaleString()} 원
                      </td>
                      <td colspan="2" style={{ fontWeight: 'bold', fontSize: '12px', color: '#ff0000', backgroundColor: '#ffeef0' }}>
                        {selectedInvoice.status === '발행' ? '영수(완료)' : '청구(외상)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div style={{ textAlign: 'left', fontSize: '9px', color: '#666', marginTop: '8px' }}>
                  * 본 세금계산서는 국세청 홈택스 고시 규격에 맞추어 전자 서명 발급되었습니다.
                </div>
              </div>

            </div>
            
            <div className="modal-footer print-hide" style={{ background: '#f3f4f6', borderColor: '#e5e7eb' }}>
              <button className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
