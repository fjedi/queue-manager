async function testQueue(job: any): Promise<unknown> {
  // const messagePrefix = '[TEST_QUEUE] ';
  // const { context, data, attemptsMade } = job;
  if (!job?.data?.id) {
    return Promise.reject(
      new Error('Invalid "data" value passed to queue-manager instance.add method'),
    );
  }

  return Promise.resolve(job.data);
}

export default testQueue;
module.exports = testQueue;
