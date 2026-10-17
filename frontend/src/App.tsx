import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  Fence,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Ruler,
  Sprout,
  UserRound,
  X,
} from 'lucide-react';
import { api } from './api';
import type { Farm, Paddock } from './types';

function App() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [paddocks, setPaddocks] = useState<Paddock[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [isLoadingPaddocks, setIsLoadingPaddocks] = useState(false);
  const [isSavingFarm, setIsSavingFarm] = useState(false);
  const [isSavingPaddock, setIsSavingPaddock] = useState(false);
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [showPaddockForm, setShowPaddockForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
  const totalArea = paddocks.reduce((sum, paddock) => sum + paddock.areaHectares, 0);

  useEffect(() => {
    let isCurrent = true;

    api
      .getFarms()
      .then((result) => {
        if (!isCurrent) return;
        setFarms(result);
        setSelectedFarmId((current) => current || result[0]?.id || '');
      })
      .catch((requestError: unknown) => {
        if (isCurrent) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isCurrent) setIsLoadingFarms(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFarmId) {
      setPaddocks([]);
      setIsLoadingPaddocks(false);
      return;
    }

    let isCurrent = true;
    setIsLoadingPaddocks(true);
    setError('');

    api
      .getPaddocksByFarm(selectedFarmId)
      .then((result) => {
        if (isCurrent) setPaddocks(result);
      })
      .catch((requestError: unknown) => {
        if (isCurrent) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPaddocks(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedFarmId]);

  async function handleCreateFarm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const ownerName = String(formData.get('ownerName') ?? '').trim();
    if (!name || !ownerName) return;

    setIsSavingFarm(true);
    setError('');
    setNotice('');
    try {
      const farm = await api.createFarm({ name, ownerName });
      setFarms((current) => [farm, ...current]);
      setSelectedFarmId(farm.id);
      setShowFarmForm(false);
      setNotice('Fazenda cadastrada com sucesso.');
      event.currentTarget.reset();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSavingFarm(false);
    }
  }

  async function handleCreatePaddock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFarm) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const areaHectares = Number(formData.get('areaHectares'));
    if (!name || !Number.isFinite(areaHectares) || areaHectares <= 0) return;

    setIsSavingPaddock(true);
    setError('');
    setNotice('');
    try {
      const paddock = await api.createPaddock({
        farmId: selectedFarm.id,
        name,
        areaHectares,
      });
      setPaddocks((current) => [paddock, ...current]);
      setShowPaddockForm(false);
      setNotice('Talhão cadastrado com sucesso.');
      event.currentTarget.reset();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSavingPaddock(false);
    }
  }

  async function refreshData() {
    setError('');
    setNotice('');
    setIsLoadingFarms(true);
    try {
      const result = await api.getFarms();
      setFarms(result);
      if (!result.some((farm) => farm.id === selectedFarmId)) {
        setSelectedFarmId(result[0]?.id ?? '');
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoadingFarms(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Pastagem, início">
          <span className="brand-mark"><Sprout size={20} strokeWidth={2.2} /></span>
          <span className="brand-name">pastagem<span>.</span></span>
        </a>
        <div className="topbar-right">
          <span className="connection-status"><span className="status-dot" /> API conectada</span>
          <span className="topbar-divider" />
          <span className="workspace-label">Gestão rural</span>
        </div>
      </header>

      <main id="inicio" className="page-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow"><Leaf size={14} /> OPERAÇÃO DE CAMPO</p>
            <h1>Visão da <em>pastagem</em></h1>
            <p className="page-subtitle">Acompanhe suas fazendas e organize cada área de cultivo.</p>
          </div>
          <button className="icon-button refresh-button" type="button" onClick={refreshData} title="Atualizar dados" aria-label="Atualizar dados">
            <RefreshCw size={17} />
          </button>
        </section>

        {error && (
          <div className="alert alert-error" role="alert">
            <CircleAlert size={18} />
            <span>{error}</span>
            <button className="alert-close" type="button" onClick={() => setError('')} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}
        {notice && (
          <div className="alert alert-success" role="status">
            <Check size={18} />
            <span>{notice}</span>
            <button className="alert-close" type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}

        <section className="summary-grid" aria-label="Resumo da fazenda selecionada">
          <div className="summary-item summary-accent">
            <div className="summary-label"><span>FAZENDAS</span><MapPin size={16} /></div>
            <strong>{isLoadingFarms ? '—' : farms.length.toString().padStart(2, '0')}</strong>
            <small>propriedades cadastradas</small>
          </div>
          <div className="summary-item">
            <div className="summary-label"><span>TALHÕES</span><Fence size={16} /></div>
            <strong>{isLoadingPaddocks ? '—' : paddocks.length.toString().padStart(2, '0')}</strong>
            <small>{selectedFarm ? selectedFarm.name : 'selecione uma fazenda'}</small>
          </div>
          <div className="summary-item">
            <div className="summary-label"><span>ÁREA MAPEADA</span><Ruler size={16} /></div>
            <strong>{isLoadingPaddocks ? '—' : formatNumber(totalArea)}<small className="unit"> ha</small></strong>
            <small>na fazenda selecionada</small>
          </div>
          <div className="summary-note">
            <span className="note-icon"><Leaf size={18} /></span>
            <p><strong>Campo em foco</strong><br />Cada talhão conta para uma gestão mais precisa.</p>
            <ArrowDownRight size={17} className="note-arrow" />
          </div>
        </section>

        <section className="management-grid">
          <section className="management-panel farms-panel" aria-labelledby="farms-title">
            <div className="panel-heading">
              <div className="panel-title-wrap">
                <span className="section-index">01</span>
                <div>
                  <h2 id="farms-title">Fazendas</h2>
                  <p>Suas propriedades rurais</p>
                </div>
              </div>
              <button className="button button-dark" type="button" onClick={() => setShowFarmForm((visible) => !visible)}>
                {showFarmForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showFarmForm ? 'Fechar' : 'Nova fazenda'}</span>
              </button>
            </div>

            {showFarmForm && (
              <form className="inline-form farm-form" onSubmit={handleCreateFarm}>
                <div className="form-heading"><span>CADASTRO DE PROPRIEDADE</span><span className="required-label">* obrigatório</span></div>
                <label className="field-label" htmlFor="farm-name">Nome da fazenda</label>
                <input id="farm-name" name="name" placeholder="Ex.: Fazenda Boa Vista" required maxLength={120} />
                <label className="field-label" htmlFor="farm-owner">Responsável</label>
                <input id="farm-owner" name="ownerName" placeholder="Nome do proprietário" required maxLength={120} />
                <button className="button button-green form-submit" type="submit" disabled={isSavingFarm}>
                  {isSavingFarm ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                  {isSavingFarm ? 'Salvando...' : 'Salvar fazenda'}
                </button>
              </form>
            )}

            <div className="list-caption"><span>PROPRIEDADE</span><span>ÁREA</span></div>
            <div className="farm-list">
              {isLoadingFarms ? (
                <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>Carregando fazendas...</span></div>
              ) : farms.length ? (
                farms.map((farm, index) => (
                  <button
                    key={farm.id}
                    type="button"
                    className={`farm-row${selectedFarmId === farm.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedFarmId(farm.id)}
                    aria-pressed={selectedFarmId === farm.id}
                  >
                    <span className={`farm-avatar avatar-${index % 4}`}><MapPin size={17} /></span>
                    <span className="farm-details">
                      <strong>{farm.name}</strong>
                      <span><UserRound size={13} /> {farm.ownerName}</span>
                    </span>
                    <span className="farm-area">{selectedFarmId === farm.id ? <><span className="selected-marker" />Ativa</> : <ArrowUpRight size={16} />}</span>
                  </button>
                ))
              ) : (
                <div className="empty-state empty-farms">
                  <span className="empty-icon"><MapPin size={21} /></span>
                  <strong>Nenhuma fazenda cadastrada</strong>
                  <span>Adicione sua primeira propriedade para começar.</span>
                  <button className="text-button" type="button" onClick={() => setShowFarmForm(true)}>Cadastrar fazenda <ArrowUpRight size={14} /></button>
                </div>
              )}
            </div>
            <div className="panel-footer"><span><span className="footer-dot" /> {farms.length} {farms.length === 1 ? 'propriedade' : 'propriedades'}</span><span>Atualizado agora</span></div>
          </section>

          <section className="management-panel paddocks-panel" aria-labelledby="paddocks-title">
            <div className="panel-heading paddock-heading">
              <div className="panel-title-wrap">
                <span className="section-index section-index-coral">02</span>
                <div>
                  <h2 id="paddocks-title">Talhões</h2>
                  <p>{selectedFarm ? <>Áreas de <strong>{selectedFarm.name}</strong></> : 'Áreas divididas por fazenda'}</p>
                </div>
              </div>
              <button className="button button-outline" type="button" onClick={() => setShowPaddockForm((visible) => !visible)} disabled={!selectedFarm}>
                {showPaddockForm ? <X size={16} /> : <Plus size={16} />}
                <span>{showPaddockForm ? 'Fechar' : 'Novo talhão'}</span>
              </button>
            </div>

            {showPaddockForm && selectedFarm && (
              <form className="inline-form paddock-form" onSubmit={handleCreatePaddock}>
                <div className="form-heading"><span>NOVO TALHÃO</span><span className="farm-context"><MapPin size={12} /> {selectedFarm.name}</span></div>
                <label className="field-label" htmlFor="paddock-name">Nome do talhão</label>
                <input id="paddock-name" name="name" placeholder="Ex.: Pasto norte" required maxLength={120} />
                <label className="field-label" htmlFor="paddock-area">Área em hectares</label>
                <div className="input-with-unit"><input id="paddock-area" name="areaHectares" type="number" placeholder="0,0" min="0.01" step="0.01" required /><span>ha</span></div>
                <button className="button button-green form-submit" type="submit" disabled={isSavingPaddock}>
                  {isSavingPaddock ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                  {isSavingPaddock ? 'Salvando...' : 'Salvar talhão'}
                </button>
              </form>
            )}

            {!selectedFarm ? (
              <div className="empty-state paddock-empty">
                <span className="empty-icon empty-icon-coral"><Fence size={21} /></span>
                <strong>Escolha uma fazenda</strong>
                <span>Selecione uma propriedade ao lado para visualizar seus talhões.</span>
                <ChevronDown size={16} className="empty-down" />
              </div>
            ) : isLoadingPaddocks ? (
              <div className="loading-state paddock-loading"><LoaderCircle className="spin" size={20} /><span>Buscando talhões...</span></div>
            ) : paddocks.length ? (
              <div className="paddock-table-wrap">
                <div className="paddock-table-head"><span>TALHÃO</span><span>ÁREA</span><span>UNIDADE</span></div>
                <div className="paddock-list">
                  {paddocks.map((paddock, index) => (
                    <div className="paddock-row" key={paddock.id}>
                      <span className={`paddock-symbol paddock-symbol-${index % 3}`}><Sprout size={17} /></span>
                      <span className="paddock-name"><strong>{paddock.name}</strong><small>Talhão {String(index + 1).padStart(2, '0')}</small></span>
                      <strong className="paddock-area">{formatNumber(paddock.areaHectares)}</strong>
                      <span className="hectare-unit">ha</span>
                    </div>
                  ))}
                </div>
                <div className="paddock-total"><span>Área total mapeada</span><strong>{formatNumber(totalArea)} <small>ha</small></strong></div>
              </div>
            ) : (
              <div className="empty-state paddock-empty">
                <span className="empty-icon empty-icon-coral"><Fence size={21} /></span>
                <strong>Esta fazenda ainda não tem talhões</strong>
                <span>Divida a área em talhões para acompanhar melhor a operação.</span>
                <button className="text-button text-button-coral" type="button" onClick={() => setShowPaddockForm(true)}>Adicionar primeiro talhão <ArrowUpRight size={14} /></button>
              </div>
            )}
            <div className="panel-footer"><span><span className="footer-dot footer-dot-coral" /> {paddocks.length} {paddocks.length === 1 ? 'talhão' : 'talhões'}</span><span>{selectedFarm ? 'Por fazenda' : 'Sem seleção'}</span></div>
          </section>
        </section>

        <footer className="page-footer"><span>PASTAGEM <span>·</span> GESTÃO DE CAMPO</span><span>Feito para crescer junto com a terra <Leaf size={13} /></span></footer>
      </main>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Não foi possível conectar à API. Confira se o NestJS está rodando na porta 3000.';
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}

export default App;
