import { execSync } from 'child_process';

export default function globalTeardown() {
  execSync(`docker compose -f e2e/docker-compose.yml down -v`);
  execSync('docker rm -f swift-keystone');
}