import crypto from 'crypto';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 chars for AES-256-CBC');
  }
  return Buffer.from(key, 'utf8');
}

export function sha256(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function aesEncrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()]);
  return { iv: iv.toString('base64'), cipherText: enc.toString('base64') };
}

export function aesDecrypt(ivBase64, cipherBase64) {
  const key = getKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const cipherBuf = Buffer.from(cipherBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const dec = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
  return dec.toString('utf8');
}

/**
 * Generate a blockchain-like hash chain for result answers
 * Creates a hash for each answer linking to the previous one
 */
export function generateAnswerHashChain(answers, prevHash = 'GENESIS') {
  const chainedAnswers = [];
  let currentPrevHash = prevHash;

  for (let i = 0; i < answers.length; i++) {
    const answer = {
      questionIndex: i,
      studentAnswerIndex: answers[i].studentAnswerIndex,
      isCorrect: answers[i].isCorrect,
      points: answers[i].points
    };

    // Create hash of answer + previous hash
    const answerString = JSON.stringify({
      ...answer,
      prevHash: currentPrevHash
    });
    const hash = sha256(answerString);

    chainedAnswers.push({
      ...answer,
      hash,
      prevHash: currentPrevHash
    });

    currentPrevHash = hash;
  }

  return {
    chainedAnswers,
    finalHash: currentPrevHash
  };
}

/**
 * Generate result hash that includes all answers and metadata
 */
export function generateResultHash(student, exam, score, percentage, answers, prevResultHash = 'GENESIS') {
  const resultData = {
    student: String(student),
    exam: String(exam),
    score,
    percentage,
    answerCount: answers.length,
    answersHash: answers.length > 0 ? sha256(JSON.stringify(answers)) : null,
    prevResultHash
  };

  return sha256(JSON.stringify(resultData));
}

/**
 * Verify result hash chain integrity
 */
export function verifyResultHashChain(result) {
  try {
    // Regenerate the result hash from stored data
    const expectedHash = generateResultHash(
      result.student,
      result.exam,
      result.score,
      result.percentage,
      result.answers,
      result.prevResultHash
    );

    return {
      valid: expectedHash === result.resultHash,
      expectedHash,
      actualHash: result.resultHash,
      message: expectedHash === result.resultHash ? 'Result integrity verified' : 'Result appears to be tampered'
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message,
      message: 'Failed to verify result integrity'
    };
  }
}

/**
 * Encrypt answer array for storage
 * Converts answers to JSON and encrypts using AES-256-CBC
 */
export function encryptAnswers(answersArray) {
  try {
    const answersJson = JSON.stringify(answersArray);
    const encrypted = aesEncrypt(answersJson);
    return encrypted; // { iv, cipherText }
  } catch (err) {
    throw new Error(`Failed to encrypt answers: ${err.message}`);
  }
}

/**
 * Decrypt answer array from storage
 * Decrypts and parses JSON back to array
 */
export function decryptAnswers(iv, cipherText) {
  try {
    const decryptedJson = aesDecrypt(iv, cipherText);
    return JSON.parse(decryptedJson);
  } catch (err) {
    throw new Error(`Failed to decrypt answers: ${err.message}`);
  }
}