import fs from 'fs';

const defaultPath = 'output.html';
/**
 * Retry an asynchronous task with specified attempts and delay.
 * @param {Function} task - The asynchronous task to execute.
 * @param {number} attempts - Maximum number of retry attempts.
 * @param {number} delayMs - Delay in milliseconds between attempts.
 * @returns {Promise<any>} - Resolves with the task result or rejects after all attempts fail.
 */
export async function retry(task, attempts = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await task();
      return result; // Task succeeded
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < attempts) {
        console.log(`Retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  throw new Error(`Task failed after ${attempts} attempts: ${lastError.message}`);
}

/**
 * Utility function to delay execution.
 * @param {number} ms - Delay time in milliseconds.
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRandomDelay(max = 1000, min = 500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function saveHtmlToFile(html, filePath = defaultPath) {
  try {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`HTML saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving HTML to file:', error);
  }
}