import Bull, { Queue, ProcessCallbackFunction, ProcessPromiseFunction, JobInformation } from 'bull';
import { set } from 'lodash';
import { each as eachPromise } from 'bluebird';
import { logger } from '@fjedi/logger';

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
  debugMode?: boolean;
};

const { REDIS_HOST = '127.0.0.1', REDIS_PORT = 6379 } = process.env;
//
export async function createQueue<TContext>(params: QueueProps<TContext>): Promise<Queue> {
  const { name, queueOptions, concurrency = 1, processor, context, debugMode = false } = params;
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
    queue.process(concurrency, processor);
  } else {
    // @ts-ignore
    queue.process(concurrency, async (job) => processor(Object.assign(job, { context })));
  }

  //
  if (debugMode) {
    queue
      .on('error', function onQueueError(error) {
        // An error occured.
        logger.error(`"${name}" queue error`);
        logger.error(error);
      })
      .on('waiting', function onQueueWaiting(jobId) {
        // A Job is waiting to be processed as soon as a worker is idling.
        logger.info(`"${name}" queue is waiting`, jobId);
      })
      // .on('active', function (job, jobPromise) {
      //   // A job has started. You can use `jobPromise.cancel()`` to abort it.
      //   logger.info(`"${name}" job is active`, { jobId, jobPromise });
      // })
      .on('stalled', function onQueueStalled(job) {
        // A job has been marked as stalled. This is useful for debugging job
        // workers that crash or pause the event loop.
        logger.info(`"${name}" queue is stalled`, { job });
      })
      .on('progress', function onQueueJobProgress(job, progress) {
        // A job's progress was updated!
        logger.info(`"${name}" queue job in progress`, { job, progress });
      })
      .on('completed', function onQueueJobCompleted(job, result) {
        // A job successfully completed with a `result`.
        logger.info(`"${name}" queue job completed`, { job, result });
      })
      .on('failed', function onQueueJobFailed(job, err) {
        // A job failed with reason `err`!
        logger.warn(`"${name}" queue job failed`, { job });
        logger.error(err);
      })
      .on('paused', function onQueueJobPaused() {
        // The queue has been paused.
        logger.info(`"${name}" queue has been paused`);
      })
      .on('resumed', function onQueueJobResumed(job: Bull.Job) {
        // The queue has been resumed.
        logger.info(`"${name}" queue job has been resumed`, { job });
      })
      .on('cleaned', function onQueueCleaned(jobs, type) {
        // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
        // jobs, and `type` is the type of jobs cleaned.
        logger.info(`"${name}" queue has been cleaned`, { jobs, type });
      })
      .on('drained', function onQueueDrained() {
        // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
        logger.info(`"${name}" queue has processed all the waiting jobs`);
      })
      .on('removed', function onQueueJobRemoved(job) {
        logger.info(`"${name}" queue job has been removed`, { job });
      });
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
