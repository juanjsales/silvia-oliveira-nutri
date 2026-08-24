import { Apple, BookOpen, ChevronRight, Clock3, FilePlus2, Layers3, Search, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type Tab = 'foods' | 'recipes' | 'templates' | 'plans';
type Food = {
  id: string;
  name: string;
  category: string;
  source: string;
  referenceUnit: string;
  kcal: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  fiber: number;
};
type Ingredient = {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbohydrate: number;
  fat: number;
};
type Recipe = {
  id: string;
  title: string;
  category: string;
  preparationTime?: string;
  yieldText?: string;
  instructions: string;
  ingredients: Ingredient[];
};
type Template = {
  id: string;
  title: string;
  objective?: string;
  targetKcal?: number;
  content: Record<string, unknown>;
};
type Plan = {
  id: string;
  patientName: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt: string;
};
type Patient = {
  id: string;
  name: string;
};

const tabs: { key: Tab; label: string; icon: typeof Apple }[] = [
  { key: 'foods', label: 'Alimentos TACO', icon: Apple },
  { key: 'recipes', label: 'Receitas', icon: BookOpen },
  { key: 'templates', label: 'Modelos', icon: Layers3 },
  { key: 'plans', label: 'Planos dos pacientes', icon: UtensilsCrossed },
];

const recipeTotals = (recipe: Recipe) =>
  recipe.ingredients.reduce(
    (total, item) => ({
      kcal: total.kcal + (Number(item.kcal) || 0),
      protein: total.protein + (Number(item.protein) || 0),
      carbohydrate: total.carbohydrate + (Number(item.carbohydrate) || 0),
      fat: total.fat + (Number(item.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbohydrate: 0, fat: 0 }
  );

export function NutritionLibraryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('foods');
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [patientId, setPatientId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'foods') {
        const r = await api<{ data: Food[] }>(`/api/nutrition/foods${query ? `?q=${encodeURIComponent(query)}` : ''}`);
        setFoods(r.data);
      } else if (tab === 'recipes') {
        const r = await api<{ data: Recipe[] }>(`/api/nutrition/recipes${query ? `?q=${encodeURIComponent(query)}` : ''}`);
        setRecipes(r.data);
      } else if (tab === 'templates') {
        const r = await api<{ data: Template[] }>('/api/nutrition/templates');
        setTemplates(r.data);
      } else {
        const r = await api<{ data: Plan[] }>('/api/nutrition/plans');
        setPlans(r.data);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    api<{ data: Patient[] }>('/api/patients')
      .then((r) => setPatients(r.data))
      .catch(() => undefined);
  }, []);

  async function createFromTemplate() {
    if (!selectedTemplate || !patientId) return;
    setSaving(true);
    try {
      const result = await api<{ data: { id: string } }>('/api/nutrition/plans', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          templateId: selectedTemplate.id,
          title: selectedTemplate.title,
          objective: selectedTemplate.objective,
          content: selectedTemplate.content,
        }),
      });
      navigate(`/planos/${result.data.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar o plano.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-intro">
        <div>
          <h2>Planos & Biblioteca Nutricional</h2>
          <p>Pesquise alimentos TACO, reutilize receitas e transforme modelos em planos individualizados.</p>
        </div>
        <button className="primary-button" onClick={() => setTab('templates')}>
          <FilePlus2 size={18} /> Criar plano
        </button>
      </div>

      <nav className="library-tabs" aria-label="Abas da biblioteca nutricional">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'active' : ''}
            onClick={() => {
              setTab(key);
              setQuery('');
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {(tab === 'foods' || tab === 'recipes') && (
        <label className="search-field library-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'foods' ? 'Buscar arroz, frango, banana...' : 'Buscar receita ou ingrediente...'}
          />
        </label>
      )}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <section className="panel empty-state">
          <span className="spinner" />
          <strong>Carregando catálogo...</strong>
        </section>
      ) : tab === 'foods' ? (
        <div className="food-grid">
          {foods.map((food) => (
            <article className="food-card" key={food.id}>
              <div className="food-card-head">
                <span>{food.category}</span>
                <small>{food.source}</small>
              </div>
              <h3>{food.name}</h3>
              <p>Referência: {food.referenceUnit}</p>
              <div className="macro-grid">
                <span>
                  <strong>{Number(food.kcal).toFixed(0)}</strong> kcal
                </span>
                <span>
                  <strong>{Number(food.protein).toFixed(1)}g</strong> proteína
                </span>
                <span>
                  <strong>{Number(food.carbohydrate).toFixed(1)}g</strong> carbo
                </span>
                <span>
                  <strong>{Number(food.fat).toFixed(1)}g</strong> gordura
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : tab === 'recipes' ? (
        <div className="recipe-grid">
          {recipes.map((recipe) => {
            const total = recipeTotals(recipe);
            return (
              <button
                type="button"
                className="recipe-card"
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="recipe-icon">
                  <BookOpen size={20} />
                </div>
                <span className="eyebrow">{recipe.category}</span>
                <h3>{recipe.title}</h3>
                <p>
                  {recipe.ingredients.length} ingredientes · {total.kcal.toFixed(0)} kcal
                </p>
                <div className="macro-grid">
                  <span>
                    <strong>{total.protein.toFixed(1)}g</strong> prot
                  </span>
                  <span>
                    <strong>{total.carbohydrate.toFixed(1)}g</strong> carb
                  </span>
                  <span>
                    <strong>{total.fat.toFixed(1)}g</strong> gord
                  </span>
                  <span>
                    <strong>{total.kcal.toFixed(0)}</strong> kcal
                  </span>
                </div>
                <div>
                  {recipe.preparationTime && (
                    <span>
                      <Clock3 size={13} />
                      {recipe.preparationTime}
                    </span>
                  )}
                  <span>
                    Ver receita <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : tab === 'templates' ? (
        <div className="template-grid">
          {templates.map((template) => (
            <article className="template-card" key={template.id}>
              <Sparkles size={21} />
              <span className="eyebrow">Modelo clínico</span>
              <h3>{template.title}</h3>
              <p>{template.objective || 'Plano nutricional estruturado e editável.'}</p>
              <div>
                <strong>{template.targetKcal ? `${template.targetKcal} kcal` : 'Meta ajustável'}</strong>
                <button className="secondary-button" onClick={() => setSelectedTemplate(template)}>
                  Usar modelo
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          {plans.length === 0 ? (
            <div className="empty-state">
              <UtensilsCrossed size={32} />
              <strong>Nenhum plano criado</strong>
              <p>Escolha um dos modelos para começar a personalização.</p>
              <button className="secondary-button" onClick={() => setTab('templates')}>
                Ver modelos
              </button>
            </div>
          ) : (
            <div className="plan-list">
              {plans.map((plan) => (
                <Link to={`/planos/${plan.id}`} key={plan.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article>
                    <div className="patient-avatar">{plan.patientName.charAt(0)}</div>
                    <div>
                      <strong>{plan.title}</strong>
                      <span>
                        {plan.patientName} · atualizado em {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className={`plan-status ${plan.status.toLowerCase()}`}>
                      {plan.status === 'DRAFT' ? 'Rascunho' : plan.status === 'PUBLISHED' ? 'Publicado' : 'Arquivado'}
                    </span>
                    <div className="icon-button" aria-label="Abrir plano">
                      <ChevronRight size={18} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedRecipe && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedRecipe(null);
          }}
        >
          <section className="modal recipe-detail">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{selectedRecipe.category}</span>
                <h2>{selectedRecipe.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedRecipe(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="recipe-meta">
              <span>
                <Clock3 size={15} />
                {selectedRecipe.preparationTime || 'Tempo não informado'}
              </span>
              <span>
                <UtensilsCrossed size={15} />
                {selectedRecipe.yieldText || 'Rendimento não informado'}
              </span>
            </div>
            <div className="macro-grid" style={{ marginTop: '14px', padding: '14px' }}>
              {(() => {
                const total = recipeTotals(selectedRecipe);
                return (
                  <>
                    <span>
                      <strong>{total.kcal.toFixed(0)}</strong> kcal
                    </span>
                    <span>
                      <strong>{total.protein.toFixed(1)}g</strong> proteína
                    </span>
                    <span>
                      <strong>{total.carbohydrate.toFixed(1)}g</strong> carboidratos
                    </span>
                    <span>
                      <strong>{total.fat.toFixed(1)}g</strong> gorduras
                    </span>
                  </>
                );
              })()}
            </div>
            <h3>Ingredientes</h3>
            <div className="ingredient-list">
              {selectedRecipe.ingredients.map((item, index) => (
                <div key={`${item.name}-${index}`}>
                  <span>{item.name}</span>
                  <strong>{item.amount}</strong>
                  <small>
                    {Math.round(item.kcal)} kcal · P {Number(item.protein).toFixed(1)} · C {Number(item.carbohydrate).toFixed(1)} · G {Number(item.fat).toFixed(1)}
                  </small>
                </div>
              ))}
            </div>
            <h3>Modo de preparo</h3>
            <p className="recipe-instructions">{selectedRecipe.instructions}</p>
          </section>
        </div>
      )}

      {selectedTemplate && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedTemplate(null);
          }}
        >
          <section className="modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">Criar a partir do modelo</span>
                <h2>{selectedTemplate.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedTemplate(null)}>
                <X size={20} />
              </button>
            </div>
            <label className="template-patient">
              Paciente
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">O plano será criado como rascunho para personalização antes de ser publicado.</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setSelectedTemplate(null)}>
                Cancelar
              </button>
              <button
                className="primary-button"
                onClick={() => void createFromTemplate()}
                disabled={!patientId || saving}
              >
                {saving ? 'Criando...' : 'Criar rascunho'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

