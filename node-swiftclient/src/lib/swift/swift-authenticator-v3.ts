// OpenStack V3 Authentication in Node.js with native fetch

import { AuthResult } from '../interfaces/auth-result';
import { Authenticator } from '../interfaces/authenticator';

// Enum for authentication methods
const V3_AUTH_METHODS = {
  TOKEN: 'token',
  PASSWORD: 'password',
  APPLICATION_CREDENTIAL: 'application_credential',
} as const;

// Enum for endpoint types
enum EndpointType {
  Public = 'public',
  Internal = 'internal',
  Admin = 'admin',
}

// Interfaces for V3 Authentication structures
interface V3Domain {
  id?: string;
  name?: string;
}

interface V3Project {
  name?: string;
  id?: string;
  domain?: V3Domain;
}

interface V3Trust {
  id: string;
}

interface V3User {
  domain?: V3Domain;
  id?: string;
  name?: string;
  password?: string;
}

interface V3AuthToken {
  id: string;
}

interface V3AuthPassword {
  user: V3User;
}

interface V3AuthApplicationCredential {
  id?: string;
  name?: string;
  secret?: string;
  user?: V3User;
}

interface V3Scope {
  project?: V3Project;
  domain?: V3Domain;
  trust?: V3Trust;
}

interface V3AuthRequest {
  auth: {
    identity: {
      methods: string[];
      password?: V3AuthPassword;
      token?: V3AuthToken;
      applicationCredential?: V3AuthApplicationCredential;
    };
    scope?: V3Scope;
  };
}

interface V3AuthResponseToken {
  expires_at: string;
  issued_at: string;
  methods: string[];
  roles: Array<{
    id: string;
    name: string;
    links: {
      self: string;
    };
  }>;
  project: {
    domain: {
      id: string;
      name: string;
    };
    id: string;
    name: string;
  };
  catalog: Array<{
    id: string;
    name: string;
    type: string;
    endpoints: Array<{
      id: string;
      region_id: string;
      url: string;
      region: string;
      interface: EndpointType;
    }>;
  }>;
  user: {
    id: string;
    name: string;
    domain: {
      id: string;
      name: string;
      links: {
        self: string;
      };
    };
  };
  audit_ids: string[];
}

interface V3AuthResponse {
  token: V3AuthResponseToken;
}

export interface ConnectionConfig {
  authUrl: string;
  region?: string;
  userAgent?: string;

  // Authentication options
  apiKey?: string;
  userName?: string;
  userId?: string;
  domain?: string;
  domainId?: string;

  // Application Credential options
  applicationCredentialId?: string;
  applicationCredentialName?: string;
  applicationCredentialSecret?: string;

  // Tenant/Project options
  tenant?: string;
  tenantId?: string;
  tenantDomain?: string;
  tenantDomainId?: string;

  // Trust option
  trustId?: string;
}

export class SwiftAuthenticatorV3 implements Authenticator {
  private config: ConnectionConfig;
  private authResponse?: V3AuthResponse;
  private responseHeaders?: Headers;
  private region?: string;

  constructor(config: ConnectionConfig) {
    this.config = config;
    this.region = config.region;
  }

  async authenticate(): Promise<AuthResult> {
    const authRequest = this.buildAuthRequest();

    try {
      const response = await fetch(this.buildAuthUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': this.config.userAgent || 'NodeJS OpenStack Client',
        },
        body: JSON.stringify(authRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.responseHeaders = response.headers;
      this.authResponse = (await response.json()) as V3AuthResponse;

      return {
        token: this.getToken(),
        url: this.getStorageUrl(process.env.SWIFT_INTERNAL === 'true'),
      };
    } catch (error) {
      throw new Error(
        `Authentication failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private buildAuthUrl(): string {
    let url = this.config.authUrl;
    if (!url.endsWith('/')) {
      url += '/';
    }
    return `${url}auth/tokens`;
  }

  private buildAuthRequest(): V3AuthRequest {
    const authRequest: V3AuthRequest = {
      auth: {
        identity: {
          methods: [],
        },
      },
    };

    // Application Credential Authentication
    if (
      (this.config.applicationCredentialId ||
        this.config.applicationCredentialName) &&
      this.config.applicationCredentialSecret
    ) {
      let user: V3User | undefined;

      if (this.config.applicationCredentialId) {
        user = {};
      }

      if (!user && this.config.userId) {
        user = { id: this.config.userId };
      }

      if (!user && !this.config.userName) {
        throw new Error('UserID or Name should be provided');
      }

      if (!user && this.config.domainId) {
        user = {
          name: this.config.userName,
          domain: { id: this.config.domainId },
        };
      }

      if (!user && this.config.domain) {
        user = {
          name: this.config.userName,
          domain: { name: this.config.domain },
        };
      }

      if (!user) {
        throw new Error('DomainID or Domain should be provided');
      }

      authRequest.auth.identity.methods = [
        V3_AUTH_METHODS.APPLICATION_CREDENTIAL,
      ];
      authRequest.auth.identity.applicationCredential = {
        id: this.config.applicationCredentialId,
        name: this.config.applicationCredentialName,
        secret: this.config.applicationCredentialSecret,
        user,
      };
    }
    // Token Authentication
    else if (!this.config.userName && !this.config.userId) {
      authRequest.auth.identity.methods = [V3_AUTH_METHODS.TOKEN];
      authRequest.auth.identity.token = { id: this.config.apiKey! };
    }
    // Password Authentication
    else {
      authRequest.auth.identity.methods = [V3_AUTH_METHODS.PASSWORD];

      const user: V3User = {
        name: this.config.userName,
        id: this.config.userId,
        password: this.config.apiKey,
      };

      let domain: V3Domain | undefined;

      if (this.config.domain) {
        domain = { name: this.config.domain };
      } else if (this.config.domainId) {
        domain = { id: this.config.domainId };
      }

      user.domain = domain;

      authRequest.auth.identity.password = { user };
    }

    // Scoping
    if (
      authRequest.auth.identity.methods[0] !==
      V3_AUTH_METHODS.APPLICATION_CREDENTIAL
    ) {
      // Trust Scoping
      if (this.config.trustId) {
        authRequest.auth.scope = {
          trust: { id: this.config.trustId },
        };
      }
      // Project/Tenant Scoping
      else if (this.config.tenantId || this.config.tenant) {
        authRequest.auth.scope = { project: {} };

        if (this.config.tenantId) {
          authRequest.auth.scope.project!.id = this.config.tenantId;
        } else if (this.config.tenant) {
          authRequest.auth.scope.project!.name = this.config.tenant;

          // Determine domain for the project
          if (this.config.tenantDomain) {
            authRequest.auth.scope.project!.domain = {
              name: this.config.tenantDomain,
            };
          } else if (this.config.tenantDomainId) {
            authRequest.auth.scope.project!.domain = {
              id: this.config.tenantDomainId,
            };
          } else if (this.config.domain) {
            authRequest.auth.scope.project!.domain = {
              name: this.config.domain,
            };
          } else if (this.config.domainId) {
            authRequest.auth.scope.project!.domain = {
              id: this.config.domainId,
            };
          } else {
            authRequest.auth.scope.project!.domain = { name: 'Default' };
          }
        }
      }
    }

    return authRequest;
  }

  // Helper methods similar to the Go version
  getStorageUrl(internal = false): string {
    const endpointType = internal ? EndpointType.Internal : EndpointType.Public;
    return this.getStorageUrlForEndpoint(endpointType);
  }

  getStorageUrlForEndpoint(endpointType: EndpointType): string {
    if (!this.authResponse) {
      throw new Error('Authentication not performed');
    }

    const objectStoreCatalog = this.authResponse.token.catalog.find(
      (catalog) => catalog.type === 'object-store'
    );
    
    if (!objectStoreCatalog) {
      return '';
    }

    const endpoint = objectStoreCatalog.endpoints.find(
      (ep) =>
        ep.interface === endpointType &&
        (!this.region || ep.region === this.region)
    );

    //replace double slashes
    const endpoint2 = (endpoint ? endpoint.url : '').replace(
      new RegExp('//', 'g'),
      '/'
    );

    return endpoint2;
  }

  getToken(): string {
    if (!this.responseHeaders) {
      throw new Error('Authentication not performed');
    }
    return this.responseHeaders.get('x-subject-token') || '';
  }

  getExpires(): Date {
    if (!this.authResponse) {
      throw new Error('Authentication not performed');
    }
    return new Date(this.authResponse.token.expires_at);
  }

  getCdnUrl(): string {
    return ''; // Kept as empty string in the original Go code
  }
}
