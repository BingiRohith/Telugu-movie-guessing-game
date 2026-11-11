/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from 'cloudflare:workers';
import { ProfileAccount, profileRequest, economyRequest } from './profiles.ts';

interface Env {
  PROFILES: DurableObjectNamespace<ProfileAccount>;
  TEST_CHECKOUT_ENABLED?: string;
}

export { ProfileAccount };

// Keep the old class registered so the existing Wrangler migration stays valid.
export class BattleRoom extends DurableObject {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return new Response('Origin not allowed', { status: 403 });

    if (url.pathname === '/api/profile' || url.pathname === '/api/profile/session' || url.pathname === '/api/profile/credentials') {
      return profileRequest(request, env.PROFILES, url.pathname);
    }
    if (url.pathname === '/api/economy') {
      return economyRequest(request, env.PROFILES, env.TEST_CHECKOUT_ENABLED === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname));
    }
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
