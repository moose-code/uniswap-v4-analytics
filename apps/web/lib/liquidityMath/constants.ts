export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const ZERO_BI = BigInt(0);
export const ONE_BI = BigInt(1);
export const Q96 = BigInt(2) ** BigInt(96);
export const MaxUint256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

// Helper function for hex conversion
export function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}
