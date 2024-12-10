import {
  runCommand,
  wait,
  waitUntilTestContainerIsRunning,
} from './utils/utils';

export default async function globalSetup() {
  const output = await runCommand(
    `docker compose -f e2e/docker-compose.yml up -d`
  );

  const trimmedOutput = output.replace(/\s/g, '').toLowerCase().trim();
  if (trimmedOutput.endsWith('started') || trimmedOutput.endsWith('running')) {
    console.log('Swift container is running!');
  } else {
    throw new Error(
      'Failed to spin up swift docker container. Is docker running?'
    );
  }

  await wait(1000);

  await waitUntilTestContainerIsRunning();
  console.log('Swift auth endpoint is running!');

  await wait(1000);
  for (let index = 0; index < 20; index++) {
    try {
      const output = await runCommand(
        `docker exec -i swift-keystone-server /swift/bin/register-swift-endpoint.sh http://127.0.0.1:6001`
      );
      const trimmedOutput = output.replace(/\s/g, '').toLowerCase().trim();
      if (!trimmedOutput.startsWith('error')) {
        console.log(output);
        console.log('Swift endpoint successfully registered!');
        index = 20;
        break;
      }
    } catch (error) {
      console.log('Failed registered swift endpoint. Retry in 1s');
      /** noop */
      await wait(2000);
    }
  }
}
