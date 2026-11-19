/** Default weights from scoring.default.json (suspect.weights). The score is their sum, capped at 100. Plain module so server and client code can both import it. */
export const WEIGHTS: Record<string, number> = {
  bot: 60, tampering: 25, tor: 30, datacenterIp: 15, ipBlocklist: 40, velocity: 20, incognito: 5, devtools: 5, virtualMachine: 15,
  privacyBrowser: 5, highActivity: 15, crossBrowser: 15, antiDetect: 40, vpn: 20, tlsMismatch: 30, multiAccount: 25, accountSharing: 10,
  automatedInput: 30, aiAgent: 20, proxy: 20, rareDevice: 10, tamperedRequest: 30, replayedRequest: 50, flaggedNetwork: 15, emulator: 30, rootedDevice: 20,
};
