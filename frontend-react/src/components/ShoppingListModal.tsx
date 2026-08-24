import {
  Apple,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Milk,
  PackageCheck,
  RefreshCw,
  Salad,
  Share2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "./ConfirmDialog";

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
type ShoppingItem = { name: string; quantities: string[] };
type ShoppingFilter = "ALL" | "PENDING" | "DONE";

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

export function ShoppingListSection({ plans }: { plans: Plan[] }) {
  const confirm = useConfirm();
  const activePlan = plans[0];
  const storageKey = `portal_shopping_checked:${activePlan?.id || "active"}`;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<ShoppingFilter>("ALL");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem("portal_shopping_checked") || "{}";
      setCheckedItems(JSON.parse(saved));
    } catch {
      setCheckedItems({});
    }
  }, [storageKey]);

  // Extrair todos os alimentos únicos do plano ativo
  const classifiedItems = useMemo(() => {
    if (!activePlan?.content) return { hortifruti: [], proteinas: [], laticinios: [], graos: [], outros: [] };

    const meals = activePlan.content.meals || activePlan.content.refeicoes || [];
    const allItems = new Map<string, ShoppingItem>();

    meals.forEach((m) => {
      const list = m.items || m.alimentosList || [];
      list.forEach((item) => {
        const raw = item.name || item.nome;
        if (raw && typeof raw === "string") {
          const cleanName = raw.trim();
          if (!cleanName) return;
          const key = cleanName.toLocaleLowerCase("pt-BR");
          const quantity = [item.amount || item.quantidade, item.unit || item.unidade].filter(Boolean).join(" ").trim();
          const current = allItems.get(key) || { name: cleanName, quantities: [] };
          if (quantity && !current.quantities.includes(quantity)) current.quantities.push(quantity);
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

    return groups;
  }, [activePlan]);

  const totalItemsCount = useMemo(() => {
    return Object.values(classifiedItems).reduce((acc, list) => acc + list.length, 0);
  }, [classifiedItems]);

  const checkedCount = useMemo(() => {
    return Object.values(classifiedItems)
      .flat()
      .filter((item) => checkedItems[item.name]).length;
  }, [classifiedItems, checkedItems]);

  const progressPercent = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;
  const filteredItemsCount = filter === "ALL" ? totalItemsCount : filter === "DONE" ? checkedCount : totalItemsCount - checkedCount;

  function toggleItem(food: string) {
    setCheckedItems((prev) => {
      const next = { ...prev, [food]: !prev[food] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  async function resetList() {
    if (await confirm({title:"Limpar marcações?",message:"Todos os itens marcados na lista de compras voltarão ao estado inicial.",confirmLabel:"Limpar marcações",tone:"warning"})) {
      setCheckedItems({});
      localStorage.removeItem(storageKey);
    }
  }

  function generateFormattedText() {
    let text = `🛒 *Lista de Compras — ${activePlan?.title || "Plano Nutricional"}*\n\n`;
    (Object.keys(classifiedItems) as FoodCategory[]).forEach((cat) => {
      const items = classifiedItems[cat];
      if (items.length > 0) {
        text += `*${categoryConfig[cat].label.toUpperCase()}*\n`;
        items.forEach((item) => {
          const isDone = checkedItems[item.name] ? "✅" : "▫️";
          const quantity = item.quantities.length ? ` — ${item.quantities.join(" + ")}` : "";
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
    <section className="panel shopping-list-panel">
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

      {/* BARRA DE PROGRESSO DE COMPRAS */}
      <div className={`shopping-progress-box ${progressPercent === 100 ? "complete" : ""}`}>
        <div className="shopping-progress-icon" aria-hidden="true">{progressPercent === 100 ? <PackageCheck/> : <ShoppingBag/>}</div>
        <div className="progress-labels">
          <span>{progressPercent === 100 ? "Lista concluída" : "Progresso das compras"}</span>
          <strong>{checkedCount} de {totalItemsCount} itens</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <b>{progressPercent}%</b>
      </div>

      <div className="shopping-filter-bar" role="group" aria-label="Filtrar itens da lista">
        <button type="button" className={filter === "ALL" ? "active" : ""} onClick={() => setFilter("ALL")}>Todos <span>{totalItemsCount}</span></button>
        <button type="button" className={filter === "PENDING" ? "active" : ""} onClick={() => setFilter("PENDING")}>Pendentes <span>{totalItemsCount - checkedCount}</span></button>
        <button type="button" className={filter === "DONE" ? "active" : ""} onClick={() => setFilter("DONE")}>No carrinho <span>{checkedCount}</span></button>
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
          const items = classifiedItems[cat].filter((item) => filter === "ALL" || (filter === "DONE" ? checkedItems[item.name] : !checkedItems[item.name]));
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
                  const isChecked = Boolean(checkedItems[food.name]);
                  return (
                    <label key={food.name} className={`shopping-item-row ${isChecked ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(food.name)}
                      />
                      <span className="shopping-checkbox" aria-hidden="true">{isChecked && <Check size={13}/>}</span>
                      <span className="item-name"><strong>{food.name}</strong>{food.quantities.length > 0 && <small>{food.quantities.join(" + ")}</small>}</span>
                      {isChecked && <CheckCircle2 size={16} className="item-done-check" aria-hidden="true" />}
                    </label>
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
