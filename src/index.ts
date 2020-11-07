import Bull, { Queue, ProcessCallbackFunction, ProcessPromiseFunction, JobInformation } from 'bull';
import { set } from 'lodash';
import { each as eachPromise } from 'bluebird';

export type { Queue } from 'bull';

export type QueueJob<TContext> = Bull.Job & { context: TContext };

export type QueueProps<TContext> = {
  name: string;
  processor:
    | string
    | ProcessCallbackFunction<QueueJob<unknown>>
    | ProcessPromiseFunction<QueueJob<unknown>>;
  concurrency?: number;
  queueOptions?: Bull.QueueOptions;
  context?: TContext;
};

const { REDIS_HOST = '127.0.0.1', REDIS_PORT = 6379 } = process.env;
//
export async function createQueue<TContext>(params: QueueProps<TContext>): Promise<Queue> {
  const { name, queueOptions, concurrency = 1, processor, context } = params;
  //
  const o = queueOptions || {};
  set(o, 'settings', { ...{ lockDuration: 60000, maxStalledCount: 0 }, ...(o.settings || {}) });

  //
  const queue = new Bull(name, {
    redis: { port: parseInt(`${REDIS_PORT}`, 10), host: REDIS_HOST },
    ...o,
  });
  //
  if (typeof processor === 'string') {
    await queue.process(concurrency, processor);
  } else {
    // @ts-ignore
    await queue.process(concurrency, async (job) => processor(Object.assign(job, { context })));
  }

  return queue;
}

export type RepeatableJobParams<TContext> = QueueProps<TContext> & {
  jobId: string;
  every: number;
  data?: { [k: string]: unknown };
};

export async function createRepeatableJob<TContext>(
  params: RepeatableJobParams<TContext>,
): Promise<Queue> {
  const { jobId, processor, context, every, concurrency = 1, data, queueOptions } = params;
  const repeatableJobQueue = await createQueue({
    name: jobId,
    queueOptions,
    processor,
    concurrency,
    context,
  });
  //
  const oldFeeUpdaterJobs = await repeatableJobQueue.getRepeatableJobs();
  await eachPromise(oldFeeUpdaterJobs, async (job: JobInformation) => {
    await repeatableJobQueue.removeRepeatableByKey(job.key);
  });
  //
  await repeatableJobQueue.add(data, {
    jobId,
    repeat: {
      every,
    },
    removeOnComplete: true,
    removeOnFail: true,
  });

  return repeatableJobQueue;
}
