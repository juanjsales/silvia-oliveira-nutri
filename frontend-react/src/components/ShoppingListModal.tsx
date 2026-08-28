import {
  Apple,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Milk,
  Minus,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Salad,
  Share2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "./ConfirmDialog";
import { planMeals } from "../lib/mealPlanSchedule";

type MealItem = {
  name?: string;
  nome?: string;
  amount?: string;
  quantidade?: string;
  unit?: string;
  unidade?: string;
};

type Meal = {
  name?: string;
  nome?: string;
  items?: MealItem[];
  alimentosList?: MealItem[];
};

type Plan = {
  id?: string;
  title?: string;
  content?: {
    meals?: Meal[];
    refeicoes?: Meal[];
    orientations?: string[];
  };
};

type FoodCategory = "hortifruti" | "proteinas" | "laticinios" | "graos" | "outros";
type ShoppingItem = { name: string; quantities: string[]; personal?: boolean };
type PersonalItem = { id: string; name: string; quantity: string; category: FoodCategory };
type ShoppingFilter = "ALL" | "PENDING" | "DONE" | "PANTRY";
type ShoppingState = {
  checked: Record<string, boolean>;
  pantry: Record<string, boolean>;
  personal: PersonalItem[];
  days: 3 | 5 | 7;
};

const categoryConfig: Record<
  FoodCategory,
  { label: string; icon: any; color: string; keywords: string[] }
> = {
  hortifruti: {
    label: "Hortifrúti & Feira",
    icon: Apple,
    color: "#16a34a",
    keywords: [
      "banana",
      "maçã",
      "pera",
      "morango",
      "laranja",
      "limão",
      "uva",
      "abacate",
      "mamão",
      "melancia",
      "manga",
      "abacaxi",
      "kiwi",
      "alface",
      "rúcula",
      "espinafre",
      "couve",
      "brócolis",
      "cenoura",
      "beterraba",
      "tomate",
      "pepino",
      "cebola",
      "alho",
      "batata",
      "mandioca",
      "abobrinha",
      "chuchu",
      "pimentão",
      "fruta",
      "legume",
      "verdura",
      "salada",
    ],
  },
  proteinas: {
    label: "Açougue, Peixaria & Ovos",
    icon: Utensils,
    color: "#dc2626",
    keywords: [
      "frango",
      "peito de frango",
      "ovo",
      "ovos",
      "carne",
      "patinho",
      "alcatra",
      "filé",
      "peixe",
      "tilápia",
      "salmão",
      "atum",
      "sardinha",
      "camarão",
      "tofu",
      "whey",
      "proteína",
    ],
  },
  laticinios: {
    label: "Laticínios & Derivados",
    icon: Milk,
    color: "#0284c7",
    keywords: [
      "leite",
      "queijo",
      "cottage",
      "ricota",
      "mussarela",
      "iogurte",
      "kefir",
      "manteiga",
      "requeijão",
      "whey",
    ],
  },
  graos: {
    label: "Grãos, Cereais & Mercearia",
    icon: Wheat,
    color: "#d97706",
    keywords: [
      "arroz",
      "feijão",
      "aveia",
      "quinoa",
      "chia",
      "linhaça",
      "pão",
      "torrada",
      "azeite",
      "castanha",
      "amêndoa",
      "nozes",
      "amendoim",
      "farinha",
      "tapioca",
      "cuscuz",
      "granola",
      "lentilha",
      "grão-de-bico",
    ],
  },
  outros: {
    label: "Temperos & Diversos",
    icon: ShoppingBag,
    color: "#64748b",
    keywords: [],
  },
};

function classifyFood(name: string): FoodCategory {
  const lower = name.toLowerCase();
  for (const [cat, cfg] of Object.entries(categoryConfig) as [FoodCategory, typeof categoryConfig[FoodCategory]][]) {
    if (cfg.keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }
  return "outros";
}

const itemKey = (item: Pick<ShoppingItem, "name" | "personal">) => `${item.personal ? "personal:" : "plan:"}${item.name.toLocaleLowerCase("pt-BR")}`;

/** Multiplies only unambiguous numeric quantities. Free text is kept intact to avoid unsafe guesses. */
export function consolidateShoppingQuantities(quantities: string[], days: number): string {
  const parsed = quantities.map((value) => value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/));
  if (quantities.length && parsed.every(Boolean)) {
    const units = parsed.map((match) => (match?.[2] || "").trim().toLocaleLowerCase("pt-BR"));
    if (units.every((unit) => unit === units[0])) {
      const total = parsed.reduce((sum, match) => sum + Number((match?.[1] || "0").replace(",", ".")), 0) * days;
      const display = Number.isInteger(total) ? String(total) : total.toFixed(1).replace(".", ",");
      return `${display}${units[0] ? ` ${parsed[0]?.[2]}` : ""}`;
    }
  }
  const unique = [...new Set(quantities.filter(Boolean))];
  if (!unique.length) return "Quantidade conforme orientação";
  return `${unique.join(" + ")} · repetir por ${days} dias`;
}

export function ShoppingProgressPreview({ total, checked, pantry = 0 }: { total: number; checked: number; pantry?: number }) {
  const needed = Math.max(0, total - pantry);
  const percent = needed ? Math.round((checked / needed) * 100) : total ? 100 : 0;
  return (
    <div className={`shopping-progress-box shopping-progress-preview ${percent === 100 ? "complete" : ""}`}>
      <div className="shopping-progress-icon" aria-hidden="true">{percent === 100 ? <PackageCheck/> : <ShoppingBag/>}</div>
      <div className="progress-labels"><span>{percent === 100 ? "Tudo organizado" : "Compras da semana"}</span><strong>{checked} de {needed} itens no carrinho</strong>{pantry > 0 && <small>{pantry} {pantry === 1 ? "item já está" : "itens já estão"} em casa</small>}</div>
      <div className="progress-track" role="progressbar" aria-label="Progresso das compras" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
      <b>{percent}%</b>
    </div>
  );
}

export function ShoppingListSection({ plans }: { plans: Plan[] }) {
  const confirm = useConfirm();
  const activePlan = plans[0];
  const storageKey = `portal_shopping_v2:${activePlan?.id || "active"}`;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [pantryItems, setPantryItems] = useState<Record<string, boolean>>({});
  const [personalItems, setPersonalItems] = useState<PersonalItem[]>([]);
  const [days, setDays] = useState<3 | 5 | 7>(7);
  const [draftName, setDraftName] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [marketMode, setMarketMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<ShoppingFilter>("ALL");
  const weeklyPlan = planMeals(activePlan?.content || {}).some((meal: any) => Number.isInteger(Number(meal.dayOfWeek)));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved) as Partial<ShoppingState>;
        setCheckedItems(state.checked || {}); setPantryItems(state.pantry || {});
        setPersonalItems(state.personal || []); setDays(state.days || 7);
      } else {
        const legacy = JSON.parse(localStorage.getItem(`portal_shopping_checked:${activePlan?.id || "active"}`) || localStorage.getItem("portal_shopping_checked") || "{}") as Record<string, boolean>;
        setCheckedItems(Object.fromEntries(Object.entries(legacy).map(([name, value]) => [`plan:${name.toLocaleLowerCase("pt-BR")}`, Boolean(value)])));
        setPantryItems({}); setPersonalItems([]); setDays(7);
      }
    } catch {
      setCheckedItems({}); setPantryItems({}); setPersonalItems([]); setDays(7);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!marketMode) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMarketMode(false); };
    document.body.classList.add("shopping-market-open");
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.classList.remove("shopping-market-open"); window.removeEventListener("keydown", onKeyDown); };
  }, [marketMode]);

  function persist(next: Partial<ShoppingState>) {
    const state: ShoppingState = { checked: checkedItems, pantry: pantryItems, personal: personalItems, days, ...next };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  // Extrair todos os alimentos únicos do plano ativo
  const classifiedItems = useMemo(() => {
    if (!activePlan?.content) return { hortifruti: [], proteinas: [], laticinios: [], graos: [], outros: [] };

    const allMeals = planMeals(activePlan.content) as any[];
    const today = new Date().getDay();
    const selectedDays = new Set(Array.from({ length: days }, (_, offset) => (today + offset) % 7));
    const meals = weeklyPlan ? allMeals.filter(meal => selectedDays.has(Number(meal.dayOfWeek))) : allMeals;
    const allItems = new Map<string, ShoppingItem>();

    meals.forEach((m) => {
      const list = m.items || m.alimentosList || [];
      list.forEach((item: any) => {
        const raw = item.name || item.nome;
        if (raw && typeof raw === "string") {
          const cleanName = raw.trim();
          if (!cleanName) return;
          const key = cleanName.toLocaleLowerCase("pt-BR");
          const quantity = [item.amount || item.quantidade, item.unit || item.unidade].filter(Boolean).join(" ").trim();
          const current = allItems.get(key) || { name: cleanName, quantities: [] };
          if (quantity && (weeklyPlan || !current.quantities.includes(quantity))) current.quantities.push(quantity);
          allItems.set(key, current);
        }
      });
    });

    const groups: Record<FoodCategory, ShoppingItem[]> = {
      hortifruti: [],
      proteinas: [],
      laticinios: [],
      graos: [],
      outros: [],
    };

    allItems.forEach((food) => {
      const category = classifyFood(food.name);
      groups[category].push(food);
    });

    Object.values(groups).forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));

    personalItems.forEach((item) => groups[item.category].push({ name: item.name, quantities: item.quantity ? [item.quantity] : [], personal: true }));
    Object.values(groups).forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    return groups;
  }, [activePlan, personalItems, days, weeklyPlan]);

  const totalItemsCount = useMemo(() => {
    return Object.values(classifiedItems).reduce((acc, list) => acc + list.length, 0);
  }, [classifiedItems]);

  const checkedCount = useMemo(() => {
    return Object.values(classifiedItems)
      .flat()
      .filter((item) => checkedItems[itemKey(item)] && !pantryItems[itemKey(item)]).length;
  }, [classifiedItems, checkedItems]);

  const pantryCount = useMemo(() => Object.values(classifiedItems).flat().filter((item) => pantryItems[itemKey(item)]).length, [classifiedItems, pantryItems]);
  const neededCount = totalItemsCount - pantryCount;

  const progressPercent = neededCount > 0 ? Math.round((checkedCount / neededCount) * 100) : 100;
  const filteredItemsCount = filter === "ALL" ? totalItemsCount : filter === "DONE" ? checkedCount : filter === "PANTRY" ? pantryCount : neededCount - checkedCount;

  function toggleItem(food: ShoppingItem) {
    const key = itemKey(food);
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      persist({ checked: next });
      return next;
    });
  }

  function togglePantry(food: ShoppingItem) {
    const key = itemKey(food);
    setPantryItems((prev) => { const next = { ...prev, [key]: !prev[key] }; persist({ pantry: next }); return next; });
  }

  function savePersonalItem() {
    const name = draftName.trim(); if (!name) return;
    const next = editingId
      ? personalItems.map((item) => item.id === editingId ? { ...item, name, quantity: draftQuantity.trim(), category: classifyFood(name) } : item)
      : [...personalItems, { id: crypto.randomUUID(), name, quantity: draftQuantity.trim(), category: classifyFood(name) }];
    setPersonalItems(next); persist({ personal: next }); setDraftName(""); setDraftQuantity(""); setEditingId(null); setFeedback(editingId ? "Item atualizado." : "Item pessoal adicionado.");
  }

  function editPersonal(item: PersonalItem) { setEditingId(item.id); setDraftName(item.name); setDraftQuantity(item.quantity); }
  function removePersonal(item: ShoppingItem) {
    const target = personalItems.find((entry) => entry.name === item.name); if (!target) return;
    const next = personalItems.filter((entry) => entry.id !== target.id); setPersonalItems(next); persist({ personal: next });
  }

  async function resetList() {
    if (await confirm({title:"Limpar marcações?",message:"Todos os itens marcados na lista de compras voltarão ao estado inicial.",confirmLabel:"Limpar marcações",tone:"warning"})) {
      setCheckedItems({});
      persist({ checked: {} });
    }
  }

  function generateFormattedText() {
    let text = `🛒 *Lista de Compras — ${activePlan?.title || "Plano Nutricional"}*\n\n`;
    (Object.keys(classifiedItems) as FoodCategory[]).forEach((cat) => {
      const items = classifiedItems[cat];
      if (items.length > 0) {
        text += `*${categoryConfig[cat].label.toUpperCase()}*\n`;
        items.forEach((item) => {
          const key = itemKey(item); const isDone = checkedItems[key] ? "✅" : pantryItems[key] ? "🏠" : "▫️";
          const quantity = ` — ${item.personal ? (item.quantities.join(" + ") || "sem quantidade") : consolidateShoppingQuantities(item.quantities, weeklyPlan ? 1 : days)}`;
          text += `${isDone} ${item.name}${quantity}\n`;
        });
        text += "\n";
      }
    });
    text += `_Gerada pelo Portal do Paciente da Nutricionista_`;
    return text;
  }

  async function copyToClipboard() {
    const text = generateFormattedText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFeedback("Lista copiada para a área de transferência.");
      setTimeout(() => { setCopied(false); setFeedback(""); }, 3000);
    } catch {
      setFeedback("Não foi possível copiar. Use a opção Baixar lista.");
    }
  }

  function downloadList() {
    const blob = new Blob([generateFormattedText().replaceAll("*", "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lista-de-compras.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("Lista preparada para download.");
  }

  function shareToWhatsApp() {
    const text = generateFormattedText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (totalItemsCount === 0) {
    return (
      <section className="panel shopping-list-panel empty">
        <ShoppingBag size={40} style={{ color: "#94a3b8" }} />
        <h3>Nenhum plano alimentar publicado</h3>
        <p>Assim que sua nutricionista publicar seu plano alimentar, a lista de compras será gerada automaticamente aqui.</p>
      </section>
    );
  }

  return (
    <section className={`panel shopping-list-panel ${marketMode ? "market-mode" : ""}`}>
      <header className="shopping-header">
        <div className="shopping-title-wrap">
          <div className="shopping-badge-icon">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="shopping-eyebrow"><Sparkles size={13}/> Organizada para sua rotina</span>
            <h2>Lista de compras</h2>
            <p>Itens do plano ativo <strong>{activePlan?.title}</strong>, agrupados conforme os setores do mercado.</p>
          </div>
        </div>

        <div className="shopping-actions-bar">
          <button type="button" className="secondary-button market-mode-button" onClick={() => setMarketMode((value) => !value)} aria-pressed={marketMode}><ShoppingBag size={15}/><span>{marketMode ? "Sair do mercado" : "Modo mercado"}</span></button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void copyToClipboard()}
            title="Copiar lista de compras formatada"
          >
            {copied ? <Check size={15} style={{ color: "#16a34a" }} /> : <Copy size={15} />}
            <span>{copied ? "Copiada!" : "Copiar"}</span>
          </button>

          <button type="button" className="secondary-button" onClick={downloadList} title="Baixar lista em formato de texto">
            <Download size={15} /><span>Baixar</span>
          </button>

          <button
            type="button"
            className="secondary-button wa-share-btn"
            onClick={shareToWhatsApp}
            title="Enviar lista para o seu WhatsApp"
          >
            <Share2 size={15} />
            <span>WhatsApp</span>
          </button>

          {checkedCount > 0 && (
            <button
              type="button"
              className="icon-button"
              onClick={resetList}
              title="Desmarcar todos"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </header>

      <div className="sr-only" role="status" aria-live="polite">{feedback}</div>

      <div className="shopping-planner" aria-label="Planejamento da lista">
        <div><strong>Planejar para</strong><span>As quantidades numéricas são consolidadas automaticamente.</span></div>
        <div className="shopping-days" role="group" aria-label="Quantidade de dias">{([3,5,7] as const).map((value) => <button type="button" key={value} className={days === value ? "active" : ""} aria-pressed={days === value} onClick={() => { setDays(value); persist({ days: value }); }}>{value} dias</button>)}</div>
      </div>

      <form className="shopping-add-form" onSubmit={(event) => { event.preventDefault(); savePersonalItem(); }}>
        <div><strong>{editingId ? "Editar item pessoal" : "Adicionar algo à lista"}</strong><span>Inclua produtos da casa sem alterar seu plano alimentar.</span></div>
        <label><span className="sr-only">Nome do produto</span><input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Ex.: detergente" maxLength={80}/></label>
        <label><span className="sr-only">Quantidade</span><input value={draftQuantity} onChange={(event) => setDraftQuantity(event.target.value)} placeholder="Quantidade (opcional)" maxLength={40}/></label>
        <button type="submit" className="primary-button" disabled={!draftName.trim()}>{editingId ? <Pencil size={15}/> : <Plus size={15}/>} {editingId ? "Salvar" : "Adicionar"}</button>
        {editingId && <button type="button" className="icon-button" title="Cancelar edição" onClick={() => { setEditingId(null); setDraftName(""); setDraftQuantity(""); }}><X size={16}/></button>}
      </form>

      {/* BARRA DE PROGRESSO DE COMPRAS */}
      <ShoppingProgressPreview total={totalItemsCount} checked={checkedCount} pantry={pantryCount}/>

      <div className="shopping-filter-bar" role="group" aria-label="Filtrar itens da lista">
        <button type="button" className={filter === "ALL" ? "active" : ""} onClick={() => setFilter("ALL")}>Todos <span>{totalItemsCount}</span></button>
        <button type="button" className={filter === "PENDING" ? "active" : ""} onClick={() => setFilter("PENDING")}>Pendentes <span>{totalItemsCount - checkedCount}</span></button>
        <button type="button" className={filter === "DONE" ? "active" : ""} onClick={() => setFilter("DONE")}>No carrinho <span>{checkedCount}</span></button>
        <button type="button" className={filter === "PANTRY" ? "active" : ""} onClick={() => setFilter("PANTRY")}>Já tenho <span>{pantryCount}</span></button>
      </div>

      {/* SETORES DO SUPERMERCADO */}
      {filteredItemsCount === 0 ? (
        <div className="shopping-filter-empty">
          {filter === "DONE" ? <ShoppingBag /> : <PackageCheck />}
          <strong>{filter === "DONE" ? "Nenhum item no carrinho" : "Todas as compras foram concluídas"}</strong>
          <p>{filter === "DONE" ? "Marque os produtos conforme avançar pelo mercado." : "Você pode revisar os itens comprados ou limpar as marcações para uma nova compra."}</p>
        </div>
      ) : <div className="shopping-categories-grid">
        {(Object.keys(classifiedItems) as FoodCategory[]).map((cat) => {
          const items = classifiedItems[cat].filter((item) => { const key = itemKey(item); return filter === "ALL" || (filter === "DONE" ? checkedItems[key] && !pantryItems[key] : filter === "PANTRY" ? pantryItems[key] : !checkedItems[key] && !pantryItems[key]); });
          if (items.length === 0) return null;
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;

          return (
            <div key={cat} className="shopping-category-card">
              <div className="cat-card-header" style={{ borderLeftColor: cfg.color }}>
                <Icon size={18} style={{ color: cfg.color }} />
                <strong>{cfg.label}</strong>
                <span className="cat-count">{items.length}</span>
              </div>

              <div className="cat-items-list">
                {items.map((food) => {
                  const key = itemKey(food); const isChecked = Boolean(checkedItems[key]); const isPantry = Boolean(pantryItems[key]);
                  return (
                    <div key={key} className={`shopping-item-row ${isChecked ? "checked" : ""} ${isPantry ? "pantry" : ""}`}>
                     <label className="shopping-item-check">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPantry}
                        onChange={() => toggleItem(food)}
                      />
                      <span className="shopping-checkbox" aria-hidden="true">{isChecked && <Check size={13}/>}</span>
                     </label>
                      <span className="item-name"><strong>{food.name}{food.personal && <em>pessoal</em>}</strong><small>{food.personal ? (food.quantities.join(" + ") || "Sem quantidade") : consolidateShoppingQuantities(food.quantities, weeklyPlan ? 1 : days)}</small></span>
                      <button type="button" className={`pantry-button ${isPantry ? "active" : ""}`} onClick={() => togglePantry(food)} aria-pressed={isPantry} title={isPantry ? "Remover dos itens que já tenho" : "Marcar como já tenho"}><PackageCheck size={15}/><span>{isPantry ? "Em casa" : "Já tenho"}</span></button>
                      {food.personal && <><button type="button" className="row-icon-button" title={`Editar ${food.name}`} onClick={() => { const item = personalItems.find((entry) => entry.name === food.name); if (item) editPersonal(item); }}><Pencil size={14}/></button><button type="button" className="row-icon-button danger" title={`Remover ${food.name}`} onClick={() => removePersonal(food)}><Minus size={14}/></button></>}
                      {isChecked && <CheckCircle2 size={16} className="item-done-check" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}
    </section>
  );
}
