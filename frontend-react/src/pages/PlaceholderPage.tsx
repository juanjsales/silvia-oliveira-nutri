import { Construction } from 'lucide-react';
export function PlaceholderPage({ title, description }: { title: string; description: string }) { return <section className="panel placeholder"><Construction size={30}/><span className="eyebrow">Próxima evolução</span><h2>{title}</h2><p>{description}</p><small>O módulo atual permanece disponível durante a migração incremental.</small></section>; }
