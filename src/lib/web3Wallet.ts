// Web3 Wallet Connectivity Manager for MetaMask and other EVM wallets

export interface ConnectedWeb3Wallet {
  address: string;
  shortAddress: string;
  chainId: string;
  networkName: string;
  walletType: 'metamask' | 'coinbase' | 'rainbow' | 'injected' | 'demo';
  balanceNative: string; // ARC or ETH
  balanceUsdc: string;
  isArcNetwork: boolean;
}

export const ARC_TESTNET_CONFIG = {
  chainIdHex: '0x1B4', // 436 in decimal
  chainIdDec: 436,
  chainName: 'Arc Settlement Testnet',
  nativeCurrency: {
    name: 'Arc Token',
    symbol: 'ARC',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.arc.network', 'https://rpc.arc-settlement.io'],
  blockExplorerUrls: ['https://testnet-explorer.arc.network'],
};

// Check if MetaMask or any injected ethereum provider is available
export const getInjectedProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
};

export const isMetaMaskInstalled = (): boolean => {
  const provider = getInjectedProvider();
  return !!(provider && (provider.isMetaMask || provider.providers?.some((p: any) => p.isMetaMask)));
};

export const isCoinbaseWalletInstalled = (): boolean => {
  const provider = getInjectedProvider();
  return !!(provider && (provider.isCoinbaseWallet || provider.providers?.some((p: any) => p.isCoinbaseWallet)));
};

export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const getNetworkName = (chainId: string | number): string => {
  const hex = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId.toLowerCase();
  switch (hex) {
    case '0x1b4':
    case '0x01b4':
    case '436':
      return 'Arc Settlement Testnet';
    case '0x1':
      return 'Ethereum Mainnet';
    case '0xaa36a7':
    case '11155111':
      return 'Sepolia Testnet';
    case '0x89':
    case '137':
      return 'Polygon Mainnet';
    case '0xa4b1':
    case '42161':
      return 'Arbitrum One';
    case '0x2105':
    case '8453':
      return 'Base Mainnet';
    default:
      return `EVM (${hex})`;
  }
};

// Request account connection from MetaMask / injected provider
export const connectInjectedWallet = async (
  walletType: 'metamask' | 'coinbase' | 'rainbow' | 'injected'
): Promise<ConnectedWeb3Wallet> => {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error('No crypto wallet extension found. Please install MetaMask or use Arc Simulated Wallet.');
  }

  // Request accounts
  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No account selected in wallet.');
  }

  const address = accounts[0];
  const chainId: string = await provider.request({ method: 'eth_chainId' });

  // Get balance (fallback to 2.45 ARC if in demo/testnet)
  let balanceNative = '2.500';
  let balanceUsdc = '150.00';

  try {
    const rawBalHex: string = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    if (rawBalHex) {
      const wei = BigInt(rawBalHex);
      // approximate 18 decimals
      const formatted = (Number(wei) / 1e18).toFixed(4);
      balanceNative = formatted;
    }
  } catch (e) {
    console.warn('Balance fetch warning, using default display:', e);
  }

  const isArcNetwork = chainId.toLowerCase() === ARC_TESTNET_CONFIG.chainIdHex.toLowerCase();

  return {
    address,
    shortAddress: formatAddress(address),
    chainId,
    networkName: getNetworkName(chainId),
    walletType,
    balanceNative,
    balanceUsdc,
    isArcNetwork,
  };
};

// Switch or Add Arc Settlement Network to MetaMask
export const switchToArcNetwork = async (): Promise<boolean> => {
  const provider = getInjectedProvider();
  if (!provider) return false;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_TESTNET_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    // This error code 4902 indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARC_TESTNET_CONFIG.chainIdHex,
              chainName: ARC_TESTNET_CONFIG.chainName,
              nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
              rpcUrls: ARC_TESTNET_CONFIG.rpcUrls,
              blockExplorerUrls: ARC_TESTNET_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Arc network to wallet:', addError);
        throw addError;
      }
    }
    throw switchError;
  }
};

// Personal sign request for agent streaming authorization
export const signStreamAuthorization = async (
  address: string,
  microCap: string,
  dailyBudget: string
): Promise<string> => {
  const provider = getInjectedProvider();
  const message = `Build on Arc: Nanostream - Agent Authorization\n\nI authorize the Circle Agent Stack on Arc Settlement to stream autonomous micropayments on my behalf.\n\nWallet: ${address}\nMicro Rate Cap: $${microCap} USDC\nDaily Budget Cap: $${dailyBudget} USDC\nTimestamp: ${new Date().toISOString()}`;

  if (provider) {
    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });
      return signature;
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('User rejected signature request.');
      }
      // Return simulated sig for sandbox/testnet
      return `0xsimulated_arc_sig_${Date.now()}`;
    }
  }

  // Simulated signature for sandbox demo
  return `0xarc_nanostream_auth_${Date.now()}`;
};

// Simulated Demo Arc Web3 Wallet for immediate testing without extensions
export const connectDemoArcWallet = (mockType: 'metamask' | 'coinbase' | 'rainbow' = 'metamask'): ConnectedWeb3Wallet => {
  const randomHex = Math.random().toString(16).substring(2, 10);
  const address = `0x71C${randomHex}9284Ff8d9b1392A72e391E60B8`;
  return {
    address,
    shortAddress: formatAddress(address),
    chainId: ARC_TESTNET_CONFIG.chainIdHex,
    networkName: ARC_TESTNET_CONFIG.chainName,
    walletType: mockType,
    balanceNative: '8.4500',
    balanceUsdc: '250.00',
    isArcNetwork: true,
  };
};
