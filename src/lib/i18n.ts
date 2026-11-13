import type { CrudOperators, I18nProvider } from '@refinedev/core';

export const FILTER_OPERATOR_LABELS: Record<
  Exclude<CrudOperators, 'or' | 'and'>,
  string
> = {
  eq: 'Igual a',
  ne: 'Diferente de',
  eqs: 'Igual a (sensível a maiúsculas)',
  nes: 'Diferente de (sensível a maiúsculas)',
  lt: 'Menor que',
  gt: 'Maior que',
  lte: 'Menor ou igual a',
  gte: 'Maior ou igual a',
  in: 'Incluído num conjunto',
  nin: 'Não incluído num conjunto',
  ina: 'Incluído num conjunto (sensível a maiúsculas)',
  nina: 'Não incluído num conjunto (sensível a maiúsculas)',
  contains: 'Contém',
  ncontains: 'Não contém',
  containss: 'Contém (sensível a maiúsculas)',
  ncontainss: 'Não contém (sensível a maiúsculas)',
  between: 'Entre',
  nbetween: 'Não entre',
  null: 'É nulo',
  nnull: 'Não é nulo',
  startswith: 'Começa por',
  nstartswith: 'Não começa por',
  startswiths: 'Começa por (sensível a maiúsculas)',
  nstartswiths: 'Não começa por (sensível a maiúsculas)',
  endswith: 'Termina em',
  nendswith: 'Não termina em',
  endswiths: 'Termina em (sensível a maiúsculas)',
  nendswiths: 'Não termina em (sensível a maiúsculas)',
};

const operatorLabels = Object.fromEntries(
  Object.entries(FILTER_OPERATOR_LABELS).map(([operator, label]) => [
    `table.filter.operator.${operator}`,
    label,
  ]),
);

const dictionary: Record<string, string | undefined> = {
  ...operatorLabels,

  'buttons.create': 'Criar',
  'buttons.refresh': 'Atualizar',
  'buttons.edit': 'Editar',
  'buttons.show': 'Ver',
  'buttons.delete': 'Eliminar',
  'buttons.cancel': 'Cancelar',
  'buttons.confirm': 'Tem a certeza?',
  'buttons.undo': 'Anular',
  'buttons.apply': 'Aplicar',
  'buttons.clear': 'Limpar',
  'buttons.save': 'Guardar',
  'buttons.list': 'Listar',
  'buttons.clone': 'Duplicar',

  'actions.create': 'Criar',
  'actions.edit': 'Editar',
  'actions.show': 'Ver',
  'actions.list': 'Listar',
  'actions.clone': 'Duplicar',

  'notifications.success': 'Sucesso',
  'notifications.createSuccess': 'Registo criado com sucesso.',
  'notifications.updateSuccess': 'Registo atualizado com sucesso.',
  'notifications.deleteSuccess': 'Registo eliminado com sucesso.',
  'notifications.error': 'Não foi possível concluir a operação.',

  'pages.login.title': 'Entrar na sua conta',
  'pages.login.signin': 'Entrar',
  'pages.login.fields.email': 'Email',
  'pages.login.fields.password': 'Palavra-passe',
  'pages.login.buttons.rememberMe': 'Lembrar-me',

  'pages.error.title': 'Página não encontrada.',
  'pages.error.description': 'A página que procura não existe.',
  'pages.error.backHome': 'Voltar ao início',

  'table.filter.text.placeholder': 'Filtrar por...',
  'table.filter.numeric.placeholder': 'Filtrar por...',
  'table.filter.combobox.placeholder': 'Selecione...',
  'table.filter.combobox.search': 'Pesquisar...',
  'table.filter.combobox.noResults': 'Nenhum resultado encontrado.',
  'table.filter.operator.placeholder': 'Pesquisar operador...',
  'table.filter.operator.noResults': 'Nenhum operador encontrado.',
};

const interpolate = (template: string, values?: Record<string, unknown>) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = values[name];

    return value === undefined || value === null ? match : String(value);
  });
};

export const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    const template = dictionary[key];

    if (template === undefined) {
      return typeof options === 'string' && defaultMessage === undefined
        ? options
        : defaultMessage ?? key;
    }

    return interpolate(
      template,
      typeof options === 'object' && options !== null
        ? (options as Record<string, unknown>)
        : undefined,
    );
  },
  changeLocale: () => undefined,
  getLocale: () => 'pt-PT',
};
