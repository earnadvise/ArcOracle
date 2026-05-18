import { createConfig, http } from 'wagmi';
import { arcTestnet } from './chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
