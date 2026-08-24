import { ArrowLeft, BookOpen, CheckCircle2, Plus, Save, Search, Send, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useConfirm } from '../components/ConfirmDialog';

type Macro = { kcal:number; protein:number; carbohydrate:number; fat:number };
type Food = { id:string; name:string; category:string; referenceUnit:string; kcal:number; protein:number; carbohydrate:number; fat:number };
type Recipe = { id:string; title:string; category:string; ingredients:{ name:string; amount:string; kcal:number; protein:number; carbohydrate:number; fat:number }[] };
type PlanItem = { id:string; foodId?:string; name:string; amount:number; unit:string; amountText?:string; per100?:Macro; macros:Macro };
type Substitution = { option:string; equivalence:string };
type Meal = { id:string; title:string; time:string; notes:string; substitutions:Substitution[]; items:PlanItem[] };
type Targets = { mode:'EXACT'|'RANGE'; kcalMin:string; kcalMax:string; proteinMin:string; proteinMax:string };
type Plan = { id:string; patientName:string; title:string; objective?:string; status:'DRAFT'|'PUBLISHED'|'ARCHIVED'; content:Record<string,unknown>; sourcePlan?:{id:string;title:string;content:Record<string,unknown>}|null };

const num = (value:unknown) => Number(value) || 0;
const uid = () => crypto.randomUUID();
const emptyMacro = ():Macro => ({ kcal:0, protein:0, carbohydrate:0, fat:0 });

function macroFrom(value:unknown, fallback:Record<string,unknown>):Macro {
  const source = value && typeof value === 'object' ? value as Record<string,unknown> : {};
  return {
    kcal:num(source.kcal ?? fallback.kcal),
    protein:num(source.protein ?? fallback.protein ?? fallback.prot),
    carbohydrate:num(source.carbohydrate ?? fallback.carbohydrate ?? fallback.carb),
    fat:num(source.fat ?? fallback.fat ?? fallback.gord),
  };
}

function normalizeContent(content:Record<string,unknown>):Meal[] {
  const raw = (Array.isArray(content.meals) ? content.meals : Array.isArray(content.refeicoes) ? content.refeicoes : []) as Record<string,unknown>[];
  return raw.map(meal => ({
    id:String(meal.id || uid()),
    title:String(meal.title || meal.titulo || 'Refeição'),
    time:String(meal.time || meal.horario || ''),
    notes:String(meal.notes || meal.obs || ''),
    substitutions:Array.isArray(meal.substitutions) ? meal.substitutions.map(item => typeof item==='string'?{option:item,equivalence:''}:{option:String((item as Record<string,unknown>).option||''),equivalence:String((item as Record<string,unknown>).equivalence||'')}).filter(item=>item.option||item.equivalence) : [],
    items:((Array.isArray(meal.items) ? meal.items : Array.isArray(meal.alimentosList) ? meal.alimentosList : []) as Record<string,unknown>[]).map(item => {
      const per100 = item.per100 && typeof item.per100 === 'object' ? macroFrom(item.per100, {}) : undefined;
      return {
        id:String(item.id || uid()),
        foodId:item.foodId ? String(item.foodId) : undefined,
        name:String(item.name || item.nome || 'Alimento'),
        amount:num(item.amount ?? item.qtd) || 100,
        unit:String(item.unit || item.unidade || 'g'),
        amountText:typeof item.amountText === 'string' ? item.amountText : typeof item.qtd === 'string' ? item.qtd : undefined,
        per100,
        macros:macroFrom(item.macros, item),
      };
    }),
  }));
}

const mealTotals = (meal:Meal) => meal.items.reduce<Macro>((total, item) => ({
  kcal:total.kcal + item.macros.kcal,
  protein:total.protein + item.macros.protein,
  carbohydrate:total.carbohydrate + item.macros.carbohydrate,
  fat:total.fat + item.macros.fat,
}), emptyMacro());
const resultTotals=(content:Record<string,unknown>|undefined)=>normalizeContent(content||{}).reduce<Macro>((all,meal)=>{const current=mealTotals(meal);return{kcal:all.kcal+current.kcal,protein:all.protein+current.protein,carbohydrate:all.carbohydrate+current.carbohydrate,fat:all.fat+current.fat}},emptyMacro());
const signed=(value:number)=>`${value>0?'+':''}${value.toFixed(value%1?1:0)}`;

export function MealPlanEditorPage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const [plan,setPlan] = useState<Plan|null>(null);
  const [meals,setMeals] = useState<Meal[]>([]);
  const [title,setTitle] = useState('');
  const [objective,setObjective] = useState('');
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [showPreview,setShowPreview] = useState(false);
  const [targetMeal,setTargetMeal] = useState<string|null>(null);
  const [catalogTab,setCatalogTab] = useState<'foods'|'recipes'>('foods');
  const [query,setQuery] = useState('');
  const [foods,setFoods] = useState<Food[]>([]);
  const [recipes,setRecipes] = useState<Recipe[]>([]);
  const [patientVisibility,setPatientVisibility]=useState<'FULL'|'SUMMARY'|'HIDDEN'>('SUMMARY');
  const [revisionReason,setRevisionReason]=useState('');
  const [targets,setTargets]=useState<Targets>({mode:'RANGE',kcalMin:'',kcalMax:'',proteinMin:'',proteinMax:''});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await api<{data:Plan}>(`/api/nutrition/plans/${id}`);
      setPlan(result.data);
      setTitle(result.data.title);
      setObjective(result.data.objective || '');
      setMeals(normalizeContent(result.data.content || {}));
      setPatientVisibility((result.data.content.patientVisibility as 'FULL'|'SUMMARY'|'HIDDEN')||'SUMMARY');
      setRevisionReason(String(result.data.content.revisionReason||''));
      const savedTargets=(result.data.content.targets&&typeof result.data.content.targets==='object'?result.data.content.targets:{}) as Record<string,unknown>;
      setTargets({mode:savedTargets.mode==='EXACT'?'EXACT':'RANGE',kcalMin:String(savedTargets.kcalMin||''),kcalMax:String(savedTargets.kcalMax||''),proteinMin:String(savedTargets.proteinMin||''),proteinMax:String(savedTargets.proteinMax||'')});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o plano.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!targetMeal) return;
    const timer = setTimeout(() => {
      if (catalogTab === 'foods') api<{data:Food[]}>(`/api/nutrition/foods${query ? `?q=${encodeURIComponent(query)}` : ''}`).then(r => setFoods(r.data));
      else api<{data:Recipe[]}>(`/api/nutrition/recipes${query ? `?q=${encodeURIComponent(query)}` : ''}`).then(r => setRecipes(r.data));
    }, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [targetMeal,catalogTab,query]);

  const totals = useMemo(() => meals.reduce<Macro>((all, meal) => {
    const current = mealTotals(meal);
    return { kcal:all.kcal+current.kcal, protein:all.protein+current.protein, carbohydrate:all.carbohydrate+current.carbohydrate, fat:all.fat+current.fat };
  }, emptyMacro()), [meals]);
  const sourceTotals=useMemo(()=>resultTotals(plan?.sourcePlan?.content),[plan]);

  function updateMeal(mealId:string, patch:Partial<Meal>) { setMeals(current => current.map(meal => meal.id === mealId ? {...meal,...patch} : meal)); setNotice(''); }
  function addFood(food:Food) {
    if (!targetMeal) return;
    const per100 = macroFrom(food, {});
    const item:PlanItem = { id:uid(), foodId:food.id, name:food.name, amount:100, unit:'g', per100, macros:{...per100} };
    setMeals(current => current.map(meal => meal.id === targetMeal ? {...meal,items:[...meal.items,item]} : meal));
    setTargetMeal(null); setQuery('');
  }
  function addRecipe(recipe:Recipe) {
    if (!targetMeal) return;
    const items:PlanItem[] = recipe.ingredients.map(item => ({ id:uid(), name:item.name, amount:0, unit:'', amountText:item.amount, macros:macroFrom(item,{}) }));
    setMeals(current => current.map(meal => meal.id === targetMeal ? {...meal,items:[...meal.items,...items]} : meal));
    setTargetMeal(null); setQuery('');
  }
  function updateAmount(mealId:string, itemId:string, amount:number) {
    setMeals(current => current.map(meal => meal.id !== mealId ? meal : {...meal,items:meal.items.map(item => {
      if (item.id !== itemId) return item;
      const factor = amount / 100;
      return {...item,amount,amountText:undefined,macros:item.per100 ? { kcal:item.per100.kcal*factor, protein:item.per100.protein*factor, carbohydrate:item.per100.carbohydrate*factor, fat:item.per100.fat*factor } : item.macros};
    })}));
  }
  function addSubstitution(mealId:string) { setMeals(current => current.map(meal => meal.id === mealId ? {...meal,substitutions:[...meal.substitutions,{option:'',equivalence:''}]} : meal)); }
  function updateSubstitution(mealId:string,index:number,patch:Partial<Substitution>) { setMeals(current => current.map(meal => meal.id === mealId ? {...meal,substitutions:meal.substitutions.map((item,i) => i === index ? {...item,...patch} : item)} : meal)); }
  function removeSubstitution(mealId:string,index:number) { setMeals(current => current.map(meal => meal.id === mealId ? {...meal,substitutions:meal.substitutions.filter((_,i) => i !== index)} : meal)); }
  async function save(status=plan?.status || 'DRAFT') {
    if (!id) return;
    if (status === 'PUBLISHED' && !(await confirm({title:'Publicar plano alimentar?',message:'Este plano passará a ser o vigente. Se o paciente já tiver outro plano publicado, ele será preservado no histórico.',confirmLabel:'Publicar plano'}))) return;
    setSaving(true); setError('');
    try {
      if(status==='PUBLISHED'&&plan?.sourcePlan&&!revisionReason.trim()){setError('Registre o motivo da alteração antes de publicar uma nova versão.');setSaving(false);return}
      await api(`/api/nutrition/plans/${id}`, { method:'PATCH', body:JSON.stringify({ title,objective,content:{meals,patientVisibility,revisionReason:revisionReason.trim(),targets,sourcePlanId:plan?.sourcePlan?.id||plan?.content.sourcePlanId||null},status }) });
      await load();
      setNotice(status === 'PUBLISHED' ? 'Plano publicado com sucesso.' : 'Rascunho salvo com segurança.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o plano.'); }
    finally { setSaving(false); }
  }

  if (loading) return <section className="panel empty-state"><span className="spinner"/><strong>Preparando editor...</strong></section>;
  if (!plan) return <section className="panel empty-state"><strong>Plano não encontrado</strong><Link className="secondary-button" to="/planos">Voltar</Link></section>;
  return <div className={`plan-editor-page${showPreview ? ' preview-open' : ''}`}>
    <header className="plan-editor-header">
      <Link className="icon-button" to="/planos"><ArrowLeft size={20}/></Link>
      <div><span className="eyebrow">Plano de {plan.patientName}</span><input className="plan-title-input" value={title} onChange={e=>setTitle(e.target.value)}/></div>
      <span className={`plan-status ${plan.status.toLowerCase()}`}>{plan.status === 'DRAFT' ? 'Rascunho' : plan.status === 'PUBLISHED' ? 'Publicado' : 'Arquivado'}</span>
      <button className="secondary-button" onClick={()=>void save()} disabled={saving}><Save size={17}/> Salvar</button>
      <button className="primary-button" onClick={()=>void save('PUBLISHED')} disabled={saving || meals.length === 0}><Send size={17}/> Publicar</button>
    </header>
    {error && <div className="form-error">{error}</div>}{notice && <div className="form-success"><CheckCircle2 size={17}/>{notice}</div>}
    <div className="plan-editor-layout">
      <main>
        <section className="panel plan-objective"><label>Objetivo e apresentação<textarea value={objective} onChange={e=>setObjective(e.target.value)} rows={3}/></label>{plan.sourcePlan&&<label>Motivo clínico da alteração<textarea value={revisionReason} onChange={e=>setRevisionReason(e.target.value)} rows={2} placeholder="Ex.: ajuste de proteína após evolução e mudança na rotina de treino"/></label>}<div className="plan-control-grid"><label>Informação nutricional no portal<select value={patientVisibility} onChange={e=>setPatientVisibility(e.target.value as typeof patientVisibility)}><option value="FULL">Completa: kcal e macronutrientes</option><option value="SUMMARY">Resumida: apenas orientações</option><option value="HIDDEN">Oculta: sem números</option></select></label><label>Tipo de meta<select value={targets.mode} onChange={e=>setTargets({...targets,mode:e.target.value as Targets['mode']})}><option value="RANGE">Faixa terapêutica</option><option value="EXACT">Meta de referência</option></select></label><label>Energia mínima<input type="number" min="0" value={targets.kcalMin} onChange={e=>setTargets({...targets,kcalMin:e.target.value})} placeholder="kcal"/></label><label>Energia máxima<input type="number" min="0" value={targets.kcalMax} onChange={e=>setTargets({...targets,kcalMax:e.target.value})} placeholder="kcal"/></label><label>Proteína mínima<input type="number" min="0" value={targets.proteinMin} onChange={e=>setTargets({...targets,proteinMin:e.target.value})} placeholder="g"/></label><label>Proteína máxima<input type="number" min="0" value={targets.proteinMax} onChange={e=>setTargets({...targets,proteinMax:e.target.value})} placeholder="g"/></label></div></section>
        {plan.sourcePlan&&<section className="panel plan-comparison"><div><span className="eyebrow">Comparação com o plano vigente</span><h3>{plan.sourcePlan.title}</h3></div><div className="comparison-macros"><span>Energia<strong>{signed(totals.kcal-sourceTotals.kcal)} kcal</strong><small>{sourceTotals.kcal.toFixed(0)} → {totals.kcal.toFixed(0)}</small></span><span>Proteína<strong>{signed(totals.protein-sourceTotals.protein)} g</strong><small>{sourceTotals.protein.toFixed(1)} → {totals.protein.toFixed(1)}</small></span><span>Carboidrato<strong>{signed(totals.carbohydrate-sourceTotals.carbohydrate)} g</strong><small>{sourceTotals.carbohydrate.toFixed(1)} → {totals.carbohydrate.toFixed(1)}</small></span><span>Gordura<strong>{signed(totals.fat-sourceTotals.fat)} g</strong><small>{sourceTotals.fat.toFixed(1)} → {totals.fat.toFixed(1)}</small></span></div></section>}
        {meals.map((meal,index) => { const total=mealTotals(meal); return <section className="panel meal-editor" key={meal.id}>
          <header><span>{index+1}</span><input value={meal.title} onChange={e=>updateMeal(meal.id,{title:e.target.value})}/><input type="time" value={meal.time} onChange={e=>updateMeal(meal.id,{time:e.target.value})}/><button className="icon-button" onClick={()=>setMeals(current=>current.filter(item=>item.id!==meal.id))}><Trash2 size={17}/></button></header>
          <div className="meal-items">{meal.items.map(item => <article key={item.id}>
            <div><strong>{item.name}</strong><small>{item.amountText || `${item.amount} ${item.unit}`}</small></div>
            {item.per100 ? <label><input type="number" min="0" step="1" value={item.amount} onChange={e=>updateAmount(meal.id,item.id,Number(e.target.value))}/><span>g</span></label> : <span className="fixed-amount">{item.amountText}</span>}
            <div className="item-macros"><span>{item.macros.kcal.toFixed(0)} kcal</span><small>P {item.macros.protein.toFixed(1)} · C {item.macros.carbohydrate.toFixed(1)} · G {item.macros.fat.toFixed(1)}</small></div>
            <button className="icon-button" onClick={()=>updateMeal(meal.id,{items:meal.items.filter(current=>current.id!==item.id)})}><X size={16}/></button>
          </article>)}</div>
          <button className="add-food-button" onClick={()=>{setTargetMeal(meal.id);setCatalogTab('foods')}}><Plus size={16}/> Adicionar alimento ou receita</button>
          <div className="meal-substitutions"><header><strong>Substituições equivalentes</strong><button type="button" onClick={()=>addSubstitution(meal.id)}><Plus size={14}/> Adicionar opção</button></header>{meal.substitutions.map((item,i)=><label key={i}><span>{i+1}</span><input value={item.option} onChange={e=>updateSubstitution(meal.id,i,{option:e.target.value})} placeholder="Alternativa: batata inglesa cozida"/><input value={item.equivalence} onChange={e=>updateSubstitution(meal.id,i,{equivalence:e.target.value})} placeholder="Equivalência: 130 g, mantém carboidrato"/><button className="icon-button" onClick={()=>removeSubstitution(meal.id,i)}><X size={15}/></button></label>)}</div>
          <footer><input value={meal.notes} onChange={e=>updateMeal(meal.id,{notes:e.target.value})} placeholder="Observações da refeição"/><div><strong>{total.kcal.toFixed(0)} kcal</strong><span>P {total.protein.toFixed(1)}g · C {total.carbohydrate.toFixed(1)}g · G {total.fat.toFixed(1)}g</span></div></footer>
        </section>})}
        <button className="new-meal-button" onClick={()=>setMeals(current=>[...current,{id:uid(),title:'Nova refeição',time:'',notes:'',substitutions:[],items:[]}])}><Plus size={18}/> Adicionar refeição</button>
      </main>
      <aside className="plan-summary panel"><span className="eyebrow">Resumo diário</span><h2>{totals.kcal.toFixed(0)} kcal</h2><div><span>Proteínas<strong>{totals.protein.toFixed(1)} g</strong></span><span>Carboidratos<strong>{totals.carbohydrate.toFixed(1)} g</strong></span><span>Gorduras<strong>{totals.fat.toFixed(1)} g</strong></span></div><small>{meals.length} refeições · {meals.reduce((sum,meal)=>sum+meal.items.length,0)} alimentos</small><button className="secondary-button" onClick={()=>setShowPreview(value=>!value)}><BookOpen size={16}/>{showPreview?'Fechar PDF':'Ver PDF lado a lado'}</button></aside>
      {showPreview && <aside className="plan-pdf-preview"><iframe src={`/documentos/plano/${id}`} title="Prévia do plano em PDF"/></aside>}
    </div>
    {targetMeal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setTargetMeal(null)}}><section className="modal catalog-picker"><div className="modal-heading"><div><span className="eyebrow">Adicionar ao plano</span><h2>Catálogo nutricional</h2></div><button className="icon-button" onClick={()=>setTargetMeal(null)}><X size={20}/></button></div><div className="picker-tabs"><button className={catalogTab==='foods'?'active':''} onClick={()=>setCatalogTab('foods')}>Alimentos TACO</button><button className={catalogTab==='recipes'?'active':''} onClick={()=>setCatalogTab('recipes')}>Receitas</button></div><label className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar no catálogo..."/></label><div className="picker-results">{catalogTab==='foods' ? foods.map(food=><button key={food.id} onClick={()=>addFood(food)}><div><strong>{food.name}</strong><small>{food.category} · {food.referenceUnit}</small></div><span>{Number(food.kcal).toFixed(0)} kcal</span><Plus size={17}/></button>) : recipes.map(recipe=><button key={recipe.id} onClick={()=>addRecipe(recipe)}><div><strong>{recipe.title}</strong><small>{recipe.category} · {recipe.ingredients.length} ingredientes</small></div><span>{recipe.ingredients.reduce((sum,item)=>sum+num(item.kcal),0).toFixed(0)} kcal</span><UtensilsCrossed size={17}/></button>)}</div></section></div>}
  </div>;
}
