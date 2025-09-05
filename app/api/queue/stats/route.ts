import { NextResponse } from "next/server";
import { getQueueStats } from "@/lib/queue/crawler-queue";

export async function GET() {
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      { error: "Failed to get queue statistics" },
      { status: 500 }
    );
  }
}
