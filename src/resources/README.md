# Cadastros de gestão

O módulo `records` disponibiliza CRUD para os cadastros do domínio pecuário e
de pastagens. A interface está disponível em **Funcionalidades** no frontend.

## API

Todos os recursos usam os endpoints abaixo:

| Método | Endpoint | Ação |
| --- | --- | --- |
| `GET` | `/records/{recurso}` | Listar |
| `GET` | `/records/{recurso}/{id}` | Consultar |
| `POST` | `/records/{recurso}` | Criar |
| `PUT` | `/records/{recurso}/{id}` | Atualizar |
| `DELETE` | `/records/{recurso}/{id}` | Excluir |

Recursos: `users`, `farms`, `paddocks`, `lots`, `cultivars`, `animals`,
`weighings`, `zootechnical-events`, `occupations`, `pasture-measurements`,
`stocking-calculations`, `inputs`, `input-applications` e `alerts`.

Os campos da API usam nomes em inglês (por exemplo, `birthDate`,
`weightKg` e `paddockId`). Os valores controlados seguem os valores do
domínio: perfil (`pecuarista`, `manejador`), canal (`whatsapp`, `app`),
status do piquete (`livre`, `ocupado`, `manutencao`), tipo de cultivar
(`graminea`, `leguminosa`), evento (`reprodutivo`, `sanitario`), origem
da medição (`manual`, `satelite`), tipo de insumo (`adubo`, `defensivo`,
`sanitario`) e status do alerta (`aberto`, `resolvido`, `ignorado`).

Os endpoints legados `/farms` e `/paddocks` continuam disponíveis para
compatibilidade com o dashboard existente. Os IDs desses dois cadastros
continuam UUIDs para preservar os registros já salvos; as novas entidades
usam IDs inteiros autoincrementais.

## Atualizar o banco local

Após atualizar o código, aplique as novas tabelas e campos no SQLite:

```bash
npx prisma db push
```

O comando preserva os dados de fazendas e piquetes e preenche os novos campos
com valores padrão.
