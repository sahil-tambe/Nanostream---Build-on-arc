import { relations } from 'drizzle-orm';
import { boolean, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Wallets table (Circle SDK Managed User Wallet on Arc Settlement)
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  walletId: text('wallet_id').notNull().unique(), // Circle Wallet UUID
  address: text('address').notNull(), // Arc EVM wallet address 0x...
  blockchain: text('blockchain').default('Arc-Settlement-Testnet').notNull(),
  balanceUsdc: numeric('balance_usdc', { precision: 12, scale: 6 }).default('50.000000').notNull(),
  autoStreamEnabled: boolean('auto_stream_enabled').default(true).notNull(),
  microRateCap: numeric('micro_rate_cap', { precision: 10, scale: 6 }).default('0.050000').notNull(),
  dailyBudgetCap: numeric('daily_budget_cap', { precision: 10, scale: 2 }).default('10.000000').notNull(),
  spentTodayUsdc: numeric('spent_today_usdc', { precision: 10, scale: 6 }).default('0.000000').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. x402-compatible micro-services / APIs marketplace
export const x402Services = pgTable('x402_services', {
  id: serial('id').primaryKey(),
  serviceId: text('service_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  developerWallet: text('developer_wallet').notNull(),
  pricePerUnitUsdc: numeric('price_per_unit_usdc', { precision: 10, scale: 6 }).notNull(),
  unitName: text('unit_name').notNull(), // e.g., 'call', 'token', 'query'
  category: text('category').notNull(),
  totalCalls: integer('total_calls').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Transactions table for streaming nanopayments
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  txHash: text('tx_hash').notNull().unique(), // Arc settlement tx hash
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  walletId: integer('wallet_id')
    .references(() => wallets.id)
    .notNull(),
  serviceId: text('service_id').notNull(),
  senderAddress: text('sender_address').notNull(),
  receiverAddress: text('receiver_address').notNull(),
  amountUsdc: numeric('amount_usdc', { precision: 12, scale: 6 }).notNull(),
  status: text('status').notNull(), // 'SETTLED', 'PENDING', 'FAILED'
  x402HeaderCode: text('x402_header_code').default('200 OK / x402-PAID'),
  executionTimeMs: integer('execution_time_ms').default(15),
  promptTokenCount: integer('prompt_token_count').default(0),
  metadataJson: text('metadata_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. System & Financial Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  severity: text('severity').default('INFO').notNull(), // INFO, WARN, ERROR, CRITICAL
  details: text('details').notNull(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  transactions: many(transactions),
  auditLogs: many(auditLogs),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  owner: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
