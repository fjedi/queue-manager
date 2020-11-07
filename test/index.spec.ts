import Bull from 'bull';
import { resolve as resolvePath } from 'path';
import { createQueue, createRepeatableJob } from '../src';

const context = {};
const TEST_QUEUE_ERROR_MSG = 'Invalid "data" value passed to queue-manager instance.add method';
const TEST_QUEUE_DATA = { id: 'some-test-id', value: 'some-test-value' };

describe('Test queue-manager', function () {
  it('Should create instance of Queue manager', async function () {
    const result = await createQueue({
      name: 'testQueue',
      queueOptions: {},
      // eslint-disable-next-line import/no-dynamic-require, global-require
      processor: require(resolvePath(__dirname, '../src/test-queue')),
      concurrency: 10,
      context,
    });

    await result.add(TEST_QUEUE_DATA, {
      removeOnFail: true,
      removeOnComplete: true,
    });

    expect(result).toBeInstanceOf(Bull);
  });

  // it('Should FAIL to create queue-job of Queue manager', async function () {
  //   const result = await createQueue({
  //     name: 'testQueue',
  //     queueOptions: {},
  //     // eslint-disable-next-line import/no-dynamic-require, global-require
  //     processor: require(resolvePath(__dirname, '../src/test-queue.ts')),
  //     concurrency: 10,
  //     context,
  //   });

  //   expect(async () => {
  //     await result.add(null, {
  //       removeOnFail: true,
  //       removeOnComplete: true,
  //     });
  //   }).toThrowError(TEST_QUEUE_ERROR_MSG);
  // });

  it('Should create instance of repeatable/cron-job manager', async function () {
    const result = await createRepeatableJob({
      jobId: 'testCronJob',
      name: 'testCronJob',
      queueOptions: {},
      // eslint-disable-next-line import/no-dynamic-require, global-require
      processor: require(resolvePath(__dirname, '../src/test-cron-job')),
      concurrency: 1,
      context,
      every: 1000,
      data: {},
    });

    expect(result).toBeInstanceOf(Bull);
  });
});
