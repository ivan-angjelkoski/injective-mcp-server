import { Msgs, MsgBroadcasterWithPk } from "@injectivelabs/sdk-ts";
import {
  ETHEREUM_CHAIN_ID,
  INJECTIVE_CHAIN_ID,
  INJECTIVE_NETWORK,
} from "./setup.js";

export const broadcaster = ({
  msgs,
  privateKey,
}: {
  msgs: Msgs[];
  privateKey: string;
}) => {
  const broadcaster = new MsgBroadcasterWithPk({
    chainId: INJECTIVE_CHAIN_ID,
    ethereumChainId: ETHEREUM_CHAIN_ID,
    network: INJECTIVE_NETWORK,
    privateKey,
  });

  return broadcaster.broadcast({
    msgs,
  });
};
