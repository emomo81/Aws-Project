import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to the SageMaker real-time endpoint.
// Keeps AWS credentials OFF the client. Runs on Render as part of the Next.js server.
//
// POST /api/score  body: { features: "0.5,12.0,3,..." }  -> { fraud_probability: number }
//
// To enable, add the AWS SDK (npm i @aws-sdk/client-sagemaker-runtime) and the env vars
// in .env.example, then uncomment the block below.
export async function POST(req: NextRequest) {
  const { features } = await req.json().catch(() => ({ features: null }));
  if (!features || typeof features !== "string") {
    return NextResponse.json({ error: "Body must be { features: 'csvRow' }" }, { status: 400 });
  }

  /*
  const { SageMakerRuntimeClient, InvokeEndpointCommand } = await import("@aws-sdk/client-sagemaker-runtime");
  const client = new SageMakerRuntimeClient({ region: process.env.AWS_REGION });
  const out = await client.send(new InvokeEndpointCommand({
    EndpointName: process.env.SAGEMAKER_ENDPOINT_NAME!,
    ContentType: "text/csv",
    Body: features,
  }));
  const score = parseFloat(new TextDecoder().decode(out.Body));
  return NextResponse.json({ fraud_probability: score });
  */

  // Placeholder until the endpoint is wired — deterministic mock so the UI works in dev.
  const mock = Math.min(0.99, (features.split(",").reduce((a, x) => a + Math.abs(parseFloat(x) || 0), 0) % 100) / 100);
  return NextResponse.json({ fraud_probability: Number(mock.toFixed(2)), mocked: true });
}
