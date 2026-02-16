/**
 * Storybook (via `detect-port` -> `address`) calls `os.networkInterfaces()`.
 * In some sandboxed environments this can throw:
 *   uv_interface_addresses returned Unknown system error 1
 *
 * Preloading this file (NODE_OPTIONS=--require ...) makes that call safe.
 */
const os = require("node:os");

const originalNetworkInterfaces = os.networkInterfaces;

os.networkInterfaces = function networkInterfacesPatched() {
  try {
    return originalNetworkInterfaces.call(os);
  } catch {
    return {};
  }
};

