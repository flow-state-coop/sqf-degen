import React from "react";
import merge from "lodash.merge";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import {
  Chain,
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  coinbaseWallet,
  braveWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import IndexPage from "./pages/Index";
import ErrorPage from "./pages/Error";
import Header from "./components/Header";
import { StreamingQuadraticFundingContextProvider } from "./context/StreamingQuadraticFunding";
import SuperfluidContextProvider from "./context/Superfluid";
import { RPC_URL, WALLET_CONNECT_PROJECT_ID } from "./lib/constants";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles.scss";

const degenChain = {
  id: 666666666,
  name: "Degen",
  network: "degenchain",
  iconUrl: "https://explorer.degen.tips/favicon/favicon-32x32.png",
  iconBackground: "#fff",
  nativeCurrency: { name: "Degen", symbol: "DEGEN", decimals: 18 },
  rpcUrls: {
    public: { http: ["https://rpc.degen.tips"] },
    default: { http: ["https://rpc.degen.tips"] },
  },
  blockExplorers: {
    default: { name: "DegenExplorer", url: "https://explorer.degen.tips" },
  },
  contracts: {
    multicall3: {
      address: "0x79035Dc4436bA9C95016D3bF6304e5bA78B1066A",
      blockCreated: 2279171,
    },
  },
} as const satisfies Chain;

const { chains, publicClient } = configureChains(
  [degenChain],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: RPC_URL,
      }),
    }),
  ]
);

const connectors = connectorsForWallets([
  {
    groupName: "Suggested",
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      ledgerWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      walletConnectWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      coinbaseWallet({ appName: "Geo Web Cadastre", chains }),
      braveWallet({ chains }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
});

export default function App() {
  const myTheme = merge(darkTheme(), {
    colors: {
      modalBackground: "#202333",
      accentColor: "#2fc1c1",
      modalBorder: "0",
      profileForeground: "#111320",
      modalText: "#f8f9fa",
      closeButtonBackground: "#111320",
      closeButton: "#f8f9fa",
    },
    radii: {
      modal: "18px",
    },
  });

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Header />} errorElement={<ErrorPage />}>
        <Route index element={<IndexPage />} errorElement={<ErrorPage />} />
      </Route>
    )
  );

  const apolloClient = new ApolloClient({
    uri: "https://degenchain.subgraph.x.superfluid.dev/",
    cache: new InMemoryCache(),
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} modalSize="compact" theme={myTheme}>
        <ApolloProvider client={apolloClient}>
          <StreamingQuadraticFundingContextProvider>
            <SuperfluidContextProvider>
              <RouterProvider router={router} />
            </SuperfluidContextProvider>
          </StreamingQuadraticFundingContextProvider>
        </ApolloProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
