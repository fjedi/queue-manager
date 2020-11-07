import * as assert from 'assert';
import someFn from '../src';


describe('Test someFn', function () {
  it('No error expected', async function () {
    const result = someFn();

    expect(result).toBe(200);
  });
});
