import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Prisma } from '../generated/prisma/client';

/**
 * One-off operator import of the 2026/27 member fee sheet.
 *
 * Dry-run by default: validates the JSON contract, connects, diffs against the
 * database and prints the plan without writing. `--apply` performs every write
 * inside one interactive transaction with an explicit timeout, so a failure
 * leaves zero changes. The banner prints the database host only, never
 * credentials or the full connection string.
 */

const SOURCE_PATH = 'scripts/data/socios-cotas-2026.json';
const DATABASE_URL_ERROR =
  'DATABASE_URL em falta ou inválido (corre a partir da raiz do repo, com .env).';

const USAGE = `Uso: npx tsx scripts/import-socios.ts [--apply]

  (sem flags)  Dry-run: valida e mostra o que seria criado ou atualizado.
  --apply      Grava sócios, cotas e pagamentos numa única transação.
  -h, --help   Mostra esta ajuda.`;

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarDate = (value: string): boolean => {
  if (!CALENDAR_DATE.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const paymentSchema = z
  .object({
    year: z.number().int('ano da cota inválido'),
    paidAt: z
      .string()
      .refine(isCalendarDate, 'data inválida (YYYY-MM-DD)')
      .nullable(),
    halfFee: z.boolean({ invalid_type_error: 'meia cota inválida' }),
  })
  .strict();

const memberSchema = z
  .object({
    number: z.number().int('número inválido').min(1, 'número inválido'),
    name: z.string().trim().min(3, 'nome demasiado curto').max(250, 'nome demasiado longo'),
    memberSince: z
      .number()
      .int('ano de sócio inválido')
      .min(1950, 'ano de sócio inválido')
      .max(new Date().getFullYear() + 1, 'ano de sócio inválido')
      .nullable(),
    payments: z.array(paymentSchema),
  })
  .strict();

const importSchema = z
  .object({
    source: z.string().min(1, 'origem em falta'),
    sheetUpdatedAt: z
      .string()
      .refine(isCalendarDate, 'data inválida (YYYY-MM-DD)'),
    fees: z
      .array(z.number().int('cota inválida').min(2000, 'cota inválida').max(2100, 'cota inválida'))
      .length(4, 'devem existir 4 cotas'),
    members: z.array(memberSchema).length(30, 'devem existir 30 sócios'),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (let index = 1; index < value.fees.length; index += 1) {
      if (value.fees[index] <= value.fees[index - 1]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fees'],
          message: 'as cotas devem ser únicas e crescentes',
        });
        break;
      }
    }

    const feeYears = new Set(value.fees);
    const memberNumbers = new Set<number>();

    value.members.forEach((member, memberIndex) => {
      if (memberNumbers.has(member.number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['members', memberIndex, 'number'],
          message: 'número de sócio repetido',
        });
      }
      memberNumbers.add(member.number);

      const paymentYears = new Set<number>();
      member.payments.forEach((payment, paymentIndex) => {
        if (!feeYears.has(payment.year)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['members', memberIndex, 'payments', paymentIndex, 'year'],
            message: 'cota fora da lista de cotas',
          });
        }
        if (paymentYears.has(payment.year)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['members', memberIndex, 'payments', paymentIndex, 'year'],
            message: 'cota repetida no sócio',
          });
        }
        paymentYears.add(payment.year);
      });
    });
  });

type ImportData = z.infer<typeof importSchema>;

type MemberRecord = {
  id: string;
  number: number;
  name: string;
  memberSince: number | null;
};

type FeeRecord = {
  id: string;
  year: number;
};

type PaymentRecord = {
  id: string;
  memberId: string;
  feeId: string;
  paidAt: Date | null;
  halfFee: boolean;
};

type CurrentState = {
  members: MemberRecord[];
  fees: FeeRecord[];
  payments: PaymentRecord[];
};

type MemberWrite = {
  number: number;
  name: string;
  memberSince: number | null;
};

type PaymentWrite = {
  memberNumber: number;
  feeYear: number;
  paidAt: Date | null;
  halfFee: boolean;
};

type Plan = {
  fees: { create: number[]; existing: number };
  members: {
    create: MemberWrite[];
    update: { id: string; data: MemberWrite }[];
    unchanged: number;
  };
  payments: {
    create: PaymentWrite[];
    update: { id: string; paidAt: Date | null; halfFee: boolean }[];
    unchanged: number;
  };
};

type Options = { apply: boolean; help: boolean };

let connectionString: string | null = null;

const fail = (message: string): never => {
  console.error(`Erro: ${message}`);
  process.exit(1);
};

const parseOptions = (args: string[]): Options => {
  const options: Options = { apply: false, help: false };

  for (const arg of args) {
    if (arg === '--apply') {
      options.apply = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    console.error(USAGE);
    process.exit(2);
  }

  return options;
};

const readDatabase = (): { connectionString: string; host: string } => {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    return fail(DATABASE_URL_ERROR);
  }

  try {
    const parsed = new URL(value);
    if (!parsed.host) {
      return fail(DATABASE_URL_ERROR);
    }
    return { connectionString: value, host: parsed.host };
  } catch {
    return fail(DATABASE_URL_ERROR);
  }
};

const formatIssue = (issue: z.ZodIssue): string => {
  const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'raiz';
  return `${path}: ${issue.message}`;
};

const loadData = (): ImportData => {
  const dataUrl = new URL('./data/socios-cotas-2026.json', import.meta.url);

  let content: string;
  try {
    content = readFileSync(fileURLToPath(dataUrl), 'utf8');
  } catch {
    return fail(`${SOURCE_PATH}: ficheiro não encontrado`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return fail(`${SOURCE_PATH}: JSON inválido`);
  }

  const parsed = importSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(formatIssue(parsed.error.issues[0]));
  }

  return parsed.data;
};

const loadState = async (
  db: Prisma.TransactionClient,
  data: ImportData,
): Promise<CurrentState> => {
  const members = await db.member.findMany({
    where: { number: { in: data.members.map((member) => member.number) } },
    select: { id: true, number: true, name: true, memberSince: true },
  });
  const fees = await db.fee.findMany({
    where: { year: { in: data.fees } },
    select: { id: true, year: true },
  });
  const payments = await db.feePayment.findMany({
    where: { memberId: { in: members.map((member) => member.id) } },
    select: { id: true, memberId: true, feeId: true, paidAt: true, halfFee: true },
  });

  return { members, fees, payments };
};

const sameDate = (left: Date | null, right: Date | null): boolean => {
  if (left === null || right === null) {
    return left === right;
  }
  return left.getTime() === right.getTime();
};

const toDate = (value: string | null): Date | null =>
  value === null ? null : new Date(`${value}T00:00:00.000Z`);

const buildPlan = (data: ImportData, state: CurrentState): Plan => {
  const memberByNumber = new Map(state.members.map((member) => [member.number, member]));
  const feeByYear = new Map(state.fees.map((fee) => [fee.year, fee]));
  const paymentKey = (memberId: string, feeId: string): string => `${memberId}:${feeId}`;
  const paymentByKey = new Map(
    state.payments.map((payment) => [paymentKey(payment.memberId, payment.feeId), payment]),
  );

  const plan: Plan = {
    fees: { create: [], existing: 0 },
    members: { create: [], update: [], unchanged: 0 },
    payments: { create: [], update: [], unchanged: 0 },
  };

  for (const year of data.fees) {
    if (feeByYear.has(year)) {
      plan.fees.existing += 1;
    } else {
      plan.fees.create.push(year);
    }
  }

  for (const member of data.members) {
    const existing = memberByNumber.get(member.number);
    const write: MemberWrite = {
      number: member.number,
      name: member.name,
      memberSince: member.memberSince,
    };

    if (!existing) {
      plan.members.create.push(write);
    } else if (existing.name !== write.name || existing.memberSince !== write.memberSince) {
      plan.members.update.push({ id: existing.id, data: write });
    } else {
      plan.members.unchanged += 1;
    }
  }

  for (const member of data.members) {
    const existingMember = memberByNumber.get(member.number);

    for (const payment of member.payments) {
      const fee = feeByYear.get(payment.year);
      const existingPayment =
        existingMember && fee
          ? paymentByKey.get(paymentKey(existingMember.id, fee.id))
          : undefined;
      const paidAt = toDate(payment.paidAt);

      if (!existingPayment) {
        plan.payments.create.push({
          memberNumber: member.number,
          feeYear: payment.year,
          paidAt,
          halfFee: payment.halfFee,
        });
      } else if (!sameDate(existingPayment.paidAt, paidAt) || existingPayment.halfFee !== payment.halfFee) {
        plan.payments.update.push({ id: existingPayment.id, paidAt, halfFee: payment.halfFee });
      } else {
        plan.payments.unchanged += 1;
      }
    }
  }

  return plan;
};

const countPayments = (data: ImportData): number =>
  data.members.reduce((total, member) => total + member.payments.length, 0);

const printHeader = (data: ImportData, host: string, mode: string): void => {
  console.log('Import de sócios · cotas');
  console.log(`Origem: ${SOURCE_PATH}`);
  console.log(`BD: ${host} (${mode})`);
  console.log(
    `Plano: ${data.members.length} sócios, ${data.fees.length} cotas, ${countPayments(data)} pagamentos`,
  );
};

const printDryRun = (data: ImportData, host: string, plan: Plan): void => {
  printHeader(data, host, 'dry-run');
  console.log(
    `Sócios: ${plan.members.create.length} a criar, ${plan.members.update.length} a atualizar, ${plan.members.unchanged} inalterados`,
  );
  console.log(
    `Cotas: ${plan.fees.create.length} a criar, ${plan.fees.existing} existentes`,
  );
  console.log(
    `Pagamentos: ${plan.payments.create.length} a criar, ${plan.payments.update.length} a atualizar, ${plan.payments.unchanged} inalterados`,
  );
  console.log('Dry-run: nada foi escrito. Usa --apply para gravar.');
};

const printApply = (data: ImportData, host: string, plan: Plan): void => {
  printHeader(data, host, 'aplicar');
  console.log(
    `Sócios: ${plan.members.create.length} criados, ${plan.members.update.length} atualizados, ${plan.members.unchanged} inalterados`,
  );
  console.log(`Cotas: ${plan.fees.create.length} criadas, ${plan.fees.existing} existentes`);
  console.log(
    `Pagamentos: ${plan.payments.create.length} criados, ${plan.payments.update.length} atualizados, ${plan.payments.unchanged} inalterados`,
  );
  console.log('Aplicado numa transação.');
};

const executePlan = async (
  tx: Prisma.TransactionClient,
  state: CurrentState,
  plan: Plan,
): Promise<void> => {
  const feeIdByYear = new Map(state.fees.map((fee) => [fee.year, fee.id]));
  for (const year of plan.fees.create) {
    const fee = await tx.fee.create({
      data: { year },
      select: { id: true, year: true },
    });
    feeIdByYear.set(fee.year, fee.id);
  }

  const memberIdByNumber = new Map(
    state.members.map((member) => [member.number, member.id]),
  );
  for (const member of plan.members.create) {
    const created = await tx.member.create({
      data: {
        number: member.number,
        name: member.name,
        memberSince: member.memberSince,
      },
      select: { id: true, number: true },
    });
    memberIdByNumber.set(created.number, created.id);
  }

  for (const member of plan.members.update) {
    await tx.member.update({
      where: { id: member.id },
      data: { name: member.data.name, memberSince: member.data.memberSince },
    });
  }

  for (const payment of plan.payments.create) {
    const memberId = memberIdByNumber.get(payment.memberNumber);
    const feeId = feeIdByYear.get(payment.feeYear);
    if (!memberId || !feeId) {
      throw new Error(
        `referência em falta para o sócio ${payment.memberNumber} / cota ${payment.feeYear}`,
      );
    }
    await tx.feePayment.create({
      data: {
        memberId,
        feeId,
        paidAt: payment.paidAt,
        halfFee: payment.halfFee,
      },
    });
  }

  for (const payment of plan.payments.update) {
    await tx.feePayment.update({
      where: { id: payment.id },
      data: { paidAt: payment.paidAt, halfFee: payment.halfFee },
    });
  }
};

const main = async (): Promise<void> => {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE);
    return;
  }

  const database = readDatabase();
  connectionString = database.connectionString;
  const data = loadData();

  const { prisma } = await import('../src/lib/prisma');

  try {
    if (!options.apply) {
      const state = await loadState(prisma, data);
      printDryRun(data, database.host, buildPlan(data, state));
      return;
    }

    const plan = await prisma.$transaction(
      async (tx) => {
        const state = await loadState(tx, data);
        const plan = buildPlan(data, state);
        await executePlan(tx, state, plan);
        return plan;
      },
      { maxWait: 10_000, timeout: 60_000 },
    );

    printApply(data, database.host, plan);
  } finally {
    await prisma.$disconnect();
  }
};

const describeError = (error: unknown): string => {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null;
  const raw = error instanceof Error ? error.message : String(error);
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  const message = lines.length > 0 ? lines[lines.length - 1] : 'erro desconhecido';
  let output = code ? `${code} ${message}` : message;

  if (connectionString) {
    output = output.split(connectionString).join('<DATABASE_URL>');
  }

  return output.replace(/postgres(?:ql)?:\/\/\S+/g, '<DATABASE_URL>');
};

main().catch((error: unknown) => {
  fail(describeError(error));
});
