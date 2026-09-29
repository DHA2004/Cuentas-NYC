import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOAL = 10_000_000;
const STORAGE = "viaje-david-paula-v3";
const REF_TRM = 3306.86;

const seed = [
  {id:"s01",date:"2026-03-11",type:"income",person:"david",title:"Aporte Bancolombia",cop:200000,usd:54.00,trm:3703.70,goal:true,locked:true},
  {id:"s02",date:"2026-06-26",type:"income",person:"david",title:"Parte de David dentro de los $4,4 M",cop:400000,usd:115.9718181818,trm:3449.11,goal:true,locked:true,note:"De los $4,4 M enviados desde Paula, $400.000 eran de David."},
  {id:"s03",date:"2026-06-26",type:"income",person:"paula",title:"Parte de Paula dentro de los $4,4 M",cop:4000000,usd:1159.7181818182,trm:3449.11,goal:true,locked:true,note:"De los $4,4 M enviados, $4 M eran de Paula."},
  {id:"s04",date:"2026-06-26",type:"income",person:"paula",title:"Ajuste de transferencia",cop:1000,usd:0.28,trm:3571.43,goal:true,locked:true},
  {id:"s05",date:"2026-08-03",type:"income",person:"david",title:"Aporte David",cop:4000000,usd:1235.01,trm:3238.84,goal:true,locked:true},
  {id:"s06",date:"2026-08-03",type:"income",person:"paula",title:"Aporte Paula",cop:2000000,usd:617.62,trm:3238.24,goal:true,locked:true},
  {id:"s07",date:"2026-08-04",type:"income",person:"david",title:"Aporte David",cop:3000000,usd:936.68,trm:3202.80,goal:true,locked:true},
  {id:"s08",date:"2026-08-07",type:"income",person:"david",title:"Aporte David",cop:2175000,usd:689.63,trm:3153.87,goal:true,locked:true},
  {id:"s09",date:"2026-08-19",type:"income",person:"paula",title:"Aporte Paula",cop:1000000,usd:327.92,trm:3049.52,goal:true,locked:true},
  {id:"s10",date:"2026-08-19",type:"income",person:"paula",title:"Ajuste de transferencia",cop:1000,usd:0.32,trm:3125.00,goal:true,locked:true},
  {id:"s11",date:"2026-08-24",type:"expense",title:"Reserva Booking.com",usd:1142.19,split:{david:50,paula:50},locked:true,note:"Costo dividido 50/50."},
  {id:"s12",date:"2026-09-05",type:"income",person:"paula",title:"Aporte Paula transferido desde David",cop:600000,usd:191.66,trm:3130.54,goal:true,locked:true,note:"Aunque salió de la cuenta de David, el dinero era de Paula."},
  {id:"s13",date:"2026-09-11",type:"income",person:"david",title:"Aporte David",cop:515000,usd:166.63,trm:3090.68,goal:true,locked:true},
  {id:"s14",date:"2026-09-26",type:"income",person:"david",title:"Rendimiento ARQ",cop:0,usd:1.8524914763,trm:null,goal:false,locked:true},
  {id:"s15",date:"2026-09-26",type:"income",person:"paula",title:"Rendimiento ARQ",cop:0,usd:1.2175085237,trm:null,goal:false,locked:true},
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { referenceTrm: REF_TRM, transactions: seed };
}
const cop = (n) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n || 0);
const usd = (n) => `${new Intl.NumberFormat("es-CO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n || 0)} USDC`;
const dateFmt = (d) => new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${d}T12:00:00Z`));

function calc(state) {
  const out = {
    david:{goalCop:0,incomeUsd:0,expenseUsd:0,balanceUsd:0},
    paula:{goalCop:0,incomeUsd:0,expenseUsd:0,balanceUsd:0}
  };
  [...state.transactions].sort((a,b)=>a.date.localeCompare(b.date)).forEach(t => {
    if (t.type === "income") {
      out[t.person].incomeUsd += Number(t.usd)||0;
      out[t.person].balanceUsd += Number(t.usd)||0;
      if (t.goal) out[t.person].goalCop += Number(t.cop)||0;
    }
    if (t.type === "expense") {
      const split = t.split || {david:0,paula:0};
      for (const p of ["david","paula"]) {
        const part = (Number(t.usd)||0) * (Number(split[p])||0)/100;
        out[p].expenseUsd += part;
        out[p].balanceUsd -= part;
      }
    }
    if (t.type === "transfer") {
      out[t.from].balanceUsd -= Number(t.usd)||0;
      out[t.to].balanceUsd += Number(t.usd)||0;
    }
  });
  return out;
}

function App() {
  const [state,setState] = useState(load);
  const [tab,setTab] = useState("global");
  const [modal,setModal] = useState(null);
  const [form,setForm] = useState({});
  const sums = useMemo(()=>calc(state),[state]);
  const total = sums.david.balanceUsd + sums.paula.balanceUsd;
  const totalIncome = sums.david.incomeUsd + sums.paula.incomeUsd;
  const totalExpense = sums.david.expenseUsd + sums.paula.expenseUsd;
  const save = (next) => { setState(next); localStorage.setItem(STORAGE, JSON.stringify(next)); };

  const open = (type, person = tab === "global" ? "david" : tab) => {
    setModal(type);
    setForm({
      date:new Date().toISOString().slice(0,10),
      person,
      payer:person,
      trm:state.referenceTrm,
      goal:true,
      split:"person"
    });
  };

  const add = (e) => {
    e.preventDefault();
    const id = `u${Date.now()}`;
    if (modal === "income") {
      const trm = Number(form.trm)||0;
      const copValue = Number(form.cop)||0;
      const usdValue = Number(form.usd)|| (trm && copValue ? copValue/trm : 0);
      if (!form.title || !usdValue) return alert("Completa concepto y valor.");
      save({...state,transactions:[...state.transactions,{
        id,date:form.date,type:"income",person:form.person,title:form.title,
        cop:copValue,usd:usdValue,trm:trm||null,goal:!!form.goal,note:form.note||""
      }]});
    }
    if (modal === "expense") {
      const usdValue=Number(form.usd)||0;
      if (!form.title || !usdValue) return alert("Completa concepto y costo.");
      let split = {david:0,paula:0};
      if(form.split==="half") split={david:50,paula:50};
      else if(form.payer==="david") split={david:100,paula:0};
      else split={david:0,paula:100};
      save({...state,transactions:[...state.transactions,{
        id,date:form.date,type:"expense",title:form.title,usd:usdValue,
        cop:Number(form.cop)||0,trm:Number(form.trm)||null,split,note:form.note||""
      }]});
    }
    setModal(null);
  };

  const remove = id => {
    if(!confirm("¿Eliminar este movimiento?")) return;
    save({...state,transactions:state.transactions.filter(t=>t.id!==id)});
  };

  const PersonGoal = ({person,name}) => {
    const x=sums[person], done=x.goalCop>=GOAL, extra=Math.max(0,x.goalCop-GOAL), missing=Math.max(0,GOAL-x.goalCop);
    return <section className="goalCard">
      <div className="row between">
        <div><h2>{name}</h2><span className="muted">{usd(x.balanceUsd)} disponibles</span></div>
        <span className={`badge ${done?"done":""}`}>{done?"Meta cumplida":"En progreso"}</span>
      </div>
      <div className="miniGrid">
        <div><small>Aportado histórico</small><strong>{cop(x.goalCop)}</strong></div>
        <div><small>Meta</small><strong>{cop(GOAL)}</strong></div>
      </div>
      <div className="progress"><i style={{width:`${Math.min(100,x.goalCop/GOAL*100)}%`}} /></div>
      <p className="goalStatus">{done ? `${cop(extra)} por encima de la meta` : `Faltan ${cop(missing)}`}</p>
    </section>
  };

  const relevant = state.transactions.filter(t => {
    if(tab==="global") return true;
    if(t.type==="income") return t.person===tab;
    if(t.type==="expense") return Number((t.split||{})[tab])>0;
    if(t.type==="transfer") return t.from===tab || t.to===tab;
    return false;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const tabBalance = tab==="global" ? total : sums[tab].balanceUsd;

  return <div className="app">
    <header>
      <div><h1>Fondo del viaje</h1><p>David + Paula</p></div>
      <button className="add" onClick={()=>open("income")}>＋</button>
    </header>

    <nav>
      {["global","david","paula"].map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
        {t==="global"?"Global":t[0].toUpperCase()+t.slice(1)}
      </button>)}
    </nav>

    <section className="hero">
      <small>{tab==="global"?"SALDO GLOBAL":`SALDO DE ${tab.toUpperCase()}`}</small>
      <h3>{usd(tabBalance).replace(" USDC","")}</h3>
      <p>{cop(tabBalance*state.referenceTrm)} aprox. · TRM {Number(state.referenceTrm).toLocaleString("es-CO",{maximumFractionDigits:2})}</p>
    </section>

    {tab==="global" ? <>
      <div className="stats">
        <div><span>Ingresos</span><strong>{usd(totalIncome)}</strong></div>
        <div><span>Costos</span><strong>{usd(totalExpense)}</strong></div>
      </div>
      <PersonGoal person="david" name="David" />
      <PersonGoal person="paula" name="Paula" />
    </> : <>
      <PersonGoal person={tab} name={tab==="david"?"David":"Paula"} />
      <div className="stats">
        <div><span>USDC ingresados</span><strong>{usd(sums[tab].incomeUsd)}</strong></div>
        <div><span>Costos asignados</span><strong>{usd(sums[tab].expenseUsd)}</strong></div>
      </div>
    </>}

    <div className="actionRow">
      <button onClick={()=>open("income")}>＋ Ingreso</button>
      <button className="expense" onClick={()=>open("expense")}>− Costo</button>
    </div>

    <section className="history">
      <div className="sectionTitle"><h2>Movimientos</h2><span>{relevant.length}</span></div>
      {relevant.map(t=>{
        let sign="", amount=Number(t.usd)||0, kind=t.type;
        if(tab==="global"){
          sign=t.type==="income"?"+":t.type==="expense"?"−":"";
        } else if(t.type==="income"){
          sign="+";
        } else if(t.type==="expense"){
          amount*=Number((t.split||{})[tab]||0)/100; sign="−";
        } else if(t.type==="transfer"){
          sign=t.to===tab?"+":"−";
        }
        return <article className="movement" key={t.id}>
          <div className={`dot ${kind}`}>{kind==="income"?"↓":kind==="expense"?"↑":"↔"}</div>
          <div className="moveBody">
            <strong>{t.title}</strong>
            <span>{dateFmt(t.date)}{t.type==="income" && t.goal ? ` · ${cop(t.cop)} aportados` : ""}</span>
            {t.note && <em>{t.note}</em>}
          </div>
          <div className={`moveAmount ${sign==="−"?"negative":""}`}>{sign}{usd(amount)}
            {!t.locked && <button className="delete" onClick={()=>remove(t.id)}>Eliminar</button>}
          </div>
        </article>
      })}
    </section>

    <section className="settings">
      <label>TRM de referencia</label>
      <input type="number" value={state.referenceTrm} onChange={e=>save({...state,referenceTrm:Number(e.target.value)||state.referenceTrm})}/>
      <button onClick={()=>{
        const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
        const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="respaldo-viaje.json";a.click();
      }}>Exportar respaldo</button>
    </section>

    {modal && <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setModal(null)}>
      <form className="sheet" onSubmit={add}>
        <div className="sheetHead"><h2>{modal==="income"?"Nuevo ingreso":"Nuevo costo"}</h2><button type="button" onClick={()=>setModal(null)}>×</button></div>
        <label>Fecha<input type="date" value={form.date||""} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        {modal==="income" ? <>
          <label>¿De quién es?
            <select value={form.person||"david"} onChange={e=>setForm({...form,person:e.target.value})}>
              <option value="david">David</option><option value="paula">Paula</option>
            </select>
          </label>
          <label>Pesos aportados (COP)<input inputMode="numeric" type="number" value={form.cop||""} onChange={e=>setForm({...form,cop:e.target.value})} placeholder="1000000"/></label>
          <label>TRM de ese día<input inputMode="decimal" type="number" step="0.01" value={form.trm||""} onChange={e=>setForm({...form,trm:e.target.value})}/></label>
          <label>USDC que entraron<input inputMode="decimal" type="number" step="0.01" value={form.usd||""} onChange={e=>setForm({...form,usd:e.target.value})} placeholder="Se calcula si lo dejas vacío"/></label>
          <label className="check"><input type="checkbox" checked={!!form.goal} onChange={e=>setForm({...form,goal:e.target.checked})}/> Cuenta para la meta de $10 M</label>
        </> : <>
          <label>¿A quién corresponde?
            <select value={form.split==="half"?"half":form.payer||"david"} onChange={e=>{
              const v=e.target.value; setForm({...form,split:v==="half"?"half":"person",payer:v==="half"?(form.payer||"david"):v});
            }}>
              <option value="david">David</option><option value="paula">Paula</option><option value="half">50 / 50</option>
            </select>
          </label>
          <label>Costo en USDC<input inputMode="decimal" type="number" step="0.01" value={form.usd||""} onChange={e=>setForm({...form,usd:e.target.value})}/></label>
          <label>Equivalente COP (opcional)<input inputMode="numeric" type="number" value={form.cop||""} onChange={e=>setForm({...form,cop:e.target.value})}/></label>
          <label>TRM (opcional)<input inputMode="decimal" type="number" step="0.01" value={form.trm||""} onChange={e=>setForm({...form,trm:e.target.value})}/></label>
        </>}
        <label>Concepto<input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} placeholder={modal==="income"?"Aporte septiembre":"Comida / hotel / entradas"}/></label>
        <label>Nota (opcional)<textarea value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})}/></label>
        <button className="primary">Guardar movimiento</button>
      </form>
    </div>}
  </div>
}

createRoot(document.getElementById("root")).render(<App />);
