import { createConfig, http } from 'wagmi';
import { arcTestnet } from './chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: 'c10b77b18ad112b3297a59c20a9a8880', // Standard, public fallback Project ID
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
