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
  const [fixedTab, setFixedTab] = useState('employee'); // 'employee', 'office', 'partner'
  
  // Employee Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    month: 5,
    name: '',
    position: '',
    baseSalary: 0,
    insurancesTotal: 0,
    cardUsage: 0
  });

  // Office Expenses Modal States
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [officeForm, setOfficeForm] = useState({
    month: new Date().toISOString().substring(0, 7),
    officeTax: 0,
    officePhone: 0,
    avanteRental: 0,
    rayInstallment: 0,
    smallBizLoanInterest: 0,
    ibkLoanInterest: 0,
    kiboLoanInterest: 0,
    creditLoanInterest: 0
  });

  // Partner Expenses Modal States
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerForm, setPartnerForm] = useState({
    month: new Date().toISOString().substring(0, 7),
    samsungOA: 0,
    sungjin: 0,
    gwangmyeongG: 0,
    taxService: 0,
    taxCorp: 0,
    ecount: 0,
    bsTech: 0,
    chungho: 0,
    kt: 0,
    skt: 0
  });

  // Card Purchase Manual Modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    cardNum: 'KB국민법인카드 (9482)',
    partner: '',
    purchaseAmt: 0,
    cardUser: ''
  });

  // --- CSV PARSING & IMPORT LOGIC ---
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  };

  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const readWithEncoding = (encoding) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
          if (encoding === 'UTF-8') {
            readWithEncoding('EUC-KR');
            return;
          }
          alert('가져올 데이터가 부족합니다.');
          return;
        }

        // Find header row containing the keywords
        let headerRowIdx = -1;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].includes('월별') && rows[i].includes('상호')) {
            headerRowIdx = i;
            break;
          }
        }

        // Try fallback if header not found
        if (headerRowIdx === -1) {
          if (encoding === 'UTF-8') {
            console.log("UTF-8 header match failed. Retrying with EUC-KR...");
            readWithEncoding('EUC-KR');
            return;
          }
          alert('CSV 헤더(월별, 상호, 합계금액 등)를 찾을 수 없습니다.');
          return;
        }

        const headers = rows[headerRowIdx];
        const monthIdx = headers.indexOf('월별');
        const supplierIdx = headers.indexOf('상호');
        const totalAmtIdx = headers.indexOf('합계금액');
        
        if (monthIdx === -1 || supplierIdx === -1 || totalAmtIdx === -1) {
          alert('필수 열(월별, 상호, 합계금액)을 찾을 수 없습니다.');
          return;
        }

        // Aggregate by month
        const monthlyData = {};

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length <= Math.max(monthIdx, supplierIdx, totalAmtIdx)) continue;
          
          const monthRaw = row[monthIdx].trim();
          if (!monthRaw) continue;

          const monthNum = parseInt(monthRaw, 10);
          if (isNaN(monthNum)) continue;
          const monthStr = `2026-${monthNum.toString().padStart(2, '0')}`;

          const supplierName = row[supplierIdx].trim();
          const totalAmtVal = row[totalAmtIdx].trim().replace(/,/g, '');
          const totalAmt = parseInt(totalAmtVal, 10) || 0;

          if (!monthlyData[monthStr]) {
            monthlyData[monthStr] = {
              tax: 0,
              corporatePhone: 0,
              officeRent: 0,
              maintenance: 0,
              equipmentRental: 0,
              erpServiceFee: 0,
              samsungOA: 0,
              sungjin: 0,
              gwangmyeongG: 0,
              taxService: 0,
              taxCorp: 0,
              ecount: 0,
              bsTech: 0,
              chungho: 0,
              kt: 0,
              skt: 0
            };
          }

          const target = monthlyData[monthStr];
          
          // Mapping rules by supplier keyword
          if (supplierName.includes('비에스테크광명')) {
            target.officeRent += totalAmt;
            target.bsTech += totalAmt;
          } else if (supplierName.includes('광명g타워') || supplierName.includes('광명G타워')) {
            target.maintenance += totalAmt;
            target.gwangmyeongG += totalAmt;
          } else if (supplierName.includes('삼성오에이')) {
            target.equipmentRental += totalAmt;
            target.samsungOA += totalAmt;
          } else if (supplierName.includes('청호나이스')) {
            target.equipmentRental += totalAmt;
            target.chungho += totalAmt;
          } else if (supplierName.includes('이카운트')) {
            target.erpServiceFee += totalAmt;
            target.ecount += totalAmt;
          } else if (supplierName.includes('성진정보텍')) {
            target.erpServiceFee += totalAmt;
            target.sungjin += totalAmt;
          } else if (supplierName.includes('케이티')) {
            target.corporatePhone += totalAmt;
            target.kt += totalAmt;
          } else if (supplierName.includes('에스케이텔레콤') || supplierName.includes('에스케이델레콤')) {
            target.corporatePhone += totalAmt;
            target.skt += totalAmt;
          } else if (supplierName === '기업세무회계') {
            target.tax += totalAmt;
            target.taxService += totalAmt;
          } else if (supplierName.includes('기업세무회계경영') || supplierName.includes('세무') || supplierName.includes('회계')) {
            target.tax += totalAmt;
            target.taxCorp += totalAmt;
          } else {
            // Tax advisor or others go to tax
            target.tax += totalAmt;
            target.taxCorp += totalAmt;
          }
        }

        // Apply changes to state
        setOfficeExpenses(prev => {
          let updated = [...prev];
          
          Object.keys(monthlyData).forEach(month => {
            const parsedExpenses = monthlyData[month];
            const existingIdx = updated.findIndex(o => o.month === month);

            if (existingIdx !== -1) {
              const existing = updated[existingIdx];
              updated[existingIdx] = {
                ...existing,
                tax: parsedExpenses.tax,
                corporatePhone: parsedExpenses.corporatePhone,
                officeRent: parsedExpenses.officeRent,
                maintenance: parsedExpenses.maintenance,
                equipmentRental: parsedExpenses.equipmentRental,
                erpServiceFee: parsedExpenses.erpServiceFee,
                samsungOA: parsedExpenses.samsungOA,
                sungjin: parsedExpenses.sungjin,
                gwangmyeongG: parsedExpenses.gwangmyeongG,
                taxService: parsedExpenses.taxService,
                taxCorp: parsedExpenses.taxCorp,
                ecount: parsedExpenses.ecount,
                bsTech: parsedExpenses.bsTech,
                chungho: parsedExpenses.chungho,
                kt: parsedExpenses.kt,
                skt: parsedExpenses.skt
              };
            } else {
              updated.push({
                month,
                tax: parsedExpenses.tax,
                corporatePhone: parsedExpenses.corporatePhone,
                officeRent: parsedExpenses.officeRent,
                maintenance: parsedExpenses.maintenance,
                equipmentRental: parsedExpenses.equipmentRental,
                erpServiceFee: parsedExpenses.erpServiceFee,
                officeTax: 0,
                officePhone: 0,
                avanteRental: 0,
                rayInstallment: 0,
                smallBizLoanInterest: 0,
                ibkLoanInterest: 0,
                kiboLoanInterest: 0,
                creditLoanInterest: 0,
                samsungOA: parsedExpenses.samsungOA,
                sungjin: parsedExpenses.sungjin,
                gwangmyeongG: parsedExpenses.gwangmyeongG,
                taxService: parsedExpenses.taxService,
                taxCorp: parsedExpenses.taxCorp,
                ecount: parsedExpenses.ecount,
                bsTech: parsedExpenses.bsTech,
                chungho: parsedExpenses.chungho,
                kt: parsedExpenses.kt,
                skt: parsedExpenses.skt
              });
            }
          });

          return updated.sort((a, b) => b.month.localeCompare(a.month));
        });

        logActivity('지출', `국세청 사무실 비용 CSV 가져오기 완료 (${Object.keys(monthlyData).join(', ')} 적용)`);
        alert('국세청 사무실 비용 CSV 파일이 성공적으로 파싱되어 적용되었습니다.');
      };
      reader.onerror = () => {
        if (encoding === 'UTF-8') {
          readWithEncoding('EUC-KR');
        } else {
          alert('CSV 파일을 읽는 동안 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file, encoding);
    };

    // Start with UTF-8
    readWithEncoding('UTF-8');
  };

  // --- EMPLOYEE CRUD HANDLERS ---
  const handleEmployeeSalaryChange = (val) => {
    const base = Number(val);
    setEmployeeForm(prev => {
      const updated = { ...prev, baseSalary: base };
      if (prev.isAutoInsurance) {
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

    const pension = Math.round(base * 0.045);
    const health = Math.round(base * 0.0354);
    const employment = Math.round(base * 0.009);

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        month: Number(employeeForm.month),
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
        month: Number(employeeForm.month),
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

    const officeTaxVal = Number(officeForm.officeTax);
    const officePhoneVal = Number(officeForm.officePhone);
    const avante = Number(officeForm.avanteRental);
    const ray = Number(officeForm.rayInstallment);
    const smallBiz = Number(officeForm.smallBizLoanInterest);
    const ibk = Number(officeForm.ibkLoanInterest);
    const kibo = Number(officeForm.kiboLoanInterest);
    const credit = Number(officeForm.creditLoanInterest);

    // Find existing NTS/partner values to preserve them
    const existing = officeExpenses.find(o => o.month === officeForm.month) || {};

    const record = {
      month: officeForm.month,
      officeTax: officeTaxVal,
      officePhone: officePhoneVal,
      avanteRental: avante,
      rayInstallment: ray,
      smallBizLoanInterest: smallBiz,
      ibkLoanInterest: ibk,
      kiboLoanInterest: kibo,
      creditLoanInterest: credit,
      
      // Preserve NTS category values
      tax: existing.tax !== undefined ? existing.tax : 0,
      corporatePhone: existing.corporatePhone !== undefined ? existing.corporatePhone : 0,
      officeRent: existing.officeRent !== undefined ? existing.officeRent : 0,
      maintenance: existing.maintenance !== undefined ? existing.maintenance : 0,
      equipmentRental: existing.equipmentRental !== undefined ? existing.equipmentRental : 0,
      erpServiceFee: existing.erpServiceFee !== undefined ? existing.erpServiceFee : 0,

      // Preserve partner values
      bsTech: existing.bsTech !== undefined ? existing.bsTech : 0,
      gwangmyeongG: existing.gwangmyeongG !== undefined ? existing.gwangmyeongG : 0,
      taxService: existing.taxService !== undefined ? existing.taxService : 0,
      taxCorp: existing.taxCorp !== undefined ? existing.taxCorp : 0,
      samsungOA: existing.samsungOA !== undefined ? existing.samsungOA : 0,
      chungho: existing.chungho !== undefined ? existing.chungho : 0,
      sungjin: existing.sungjin !== undefined ? existing.sungjin : 0,
      ecount: existing.ecount !== undefined ? existing.ecount : 0,
      kt: existing.kt !== undefined ? existing.kt : 0,
      skt: existing.skt !== undefined ? existing.skt : 0
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

  // --- PARTNER EXPENSES HANDLERS ---
  const handlePartnerSubmit = (e) => {
    e.preventDefault();
    if (!partnerForm.month) {
      alert('년월을 선택해 주세요.');
      return;
    }

    const samsungOA = Number(partnerForm.samsungOA);
    const sungjin = Number(partnerForm.sungjin);
    const gwangmyeongG = Number(partnerForm.gwangmyeongG);
    const taxService = Number(partnerForm.taxService);
    const taxCorp = Number(partnerForm.taxCorp);
    const ecount = Number(partnerForm.ecount);
    const bsTech = Number(partnerForm.bsTech);
    const chungho = Number(partnerForm.chungho);
    const kt = Number(partnerForm.kt);
    const skt = Number(partnerForm.skt);

    // find existing or default values for car & loans
    const existing = officeExpenses.find(o => o.month === partnerForm.month) || {};

    const record = {
      month: partnerForm.month,
      tax: taxService + taxCorp,
      corporatePhone: kt + skt,
      officeRent: bsTech,
      maintenance: gwangmyeongG,
      equipmentRental: samsungOA + chungho,
      erpServiceFee: sungjin + ecount,
      
      officeTax: existing.officeTax !== undefined ? existing.officeTax : 0,
      officePhone: existing.officePhone !== undefined ? existing.officePhone : 0,
      avanteRental: existing.avanteRental !== undefined ? existing.avanteRental : 0,
      rayInstallment: existing.rayInstallment !== undefined ? existing.rayInstallment : 0,
      smallBizLoanInterest: existing.smallBizLoanInterest !== undefined ? existing.smallBizLoanInterest : 0,
      ibkLoanInterest: existing.ibkLoanInterest !== undefined ? existing.ibkLoanInterest : 0,
      kiboLoanInterest: existing.kiboLoanInterest !== undefined ? existing.kiboLoanInterest : 0,
      creditLoanInterest: existing.creditLoanInterest !== undefined ? existing.creditLoanInterest : 0,

      // Partner fields
      samsungOA,
      sungjin,
      gwangmyeongG,
      taxService,
      taxCorp,
      ecount,
      bsTech,
      chungho,
      kt,
      skt
    };

    const exists = officeExpenses.some(o => o.month === partnerForm.month);

    if (editingPartner) {
      setOfficeExpenses(prev => prev.map(o => o.month === editingPartner.month ? record : o));
      logActivity('지출', `고정지출: 거래처별 고정비용 수정 (${partnerForm.month})`);
    } else {
      if (exists) {
        if (confirm(`${partnerForm.month} 데이터가 이미 존재합니다. 덮어쓰시겠습니까?`)) {
          setOfficeExpenses(prev => prev.map(o => o.month === partnerForm.month ? record : o));
          logActivity('지출', `고정지출: 거래처별 고정비용 덮어쓰기 (${partnerForm.month})`);
        } else {
          return;
        }
      } else {
        setOfficeExpenses(prev => [...prev, record].sort((a, b) => b.month.localeCompare(a.month)));
        logActivity('지출', `고정지출: 신규 거래처별 고정비용 등록 (${partnerForm.month})`);
      }
    }

    setShowPartnerModal(false);
    setEditingPartner(null);
  };

  const handleDeletePartner = (month) => {
    if (confirm(`정말로 ${month} 거래처별 고정 지출 기록을 삭제하시겠습니까?`)) {
      setOfficeExpenses(prev => prev.filter(o => o.month !== month));
      logActivity('지출', `고정지출: 거래처별 고정비용 삭제 (${month})`);
    }
  };

  const handleDeleteOffice = (month) => {
    if (confirm(`정말로 ${month} 사무실 고정 지출 기록을 삭제하시겠습니까?`)) {
      setOfficeExpenses(prev => prev.filter(o => o.month !== month));
      logActivity('지출', `고정지출: 사무실 고정비용 삭제 (${month})`);
    }
  };

  // --- CARD PURCHASE SUBMIT ---
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

    setCardPurchaseTransactions(prev => [newTx, ...prev]);

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

  // --- CALCULATION HELPERS ---
  const totalEmployeesSalary = employees.reduce((acc, curr) => acc + curr.baseSalary, 0);
  const totalEmployeesInsurances = employees.reduce((acc, curr) => acc + (curr.insurancesTotal || (curr.pension + curr.health + curr.employment) || 0), 0);
  const totalEmployeesCard = employees.reduce((acc, curr) => acc + (curr.cardUsage || 0), 0);
  const totalEmployeesNetPay = employees.reduce((acc, curr) => acc + curr.netPay, 0);

  const latestOfficeRecord = officeExpenses[0] || {
    tax: 0, corporatePhone: 0, officeRent: 0, maintenance: 0, equipmentRental: 0, erpServiceFee: 0,
    officeTax: 0, officePhone: 0,
    avanteRental: 0, rayInstallment: 0, smallBizLoanInterest: 0, ibkLoanInterest: 0, kiboLoanInterest: 0, creditLoanInterest: 0
  };

  const officeMonthlySum = 
    (latestOfficeRecord.officeRent || 0) +
    (latestOfficeRecord.maintenance || 0) +
    (latestOfficeRecord.equipmentRental || 0) +
    (latestOfficeRecord.erpServiceFee || 0) +
    (latestOfficeRecord.officeTax || 0) +
    (latestOfficeRecord.officePhone || 0) +
    (latestOfficeRecord.avanteRental || 0) + 
    (latestOfficeRecord.rayInstallment || 0) + 
    (latestOfficeRecord.smallBizLoanInterest || 0) + 
    (latestOfficeRecord.ibkLoanInterest || 0) + 
    (latestOfficeRecord.kiboLoanInterest || 0) + 
    (latestOfficeRecord.creditLoanInterest || 0);

  const officeLoansSum = 
    (latestOfficeRecord.smallBizLoanInterest || 0) + 
    (latestOfficeRecord.ibkLoanInterest || 0) + 
    (latestOfficeRecord.kiboLoanInterest || 0) + 
    (latestOfficeRecord.creditLoanInterest || 0);

  return (
    <div className="content-area">
      
      {/* KPI summaries */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '24px' }}>
        
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-blue, #1a56db)' }}>
          <div className="kpi-header">
            <span className="kpi-title">이번달 총 고정 지출 (인건비+사무실)</span>
            <span className="kpi-icon">💸</span>
          </div>
          <div className="kpi-value">{(totalEmployeesSalary + officeMonthlySum).toLocaleString()}</div>
          <div className="kpi-subtext">직원 급여 총합 + 직전 등록 월 사무실 고정비</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">직원 총 인건비 지출</span>
            <span className="kpi-icon">👥</span>
          </div>
          <div className="kpi-value">{totalEmployeesSalary.toLocaleString()}</div>
          <div className="kpi-subtext">직원 {employees.length}명 기본급 총합</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">사무실 월 고정 지출 ({latestOfficeRecord.month || '내역 없음'})</span>
            <span className="kpi-icon">🏢</span>
          </div>
          <div className="kpi-value">{officeMonthlySum.toLocaleString()}</div>
          <div className="kpi-subtext">세금, 통신비, 렌탈, 대출이자 등 총계</div>
        </div>

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
            <button 
              className={`btn ${fixedTab === 'partner' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFixedTab('partner')}
            >
              📄 거래처별 월별 고정 지출
            </button>
          </div>
        </div>

        {/* --- TAB 1: 직원별 고정 지출 --- */}
        {fixedTab === 'employee' && (() => {
          const sortedEmployees = [...employees].sort((a, b) => b.month - a.month || a.name.localeCompare(b.name));
          return (
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
                        month: 5,
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
                      <th style={{ textAlign: 'center' }}>월별</th>
                      <th>성명</th>
                      <th>직급</th>
                      <th style={{ textAlign: 'right' }}>급여</th>
                      <th style={{ textAlign: 'right' }}>4대보험료</th>
                      <th style={{ textAlign: 'right' }}>법인카드 사용금액</th>
                      <th style={{ textAlign: 'right' }}>월합계</th>
                      <th style={{ textAlign: 'center' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          등록된 직원 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sortedEmployees.map(emp => {
                        const rowTotal = emp.baseSalary + (emp.insurancesTotal || 0) + (emp.cardUsage || 0);
                        return (
                          <tr key={emp.id}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>{emp.month}월</td>
                            <td style={{ fontWeight: '500' }}>{emp.name}</td>
                            <td>{emp.position}</td>
                            <td style={{ textAlign: 'right', fontWeight: '500' }}>{emp.baseSalary.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {(emp.insurancesTotal || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '500', color: '#be123c' }}>{(emp.cardUsage || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>{rowTotal.toLocaleString()}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="btn-group" style={{ justifyContent: 'center', gap: '6px' }}>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '3px 8px', fontSize: '11px' }}
                                  onClick={() => {
                                    setEditingEmployee(emp);
                                    setEmployeeForm({
                                      month: emp.month || 5,
                                      name: emp.name,
                                      position: emp.position,
                                      baseSalary: emp.baseSalary,
                                      isAutoInsurance: emp.isAutoInsurance !== undefined ? emp.isAutoInsurance : true,
                                      insurancesTotal: emp.insurancesTotal || 0,
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
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                      <td colSpan="3" style={{ textAlign: 'center' }}>합계</td>
                      <td style={{ textAlign: 'right' }}>{totalEmployeesSalary.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{totalEmployeesInsurances.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#be123c' }}>{totalEmployeesCard.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary-blue)' }}>
                        {(totalEmployeesSalary + totalEmployeesInsurances + totalEmployeesCard).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()}

        {/* --- TAB 2: 월별 고정 사무실 지출 --- */}
        {fixedTab === 'office' && (
          <div>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 className="panel-title" style={{ fontSize: '15px' }}>사무실 월별 고정비용 기록대장</h3>
              <div className="btn-group">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingOffice(null);
                    setOfficeForm({
                      month: new Date().toISOString().substring(0, 7),
                      officeTax: 0,
                      officePhone: 0,
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
                  + 고정 지출 등록
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>년월</th>
                    <th style={{ textAlign: 'right' }}>세금</th>
                    <th style={{ textAlign: 'right' }}>법인핸드폰</th>
                    <th style={{ textAlign: 'right' }}>아반테 렌탈</th>
                    <th style={{ textAlign: 'right' }}>레이 할부</th>
                    <th style={{ textAlign: 'right' }}>소상공인 이자</th>
                    <th style={{ textAlign: 'right' }}>기업은행 이자</th>
                    <th style={{ textAlign: 'right' }}>기술보증 이자</th>
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
                      const rowSum = (o.officeTax || 0) + (o.officePhone || 0) + 
                        (o.avanteRental || 0) + (o.rayInstallment || 0) + 
                        (o.smallBizLoanInterest || 0) + (o.ibkLoanInterest || 0) + 
                        (o.kiboLoanInterest || 0) + (o.creditLoanInterest || 0);
                      return (
                        <tr key={o.month}>
                          <td style={{ fontWeight: '700' }}>{o.month}</td>
                          <td style={{ textAlign: 'right' }}>{(o.officeTax || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.officePhone || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.avanteRental || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.rayInstallment || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{(o.smallBizLoanInterest || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{(o.ibkLoanInterest || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{(o.kiboLoanInterest || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{(o.creditLoanInterest || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>{rowSum.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="btn-group" style={{ justifyContent: 'center', gap: '4px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 5px', fontSize: '10px' }}
                                onClick={() => {
                                  setEditingOffice(o);
                                  setOfficeForm({
                                    month: o.month,
                                    officeTax: o.officeTax || 0,
                                    officePhone: o.officePhone || 0,
                                    avanteRental: o.avanteRental || 0,
                                    rayInstallment: o.rayInstallment || 0,
                                    smallBizLoanInterest: o.smallBizLoanInterest || 0,
                                    ibkLoanInterest: o.ibkLoanInterest || 0,
                                    kiboLoanInterest: o.kiboLoanInterest || 0,
                                    creditLoanInterest: o.creditLoanInterest || 0
                                  });
                                  setShowOfficeModal(true);
                                }}
                              >
                                수정
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '2px 5px', fontSize: '10px' }}
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

        {/* --- TAB 3: 거래처별 월별 고정 지출 --- */}
        {fixedTab === 'partner' && (
          <div>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 className="panel-title" style={{ fontSize: '15px' }}>월별 주요 거래처/협력사 고정비용 기록대장</h3>
              <div className="btn-group">
                <button 
                  className="btn btn-secondary"
                  onClick={() => document.getElementById('partnerCsvFile').click()}
                >
                  📄 국세청 비용 CSV 가져오기
                </button>
                <input 
                  type="file" 
                  id="partnerCsvFile" 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={handleCsvImport}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingPartner(null);
                    setPartnerForm({
                      month: new Date().toISOString().substring(0, 7),
                      samsungOA: 0,
                      sungjin: 0,
                      gwangmyeongG: 0,
                      taxService: 0,
                      taxCorp: 0,
                      ecount: 0,
                      bsTech: 0,
                      chungho: 0,
                      kt: 0,
                      skt: 0
                    });
                    setShowPartnerModal(true);
                  }}
                >
                  + 거래처별 고정비 등록
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="erp-table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>년월</th>
                    <th style={{ textAlign: 'right' }}>삼성오에이프라자</th>
                    <th style={{ textAlign: 'right' }}>성진정보텍</th>
                    <th style={{ textAlign: 'right' }}>광명G타워</th>
                    <th style={{ textAlign: 'right' }}>기업세무회계경영</th>
                    <th style={{ textAlign: 'right' }}>기업세무회계</th>
                    <th style={{ textAlign: 'right' }}>이카운트</th>
                    <th style={{ textAlign: 'right' }}>비에스테크광명(임대료)</th>
                    <th style={{ textAlign: 'right' }}>청호나이스</th>
                    <th style={{ textAlign: 'right' }}>케이티</th>
                    <th style={{ textAlign: 'right' }}>에스케이텔레콤</th>
                    <th style={{ textAlign: 'right', fontWeight: 'bold' }}>월 합계</th>
                    <th style={{ textAlign: 'center' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {officeExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="13" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        등록된 거래처별 고정 지출 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    officeExpenses.map(o => {
                      const rowSum = 
                        (o.samsungOA || 0) + (o.sungjin || 0) + (o.gwangmyeongG || 0) + 
                        (o.taxService || 0) + (o.taxCorp || 0) + (o.ecount || 0) + (o.bsTech || 0) + 
                        (o.chungho || 0) + (o.kt || 0) + (o.skt || 0);
                      return (
                        <tr key={o.month}>
                          <td style={{ fontWeight: '700' }}>{o.month}</td>
                          <td style={{ textAlign: 'right' }}>{(o.samsungOA || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.sungjin || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.gwangmyeongG || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.taxService || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.taxCorp || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.ecount || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.bsTech || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.chungho || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.kt || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{(o.skt || 0).toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-blue)' }}>{rowSum.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="btn-group" style={{ justifyContent: 'center', gap: '4px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 5px', fontSize: '10px' }}
                                onClick={() => {
                                  setEditingPartner(o);
                                  setPartnerForm({
                                    month: o.month,
                                    samsungOA: o.samsungOA || 0,
                                    sungjin: o.sungjin || 0,
                                    gwangmyeongG: o.gwangmyeongG || 0,
                                    taxService: o.taxService || 0,
                                    taxCorp: o.taxCorp || 0,
                                    ecount: o.ecount || 0,
                                    bsTech: o.bsTech || 0,
                                    chungho: o.chungho || 0,
                                    kt: o.kt || 0,
                                    skt: o.skt || 0
                                  });
                                  setShowPartnerModal(true);
                                }}
                              >
                                수정
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '2px 5px', fontSize: '10px' }}
                                onClick={() => handleDeletePartner(o.month)}
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
                  <label className="form-label">지출 월 *</label>
                  <select 
                    className="form-control" 
                    required 
                    value={employeeForm.month}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, month: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">성명 *</label>
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
                  <label className="form-label">직급 *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="예: 대표이사, 팀원 (디자인)"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">급여 *</label>
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
                  
                  <label className="form-label">4대보험료 *</label>
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
                  <label className="form-label">법인카드 사용금액</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0"
                    value={employeeForm.cardUsage}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, cardUsage: Number(e.target.value) }))}
                    placeholder="법인카드 사용액 입력"
                  />
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
              <h2 className="panel-title">{editingOffice ? '사무실 고정 지출 수정' : '사무실 고정 지출 등록'}</h2>
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
                    <label className="form-label">아반테 렌탈비용</label>
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
                    <label className="form-label">세금</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.officeTax}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, officeTax: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">법인핸드폰</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.officePhone}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, officePhone: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">레이 법인차 할부금액</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={officeForm.rayInstallment}
                      onChange={(e) => setOfficeForm(prev => ({ ...prev, rayInstallment: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">소상공인 대출이자</label>
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
                    <label className="form-label">기업은행 대출이자</label>
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
                    <label className="form-label">기술보증기금 이자</label>
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
                  <label className="form-label">신용대출 이자</label>
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
                      (officeForm.officeTax || 0) + (officeForm.officePhone || 0) + 
                      (officeForm.avanteRental || 0) + (officeForm.rayInstallment || 0) + 
                      (officeForm.smallBizLoanInterest || 0) + (officeForm.ibkLoanInterest || 0) + 
                      (officeForm.kiboLoanInterest || 0) + (officeForm.creditLoanInterest || 0)
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
                    {Array.from(new Set(employees.map(emp => emp.name))).map(name => {
                      const emp = employees.find(e => e.name === name);
                      return (
                        <option key={emp.id} value={name}>
                          {name} ({emp.position})
                        </option>
                      );
                    })}
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

      {/* --- MODAL: 거래처별 고정 지출 등록 / 수정 모달 --- */}
      {showPartnerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="panel-title">{editingPartner ? '거래처별 고정 지출 수정' : '거래처별 고정 지출 등록'}</h2>
              <button className="modal-close" onClick={() => setShowPartnerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePartnerSubmit}>
              <div className="modal-body">
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">지출 년월 *</label>
                    <input 
                      type="month" 
                      className="form-control" 
                      required 
                      disabled={!!editingPartner}
                      value={partnerForm.month}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, month: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">비에스테크광명(임대료)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.bsTech}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, bsTech: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">삼성오에이프라자</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.samsungOA}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, samsungOA: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">성진정보텍</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.sungjin}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, sungjin: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">광명G타워</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.gwangmyeongG}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, gwangmyeongG: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">기업세무회계경영</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.taxService}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, taxService: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">기업세무회계</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.taxCorp}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, taxCorp: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">이카운트</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.ecount}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, ecount: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">청호나이스</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.chungho}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, chungho: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">케이티</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.kt}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, kt: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">에스케이텔레콤</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={partnerForm.skt}
                      onChange={(e) => setPartnerForm(prev => ({ ...prev, skt: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group"></div>
                </div>

                <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 'bold' }}>거래처별 합계: </span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                    {(
                      (partnerForm.samsungOA || 0) + (partnerForm.sungjin || 0) + (partnerForm.gwangmyeongG || 0) + 
                      (partnerForm.taxService || 0) + (partnerForm.taxCorp || 0) + (partnerForm.ecount || 0) + (partnerForm.bsTech || 0) + 
                      (partnerForm.chungho || 0) + (partnerForm.kt || 0) + (partnerForm.skt || 0)
                    ).toLocaleString()}
                  </span>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPartnerModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">{editingPartner ? '수정 저장' : '등록 저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
