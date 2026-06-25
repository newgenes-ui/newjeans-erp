import React, { useState } from 'react';

export default function FixedExpenses({
  employees = [],
  setEmployees,
  officeExpenses = [],
  setOfficeExpenses,
  cardPurchaseTransactions = [],
  setCardPurchaseTransactions,
  items,
  setItems,
  purchases,
  setPurchases,
  logActivity
}) {
  const [fixedTab, setFixedTab] = useState('employee'); // 'employee', 'office'
  
  // Employee Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    position: '',
    baseSalary: 0,
    isAutoInsurance: true,
    insurancesTotal: 0,
    cardUsage: 0
  });

  // Office Expenses Modal States
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [officeForm, setOfficeForm] = useState({
    month: new Date().toISOString().substring(0, 7),
    tax: 0,
    corporatePhone: 0,
    avanteRental: 0,
    rayInstallment: 0,
    smallBizLoanInterest: 0,
    ibkLoanInterest: 0,
    kiboLoanInterest: 0,
    creditLoanInterest: 0
  });

  // Card Purchase Manual Modal (Shared with main accounting logic)
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    cardNum: 'KB국민법인카드 (9482)',
    partner: '',
    purchaseAmt: 0,
    cardUser: ''
  });

  // --- EMPLOYEE CRUD HANDLERS ---
  const handleEmployeeSalaryChange = (val) => {
    const base = Number(val);
    setEmployeeForm(prev => {
      const updated = { ...prev, baseSalary: base };
      if (prev.isAutoInsurance) {
        // Auto calculate 4대보험 worker contributions: Pension 4.5% + Health 3.54% + Employment 0.9% = 8.94%
        updated.insurancesTotal = Math.round(base * 0.0894);
      }
      return updated;
    });
  };

  const handleAutoInsuranceToggle = (checked) => {
    setEmployeeForm(prev => {
      const updated = { ...prev, isAutoInsurance: checked };
      if (checked) {
        updated.insurancesTotal = Math.round(prev.baseSalary * 0.0894);
      }
      return updated;
    });
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.position || employeeForm.baseSalary < 0) {
      alert('필수 정보를 올바르게 입력해 주세요.');
      return;
    }

    const base = Number(employeeForm.baseSalary);
    const ins = Number(employeeForm.insurancesTotal);
    const card = Number(employeeForm.cardUsage);
    const netPay = base - ins;

    // Split components for backward compatibility/reporting
    const pension = Math.round(base * 0.045);
    const health = Math.round(base * 0.0354);
    const employment = Math.round(base * 0.009);

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        name: employeeForm.name,
        position: employeeForm.position,
        baseSalary: base,
        pension,
        health,
        employment,
        insurancesTotal: ins,
        isAutoInsurance: employeeForm.isAutoInsurance,
        netPay,
        cardUsage: card
      } : emp));
      logActivity('급여', `고정지출: 직원 정보 수정 (${employeeForm.name})`);
    } else {
      const newEmp = {
        id: 'EMP-' + Date.now(),
        name: employeeForm.name,
        position: employeeForm.position,
        baseSalary: base,
        pension,
        health,
        employment,
        insurancesTotal: ins,
        isAutoInsurance: employeeForm.isAutoInsurance,
        netPay,
        cardUsage: card
      };
      setEmployees(prev => [...prev, newEmp]);
      logActivity('급여', `고정지출: 신규 직원 등록 (${employeeForm.name})`);
    }

    setShowEmployeeModal(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id) => {
    if (confirm('정말로 이 직원 정보를 삭제하시겠습니까?')) {
      const target = employees.find(e => e.id === id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      logActivity('급여', `고정지출: 직원 정보 삭제 (${target ? target.name : id})`);
    }
  };

  // --- OFFICE EXPENSES HANDLERS ---
  const handleOfficeSubmit = (e) => {
    e.preventDefault();
    if (!officeForm.month) {
      alert('년월을 선택해 주세요.');
      return;
    }

    const record = {
      month: officeForm.month,
      tax: Number(officeForm.tax),
      corporatePhone: Number(officeForm.corporatePhone),
      avanteRental: Number(officeForm.avanteRental),
      rayInstallment: Number(officeForm.rayInstallment),
      smallBizLoanInterest: Number(officeForm.smallBizLoanInterest),
      ibkLoanInterest: Number(officeForm.ibkLoanInterest),
      kiboLoanInterest: Number(officeForm.kiboLoanInterest),
      creditLoanInterest: Number(officeForm.creditLoanInterest)
    };

    const exists = officeExpenses.some(o => o.month === officeForm.month);

    if (editingOffice) {
      setOfficeExpenses(prev => prev.map(o => o.month === editingOffice.month ? record : o));
      logActivity('지출', `고정지출: 사무실 고정비용 수정 (${officeForm.month})`);
    } else {
      if (exists) {
        if (confirm(`${officeForm.month} 데이터가 이미 존재합니다. 덮어쓰시겠습니까?`)) {
          setOfficeExpenses(prev => prev.map(o => o.month === officeForm.month ? record : o));
          logActivity('지출', `고정지출: 사무실 고정비용 덮어쓰기 (${officeForm.month})`);
        } else {
          return;
        }
      } else {
        setOfficeExpenses(prev => [...prev, record].sort((a, b) => b.month.localeCompare(a.month)));
        logActivity('지출', `고정지출: 신규 사무실 고정비용 등록 (${officeForm.month})`);
      }
    }

    setShowOfficeModal(false);
    setEditingOffice(null);
  };

  const handleDeleteOffice = (month) => {
    if (confirm(`정말로 ${month} 사무실 고정 지출 기록을 삭제하시겠습니까?`)) {
      setOfficeExpenses(prev => prev.filter(o => o.month !== month));
      logActivity('지출', `고정지출: 사무실 고정비용 삭제 (${month})`);
    }
  };

  // --- CARD PURCHASE SUBMIT (Appended to central transactions) ---
  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardForm.partner || cardForm.purchaseAmt <= 0) {
      alert('사용처와 금액을 바르게 입력해 주세요.');
      return;
    }

    const newTx = {
      id: 'CP-' + Date.now(),
      date: cardForm.date,
      cardNum: cardForm.cardNum,
      partner: cardForm.partner,
      purchaseAmt: Number(cardForm.purchaseAmt),
      cardUser: cardForm.cardUser || '양유지',
      synced: true,
      posted: false,
      slipId: ''
    };

    // Update central state
    setCardPurchaseTransactions(prev => [newTx, ...prev]);

    // Update employee card usage if the cardUser matches an employee's name
    if (cardForm.cardUser) {
      setEmployees(prev => prev.map(emp => {
        if (emp.name === cardForm.cardUser) {
          return { ...emp, cardUsage: (emp.cardUsage || 0) + Number(cardForm.purchaseAmt) };
        }
        return emp;
      }));
    }

    logActivity('회계', `법인카드 지출 등록: ${cardForm.partner} - ${Number(cardForm.purchaseAmt).toLocaleString()}`);
    setShowCardModal(false);
  };

  // --- CALCULATION HELPERS FOR KPI ---
  // Employee stats
  const totalEmployeesSalary = employees.reduce((acc, curr) => acc + curr.baseSalary, 0);
  const totalEmployeesInsurances = employees.reduce((acc, curr) => acc + (curr.insurancesTotal || (curr.pension + curr.health + curr.employment) || 0), 0);
  const totalEmployeesCard = employees.reduce((acc, curr) => acc + (curr.cardUsage || 0), 0);
  const totalEmployeesNetPay = employees.reduce((acc, curr) => acc + curr.netPay, 0);

  // Latest office stats (or average/sum of current view)
  const latestOfficeRecord = officeExpenses[0] || {
    tax: 0, corporatePhone: 0, avanteRental: 0, rayInstallment: 0,
    smallBizLoanInterest: 0, ibkLoanInterest: 0, kiboLoanInterest: 0, creditLoanInterest: 0
  };

  const officeMonthlySum = 
    latestOfficeRecord.tax + 
    latestOfficeRecord.corporatePhone + 
    latestOfficeRecord.avanteRental + 
    latestOfficeRecord.rayInstallment + 
    latestOfficeRecord.smallBizLoanInterest + 
    latestOfficeRecord.ibkLoanInterest + 
    latestOfficeRecord.kiboLoanInterest + 
    latestOfficeRecord.creditLoanInterest;

  const officeLoansSum = 
    latestOfficeRecord.smallBizLoanInterest + 
    latestOfficeRecord.ibkLoanInterest + 
    latestOfficeRecord.kiboLoanInterest + 
    latestOfficeRecord.creditLoanInterest;

  return (
    <div className="content-area">
      
      {/* KPI summaries */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '24px' }}>
        
        {/* Total monthly fixed cost summary */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-blue, #1a56db)' }}>
          <div className="kpi-header">
            <span className="kpi-title">이번달 총 고정 지출 (인건비+사무실)</span>
            <span className="kpi-icon">💸</span>
          </div>
          <div className="kpi-value">{(totalEmployeesSalary + officeMonthlySum).toLocaleString()}</div>
          <div className="kpi-subtext">직원 급여 총합 + 직전 등록 월 사무실 고정비</div>
        </div>

        {/* Employee Costs Summary */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">직원 총 인건비 지출</span>
            <span className="kpi-icon">👥</span>
          </div>
          <div className="kpi-value">{totalEmployeesSalary.toLocaleString()}</div>
          <div className="kpi-subtext">직원 {employees.length}명 기본급 총합</div>
        </div>

        {/* Office Cost Summary */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">사무실 월 고정 지출 ({latestOfficeRecord.month || '내역 없음'})</span>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value">{officeMonthlySum.toLocaleString()}</div>
          <div className="kpi-subtext">세금, 통신비, 렌탈, 대출이자 등 총계</div>
        </div>

        {/* Interest Costs Summary */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-header">
            <span className="kpi-title">월 총 금융 대출 이자비용</span>
            <span className="kpi-icon">📈</span>
          </div>
          <div className="kpi-value">{officeLoansSum.toLocaleString()}</div>
          <div className="kpi-subtext">소상공인, 기업은행, 기보, 신용대출 이자 합산</div>
        </div>

      </div>

      {/* Main Tabs Container */}
      <div className="panel-card" style={{ padding: '24px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div className="btn-group">
            <button 
              className={`btn ${fixedTab === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFixedTab('employee')}
            >
              👥 직원별 고정 지출 관리
            </button>
            <button 
              className={`btn ${fixedTab === 'office' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFixedTab('office')}
            >
              🏢 월별 고정 사무실 지출 관리
            </button>
          </div>
        </div>

        {/* --- TAB 1: 직원별 고정 지출 --- */}
        {fixedTab === 'employee' && (
          <div>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 className="panel-title" style={{ fontSize: '15px' }}>직원별 급여, 4대보험 및 법인카드 지출대장</h3>
              <div className="btn-group">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setCardForm({
                      date: new Date().toISOString().substring(0, 10),
                      cardNum: 'KB국민법인카드 (9482)',
                      partner: '',
                      purchaseAmt: 0,
                      cardUser: ''
                    });
                    setShowCardModal(true);
                  }}
                >
                  💳 법인카드 사용 등록
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingEmployee(null);
                    setEmployeeForm({
                      name: '',
                      position: '',
                      baseSalary: 0,
                      isAutoInsurance: true,
                      insurancesTotal: 0,
                      cardUsage: 0
                    });
                    setShowEmployeeModal(true);
                  }}
                >
                  + 신규 직원 등록
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>사원ID</th>
                    <th>성명</th>
                    <th>직급/부서</th>
                    <th style={{ textAlign: 'right' }}>급여 (기본급)</th>
                    <th style={{ textAlign: 'right' }}>4대보험 전체금액</th>
                    <th style={{ textAlign: 'right' }}>실수령액</th>
                    <th style={{ textAlign: 'right' }}>법인카드 사용금액</th>
                    <th style={{ textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        등록된 직원 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: '600' }}>{emp.id}</td>
                        <td style={{ fontWeight: '500' }}>{emp.name}</td>
                        <td>{emp.position}</td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>{emp.baseSalary.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {(emp.insurancesTotal || (emp.pension + emp.health + emp.employment) || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>{emp.netPay.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: '500', color: '#be123c' }}>{(emp.cardUsage || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="btn-group" style={{ justifyContent: 'center', gap: '6px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmployeeForm({
                                  name: emp.name,
                                  position: emp.position,
                                  baseSalary: emp.baseSalary,
                                  isAutoInsurance: emp.isAutoInsurance !== undefined ? emp.isAutoInsurance : true,
                                  insurancesTotal: emp.insurancesTotal || (emp.pension + emp.health + emp.employment) || 0,
                                  cardUsage: emp.cardUsage || 0
                                });
                                setShowEmployeeModal(true);
                              }}
                            >
                              수정
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleDeleteEmployee(emp.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    <td colSpan="3" style={{ textAlign: 'center' }}>합계</td>
                    <td style={{ textAlign: 'right' }}>{totalEmployeesSalary.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{totalEmployeesInsurances.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--primary-blue)' }}>{totalEmployeesNetPay.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#be123c' }}>{totalEmployeesCard.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: 월별 고정 사무실 지출 --- */}
        {fixedTab === 'office' && (
          <div>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 className="panel-title" style={{ fontSize: '15px' }}>사무실 월별 고정비용 및 대출이자 기록대장</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingOffice(null);
                  setOfficeForm({
                    month: new Date().toISOString().substring(0, 7),
                    tax: 0,
                    corporatePhone: 0,
                    avanteRental: 0,
                    rayInstallment: 0,
                    smallBizLoanInterest: 0,
                    ibkLoanInterest: 0,
                    kiboLoanInterest: 0,
                    creditLoanInterest: 0
                  });
                  setShowOfficeModal(true);
                }}
              >
                + 월별 고정비 등록
              </button>
            </div>

            <div className="table-responsive">
              <table className="erp-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>년월</th>
                    <th style={{ textAlign: 'right' }}>세금</th>
                    <th style={{ textAlign: 'right' }}>법인핸드폰사용액</th>
                    <th style={{ textAlign: 'right' }}>아반테 렌탈</th>
                    <th style={{ textAlign: 'right' }}>레이 할부</th>
                    <th style={{ textAlign: 'right' }}>소상공인 대출이자</th>
                    <th style={{ textAlign: 'right' }}>기업은행 대출이자</th>
                    <th style={{ textAlign: 'right' }}>기술보증기금 이자</th>
                    <th style={{ textAlign: 'right' }}>신용대출 이자</th>
                    <th style={{ textAlign: 'right', fontWeight: 'bold' }}>월 합계</th>
                    <th style={{ textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {officeExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        등록된 월별 고정 지출 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    officeExpenses.map(o => {
                      const rowSum = o.tax + o.corporatePhone + o.avanteRental + o.rayInstallment + 
                        o.smallBizLoanInterest + o.ibkLoanInterest + o.kiboLoanInterest + o.creditLoanInterest;
                      return (
                        <tr key={o.month}>
                          <td style={{ fontWeight: '700' }}>{o.month}</td>
                          <td style={{ textAlign: 'right' }}>{o.tax.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{o.corporatePhone.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{o.avanteRental.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{o.rayInstallment.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{o.smallBizLoanInterest.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{o.ibkLoanInterest.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{o.kiboLoanInterest.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{o.creditLoanInterest.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>{rowSum.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="btn-group" style={{ justifyContent: 'center', gap: '4px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                onClick={() => {
                                  setEditingOffice(o);
                                  setOfficeForm({ ...o });
                                  setShowOfficeModal(true);
                                }}
                              >
                                수정
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                onClick={() => handleDeleteOffice(o.month)}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: 직원 등록 / 수정 모달 --- */}
      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="panel-title">{editingEmployee ? '직원 정보 수정' : '신규 직원 등록'}</h2>
              <button className="modal-close" onClick={() => setShowEmployeeModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEmployeeSubmit}>
              <div className="modal-body">
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">사원 성명 *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 민지"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">직급/부서 *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="예: 아티스트, 대리 (인사팀)"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">기본급 (원) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="0"
                    value={employeeForm.baseSalary}
                    onChange={(e) => handleEmployeeSalaryChange(e.target.value)}
                    placeholder="급여 금액 입력"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <input 
                      type="checkbox" 
                      id="isAutoInsurance"
                      checked={employeeForm.isAutoInsurance}
                      onChange={(e) => handleAutoInsuranceToggle(e.target.checked)}
                    />
                    <label htmlFor="isAutoInsurance" style={{ fontSize: '13px', fontWeight: '500', userSelect: 'none' }}>
                      4대보험 자동 계산 적용 (급여의 8.94% 적용)
                    </label>
                  </div>
                  
                  <label className="form-label">4대보험 전체금액 (원) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="0"
                    disabled={employeeForm.isAutoInsurance}
                    value={employeeForm.insurancesTotal}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, insurancesTotal: Number(e.target.value) }))}
                    placeholder="4대보험 총 공제액 입력"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">법인카드 사용액 (원)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    value={employeeForm.cardUsage}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, cardUsage: Number(e.target.value) }))}
                    placeholder="법인카드 사용액 입력"
                  />
                </div>

                <div style={{ marginTop: '16px', background: 'var(--border-color)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-primary)' }}>실수령액 요약</div>
                  <div>- 기본 급여액: {employeeForm.baseSalary.toLocaleString()}</div>
                  <div>- 4대보험 공제액: {employeeForm.insurancesTotal.toLocaleString()}</div>
                  <div style={{ marginTop: '6px', borderTop: '1px solid var(--text-muted)', paddingTop: '6px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                    - 예상 실수령액: {(employeeForm.baseSalary - employeeForm.insurancesTotal).toLocaleString()}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">{editingEmployee ? '수정 완료' : '추가 저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: 월별 사무실 지출 등록 / 수정 모달 --- */}
      {showOfficeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="panel-title">{editingOffice ? '월별 고정 지출 수정' : '월별 고정 지출 등록'}</h2>
              <button className="modal-close" onClick={() => setShowOfficeModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleOfficeSubmit}>
              <div className="modal-body">
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">지출 년월 *</label>
                    <input 
                      type="month" 
                      className="form-control" 
                      required 
                      disabled={!!editingOffice}
                      value={officeForm.month}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, month: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">세금 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.tax}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, tax: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">법인핸드폰사용액 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.corporatePhone}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, corporatePhone: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">아반테 렌탈비용 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.avanteRental}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, avanteRental: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">레이 법인차 할부금액 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.rayInstallment}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, rayInstallment: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">소상공인 대출이자 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.smallBizLoanInterest}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, smallBizLoanInterest: Number(e.target.value) }))}
                      style={{ color: '#b45309', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">기업은행 대출이자 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.ibkLoanInterest}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, ibkLoanInterest: Number(e.target.value) }))}
                      style={{ color: '#b45309', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">기술보증기금 이자 (원)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.kiboLoanInterest}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, kiboLoanInterest: Number(e.target.value) }))}
                      style={{ color: '#b45309', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">신용대출 이자 (원)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    value={officeForm.creditLoanInterest}
                    onChange={(e) => setOfficeForm(prev => ({ ...prev, creditLoanInterest: Number(e.target.value) }))}
                    style={{ color: '#b45309', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 'bold' }}>입력 항목 합계: </span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                    {(
                      officeForm.tax + officeForm.corporatePhone + officeForm.avanteRental + officeForm.rayInstallment + 
                      officeForm.smallBizLoanInterest + officeForm.ibkLoanInterest + officeForm.kiboLoanInterest + officeForm.creditLoanInterest
                    ).toLocaleString()}
                  </span>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOfficeModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">{editingOffice ? '수정 저장' : '등록 저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: 법인카드 등록 모달 --- */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="panel-title">법인카드 사용 등록</h2>
              <button className="modal-close" onClick={() => setShowCardModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCardSubmit}>
              <div className="modal-body">
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">사용 일자 *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={cardForm.date}
                    onChange={(e) => setCardForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">법인카드 선택 *</label>
                  <select 
                    className="form-control"
                    value={cardForm.cardNum}
                    onChange={(e) => setCardForm(prev => ({ ...prev, cardNum: e.target.value }))}
                  >
                    <option value="KB국민법인카드 (9482)">KB국민법인카드 (9482)</option>
                    <option value="신한법인카드 (1029)">신한법인카드 (1029)</option>
                    <option value="현대법인카드 (8842)">현대법인카드 (8842)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">사용처 (가맹점) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={cardForm.partner}
                    onChange={(e) => setCardForm(prev => ({ ...prev, partner: e.target.value }))}
                    placeholder="예: 삼거리 식당, 버거킹"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">사용 직원명 (매칭용)</label>
                  <select 
                    className="form-control"
                    value={cardForm.cardUser}
                    onChange={(e) => setCardForm(prev => ({ ...prev, cardUser: e.target.value }))}
                  >
                    <option value="">-- 사원을 선택하세요 (선택 사항) --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">사용 금액 *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    min="1"
                    value={cardForm.purchaseAmt}
                    onChange={(e) => setCardForm(prev => ({ ...prev, purchaseAmt: Number(e.target.value) }))}
                    placeholder="결제 금액 입력"
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCardModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
