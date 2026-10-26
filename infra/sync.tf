# Storage for /api/sync: one JSON file per page. Versioning keeps every save.
resource "aws_s3_bucket" "sync" {
  bucket = "gromulax-joelabeyta-sync"
}

resource "aws_s3_bucket_versioning" "sync" {
  bucket = aws_s3_bucket.sync.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "sync" {
  bucket = aws_s3_bucket.sync.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# The Vercel Function signs in as this user. Its access key is made by hand with
# `aws iam create-access-key`, so the secret never lands in Terraform state.
resource "aws_iam_user" "sync" {
  name = "joelabeyta-sync"
}

data "aws_iam_policy_document" "sync" {
  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.sync.arn}/*"]
  }

  # Without ListBucket, S3 returns AccessDenied instead of NoSuchKey for a missing file.
  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.sync.arn]
  }
}

resource "aws_iam_user_policy" "sync" {
  name   = "sync-bucket"
  user   = aws_iam_user.sync.name
  policy = data.aws_iam_policy_document.sync.json
}
