async function testQueue(job: any) {
  const messagePrefix = '[TEST_QUEUE] ';
  // const { context, data, attemptsMade } = job;

  console.log(messagePrefix, 'starting...', job?.data);
  if (!job?.data) {
    return Promise.reject(
      new Error('Invalid "data" value passed to queue-manager instance.add method'),
    );
  }

  return Promise.resolve(job.data);
}

module.exports = testQueue;
