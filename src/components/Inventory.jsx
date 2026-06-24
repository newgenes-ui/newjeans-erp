import React, { useState, useEffect } from 'react';
import initialPartners from '../data/partners.json';
import initialItems from '../data/items.json';
import initialSales from '../data/sales.json';
import initialPurchases from '../data/purchases.json';

export default function Inventory({ 
  items, 
  setItems, 
  partners = [],
  setPartners,
  sales, 
  setSales, 
  purchases, 
  setPurchases, 
  logActivity 
}) {
  const [activeSubTab, setActiveSubTab] = useState('items'); // 'items' (기초등록), 'sales', 'purchases'
  const [registerSubTab, setRegisterSubTab] = useState('item_reg'); // 'item_reg' (품목등록), 'partner_reg' (업체등록)
  
  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');

  // Pagination & Sorting States for Items
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  
  // Form States - Item
  const [itemForm, setItemForm] = useState({
    code: '', name: '', type: '완제품', spec: '', unit: 'EA', safetyStock: 0, purchasePrice: 0, salesPrice: 0, stock: 0
  });

  // Form States - Partner
  const [partnerForm, setPartnerForm] = useState({
    code: '', name: '', owner: '', bizType: '', bizItem: '', email: '', phone: '', zipCode: '', address: ''
  });

  // Form States - Sales (Updated to match exact image specs)
  const [salesForm, setSalesForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    seq: 1,
    partnerCode: '',
    customer: '',
    paymentMethod: '',
    note: '',
    itemCode: '',
    qty: 0,
    price: 0,
    supplyValue: 0,
    vat: 0,
    purchasePlace: '',
    employee: '양유지',
    isAccountReflected: true
  });

  // Form States - Purchase
  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    vendor: '',
    itemCode: '',
    qty: 0,
    price: 0,
    supplyValue: 0,
    vat: 0,
    paymentMethod: '계좌'
  });

  // Calculate supply value and VAT in forms
  useEffect(() => {
    const supply = Number(salesForm.qty) * Number(salesForm.price);
    const vat = Math.round(supply * 0.1);
    setSalesForm(prev => ({
      ...prev,
      supplyValue: supply,
      vat: vat
    }));
  }, [salesForm.qty, salesForm.price]);

  useEffect(() => {
    const supply = Number(purchaseForm.qty) * Number(purchaseForm.price);
    const vat = Math.round(supply * 0.1);
    setPurchaseForm(prev => ({
      ...prev,
      supplyValue: supply,
      vat: vat
    }));
  }, [purchaseForm.qty, purchaseForm.price]);

  // Handle selected item change in forms to autofill price
  const handleSalesItemChange = (code) => {
    const selected = items.find(i => i.code === code);
    setSalesForm(prev => ({
      ...prev,
      itemCode: code,
      price: selected ? selected.salesPrice : 0
    }));
  };

  const handlePurchaseItemChange = (code) => {
    const selected = items.find(i => i.code === code);
    setPurchaseForm(prev => ({
      ...prev,
      itemCode: code,
      price: selected ? selected.purchasePrice : 0
    }));
  };

  // Handle customer change inside Sales Form to auto-populate partnerCode
  const handleSalesCustomerChange = (customerName) => {
    const selected = partners.find(p => p.name === customerName);
    // Suggest sequence based on date
    const dateSales = sales.filter(s => s.date === salesForm.date);
    const nextSeq = dateSales.length + 1;

    setSalesForm(prev => ({
      ...prev,
      customer: customerName,
      partnerCode: selected ? (selected.bizNum || selected.code) : '',
      seq: nextSeq,
      purchasePlace: customerName // default buy channel
    }));
  };

  // Auto calculate sequence when date changes
  useEffect(() => {
    const dateSales = sales.filter(s => s.date === salesForm.date);
    setSalesForm(prev => ({
      ...prev,
      seq: dateSales.length + 1
    }));
  }, [salesForm.date, sales]);

  // --- ITEM CRUD HANDLERS ---
  const handleItemSubmit = (e) => {
    e.preventDefault();
    if (!itemForm.code || !itemForm.name) {
      alert('품목 코드와 품목명은 필수 입력 사항입니다.');
      return;
    }

    if (editingItem) {
      setItems(prev => prev.map(item => item.code === editingItem.code ? { ...itemForm } : item));
      logActivity('재고', `품목 수정: ${itemForm.name} (${itemForm.code})`);
      setEditingItem(null);
    } else {
      if (items.some(i => i.code === itemForm.code)) {
        alert('이미 존재하는 품목 코드입니다.');
        return;
      }
      setItems(prev => [...prev, { ...itemForm, stock: Number(itemForm.stock) }]);
      logActivity('재고', `신규 품목 등록: ${itemForm.name} (${itemForm.code})`);
    }

    setShowItemModal(false);
    setItemForm({
      code: '', name: '', type: '완제품', spec: '', unit: 'EA', safetyStock: 0, purchasePrice: 0, salesPrice: 0, stock: 0
    });
  };

  const triggerEditItem = (item) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setShowItemModal(true);
  };

  const handleDeleteItem = (code) => {
    if (confirm('정말로 이 품목을 삭제하시겠습니까?')) {
      const deleted = items.find(i => i.code === code);
      setItems(prev => prev.filter(item => item.code !== code));
      logActivity('재고', `품목 삭제: ${deleted ? deleted.name : code}`);
    }
  };

  // --- PARTNER CRUD HANDLERS ---
  const handlePartnerSubmit = (e) => {
    e.preventDefault();
    if (!partnerForm.code || !partnerForm.name) {
      alert('거래처코드와 거래처명은 필수 입력 사항입니다.');
      return;
    }

    if (editingPartner) {
      setPartners(prev => prev.map(p => p.code === editingPartner.code ? { ...partnerForm } : p));
      logActivity('재고', `거래처 정보 수정: ${partnerForm.name} (${partnerForm.code})`);
      setEditingPartner(null);
    } else {
      if (partners.some(p => p.code === partnerForm.code)) {
        alert('이미 존재하는 거래처코드입니다.');
        return;
      }
      setPartners(prev => [...prev, { ...partnerForm }]);
      logActivity('재고', `신규 거래처 등록: ${partnerForm.name} (${partnerForm.code})`);
    }

    setShowPartnerModal(false);
    setPartnerForm({
      code: '', name: '', owner: '', bizType: '', bizItem: '', email: '', phone: '', zipCode: '', address: ''
    });
  };

  const handleImportDesktopCsv = () => {
    if (confirm('바탕화면의 거래처등록_수정.csv 파일 데이터(287건)를 가져오시겠습니까? 기존 데이터는 모두 대체됩니다.')) {
      setPartners(initialPartners);
      logActivity('재고', '바탕화면 거래처등록_수정.csv 데이터 가져오기 완료 (287건)');
      alert('거래처 데이터 287건이 성공적으로 등록되었습니다!');
    }
  };

  const handleImportDesktopItems = () => {
    if (confirm('바탕화면의 품목단가.csv 파일 데이터(1417건)를 가져오시겠습니까? 기존 데이터는 모두 대체됩니다.')) {
      setItems(initialItems);
      logActivity('재고', '바탕화면 품목단가.csv 데이터 가져오기 완료 (1417건)');
      alert('품목 데이터 1417건이 성공적으로 등록되었습니다!');
    }
  };

  const handleImportDesktopSales = () => {
    if (confirm('바탕화면의 판매조회.csv 파일 데이터(117건)를 가져오시겠습니까? 기존 데이터는 모두 대체됩니다.')) {
      setSales(initialSales);
      logActivity('재고', '바탕화면 판매조회.csv 데이터 가져오기 완료 (117건)');
      alert('판매 데이터 117건이 성공적으로 등록되었습니다!');
    }
  };

  const handleImportDesktopPurchases = () => {
    if (confirm('바탕화면의 구매조회.csv 파일 데이터(139건)를 가져오시겠습니까? 기존 데이터는 모두 대체됩니다.')) {
      setPurchases(initialPurchases);
      logActivity('재고', '바탕화면 구매조회.csv 데이터 가져오기 완료 (139건)');
      alert('구매 데이터 139건이 성공적으로 등록되었습니다!');
    }
  };


  const triggerEditPartner = (partner) => {
    setEditingPartner(partner);
    setPartnerForm({ ...partner });
    setShowPartnerModal(true);
  };

  const handleDeletePartner = (code) => {
    if (confirm('정말로 이 업체를 삭제하시겠습니까?')) {
      const deleted = partners.find(p => p.code === code);
      setPartners(prev => prev.filter(p => p.code !== code));
      logActivity('재고', `업체 삭제: ${deleted ? deleted.name : code}`);
    }
  };

  // --- TRANSACTION HANDLERS ---
  const handleSalesSubmit = (e) => {
    e.preventDefault();
    if (!salesForm.customer || !salesForm.itemCode || salesForm.qty <= 0) {
      alert('거래처, 품목, 수량을 모두 확인해 주세요.');
      return;
    }

    const item = items.find(i => i.code === salesForm.itemCode);
    if (!item) {
      alert('유효하지 않은 품목입니다.');
      return;
    }

    if (item.stock < salesForm.qty) {
      if (!confirm(`현재고(${item.stock}개)가 출고 요청 수량(${salesForm.qty}개)보다 적습니다. 마이너스 재고로 진행하시겠습니까?`)) {
        return;
      }
    }

    const newSale = {
      id: 'SL-' + Date.now(),
      ...salesForm,
      qty: Number(salesForm.qty),
      price: Number(salesForm.price),
      itemName: item.name
    };

    setSales(prev => [newSale, ...prev]);
    setItems(prev => prev.map(i => i.code === salesForm.itemCode ? { ...i, stock: i.stock - Number(salesForm.qty) } : i));
    logActivity('재고', `판매 전표 등록: ${salesForm.customer} - ${item.name} ${salesForm.qty}개`);
    setShowSalesModal(false);
    
    // Reset Sales form
    setSalesForm({
      date: new Date().toISOString().substring(0, 10),
      seq: 1,
      partnerCode: '',
      customer: '',
      paymentMethod: '',
      note: '',
      itemCode: '',
      qty: 0,
      price: 0,
      supplyValue: 0,
      vat: 0,
      purchasePlace: '',
      employee: '양유지',
      isAccountReflected: true
    });
  };

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (!purchaseForm.vendor || !purchaseForm.itemCode || purchaseForm.qty <= 0) {
      alert('매입처, 품목, 수량을 모두 확인해 주세요.');
      return;
    }

    const item = items.find(i => i.code === purchaseForm.itemCode);
    if (!item) {
      alert('유효하지 않은 품목입니다.');
      return;
    }

    const newPurchase = {
      id: 'PC-' + Date.now(),
      ...purchaseForm,
      qty: Number(purchaseForm.qty),
      price: Number(purchaseForm.price),
      itemName: item.name
    };

    setPurchases(prev => [newPurchase, ...prev]);
    setItems(prev => prev.map(i => i.code === purchaseForm.itemCode ? { ...i, stock: i.stock + Number(purchaseForm.qty) } : i));
    logActivity('재고', `구매 전표 등록: ${purchaseForm.vendor} - ${item.name} ${purchaseForm.qty}개`);
    setShowPurchaseModal(false);
    
    setPurchaseForm({
      date: new Date().toISOString().substring(0, 10),
      vendor: '', itemCode: '', qty: 0, price: 0, supplyValue: 0, vat: 0, paymentMethod: '계좌'
    });
  };

  // Filters & Sorting for Items
  const sortedItems = [...items].filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortField) {
    sortedItems.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'purchasePrice' || sortField === 'salesPrice') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const groupSize = 10;
    const startPage = Math.floor((currentPage - 1) / groupSize) * groupSize + 1;
    const endPage = Math.min(totalPages, startPage + groupSize - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <span 
          key={i} 
          className={`page-num-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </span>
      );
    }

    const handleGoToPage = (e) => {
      e.preventDefault();
      const p = Number(goToPageInput);
      if (p >= 1 && p <= totalPages) {
        setCurrentPage(p);
        setGoToPageInput('');
      } else {
        alert(`1부터 ${totalPages} 사이의 페이지 번호를 입력하세요.`);
      }
    };

    return (
      <div className="erp-pagination">
        <div className="page-numbers">
          {pageNumbers}
          {endPage < totalPages && (
            <span className="page-arrow" onClick={() => setCurrentPage(endPage + 1)}>&gt;</span>
          )}
          {currentPage < totalPages && (
            <span className="page-arrow" onClick={() => setCurrentPage(totalPages)}>&raquo;</span>
          )}
        </div>
        <form onSubmit={handleGoToPage} className="page-go-form">
          <input 
            type="number" 
            className="page-go-input"
            min="1"
            max={totalPages}
            value={goToPageInput}
            onChange={(e) => setGoToPageInput(e.target.value)}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ {totalPages}</span>
        </form>
      </div>
    );
  };

  const filteredPartners = partners.filter(p => 
    (p.name || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) || 
    (p.code || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.owner || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.bizType || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.bizItem || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.phone || '').toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(partnerSearchQuery.toLowerCase())
  );

  return (
    <div className="content-area">
      <div className="page-title-container">
        <div className="logo-icon">📦</div>
        <h1 className="page-title">재고 관리 (Inventory)</h1>
      </div>

      {/* Main Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeSubTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('items')}
        >
          기초등록 (품목 및 업체)
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sales')}
        >
          판매등록
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('purchases')}
        >
          구매등록
        </button>
      </div>

      {/* --- SUBTAB 1: 기초등록 (품목등록 vs 업체등록 분할) --- */}
      {activeSubTab === 'items' && (
        <div className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div className="btn-group">
              <button 
                className={`btn ${registerSubTab === 'item_reg' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRegisterSubTab('item_reg')}
              >
                품목 등록 관리 (Items)
              </button>
              <button 
                className={`btn ${registerSubTab === 'partner_reg' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRegisterSubTab('partner_reg')}
              >
                업체 등록 관리 (Partners)
              </button>
            </div>
          </div>

          {/* 1-1. 품목등록 뷰 */}
          {registerSubTab === 'item_reg' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">ERP 품목 대장</h3>
                <div className="search-filter-bar">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="품목명 또는 코드 검색..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '220px' }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingItem(null);
                      setItemForm({
                        code: '', name: '', type: '완제품', spec: '', unit: 'EA', safetyStock: 0, purchasePrice: 0, salesPrice: 0, stock: 0
                      });
                      setShowItemModal(true);
                    }}
                  >
                    + 신규 품목 등록
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleImportDesktopItems}
                    style={{ marginLeft: '8px' }}
                  >
                    📂 바탕화면 품목단가 가져오기
                  </button>
                </div>
              </div>

              {renderPagination()}

              <div className="table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}><input type="checkbox" /></th>
                      <th className="sortable-header" onClick={() => handleSort('code')}>품목코드 {sortField === 'code' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                      <th className="sortable-header" onClick={() => handleSort('name')}>품목명 {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                      <th className="sortable-header" onClick={() => handleSort('spec')}>규격 {sortField === 'spec' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                      <th className="sortable-header" onClick={() => handleSort('unit')}>단위 {sortField === 'unit' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                      <th className="sortable-header" style={{ textAlign: 'right' }} onClick={() => handleSort('purchasePrice')}>입고단가 {sortField === 'purchasePrice' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                      <th className="sortable-header" style={{ textAlign: 'right' }} onClick={() => handleSort('salesPrice')}>소비자가 {sortField === 'salesPrice' ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          등록된 품목이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map(item => (
                        <tr key={item.code}>
                          <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                          <td>
                            <span className="link-text" onClick={() => triggerEditItem(item)}>
                              {item.code}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{item.name}</td>
                          <td>{item.spec || '-'}</td>
                          <td>{item.unit || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {item.purchasePrice ? Number(item.purchasePrice).toLocaleString() : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            {item.salesPrice ? Number(item.salesPrice).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1-2. 업체등록 뷰 */}
          {registerSubTab === 'partner_reg' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">ERP 등록 업체 정보 (매출처/매입처)</h3>
                <div className="search-filter-bar">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="업체명 또는 등록번호 검색..." 
                    value={partnerSearchQuery}
                    onChange={(e) => setPartnerSearchQuery(e.target.value)}
                    style={{ width: '220px' }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingPartner(null);
                      setPartnerForm({
                        code: '', name: '', owner: '', bizType: '', bizItem: '', email: '', phone: '', zipCode: '', address: ''
                      });
                      setShowPartnerModal(true);
                    }}
                  >
                    + 신규 업체 등록
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleImportDesktopCsv}
                    style={{ marginLeft: '8px' }}
                  >
                    📂 바탕화면 CSV 가져오기
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>거래처코드</th>
                      <th>거래처명</th>
                      <th>대표자명</th>
                      <th>업태</th>
                      <th>종목</th>
                      <th>Email</th>
                      <th>전화</th>
                      <th>우편번호</th>
                      <th>주소</th>
                      <th style={{ textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          등록된 거래처 정보가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredPartners.map(p => (
                        <tr key={p.code}>
                          <td style={{ fontWeight: '600' }}>{p.code}</td>
                          <td style={{ fontWeight: '500' }}>{p.name}</td>
                          <td>{p.owner || '-'}</td>
                          <td>{p.bizType || '-'}</td>
                          <td>{p.bizItem || '-'}</td>
                          <td>{p.email || '-'}</td>
                          <td>{p.phone || '-'}</td>
                          <td>{p.zipCode || '-'}</td>
                          <td style={{ fontSize: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.address}>{p.address || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="btn-group" style={{ justifyContent: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => triggerEditPartner(p)}
                              >
                                수정
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleDeletePartner(p.code)}
                              >
                                삭제
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
        </div>
      )}

      {/* --- SUBTAB 2: 판매등록 (Columns updated to match the ECOUNT screenshot exactly) --- */}
      {activeSubTab === 'sales' && (
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">판매 매출 대장 (Sales Ledger)</h2>
            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const defaultClientName = partners.length > 0 ? partners[0].name : '';
                  const defaultClient = partners.length > 0 ? partners[0] : null;

                  setSalesForm(prev => ({
                    ...prev,
                    customer: defaultClientName,
                    partnerCode: defaultClient ? defaultClient.code : '',
                    purchasePlace: defaultClientName,
                    date: new Date().toISOString().substring(0, 10),
                    employee: '양유지',
                    isAccountReflected: true
                  }));
                  setShowSalesModal(true);
                }}
              >
                + 판매 등록 (출고)
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleImportDesktopSales}
              >
                📂 바탕화면 판매조회 가져오기
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}><input type="checkbox" /></th>
                  <th>일자-No.</th>
                  <th>거래처코드</th>
                  <th>거래처명</th>
                  <th>결제방식</th>
                  <th>적요</th>
                  <th>품목명(요약)</th>
                  <th style={{ textAlign: 'right' }}>금액합계</th>
                  <th style={{ textAlign: 'right' }}>공급가액합계</th>
                  <th style={{ textAlign: 'right' }}>부가세합계</th>
                  <th>구입처</th>
                  <th>사원(담당)명</th>
                  <th style={{ textAlign: 'center' }}>회계반영여부</th>
                  <th style={{ textAlign: 'center' }}>인쇄</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      등록된 판매 거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id}>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                      <td style={{ fontWeight: '500' }}>
                        {sale.date ? sale.date.replace(/-/g, '/') : ''} -{sale.seq || 1}
                      </td>
                      <td style={{ fontSize: '13px' }}>{sale.partnerCode || '-'}</td>
                      <td style={{ fontWeight: '600' }}>{sale.customer}</td>
                      <td>{sale.paymentMethod || '-'}</td>
                      <td>{sale.note || '-'}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sale.itemName}>{sale.itemName}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>
                        {(Number(sale.supplyValue || 0) + Number(sale.vat || 0)).toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right' }}>{Number(sale.supplyValue || 0).toLocaleString()}원</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{Number(sale.vat || 0).toLocaleString()}원</td>
                      <td>{sale.purchasePlace || '-'}</td>
                      <td>{sale.employee || '양유지'}</td>
                      <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
                        {sale.isAccountReflected ? '✔' : ''}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => alert(`전표 번호: ${sale.id}\n거래처: ${sale.customer}\n공급가액: ${sale.supplyValue.toLocaleString()}원\n\n해당 매출 전표의 인쇄 프리뷰를 준비 중입니다.`)}
                        >
                          인쇄
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: 구매등록 --- */}
      {activeSubTab === 'purchases' && (
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">구매 매입 대장 (Purchase Ledger)</h2>
            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setPurchaseForm(prev => ({
                    ...prev,
                    vendor: partners.length > 0 ? partners[0].name : ''
                  }));
                  setShowPurchaseModal(true);
                }}
              >
                + 구매 등록 (입고)
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleImportDesktopPurchases}
              >
                📂 바탕화면 구매조회 가져오기
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>전표번호</th>
                  <th>구매일자</th>
                  <th>매입처</th>
                  <th>품목명</th>
                  <th style={{ textAlign: 'right' }}>수량</th>
                  <th style={{ textAlign: 'right' }}>단가</th>
                  <th style={{ textAlign: 'right' }}>공급가액</th>
                  <th style={{ textAlign: 'right' }}>부가세</th>
                  <th style={{ textAlign: 'right' }}>합계금액</th>
                  <th>결제방법</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      등록된 구매 거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  purchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td style={{ fontWeight: '600', color: 'var(--primary-pink)' }}>{purchase.id}</td>
                      <td>{purchase.date}</td>
                      <td style={{ fontWeight: '500' }}>{purchase.vendor}</td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '6px' }}>[{purchase.itemCode}]</span>
                        {purchase.itemName}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{Number(purchase.qty).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{Number(purchase.price).toLocaleString()}원</td>
                      <td style={{ textAlign: 'right' }}>{Number(purchase.supplyValue).toLocaleString()}원</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{Number(purchase.vat).toLocaleString()}원</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-pink)' }}>
                        {(Number(purchase.supplyValue) + Number(purchase.vat)).toLocaleString()}원
                      </td>
                      <td>
                        <span className={`badge ${
                          purchase.paymentMethod === '카드' ? 'badge-blue' : 
                          purchase.paymentMethod === '계좌' ? 'badge-green' : 'badge-pink'
                        }`}>
                          {purchase.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: 품목 등록/수정 모달 --- */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="panel-title">{editingItem ? '품목 정보 수정' : '신규 품목 기초등록'}</h2>
              <button className="modal-close" onClick={() => setShowItemModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">품목 코드 *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      disabled={!!editingItem}
                      value={itemForm.code}
                      onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="예: ALB-01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">구분</label>
                    <select 
                      className="form-control"
                      value={itemForm.type}
                      onChange={(e) => setItemForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="완제품">완제품</option>
                      <option value="원재료">원재료</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">품목명 *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: NewJeans 2nd EP 'Get Up'"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">규격</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={itemForm.spec}
                      onChange={(e) => setItemForm(prev => ({ ...prev, spec: e.target.value }))}
                      placeholder="예: Box Ver."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단위</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={itemForm.unit}
                      onChange={(e) => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">표준 매입가 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={itemForm.purchasePrice}
                      onChange={(e) => setItemForm(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">표준 매출가 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={itemForm.salesPrice}
                      onChange={(e) => setItemForm(prev => ({ ...prev, salesPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">안전 재고 수량</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={itemForm.safetyStock}
                      onChange={(e) => setItemForm(prev => ({ ...prev, safetyStock: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">기초 재고 수량</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      disabled={!!editingItem}
                      value={itemForm.stock}
                      onChange={(e) => setItemForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">{editingItem ? '수정 완료' : '등록 저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: 업체 등록/수정 모달 --- */}
      {showPartnerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="panel-title">{editingPartner ? '거래처 정보 수정' : '신규 거래처 등록'}</h2>
              <button className="modal-close" onClick={() => setShowPartnerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePartnerSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">거래처코드 *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      disabled={!!editingPartner}
                      value={partnerForm.code}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="예: 214-86-64494 또는 250811-01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">거래처명 *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="상호명 입력"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">대표자명</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={partnerForm.owner}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, owner: e.target.value }))}
                      placeholder="대표자 성명"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">전화번호</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={partnerForm.phone}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="예: 02-576-6303"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">업태</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={partnerForm.bizType}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, bizType: e.target.value }))}
                      placeholder="예: 제조업, 도소매"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">종목</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={partnerForm.bizItem}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, bizItem: e.target.value }))}
                      placeholder="예: 생물학 제품, 과학기자재"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="예: tax@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">우편번호</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={partnerForm.zipCode}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="우편번호"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">주소</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={partnerForm.address}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="상세 주소"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPartnerModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">{editingPartner ? '수정 완료' : '등록 저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: 판매 등록 모달 (Fully updated inputs for new columns) --- */}
      {showSalesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="panel-title">신규 판매 등록</h2>
              <button className="modal-close" onClick={() => setShowSalesModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSalesSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">판매 일자</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={salesForm.date}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">일자-No. 순번</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      min="1"
                      value={salesForm.seq}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, seq: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">거래처 선택 *</label>
                    <select 
                      className="form-control"
                      required
                      value={salesForm.customer}
                      onChange={(e) => handleSalesCustomerChange(e.target.value)}
                    >
                      <option value="">-- 거래처 선택 --</option>
                      {partners.map(p => (
                        <option key={p.code} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">거래처코드 (자동)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={salesForm.partnerCode || '거래처 선택 시 자동 로드'}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">결제방식</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="예: 나노엔텍(뉴진)"
                      value={salesForm.paymentMethod}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">적요 (비고)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="예: Q-669874"
                      value={salesForm.note}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">판매 품목 선택 *</label>
                  <select 
                    className="form-control"
                    required
                    value={salesForm.itemCode}
                    onChange={(e) => handleSalesItemChange(e.target.value)}
                  >
                    <option value="">-- 품목을 선택하세요 --</option>
                    {items.filter(i => i.type === '완제품').map(i => (
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
                      value={salesForm.qty}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단가 (원) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      value={salesForm.price}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">공급가액 (자동)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={salesForm.supplyValue.toLocaleString() + ' 원'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">부가세 (자동, 10%)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={salesForm.vat.toLocaleString() + ' 원'}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">구입처</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="예: 엑소젠"
                      value={salesForm.purchasePlace}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, purchasePlace: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">사원(담당)명</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={salesForm.employee}
                      onChange={(e) => setSalesForm(prev => ({ ...prev, employee: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                  <input 
                    type="checkbox" 
                    id="isAccountReflected"
                    checked={salesForm.isAccountReflected}
                    onChange={(e) => setSalesForm(prev => ({ ...prev, isAccountReflected: e.target.checked }))}
                  />
                  <label htmlFor="isAccountReflected" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>회계 반영 여부</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalesModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">판매 저장 및 출고</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: 구매 등록 모달 (매입처 Select 박스 연동) --- */}
      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="panel-title">신규 구매 등록</h2>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">구매 일자</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      required
                      value={purchaseForm.date}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">매입처 선택 *</label>
                    <select 
                      className="form-control"
                      required
                      value={purchaseForm.vendor}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, vendor: e.target.value }))}
                    >
                      <option value="">-- 매입처 선택 --</option>
                      {partners.map(p => (
                        <option key={p.code} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">구매 품목 선택 *</label>
                  <select 
                    className="form-control"
                    required
                    value={purchaseForm.itemCode}
                    onChange={(e) => handlePurchaseItemChange(e.target.value)}
                  >
                    <option value="">-- 품목을 선택하세요 --</option>
                    {items.map(i => (
                      <option key={i.code} value={i.code}>
                        [{i.code}] {i.name} (구분: {i.type}, 재고: {i.stock} {i.unit})
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
                      value={purchaseForm.qty}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">단가 (원) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      required
                      value={purchaseForm.price}
                      onChange={(e) => setPurchaseForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">공급가액 (자동)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={purchaseForm.supplyValue.toLocaleString() + ' 원'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">부가세 (자동, 10%)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled
                      value={purchaseForm.vat.toLocaleString() + ' 원'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">결제 방법</label>
                  <select 
                    className="form-control"
                    value={purchaseForm.paymentMethod}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="계좌">계좌 이체</option>
                    <option value="카드">법인 신용카드</option>
                    <option value="외상">외상 거래 (미지급금)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPurchaseModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">구매 저장 및 입고</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
