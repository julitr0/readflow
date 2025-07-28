import { ConversionMetadata } from "./conversion";

export interface TestConversion {
  htmlContent: string;
  metadata: ConversionMetadata;
  filename: string;
}

// Shared storage for test conversions
export const testConversions = new Map<string, TestConversion>();

export function storeTestConversion(id: string, conversion: TestConversion) {
  testConversions.set(id, conversion);
}

export function getTestConversion(id: string): TestConversion | undefined {
  return testConversions.get(id);
} 