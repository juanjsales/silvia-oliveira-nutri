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
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("portal_shopping_checked") || "{}");
    } catch {
      return {};
    }
  });
  const [copied, setCopied] = useState(false);

  // Extrair todos os alimentos únicos do plano ativo
  const classifiedItems = useMemo(() => {
    if (!activePlan?.content) return { hortifruti: [], proteinas: [], laticinios: [], graos: [], outros: [] };

    const meals = activePlan.content.meals || activePlan.content.refeicoes || [];
    const allItems: string[] = [];

    meals.forEach((m) => {
      const list = m.items || m.alimentosList || [];
      list.forEach((item) => {
        const raw = item.name || item.nome;
        if (raw && typeof raw === "string") {
          const cleanName = raw.trim();
          if (cleanName && !allItems.includes(cleanName)) {
            allItems.push(cleanName);
          }
        }
      });
    });

    const groups: Record<FoodCategory, string[]> = {
      hortifruti: [],
      proteinas: [],
      laticinios: [],
      graos: [],
      outros: [],
    };

    allItems.forEach((food) => {
      const category = classifyFood(food);
      groups[category].push(food);
    });

    return groups;
  }, [activePlan]);

  const totalItemsCount = useMemo(() => {
    return Object.values(classifiedItems).reduce((acc, list) => acc + list.length, 0);
  }, [classifiedItems]);

  const checkedCount = useMemo(() => {
    return Object.values(classifiedItems)
      .flat()
      .filter((item) => checkedItems[item]).length;
  }, [classifiedItems, checkedItems]);

  const progressPercent = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

  function toggleItem(food: string) {
    setCheckedItems((prev) => {
      const next = { ...prev, [food]: !prev[food] };
      localStorage.setItem("portal_shopping_checked", JSON.stringify(next));
      return next;
    });
  }

  async function resetList() {
    if (await confirm({title:"Limpar marcações?",message:"Todos os itens marcados na lista de compras voltarão ao estado inicial.",confirmLabel:"Limpar marcações",tone:"warning"})) {
      setCheckedItems({});
      localStorage.removeItem("portal_shopping_checked");
    }
  }

  function generateFormattedText() {
    let text = `🛒 *Lista de Compras — ${activePlan?.title || "Plano Nutricional"}*\n\n`;
    (Object.keys(classifiedItems) as FoodCategory[]).forEach((cat) => {
      const items = classifiedItems[cat];
      if (items.length > 0) {
        text += `*${categoryConfig[cat].label.toUpperCase()}*\n`;
        items.forEach((item) => {
          const isDone = checkedItems[item] ? "✅" : "▫️";
          text += `${isDone} ${item}\n`;
        });
        text += "\n";
      }
    });
    text += `_Gerada pelo Portal do Paciente da Nutricionista_`;
    return text;
  }

  function copyToClipboard() {
    const text = generateFormattedText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
            <h2>Lista de Compras Inteligente</h2>
            <p>Gerada automaticamente a partir do seu plano alimentar ativo: <strong>{activePlan?.title}</strong></p>
          </div>
        </div>

        <div className="shopping-actions-bar">
          <button
            type="button"
            className="secondary-button"
            onClick={copyToClipboard}
            title="Copiar lista de compras formatada"
          >
            {copied ? <Check size={15} style={{ color: "#16a34a" }} /> : <Copy size={15} />}
            <span>{copied ? "Copiada!" : "Copiar"}</span>
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

      {/* BARRA DE PROGRESSO DE COMPRAS */}
      <div className="shopping-progress-box">
        <div className="progress-labels">
          <span>Progresso das Compras</span>
          <strong>{checkedCount} de {totalItemsCount} itens ({progressPercent}%)</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* SETORES DO SUPERMERCADO */}
      <div className="shopping-categories-grid">
        {(Object.keys(classifiedItems) as FoodCategory[]).map((cat) => {
          const items = classifiedItems[cat];
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
                  const isChecked = Boolean(checkedItems[food]);
                  return (
                    <label key={food} className={`shopping-item-row ${isChecked ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(food)}
                      />
                      <span className="item-name">{food}</span>
                      {isChecked && <Check size={14} className="item-done-check" />}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
