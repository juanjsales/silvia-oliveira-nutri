import {
  BookOpen,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  Droplets,
  FileCheck2,
  HeartPulse,
  Mail,
  Repeat,
  Salad,
  Send,
  Sparkles,
  Tags,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NUTRITIONAL_LAMINAS, type NutritionalLamina } from '../lib/nutritionalLaminas';

const iconMap: Record<string, any> = {
  Salad,
  Tags,
  Brain,
  Droplets,
  Repeat,
  Sparkles,
  HeartPulse,
  Boxes,
};

export interface FinishEncounterData {
  sendEmail: boolean;
  emailRecipient?: string;
  includePlan: boolean;
  includeShoppingList: boolean;
  includeSummary: boolean;
  selectedLaminas: string[];
  customMessage: string;
}

interface FinishEncounterModalProps {
  patientName: string;
  patientEmail?: string | null;
  onClose: () => void;
  onConfirm: (data: FinishEncounterData) => Promise<void>;
  loading?: boolean;
}

export function FinishEncounterModal({
  patientName,
  patientEmail = '',
  onClose,
  onConfirm,
  loading = false,
}: FinishEncounterModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [emailRecipient, setEmailRecipient] = useState(patientEmail || '');
  const [includePlan, setIncludePlan] = useState(true);
  const [includeShoppingList, setIncludeShoppingList] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [selectedLaminas, setSelectedLaminas] = useState<string[]>([
    'prato-ideal',
    'rotulos-alimentos',
    'fome-saciedade',
  ]);
  const [customMessage, setCustomMessage] = useState('');
  const [previewLamina, setPreviewLamina] = useState<NutritionalLamina | null>(null);

  function toggleLamina(id: string) {
    setSelectedLaminas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function selectAllLaminas() {
    setSelectedLaminas(NUTRITIONAL_LAMINAS.map((l) => l.id));
  }

  function clearAllLaminas() {
    setSelectedLaminas([]);
  }

  async function handleFinalize(withEmail: boolean) {
    const recipient = emailRecipient.trim();
    await onConfirm({
      sendEmail: withEmail,
      ...(withEmail && recipient ? { emailRecipient: recipient } : {}),
      includePlan,
      includeShoppingList,
      includeSummary,
      selectedLaminas,
      customMessage: customMessage.trim(),
    });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="finish-encounter-modal">
        <header className="finish-modal-header">
          <div className="finish-title-wrap">
            <div className="finish-icon-badge">
              <FileCheck2 size={24} />
            </div>
            <div>
              <h2>Concluir Atendimento Clínico</h2>
              <p>Paciente: <strong>{patientName}</strong></p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={loading}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="finish-modal-body">
          {/* Opção de Envio de E-mail */}
          <section className="finish-section email-toggle-card">
            <label className="toggle-label-main">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={loading}
              />
              <div className="toggle-info">
                <span className="toggle-title">
                  <Mail size={16} /> Enviar e-mail timbrado de orientações ao paciente
                </span>
                <span className="toggle-sub">
                  O paciente receberá o resumo da consulta, plano alimentar e materiais educativos em layout oficial.
                </span>
              </div>
            </label>

            {sendEmail && (
              <div className="email-recipient-input">
                <label>
                  <span>E-mail do Paciente:</span>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="paciente@email.com"
                    required
                    disabled={loading}
                  />
                </label>
              </div>
            )}
          </section>

          {sendEmail && (
            <>
              {/* Anexos e Conteúdo do E-mail */}
              <section className="finish-section">
                <h4>📎 Anexos e Conteúdo do E-mail</h4>
                <div className="finish-checkbox-grid">
                  <label className="finish-check-box">
                    <input
                      type="checkbox"
                      checked={includePlan}
                      onChange={(e) => setIncludePlan(e.target.checked)}
                      disabled={loading}
                    />
                    <span>📄 <strong>Plano Alimentar Atualizado</strong> (Acesso no Portal)</span>
                  </label>

                  <label className="finish-check-box">
                    <input
                      type="checkbox"
                      checked={includeShoppingList}
                      onChange={(e) => setIncludeShoppingList(e.target.checked)}
                      disabled={loading}
                    />
                    <span>🛒 <strong>Lista de Compras Prática</strong></span>
                  </label>

                  <label className="finish-check-box">
                    <input
                      type="checkbox"
                      checked={includeSummary}
                      onChange={(e) => setIncludeSummary(e.target.checked)}
                      disabled={loading}
                    />
                    <span>📋 <strong>Metas Acordadas na Consulta</strong></span>
                  </label>
                </div>
              </section>

              {/* Lâminas Nutricionais Educativas */}
              <section className="finish-section">
                <div className="laminas-header-bar">
                  <div>
                    <h4>📚 Lâminas Nutricionais Educativas</h4>
                    <small>Selecione materiais visuais de apoio para enriquecer o tratamento do paciente</small>
                  </div>
                  <div className="laminas-quick-actions">
                    <button type="button" className="text-btn" onClick={selectAllLaminas}>
                      Selecionar Todas
                    </button>
                    <span>·</span>
                    <button type="button" className="text-btn" onClick={clearAllLaminas}>
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="laminas-selection-grid">
                  {NUTRITIONAL_LAMINAS.map((lamina) => {
                    const isSelected = selectedLaminas.includes(lamina.id);
                    const Icon = iconMap[lamina.icon] || Sparkles;

                    return (
                      <div
                        key={lamina.id}
                        className={`lamina-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleLamina(lamina.id)}
                      >
                        <div className="lamina-card-header">
                          <span className="lamina-category-tag">{lamina.categoryLabel}</span>
                          <div className={`lamina-checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="lamina-card-body">
                          <div className="lamina-icon-circle">
                            <Icon size={18} />
                          </div>
                          <strong>{lamina.title}</strong>
                          <p>{lamina.summary}</p>
                        </div>

                        <div className="lamina-card-footer">
                          <button
                            type="button"
                            className="preview-lamina-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewLamina(lamina);
                            }}
                          >
                            <BookOpen size={12} /> Ver dicas
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Mensagem Personalizada da Nutricionista */}
              <section className="finish-section">
                <label className="custom-message-label">
                  <span>💬 Mensagem ou Recado Personalizado da Dra. Silvia (opcional):</span>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Ex: Parabéns pela dedicação nesta primeira etapa! Lembre-se de priorizar a hidratação nos treinos..."
                    disabled={loading}
                  />
                </label>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <footer className="finish-modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="outline-button"
            onClick={() => handleFinalize(false)}
            disabled={loading}
            title="Finalizar prontuário sem disparar e-mail"
          >
            Finalizar sem Enviar
          </button>

          <button
            type="button"
            className="primary-button finish-submit-btn"
            onClick={() => handleFinalize(sendEmail)}
            disabled={loading || (sendEmail && !emailRecipient.trim())}
          >
            {loading ? (
              <>
                <span className="spinner" /> Finalizando...
              </>
            ) : (
              <>
                <Send size={16} /> Finalizar e Enviar E-mail
              </>
            )}
          </button>
        </footer>
      </div>

      {/* Modal Secundário de Prévia da Lâmina */}
      {previewLamina && (
        <div
          className="modal-backdrop lamina-preview-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreviewLamina(null);
          }}
        >
          <div className="lamina-preview-modal">
            <header className="lamina-preview-header">
              <div>
                <span className="eyebrow">{previewLamina.categoryLabel}</span>
                <h3>{previewLamina.title}</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setPreviewLamina(null)}
              >
                <X size={18} />
              </button>
            </header>

            <div className="lamina-preview-body">
              <p className="lamina-preview-summary">{previewLamina.summary}</p>
              <h4>✨ Destaques & Orientações Práticas:</h4>
              <ul className="lamina-preview-tips">
                {previewLamina.tips.map((tip, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={15} className="tip-check-icon" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="lamina-preview-footer">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  if (!selectedLaminas.includes(previewLamina.id)) {
                    toggleLamina(previewLamina.id);
                  }
                  setPreviewLamina(null);
                }}
              >
                {selectedLaminas.includes(previewLamina.id)
                  ? 'Manter Selecionada'
                  : 'Incluir no E-mail'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
