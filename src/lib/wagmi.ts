import { createConfig, http } from 'wagmi';
import { arcTestnet } from './chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask(),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
