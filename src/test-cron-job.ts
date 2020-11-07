async function testCronJob(job: any) {
  const messagePrefix = '[TEST_CRON_JOB] ';
  const { context, data } = job;

  return Promise.resolve();
}

module.exports = testCronJob;
