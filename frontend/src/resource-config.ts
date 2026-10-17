export type ResourceField = {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'number'
    | 'integer'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'select'
    | 'reference'
    | 'references';
  options?: string[];
  reference?: string;
  optional?: boolean;
};

export type ResourceDefinition = {
  resource: string;
  label: string;
  fields: ResourceField[];
};

export const resourceDefinitions: ResourceDefinition[] = [
  {
    resource: 'users',
    label: 'Usuários',
    fields: [
      { name: 'name', label: 'Nome' },
      { name: 'phone', label: 'Telefone' },
      {
        name: 'profile',
        label: 'Perfil',
        type: 'select',
        options: ['pecuarista', 'manejador'],
      },
      {
        name: 'alertChannel',
        label: 'Canal de alerta',
        type: 'select',
        options: ['whatsapp', 'app'],
      },
      {
        name: 'farmIds',
        label: 'Propriedades',
        type: 'references',
        reference: 'farms',
        optional: true,
      },
    ],
  },
  {
    resource: 'farms',
    label: 'Propriedades',
    fields: [
      { name: 'name', label: 'Nome' },
      { name: 'municipalityUf', label: 'Município/UF' },
      { name: 'totalAreaHa', label: 'Área total (ha)', type: 'number' },
      { name: 'ownerName', label: 'Responsável', optional: true },
    ],
  },
  {
    resource: 'paddocks',
    label: 'Piquetes',
    fields: [
      { name: 'name', label: 'Identificação' },
      { name: 'areaHectares', label: 'Área (ha)', type: 'number' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['livre', 'ocupado', 'manutencao'],
      },
      { name: 'coordinates', label: 'Coordenadas', optional: true },
      {
        name: 'farmId',
        label: 'Propriedade',
        type: 'reference',
        reference: 'farms',
      },
      {
        name: 'cultivarId',
        label: 'Cultivar',
        type: 'reference',
        reference: 'cultivars',
        optional: true,
      },
    ],
  },
  {
    resource: 'lots',
    label: 'Lotes',
    fields: [
      { name: 'name', label: 'Nome' },
      { name: 'category', label: 'Categoria' },
      { name: 'headCount', label: 'Quantidade de cabeças', type: 'integer' },
      {
        name: 'farmId',
        label: 'Propriedade',
        type: 'reference',
        reference: 'farms',
      },
    ],
  },
  {
    resource: 'cultivars',
    label: 'Cultivares',
    fields: [
      { name: 'name', label: 'Nome' },
      {
        name: 'type',
        label: 'Tipo',
        type: 'select',
        options: ['graminea', 'leguminosa'],
      },
      {
        name: 'entryHeightCm',
        label: 'Altura de entrada (cm)',
        type: 'number',
      },
      { name: 'exitHeightCm', label: 'Altura de saída (cm)', type: 'number' },
      { name: 'restDays', label: 'Dias de descanso', type: 'integer' },
    ],
  },
  {
    resource: 'animals',
    label: 'Animais',
    fields: [
      { name: 'tag', label: 'Brinco' },
      { name: 'sex', label: 'Sexo' },
      { name: 'breed', label: 'Raça' },
      { name: 'birthDate', label: 'Nascimento', type: 'date' },
      { name: 'lotId', label: 'Lote', type: 'reference', reference: 'lots' },
    ],
  },
  {
    resource: 'weighings',
    label: 'Pesagens',
    fields: [
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'weightKg', label: 'Peso (kg)', type: 'number' },
      {
        name: 'animalId',
        label: 'Animal',
        type: 'reference',
        reference: 'animals',
      },
    ],
  },
  {
    resource: 'zootechnical-events',
    label: 'Eventos zootécnicos',
    fields: [
      {
        name: 'type',
        label: 'Tipo',
        type: 'select',
        options: ['reprodutivo', 'sanitario'],
      },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'description', label: 'Descrição' },
      {
        name: 'animalId',
        label: 'Animal',
        type: 'reference',
        reference: 'animals',
      },
    ],
  },
  {
    resource: 'occupations',
    label: 'Ocupações',
    fields: [
      { name: 'entry', label: 'Entrada', type: 'datetime' },
      { name: 'exit', label: 'Saída', type: 'datetime', optional: true },
      {
        name: 'entryHeightCm',
        label: 'Altura de entrada (cm)',
        type: 'number',
      },
      {
        name: 'exitHeightCm',
        label: 'Altura de saída (cm)',
        type: 'number',
        optional: true,
      },
      {
        name: 'paddockId',
        label: 'Piquete',
        type: 'reference',
        reference: 'paddocks',
      },
      { name: 'lotId', label: 'Lote', type: 'reference', reference: 'lots' },
    ],
  },
  {
    resource: 'pasture-measurements',
    label: 'Medições de pasto',
    fields: [
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'averageHeightCm', label: 'Altura média (cm)', type: 'number' },
      { name: 'biomassKgDmHa', label: 'Biomassa (kg MS/ha)', type: 'number' },
      {
        name: 'origin',
        label: 'Origem',
        type: 'select',
        options: ['manual', 'satelite'],
      },
      {
        name: 'paddockId',
        label: 'Piquete',
        type: 'reference',
        reference: 'paddocks',
      },
    ],
  },
  {
    resource: 'stocking-calculations',
    label: 'Cálculos de lotação',
    fields: [
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'capacityUaHa', label: 'Capacidade (UA/ha)', type: 'number' },
      { name: 'suggestedAnimals', label: 'Animais sugeridos', type: 'integer' },
      { name: 'confirmed', label: 'Confirmado', type: 'boolean' },
      {
        name: 'paddockId',
        label: 'Piquete',
        type: 'reference',
        reference: 'paddocks',
      },
    ],
  },
  {
    resource: 'inputs',
    label: 'Insumos',
    fields: [
      { name: 'name', label: 'Nome' },
      {
        name: 'type',
        label: 'Tipo',
        type: 'select',
        options: ['adubo', 'defensivo', 'sanitario'],
      },
      { name: 'withholdingDays', label: 'Dias de carência', type: 'integer' },
      {
        name: 'farmId',
        label: 'Propriedade',
        type: 'reference',
        reference: 'farms',
      },
    ],
  },
  {
    resource: 'input-applications',
    label: 'Aplicações de insumo',
    fields: [
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'quantity', label: 'Quantidade', type: 'number' },
      { name: 'withholdingEnd', label: 'Fim da carência', type: 'date' },
      {
        name: 'inputId',
        label: 'Insumo',
        type: 'reference',
        reference: 'inputs',
      },
      {
        name: 'paddockId',
        label: 'Piquete',
        type: 'reference',
        reference: 'paddocks',
      },
    ],
  },
  {
    resource: 'alerts',
    label: 'Alertas',
    fields: [
      { name: 'type', label: 'Tipo' },
      { name: 'severity', label: 'Gravidade' },
      { name: 'message', label: 'Mensagem' },
      {
        name: 'generatedAt',
        label: 'Gerado em',
        type: 'datetime',
        optional: true,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['aberto', 'resolvido', 'ignorado'],
      },
      {
        name: 'farmId',
        label: 'Propriedade',
        type: 'reference',
        reference: 'farms',
        optional: true,
      },
      {
        name: 'paddockId',
        label: 'Piquete',
        type: 'reference',
        reference: 'paddocks',
        optional: true,
      },
    ],
  },
];
