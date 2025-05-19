// data/dummyFlows.ts

import type { Flow } from '@/features/business-logic/types'

/**
 * Dummy list of Flows for local development or Storybook
 */
export const dummyFlows: Flow[] = [
  {
    id: '8ousg11psvmsVgjBGXiSj',
    name: 'Test Flow',
    private: true,
  },
  {
    id: 'a1b2c3d4e5f6g7h8i9j0',
    name: 'Marketing Automation',
    private: false,
  },
  {
    id: 'f6e5d4c3b2a1h8g7i9j0',
    name: 'User Onboarding',
    private: true,
  },
  {
    id: 'z9y8x7w6v5u4t3s2r1q0',
    name: 'Email Campaign',
    private: false,
  },
  {
    id: 'm1n2b3v4c5x6z7l8k9j0',
    name: 'Data Sync Service',
    private: false,
  },
  {
    id: 'p0o9i8u7y6t5r4e3w2q1',
    name: 'Weekly Reports',
    private: true,
  },
]
