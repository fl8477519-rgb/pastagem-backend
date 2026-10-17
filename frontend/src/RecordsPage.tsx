import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, type ResourceRecord } from './api';
import {
  resourceDefinitions,
  type ResourceDefinition,
  type ResourceField,
} from './resource-config';

type FormValues = Record<string, string>;
type ReferenceOptions = Record<string, ResourceRecord[]>;

function toInputValue(value: unknown, type: ResourceField['type']): string {
  if (value === null || value === undefined) return '';
  if (type === 'references' && Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === 'object'
          ? String((item as ResourceRecord).id ?? '')
          : '',
      )
      .filter(Boolean)
      .join(',');
  }
  if (type === 'date' || type === 'datetime') {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';
    return type === 'date'
      ? date.toISOString().slice(0, 10)
      : date.toISOString().slice(0, 16);
  }
  return String(value);
}

function recordToValues(
  record: ResourceRecord,
  definition: ResourceDefinition,
): FormValues {
  return Object.fromEntries(
    definition.fields.map((field) => {
      if (field.name === 'farmIds') {
        return [field.name, toInputValue(record.farms, 'references')];
      }
      return [field.name, toInputValue(record[field.name], field.type)];
    }),
  );
}

function getRecordLabel(record: ResourceRecord) {
  for (const field of ['name', 'tag', 'message', 'id']) {
    const value = record[field];
    if (value !== undefined && value !== null && String(value).trim())
      return String(value);
  }
  return 'Registro';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}

export function RecordsPage() {
  const [selectedResource, setSelectedResource] = useState(
    resourceDefinitions[0].resource,
  );
  const [records, setRecords] = useState<ResourceRecord[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOptions>(
    {},
  );
  const [values, setValues] = useState<FormValues>({});
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const definition = useMemo(
    () =>
      resourceDefinitions.find((item) => item.resource === selectedResource) ??
      resourceDefinitions[0],
    [selectedResource],
  );
  const references = useMemo(
    () => [
      ...new Set(
        definition.fields
          .map((field) => field.reference)
          .filter((item): item is string => Boolean(item)),
      ),
    ],
    [definition],
  );

  async function loadRecords(resource = selectedResource) {
    setIsLoading(true);
    setError('');
    try {
      setRecords(await api.getRecords(resource));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;
    setIsFormOpen(false);
    setEditingId(null);
    setValues({});
    setIsLoading(true);
    setError('');
    api
      .getRecords(selectedResource)
      .then((result) => {
        if (isCurrent) setRecords(result);
      })
      .catch((requestError: unknown) => {
        if (isCurrent) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedResource]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all(
      references.map(
        async (resource) => [resource, await api.getRecords(resource)] as const,
      ),
    )
      .then((results) => {
        if (isCurrent) setReferenceOptions(Object.fromEntries(results));
      })
      .catch((requestError: unknown) => {
        if (isCurrent) setError(getErrorMessage(requestError));
      });
    return () => {
      isCurrent = false;
    };
  }, [references]);

  function openCreateForm() {
    setEditingId(null);
    setValues({});
    setIsFormOpen(true);
    setError('');
    setNotice('');
  }

  function openEditForm(record: ResourceRecord) {
    if (record.id === undefined || record.id === null) return;
    setEditingId(record.id);
    setValues(recordToValues(record, definition));
    setIsFormOpen(true);
    setError('');
    setNotice('');
  }

  function fieldValue(field: ResourceField) {
    if (
      field.name === 'generatedAt' &&
      !values[field.name] &&
      editingId === null
    )
      return '';
    if (field.name === 'confirmed' && values[field.name] === undefined)
      return 'false';
    return values[field.name] ?? '';
  }

  function setFieldValue(fieldName: string, value: string) {
    setValues((current) => ({ ...current, [fieldName]: value }));
  }

  function toPayload() {
    return Object.fromEntries(
      definition.fields.map((field) => {
        const value =
          values[field.name] ?? (field.name === 'confirmed' ? 'false' : '');
        if (field.type === 'references') {
          return [
            field.name,
            value
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean),
          ];
        }
        if (field.type === 'number' || field.type === 'integer') {
          return [
            field.name,
            value === '' && field.optional ? '' : Number(value),
          ];
        }
        if (field.type === 'boolean') return [field.name, value === 'true'];
        if (field.type === 'date' && value)
          return [field.name, `${value}T00:00:00.000Z`];
        if (field.type === 'datetime' && value)
          return [field.name, new Date(value).toISOString()];
        if (
          field.type === 'reference' &&
          value &&
          Number.isInteger(Number(value))
        ) {
          return [field.name, Number(value)];
        }
        return [field.name, value];
      }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = toPayload();
      if (editingId === null) {
        await api.createRecord(selectedResource, payload);
        setNotice('Registro cadastrado com sucesso.');
      } else {
        await api.updateRecord(selectedResource, editingId, payload);
        setNotice('Registro atualizado com sucesso.');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setValues({});
      await loadRecords(selectedResource);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(record: ResourceRecord) {
    if (record.id === undefined || record.id === null) return;
    if (
      !window.confirm(
        `Excluir "${getRecordLabel(record)}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    setError('');
    setNotice('');
    try {
      await api.deleteRecord(selectedResource, record.id);
      setNotice('Registro excluído com sucesso.');
      await loadRecords(selectedResource);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function renderField(field: ResourceField) {
    const value = fieldValue(field);
    const inputId = `record-${field.name}`;
    if (field.type === 'select') {
      return (
        <select
          id={inputId}
          name={field.name}
          value={value}
          onChange={(event) => setFieldValue(field.name, event.target.value)}
          required={!field.optional}
        >
          <option value="">Selecione...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'reference' || field.type === 'references') {
      const options = referenceOptions[field.reference ?? ''] ?? [];
      return (
        <select
          id={inputId}
          name={field.name}
          value={
            field.type === 'references'
              ? value.split(',').filter(Boolean)
              : value
          }
          multiple={field.type === 'references'}
          onChange={(event) => {
            if (field.type === 'references') {
              setFieldValue(
                field.name,
                Array.from(
                  event.target.selectedOptions,
                  (option) => option.value,
                ).join(','),
              );
            } else {
              setFieldValue(field.name, event.target.value);
            }
          }}
          required={!field.optional}
          size={
            field.type === 'references'
              ? Math.min(Math.max(options.length, 2), 4)
              : undefined
          }
        >
          {field.optional && field.type === 'reference' && (
            <option value="">Nenhum</option>
          )}
          {options.map((option) => (
            <option key={String(option.id)} value={String(option.id)}>
              {getRecordLabel(option)} · #{String(option.id)}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === 'boolean') {
      return (
        <select
          id={inputId}
          name={field.name}
          value={value}
          onChange={(event) => setFieldValue(field.name, event.target.value)}
        >
          <option value="false">Não</option>
          <option value="true">Sim</option>
        </select>
      );
    }
    return (
      <input
        id={inputId}
        name={field.name}
        type={
          field.type === 'integer' || field.type === 'number'
            ? 'number'
            : field.type === 'datetime'
              ? 'datetime-local'
              : (field.type ?? 'text')
        }
        step={field.type === 'number' ? 'any' : undefined}
        min={
          field.type === 'number' || field.type === 'integer' ? '0' : undefined
        }
        value={value}
        onChange={(event) => setFieldValue(field.name, event.target.value)}
        required={!field.optional}
      />
    );
  }

  return (
    <section className="records-page">
      <div className="records-heading">
        <div>
          <p className="eyebrow">CADASTROS E OPERAÇÃO</p>
          <h2>
            Gestão de <em>dados</em>
          </h2>
          <p>
            Cadastre, consulte, edite e remova usuários, rebanho e operações da
            propriedade.
          </p>
        </div>
        <button
          className="button button-dark"
          type="button"
          onClick={openCreateForm}
        >
          <Plus size={16} /> Novo registro
        </button>
      </div>

      {error && (
        <div className="records-message records-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="records-message records-success" role="status">
          {notice}
        </div>
      )}

      <div className="records-toolbar">
        <label htmlFor="resource-select">Funcionalidade</label>
        <select
          id="resource-select"
          value={selectedResource}
          onChange={(event) => setSelectedResource(event.target.value)}
        >
          {resourceDefinitions.map((item) => (
            <option key={item.resource} value={item.resource}>
              {item.label}
            </option>
          ))}
        </select>
        <span>
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {isFormOpen && (
        <form className="records-form" onSubmit={handleSubmit}>
          <div className="records-form-heading">
            <strong>
              {editingId === null
                ? `Novo cadastro · ${definition.label}`
                : `Editar cadastro · ${definition.label}`}
            </strong>
            <button
              className="icon-button"
              type="button"
              aria-label="Fechar formulário"
              onClick={() => setIsFormOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="records-fields">
            {definition.fields.map((field) => (
              <label
                className="records-field"
                htmlFor={`record-${field.name}`}
                key={field.name}
              >
                <span>
                  {field.label}
                  {field.optional ? ' (opcional)' : ''}
                </span>
                {renderField(field)}
              </label>
            ))}
          </div>
          <button
            className="button button-green"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      <div className="records-list">
        {isLoading ? (
          <div className="records-empty">
            <LoaderCircle className="spin" size={20} /> Carregando registros...
          </div>
        ) : records.length === 0 ? (
          <div className="records-empty">
            Nenhum registro cadastrado nesta funcionalidade.
          </div>
        ) : (
          records.map((record) => (
            <article className="record-card" key={String(record.id)}>
              <div className="record-card-content">
                <strong>{getRecordLabel(record)}</strong>
                <span>
                  {definition.fields
                    .slice(0, 3)
                    .map((field) => {
                      const value = record[field.name];
                      const rendered = Array.isArray(value)
                        ? value
                            .map((item) =>
                              item && typeof item === 'object'
                                ? getRecordLabel(item as ResourceRecord)
                                : String(item),
                            )
                            .join(', ')
                        : value === null || value === undefined || value === ''
                          ? '—'
                          : String(value);
                      return `${field.label}: ${rendered}`;
                    })
                    .join(' · ')}
                </span>
              </div>
              <div className="record-actions">
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Editar ${getRecordLabel(record)}`}
                  onClick={() => openEditForm(record)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button record-delete"
                  type="button"
                  aria-label={`Excluir ${getRecordLabel(record)}`}
                  onClick={() => void handleDelete(record)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
