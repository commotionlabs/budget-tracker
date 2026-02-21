import { NextResponse } from 'next/server';

// For static export, we need to mark this as dynamic
export const dynamic = 'force-static';

export async function GET() {
  // Return empty data for static export - the frontend will use localStorage
  return NextResponse.json({ 
    accounts: [],
    categories: [], 
    transactions: [], 
    budgets: [],
    goals: [],
    settings: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      firstDayOfWeek: 0,
      debtStrategy: 'avalanche' as const,
      autoAssignPriority: []
    }
  });
}

export async function POST(request: Request) {
  // For static export, just return success - the frontend handles storage
  return NextResponse.json({ success: true });
}
