import Bull from 'bull';
import { resolve as resolvePath } from 'path';
import { createQueue, createRepeatableJob, Queue } from '../src';

const context = {};
const TEST_QUEUE_ERROR_MSG = 'Invalid "data" value passed to queue-manager instance.add method';
const VALID_TEST_QUEUE_DATA = { id: 'some-test-id', value: 'some-test-value' };
const INVALID_TEST_QUEUE_DATA = { id: null };

describe('Test queue-manager', function () {
  let queue: Queue | null = null;
  let cronJob: Queue | null = null;

  afterAll(async () => {
    await queue?.close();
    await cronJob?.close();
  });

  it('Should create instance of Queue manager', async function () {
    queue = await createQueue({
      name: 'testQueue',
      queueOptions: {},
      // eslint-disable-next-line import/no-dynamic-require, global-require
      processor: require(resolvePath(__dirname, '../src/test-queue')),
      concurrency: 10,
      context,
    });
    expect(queue).toBeInstanceOf(Bull);
  });

  it('Should add one job to the queue', async function () {
    const job = await queue?.add(VALID_TEST_QUEUE_DATA, {
      removeOnFail: true,
      removeOnComplete: true,
    });

    expect(job?.queue).toBeInstanceOf(Bull);
    expect(job?.data).toMatchObject(VALID_TEST_QUEUE_DATA);
  });

  it('Should FAIL to run queue-job of Queue manager', async function () {
    const job = await queue?.add(INVALID_TEST_QUEUE_DATA, {
      removeOnFail: true,
      removeOnComplete: true,
    });
    expect(job?.queue).toBeInstanceOf(Bull);

    // expect(async () => await job?.finished()).rejects.toEqual(new Error(TEST_QUEUE_ERROR_MSG));
  });

  it('Should create instance of repeatable/cron-job manager', async function () {
    cronJob = await createRepeatableJob({
      jobId: 'testCronJob',
      name: 'testCronJob',
      queueOptions: {},
      // eslint-disable-next-line import/no-dynamic-require, global-require
      processor: require(resolvePath(__dirname, '../src/test-cron-job')),
      concurrency: 1,
      context,
      repeat: {
        every: 1000,
      },
      data: {},
    });

    expect(cronJob).toBeInstanceOf(Bull);
  });
});
