/**
 * Generate a random value within the field modulus
 * Similar to the contract's getRandomWithField function
 */
export const getRandomWithField = (): bigint => {
  // Generate a random BigInt and mod it with the field modulus
  const randomValue = BigInt(Math.ceil(Math.random() * 10 ** 96));
  const fieldModulus = BigInt(
    "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
  );
  return randomValue % fieldModulus;
};

/**
 * Generate a cryptographically secure random value within the field modulus
 */
export const getSecureRandomWithField = (): bigint => {
  // Use crypto.getRandomValues for better security in production
  const array = new Uint32Array(8); // 8 * 32 bits = 256 bits
  crypto.getRandomValues(array);

  let randomValue = 0n;
  for (let i = 0; i < array.length; i++) {
    randomValue = randomValue * BigInt(2 ** 32) + BigInt(array[i]);
  }

  const fieldModulus = BigInt(
    "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
  );
  return randomValue % fieldModulus;
};
