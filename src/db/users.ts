import { db } from './index.ts';
import { users, wallets, transactions, auditLogs, x402Services } from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function getOrCreateUserAndWallet(uid: string, email: string, name?: string, avatarUrl?: string) {
  try {
    // 1. Upsert User
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

    // 2. Check or create Wallet
    const existingWallets = await db.select().from(wallets).where(eq(wallets.userId, user.id));
    let wallet = existingWallets[0];

    if (!wallet) {
      // Generate a mock/live Circle Wallet UUID and Arc 0x address
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
          balanceUsdc: '100.000000',
          autoStreamEnabled: true,
          microRateCap: '0.050000',
          dailyBudgetCap: '10.000000',
          spentTodayUsdc: '0.000000',
        })
        .returning();

      wallet = walletResult[0];

      // Audit log
      await db.insert(auditLogs).values({
        userId: user.id,
        action: 'WALLET_CREATED',
        severity: 'INFO',
        details: `Created Circle Wallet ID: ${wallet.walletId} on Arc address: ${wallet.address}`,
      });
    }

    return { user, wallet };
  } catch (error) {
    console.error('Error in getOrCreateUserAndWallet:', error);
    throw new Error('Database operation failed during user & wallet setup', { cause: error });
  }
}

export async function getUserWallet(userId: number) {
  try {
    const walletRecords = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return walletRecords[0] || null;
  } catch (error) {
    console.error('Error fetching user wallet:', error);
    throw new Error('Failed to fetch wallet from database', { cause: error });
  }
}

export async function fundWallet(userId: number, amountUsdc: number) {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');

    const currentBal = parseFloat(wallet.balanceUsdc);
    const newBal = (currentBal + amountUsdc).toFixed(6);

    const updated = await db
      .update(wallets)
      .set({
        balanceUsdc: newBal,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: 'WALLET_FUNDED',
      severity: 'INFO',
      details: `Funded +${amountUsdc.toFixed(6)} USDC to Arc Wallet ${wallet.address}. New Balance: ${newBal} USDC`,
    });

    return updated[0];
  } catch (error) {
    console.error('Error funding wallet:', error);
    throw new Error('Wallet funding failed', { cause: error });
  }
}

export async function syncOrLinkWeb3Wallet(
  userId: number,
  web3Address: string,
  walletType: string = 'metamask',
  chainId: string = '0x1B4',
  depositUsdcAmount?: number
) {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');

    const currentBal = parseFloat(wallet.balanceUsdc);
    const deposit = depositUsdcAmount && depositUsdcAmount > 0 ? depositUsdcAmount : 0;
    const newBal = (currentBal + deposit).toFixed(6);

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
      details: `Linked Web3 ${walletType.toUpperCase()} Address (${web3Address}) on Chain ${chainId}. Stream Pool Balance: ${newBal} USDC`,
    });

    return updated[0];
  } catch (error) {
    console.error('Error syncing Web3 wallet:', error);
    throw new Error('Failed to sync Web3 wallet', { cause: error });
  }
}

export async function updateAgentSettings(
  userId: number,
  settings: { autoStreamEnabled?: boolean; microRateCap?: number; dailyBudgetCap?: number }
) {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('Wallet not found');

    const updateData: Partial<typeof wallets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (settings.autoStreamEnabled !== undefined) {
      updateData.autoStreamEnabled = settings.autoStreamEnabled;
    }
    if (settings.microRateCap !== undefined) {
      updateData.microRateCap = settings.microRateCap.toFixed(6);
    }
    if (settings.dailyBudgetCap !== undefined) {
      updateData.dailyBudgetCap = settings.dailyBudgetCap.toFixed(2);
    }

    const updated = await db
      .update(wallets)
      .set(updateData)
      .where(eq(wallets.id, wallet.id))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: 'AGENT_SETTINGS_UPDATED',
      severity: 'INFO',
      details: `Circle Agent Stack rules updated: AutoStream=${updated[0].autoStreamEnabled}, RateCap=${updated[0].microRateCap} USDC`,
    });

    return updated[0];
  } catch (error) {
    console.error('Error updating agent settings:', error);
    throw new Error('Failed to update agent settings', { cause: error });
  }
}

export async function processNanopaymentStream(
  userId: number,
  serviceId: string,
  promptTokenCount: number = 0
) {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) throw new Error('User wallet not found');

    // 1. Fetch Service details
    const serviceList = await db.select().from(x402Services).where(eq(x402Services.serviceId, serviceId));
    const service = serviceList[0];
    if (!service) throw new Error(`x402 Service '${serviceId}' not found`);

    const costUsdc = parseFloat(service.pricePerUnitUsdc);
    const balance = parseFloat(wallet.balanceUsdc);
    const rateCap = parseFloat(wallet.microRateCap);
    const budgetCap = parseFloat(wallet.dailyBudgetCap);
    const spentToday = parseFloat(wallet.spentTodayUsdc);

    // Checks & Balances
    if (!wallet.autoStreamEnabled) {
      throw new Error('Autonomous nanopayment streaming is disabled by user policy');
    }

    if (costUsdc > rateCap) {
      throw new Error(`Transaction cost (${costUsdc.toFixed(6)} USDC) exceeds maximum allowed per-call rate cap (${rateCap.toFixed(6)} USDC)`);
    }

    if (spentToday + costUsdc > budgetCap) {
      throw new Error(`Daily budget cap reached (${spentToday.toFixed(2)} / ${budgetCap.toFixed(2)} USDC)`);
    }

    if (balance < costUsdc) {
      throw new Error(`Insufficient Arc USDC balance. Required: ${costUsdc.toFixed(6)} USDC, Available: ${balance.toFixed(6)} USDC`);
    }

    // Process Deduction
    const newBalance = (balance - costUsdc).toFixed(6);
    const newSpentToday = (spentToday + costUsdc).toFixed(6);

    await db
      .update(wallets)
      .set({
        balanceUsdc: newBalance,
        spentTodayUsdc: newSpentToday,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Update service total call counter
    await db
      .update(x402Services)
      .set({
        totalCalls: sql`${x402Services.totalCalls} + 1`,
      })
      .where(eq(x402Services.id, service.id));

    // Generate Arc Settlement Tx Hash
    const txHash = `0xarc_${Date.now().toString(16)}_${Math.random().toString(16).substring(2, 10)}`;
    const executionTimeMs = Math.floor(Math.random() * 18) + 8; // 8ms - 25ms settlement

    // Record Transaction
    const txResult = await db
      .insert(transactions)
      .values({
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
      })
      .returning();

    // Audit Log
    await db.insert(auditLogs).values({
      userId,
      action: 'NANOPAYMENT_STREAMED',
      severity: 'INFO',
      details: `Streamed ${costUsdc.toFixed(6)} USDC for ${service.name} (${serviceId}). TxHash: ${txHash}`,
    });

    return {
      success: true,
      transaction: txResult[0],
      updatedBalanceUsdc: newBalance,
      service,
    };
  } catch (error: any) {
    console.error('Nanopayment processing failed:', error);
    // Audit error
    await db.insert(auditLogs).values({
      userId,
      action: 'NANOPAYMENT_FAILED',
      severity: 'ERROR',
      details: `Failed x402 nanopayment for ${serviceId}: ${error.message || error}`,
    });
    throw error;
  }
}
