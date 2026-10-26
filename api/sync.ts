import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

// One JSON file per page per user in S3: users/<sub>/<key>.json. The bucket has
// versioning on, so every save is kept. SYNC_KEY_PREFIX keeps local testing apart.
const KEYS = new Set(['goals', 'list'])

// Public IDs from `terraform output` in infra/. They match src/auth.ts.
const verifier = CognitoJwtVerifier.create({
  userPoolId: 'us-east-1_eEOBpyxO5',
  clientId: '173jgk211fk91kibj6fgg90jal',
  tokenUse: 'access',
})

// Vercel uses the sync user's key. Local testing has no key and falls back to AWS_PROFILE.
const s3 = new S3Client({
  region: process.env.SYNC_AWS_REGION,
  credentials: process.env.SYNC_AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.SYNC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.SYNC_AWS_SECRET_ACCESS_KEY ?? '',
      }
    : undefined,
})

const json = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

const userId = async (req: Request) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return null
  try {
    return (await verifier.verify(token)).sub
  } catch {
    return null
  }
}

const target = (req: Request, sub: string) => {
  const key = new URL(req.url).searchParams.get('key')
  const prefix = process.env.SYNC_KEY_PREFIX ?? ''
  return key && KEYS.has(key) ? { Bucket: process.env.SYNC_BUCKET, Key: `${prefix}users/${sub}/${key}.json` } : null
}

export async function GET(req: Request) {
  const sub = await userId(req)
  if (!sub) return json('{"error":"unauthorized"}', 401)
  const t = target(req, sub)
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
  const sub = await userId(req)
  if (!sub) return json('{"error":"unauthorized"}', 401)
  const t = target(req, sub)
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
