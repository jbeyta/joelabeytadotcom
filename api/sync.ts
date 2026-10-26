import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { timingSafeEqual } from 'node:crypto'

// One JSON file per page in S3. The bucket has versioning on, so every save is kept.
const KEYS = new Set(['goals', 'list'])

const s3 = new S3Client({
  region: process.env.SYNC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.SYNC_AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.SYNC_AWS_SECRET_ACCESS_KEY ?? '',
  },
})

const json = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

const authorized = (req: Request) => {
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${process.env.SYNC_TOKEN}`)
  return !!process.env.SYNC_TOKEN && got.length === want.length && timingSafeEqual(got, want)
}

const target = (req: Request) => {
  const key = new URL(req.url).searchParams.get('key')
  return key && KEYS.has(key) ? { Bucket: process.env.SYNC_BUCKET, Key: `${key}.json` } : null
}

export async function GET(req: Request) {
  if (!authorized(req)) return json('{"error":"unauthorized"}', 401)
  const t = target(req)
  if (!t) return json('{"error":"bad key"}', 400)
  try {
    const obj = await s3.send(new GetObjectCommand(t))
    return json(await obj.Body!.transformToString())
  } catch (e) {
    if (e instanceof NoSuchKey) return json('null')
    throw e
  }
}

export async function PUT(req: Request) {
  if (!authorized(req)) return json('{"error":"unauthorized"}', 401)
  const t = target(req)
  if (!t) return json('{"error":"bad key"}', 400)
  const body = await req.text()
  try {
    const doc = JSON.parse(body)
    if (typeof doc?.updatedAt !== 'number' || !('data' in doc)) throw new Error()
  } catch {
    return json('{"error":"bad body"}', 400)
  }
  await s3.send(new PutObjectCommand({ ...t, Body: body, ContentType: 'application/json' }))
  return new Response(null, { status: 204 })
}
