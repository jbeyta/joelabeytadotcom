# joelabeyta.com

## AWS

* Make every AWS change in Terraform, in `infra/`. Do not change AWS resources with the AWS CLI or the console.
* Use only the `gromulax` profile. It is the personal account. Never use any other profile in `~/.aws/config`.
* Run `terraform plan` and show the result before `terraform apply`.
* State is in the `gromulax-paa-terraform-state` bucket, key `joelabeyta-com/terraform.tfstate`. The paa project uses `state/terraform.tfstate` in the same bucket. Never point this config at that key.
* Exception: the access key for the IAM user `joelabeyta-sync` is made with `aws iam create-access-key`, so its secret stays out of Terraform state. After a rotation, update `SYNC_AWS_ACCESS_KEY_ID` and `SYNC_AWS_SECRET_ACCESS_KEY` in Vercel, redeploy, then delete the old key.
