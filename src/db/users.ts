import { db, isPostgresConfigured } from './index.ts';
import { users, wallets, transactions, auditLogs, x402Services } from './schema.ts';
import { eq, sql, desc } from 'drizzle-orm';

// In-Memory Fallback State (High-Performance & Resilient)
export interface InMemoryUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

export interface InMemoryWallet {
  id: number;
  userId: number;
  walletId: string;
  address: string;
  blockchain: string;
  balanceUsdc: string;
  autoStreamEnabled: boolean;
  microRateCap: string;
  dailyBudgetCap: string;
  spentTodayUsdc: string;
  updatedAt: string;
}

export interface InMemoryService {
  id: number;
  serviceId: string;
  name: string;
  description: string;
  developerWallet: string;
  pricePerUnitUsdc: string;
  unitName: string;
  category: string;
  totalCalls: number;
  createdAt: string;
}

export interface InMemoryTransaction {
  id: number;
  txHash: string;
  userId: number;
  walletId: number;
  serviceId: string;
  senderAddress: string;
  receiverAddress: string;
  amountUsdc: string;
  status: string;
  x402HeaderCode: string;
  executionTimeMs: number;
  promptTokenCount: number;
  metadataJson: string;
  createdAt: string;
}

export interface InMemoryAuditLog {
  id: number;
  userId: number;
  action: string;
  severity: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

// Initial In-Memory State
const memoryStore = {
  users: new Map<string, InMemoryUser>(),
  wallets: new Map<number, InMemoryWallet>(),
  transactions: [] as InMemoryTransaction[],
  auditLogs: [] as InMemoryAuditLog[],
  services: [
    {
      id: 1,
      serviceId: 'gemini-flash-ai',
      name: 'Gemini 2.5 Flash AI Stream',
      description: 'Ultra-fast multimodal LLM reasoning & dynamic generation via Circle Agent Stack',
      developerWallet: '0x38F4e81a02931Bc15783A148943641bE9B56588A',
      pricePerUnitUsdc: '0.000200',
      unitName: 'generation',
      category: 'AI & LLM Inference',
      totalCalls: 489,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      serviceId: 'fin-sentiment-stream',
      name: 'Financial Sentiment Stream',
      description: 'Real-time aggregated orderbook & token sentiment analytics for Arc Ecosystem',
      developerWallet: '0x81C748a04913A61E3486105312a01391F099e034',
      pricePerUnitUsdc: '0.000150',
      unitName: 'tick',
      category: 'Market Analytics',
      totalCalls: 1240,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      serviceId: 'arc-compute-node',
      name: 'Arc Distributed Compute Node',
      description: 'High-throughput cryptographic execution & matrix computation container',
      developerWallet: '0x992B4527F38a531201943817491A82C7481b6721',
      pricePerUnitUsdc: '0.000500',
      unitName: 'exec',
      category: 'Decentralized Compute',
      totalCalls: 312,
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      serviceId: 'vector-search-ai',
      name: 'High-Density Vector Index',
      description: 'Sub-millisecond cosine vector lookup over 10M embeddings with zero lock-in',
      developerWallet: '0x228E821a719234A01847101B61947261903eB221',
      pricePerUnitUsdc: '0.000100',
      unitName: 'query',
      category: 'Vector Database',
      totalCalls: 890,
      createdAt: new Date().toISOString(),
    },
  ] as InMemoryService[],
};

// Seed default demo user in-memory
const seedDemoUser = () => {
  if (memoryStore.users.size === 0) {
    const demoUser: InMemoryUser = {
      id: 1,
      uid: 'demo_user_arc_101',
      email: 'builder@arc-nanopay.io',
      name: 'Arc Builder Demo',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.set(demoUser.uid, demoUser);

    const demoWallet: InMemoryWallet = {
      id: 1,
      userId: demoUser.id,
      walletId: 'cw_demo_101_arc',
      address: '0x71C35249284Ff8d9b1392A72e391E60B8a42e',
      blockchain: 'Arc-Settlement-Testnet',
      balanceUsdc: '150.000000',
      autoStreamEnabled: true,
      microRateCap: '0.050000',
      dailyBudgetCap: '10.000000',
      spentTodayUsdc: '0.000000',
      updatedAt: new Date().toISOString(),
    };
    memoryStore.wallets.set(demoUser.id, demoWallet);

    memoryStore.auditLogs.push({
      id: 1,
      userId: demoUser.id,
      action: 'CIRCLE_SCA_INITIALIZED',
      severity: 'INFO',
      details: 'Circle Smart Contract Account ready on Arc Settlement Testnet (Chain ID 436)',
      createdAt: new Date().toISOString(),
    });
  }
};

seedDemoUser();

export async function getOrCreateUserAndWallet(
  uid: string,
  email: string,
  name?: string,
  avatarUrl?: string
) {
  // If PostgreSQL is configured and active
  if (isPostgresConfigured() && db) {
    try {
      const userResult = await db
        .insert(users)
        .values({
          uid,
          email,
          name: name || email.split('@')[0],
          avatarUrl: avatarUrl || '',
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(name ? { name } : {}),
            ...(avatarUrl ? { avatarUrl } : {}),
          },
        })
        .returning();

      const user = userResult[0];

      const existingWallets = await db.select().from(wallets).where(eq(wallets.userId, user.id));
      let wallet = existingWallets[0];

      if (!wallet) {
        const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const circleWalletId = `cw_${user.id}_${Date.now()}`;
        const arcAddress = `0x${randomHex}`;

        const walletResult = await db
          .insert(wallets)
          .values({
            userId: user.id,
            walletId: circleWalletId,
            address: arcAddress,
            blockchain: 'Arc-Settlement-Testnet',
            balanceUsdc: '150.000000',
            autoStreamEnabled: true,
            microRateCap: '0.050000',
            dailyBudgetCap: '10.000000',
            spentTodayUsdc: '0.000000',
          })
          .returning();

        wallet = walletResult[0];

        await db.insert(auditLogs).values({
          userId: user.id,
          action: 'WALLET_CREATED',
          severity: 'INFO',
          details: `Created Circle Wallet ID: ${wallet.walletId} on Arc address: ${wallet.address}`,
        });
      }

      return { user, wallet };
    } catch (pgError) {
      console.warn('PostgreSQL query failed in getOrCreateUserAndWallet, using in-memory store:', pgError);
    }
  }

  // In-Memory Store Path (Instantaneous & 100% Reliable)
  let user = memoryStore.users.get(uid);
  if (!user) {
    const nextId = memoryStore.users.size + 1;
    user = {
      id: nextId,
      uid,
      email,
      name: name || email.split('@')[0],
      avatarUrl: avatarUrl || '',
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.set(uid, user);
  }

  let wallet = memoryStore.wallets.get(user.id);
  if (!wallet) {
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    wallet = {
      id: user.id,
      userId: user.id,
      walletId: `cw_${user.id}_${Date.now()}`,
      address: `0x${randomHex}`,
      blockchain: 'Arc-Settlement-Testnet',
      balanceUsdc: '150.000000',
      autoStreamEnabled: true,
      microRateCap: '0.050000',
      dailyBudgetCap: '10.000000',
      spentTodayUsdc: '0.000000',
      updatedAt: new Date().toISOString(),
    };
    memoryStore.wallets.set(user.id, wallet);

    memoryStore.auditLogs.unshift({
      id: memoryStore.auditLogs.length + 1,
      userId: user.id,
      action: 'WALLET_CREATED',
      severity: 'INFO',
      details: `Initialized Circle Smart Contract Account ${wallet.walletId} on Arc Settlement Testnet`,
      createdAt: new Date().toISOString(),
    });
  }

  return { user, wallet };
}

export async function getUserWallet(userId: number): Promise<InMemoryWallet | null> {
  if (isPostgresConfigured() && db) {
    try {
      const walletRecords = await db.select().from(wallets).where(eq(wallets.userId, userId));
      if (walletRecords[0]) {
        return walletRecords[0] as unknown as InMemoryWallet;
      }
    } catch (e) {
      console.warn('PostgreSQL fetch wallet fallback:', e);
    }
  }

  return memoryStore.wallets.get(userId) || memoryStore.wallets.get(1) || null;
}

export async function fundWallet(userId: number, amountUsdc: number) {
  const currentWallet = await getUserWallet(userId);
  if (!currentWallet) throw new Error('Wallet not found');

  const currentBal = parseFloat(currentWallet.balanceUsdc);
  const newBal = (currentBal + amountUsdc).toFixed(6);

  if (isPostgresConfigured() && db) {
    try {
      const updated = await db
        .update(wallets)
        .set({
          balanceUsdc: newBal,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, currentWallet.id))
        .returning();

      await db.insert(auditLogs).values({
        userId,
        action: 'WALLET_FUNDED',
        severity: 'INFO',
        details: `Funded +$${amountUsdc} USDC to Circle Smart Account. New Balance: ${newBal} USDC`,
      });

      return updated[0];
    } catch (e) {
      console.warn('PostgreSQL fund wallet fallback:', e);
    }
  }

  // Update In-Memory
  const updatedWallet: InMemoryWallet = {
    ...currentWallet,
    balanceUsdc: newBal,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.wallets.set(userId, updatedWallet);

  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    userId,
    action: 'WALLET_FUNDED',
    severity: 'INFO',
    details: `Deposited +$${amountUsdc} USDC into Arc Nanopayment Stream Pool. New Balance: ${newBal} USDC`,
    createdAt: new Date().toISOString(),
  });

  return updatedWallet;
}

export async function syncOrLinkWeb3Wallet(
  userId: number,
  web3Address: string,
  walletType: string = 'metamask',
  chainId: string = '0x1B4',
  depositUsdcAmount?: number
) {
  const wallet = await getUserWallet(userId);
  if (!wallet) throw new Error('Wallet not found');

  const currentBal = parseFloat(wallet.balanceUsdc);
  const deposit = depositUsdcAmount && depositUsdcAmount > 0 ? depositUsdcAmount : 0;
  const newBal = (currentBal + deposit).toFixed(6);

  if (isPostgresConfigured() && db) {
    try {
      const updated = await db
        .update(wallets)
        .set({
          address: web3Address || wallet.address,
          balanceUsdc: newBal,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      await db.insert(auditLogs).values({
        userId,
        action: 'WEB3_WALLET_CONNECTED',
        severity: 'INFO',
        details: `Linked Web3 ${walletType.toUpperCase()} (${web3Address}) on Chain ${chainId}. Stream Balance: ${newBal} USDC`,
      });

      return updated[0];
    } catch (e) {
      console.warn('PostgreSQL sync web3 wallet fallback:', e);
    }
  }

  // In-Memory Update
  const updatedWallet: InMemoryWallet = {
    ...wallet,
    address: web3Address || wallet.address,
    balanceUsdc: newBal,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.wallets.set(userId, updatedWallet);

  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    userId,
    action: 'WEB3_WALLET_CONNECTED',
    severity: 'INFO',
    details: `Linked Web3 ${walletType.toUpperCase()} (${web3Address}) on Chain ${chainId}. Stream Balance: ${newBal} USDC${deposit > 0 ? ` (+${deposit} USDC Bridge)` : ''}`,
    createdAt: new Date().toISOString(),
  });

  return updatedWallet;
}

export async function updateAgentSettings(
  userId: number,
  settings: { autoStreamEnabled?: boolean; microRateCap?: number; dailyBudgetCap?: number }
) {
  const wallet = await getUserWallet(userId);
  if (!wallet) throw new Error('Wallet not found');

  const autoStream = settings.autoStreamEnabled !== undefined ? settings.autoStreamEnabled : wallet.autoStreamEnabled;
  const microRateCap = settings.microRateCap !== undefined ? settings.microRateCap.toFixed(6) : wallet.microRateCap;
  const dailyBudgetCap = settings.dailyBudgetCap !== undefined ? settings.dailyBudgetCap.toFixed(2) : wallet.dailyBudgetCap;

  if (isPostgresConfigured() && db) {
    try {
      const updated = await db
        .update(wallets)
        .set({
          autoStreamEnabled: autoStream,
          microRateCap,
          dailyBudgetCap,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id))
        .returning();

      await db.insert(auditLogs).values({
        userId,
        action: 'AGENT_SETTINGS_UPDATED',
        severity: 'INFO',
        details: `Updated Circle Agent Stack rules: AutoStream=${autoStream}, RateCap=${microRateCap} USDC, DailyBudget=${dailyBudgetCap} USDC`,
      });

      return updated[0];
    } catch (e) {
      console.warn('PostgreSQL update settings fallback:', e);
    }
  }

  // In-Memory Update
  const updatedWallet: InMemoryWallet = {
    ...wallet,
    autoStreamEnabled: autoStream,
    microRateCap,
    dailyBudgetCap,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.wallets.set(userId, updatedWallet);

  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    userId,
    action: 'AGENT_SETTINGS_UPDATED',
    severity: 'INFO',
    details: `Updated Circle Agent Stack rules: AutoStream=${autoStream}, RateCap=${microRateCap} USDC, DailyBudget=${dailyBudgetCap} USDC`,
    createdAt: new Date().toISOString(),
  });

  return updatedWallet;
}

export async function getX402Services(): Promise<InMemoryService[]> {
  if (isPostgresConfigured() && db) {
    try {
      const services = await db.select().from(x402Services);
      if (services && services.length > 0) {
        return services as unknown as InMemoryService[];
      }
    } catch (e) {
      console.warn('PostgreSQL get services fallback:', e);
    }
  }
  return memoryStore.services;
}

export async function processNanopaymentStream(
  userId: number,
  serviceId: string,
  promptTokenCount: number = 0
) {
  const wallet = await getUserWallet(userId);
  if (!wallet) throw new Error('User wallet not found');

  const services = await getX402Services();
  const service = services.find((s) => s.serviceId === serviceId);
  if (!service) throw new Error(`x402 Service '${serviceId}' not found`);

  const costUsdc = parseFloat(service.pricePerUnitUsdc);
  const balance = parseFloat(wallet.balanceUsdc);
  const rateCap = parseFloat(wallet.microRateCap);
  const budgetCap = parseFloat(wallet.dailyBudgetCap);
  const spentToday = parseFloat(wallet.spentTodayUsdc);

  // Policy Checks
  if (!wallet.autoStreamEnabled) {
    throw new Error('Autonomous nanopayment streaming is disabled by user policy');
  }

  if (costUsdc > rateCap) {
    throw new Error(
      `Transaction cost (${costUsdc.toFixed(6)} USDC) exceeds maximum allowed per-call rate cap (${rateCap.toFixed(6)} USDC)`
    );
  }

  if (spentToday + costUsdc > budgetCap) {
    throw new Error(
      `Daily budget cap reached (${spentToday.toFixed(2)} / ${budgetCap.toFixed(2)} USDC)`
    );
  }

  if (balance < costUsdc) {
    throw new Error(
      `Insufficient Arc USDC balance. Required: ${costUsdc.toFixed(6)} USDC, Available: ${balance.toFixed(6)} USDC`
    );
  }

  // Deduct Balance
  const newBalance = (balance - costUsdc).toFixed(6);
  const newSpentToday = (spentToday + costUsdc).toFixed(6);
  const txHash = `0xarc_${Date.now().toString(16)}_${Math.random().toString(16).substring(2, 10)}`;
  const executionTimeMs = Math.floor(Math.random() * 18) + 8; // 8ms - 25ms settlement

  const txRecord: InMemoryTransaction = {
    id: memoryStore.transactions.length + 1,
    txHash,
    userId,
    walletId: wallet.id,
    serviceId,
    senderAddress: wallet.address,
    receiverAddress: service.developerWallet,
    amountUsdc: costUsdc.toFixed(6),
    status: 'SETTLED',
    x402HeaderCode: '200 OK / x402-PAID',
    executionTimeMs,
    promptTokenCount,
    metadataJson: JSON.stringify({
      blockchain: wallet.blockchain,
      circleSdkAgentVersion: 'v0.0.6',
      settlementSpeed: `${executionTimeMs}ms`,
    }),
    createdAt: new Date().toISOString(),
  };

  if (isPostgresConfigured() && db) {
    try {
      await db
        .update(wallets)
        .set({
          balanceUsdc: newBalance,
          spentTodayUsdc: newSpentToday,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      await db
        .update(x402Services)
        .set({
          totalCalls: sql`${x402Services.totalCalls} + 1`,
        })
        .where(eq(x402Services.id, service.id));

      await db.insert(transactions).values(txRecord as any);

      await db.insert(auditLogs).values({
        userId,
        action: 'NANOPAYMENT_STREAMED',
        severity: 'INFO',
        details: `Streamed ${costUsdc.toFixed(6)} USDC for ${service.name} (${serviceId}). TxHash: ${txHash}`,
      });
    } catch (e) {
      console.warn('PostgreSQL nanopayment stream fallback:', e);
    }
  }

  // Update In-Memory Store
  const updatedWallet: InMemoryWallet = {
    ...wallet,
    balanceUsdc: newBalance,
    spentTodayUsdc: newSpentToday,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.wallets.set(userId, updatedWallet);

  service.totalCalls += 1;
  memoryStore.transactions.unshift(txRecord);

  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    userId,
    action: 'NANOPAYMENT_STREAMED',
    severity: 'INFO',
    details: `Streamed ${costUsdc.toFixed(6)} USDC for ${service.name} (${serviceId}). TxHash: ${txHash}`,
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    transaction: txRecord,
    updatedBalanceUsdc: newBalance,
    service,
  };
}

export async function getUserTransactions(userId: number): Promise<InMemoryTransaction[]> {
  if (isPostgresConfigured() && db) {
    try {
      const userTxs = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
        .limit(50);
      if (userTxs && userTxs.length > 0) {
        return userTxs as unknown as InMemoryTransaction[];
      }
    } catch (e) {
      console.warn('PostgreSQL fetch transactions fallback:', e);
    }
  }

  return memoryStore.transactions.filter((tx) => tx.userId === userId || userId === 1);
}

export async function getUserAuditLogs(userId: number): Promise<InMemoryAuditLog[]> {
  if (isPostgresConfigured() && db) {
    try {
      const userLogs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(50);
      if (userLogs && userLogs.length > 0) {
        return userLogs as unknown as InMemoryAuditLog[];
      }
    } catch (e) {
      console.warn('PostgreSQL fetch audit logs fallback:', e);
    }
  }

  return memoryStore.auditLogs.filter((log) => log.userId === userId || userId === 1);
}

export async function recordAuditLog(
  userId: number,
  action: string,
  severity: string,
  details: string
) {
  if (isPostgresConfigured() && db) {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        severity,
        details,
      });
      return;
    } catch (e) {
      console.warn('PostgreSQL audit log fallback:', e);
    }
  }

  memoryStore.auditLogs.unshift({
    id: memoryStore.auditLogs.length + 1,
    userId,
    action,
    severity,
    details,
    createdAt: new Date().toISOString(),
  });
}
