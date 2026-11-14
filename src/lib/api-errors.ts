/**
 * User-facing API messages.
 *
 * Shared by the server handlers, the route handlers and the client-side
 * fallbacks so a message cannot drift from the comparator that reads it.
 * Internal detail (Prisma, SQL, ids, stacks) never belongs here.
 */
export const API_MESSAGES = {
  unauthorized: 'Não autorizado',
  invalidId: 'Identificador inválido',
  notFound: 'Não encontrado',
  validationFailed: 'Dados inválidos',
  invalidPayload: 'O pedido contém dados inválidos',
  serverError: 'Ocorreu um erro. Tente novamente.',
} as const;
