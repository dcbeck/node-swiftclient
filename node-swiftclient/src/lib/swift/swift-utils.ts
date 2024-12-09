import { Authenticator } from "../interfaces";
import { SwiftAuthenticatorV1 } from "./swift-authenticator-v1";
import { SwiftAuthenticatorV2, V2ConnectionConfig } from "./swift-authenticator-v2";
import { SwiftAuthenticatorV3, ConnectionConfig } from "./swift-authenticator-v3";
import { SwiftClientOptions } from "./swift-client";
import { UnsupportedAuthenticator } from "./unsupported-authenticator";

export function getAuthenticatorForVersion(
  config: SwiftClientOptions
): Authenticator {
  switch (config.authVersion) {
    case 1:
      return new SwiftAuthenticatorV1(
        config.authUrl,
        config.username,
        config.password,
        config.tenant ?? null
      );
    case 2:
      return new SwiftAuthenticatorV2(config as V2ConnectionConfig);
    case 3:
      return new SwiftAuthenticatorV3(config as ConnectionConfig);
    default:
      return new UnsupportedAuthenticator(
        (config as { authVersion: number }).authVersion
      );
  }
}
