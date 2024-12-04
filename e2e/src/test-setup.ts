import { execSync } from 'child_process';

module.exports = async function () {
  execSync(`docker compose -f e2e/docker-compose.yml up -d`);

  const wait = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

  for (let index = 0; index < 100; index++) {
    try {
      const res = await fetch('http://127.0.0.1:6001/v1/auth');
      if (res.status === 401) {
        index = 100;
        break;
      }
      await wait(200);
    } catch (error) {
      /** noop */
    }
  }

  wait(200);
  execSync(
    `docker exec -i swift-keystone /swift/bin/register-swift-endpoint.sh http://127.0.0.1:6001/`
  );
};
