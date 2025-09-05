import { NextResponse } from "next/server";
import { getJobStatus } from "@/lib/queue/crawler-queue";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }
    
    const jobStatus = await getJobStatus(jobId);
    
    return NextResponse.json({
      jobId,
      ...jobStatus,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}
